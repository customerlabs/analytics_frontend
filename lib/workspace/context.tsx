'use client';

import { createContext, useContext, ReactNode } from 'react';
import type { Workspace } from '@/types/workspace';

// Workspace context type
interface WorkspaceContextValue {
  workspace: Workspace;
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
