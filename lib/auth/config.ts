import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthConfig } from "next-auth";
import { LoginSchema } from "@/schemas/loginSchema";
import { DEFAULT_SCOPES } from "./keycloak/config";

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

        const payload = JSON.parse(
          Buffer.from(tokens.access_token.split(".")[1], "base64").toString()
        );

        return {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.preferred_username,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
        };
      },
    }),
  ],
} satisfies NextAuthConfig;

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  pages: { signIn: "/login" },
  trustHost: true,
  callbacks: {
    jwt: async ({ token, account, user, profile }) => {
      // OAuth flow - store tokens from Keycloak
      if (account?.access_token) {
        return {
          ...token,
          accessToken: account.access_token,
          refreshToken: account.refresh_token,
          expiresAt: account.expires_at,
          id: profile?.sub,
        };
      }

      // Credentials flow - tokens from user object
      if (user && "accessToken" in user) {
        return {
          ...token,
          accessToken: user.accessToken,
          refreshToken: user.refreshToken,
          expiresAt: user.expiresAt,
          id: user.id,
        };
      }

      // Check if token expired and refresh needed
      if (
        token.expiresAt &&
        Date.now() >= (token.expiresAt as number) * 1000 &&
        token.refreshToken
      ) {
        try {
          const response = await fetch(
            `${process.env.KEYCLOAK_URL}/realms/${process.env.KEYCLOAK_REALM}/protocol/openid-connect/token`,
            {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "refresh_token",
                client_id: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
                client_secret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
                refresh_token: token.refreshToken as string,
              }),
            }
          );

          if (response.ok) {
            const tokens = await response.json();
            return {
              ...token,
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token ?? token.refreshToken,
              expiresAt: Math.floor(Date.now() / 1000) + tokens.expires_in,
            };
          }

          // Token refresh failed - signal error (per Auth.js docs)
          console.error("Token refresh failed with status:", response.status);
          return { ...token, error: "RefreshTokenError" as const };
        } catch (error) {
          console.error("Token refresh failed:", error);
          return { ...token, error: "RefreshTokenError" as const };
        }
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.accessToken = token.accessToken as string;
      }
      // Propagate refresh error to session (per Auth.js docs)
      if (token.error === "RefreshTokenError") {
        session.error = "RefreshTokenError";
      }
      return session;
    },
  },
});
