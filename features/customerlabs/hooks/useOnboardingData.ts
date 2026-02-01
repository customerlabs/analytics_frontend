"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { fetchFromBackendAPI } from "@/lib/apiFetcherClient";
import type {
  StepKey,
  OnboardingDataResponse,
  SaveStepResponse,
  RecommendationsResponse,
  CustomerlabsSettings,
  CustomerlabsSettingsUpdate,
} from "../types/onboarding";

// Backend CommonResponse wrapper type
interface CommonResponse<T> {
  success: boolean;
  errors?: Array<{ code: number; message: string }> | null;
  messages?: Array<{ code: number; message: string }> | null;
  result: T | null;
  result_info?: {
    page?: number;
    per_page?: number;
    total?: number;
    total_pages?: number;
  } | null;
}

// Base paths for CustomerLabs API
const CUSTOMERLABS_BASE = "/api/v1/customerlabs";
const ONBOARDING_BASE = `${CUSTOMERLABS_BASE}/onboarding`;
const SETTINGS_BASE = `${CUSTOMERLABS_BASE}/settings`;

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
  const { data: session, status } = useSession();
  const token = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: settingsKeys.detail(accountId ?? ""),
    queryFn: async () => {
      if (!token || !accountId) {
        throw new Error("Missing authentication or account ID");
      }
      const response = await fetchFromBackendAPI<CommonResponse<CustomerlabsSettings>>(
        `${SETTINGS_BASE}?account_id=${encodeURIComponent(accountId)}`,
        token,
      );
      return response?.result ?? null;
    },
    enabled: status === "authenticated" && !!token && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to update settings (partial update).
 * This is the main mutation for saving step data.
 *
 * @example
 * const updateSettings = useUpdateSettings(accountId);
 * await updateSettings.mutateAsync({ conversion_settings: [...] });
 */
export function useUpdateSettings(accountId: string | null) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CustomerlabsSettingsUpdate) => {
      if (!token || !accountId) {
        throw new Error("Missing authentication or account ID");
      }
      const response = await fetchFromBackendAPI<CommonResponse<CustomerlabsSettings>>(
        `${SETTINGS_BASE}?account_id=${encodeURIComponent(accountId)}`,
        token,
        {
          method: "PUT",
          body: data,
        },
      );
      return response?.result ?? null;
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
 * Hook to fetch onboarding data for an account
 */
export function useOnboardingData(accountId: string | null) {
  const { data: session, status } = useSession();
  const token = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: onboardingKeys.data(accountId ?? ""),
    queryFn: async () => {
      if (!token || !accountId) {
        throw new Error("Missing authentication or account ID");
      }
      const response = await fetchFromBackendAPI<CommonResponse<OnboardingDataResponse>>(
        `${ONBOARDING_BASE}?account_id=${encodeURIComponent(accountId)}`,
        token,
      );
      return response?.result ?? null;
    },
    // Only enable when session is fully loaded AND we have both token and accountId
    enabled: status === "authenticated" && !!token && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch step-specific data from the step endpoint
 */
export function useStepData<T>(accountId: string | null, stepKey: StepKey) {
  const { data: session, status } = useSession();
  const token = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: onboardingKeys.stepData(accountId ?? "", stepKey),
    queryFn: async () => {
      if (!token || !accountId) {
        throw new Error("Missing authentication or account ID");
      }
      const response = await fetchFromBackendAPI<CommonResponse<T>>(
        `${ONBOARDING_BASE}/step/${stepKey}?account_id=${encodeURIComponent(accountId)}`,
        token,
      );
      return response?.result ?? null;
    },
    enabled: status === "authenticated" && !!token && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to skip an onboarding step.
 */
export function useSkipStep(accountId: string | null) {
  const { data: session } = useSession();
  const token = session?.accessToken as string | undefined;
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepKey,
      skipType = "temporary",
    }: {
      stepKey: StepKey;
      skipType?: "permanent" | "temporary";
    }) => {
      if (!token || !accountId) {
        throw new Error("Missing authentication or account ID");
      }
      const response = await fetchFromBackendAPI<CommonResponse<SaveStepResponse>>(
        `${ONBOARDING_BASE}/step/${stepKey}/skip?account_id=${encodeURIComponent(accountId)}`,
        token,
        {
          method: "POST",
          body: { skip_type: skipType },
        },
      );
      return response?.result ?? null;
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
 *
 * This fetches recommendations for all configuration types in a single call:
 * - Conversion events
 * - Product events
 * - UTM mappings
 * - Click ID mappings
 *
 * Call this once at the start of onboarding and use the cached data across all steps.
 */
export function useRecommendations(accountId: string | null, enabled = true) {
  const { data: session, status } = useSession();
  const token = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: onboardingKeys.recommendations(accountId ?? ""),
    queryFn: async () => {
      if (!token || !accountId) {
        throw new Error("Missing authentication or account ID");
      }
      const response = await fetchFromBackendAPI<CommonResponse<RecommendationsResponse>>(
        `${CUSTOMERLABS_BASE}/recommendations?account_id=${encodeURIComponent(accountId)}`,
        token,
      );
      return response?.result ?? null;
    },
    enabled: status === "authenticated" && !!token && !!accountId && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes - recommendations don't change frequently
  });
}

/**
 * Hook to fetch available events for the account
 */
export function useAvailableEvents(accountId: string | null) {
  const { data: session, status } = useSession();
  const token = session?.accessToken as string | undefined;

  return useQuery({
    queryKey: onboardingKeys.availableEvents(accountId ?? ""),
    queryFn: async () => {
      if (!token || !accountId) {
        throw new Error("Missing authentication or account ID");
      }
      const response = await fetchFromBackendAPI<CommonResponse<{ events: string[]; total: number }>>(
        `/api/v1/accounts/${accountId}/events`,
        token,
      );
      return response?.result ?? null;
    },
    enabled: status === "authenticated" && !!token && !!accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
