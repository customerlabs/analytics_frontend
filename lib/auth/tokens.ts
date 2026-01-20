// Token management utilities for Keycloak authentication
// Note: This file contains both async and sync utility functions
// Server Actions that use these should import them directly

import { jwtVerify, createRemoteJWKSet } from 'jose';
import {
  keycloakConfig,
  getTokenEndpoint,
  getJwksEndpoint,
  TOKEN_REFRESH_BUFFER,
} from '@/lib/keycloak/config';
import type {
  KeycloakTokens,
  KeycloakTokenResponse,
  AccessTokenClaims,
  SessionUser,
} from '@/lib/keycloak/types';
import { getSession, updateSessionTokens } from './session';

// Cache JWKS for token verification
let jwksCache: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS() {
  if (!jwksCache) {
    jwksCache = createRemoteJWKSet(new URL(getJwksEndpoint()));
  }
  return jwksCache;
}

/**
 * Exchange authorization code for tokens
 */
export async function exchangeCodeForTokens(
  code: string,
  redirectUri: string
): Promise<KeycloakTokens> {
  const response = await fetch(getTokenEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: keycloakConfig.clientId,
      client_secret: keycloakConfig.clientSecret,
      code,
      redirect_uri: redirectUri,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data: KeycloakTokenResponse = await response.json();
  return tokenResponseToTokens(data);
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<KeycloakTokens> {
  const response = await fetch(getTokenEndpoint(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: keycloakConfig.clientId,
      client_secret: keycloakConfig.clientSecret,
      refresh_token: refreshToken,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token refresh failed: ${error}`);
  }

  const data: KeycloakTokenResponse = await response.json();
  return tokenResponseToTokens(data);
}

/**
 * Get valid access token by refreshing with the stored refresh token
 * Since we don't store the access token in session, we always refresh
 */
export async function ensureValidToken(): Promise<string> {
  const session = await getSession();

  if (!session.tokens) {
    throw new Error('No session tokens');
  }

  const now = Date.now();

  // Check if refresh token is still valid
  if (session.tokens.refreshExpiresAt <= now) {
    throw new Error('Refresh token expired');
  }

  // Get a fresh access token using refresh token
  const newTokens = await refreshAccessToken(session.tokens.refreshToken);

  // Update session with new refresh token and expiry times
  await updateSessionTokens({
    refreshToken: newTokens.refreshToken,
    expiresAt: newTokens.expiresAt,
    refreshExpiresAt: newTokens.refreshExpiresAt,
  });

  return newTokens.accessToken;
}

/**
 * Verify and decode access token
 */
export async function verifyAccessToken(token: string): Promise<AccessTokenClaims> {
  const JWKS = getJWKS();

  const { payload } = await jwtVerify(token, JWKS, {
    issuer: `${keycloakConfig.url}/realms/${keycloakConfig.realm}`,
  });

  return payload as unknown as AccessTokenClaims;
}

/**
 * Decode access token without verification (for reading claims)
 * Only use this for non-security-critical operations
 */
export function decodeAccessToken(token: string): AccessTokenClaims {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid token format');
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  return payload as AccessTokenClaims;
}

/**
 * Extract user info from access token claims
 */
export function extractUserFromClaims(claims: AccessTokenClaims): SessionUser {
  return {
    id: claims.sub,
    email: claims.email,
    name: claims.name || claims.preferred_username || claims.email,
  };
}

/**
 * Check if access token is expired
 */
export function isTokenExpired(tokens: KeycloakTokens): boolean {
  const now = Date.now();
  const bufferMs = TOKEN_REFRESH_BUFFER * 1000;
  return tokens.expiresAt <= now + bufferMs;
}

/**
 * Check if refresh token is expired
 */
export function isRefreshTokenExpired(tokens: KeycloakTokens): boolean {
  const now = Date.now();
  return tokens.refreshExpiresAt <= now;
}

/**
 * Convert Keycloak token response to our token format
 */
function tokenResponseToTokens(response: KeycloakTokenResponse): KeycloakTokens {
  const now = Date.now();
  return {
    accessToken: response.access_token,
    refreshToken: response.refresh_token,
    idToken: response.id_token,
    expiresAt: now + response.expires_in * 1000,
    refreshExpiresAt: now + response.refresh_expires_in * 1000,
  };
}

/**
 * Revoke tokens on logout
 */
export async function revokeTokens(refreshToken: string): Promise<void> {
  const revokeEndpoint = `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/revoke`;

  await fetch(revokeEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: keycloakConfig.clientId,
      client_secret: keycloakConfig.clientSecret,
      token: refreshToken,
      token_type_hint: 'refresh_token',
    }),
  });
}
