"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";
import type { WorkspaceRole } from "./workspaces";

// ============================================
// Types (matching backend schemas)
// ============================================

export interface WorkspaceMemberResponse {
  id: string;
  workspace_id: string;
  user_id: string;
  user_name: string | null;
  user_email: string;
  role: WorkspaceRole;
  created_at: string;
}

export interface MemberListResponse {
  members: WorkspaceMemberResponse[];
  total: number;
}

export interface AddMemberInput {
  user_id?: string;
  email?: string;
  role?: WorkspaceRole;
}

export interface UpdateMemberRoleInput {
  role: WorkspaceRole;
}

// ============================================
// API Functions
// ============================================

/**
 * List all members of a workspace
 */
export async function listWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberResponse[]> {
  const response = await fetchFromBackendAPI<WorkspaceMemberResponse[]>(
    `/api/v1/workspaces/${workspaceId}/members`
  );
  return response || [];
}

/**
 * Add a member to a workspace
 * Requires admin or owner role
 * Can add by user_id or email
 */
export async function addWorkspaceMember(
  workspaceId: string,
  data: AddMemberInput
): Promise<WorkspaceMemberResponse> {
  return fetchFromBackendAPI<WorkspaceMemberResponse>(
    `/api/v1/workspaces/${workspaceId}/members`,
    {
      method: 'POST',
      body: data,
    }
  );
}

/**
 * Update a member's role in a workspace
 * Requires admin or owner role
 * Cannot demote the last owner
 */
export async function updateWorkspaceMemberRole(
  workspaceId: string,
  userId: string,
  role: WorkspaceRole
): Promise<WorkspaceMemberResponse> {
  return fetchFromBackendAPI<WorkspaceMemberResponse>(
    `/api/v1/workspaces/${workspaceId}/members/${userId}`,
    {
      method: 'PUT',
      body: { role },
    }
  );
}

/**
 * Remove a member from a workspace
 * Requires admin or owner role
 * Cannot remove the last owner
 */
export async function removeWorkspaceMember(
  workspaceId: string,
  userId: string
): Promise<void> {
  await fetchFromBackendAPI<void>(
    `/api/v1/workspaces/${workspaceId}/members/${userId}`,
    {
      method: 'DELETE',
    }
  );
}
