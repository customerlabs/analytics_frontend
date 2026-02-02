'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import { routes } from '@/lib/routes';
import {
  createWorkspace as createWorkspaceAPI,
  updateWorkspace as updateWorkspaceAPI,
  deleteWorkspace as deleteWorkspaceAPI,
  listWorkspaces as listWorkspacesAPI,
  getWorkspace as getWorkspaceAPI,
  moveWorkspaceToOrganization as moveWorkspaceToOrgAPI,
  type WorkspaceWithRole,
  type WorkspaceDetail,
  type CreateWorkspaceInput,
  type UpdateWorkspaceInput,
} from '@/lib/api/workspaces';
import {
  addWorkspaceMember as addMemberAPI,
  updateWorkspaceMemberRole as updateMemberRoleAPI,
  removeWorkspaceMember as removeMemberAPI,
  listWorkspaceMembers as listMembersAPI,
  type WorkspaceMemberResponse,
  type AddMemberInput,
} from '@/lib/api/workspace-members';

// ============================================
// Result Types
// ============================================

interface CreateWorkspaceResult {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================
// Workspace CRUD Actions
// ============================================

/**
 * Create a new workspace via backend API
 * The current user automatically becomes the owner
 */
export async function createWorkspace(
  name: string,
  slug?: string,
  timezone?: string,
  currency?: string,
  region?: string
): Promise<CreateWorkspaceResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const input: CreateWorkspaceInput = { name };
    if (slug) {
      input.slug = slug;
    }
    if (timezone) {
      input.timezone = timezone;
    }
    if (currency) {
      input.currency = currency;
    }
    if (region) {
      input.region = region;
    }

    const workspace = await createWorkspaceAPI(input);

    // Revalidate workspace-related pages
    revalidatePath('/ws');

    return { success: true, workspaceId: workspace.slug };
  } catch (error) {
    console.error('Create workspace error:', error);
    // Provide user-friendly message for slug conflicts
    const message = error instanceof Error ? error.message : 'Failed to create workspace';
    const isConflict = message.includes('already exists') || 
      (error && typeof error === 'object' && 'status' in error && error.status === 409);
    return {
      success: false,
      error: isConflict ? 'This workspace URL is already taken. Please choose a different one.' : message,
    };
  }
}

/**
 * Update workspace name or slug
 */
export async function updateWorkspace(
  workspaceId: string,
  data: UpdateWorkspaceInput
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await updateWorkspaceAPI(workspaceId, data);
    revalidatePath('/ws');
    revalidatePath(`/ws/${workspaceId}`);
    return { success: true };
  } catch (error) {
    console.error('Update workspace error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update workspace',
    };
  }
}

/**
 * Delete a workspace
 */
export async function deleteWorkspace(workspaceId: string): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await deleteWorkspaceAPI(workspaceId);
    revalidatePath('/ws');
    return { success: true };
  } catch (error) {
    console.error('Delete workspace error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete workspace',
    };
  }
}

/**
 * Get list of workspaces for current user
 */
export async function getWorkspaces(): Promise<WorkspaceWithRole[]> {
  const session = await getSession();

  if (!session?.user) {
    return [];
  }

  try {
    return await listWorkspacesAPI();
  } catch (error) {
    console.error('Get workspaces error:', error);
    return [];
  }
}

/**
 * Get workspace details by ID
 */
export async function getWorkspaceDetails(workspaceId: string): Promise<WorkspaceDetail | null> {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  try {
    return await getWorkspaceAPI(workspaceId);
  } catch (error) {
    console.error('Get workspace details error:', error);
    return null;
  }
}

// ============================================
// Workspace Member Actions
// ============================================

/**
 * Get workspace members
 */
export async function getWorkspaceMembers(
  workspaceId: string
): Promise<WorkspaceMemberResponse[]> {
  const session = await getSession();

  if (!session?.user) {
    return [];
  }

  try {
    return await listMembersAPI(workspaceId);
  } catch (error) {
    console.error('Get workspace members error:', error);
    return [];
  }
}

/**
 * Add member to workspace
 */
export async function addWorkspaceMember(
  workspaceId: string,
  data: AddMemberInput
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await addMemberAPI(workspaceId, data);
    revalidatePath(`/ws/${workspaceId}/members`);
    return { success: true };
  } catch (error) {
    console.error('Add workspace member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add member',
    };
  }
}

/**
 * Update workspace member role
 */
export async function updateWorkspaceMember(
  workspaceId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' | 'viewer'
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await updateMemberRoleAPI(workspaceId, userId, role);
    revalidatePath(`/ws/${workspaceId}/members`);
    return { success: true };
  } catch (error) {
    console.error('Update workspace member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update member',
    };
  }
}

/**
 * Remove member from workspace
 */
export async function removeWorkspaceMemberAction(
  workspaceId: string,
  userId: string
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await removeMemberAPI(workspaceId, userId);
    revalidatePath(`/ws/${workspaceId}/members`);
    return { success: true };
  } catch (error) {
    console.error('Remove workspace member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove member',
    };
  }
}

// ============================================
// Organization Assignment Actions
// ============================================

/**
 * Move workspace to an organization
 * Requires workspace owner + organization admin permissions
 */
export async function moveWorkspaceToOrganization(
  workspaceId: string,
  organizationId: string
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await moveWorkspaceToOrgAPI(workspaceId, organizationId);
    revalidatePath('/ws');
    revalidatePath(`/ws/${workspaceId}`);
    revalidatePath('/organizations');
    return { success: true };
  } catch (error) {
    console.error('Move workspace to organization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to move workspace',
    };
  }
}

/**
 * Remove workspace from organization (make it independent)
 */
export async function removeWorkspaceFromOrganization(
  workspaceId: string
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await moveWorkspaceToOrgAPI(workspaceId, null);
    revalidatePath('/ws');
    revalidatePath(`/ws/${workspaceId}`);
    revalidatePath('/organizations');
    return { success: true };
  } catch (error) {
    console.error('Remove workspace from organization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove workspace from organization',
    };
  }
}

// ============================================
// Redirect Actions
// ============================================

/**
 * Create workspace and redirect to dashboard
 */
export async function createWorkspaceAndRedirect(
  name: string,
  slug?: string,
  timezone?: string,
  currency?: string,
  region?: string
): Promise<void> {
  const result = await createWorkspace(name, slug, timezone, currency, region);

  if (result.success && result.workspaceId) {
    redirect(routes.ws.dashboard(result.workspaceId));
  }

  // If failed, redirect back to workspace page with error
  redirect(
    `/ws?error=${encodeURIComponent(
      result.error || 'Failed to create workspace'
    )}`
  );
}
