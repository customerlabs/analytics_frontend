import { cache } from "react";
import { auth } from "./config";
import { redirect } from "next/navigation";

/**
 * Get current session (request-scoped cache)
 * Use this to access the full session object including accessToken
 * Deduplicates auth() calls within the same server request
 */
export const getSession = cache(async () => {
  return await auth();
});

/**
 * Get current authenticated user
 * Returns null if not authenticated
 */
export async function getUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if user is authenticated and redirect to login if not
 * Use this in protected layouts/pages
 */
export async function checkAuth() {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

/**
 * Check if user is currently authenticated (boolean)
 * Use this for conditional checks without redirect
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.user;
}
