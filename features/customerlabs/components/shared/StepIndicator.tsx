"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";
import type { OnboardingStep, StepKey, StepStatus } from "../../types";

interface StepIndicatorProps {
  steps: OnboardingStep[];
  currentStepKey: StepKey | null;
  completedSteps: StepKey[];
  onStepClick: (stepKey: StepKey) => void;
}

export function StepIndicator({
  steps,
  currentStepKey,
  completedSteps,
  onStepClick,
}: StepIndicatorProps) {
  const getStepStatus = (step: OnboardingStep): StepStatus => {
    if (step.step_key === currentStepKey) return "current";
    if (completedSteps.includes(step.step_key)) return "completed";
    return "pending";
  };

  const currentIndex = steps.findIndex((s) => s.step_key === currentStepKey);

  // Calculate progress based on completed steps
  const completedCount = completedSteps.length;
  // Progress line should reach up to the last completed step
  const progressPercent =
    steps.length > 1 ? (completedCount / (steps.length - 1)) * 100 : 0;

  return (
    <div className="space-y-2">
      {/* Step circles with connecting line */}
      <div className="relative flex items-center justify-between px-4">
        {/* Background line */}
        <div className="absolute left-8 right-8 top-1/2 h-0.5 -translate-y-1/2 bg-border" />

        {/* Animated progress line */}
        <div
          className="absolute left-8 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-500 ease-out"
          style={{
            width: `calc(${Math.min(progressPercent, 100)}% * (100% - 4rem) / 100)`,
          }}
        />

        {/* Step circles */}
        {steps.map((step, index) => {
          const status = getStepStatus(step);
          const isClickable = status === "completed" || status === "current";

          return (
            <button
              key={step.step_key}
              type="button"
              onClick={() => isClickable && onStepClick(step.step_key)}
              disabled={!isClickable}
              className={cn(
                "relative z-10 size-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300",
                status === "completed" &&
                  "bg-primary text-primary-foreground scale-100",
                status === "current" &&
                  "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110",
                status === "pending" && "bg-muted text-muted-foreground",
                isClickable && "cursor-pointer hover:scale-105",
                !isClickable && "cursor-not-allowed",
              )}
            >
              {status === "completed" ? (
                <CheckIcon className="size-4" />
              ) : (
                index + 1
              )}
            </button>
          );
        })}
      </div>

      {/* Simple step counter */}
      <p className="text-center text-sm text-muted-foreground">
        Step {currentIndex + 1} of {steps.length}
      </p>
    </div>
  );
}
