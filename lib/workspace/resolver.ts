'use server';

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
 * Resolve workspace by slug (path-based resolution only)
 * @param slug - Workspace slug from URL path
 * @returns The requested workspace or first available workspace
 */
export async function resolveWorkspace(
  slug?: string | null
): Promise<Workspace | null> {
  const session = await auth();

  if (!session?.user) {
    return null;
  }

  const workspaces = await getWorkspacesFromBackend();

  if (workspaces.length === 0) {
    return null;
  }

  // If slug provided, find the matching workspace
  if (slug) {
    const workspace = workspaces.find((ws) => ws.slug === slug);
    if (workspace) {
      return transformWorkspace(workspace);
    }
  }

  // Fallback: return first available workspace
  return transformWorkspace(workspaces[0]);
}

/**
 * Resolve workspace or redirect to workspace selector
 * @param slug - Workspace slug from URL path
 */
export async function resolveWorkspaceOrRedirect(
  slug?: string | null
): Promise<Workspace> {
  const workspace = await resolveWorkspace(slug);

  if (!workspace) {
    redirect('/ws');
  }

  return workspace;
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
