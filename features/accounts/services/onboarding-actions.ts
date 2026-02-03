"use server";

import { fetchFromBackendAPI } from "@/lib/apiFetcherServer";

export type Platform = "Facebook" | "CustomerLabs";

export interface OnboardingStep {
  step_key: string;
  title: string;
  description: string | null;
  step_order: number;
  is_required: boolean;
  skippable_type: string;
  auto_fill_enabled: boolean;
}

export interface OnboardingData {
  steps: OnboardingStep[];
  current_step: string | null;
  completed_steps: string[];
  skipped_permanent: string[];
  progress_percentage: number;
  is_completed: boolean;
}

interface CommonResponse<T> {
  success: boolean;
  result: T | null;
}

/**
 * Get onboarding steps for an account and platform
 */
export async function getOnboardingSteps(
  accountId: string,
  platform: Platform,
): Promise<OnboardingData> {
  const response = await fetchFromBackendAPI<CommonResponse<OnboardingData>>(
    `/api/v1/accounts/onboarding?account_id=${encodeURIComponent(accountId)}&platform=${encodeURIComponent(platform)}`,
  );
  if (!response?.result) {
    throw new Error("Failed to fetch onboarding steps");
  }
  return response.result;
}
