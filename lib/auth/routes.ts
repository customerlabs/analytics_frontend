export const apiAuthPrefix = "/api/auth";
export const DEFAULT_LOGIN_REDIRECT = "/ws";

export const protectedRoutes = [
  "/",
  "/ws",
  "/accounts",
  "/settings",
];

export const authRoutes = [
  "/login",
  "/sign-up",
  "/forget-password",
];

/**
 * Check if a route is public (doesn't require authentication)
 */
export function isPublicRoute(pathname: string): boolean {
  return authRoutes.some(route => pathname.startsWith(route));
}

/**
 * Check if a route is protected (requires authentication)
 */
export function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some(route =>
    pathname === route || pathname.startsWith(`${route}/`)
  );
}

/**
 * Check if a route requires workspace context
 */
export function requiresWorkspaceContext(pathname: string): boolean {
  return pathname.startsWith("/ws/");
}
