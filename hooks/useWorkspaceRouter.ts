'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import { useActiveWorkspace } from '@/stores/workspaceStore';

/**
 * Hook for navigation with workspace context
 * Automatically scopes paths to the active workspace
 */
export function useWorkspaceRouter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const activeWorkspace = useActiveWorkspace();

  // Get current workspace from URL or store
  const currentWorkspace = useMemo(() => {
    const match = pathname?.match(/^\/ws\/([^/]+)/);
    return match?.[1] || searchParams.get('ws') || activeWorkspace?.id || null;
  }, [pathname, searchParams, activeWorkspace]);

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

    if (noContextPaths.some((p) => path.startsWith(p))) {
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

      if (path === '/') {
        return `/ws/${workspaceId}`;
      }

      if (/^\/ws\/[^/]+/.test(path)) {
        return path.replace(/^\/ws\/[^/]+/, `/ws/${workspaceId}`);
      }

      if (path === '/ws' || path.startsWith('/ws/')) {
        const suffix = path === '/ws' ? '' : path.slice('/ws'.length);
        return `/ws/${workspaceId}${suffix}`;
      }

      return `/ws/${workspaceId}${path.startsWith('/') ? path : `/${path}`}`;
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
    (workspaceId: string, redirectTo: string = '/ws') => {
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
  const pathname = usePathname();
  const match = pathname?.match(/^\/ws\/([^/]+)/);
  return match?.[1] || searchParams.get('ws') || activeWorkspace?.id || null;
}
