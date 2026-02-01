import { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
    } & DefaultSession["user"];
    accessToken?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: number;
  }
}
