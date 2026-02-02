"use server";

import { cookies } from "next/headers";
import crypto from "crypto";
import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";
import {
  listOwnedAdAccounts,
  listClientAdAccounts,
  listUserAdAccounts,
  type FacebookAdAccount,
} from "./metaGraph";

const TOKEN_COOKIE_NAME = "fb_token_enc";
const SESSION_SECRET = process.env.SESSION_SECRET!;

interface TokenPayload {
  access_token: string;
  client_business_id: string | null;
  user_id: string;
  user_name: string;
}

interface CommonResponse<T> {
  success: boolean;
  result: T | null;
  errors?: { code?: number; message?: string }[] | null;
}

export interface AccountResponse {
  id: string;
  workspace_id: string;
  account_id: string;
  unique_name: string;
  template_id: string;
  account_type: "ads" | "customerlabs";
  status: string;
  auth_data: Record<string, unknown>;
  config_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

/**
 * Decrypt data using AES-256-GCM
 */
function decrypt(encrypted: string): string {
  const data = Buffer.from(encrypted, "base64url");
  const iv = data.subarray(0, 16);
  const authTag = data.subarray(16, 32);
  const content = data.subarray(32);
  const key = crypto.scryptSync(SESSION_SECRET, "salt", 32);
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(content).toString("utf8") + decipher.final("utf8");
}

/**
 * Get the stored Facebook token from the encrypted httpOnly cookie
 */
async function getTokenPayload(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const encryptedToken = cookieStore.get(TOKEN_COOKIE_NAME)?.value;

  if (!encryptedToken) {
    return null;
  }

  try {
    const decrypted = decrypt(encryptedToken);
    return JSON.parse(decrypted) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Clear the Facebook token cookie
 */
export async function clearFacebookToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

/**
 * List all Facebook Ad Accounts the user has access to
 */
export async function listFacebookAdAccounts(): Promise<{
  accounts: FacebookAdAccount[];
}> {
  const tokenPayload = await getTokenPayload();

  if (!tokenPayload) {
    throw new Error("Facebook session expired. Please authorize again.");
  }

  const { access_token, client_business_id } = tokenPayload;

  let accounts: FacebookAdAccount[] = [];

  if (client_business_id) {
    // For Business Integration System User tokens, fetch from business endpoints
    const [owned, client] = await Promise.all([
      listOwnedAdAccounts(client_business_id, access_token),
      listClientAdAccounts(client_business_id, access_token),
    ]);

    // Combine and dedupe by id
    const accountMap = new Map<string, FacebookAdAccount>();
    for (const acc of [...owned, ...client]) {
      accountMap.set(acc.id, acc);
    }
    accounts = Array.from(accountMap.values());
  } else {
    // Fallback to user ad accounts
    accounts = await listUserAdAccounts(access_token);
  }

  // Filter to only active accounts (status 1 = ACTIVE)
  accounts = accounts.filter((acc) => acc.account_status === 1);

  return { accounts };
}

/**
 * Create a Facebook Ads account in the backend
 */
export async function createFacebookAdsAccount(params: {
  workspaceId: string;
  templateId: string;
  adAccount: FacebookAdAccount;
}): Promise<AccountResponse> {
  const tokenPayload = await getTokenPayload();

  if (!tokenPayload) {
    throw new Error("Facebook session expired. Please authorize again.");
  }

  const { access_token, client_business_id, user_id, user_name } = tokenPayload;
  const { workspaceId, templateId, adAccount } = params;

  const input = {
    workspace_id: workspaceId,
    account_id: adAccount.id, // act_XXXXXXXXX format
    unique_name: adAccount.name,
    template_id: templateId,
    account_type: "ads" as const,
    status: "draft" as const,
    auth_data: {
      provider: "facebook",
      access_token,
      client_business_id,
      fb_user_id: user_id,
      fb_user_name: user_name,
      ad_account_id: adAccount.account_id,
    },
    config_data: {
      currency: adAccount.currency,
      timezone: adAccount.timezone_name,
      business_name: adAccount.business_name,
    },
  };

  const response = await fetchFromBackendAPI<CommonResponse<AccountResponse>>(
    `/api/v1/accounts`,
    {
      method: "POST",
      body: input,
    }
  );

  if (!response?.result) {
    throw new Error("Failed to create account - no result in response");
  }

  // Clear the encrypted token cookie after successful account creation
  await clearFacebookToken();

  return response.result;
}
