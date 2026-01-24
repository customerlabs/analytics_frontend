'use server';

import type GroupRepresentation from '@keycloak/keycloak-admin-client/lib/defs/groupRepresentation';
import { getUserGroups, getGroupRoleMappings } from '../admin-client';
import { keycloakConfig } from '../config';
import type {
  UserPermissions,
  WorkspaceRole,
  AccountRole,
} from '../types';
import { getPermissionCache, setPermissionCache } from './cache';

/**
 * Get full user permissions from Keycloak groups
 * This builds the complete permission tree for a user
 */
export async function getUserPermissions(userId: string): Promise<UserPermissions> {
  // Try cache first
  const cached = await getPermissionCache(userId);
  if (cached) {
    return cached;
  }

  // Fetch from Keycloak
  const permissions = await fetchUserPermissions(userId);

  // Cache the result
  await setPermissionCache(userId, permissions);

  return permissions;
}

/**
 * Fetch user permissions from Keycloak (bypasses cache)
 */
async function fetchUserPermissions(userId: string): Promise<UserPermissions> {
  const userGroups = await getUserGroups(userId);

  const permissions: UserPermissions = {
    userId,
    workspaces: {},
  };

  // Process all groups in parallel for better performance
  await Promise.all(
    userGroups.map((group) => processGroup(group, permissions))
  );

  return permissions;
}

/**
 * Process a single group and add to permissions
 */
async function processGroup(
  group: GroupRepresentation,
  permissions: UserPermissions
): Promise<void> {
  const groupPath = group.path || '';
  const groupType = group.attributes?.type?.[0];

  if (!groupType) return;

  // Parse the group path to understand hierarchy
  // Format: /workspace:slug or /workspace:slug/account:id
  const pathParts = groupPath.split('/').filter(Boolean);

  if (groupType === 'workspace') {
    // This is a workspace group
    const workspaceId = extractIdFromGroupName(group.name || '');
    const role = await getGroupRole(group.id!, 'workspace');

    if (workspaceId && role) {
      permissions.workspaces[workspaceId] = {
        role: role as WorkspaceRole,
        accounts: {},
      };
    }
  } else if (groupType === 'account') {
    // This is an account group
    const accountId = extractIdFromGroupName(group.name || '');
    const workspaceId = group.attributes?.workspaceId?.[0] || extractWorkspaceFromPath(pathParts);
    const role = await getGroupRole(group.id!, 'account');

    if (accountId && workspaceId && role) {
      // Ensure workspace exists in permissions
      if (!permissions.workspaces[workspaceId]) {
        permissions.workspaces[workspaceId] = {
          role: 'workspace-member', // Default role if only account access
          accounts: {},
        };
      }

      permissions.workspaces[workspaceId].accounts[accountId] = {
        role: role as AccountRole,
      };
    }
  }
}

/**
 * Get the role assigned to a group for a specific level
 */
async function getGroupRole(
  groupId: string,
  level: 'workspace' | 'account'
): Promise<string | null> {
  try {
    const roleMappings = await getGroupRoleMappings(groupId);
    const clientId = keycloakConfig.adminClientId;

    // Look for client role mappings
    const clientRoles = roleMappings.clientMappings?.[clientId]?.mappings || [];

    // Find the appropriate role based on level
    const rolePrefix = level === 'workspace' ? 'workspace-' : 'account-';
    const role = clientRoles.find((r: { name?: string }) => r.name?.startsWith(rolePrefix));

    return role?.name || null;
  } catch (error) {
    console.error('Error getting group role:', error);
    return null;
  }
}

/**
 * Extract ID from group name (e.g., "workspace:acme-corp" -> "acme-corp")
 */
function extractIdFromGroupName(name: string): string {
  const parts = name.split(':');
  return parts[1] || name;
}

/**
 * Extract workspace ID from group path
 */
function extractWorkspaceFromPath(pathParts: string[]): string | null {
  const workspacePart = pathParts.find((p) => p.startsWith('workspace:'));
  return workspacePart ? extractIdFromGroupName(workspacePart) : null;
}

/**
 * Get user's workspaces (lightweight version for session)
 */
export async function getUserWorkspaces(
  userId: string
): Promise<{ workspaceId: string; role: WorkspaceRole }[]> {
  const permissions = await getUserPermissions(userId);

  return Object.entries(permissions.workspaces).map(([workspaceId, data]) => ({
    workspaceId,
    role: data.role,
  }));
}

/**
 * Get accounts for a specific workspace
 */
export async function getAccountsForWorkspace(
  userId: string,
  workspaceId: string
): Promise<{ accountId: string; role: AccountRole }[]> {
  const permissions = await getUserPermissions(userId);
  const workspace = permissions.workspaces[workspaceId];

  if (!workspace) return [];

  // If user is workspace admin, they have full access to all accounts
  if (workspace.role === 'workspace-admin') {
    // Return all accounts with admin role
    return Object.entries(workspace.accounts).map(([accountId, data]) => ({
      accountId,
      role: 'account-admin' as AccountRole,
    }));
  }

  return Object.entries(workspace.accounts).map(([accountId, data]) => ({
    accountId,
    role: data.role,
  }));
}

/**
 * Refresh user permissions (invalidate cache and refetch)
 */
export async function refreshUserPermissions(userId: string): Promise<UserPermissions> {
  const { invalidatePermissionCache } = await import('./cache');
  await invalidatePermissionCache(userId);
  return getUserPermissions(userId);
}
