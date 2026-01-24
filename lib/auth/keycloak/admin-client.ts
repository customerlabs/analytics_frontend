'use server';

import KcAdminClient from '@keycloak/keycloak-admin-client';
import { keycloakConfig } from './config';

// Singleton instance and token expiry tracking
let adminClient: KcAdminClient | null = null;
let tokenExpiresAt = 0;

/**
 * Get a singleton Keycloak Admin Client instance.
 * Automatically refreshes the token if expired.
 * This should only be used in server-side code (Server Actions, API routes).
 *
 * Currently only used for user registration in lib/auth/actions.ts
 */
export async function getAdminClient(): Promise<KcAdminClient> {
  const now = Date.now();

  // Return existing client if token is still valid (with 5min buffer)
  if (adminClient && now < tokenExpiresAt - 5 * 60 * 1000) {
    return adminClient;
  }

  // Create new client or re-authenticate
  if (!adminClient) {
    adminClient = new KcAdminClient({
      baseUrl: keycloakConfig.url,
      realmName: keycloakConfig.realm,
    });
  }

  // Authenticate using client credentials
  await adminClient.auth({
    grantType: 'client_credentials',
    clientId: keycloakConfig.adminClientId,
    clientSecret: keycloakConfig.adminClientSecret,
  });

  // Set token expiry (assume 60 min token lifetime, use 55 min to be safe)
  tokenExpiresAt = now + 55 * 60 * 1000;

  return adminClient;
}
