"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";
import type { AccountTemplate, AccountTemplateListResponse } from "../types";

// Backend CommonResponse wrapper
interface CommonResponse<T> {
  success: boolean;
  result: T | null;
  errors?: { code?: number; message?: string }[] | null;
}

/**
 * Fetch all active account templates with connection status for a workspace
 * @param workspaceId - Required workspace ID to check connection status
 */
export async function listAccountTemplates(
  workspaceId: string
): Promise<AccountTemplate[]> {
  const response = await fetchFromBackendAPI<
    CommonResponse<AccountTemplateListResponse>
  >(`/api/v1/accounts/templates?workspace_id=${encodeURIComponent(workspaceId)}`);

  return response?.result?.templates || [];
}

/**
 * Fetch account template by ID
 */
export async function getAccountTemplate(
  id: string
): Promise<AccountTemplate | null> {
  const response = await fetchFromBackendAPI<CommonResponse<AccountTemplate>>(
    `/api/v1/accounts/${id}`
  );

  return response?.result || null;
}

/**
 * Fetch account template by slug
 */
export async function getAccountTemplateBySlug(
  slug: string,
  workspaceId: string
): Promise<AccountTemplate | null> {
  const response = await fetchFromBackendAPI<CommonResponse<AccountTemplate>>(
    `/api/v1/accounts/templates/slug/${slug}?workspace_id=${encodeURIComponent(workspaceId)}`
  );

  return response?.result || null;
}

/**
 * Fetch account templates by category with connection status
 * @param workspaceId - Required workspace ID to check connection status
 * @param category - Filter by account type category
 */
export async function listAccountTemplatesByCategory(
  workspaceId: string,
  category: string
): Promise<AccountTemplate[]> {
  const params = new URLSearchParams({
    workspace_id: workspaceId,
    category: category,
  });

  const response = await fetchFromBackendAPI<
    CommonResponse<AccountTemplateListResponse>
  >(`/api/v1/accounts/templates?${params.toString()}`);

  return response?.result?.templates || [];
}
