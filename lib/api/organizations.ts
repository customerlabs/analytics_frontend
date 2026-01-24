"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";

// ============================================
// Types (matching backend schemas)
// ============================================

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface OrganizationResponse {
  id: string;
  name: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationWithRole extends OrganizationResponse {
  role: OrganizationRole;
}

export interface OrganizationListResponse {
  organizations: OrganizationWithRole[];
  total: number;
}

export interface OrganizationDetail extends OrganizationResponse {
  member_count: number;
  workspace_count: number;
}

export interface CreateOrganizationInput {
  name: string;
}

export interface UpdateOrganizationInput {
  name?: string;
}

// ============================================
// API Functions
// ============================================

/**
 * List all organizations the current user is a member of
 */
export async function listOrganizations(): Promise<OrganizationWithRole[]> {
  const response = await fetchFromBackendAPI<OrganizationWithRole[]>('/api/v1/organizations');
  return response || [];
}

/**
 * Create a new organization
 * The current user becomes the owner automatically
 */
export async function createOrganization(data: CreateOrganizationInput): Promise<OrganizationWithRole> {
  return fetchFromBackendAPI<OrganizationWithRole>('/api/v1/organizations', {
    method: 'POST',
    body: data,
  });
}

/**
 * Get organization details by ID
 */
export async function getOrganization(orgId: string): Promise<OrganizationDetail | null> {
  return fetchFromBackendAPI<OrganizationDetail>(`/api/v1/organizations/${orgId}`);
}

/**
 * Update organization name
 * Requires admin or owner role
 */
export async function updateOrganization(
  orgId: string,
  data: UpdateOrganizationInput
): Promise<OrganizationResponse> {
  return fetchFromBackendAPI<OrganizationResponse>(`/api/v1/organizations/${orgId}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Delete an organization
 * Requires owner role
 * Will fail if organization has workspaces (must move/delete them first)
 */
export async function deleteOrganization(orgId: string): Promise<void> {
  await fetchFromBackendAPI<void>(`/api/v1/organizations/${orgId}`, {
    method: 'DELETE',
  });
}
