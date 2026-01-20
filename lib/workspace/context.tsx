'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Workspace, WorkspaceRole } from '@/lib/keycloak/types';

// Workspace context type
interface WorkspaceContextValue {
  workspace: Workspace;
  isAdmin: boolean;
  isBilling: boolean;
  canManageMembers: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

interface WorkspaceProviderProps {
  workspace: Workspace;
  children: ReactNode;
}

/**
 * Provider component for workspace context
 * Wrap pages that need workspace context with this provider
 */
export function WorkspaceProvider({
  workspace,
  children,
}: WorkspaceProviderProps) {
  const value: WorkspaceContextValue = {
    workspace,
    isAdmin: workspace.role === 'workspace-admin',
    isBilling:
      workspace.role === 'workspace-admin' ||
      workspace.role === 'workspace-billing',
    canManageMembers: workspace.role === 'workspace-admin',
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

/**
 * Hook to access workspace context
 * Must be used within a WorkspaceProvider
 */
export function useWorkspace(): WorkspaceContextValue {
  const context = useContext(WorkspaceContext);

  if (!context) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }

  return context;
}

/**
 * Hook to safely access workspace context (returns null if not in provider)
 */
export function useOptionalWorkspace(): WorkspaceContextValue | null {
  return useContext(WorkspaceContext);
}

/**
 * Check if user has a specific workspace role
 */
export function useHasWorkspaceRole(requiredRole: WorkspaceRole): boolean {
  const context = useContext(WorkspaceContext);

  if (!context) {
    return false;
  }

  const roleHierarchy: WorkspaceRole[] = [
    'workspace-member',
    'workspace-billing',
    'workspace-admin',
  ];

  const userRoleIndex = roleHierarchy.indexOf(context.workspace.role);
  const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

  return userRoleIndex >= requiredRoleIndex;
}
