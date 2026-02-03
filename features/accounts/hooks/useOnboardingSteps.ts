"use client";

import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import {
  getOnboardingSteps,
  type Platform,
  type OnboardingData,
  type OnboardingStep,
} from "../services";

// Re-export types for consumers
export type { Platform, OnboardingStep, OnboardingData };

interface UseOnboardingStepsOptions {
  accountId: string | null;
  platform: Platform;
  enabled?: boolean;
}

export function useOnboardingSteps(options: UseOnboardingStepsOptions) {
  const { accountId, platform, enabled = true } = options;
  const { status } = useSession();

  return useQuery<OnboardingData>({
    queryKey: ["onboarding-steps", accountId, platform],
    queryFn: async () => {
      if (!accountId) {
        throw new Error("Missing account ID");
      }
      return getOnboardingSteps(accountId, platform);
    },
    staleTime: 30 * 1000, // 30 seconds
    enabled: status === "authenticated" && !!accountId && enabled,
  });
}
