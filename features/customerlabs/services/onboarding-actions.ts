"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";
import {
  StepKey,
  type OnboardingDataResponse,
  type SaveStepResponse,
  type RecommendationsResponse,
  type DataAvailabilityData,
  type CustomerlabsSettings,
  type CustomerlabsSettingsUpdate,
} from "../types/onboarding";

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

/**
 * Get onboarding data for an account
 */
export async function getOnboardingData(
  accountId: string,
): Promise<OnboardingDataResponse> {
  return fetchFromBackendAPI<OnboardingDataResponse>(
    `${ONBOARDING_BASE}?account_id=${encodeURIComponent(accountId)}`,
  );
}

/**
 * Skip an onboarding step.
 */
export async function skipOnboardingStep(
  stepKey: StepKey,
  accountId: string,
  skipType: "permanent" | "temporary" = "temporary",
): Promise<SaveStepResponse> {
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
): Promise<RecommendationsResponse> {
  return fetchFromBackendAPI<RecommendationsResponse>(
    `${CUSTOMERLABS_BASE}/recommendations?account_id=${encodeURIComponent(accountId)}`,
  );
}

/**
 * Get data availability information for the account
 */
export async function getDataAvailability(
  accountId: string,
): Promise<DataAvailabilityData> {
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
  return fetchFromBackendAPI<OnboardingDataResponse>(
    `${ONBOARDING_BASE}/reset?account_id=${encodeURIComponent(accountId)}`,
    {
      method: "POST",
    },
  );
}
