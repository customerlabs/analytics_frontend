// Keycloak types for authentication and authorization

// ============================================
// Role Types
// ============================================

export type WorkspaceRole = 'workspace-admin' | 'workspace-billing' | 'workspace-member';
export type AccountRole = 'account-admin' | 'account-editor' | 'account-viewer';

// ============================================
// Token Types
// ============================================

export interface KeycloakTokens {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  expiresAt: number; // Unix timestamp in milliseconds
  refreshExpiresAt: number;
}

export interface KeycloakTokenResponse {
  access_token: string;
  refresh_token: string;
  id_token: string;
  expires_in: number;
  refresh_expires_in: number;
  token_type: string;
  scope: string;
}

export interface KeycloakUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
}

// Decoded access token claims
export interface AccessTokenClaims {
  sub: string;
  email: string;
  email_verified: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  preferred_username?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: {
    [clientId: string]: {
      roles: string[];
    };
  };
  // Custom claims
  workspaces?: string[];
  iat: number;
  exp: number;
  iss: string;
  aud: string | string[];
}

// ============================================
// User Types
// ============================================

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  firstName?: string;
  lastName?: string;
}

// ============================================
// Workspace & Account Types
// ============================================

export interface Workspace {
  id: string;
  slug: string;
  name: string;
  role: WorkspaceRole;
}

export interface Account {
  id: string;
  workspaceId: string;
  name: string;
  role: AccountRole;
}

// ============================================
// Permission Types
// ============================================

export interface AccountPermission {
  role: AccountRole;
}

export interface WorkspacePermission {
  role: WorkspaceRole;
  accounts: Record<string, AccountPermission>;
}

export interface UserPermissions {
  userId: string;
  workspaces: Record<string, WorkspacePermission>;
}

// ============================================
// Session Types
// ============================================

export interface SessionUser {
  id: string;
  email: string;
  name: string;
}

// Minimal token data for session storage (to keep cookie size small)
export interface SessionTokens {
  refreshToken: string;
  expiresAt: number;
  refreshExpiresAt: number;
}

export interface SessionData {
  user: SessionUser | null;
  tokens: SessionTokens | null;
}

// ============================================
// Keycloak Group Types (for Admin API)
// ============================================

export interface KeycloakGroup {
  id: string;
  name: string;
  path: string;
  attributes?: Record<string, string[]>;
  subGroups?: KeycloakGroup[];
}

export interface KeycloakGroupMembership {
  groupId: string;
  groupPath: string;
  groupName: string;
  roles: string[];
}

// ============================================
// Auth Action Results
// ============================================

export interface LoginResult {
  success: boolean;
  error?: string;
  redirectTo?: string;
}

export interface LogoutResult {
  success: boolean;
  error?: string;
}

// ============================================
// Permission Check Types
// ============================================

export type PermissionLevel = 'workspace' | 'account';

export interface PermissionCheckResult {
  hasAccess: boolean;
  role?: WorkspaceRole | AccountRole;
  reason?: string;
}
