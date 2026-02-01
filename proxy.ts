import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const protectedRoutes = ["/", "/ws", "/accounts", "/settings"];
const authRoutes = ["/login", "/sign-up", "/forget-password"];

// Next.js 16: Export as 'proxy' instead of 'middleware'
export const proxy = auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const pathname = nextUrl.pathname;

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || nextUrl.origin;

  // Skip for static files and API routes (except auth API)
  if (
    pathname.startsWith("/_next") ||
    (pathname.startsWith("/api") && !pathname.startsWith("/api/auth")) ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Auth routes: redirect logged-in users away
  if (authRoutes.includes(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/ws", baseUrl));
    }
    return NextResponse.next();
  }


  // Protected app routes: require authentication
  const isProtected = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (isProtected && !isLoggedIn) {
    const loginUrl = new URL("/login", baseUrl);
    loginUrl.searchParams.set("returnTo", pathname + nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.well-known).*)",
  ],
};
