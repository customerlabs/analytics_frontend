'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { listWorkspaces } from '@/lib/api/workspaces';
import type { WorkspaceWithRole } from '@/lib/api/workspaces';

// Re-export the Workspace type for compatibility
export interface Workspace {
  id: string;
  slug: string;
  name: string;
  role: 'owner' | 'admin' | 'member' | 'viewer';
  organization_id?: string | null;
}

const WORKSPACE_COOKIE = 'analytics_workspace';

// Cache workspaces for the current request to avoid multiple API calls
let cachedWorkspaces: WorkspaceWithRole[] | null = null;

async function getWorkspacesFromBackend(): Promise<WorkspaceWithRole[]> {
  if (cachedWorkspaces !== null) {
    return cachedWorkspaces;
  }

  try {
    cachedWorkspaces = await listWorkspaces();
    return cachedWorkspaces;
  } catch (error) {
    console.error('Failed to fetch workspaces from backend:', error);
    return [];
  }
}

/**
 * Resolve workspace from various sources
 * Priority: query param > cookie > default > first available
 */
export async function resolveWorkspace(
  wsParam?: string | null
): Promise<Workspace | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // Get user's workspaces from backend API
  const workspaces = await getWorkspacesFromBackend();

  if (workspaces.length === 0) {
    return null;
  }

  // Create a map for quick lookup by id or slug
  const workspaceMap = new Map<string, WorkspaceWithRole>();
  for (const ws of workspaces) {
    workspaceMap.set(ws.id, ws);
    workspaceMap.set(ws.slug, ws);
  }

  // 1. Try query parameter (can be id or slug)
  if (wsParam) {
    const workspace = workspaceMap.get(wsParam);
    if (workspace) {
      return transformWorkspace(workspace);
    }
  }

  // 2. Try cookie
  const cookieStore = await cookies();
  const cookieWorkspace = cookieStore.get(WORKSPACE_COOKIE)?.value;

  if (cookieWorkspace) {
    const workspace = workspaceMap.get(cookieWorkspace);
    if (workspace) {
      return transformWorkspace(workspace);
    }
  }

  // 3. Use first available workspace
  const firstWorkspace = workspaces[0];
  return transformWorkspace(firstWorkspace);
}

/**
 * Resolve workspace or redirect to workspace selector
 */
export async function resolveWorkspaceOrRedirect(
  wsParam?: string | null
): Promise<Workspace> {
  const workspace = await resolveWorkspace(wsParam);

  if (!workspace) {
    redirect('/ws');
  }

  return workspace;
}

/**
 * Get workspace from account ID
 * Note: This requires the backend to support account-to-workspace lookup
 * For now, we search through user's workspaces
 */
export async function getWorkspaceFromAccount(
  accountId: string
): Promise<Workspace | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  // TODO: Implement account-to-workspace lookup via backend API
  // For now, return null - the backend should provide this endpoint
  console.warn('getWorkspaceFromAccount: Not yet implemented with backend API', accountId);
  return null;
}

/**
 * Get all workspaces for current user
 */
export async function getUserWorkspaceList(): Promise<Workspace[]> {
  const session = await auth();

  if (!session?.user) {
    return [];
  }

  const workspaces = await getWorkspacesFromBackend();
  return workspaces.map(transformWorkspace);
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
 * Transform backend workspace response to local Workspace type
 */
function transformWorkspace(ws: WorkspaceWithRole): Workspace {
  return {
    id: ws.id,
    slug: ws.slug,
    name: ws.name,
    role: ws.role,
    organization_id: ws.organization_id,
  };
}

/**
 * Clear the workspace cache (call after workspace mutations)
 */
export async function clearWorkspaceCache(): Promise<void> {
  cachedWorkspaces = null;
}
