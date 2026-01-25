'use client';

import { usePathname } from 'next/navigation';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { CreateWorkspaceSheet } from '@/features/workspace/components/CreateWorkspaceSheet';
import type { Workspace, User } from '@/types/workspace';

interface AppShellProps {
  user: User;
  currentWorkspace?: Workspace | null;
  workspaces?: Workspace[];
  children: React.ReactNode;
  onLogout: () => Promise<unknown>;
}

export function AppShell({
  user,
  currentWorkspace,
  workspaces,
  children,
  onLogout,
}: AppShellProps) {
  const pathname = usePathname();
  const showHeader = !pathname.startsWith('/ws/');

  return (
    <>
      {showHeader && (
        <AuthHeader
          user={user}
          currentWorkspace={currentWorkspace || undefined}
          workspaces={workspaces}
          onLogout={onLogout}
        />
      )}
      <div className={showHeader ? 'pt-14' : undefined}>{children}</div>

      {/* Global Create Workspace Sheet */}
      <CreateWorkspaceSheet />
    </>
  );
}
