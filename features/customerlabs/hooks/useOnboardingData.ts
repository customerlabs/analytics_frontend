"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { useOnboardingSteps } from "@/features/accounts/hooks";
import {
  getSettings,
  updateSettings,
  skipOnboardingStep,
  getRecommendations,
  getStepData,
  getAvailableEvents,
} from "../services/onboarding-actions";
import type {
  StepKey,
  OnboardingStep,
  OnboardingDataResponse,
  RecommendationsResponse,
  CustomerlabsSettings,
  CustomerlabsSettingsUpdate,
} from "../types/onboarding";

// Query keys
export const onboardingKeys = {
  all: ["onboarding"] as const,
  data: (accountId: string) =>
    [...onboardingKeys.all, "data", accountId] as const,
  stepData: (accountId: string, stepKey: StepKey) =>
    [...onboardingKeys.all, "step", accountId, stepKey] as const,
  recommendations: (accountId: string) =>
    [...onboardingKeys.all, "recommendations", accountId] as const,
  availableEvents: (accountId: string) =>
    [...onboardingKeys.all, "events", accountId] as const,
};

// Settings query keys
export const settingsKeys = {
  all: ["customerlabs-settings"] as const,
  detail: (accountId: string) =>
    [...settingsKeys.all, accountId] as const,
};

// =============================================================================
// Settings Hooks (for unified PUT /settings endpoint)
// =============================================================================

/**
 * Hook to fetch current settings for an account.
 * Use this to get the full configuration data.
 */
export function useSettings(accountId: string | null) {
  const { status } = useSession();

  return useQuery({
    queryKey: settingsKeys.detail(accountId ?? ""),
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Missing account ID");
      }
      return getSettings(accountId);
    },
    enabled: status === "authenticated" && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update settings (partial update).
 * This is the main mutation for saving step data.
 */
export function useUpdateSettings(accountId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerlabsSettingsUpdate) => {
      if (!accountId) {
        throw new Error("Missing account ID");
      }
      return updateSettings(accountId, data);
    },
    onSuccess: () => {
      // Invalidate settings cache
      queryClient.invalidateQueries({
        queryKey: settingsKeys.detail(accountId ?? ""),
      });
      // Also invalidate onboarding data as completion status may have changed
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.data(accountId ?? ""),
      });
    },
  });
}

// =============================================================================
// Onboarding Progress Hooks
// =============================================================================

/**
 * Hook to fetch onboarding data for an account.
 * Uses the shared useOnboardingSteps hook internally.
 */
export function useOnboardingData(accountId: string | null) {
  // Use the shared hook with CustomerLabs platform
  const {
    data: sharedData,
    isLoading,
    error,
    refetch,
  } = useOnboardingSteps({
    accountId,
    platform: "CustomerLabs",
    enabled: !!accountId,
  });

  // Transform shared data to match CustomerLabs OnboardingDataResponse format
  const data: OnboardingDataResponse | null = sharedData
    ? {
        steps: sharedData.steps.map((step) => ({
          step_key: step.step_key as StepKey,
          title: step.title,
          description: step.description ?? undefined,
          step_order: step.step_order,
          is_required: step.is_required,
          skippable_type: step.skippable_type as "permanent" | "temporary" | null,
          auto_fill_enabled: step.auto_fill_enabled,
        })) as OnboardingStep[],
        current_step: sharedData.current_step as StepKey,
        completed_steps: sharedData.completed_steps as StepKey[],
        step_data: {}, // Step data is fetched separately via useSettings
      }
    : null;

  return {
    data,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to fetch step-specific data from the step endpoint
 */
export function useStepData<T>(accountId: string | null, stepKey: StepKey) {
  const { status } = useSession();

  return useQuery({
    queryKey: onboardingKeys.stepData(accountId ?? "", stepKey),
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Missing account ID");
      }
      return getStepData<T>(accountId, stepKey);
    },
    enabled: status === "authenticated" && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to skip an onboarding step.
 */
export function useSkipStep(accountId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepKey,
      skipType = "temporary",
    }: {
      stepKey: StepKey;
      skipType?: "permanent" | "temporary";
    }) => {
      if (!accountId) {
        throw new Error("Missing account ID");
      }
      return skipOnboardingStep(stepKey, accountId, skipType);
    },
    onSuccess: (_data, variables) => {
      // Invalidate the onboarding data query
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.data(accountId ?? ""),
      });
      // Invalidate the specific step data
      queryClient.invalidateQueries({
        queryKey: onboardingKeys.stepData(accountId ?? "", variables.stepKey),
      });
    },
  });
}

/**
 * Hook to fetch all AI recommendations for an account.
 */
export function useRecommendations(accountId: string | null, enabled = true) {
  const { status } = useSession();

  return useQuery({
    queryKey: onboardingKeys.recommendations(accountId ?? ""),
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Missing account ID");
      }
      return getRecommendations(accountId);
    },
    enabled: status === "authenticated" && !!accountId && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - recommendations don't change frequently
  });
}

/**
 * Hook to fetch available events for the account
 */
export function useAvailableEvents(accountId: string | null) {
  const { status } = useSession();

  return useQuery({
    queryKey: onboardingKeys.availableEvents(accountId ?? ""),
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Missing account ID");
      }
      return getAvailableEvents(accountId);
    },
    enabled: status === "authenticated" && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
