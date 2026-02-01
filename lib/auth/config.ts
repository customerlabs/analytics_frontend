import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "@/schemas/loginSchema";
import { refreshKeycloakToken } from "./keycloak/token-refresh";
import { TOKEN_REFRESH_BUFFER, DEFAULT_SCOPES } from "./keycloak/config";

// Provider configuration
const authConfig = {
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
      issuer: `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}`,
      authorization: {
        params: { scope: DEFAULT_SCOPES },
      },
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

        // Direct token request to Keycloak using Resource Owner Password Grant
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
              scope: DEFAULT_SCOPES,
            }),
          }
        );

        if (!response.ok) return null;

        const tokens = await response.json();

        // Decode user info from access token
        const payload = JSON.parse(
          Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
        );

        return {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.preferred_username,
          // Include Keycloak tokens for the JWT callback
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
          refreshExpiresAt: tokens.refresh_expires_in
            ? Math.floor(Date.now() / 1000) + tokens.refresh_expires_in
            : undefined,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;

// NextAuth configuration and exports
export const {
  handlers,
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 }, // 30 days
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    jwt: async ({ token, account, user, profile }) => {
      // === INITIAL SIGN-IN: Store tokens ===

      // OAuth flow (Keycloak button) - tokens come from account
      if (account?.access_token) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          // Keycloak provides refresh_expires_in (seconds), convert to absolute timestamp
          refreshExpiresAt: account.refresh_expires_at as number | undefined,
          id: profile?.sub,
          error: undefined,
        };
      }

      // Credentials flow (username/password) - tokens come from user object
      if (user && 'accessToken' in user && user.accessToken) {
        return {
          ...token,
          accessToken: user.accessToken as string,
          refreshToken: user.refreshToken as string,
          expiresAt: user.expiresAt as number,
          refreshExpiresAt: user.refreshExpiresAt as number | undefined,
          id: user.id,
          error: undefined,
        };
      }

      // === SUBSEQUENT REQUESTS: Check expiration and refresh if needed ===

      // If no expiresAt, we can't check expiration - return token as-is
      if (!token.expiresAt) {
        return token;
      }

      // Calculate if token is still valid (with buffer)
      const expiresAtMs = (token.expiresAt as number) * 1000;
      const bufferMs = TOKEN_REFRESH_BUFFER * 1000;
      const shouldRefresh = Date.now() >= expiresAtMs - bufferMs;

      // Token is still valid, return as-is
      if (!shouldRefresh) {
        return token;
      }

      // === TOKEN REFRESH NEEDED ===

      // Can't refresh without a refresh token
      if (!token.refreshToken) {
        console.error("Token expired but no refresh token available");
        return {
          ...token,
          error: "RefreshTokenError" as const,
        };
      }

      // Check if refresh token itself is expired
      if (token.refreshExpiresAt) {
        const refreshExpired = Date.now() >= (token.refreshExpiresAt as number) * 1000;
        if (refreshExpired) {
          console.error("Refresh token has expired, user must re-login");
          return {
            ...token,
            error: "RefreshTokenError" as const,
          };
        }
      }

      try {
        const refreshedTokens = await refreshKeycloakToken(token.refreshToken as string);

        return {
          ...token,
          accessToken: refreshedTokens.access_token,
          expiresAt: Math.floor(Date.now() / 1000) + refreshedTokens.expires_in,
          // Keycloak may or may not return a new refresh token
          refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
          // Update refresh token expiry if provided
          refreshExpiresAt: refreshedTokens.refresh_expires_in
            ? Math.floor(Date.now() / 1000) + refreshedTokens.refresh_expires_in
            : token.refreshExpiresAt,
          error: undefined,
        };
      } catch (error) {
        console.error("Error refreshing access token:", error);

        // Return the token with an error flag
        return {
          ...token,
          error: "RefreshTokenError" as const,
        };
      }
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
        session.expiresAt = token.expiresAt as number | undefined;
        session.refreshExpiresAt = token.refreshExpiresAt as number | undefined;
        session.error = token.error as "RefreshTokenError" | undefined;
      }
      return session;
    },
  },
});
