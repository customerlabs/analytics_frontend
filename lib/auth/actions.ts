'use server';

import { signIn, signOut, auth } from "./config";
import { AuthError } from "next-auth";
import { getAdminClient } from './keycloak/admin-client';

// Login state type for useActionState
export type LoginState = {
  error?: string;
  success?: string;
  redirect?: string;
} | null;

// Registration result type
export interface RegisterResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

// Backend user response type
interface BackendUser {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Sync user to backend database after login
 * The backend auto-creates the user on first API call using JWT claims
 * TODO: Call this from NextAuth signIn callback when access token is available
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function syncUserToBackend(accessToken: string): Promise<BackendUser | null> {
  try {
    const baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${baseUrl}/api/v1/users/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Backend sync failed: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to sync user to backend:', error);
    return null;
  }
}

/**
 * Login action for useActionState - credentials login
 */
export const loginAction = async (
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    return { success: "Logged in successfully", redirect: "/auth/post-login" };
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { error: "Invalid credentials" };
        default:
          return { error: "An authentication error occurred" };
      }
    }
    return { error: "An unexpected error occurred" };
  }
};

/**
 * Initiate Keycloak OAuth login
 */
export async function initiateKeycloakLogin(returnTo?: string): Promise<never> {
  await signIn("keycloak", { redirectTo: returnTo || "/auth/post-login" });
  // signIn with redirect throws NEXT_REDIRECT, this line won't be reached
  throw new Error("Redirect failed");
}

// Alias for backwards compatibility
export const initiateLogin = initiateKeycloakLogin;

/**
 * Logout action
 */
export const logoutAction = async (): Promise<{ success: boolean }> => {
  await signOut({ redirect: false });
  return { success: true };
};

/**
 * Logout and redirect
 */
export async function logoutAndRedirect(): Promise<never> {
  await signOut({ redirectTo: "/login" });
  throw new Error("Redirect failed");
}

/**
 * Register a new user via Keycloak Admin API
 * Creates the user and then auto-logs them in
 */
export async function registerUser(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<RegisterResult> {
  try {
    const adminClient = await getAdminClient();

    // Check if user already exists
    const existingUsers = await adminClient.users.find({
      email,
      exact: true
    });

    if (existingUsers.length > 0) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    // Create the user
    const createdUser = await adminClient.users.create({
      email,
      emailVerified: true,
      enabled: true,
      firstName,
      lastName,
      username: email,
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    });

    if (createdUser.id) {
      // User created, redirect to login
      return {
        success: true,
        redirectTo: '/login?message=account_created',
      };
    }

    return {
      success: false,
      error: 'Failed to create account',
    };
  } catch (error) {
    console.error('Registration error:', error);

    if (error instanceof Error) {
      if (error.message.includes('409') || error.message.includes('Conflict')) {
        return {
          success: false,
          error: 'An account with this email already exists',
        };
      }
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed',
    };
  }
}

/**
 * Check if user is currently authenticated
 */
export async function checkAuthAction(): Promise<boolean> {
  const session = await auth();
  return !!session?.user;
}

/**
 * Get current authenticated user
 */
export async function getCurrentAuthUser() {
  const session = await auth();
  return session?.user ?? null;
}
