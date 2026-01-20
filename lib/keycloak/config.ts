// Keycloak configuration
// All values loaded from environment variables

export const keycloakConfig = {
  url: process.env.KEYCLOAK_URL!,
  realm: process.env.KEYCLOAK_REALM!,
  clientId: process.env.KEYCLOAK_CLIENT_ID!,
  clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
  adminClientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
  adminClientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
} as const;

// Token endpoints
export const getTokenEndpoint = () =>
  `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/token`;

export const getAuthorizationEndpoint = () =>
  `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/auth`;

export const getLogoutEndpoint = () =>
  `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/logout`;

export const getUserInfoEndpoint = () =>
  `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/userinfo`;

export const getJwksEndpoint = () =>
  `${keycloakConfig.url}/realms/${keycloakConfig.realm}/protocol/openid-connect/certs`;

// Scopes requested during authentication
export const DEFAULT_SCOPES = 'openid profile email offline_access';

// Token lifetimes (in seconds)
export const TOKEN_REFRESH_BUFFER = 60; // Refresh 60s before expiry
