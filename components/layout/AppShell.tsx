'use client';

import { usePathname } from 'next/navigation';
import type { Workspace, SessionUser } from '@/lib/keycloak/types';
import { AuthHeader } from '@/components/layout/AuthHeader';

interface AppShellProps {
  user: SessionUser;
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
  const showHeader =
    pathname !== '/ws' && !pathname.startsWith('/ws/');

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
    </>
  );
}
