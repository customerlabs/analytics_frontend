import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import { NextResponse } from "next/server";
import { LoginSchema } from "@/schemas/loginSchema";

// Minimal auth config for middleware
const { auth } = NextAuth({
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
    }),
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const validated = LoginSchema.safeParse(credentials);
        if (!validated.success) return null;

        const { email, password } = validated.data;

        const response = await fetch(
          `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "password",
              client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
              client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
              username: email,
              password,
              scope: "openid profile email",
            }),
          }
        );

        if (!response.ok) return null;

        const tokens = await response.json();
        const payload = JSON.parse(
          Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
        );

        return {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.preferred_username,
        };
      },
    }),
  ],
});

const WORKSPACE_COOKIE = "analytics_workspace";

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
      // Check for workspace cookie to redirect to correct workspace
      const wsFromCookie = req.cookies.get(WORKSPACE_COOKIE)?.value;
      const redirectUrl = wsFromCookie
        ? `/ws/${wsFromCookie}`
        : "/ws";
      return NextResponse.redirect(new URL(redirectUrl, baseUrl));
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

  // Handle workspace-scoped routes - set workspace cookie from path
  if (pathname.startsWith("/ws/")) {
    const wsFromPath = pathname.split("/")[2];
    if (wsFromPath) {
      const response = NextResponse.next();
      response.cookies.set(WORKSPACE_COOKIE, wsFromPath, {
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
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.well-known).*)",
  ],
};
