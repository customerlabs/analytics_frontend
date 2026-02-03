"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";

// ============================================
// Types
// ============================================

export type AccountType = "customerlabs" | "ads";
export type AccountStatus =
  | "active"
  | "draft"
  | "deleted"
  | "archived"
  | "deactivated"
  | "pending"
  | "error";

export interface CustomerLabsAccountData {
  app_id: string;
  account_id: number;
  account_name: string;
  user_id: number;
  user_email: string;
  timezone?: string;
  region?: string;
}

export interface AccountTemplateMinimal {
  id: string;
  name: string;
  platform: string;
  assets: { icon?: string; color?: string };
}

export interface CreateAccountInput {
  workspace_id: string;
  account_id: string;
  unique_name: string;
  template_id: string;
  account_type: AccountType;
  status?: AccountStatus;
  auth_data?: Record<string, unknown>;
  config_data?: Record<string, unknown>;
}

export interface AccountResponse {
  id: string;
  workspace_id: string;
  account_id: string;
  unique_name: string;
  template_id: string;
  account_type: AccountType;
  status: AccountStatus;
  auth_data: Record<string, unknown>;
  config_data: Record<string, unknown>;
  template?: AccountTemplateMinimal;
  created_at: string;
  updated_at: string;
}

// Backend CommonResponse wrapper
interface CommonResponse<T> {
  success: boolean;
  result: T | null;
  errors?: { code?: number; message?: string }[] | null;
  messages?: { code?: number; message?: string }[] | null;
}

// ============================================
// API Functions
// ============================================

/**
 * Create a CustomerLabs account linked to a workspace
 * @param workspaceId - The workspace to link the account to
 * @param accountData - Account data from CustomerLabs authorization
 * @param templateId - The account template ID
 * @returns Created account with ID
 */
export async function createCustomerLabsAccount(
  workspaceId: string,
  accountData: CustomerLabsAccountData,
  templateId: string
): Promise<AccountResponse> {
  const input: CreateAccountInput = {
    workspace_id: workspaceId,
    account_id: String(accountData.account_id),
    unique_name: accountData.account_name,
    template_id: templateId,
    account_type: "customerlabs",
    status: "pending",
    auth_data: {
      app_id: accountData.app_id,
      user_id: accountData.user_id,
      user_email: accountData.user_email,
    },
    config_data: {
      timezone: accountData.timezone,
      region: accountData.region,
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

  return response.result;
}

/**
 * Get accounts for a workspace
 * @param workspaceId - The workspace ID
 * @returns List of accounts
 */
export async function getWorkspaceAccounts(
  workspaceId: string
): Promise<AccountResponse[]> {
  const response = await fetchFromBackendAPI<
    CommonResponse<{ accounts: AccountResponse[] }>
  >(`/api/v1/accounts?workspace_id=${workspaceId}`);

  return response?.result?.accounts || [];
}

/**
 * Get a specific account by ID
 * @param accountId - The account ID
 * @returns Account details or null if not found
 */
export async function getAccount(
  accountId: string
): Promise<AccountResponse | null> {
  const response = await fetchFromBackendAPI<CommonResponse<AccountResponse>>(
    `/api/v1/accounts/${accountId}`
  );

  return response?.result || null;
}

/**
 * Update account status
 * @param accountId - The account ID
 * @param status - New status
 * @returns Updated account
 */
export async function updateAccountStatus(
  accountId: string,
  status: AccountStatus
): Promise<AccountResponse> {
  const response = await fetchFromBackendAPI<CommonResponse<AccountResponse>>(
    `/api/v1/accounts/${accountId}`,
    {
      method: "PUT",
      body: { status },
    }
  );

  if (!response?.result) {
    throw new Error("Failed to update account - no result in response");
  }

  return response.result;
}

/**
 * Delete an account
 * @param accountId - The account ID
 */
export async function deleteAccount(accountId: string): Promise<void> {
  await fetchFromBackendAPI<void>(`/api/v1/accounts/${accountId}`, {
    method: "DELETE",
  });
}
