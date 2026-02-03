"use client";

import { create } from "zustand";
import type {
  StepKey,
  OnboardingStep,
  StepDataMap,
  RecommendationsResponse,
} from "../types/onboarding";

interface OnboardingSheetState {
  // UI state
  isOpen: boolean;
  accountId: string | null;

  // Step navigation
  currentStepKey: StepKey | null;
  steps: OnboardingStep[];
  completedSteps: StepKey[];

  // Step data
  stepData: Partial<StepDataMap>;

  // AI Recommendations (fetched once, used across all steps)
  recommendations: RecommendationsResponse | null;
  recommendationsLoading: boolean;
  recommendationsError: string | null;

  // Actions
  open: (accountId: string, initialStepKey?: StepKey) => void;
  close: () => void;
  setCurrentStep: (stepKey: StepKey) => void;
  markStepCompleted: (stepKey: StepKey) => void;
  markStepSkipped: (stepKey: StepKey) => void;
  setStepData: <K extends StepKey>(stepKey: K, data: StepDataMap[K]) => void;
  setSteps: (steps: OnboardingStep[]) => void;
  setCompletedSteps: (completedSteps: StepKey[]) => void;
  setRecommendations: (recommendations: RecommendationsResponse | null) => void;
  setRecommendationsLoading: (loading: boolean) => void;
  setRecommendationsError: (error: string | null) => void;
  reset: () => void;

  // Computed helpers
  getCurrentStepIndex: () => number;
  getNextStep: () => StepKey | null;
  getPreviousStep: () => StepKey | null;
  isStepCompleted: (stepKey: StepKey) => boolean;
  canSkipCurrentStep: () => boolean;
  getProgress: () => { current: number; total: number; percentage: number };
}

const initialState = {
  isOpen: false,
  accountId: null,
  currentStepKey: null,
  steps: [],
  completedSteps: [],
  stepData: {},
  recommendations: null,
  recommendationsLoading: false,
  recommendationsError: null,
};

export const useOnboardingSheet = create<OnboardingSheetState>((set, get) => ({
  ...initialState,

  open: (accountId: string, initialStepKey?: StepKey) => {
    set({
      isOpen: true,
      accountId,
      currentStepKey: initialStepKey ?? null,
    });
  },

  close: () => {
    set({
      isOpen: false,
      currentStepKey: null,
      steps: [],
      completedSteps: [],
    });
  },

  setCurrentStep: (stepKey: StepKey) => {
    set({ currentStepKey: stepKey });
  },

  markStepCompleted: (stepKey: StepKey) => {
    const { completedSteps } = get();
    if (!completedSteps.includes(stepKey)) {
      set({ completedSteps: [...completedSteps, stepKey] });
    }
  },

  markStepSkipped: (stepKey: StepKey) => {
    // For now, skipped steps are treated as completed
    const { completedSteps } = get();
    if (!completedSteps.includes(stepKey)) {
      set({ completedSteps: [...completedSteps, stepKey] });
    }
  },

  setStepData: <K extends StepKey>(stepKey: K, data: StepDataMap[K]) => {
    const { stepData } = get();
    set({
      stepData: {
        ...stepData,
        [stepKey]: data,
      },
    });
  },

  setSteps: (steps: OnboardingStep[]) => {
    set({ steps });
    // Set initial step if not already set
    const { currentStepKey } = get();
    if (!currentStepKey && steps.length > 0) {
      set({ currentStepKey: steps[0].step_key });
    }
  },

  setCompletedSteps: (completedSteps: StepKey[]) => {
    set({ completedSteps });
  },

  setRecommendations: (recommendations: RecommendationsResponse | null) => {
    set({ recommendations, recommendationsError: null });
  },

  setRecommendationsLoading: (loading: boolean) => {
    set({ recommendationsLoading: loading });
  },

  setRecommendationsError: (error: string | null) => {
    set({ recommendationsError: error, recommendationsLoading: false });
  },

  reset: () => {
    set(initialState);
  },

  getCurrentStepIndex: () => {
    const { steps, currentStepKey } = get();
    if (!currentStepKey) return -1;
    return steps.findIndex((s) => s.step_key === currentStepKey);
  },

  getNextStep: () => {
    const { steps } = get();
    const currentIndex = get().getCurrentStepIndex();
    if (currentIndex === -1 || currentIndex >= steps.length - 1) return null;
    return steps[currentIndex + 1].step_key;
  },

  getPreviousStep: () => {
    const { steps } = get();
    const currentIndex = get().getCurrentStepIndex();
    if (currentIndex <= 0) return null;
    return steps[currentIndex - 1].step_key;
  },

  isStepCompleted: (stepKey: StepKey) => {
    const { completedSteps } = get();
    return completedSteps.includes(stepKey);
  },

  canSkipCurrentStep: () => {
    const { steps, currentStepKey } = get();
    const currentStep = steps.find((s) => s.step_key === currentStepKey);
    return currentStep?.skippable_type !== null && !currentStep?.is_required;
  },

  getProgress: () => {
    const { steps, completedSteps } = get();
    const total = steps.length;
    const current = completedSteps.length;
    const percentage = total > 0 ? Math.round((current / total) * 100) : 0;
    return { current, total, percentage };
  },
}));

// Selector hooks for common use cases
export const useIsOnboardingOpen = () =>
  useOnboardingSheet((state) => state.isOpen);

export const useCurrentStepKey = () =>
  useOnboardingSheet((state) => state.currentStepKey);

export const useOnboardingSteps = () =>
  useOnboardingSheet((state) => state.steps);

export const useCompletedSteps = () =>
  useOnboardingSheet((state) => state.completedSteps);

export const useOnboardingProgress = () =>
  useOnboardingSheet((state) => state.getProgress());

export const useOnboardingAccountId = () =>
  useOnboardingSheet((state) => state.accountId);

export const useOnboardingRecommendations = () =>
  useOnboardingSheet((state) => state.recommendations);

export const useRecommendationsLoading = () =>
  useOnboardingSheet((state) => state.recommendationsLoading);

export const useRecommendationsError = () =>
  useOnboardingSheet((state) => state.recommendationsError);
