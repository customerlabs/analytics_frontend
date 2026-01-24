'use server';

import { revalidatePath } from 'next/cache';
import { getSession } from '@/lib/auth';
import {
  createOrganization as createOrgAPI,
  updateOrganization as updateOrgAPI,
  deleteOrganization as deleteOrgAPI,
  listOrganizations as listOrgsAPI,
  getOrganization as getOrgAPI,
  type OrganizationWithRole,
  type OrganizationDetail,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
} from '@/lib/api/organizations';
import {
  addOrganizationMember as addMemberAPI,
  updateOrganizationMemberRole as updateMemberRoleAPI,
  removeOrganizationMember as removeMemberAPI,
  listOrganizationMembers as listMembersAPI,
  type OrganizationMemberResponse,
  type AddOrgMemberInput,
} from '@/lib/api/organization-members';
import { type OrganizationRole } from '@/lib/api/organizations';

// ============================================
// Result Types
// ============================================

interface CreateOrganizationResult {
  success: boolean;
  organizationId?: string;
  error?: string;
}

interface ActionResult {
  success: boolean;
  error?: string;
}

// ============================================
// Organization CRUD Actions
// ============================================

/**
 * Create a new organization via backend API
 * The current user automatically becomes the owner
 */
export async function createOrganization(
  name: string
): Promise<CreateOrganizationResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    const input: CreateOrganizationInput = { name };
    const organization = await createOrgAPI(input);

    // Revalidate organization-related pages
    revalidatePath('/organizations');

    return { success: true, organizationId: organization.id };
  } catch (error) {
    console.error('Create organization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create organization',
    };
  }
}

/**
 * Update organization name
 */
export async function updateOrganization(
  orgId: string,
  data: UpdateOrganizationInput
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await updateOrgAPI(orgId, data);
    revalidatePath('/organizations');
    revalidatePath(`/organizations/${orgId}`);
    return { success: true };
  } catch (error) {
    console.error('Update organization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update organization',
    };
  }
}

/**
 * Delete an organization
 * Will fail if organization has workspaces (must move/delete them first)
 */
export async function deleteOrganization(orgId: string): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await deleteOrgAPI(orgId);
    revalidatePath('/organizations');
    return { success: true };
  } catch (error) {
    console.error('Delete organization error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete organization',
    };
  }
}

/**
 * Get list of organizations for current user
 */
export async function getOrganizations(): Promise<OrganizationWithRole[]> {
  const session = await getSession();

  if (!session?.user) {
    return [];
  }

  try {
    return await listOrgsAPI();
  } catch (error) {
    console.error('Get organizations error:', error);
    return [];
  }
}

/**
 * Get organization details by ID
 */
export async function getOrganizationDetails(
  orgId: string
): Promise<OrganizationDetail | null> {
  const session = await getSession();

  if (!session?.user) {
    return null;
  }

  try {
    return await getOrgAPI(orgId);
  } catch (error) {
    console.error('Get organization details error:', error);
    return null;
  }
}

// ============================================
// Organization Member Actions
// ============================================

/**
 * Get organization members
 */
export async function getOrganizationMembers(
  orgId: string
): Promise<OrganizationMemberResponse[]> {
  const session = await getSession();

  if (!session?.user) {
    return [];
  }

  try {
    return await listMembersAPI(orgId);
  } catch (error) {
    console.error('Get organization members error:', error);
    return [];
  }
}

/**
 * Add member to organization
 */
export async function addOrganizationMember(
  orgId: string,
  data: AddOrgMemberInput
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await addMemberAPI(orgId, data);
    revalidatePath(`/organizations/${orgId}/members`);
    return { success: true };
  } catch (error) {
    console.error('Add organization member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add member',
    };
  }
}

/**
 * Update organization member role
 */
export async function updateOrganizationMember(
  orgId: string,
  userId: string,
  role: OrganizationRole
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await updateMemberRoleAPI(orgId, userId, role);
    revalidatePath(`/organizations/${orgId}/members`);
    return { success: true };
  } catch (error) {
    console.error('Update organization member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update member',
    };
  }
}

/**
 * Remove member from organization
 */
export async function removeOrganizationMemberAction(
  orgId: string,
  userId: string
): Promise<ActionResult> {
  const session = await getSession();

  if (!session?.user) {
    return { success: false, error: 'Not authenticated' };
  }

  try {
    await removeMemberAPI(orgId, userId);
    revalidatePath(`/organizations/${orgId}/members`);
    return { success: true };
  } catch (error) {
    console.error('Remove organization member error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove member',
    };
  }
}
