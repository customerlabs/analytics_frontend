import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import {
  DEFAULT_LOGIN_REDIRECT,
  apiAuthPrefix,
  authRoutes,
  protectedRoutes,
} from "@/config/routes";

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;

  // TODO: Integrate with your auth solution to check login status
  // For now, this assumes no auth integration - update when auth is configured
  const isLoggedIn = false;

  // Get the base URL from environment variable or use the request origin
  const baseUrl = process.env.NEXTAUTH_URL || nextUrl.origin;

  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  const isProtectedRoute = protectedRoutes.includes(nextUrl.pathname);
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);

  // Check and set default language if not set
  const cookieStore = await cookies();
  const languageCookie = cookieStore.get("language");

  if (!languageCookie) {
    const response = NextResponse.next();
    // Set cookie to expire in 1 year
    const oneYearFromNow = new Date();
    oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

    response.cookies.set("language", "english", {
      path: "/",
      expires: oneYearFromNow,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    });
    return response;
  }

  if (isApiAuthRoute) {
    // For API routes, ensure we have a proper base URL
    nextUrl.protocol = new URL(baseUrl).protocol;
    nextUrl.host = new URL(baseUrl).host;
    return NextResponse.next();
  }

  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL(DEFAULT_LOGIN_REDIRECT, baseUrl));
    }
    return NextResponse.next();
  }

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", baseUrl));
  }

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
