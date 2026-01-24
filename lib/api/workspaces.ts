"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";

// ============================================
// Types (matching backend schemas)
// ============================================

export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer';

export interface WorkspaceResponse {
  id: string;
  name: string;
  slug: string;
  organization_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceWithRole extends WorkspaceResponse {
  role: WorkspaceRole;
}

export interface WorkspaceListResponse {
  workspaces: WorkspaceWithRole[];
  total: number;
}

export interface WorkspaceDetail extends WorkspaceResponse {
  member_count: number;
  account_count: number;
}

// Backend CommonResponse wrapper
interface CommonResponse<T> {
  success: boolean;
  result: T | null;
  errors?: { code?: number; message?: string }[] | null;
  messages?: { code?: number; message?: string }[] | null;
}

export interface CreateWorkspaceInput {
  name: string;
  slug?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  slug?: string;
}

export interface MoveWorkspaceToOrgInput {
  organization_id: string | null;
}

// ============================================
// API Functions
// ============================================

/**
 * List all workspaces the current user is a member of
 */
export async function listWorkspaces(): Promise<WorkspaceWithRole[]> {
  const response = await fetchFromBackendAPI<CommonResponse<WorkspaceListResponse>>('/api/v1/workspaces');
  return response?.result?.workspaces || [];
}

/**
 * Create a new workspace
 * The current user becomes the owner automatically
 */
export async function createWorkspace(data: CreateWorkspaceInput): Promise<WorkspaceWithRole> {
  const response = await fetchFromBackendAPI<CommonResponse<WorkspaceResponse>>('/api/v1/workspaces', {
    method: 'POST',
    body: data,
  });
  // Extract result from CommonResponse wrapper
  if (!response?.result) {
    throw new Error('Failed to create workspace - no result in response');
  }
  // The backend returns WorkspaceResponse, but we need WorkspaceWithRole
  // Since the creator is always the owner, we can add the role
  return {
    ...response.result,
    role: 'owner' as WorkspaceRole,
  };
}

/**
 * Get workspace details by ID
 */
export async function getWorkspace(workspaceId: string): Promise<WorkspaceDetail | null> {
  return fetchFromBackendAPI<WorkspaceDetail>(`/api/v1/workspaces/${workspaceId}`);
}

/**
 * Update workspace name or slug
 * Requires admin or owner role
 */
export async function updateWorkspace(
  workspaceId: string,
  data: UpdateWorkspaceInput
): Promise<WorkspaceResponse> {
  return fetchFromBackendAPI<WorkspaceResponse>(`/api/v1/workspaces/${workspaceId}`, {
    method: 'PUT',
    body: data,
  });
}

/**
 * Delete a workspace
 * Requires owner role
 */
export async function deleteWorkspace(workspaceId: string): Promise<void> {
  await fetchFromBackendAPI<void>(`/api/v1/workspaces/${workspaceId}`, {
    method: 'DELETE',
  });
}

/**
 * Move workspace to an organization or remove from organization
 * Requires workspace owner permission AND org admin permission (if moving to org)
 */
export async function moveWorkspaceToOrganization(
  workspaceId: string,
  organizationId: string | null
): Promise<WorkspaceResponse> {
  return fetchFromBackendAPI<WorkspaceResponse>(`/api/v1/workspaces/${workspaceId}/organization`, {
    method: 'PUT',
    body: { organization_id: organizationId },
  });
}
