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

// Promise-based lock to prevent concurrent token refreshes
let refreshPromise: Promise<TokenRefreshResult> | null = null;

/**
 * Refresh an access token using a Keycloak refresh token
 * Uses Promise-based locking to prevent concurrent refresh requests
 * @param refreshToken - The refresh token to use
 * @returns New token set or throws on failure
 */
export async function refreshKeycloakToken(
  refreshToken: string
): Promise<TokenRefreshResult> {
  // If a refresh is already in progress, wait for it
  if (refreshPromise) {
    console.log('Waiting for existing token refresh...');
    return refreshPromise;
  }

  console.log('Refreshing access token...');
  refreshPromise = doActualRefresh(refreshToken);

  try {
    const result = await refreshPromise;
    console.log('Token refreshed successfully');
    return result;
  } finally {
    refreshPromise = null;
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
