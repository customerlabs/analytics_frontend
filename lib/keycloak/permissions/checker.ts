'use server';

import { getSession } from '@/lib/auth/session';
import { getUserPermissions } from './resolver';
import type {
  UserPermissions,
  WorkspaceRole,
  AccountRole,
  PermissionCheckResult,
} from '../types';

// Role hierarchy for workspace roles (higher index = more permissions)
const WORKSPACE_ROLE_HIERARCHY: WorkspaceRole[] = [
  'workspace-member',
  'workspace-billing',
  'workspace-admin',
];

// Role hierarchy for account roles
const ACCOUNT_ROLE_HIERARCHY: AccountRole[] = [
  'account-viewer',
  'account-editor',
  'account-admin',
];

/**
 * Check if a role is sufficient for a required role
 */
function isRoleSufficient<T extends string>(
  userRole: T,
  requiredRole: T,
  hierarchy: T[]
): boolean {
  const userIndex = hierarchy.indexOf(userRole);
  const requiredIndex = hierarchy.indexOf(requiredRole);

  if (userIndex === -1 || requiredIndex === -1) {
    return false;
  }

  return userIndex >= requiredIndex;
}

/**
 * Check if user has access to a workspace
 */
export async function hasWorkspaceAccess(
  userId: string,
  workspaceId: string,
  requiredRole?: WorkspaceRole
): Promise<PermissionCheckResult> {
  const permissions = await getUserPermissions(userId);
  const workspace = permissions.workspaces[workspaceId];

  if (!workspace) {
    return { hasAccess: false, reason: 'No access to workspace' };
  }

  if (!requiredRole) {
    return { hasAccess: true, role: workspace.role };
  }

  const hasAccess = isRoleSufficient(
    workspace.role,
    requiredRole,
    WORKSPACE_ROLE_HIERARCHY
  );

  return {
    hasAccess,
    role: workspace.role,
    reason: hasAccess ? undefined : `Requires ${requiredRole} role`,
  };
}

/**
 * Check if user has access to an account
 */
export async function hasAccountAccess(
  userId: string,
  workspaceId: string,
  accountId: string,
  requiredRole?: AccountRole
): Promise<PermissionCheckResult> {
  const permissions = await getUserPermissions(userId);
  const workspace = permissions.workspaces[workspaceId];

  if (!workspace) {
    return { hasAccess: false, reason: 'No access to workspace' };
  }

  // Workspace admin has full access to all accounts
  if (workspace.role === 'workspace-admin') {
    return { hasAccess: true, role: 'account-admin' };
  }

  const account = workspace.accounts[accountId];

  if (!account) {
    return { hasAccess: false, reason: 'No access to account' };
  }

  if (!requiredRole) {
    return { hasAccess: true, role: account.role };
  }

  const hasAccess = isRoleSufficient(
    account.role,
    requiredRole,
    ACCOUNT_ROLE_HIERARCHY
  );

  return {
    hasAccess,
    role: account.role,
    reason: hasAccess ? undefined : `Requires ${requiredRole} role`,
  };
}

/**
 * Create a permission guard for Server Actions
 * Throws an error if user doesn't have required permission
 */
export async function createPermissionGuard(
  workspaceId: string,
  accountId?: string
) {
  return async function guard(
    requiredRole: WorkspaceRole | AccountRole
  ): Promise<void> {
    const session = await getSession();

    if (!session.user) {
      throw new Error('Unauthorized');
    }

    let result: PermissionCheckResult;

    if (accountId) {
      // Check account-level permission
      result = await hasAccountAccess(
        session.user.id,
        workspaceId,
        accountId,
        requiredRole as AccountRole
      );
    } else {
      // Check workspace-level permission
      result = await hasWorkspaceAccess(
        session.user.id,
        workspaceId,
        requiredRole as WorkspaceRole
      );
    }

    if (!result.hasAccess) {
      throw new Error(result.reason || 'Forbidden');
    }
  };
}

/**
 * Get user's role in a workspace
 */
export async function getWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<WorkspaceRole | null> {
  const permissions = await getUserPermissions(userId);
  return permissions.workspaces[workspaceId]?.role || null;
}

/**
 * Get user's role for an account
 */
export async function getAccountRole(
  userId: string,
  workspaceId: string,
  accountId: string
): Promise<AccountRole | null> {
  const permissions = await getUserPermissions(userId);
  const workspace = permissions.workspaces[workspaceId];

  if (!workspace) return null;

  // Workspace admin has full access
  if (workspace.role === 'workspace-admin') {
    return 'account-admin';
  }

  return workspace.accounts[accountId]?.role || null;
}

/**
 * Check if user can perform an action (helper for UI)
 */
export async function canPerformAction(
  action: 'create' | 'edit' | 'delete' | 'view',
  resource: 'workspace' | 'account' | 'member',
  context: {
    workspaceId: string;
    accountId?: string;
  }
): Promise<boolean> {
  const session = await getSession();
  if (!session.user) return false;

  const { workspaceId, accountId } = context;

  // Define required roles for each action
  const roleMap: Record<
    string,
    Record<string, WorkspaceRole | AccountRole>
  > = {
    workspace: {
      create: 'workspace-admin', // Only admins can create workspaces
      edit: 'workspace-admin',
      delete: 'workspace-admin',
      view: 'workspace-member',
    },
    account: {
      create: 'workspace-admin',
      edit: 'account-editor',
      delete: 'workspace-admin',
      view: 'account-viewer',
    },
    member: {
      create: 'workspace-admin',
      edit: 'workspace-admin',
      delete: 'workspace-admin',
      view: 'workspace-member',
    },
  };

  const requiredRole = roleMap[resource]?.[action];
  if (!requiredRole) return false;

  if (resource === 'account' && accountId) {
    const result = await hasAccountAccess(
      session.user.id,
      workspaceId,
      accountId,
      requiredRole as AccountRole
    );
    return result.hasAccess;
  }

  const result = await hasWorkspaceAccess(
    session.user.id,
    workspaceId,
    requiredRole as WorkspaceRole
  );
  return result.hasAccess;
}
