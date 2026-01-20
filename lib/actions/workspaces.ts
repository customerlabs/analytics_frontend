'use server';

import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import {
  createWorkspaceGroup,
  addUserToGroup,
  assignRoleToGroup,
} from '@/lib/keycloak/admin-client';
import { invalidatePermissionCache } from '@/lib/keycloak/permissions/cache';
import { setWorkspaceCookie } from '@/lib/workspace/resolver';

interface CreateWorkspaceResult {
  success: boolean;
  workspaceId?: string;
  error?: string;
}

/**
 * Create a new workspace
 */
export async function createWorkspace(
  name: string,
  slug?: string
): Promise<CreateWorkspaceResult> {
  const session = await getSession();

  if (!session.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    // Generate slug from name if not provided
    const workspaceSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Create workspace group in Keycloak
    const group = await createWorkspaceGroup(name, workspaceSlug);

    if (!group.id) {
      return { success: false, error: 'Failed to create workspace group' };
    }

    // Add current user to the workspace
    await addUserToGroup(session.user.id, group.id);

    // Assign workspace-admin role to the group for this user
    await assignRoleToGroup(group.id, 'workspace-admin');

    // Invalidate user's permission cache
    await invalidatePermissionCache(session.user.id);

    // Set the new workspace as active
    await setWorkspaceCookie(workspaceSlug);

    return { success: true, workspaceId: workspaceSlug };
  } catch (error) {
    console.error('Create workspace error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create workspace',
    };
  }
}

/**
 * Create workspace and redirect to dashboard
 */
export async function createWorkspaceAndRedirect(
  name: string,
  slug?: string
): Promise<void> {
  const result = await createWorkspace(name, slug);

  if (result.success && result.workspaceId) {
    redirect(`/?ws=${result.workspaceId}`);
  }

  // If failed, redirect back to new workspace page with error
  redirect(`/workspaces/new?error=${encodeURIComponent(result.error || 'Failed to create workspace')}`);
}
