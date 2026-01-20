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
  // Dashboard (needs ?ws=)
  // ============================================
  dashboard: (ws: string) => `/?ws=${ws}`,

  // ============================================
  // Accounts
  // ============================================
  accounts: {
    // List needs ?ws= (which workspace's accounts?)
    list: (ws: string) => `/accounts?ws=${ws}`,

    // Detail pages don't need ?ws= (account ID is unique)
    detail: (accountId: string) => `/accounts/${accountId}`,
    settings: (accountId: string) => `/accounts/${accountId}/settings`,
    analytics: (accountId: string) => `/accounts/${accountId}/analytics`,
  },

  // ============================================
  // Workspace settings (needs ?ws=)
  // ============================================
  settings: {
    general: (ws: string) => `/settings?ws=${ws}`,
    members: (ws: string) => `/settings/members?ws=${ws}`,
    roles: (ws: string) => `/settings/roles?ws=${ws}`,
    billing: (ws: string) => `/settings/billing?ws=${ws}`,
    apiKeys: (ws: string) => `/settings/api-keys?ws=${ws}`,
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
  // Workspaces (switcher, no context needed)
  // ============================================
  workspaces: {
    list: () => '/workspaces',
    create: () => '/workspaces/new',
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
    accounts: (ws: string) => `/api/accounts?ws=${ws}`,
  },
} as const;

// ============================================
// Route configuration for middleware
// ============================================

/**
 * Routes that require authentication
 */
export const protectedRoutes = [
  '/',
  '/accounts',
  '/settings',
  '/workspaces',
  '/profile',
];

/**
 * Routes that require workspace context (?ws= parameter)
 */
export const workspaceRequiredRoutes = [
  '/',
  '/accounts',
  '/settings',
];

/**
 * Routes that are public (no auth required)
 */
export const publicRoutes = [
  '/login',
  '/sign-up',
  '/forgot-password',
  '/verify-email',
  '/api/auth',
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
  '/workspaces',
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
  // Account detail pages don't need workspace context
  if (/^\/accounts\/[^/]+/.test(pathname)) {
    return false;
  }

  // Check against workspace-independent routes
  if (workspaceIndependentRoutes.some((route) => pathname.startsWith(route))) {
    return false;
  }

  // Check against workspace-required routes
  return workspaceRequiredRoutes.some((route) => pathname.startsWith(route));
}
