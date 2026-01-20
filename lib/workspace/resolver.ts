'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getUserPermissions } from '@/lib/keycloak/permissions/resolver';
import type { Workspace, WorkspaceRole } from '@/lib/keycloak/types';

const WORKSPACE_COOKIE = 'analytics_workspace';

/**
 * Resolve workspace from various sources
 * Priority: query param > cookie > default > first available
 */
export async function resolveWorkspace(
  wsParam?: string | null
): Promise<Workspace | null> {
  const session = await getSession();

  if (!session.user) {
    return null;
  }

  // Get user's workspaces
  const permissions = await getUserPermissions(session.user.id);
  const workspaceIds = Object.keys(permissions.workspaces);

  if (workspaceIds.length === 0) {
    return null;
  }

  // 1. Try query parameter
  if (wsParam && permissions.workspaces[wsParam]) {
    await setWorkspaceCookie(wsParam);
    return buildWorkspace(wsParam, permissions.workspaces[wsParam].role);
  }

  // 2. Try cookie
  const cookieStore = await cookies();
  const cookieWorkspace = cookieStore.get(WORKSPACE_COOKIE)?.value;

  if (cookieWorkspace && permissions.workspaces[cookieWorkspace]) {
    return buildWorkspace(
      cookieWorkspace,
      permissions.workspaces[cookieWorkspace].role
    );
  }

  // 3. Use first available workspace
  const firstWorkspaceId = workspaceIds[0];
  await setWorkspaceCookie(firstWorkspaceId);
  return buildWorkspace(
    firstWorkspaceId,
    permissions.workspaces[firstWorkspaceId].role
  );
}

/**
 * Resolve workspace or redirect to workspace selector
 */
export async function resolveWorkspaceOrRedirect(
  wsParam?: string | null,
  currentPath?: string
): Promise<Workspace> {
  const workspace = await resolveWorkspace(wsParam);

  if (!workspace) {
    const redirectPath = currentPath
      ? `/workspaces?redirect=${encodeURIComponent(currentPath)}`
      : '/workspaces';
    redirect(redirectPath);
  }

  return workspace;
}

/**
 * Get workspace from account ID
 * Since accounts are globally unique, we can derive the workspace
 */
export async function getWorkspaceFromAccount(
  accountId: string
): Promise<Workspace | null> {
  const session = await getSession();

  if (!session.user) {
    return null;
  }

  const permissions = await getUserPermissions(session.user.id);

  // Search through all workspaces to find the account
  for (const [workspaceId, workspaceData] of Object.entries(
    permissions.workspaces
  )) {
    if (workspaceData.accounts[accountId]) {
      return buildWorkspace(workspaceId, workspaceData.role);
    }
  }

  return null;
}

/**
 * Get all workspaces for current user
 */
export async function getUserWorkspaceList(): Promise<Workspace[]> {
  const session = await getSession();

  if (!session.user) {
    return [];
  }

  const permissions = await getUserPermissions(session.user.id);

  return Object.entries(permissions.workspaces).map(([id, data]) =>
    buildWorkspace(id, data.role)
  );
}

/**
 * Set active workspace cookie
 */
export async function setWorkspaceCookie(workspaceId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365, // 1 year
    path: '/',
  });
}

/**
 * Get current workspace from cookie
 */
export async function getWorkspaceCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value || null;
}

/**
 * Clear workspace cookie
 */
export async function clearWorkspaceCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(WORKSPACE_COOKIE);
}

/**
 * Switch to a different workspace
 */
export async function switchWorkspace(workspaceId: string): Promise<boolean> {
  const session = await getSession();

  if (!session.user) {
    return false;
  }

  const permissions = await getUserPermissions(session.user.id);

  if (!permissions.workspaces[workspaceId]) {
    return false;
  }

  await setWorkspaceCookie(workspaceId);
  return true;
}

/**
 * Build workspace object from ID and role
 */
function buildWorkspace(id: string, role: WorkspaceRole): Workspace {
  // In a real app, you'd fetch the display name from Keycloak or your DB
  // For now, we'll derive it from the slug
  const name = id
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  return {
    id,
    slug: id,
    name,
    role,
  };
}
