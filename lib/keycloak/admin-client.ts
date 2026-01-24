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

/**
 * Get user by ID
 */
export async function getUserById(userId: string) {
  const client = await getAdminClient();
  return client.users.findOne({ id: userId });
}

/**
 * Get user by email
 */
export async function getUserByEmail(email: string) {
  const client = await getAdminClient();
  const users = await client.users.find({ email, exact: true });
  return users[0] || null;
}

/**
 * Get all groups a user belongs to
 */
export async function getUserGroups(userId: string) {
  const client = await getAdminClient();
  return client.users.listGroups({ id: userId });
}

/**
 * Get group by ID
 */
export async function getGroupById(groupId: string) {
  const client = await getAdminClient();
  return client.groups.findOne({ id: groupId });
}

/**
 * Get group by path (e.g., "/workspace:acme-corp")
 */
export async function getGroupByPath(path: string) {
  const client = await getAdminClient();
  const groups = await client.groups.find({ search: path });
  return groups.find((g) => g.path === path) || null;
}

/**
 * Get all workspace groups (top-level groups with type="workspace")
 */
export async function getWorkspaceGroups() {
  const client = await getAdminClient();
  const groups = await client.groups.find({ briefRepresentation: false });

  return groups.filter((group) => {
    const type = group.attributes?.type?.[0];
    return type === 'workspace';
  });
}

/**
 * Get accounts in a workspace (subgroups with type="account")
 */
export async function getAccountsInWorkspace(workspaceGroupId: string) {
  const client = await getAdminClient();
  const workspace = await client.groups.findOne({ id: workspaceGroupId });

  if (!workspace?.subGroups) return [];

  return workspace.subGroups.filter((subgroup) => {
    const type = subgroup.attributes?.type?.[0];
    return type === 'account';
  });
}

/**
 * Get role mappings for a group
 */
export async function getGroupRoleMappings(groupId: string) {
  const client = await getAdminClient();
  return client.groups.listRoleMappings({ id: groupId });
}

/**
 * Add user to a group
 */
export async function addUserToGroup(userId: string, groupId: string) {
  const client = await getAdminClient();
  await client.users.addToGroup({ id: userId, groupId });
}

/**
 * Remove user from a group
 */
export async function removeUserFromGroup(userId: string, groupId: string) {
  const client = await getAdminClient();
  await client.users.delFromGroup({ id: userId, groupId });
}

/**
 * Create a new workspace group
 */
export async function createWorkspaceGroup(name: string, slug: string) {
  const client = await getAdminClient();

  const group = await client.groups.create({
    name: `workspace:${slug}`,
    attributes: {
      type: ['workspace'],
      displayName: [name],
      slug: [slug],
      createdAt: [new Date().toISOString()],
    },
  });

  return group;
}

/**
 * Create an account group within a workspace
 */
export async function createAccountGroup(
  workspaceGroupId: string,
  name: string,
  accountId: string
) {
  const client = await getAdminClient();

  // Get workspace to add as child
  const workspace = await client.groups.findOne({ id: workspaceGroupId });
  if (!workspace) throw new Error('Workspace not found');

  // Create subgroup
  const group = await client.groups.createChildGroup(
    { id: workspaceGroupId },
    {
      name: `account:${accountId}`,
      attributes: {
        type: ['account'],
        displayName: [name],
        accountId: [accountId],
        workspaceId: [workspaceGroupId],
        createdAt: [new Date().toISOString()],
      },
    }
  );

  return group;
}

/**
 * Get client ID for the admin client (needed for role mappings)
 */
export async function getAnalyticsClientId(): Promise<string> {
  const client = await getAdminClient();
  const clients = await client.clients.find({
    clientId: keycloakConfig.adminClientId,
  });

  if (!clients[0]?.id) {
    throw new Error(`Client ${keycloakConfig.adminClientId} not found`);
  }

  return clients[0].id;
}

/**
 * Get available client roles
 */
export async function getClientRoles() {
  const client = await getAdminClient();
  const clientUuid = await getAnalyticsClientId();
  return client.clients.listRoles({ id: clientUuid });
}

/**
 * Assign a client role to a group
 */
export async function assignRoleToGroup(groupId: string, roleName: string) {
  const client = await getAdminClient();
  const clientUuid = await getAnalyticsClientId();

  // Find the role
  const roles = await client.clients.listRoles({ id: clientUuid });
  const role = roles.find((r) => r.name === roleName);

  if (!role) {
    throw new Error(`Role ${roleName} not found`);
  }

  // Assign role to group
  await client.groups.addClientRoleMappings({
    id: groupId,
    clientUniqueId: clientUuid,
    roles: [{ id: role.id!, name: role.name! }],
  });
}
