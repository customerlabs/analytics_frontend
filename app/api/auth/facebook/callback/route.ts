import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";

// Facebook OAuth configuration
const FB_APP_ID = process.env.FACEBOOK_APP_ID!;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FB_API_VERSION = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v24.0";
const SESSION_SECRET = process.env.SESSION_SECRET!;

// Cookie settings
const TOKEN_COOKIE_NAME = "fb_token_enc";
const TOKEN_COOKIE_MAX_AGE = 600; // 10 minutes

/**
 * Encrypt data using AES-256-GCM
 */
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(SESSION_SECRET, "salt", 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([
    cipher.update(text, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return Buffer.concat([iv, authTag, encrypted]).toString("base64url");
}

/**
 * Generate appsecret_proof for secure Graph API calls
 */
function generateAppSecretProof(accessToken: string): string {
  return crypto
    .createHmac("sha256", FB_APP_SECRET)
    .update(accessToken)
    .digest("hex");
}

/**
 * Generate callback HTML that posts to parent window and closes
 */
function generateCallbackHtml(
  type: "AUTH_SUCCESS" | "AUTH_ERROR",
  error?: string
): string {
  const message = JSON.stringify({
    type,
    payload: { error },
  });

  return `<!DOCTYPE html>
<html><head><title>Processing...</title></head>
<body>
<script>
(function(){
  if (window.opener) {
    window.opener.postMessage(${message}, '*');
  } else {
    var channel = new BroadcastChannel('fb_auth');
    channel.postMessage(${message});
    channel.close();
  }
  setTimeout(function() { window.close(); }, 300);
})();
</script>
</body></html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");

  // Handle user cancellation or Facebook errors
  if (error) {
    return new Response(
      generateCallbackHtml("AUTH_ERROR", errorDescription || `Authorization failed: ${error}`),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Validate code
  if (!code) {
    return new Response(
      generateCallbackHtml("AUTH_ERROR", "Missing authorization code."),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const redirectUri = `https://beta.customerlabs.co/integrations/fb-su-cb-dummy/`;

    // 1. Exchange code for short-lived token
    const tokenUrl = new URL(
      `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`
    );
    tokenUrl.searchParams.set("client_id", FB_APP_ID);
    tokenUrl.searchParams.set("client_secret", FB_APP_SECRET);
    tokenUrl.searchParams.set("code", code);
    tokenUrl.searchParams.set("redirect_uri", redirectUri);

    const tokenRes = await fetch(tokenUrl.toString());

    if (!tokenRes.ok) {
      return new Response(
        generateCallbackHtml("AUTH_ERROR", "Failed to exchange authorization code."),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const tokenData = await tokenRes.json();
    const shortLivedToken = tokenData.access_token;

    if (!shortLivedToken) {
      return new Response(
        generateCallbackHtml("AUTH_ERROR", "No access token received."),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // 2. Exchange for long-lived token (60 days)
    const longLivedUrl = new URL(
      `https://graph.facebook.com/${FB_API_VERSION}/oauth/access_token`
    );
    longLivedUrl.searchParams.set("grant_type", "fb_exchange_token");
    longLivedUrl.searchParams.set("client_id", FB_APP_ID);
    longLivedUrl.searchParams.set("client_secret", FB_APP_SECRET);
    longLivedUrl.searchParams.set("fb_exchange_token", shortLivedToken);

    const longLivedRes = await fetch(longLivedUrl.toString());

    if (!longLivedRes.ok) {
      return new Response(
        generateCallbackHtml("AUTH_ERROR", "Failed to get long-lived token."),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    const longLivedData = await longLivedRes.json();
    const longLivedToken = longLivedData.access_token;

    if (!longLivedToken) {
      return new Response(
        generateCallbackHtml("AUTH_ERROR", "No long-lived token received."),
        { headers: { "Content-Type": "text/html" } }
      );
    }

    // 3. Fetch user info (for Business Integration System User tokens)
    const appSecretProof = generateAppSecretProof(longLivedToken);
    const meUrl = new URL(`https://graph.facebook.com/${FB_API_VERSION}/me`);
    meUrl.searchParams.set("fields", "id,name,client_business_id");
    meUrl.searchParams.set("access_token", longLivedToken);
    meUrl.searchParams.set("appsecret_proof", appSecretProof);

    const meRes = await fetch(meUrl.toString());
    const meData = await meRes.json();

    // 4. Encrypt and store token in httpOnly cookie
    const tokenPayload = JSON.stringify({
      access_token: longLivedToken,
      client_business_id: meData.client_business_id || null,
      user_id: meData.id,
      user_name: meData.name,
    });

    const encryptedToken = encrypt(tokenPayload);

    const cookieStore = await cookies();
    cookieStore.set(TOKEN_COOKIE_NAME, encryptedToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_COOKIE_MAX_AGE,
      path: "/",
    });

    // Success
    return new Response(generateCallbackHtml("AUTH_SUCCESS"), {
      headers: { "Content-Type": "text/html" },
    });
  } catch {
    return new Response(
      generateCallbackHtml("AUTH_ERROR", "An unexpected error occurred."),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
