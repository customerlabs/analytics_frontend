import { getUser } from "@/lib/auth";

/**
 * Server component that renders children only when user is signed in
 * Use this for conditional rendering based on auth state
 *
 * @example
 * <SignedIn>
 *   <UserProfile />
 * </SignedIn>
 */
export async function SignedIn({ children }: React.PropsWithChildren) {
  const user = await getUser();
  return user ? <>{children}</> : null;
}

/**
 * Server component that renders children only when user is NOT signed in
 * Use this for conditional rendering based on auth state
 *
 * @example
 * <SignedOut>
 *   <LoginButton />
 * </SignedOut>
 */
export async function SignedOut({ children }: React.PropsWithChildren) {
  const user = await getUser();
  return user ? null : <>{children}</>;
}
