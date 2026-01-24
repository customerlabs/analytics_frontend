/**
 * Type-safe route builder for the application
 * Ensures consistent URL generation with workspace context
 */

export const routes = {
  // ============================================
  // Auth routes (public)
  // ============================================
  auth: {
    login: () => '/login',
    signUp: () => '/sign-up',
    forgotPassword: () => '/forgot-password',
    callback: () => '/api/auth/callback',
  },

  // ============================================
  // Workspace App (path-scoped)
  // ============================================
  ws: {
    dashboard: (id: string) => `/ws/${id}`,
    accounts: {
      list: (id: string) => `/ws/${id}/accounts`,
      detail: (id: string, accountId: string) =>
        `/ws/${id}/accounts/${accountId}`,
      settings: (id: string, accountId: string) =>
        `/ws/${id}/accounts/${accountId}/settings`,
      analytics: (id: string, accountId: string) =>
        `/ws/${id}/accounts/${accountId}/analytics`,
    },
    settings: {
      general: (id: string) => `/ws/${id}/settings`,
      members: (id: string) => `/ws/${id}/settings/members`,
      roles: (id: string) => `/ws/${id}/settings/roles`,
      billing: (id: string) => `/ws/${id}/settings/billing`,
      apiKeys: (id: string) => `/ws/${id}/settings/api-keys`,
    },
  },

  // ============================================
  // User profile (no workspace context)
  // ============================================
  profile: {
    index: () => '/profile',
    preferences: () => '/profile/preferences',
    security: () => '/profile/security',
  },


  // ============================================
  // API routes
  // ============================================
  api: {
    auth: {
      callback: () => '/api/auth/callback',
      logout: () => '/api/auth/logout',
    },
    workspaces: () => '/api/workspaces',
    accounts: (id: string) => `/api/accounts?ws=${id}`,
  },
} as const;

// ============================================
// Route configuration for middleware
// ============================================

/**
 * Routes that require authentication
 */
export const protectedRoutes = [
  '/ws',
  '/settings',
  '/accounts',
  '/profile',
];

/**
 * Routes that require workspace context (path-scoped)
 */
export const workspaceRequiredRoutes = ['/ws', '/settings', '/accounts'];

/**
 * Routes that are public (no auth required)
 */
export const publicRoutes = [
  '/login',
  '/sign-up',
  '/forgot-password',
  '/verify-email',
  '/api/auth',
  '/auth/post-login',
];

/**
 * Routes where workspace context is NOT needed
 * (either public, profile, or account detail pages)
 */
export const workspaceIndependentRoutes = [
  '/login',
  '/sign-up',
  '/forgot-password',
  '/profile',
];

/**
 * Check if a path is a public route
 */
export function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path is a protected route
 */
export function isProtectedRoute(pathname: string): boolean {
  if (isPublicRoute(pathname)) return false;
  return protectedRoutes.some((route) => pathname.startsWith(route));
}

/**
 * Check if a path requires workspace context
 */
export function requiresWorkspaceContext(pathname: string): boolean {
  // Check against workspace-independent routes
  if (workspaceIndependentRoutes.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // Check against workspace-required routes
  return workspaceRequiredRoutes.some((route) => pathname.startsWith(route));
}
