'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkspaceSwitcher } from '@/features/workspace/components/WorkspaceSwitcher';
import { UserProfile } from '@/components/auth/UserProfile';
import type { Workspace, SessionUser } from '@/lib/keycloak/types';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface AuthHeaderProps {
  user: SessionUser;
  currentWorkspace?: Workspace;
  workspaces?: Workspace[];
  onLogout: () => Promise<unknown>;
}

export function AuthHeader({
  user,
  currentWorkspace,
  workspaces,
  onLogout,
}: AuthHeaderProps) {
  const router = useRouter();
  const hasWorkspaceData =
    Boolean(currentWorkspace) && Boolean(workspaces && workspaces.length > 0);

  const handleLogout = async () => {
    await onLogout();
    router.push('/login');
  };

  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200',
        'fixed top-0 inset-x-0 z-50',
        'h-14 px-4 sm:px-6',
        'flex items-center justify-between'
      )}
    >
      {/* Left Section: Logo + Workspace Switcher */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <Link
          href={
            currentWorkspace
              ? routes.ws.dashboard(currentWorkspace.id)
              : '/workspaces'
          }
          className="shrink-0"
        >
          <Image
            src="/logo_full.png"
            alt="Analytics"
            width={168}
            height={32}
            className="h-8 w-auto"
          />
        </Link>

        {/* Workspace Switcher */}
        {hasWorkspaceData && (
          <WorkspaceSwitcher
            currentWorkspace={currentWorkspace!}
            workspaces={workspaces!}
          />
        )}
      </div>

      {/* Right Section: User Profile */}
      <div className="flex items-center gap-4">
        <UserProfile user={user} onLogout={handleLogout} />
      </div>
    </header>
  );
}

/**
 * Header for unauthenticated pages
 */
export function PublicHeader() {
  return (
    <header
      className={cn(
        'bg-white border-b border-gray-200',
        'px-4 sm:px-6 py-3',
        'flex items-center justify-between'
      )}
    >
      {/* Logo */}
      <Link href="/" className="shrink-0">
        <Image
          src="/logo_full.png"
          alt="Analytics"
          width={32}
          height={32}
          className="h-8 w-auto"
        />
      </Link>

      {/* Auth Links */}
      <div className="flex items-center gap-3">
        <Link
          href="/login"
          className={cn(
            'text-sm font-medium text-gray-700',
            'hover:text-gray-900 transition-colors'
          )}
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className={cn(
            'text-sm font-medium text-white',
            'bg-blue-600 hover:bg-blue-700',
            'px-4 py-2 rounded-lg transition-colors'
          )}
        >
          Get started
        </Link>
      </div>
    </header>
  );
}
