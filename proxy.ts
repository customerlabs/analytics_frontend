import { NextRequest, NextResponse } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions } from "@/lib/auth/session-config";
import type { SessionData } from "@/lib/keycloak/types";
import { authRoutes } from "@/config/routes";

const WORKSPACE_COOKIE = "analytics_workspace";

// Routes that require workspace context (will add ?ws= param)
const workspaceRoutes = ["/", "/accounts", "/settings"];

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname, searchParams } = nextUrl;

  // Get the base URL from environment variable or use the request origin
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || nextUrl.origin;

  // Skip proxy for static files and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.includes(".") // Static files like .ico, .png, etc.
  ) {
    return NextResponse.next();
  }

  // Get session from iron-session
  const session = await getIronSession<SessionData>(
    request.cookies as any,
    sessionOptions
  );

  // Check for actual session data - both user and tokens must exist and have values
  const isLoggedIn = !!(session.user && session.tokens);

  // Define route types
  const isAuthRoute = authRoutes.includes(pathname);
  const isWorkspacesRoute =
    pathname === "/workspaces" || pathname.startsWith("/workspaces/");

  // App routes that require authentication
  const isAppRoute =
    pathname === "/" ||
    pathname.startsWith("/accounts") ||
    pathname.startsWith("/settings");

  // ============================================
  // Handle auth routes (login, sign-up, etc.)
  // ============================================
  if (isAuthRoute) {
    if (isLoggedIn) {
      // Redirect authenticated users away from auth pages
      const wsFromCookie = request.cookies.get(WORKSPACE_COOKIE)?.value;
      const redirectUrl = wsFromCookie
        ? `/?ws=${wsFromCookie}`
        : "/workspaces";
      return NextResponse.redirect(new URL(redirectUrl, baseUrl));
    }
    // Not logged in - allow access to auth pages
    return NextResponse.next();
  }

  // ============================================
  // Handle workspaces routes
  // ============================================
  if (isWorkspacesRoute) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login", baseUrl));
    }
    return NextResponse.next();
  }

  // ============================================
  // Handle app routes - require authentication
  // ============================================
  if (isAppRoute) {
    if (!isLoggedIn) {
      const loginUrl = new URL("/login", baseUrl);
      loginUrl.searchParams.set("returnTo", pathname + nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }

    // ============================================
    // Handle workspace context for workspace-level routes
    // ============================================
    const requiresWorkspace = workspaceRoutes.some(
      (route) => pathname === route || pathname.startsWith(route + "/")
    );

    // Account detail pages don't need workspace context
    const isAccountDetail = /^\/accounts\/[^/]+/.test(pathname);

    if (requiresWorkspace && !isAccountDetail) {
      const wsParam = searchParams.get("ws");
      const wsCookie = request.cookies.get(WORKSPACE_COOKIE)?.value;

      // If no workspace in URL or cookie, redirect to workspace selector
      if (!wsParam && !wsCookie) {
        const workspacesUrl = new URL("/workspaces", baseUrl);
        workspacesUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(workspacesUrl);
      }

      // If workspace in cookie but not in URL, add to URL
      if (!wsParam && wsCookie) {
        const newUrl = new URL(request.url);
        newUrl.searchParams.set("ws", wsCookie);
        return NextResponse.redirect(newUrl);
      }

      // If workspace in URL, update cookie
      if (wsParam) {
        const response = NextResponse.next();
        response.cookies.set(WORKSPACE_COOKIE, wsParam, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          maxAge: 60 * 60 * 24 * 365, // 1 year
          path: "/",
        });
        return response;
      }
    }

    return NextResponse.next();
  }

  // All other routes - allow through
  return NextResponse.next();
}

// Proxy matcher configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - robots.txt (SEO)
     * - sitemap.xml (SEO)
     * - .well-known (security & verification)
     * - public verification files (google, bing, etc)
     */
    {
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.well-known|google[a-zA-Z0-9]+\.html|BingSiteAuth\.xml).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
