"use server";

import { z } from "zod";
import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";
import {
  StepKey,
  type SaveStepResponse,
  type RecommendationsResponse,
  type DataAvailabilityData,
  type CustomerlabsSettings,
  type CustomerlabsSettingsUpdate,
  type OnboardingDataResponse,
} from "../types/onboarding";

// =============================================================================
// Zod Validation Schemas
// =============================================================================

const AccountIdSchema = z.string().min(1, "Account ID is required");

const StepKeySchema = z.enum([
  StepKey.DATA_AVAILABILITY,
  StepKey.BASIC_ACCOUNT,
  StepKey.CONVERSION_EVENTS,
  StepKey.PRODUCT_EVENTS,
  StepKey.UTM_EVENTS,
]);

// Base paths for CustomerLabs API
const CUSTOMERLABS_BASE = "/api/v1/customerlabs";
const ONBOARDING_BASE = `${CUSTOMERLABS_BASE}/onboarding`;
const SETTINGS_BASE = `${CUSTOMERLABS_BASE}/settings`;

// =============================================================================
// Settings API (unified PUT endpoint for all configuration data)
// =============================================================================

/**
 * Get full settings for an account.
 * Returns all configuration data in a single response.
 */
export async function getSettings(
  accountId: string,
): Promise<CustomerlabsSettings> {
  AccountIdSchema.parse(accountId);

  return fetchFromBackendAPI<CustomerlabsSettings>(
    `${SETTINGS_BASE}?account_id=${encodeURIComponent(accountId)}`,
  );
}

/**
 * Update settings for an account (partial update).
 * Only provided fields will be updated - this is the main save endpoint.
 */
export async function updateSettings(
  accountId: string,
  data: CustomerlabsSettingsUpdate,
): Promise<CustomerlabsSettings> {
  AccountIdSchema.parse(accountId);

  return fetchFromBackendAPI<CustomerlabsSettings>(
    `${SETTINGS_BASE}?account_id=${encodeURIComponent(accountId)}`,
    {
      method: "PUT",
      body: data,
    },
  );
}

// =============================================================================
// Onboarding Progress API (for tracking step completion)
// =============================================================================
// Note: getOnboardingData removed - use the shared useOnboardingSteps hook instead
// which fetches from /api/v1/accounts/onboarding?platform=CustomerLabs

/**
 * Skip an onboarding step.
 */
export async function skipOnboardingStep(
  stepKey: StepKey,
  accountId: string,
  skipType: "permanent" | "temporary" = "temporary",
): Promise<SaveStepResponse> {
  StepKeySchema.parse(stepKey);
  AccountIdSchema.parse(accountId);

  return fetchFromBackendAPI<SaveStepResponse>(
    `${ONBOARDING_BASE}/step/${stepKey}/skip?account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
      body: { skip_type: skipType },
    },
  );
}

/**
 * Get all AI recommendations for an account in a single call.
 *
 * This endpoint returns recommendations for all configuration types:
 * - Conversion events
 * - Product events
 * - UTM mappings
 * - Click ID mappings
 *
 * Call this once at the start of onboarding and cache the results.
 */
export async function getRecommendations(
  accountId: string,
): Promise<RecommendationsResponse | null> {
  AccountIdSchema.parse(accountId);

  interface CommonResponse<R> {
    success: boolean;
    result: R | null;
  }
  const response = await fetchFromBackendAPI<CommonResponse<RecommendationsResponse>>(
    `${CUSTOMERLABS_BASE}/recommendations?account_id=${encodeURIComponent(accountId)}`,
  );
  return response?.result ?? null;
}

/**
 * Get data availability information for the account
 */
export async function getDataAvailability(
  accountId: string,
): Promise<DataAvailabilityData> {
  AccountIdSchema.parse(accountId);

  return fetchFromBackendAPI<DataAvailabilityData>(
    `${ONBOARDING_BASE}/step/${StepKey.DATA_AVAILABILITY}?account_id=${encodeURIComponent(accountId)}`,
  );
}

/**
 * Reset onboarding progress
 */
export async function resetOnboarding(
  accountId: string,
): Promise<OnboardingDataResponse> {
  AccountIdSchema.parse(accountId);

  return fetchFromBackendAPI<OnboardingDataResponse>(
    `${ONBOARDING_BASE}/reset?account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
    },
  );
}

/**
 * Get step-specific data for an onboarding step
 */
export async function getStepData<T>(
  accountId: string,
  stepKey: StepKey,
): Promise<T | null> {
  AccountIdSchema.parse(accountId);
  StepKeySchema.parse(stepKey);

  interface CommonResponse<R> {
    success: boolean;
    result: R | null;
  }
  const response = await fetchFromBackendAPI<CommonResponse<T>>(
    `${ONBOARDING_BASE}/step/${stepKey}?account_id=${encodeURIComponent(accountId)}`,
  );
  return response?.result ?? null;
}

/**
 * Get available events for an account
 */
export async function getAvailableEvents(
  accountId: string,
): Promise<{ events: string[]; total: number } | null> {
  AccountIdSchema.parse(accountId);

  interface CommonResponse<R> {
    success: boolean;
    result: R | null;
  }
  const response = await fetchFromBackendAPI<CommonResponse<{ events: string[]; total: number }>>(
    `/api/v1/accounts/${accountId}/events`,
  );
  return response?.result ?? null;
}
