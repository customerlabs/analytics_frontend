import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  // Extend User to include Keycloak tokens (for Credentials provider)
  interface User extends DefaultUser {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    refreshExpiresAt?: number;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
    accessToken?: string;
    expiresAt?: number;
    refreshExpiresAt?: number;
    error?: "RefreshTokenError";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
    refreshExpiresAt?: number; // When refresh token expires
    error?: "RefreshTokenError";
  }
}
