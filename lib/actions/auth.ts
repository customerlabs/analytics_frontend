'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import {
  keycloakConfig,
  getAuthorizationEndpoint,
  getLogoutEndpoint,
  DEFAULT_SCOPES,
} from '@/lib/keycloak/config';
import {
  exchangeCodeForTokens,
  verifyAccessToken,
  extractUserFromClaims,
  revokeTokens,
} from '@/lib/auth/tokens';
import {
  getSession,
  setSessionData,
  clearSession,
  isAuthenticated,
} from '@/lib/auth/session';
import { getAdminClient } from '@/lib/keycloak/admin-client';
import type { LoginResult, LogoutResult, SessionTokens } from '@/lib/keycloak/types';

// Registration result type
export interface RegisterResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Generate Keycloak login URL and redirect
 */
export async function initiateLogin(returnTo?: string): Promise<never> {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);

  // Store state and code verifier in cookies for callback
  const cookieStore = await cookies();
  cookieStore.set('oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
  });
  cookieStore.set('oauth_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10,
  });
  if (returnTo) {
    cookieStore.set('oauth_return_to', returnTo, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10,
    });
  }

  const params = new URLSearchParams({
    client_id: keycloakConfig.clientId,
    redirect_uri: `${APP_URL}/api/auth/callback`,
    response_type: 'code',
    scope: DEFAULT_SCOPES,
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  const loginUrl = `${getAuthorizationEndpoint()}?${params.toString()}`;
  redirect(loginUrl);
}

/**
 * Handle OAuth callback - exchange code for tokens
 */
export async function handleAuthCallback(
  code: string,
  state: string
): Promise<LoginResult> {
  const cookieStore = await cookies();

  // Verify state
  const storedState = cookieStore.get('oauth_state')?.value;
  if (!storedState || storedState !== state) {
    return { success: false, error: 'Invalid state parameter' };
  }

  // Get code verifier
  const codeVerifier = cookieStore.get('oauth_code_verifier')?.value;
  if (!codeVerifier) {
    return { success: false, error: 'Missing code verifier' };
  }

  // Get return URL
  const returnTo = cookieStore.get('oauth_return_to')?.value || '/';

  // Clean up OAuth cookies
  cookieStore.delete('oauth_state');
  cookieStore.delete('oauth_code_verifier');
  cookieStore.delete('oauth_return_to');

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(
      code,
      `${APP_URL}/api/auth/callback`
    );

    // Verify and decode access token
    const claims = await verifyAccessToken(tokens.accessToken);
    const user = extractUserFromClaims(claims);

    // Store only minimal token data in session (to keep cookie small)
    const sessionTokens: SessionTokens = {
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
      refreshExpiresAt: tokens.refreshExpiresAt,
    };

    // Save session with minimal data
    await setSessionData(user, sessionTokens);

    return { success: true, redirectTo: returnTo };
  } catch (error) {
    console.error('Auth callback error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed',
    };
  }
}

/**
 * Login with email and password (Resource Owner Password Grant)
 * Note: This is less secure than the authorization code flow
 * Only use if Keycloak is configured to allow it
 */
export async function loginWithCredentials(
  email: string,
  password: string
): Promise<LoginResult> {
  try {
    const response = await fetch(
      `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'password',
          client_id: keycloakConfig.clientId,
          client_secret: keycloakConfig.clientSecret,
          username: email,
          password,
          scope: DEFAULT_SCOPES,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.error_description || 'Invalid credentials',
      };
    }

    const tokenData = await response.json();
    const now = Date.now();

    // Verify and decode access token to get user info
    const claims = await verifyAccessToken(tokenData.access_token);
    const user = extractUserFromClaims(claims);

    // Store only minimal token data in session (to keep cookie small)
    const sessionTokens: SessionTokens = {
      refreshToken: tokenData.refresh_token,
      expiresAt: now + tokenData.expires_in * 1000,
      refreshExpiresAt: now + tokenData.refresh_expires_in * 1000,
    };

    // Save session with minimal data
    await setSessionData(user, sessionTokens);

    return { success: true, redirectTo: '/' };
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed',
    };
  }
}

/**
 * Logout - clear session and redirect to Keycloak logout
 */
export async function logout(): Promise<LogoutResult> {
  try {
    const session = await getSession();

    // Revoke tokens if we have them
    if (session.tokens?.refreshToken) {
      await revokeTokens(session.tokens.refreshToken);
    }

    // Clear session
    await clearSession();

    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear session even if revoke fails
    await clearSession();
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Logout failed',
    };
  }
}

/**
 * Logout and redirect to Keycloak logout endpoint
 */
export async function logoutAndRedirect(): Promise<never> {
  await logout();

  // Redirect to Keycloak logout (without id_token_hint since we don't store it)
  const params = new URLSearchParams({
    post_logout_redirect_uri: `${APP_URL}/login`,
  });

  const logoutUrl = `${getLogoutEndpoint()}?${params.toString()}`;
  redirect(logoutUrl);
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
      emailVerified: true, // Set to false if you want email verification
      enabled: true,
      firstName,
      lastName,
      username: email, // Use email as username
      credentials: [
        {
          type: 'password',
          value: password,
          temporary: false,
        },
      ],
    });

    // If user was created successfully, log them in
    if (createdUser.id) {
      // Use the password grant to get tokens for the new user
      const loginResult = await loginWithCredentials(email, password);

      if (loginResult.success) {
        return {
          success: true,
          redirectTo: '/workspaces?redirect=/',
        };
      } else {
        // User was created but login failed - they can still login manually
        return {
          success: true,
          redirectTo: '/login?message=account_created',
        };
      }
    }

    return {
      success: false,
      error: 'Failed to create account',
    };
  } catch (error) {
    console.error('Registration error:', error);

    // Handle specific Keycloak errors
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
export async function checkAuth(): Promise<boolean> {
  return isAuthenticated();
}

/**
 * Get current authenticated user
 */
export async function getCurrentAuthUser() {
  const session = await getSession();
  return session.user;
}

// ============================================
// Helper functions for PKCE
// ============================================

function generateState(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(digest));
}

function base64UrlEncode(buffer: Uint8Array): string {
  const base64 = Buffer.from(buffer).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
