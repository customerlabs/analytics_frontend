import { getTokenEndpoint, keycloakConfig } from './config';

export interface TokenRefreshResult {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
  token_type: string;
  scope: string;
}

export interface TokenRefreshError {
  error: string;
  error_description?: string;
}

// Map-based lock to prevent concurrent token refreshes for the same token
const refreshPromises = new Map<string, Promise<TokenRefreshResult>>();

/**
 * Refresh an access token using a Keycloak refresh token
 * Uses per-token Promise-based locking to prevent concurrent refresh requests
 * @param refreshToken - The refresh token to use
 * @returns New token set or throws on failure
 */
export async function refreshKeycloakToken(
  refreshToken: string
): Promise<TokenRefreshResult> {
  // Create a key from the token (first 20 chars is sufficient for deduplication)
  const tokenKey = refreshToken.slice(0, 20);

  // If a refresh is already in progress for THIS token, wait for it
  const existing = refreshPromises.get(tokenKey);
  if (existing) {
    console.log('Waiting for existing token refresh...');
    return existing;
  }

  console.log('Refreshing access token...');
  const promise = doActualRefresh(refreshToken);
  refreshPromises.set(tokenKey, promise);

  try {
    const result = await promise;
    console.log('Token refreshed successfully');
    return result;
  } finally {
    refreshPromises.delete(tokenKey);
  }
}

/**
 * Performs the actual token refresh request to Keycloak
 */
async function doActualRefresh(
  refreshToken: string
): Promise<TokenRefreshResult> {
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
    cache: 'no-store',
  });

  const data = await response.json();

  if (!response.ok) {
    const error = data as TokenRefreshError;
    throw new Error(
      `Token refresh failed: ${error.error} - ${error.error_description || 'Unknown error'}`
    );
  }

  return data as TokenRefreshResult;
}
