import { jwtVerify } from "jose";
import { NextRequest } from "next/server";

// BroadcastChannel name - must match the modal component
const CLABS_AUTH_CHANNEL = "clabs_auth";

// JWT payload structure from CustomerLabs
interface CustomerLabsJWTPayload {
  app_id: string;
  account_id: number;
  account_name: string;
  user_id: number;
  user_email: string;
  timezone?: string;
  region?: string;
  iat: number;
  exp: number;
}

// HTML that sends data via BroadcastChannel and closes the tab
function generateCallbackHtml(
  type: "AUTH_SUCCESS" | "AUTH_ERROR",
  payload: object
): string {
  const message = JSON.stringify({ type, payload });
  return `<!DOCTYPE html>
<html><head><title>Processing...</title></head>
<body>
<script>
(function(){
  const channel = new BroadcastChannel('${CLABS_AUTH_CHANNEL}');
  channel.postMessage(${message});
  channel.close();
  window.close();
})();
</script>
</body></html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle user cancellation
  if (error === "access_denied") {
    return new Response(
      generateCallbackHtml("AUTH_ERROR", { error: "Authorization was cancelled." }),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Handle other errors from CustomerLabs
  if (error) {
    return new Response(
      generateCallbackHtml("AUTH_ERROR", { error: `Authorization failed: ${error}` }),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Validate code
  if (!code) {
    return new Response(
      generateCallbackHtml("AUTH_ERROR", { error: "Missing authorization code." }),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  // Verify JWT
  const secret = process.env.CLABS_API_SECRET;
  if (!secret) {
    console.error("CLABS_API_SECRET environment variable is not set");
    return new Response(
      generateCallbackHtml("AUTH_ERROR", { error: "Server configuration error." }),
      { headers: { "Content-Type": "text/html" } }
    );
  }

  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(code, secretKey);

    const customerLabsPayload = payload as unknown as CustomerLabsJWTPayload;

    // Validate required fields
    if (!customerLabsPayload.app_id || !customerLabsPayload.account_id) {
      throw new Error("Invalid token payload");
    }

    // Set success state with account data
    return new Response(
      generateCallbackHtml("AUTH_SUCCESS", {
        accountData: {
          app_id: customerLabsPayload.app_id,
          account_id: customerLabsPayload.account_id,
          account_name: customerLabsPayload.account_name,
          user_id: customerLabsPayload.user_id,
          user_email: customerLabsPayload.user_email,
          timezone: customerLabsPayload.timezone,
          region: customerLabsPayload.region,
        },
      }),
      { headers: { "Content-Type": "text/html" } }
    );
  } catch (err) {
    console.error("JWT verification failed:", err);
    const errorMessage =
      err instanceof Error && err.message.includes("expired")
        ? "Authorization expired. Please try again."
        : "Invalid authorization token.";
    return new Response(
      generateCallbackHtml("AUTH_ERROR", { error: errorMessage }),
      { headers: { "Content-Type": "text/html" } }
    );
  }
}
