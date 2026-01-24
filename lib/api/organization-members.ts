"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";
import type { OrganizationRole } from "./organizations";

// ============================================
// Types (matching backend schemas)
// ============================================

export interface OrganizationMemberResponse {
  id: string;
  organization_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  role: OrganizationRole;
  created_at: string;
}

export interface OrgMemberListResponse {
  members: OrganizationMemberResponse[];
  total: number;
}

export interface AddOrgMemberInput {
  user_id?: string;
  email?: string;
  role?: OrganizationRole;
}

export interface UpdateOrgMemberRoleInput {
  role: OrganizationRole;
}

// ============================================
// API Functions
// ============================================

/**
 * List all members of an organization
 */
export async function listOrganizationMembers(
  orgId: string
): Promise<OrganizationMemberResponse[]> {
  const response = await fetchFromBackendAPI<OrganizationMemberResponse[]>(
    `/api/v1/organizations/${orgId}/members`
  );
  return response || [];
}

/**
 * Add a member to an organization
 * Requires admin or owner role
 * Can add by user_id or email
 */
export async function addOrganizationMember(
  orgId: string,
  data: AddOrgMemberInput
): Promise<OrganizationMemberResponse> {
  return fetchFromBackendAPI<OrganizationMemberResponse>(
    `/api/v1/organizations/${orgId}/members`,
    {
      method: 'POST',
      body: data,
    }
  );
}

/**
 * Update a member's role in an organization
 * Requires admin or owner role
 * Cannot demote the last owner
 */
export async function updateOrganizationMemberRole(
  orgId: string,
  userId: string,
  role: OrganizationRole
): Promise<OrganizationMemberResponse> {
  return fetchFromBackendAPI<OrganizationMemberResponse>(
    `/api/v1/organizations/${orgId}/members/${userId}`,
    {
      method: 'PUT',
      body: { role },
    }
  );
}

/**
 * Remove a member from an organization
 * Requires admin or owner role
 * Cannot remove the last owner
 */
export async function removeOrganizationMember(
  orgId: string,
  userId: string
): Promise<void> {
  await fetchFromBackendAPI<void>(
    `/api/v1/organizations/${orgId}/members/${userId}`,
    {
      method: 'DELETE',
    }
  );
}
