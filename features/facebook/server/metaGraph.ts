import crypto from "crypto";

const FB_APP_ID = process.env.FACEBOOK_APP_ID!;
const FB_APP_SECRET = process.env.FACEBOOK_APP_SECRET!;
const FB_API_VERSION = process.env.NEXT_PUBLIC_FACEBOOK_API_VERSION || "v24.0";

const GRAPH_API_BASE = `https://graph.facebook.com/${FB_API_VERSION}`;

/**
 * Generate appsecret_proof for secure Graph API calls
 */
export function generateAppSecretProof(accessToken: string): string {
  return crypto
    .createHmac("sha256", FB_APP_SECRET)
    .update(accessToken)
    .digest("hex");
}

/**
 * Make a secure Graph API request with appsecret_proof
 */
async function graphFetch<T>(
  endpoint: string,
  accessToken: string,
  params: Record<string, string> = {}
): Promise<T> {
  const url = new URL(`${GRAPH_API_BASE}${endpoint}`);

  // Add standard params
  url.searchParams.set("access_token", accessToken);
  url.searchParams.set("appsecret_proof", generateAppSecretProof(accessToken));

  // Add additional params
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    console.error("Graph API error:", error);
    throw new Error(error?.error?.message || `Graph API error: ${response.status}`);
  }

  return response.json();
}

export interface FacebookAdAccount {
  id: string; // Format: act_XXXXXXXXX
  account_id: string; // Numeric account ID
  name: string;
  account_status: number;
  currency: string;
  timezone_name: string;
  business_name?: string;
}

interface AdAccountsResponse {
  data: Array<{
    id: string;
    account_id: string;
    name: string;
    account_status: number;
    currency: string;
    timezone_name: string;
    business?: { name: string };
  }>;
  paging?: {
    cursors: { after?: string; before?: string };
    next?: string;
  };
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<{ access_token: string; token_type: string }> {
  const tokenUrl = new URL(`${GRAPH_API_BASE}/oauth/access_token`);
  tokenUrl.searchParams.set("client_id", FB_APP_ID);
  tokenUrl.searchParams.set("client_secret", FB_APP_SECRET);
  tokenUrl.searchParams.set("code", code);
  tokenUrl.searchParams.set("redirect_uri", redirectUri);

  const response = await fetch(tokenUrl.toString());

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error?.error?.message || "Failed to exchange code for token");
  }

  return response.json();
}

/**
 * Get client business ID from the access token
 */
export async function getClientBusinessId(
  accessToken: string
): Promise<{ id: string; name?: string; client_business_id?: string }> {
  return graphFetch<{ id: string; name?: string; client_business_id?: string }>(
    "/me",
    accessToken,
    { fields: "id,name,client_business_id" }
  );
}

/**
 * List ad accounts owned by the client business
 */
export async function listOwnedAdAccounts(
  clientBusinessId: string,
  accessToken: string
): Promise<FacebookAdAccount[]> {
  const fields = "id,account_id,name,account_status,currency,timezone_name,business{name}";

  try {
    const response = await graphFetch<AdAccountsResponse>(
      `/${clientBusinessId}/owned_ad_accounts`,
      accessToken,
      { fields, limit: "100" }
    );

    return (response.data || []).map((acc) => ({
      id: acc.id,
      account_id: acc.account_id,
      name: acc.name,
      account_status: acc.account_status,
      currency: acc.currency,
      timezone_name: acc.timezone_name,
      business_name: acc.business?.name,
    }));
  } catch {
    // Business may not have owned ad accounts
    return [];
  }
}

/**
 * List ad accounts the client business has access to
 */
export async function listClientAdAccounts(
  clientBusinessId: string,
  accessToken: string
): Promise<FacebookAdAccount[]> {
  const fields = "id,account_id,name,account_status,currency,timezone_name,business{name}";

  try {
    const response = await graphFetch<AdAccountsResponse>(
      `/${clientBusinessId}/client_ad_accounts`,
      accessToken,
      { fields, limit: "100" }
    );

    return (response.data || []).map((acc) => ({
      id: acc.id,
      account_id: acc.account_id,
      name: acc.name,
      account_status: acc.account_status,
      currency: acc.currency,
      timezone_name: acc.timezone_name,
      business_name: acc.business?.name,
    }));
  } catch {
    // Business may not have client ad accounts
    return [];
  }
}

/**
 * List all ad accounts accessible by the user (when no client_business_id)
 */
export async function listUserAdAccounts(
  accessToken: string
): Promise<FacebookAdAccount[]> {
  const fields = "id,account_id,name,account_status,currency,timezone_name,business{name}";

  try {
    const response = await graphFetch<AdAccountsResponse>(
      "/me/adaccounts",
      accessToken,
      { fields, limit: "100" }
    );

    return (response.data || []).map((acc) => ({
      id: acc.id,
      account_id: acc.account_id,
      name: acc.name,
      account_status: acc.account_status,
      currency: acc.currency,
      timezone_name: acc.timezone_name,
      business_name: acc.business?.name,
    }));
  } catch (error) {
    console.error("Failed to list user ad accounts:", error);
    return [];
  }
}
