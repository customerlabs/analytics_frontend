'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useActiveWorkspace } from '@/stores/workspaceStore';

/**
 * Hook for navigation with workspace context
 * Automatically appends ?ws= parameter when needed
 */
export function useWorkspaceRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeWorkspace = useActiveWorkspace();

  // Get current workspace from URL or store
  const currentWorkspace = useMemo(() => {
    return searchParams.get('ws') || activeWorkspace?.id || null;
  }, [searchParams, activeWorkspace]);

  /**
   * Check if a path needs workspace context
   */
  const needsWorkspaceContext = useCallback((path: string): boolean => {
    // Paths that don't need workspace context
    const noContextPaths = [
      '/profile',
      '/workspaces',
      '/login',
      '/sign-up',
      '/forgot-password',
    ];

    // Account detail pages don't need ?ws= (account ID is unique)
    const accountDetailPattern = /^\/accounts\/[^/]+/;

    if (noContextPaths.some((p) => path.startsWith(p))) {
      return false;
    }

    if (accountDetailPattern.test(path) && !path.endsWith('/accounts')) {
      return false;
    }

    return true;
  }, []);

  /**
   * Build URL with workspace context if needed
   */
  const buildUrl = useCallback(
    (path: string, ws?: string): string => {
      const workspaceId = ws || currentWorkspace;

      if (!workspaceId || !needsWorkspaceContext(path)) {
        return path;
      }

      const separator = path.includes('?') ? '&' : '?';
      return `${path}${separator}ws=${workspaceId}`;
    },
    [currentWorkspace, needsWorkspaceContext]
  );

  /**
   * Navigate with workspace context
   */
  const push = useCallback(
    (path: string, ws?: string) => {
      const url = buildUrl(path, ws);
      router.push(url);
    },
    [router, buildUrl]
  );

  /**
   * Replace current URL with workspace context
   */
  const replace = useCallback(
    (path: string, ws?: string) => {
      const url = buildUrl(path, ws);
      router.replace(url);
    },
    [router, buildUrl]
  );

  /**
   * Switch workspace and navigate to dashboard
   */
  const switchWorkspace = useCallback(
    (workspaceId: string, redirectTo: string = '/') => {
      const url = buildUrl(redirectTo, workspaceId);
      router.push(url);
    },
    [router, buildUrl]
  );

  /**
   * Update current URL with new workspace
   */
  const updateWorkspaceInUrl = useCallback(
    (workspaceId: string) => {
      const url = buildUrl(pathname, workspaceId);
      router.replace(url);
    },
    [router, pathname, buildUrl]
  );

  return {
    push,
    replace,
    buildUrl,
    switchWorkspace,
    updateWorkspaceInUrl,
    currentWorkspace,
    pathname,
    searchParams,
  };
}

/**
 * Hook to get just the current workspace from URL
 */
export function useCurrentWorkspaceId(): string | null {
  const searchParams = useSearchParams();
  const activeWorkspace = useActiveWorkspace();
  return searchParams.get('ws') || activeWorkspace?.id || null;
}
