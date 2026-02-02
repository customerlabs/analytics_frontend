'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { WorkspaceSelector } from '@/features/workspace/components/WorkspaceSelector';
import { UserProfile } from '@/components/auth/UserProfile';
import { logoutAction } from '@/lib/auth';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import type { Workspace, User } from '@/types/workspace';

interface AuthHeaderProps {
  user: User;
  currentWorkspace?: Workspace;
  workspaces?: Workspace[];
}

export function AuthHeader({
  user,
  currentWorkspace,
  workspaces,
}: AuthHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await logoutAction();
    router.push('/login');
  };

  return (
    <header
      className={cn(
        'bg-background border-b border-border',
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
              : '/ws'
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
        <WorkspaceSelector
          currentWorkspace={currentWorkspace}
          workspaces={workspaces ?? []}
        />
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
        'bg-background border-b border-border',
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
            'text-sm font-medium text-muted-foreground',
            'hover:text-foreground transition-colors'
          )}
        >
          Sign in
        </Link>
        <Link
          href="/sign-up"
          className={cn(
            'text-sm font-medium text-primary-foreground',
            'bg-primary hover:bg-primary/90',
            'px-4 py-2 rounded-lg transition-colors'
          )}
        >
          Get started
        </Link>
      </div>
    </header>
  );
}
