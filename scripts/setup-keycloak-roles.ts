/**
 * Setup Keycloak Client Roles
 *
 * This script creates the required client roles for the admin client.
 * It is idempotent - safe to run multiple times without creating duplicates.
 *
 * Usage:
 *   npx tsx scripts/setup-keycloak-roles.ts
 *
 * Required environment variables (via .env or .env.local):
 *   - KEYCLOAK_URL
 *   - KEYCLOAK_REALM
 *   - KEYCLOAK_ADMIN_CLIENT_ID
 *   - KEYCLOAK_ADMIN_CLIENT_SECRET
 */

import KcAdminClient from '@keycloak/keycloak-admin-client';
import type RoleRepresentation from '@keycloak/keycloak-admin-client/lib/defs/roleRepresentation';

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });
config({ path: '.env' });

// Keycloak configuration from environment
const keycloakConfig = {
  url: process.env.KEYCLOAK_URL!,
  realm: process.env.KEYCLOAK_REALM!,
  clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
  adminClientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID!,
  adminClientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET!,
};

// Client roles to create with descriptions
const CLIENT_ROLES: Array<{ name: string; description: string }> = [
  {
    name: 'workspace-admin',
    description: 'Full administrative access to workspace settings, billing, and member management',
  },
  {
    name: 'workspace-billing',
    description: 'Access to workspace billing and subscription management',
  },
  {
    name: 'workspace-member',
    description: 'Basic workspace membership with access to assigned accounts',
  },
  {
    name: 'account-admin',
    description: 'Full administrative access to a specific account',
  },
  {
    name: 'account-editor',
    description: 'Edit access to account data and configurations',
  },
  {
    name: 'account-viewer',
    description: 'Read-only access to account data',
  },
];

/**
 * Validates that all required environment variables are set
 */
function validateEnvironment(): void {
  const required = [
    'KEYCLOAK_URL',
    'KEYCLOAK_REALM',
    'KEYCLOAK_ADMIN_CLIENT_ID',
    'KEYCLOAK_ADMIN_CLIENT_SECRET',
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:');
    missing.forEach((key) => console.error(`  - ${key}`));
    console.error('\nPlease set these in .env.local or .env');
    process.exit(1);
  }
}

/**
 * Creates a Keycloak Admin Client and authenticates
 */
async function createAdminClient(): Promise<KcAdminClient> {
  const client = new KcAdminClient({
    baseUrl: keycloakConfig.url,
    realmName: keycloakConfig.realm,
  });

  await client.auth({
    grantType: 'client_credentials',
    clientId: keycloakConfig.adminClientId,
    clientSecret: keycloakConfig.adminClientSecret,
  });

  return client;
}

/**
 * Gets the internal UUID for the analytics-app client
 */
async function getClientUuid(client: KcAdminClient): Promise<string> {
  const clients = await client.clients.find({
    clientId: keycloakConfig.clientId,
  });

  if (!clients[0]?.id) {
    throw new Error(
      `Client '${keycloakConfig.clientId}' not found in realm '${keycloakConfig.realm}'. ` +
        'Please ensure the client exists in Keycloak.'
    );
  }

  return clients[0].id;
}

/**
 * Gets existing roles for a client
 */
async function getExistingRoles(
  client: KcAdminClient,
  clientUuid: string
): Promise<Map<string, RoleRepresentation>> {
  const roles = await client.clients.listRoles({ id: clientUuid });
  return new Map(roles.map((role) => [role.name!, role]));
}

/**
 * Creates a client role if it doesn't exist
 */
async function createRoleIfNotExists(
  client: KcAdminClient,
  clientUuid: string,
  roleDef: { name: string; description: string },
  existingRoles: Map<string, RoleRepresentation>
): Promise<{ created: boolean; role: string }> {
  if (existingRoles.has(roleDef.name)) {
    return { created: false, role: roleDef.name };
  }

  await client.clients.createRole({
    id: clientUuid,
    name: roleDef.name,
    description: roleDef.description,
  });

  return { created: true, role: roleDef.name };
}

/**
 * Main setup function
 */
async function main(): Promise<void> {
  console.log('='.repeat(60));
  console.log('Keycloak Client Roles Setup');
  console.log('='.repeat(60));
  console.log();

  // Validate environment
  validateEnvironment();

  console.log(`Keycloak URL: ${keycloakConfig.url}`);
  console.log(`Realm: ${keycloakConfig.realm}`);
  console.log(`Target Client (admin): ${keycloakConfig.clientId}`);
  console.log();

  try {
    // Connect to Keycloak
    console.log('Connecting to Keycloak...');
    const adminClient = await createAdminClient();
    console.log('Connected successfully.');
    console.log();

    // Get client UUID
    console.log(`Looking up admin client '${keycloakConfig.clientId}'...`);
    const clientUuid = await getClientUuid(adminClient);
    console.log(`Found client with UUID: ${clientUuid}`);
    console.log();

    // Get existing roles
    console.log('Fetching existing client roles...');
    const existingRoles = await getExistingRoles(adminClient, clientUuid);
    console.log(`Found ${existingRoles.size} existing role(s).`);
    console.log();

    // Create roles
    console.log('Processing roles:');
    console.log('-'.repeat(40));

    let createdCount = 0;
    let skippedCount = 0;

    for (const roleDef of CLIENT_ROLES) {
      const result = await createRoleIfNotExists(
        adminClient,
        clientUuid,
        roleDef,
        existingRoles
      );

      if (result.created) {
        console.log(`  [CREATED] ${result.role}`);
        createdCount++;
      } else {
        console.log(`  [EXISTS]  ${result.role}`);
        skippedCount++;
      }
    }

    console.log('-'.repeat(40));
    console.log();

    // Summary
    console.log('Summary:');
    console.log(`  - Roles created: ${createdCount}`);
    console.log(`  - Roles already existed: ${skippedCount}`);
    console.log(`  - Total roles configured: ${CLIENT_ROLES.length}`);
    console.log();

    // Verify final state
    console.log('Verifying final state...');
    const finalRoles = await getExistingRoles(adminClient, clientUuid);
    const configuredRoles = CLIENT_ROLES.map((r) => r.name);
    const missingRoles = configuredRoles.filter((name) => !finalRoles.has(name));

    if (missingRoles.length === 0) {
      console.log('All roles are present. Setup complete.');
    } else {
      console.error('Warning: Some roles are missing after setup:');
      missingRoles.forEach((role) => console.error(`  - ${role}`));
      process.exit(1);
    }

    console.log();
    console.log('='.repeat(60));
    console.log('Setup completed successfully!');
    console.log('='.repeat(60));
  } catch (error) {
    console.error();
    console.error('='.repeat(60));
    console.error('Setup failed with error:');
    console.error('='.repeat(60));

    if (error instanceof Error) {
      console.error(`Error: ${error.message}`);

      // Provide helpful hints for common errors
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        console.error('\nHint: Check that KEYCLOAK_ADMIN_CLIENT_ID and KEYCLOAK_ADMIN_CLIENT_SECRET are correct.');
        console.error('The admin client needs the "manage-clients" role in the realm.');
      } else if (error.message.includes('ECONNREFUSED') || error.message.includes('ENOTFOUND')) {
        console.error('\nHint: Check that KEYCLOAK_URL is correct and Keycloak is running.');
      } else if (error.message.includes('not found')) {
        console.error('\nHint: Check that KEYCLOAK_REALM and KEYCLOAK_ADMIN_CLIENT_ID are correct.');
      }
    } else {
      console.error(error);
    }

    process.exit(1);
  }
}

// Run the script
main();
