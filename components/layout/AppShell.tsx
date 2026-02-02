'use client';

import { AuthHeader } from '@/components/layout/AuthHeader';
import { CreateWorkspaceSheet } from '@/features/workspace/components/CreateWorkspaceSheet';
import type { Workspace, User } from '@/types/workspace';

interface AppShellProps {
  user: User;
  currentWorkspace?: Workspace | null;
  workspaces?: Workspace[];
  /** Set to false for routes that render their own header (e.g., workspace routes) */
  showHeader?: boolean;
  children: React.ReactNode;
}

/**
 * App shell wrapper for dashboard routes.
 * Workspace routes (/ws/[id]/*) should pass showHeader={false} as they have their own AuthHeader.
 */
export function AppShell({
  user,
  currentWorkspace,
  workspaces,
  showHeader = true,
  children,
}: AppShellProps) {
  return (
    <>
      {showHeader && (
        <AuthHeader
          user={user}
          currentWorkspace={currentWorkspace || undefined}
          workspaces={workspaces}
        />
      )}
      <div className={showHeader ? 'pt-14' : undefined}>{children}</div>

      {/* Global Create Workspace Sheet */}
      <CreateWorkspaceSheet />
    </>
  );
}
