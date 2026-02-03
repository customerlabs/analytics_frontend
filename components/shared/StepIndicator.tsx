"use client";

import { cn } from "@/lib/utils";
import { CheckIcon } from "lucide-react";

export interface Step<T extends string | number = string | number> {
  id: T;
  label: string;
}

export interface StepIndicatorProps<T extends string | number> {
  steps: Step<T>[];
  currentStep: T;
  completedSteps?: T[];
  onStepClick: (step: T) => void;
}

export function StepIndicator<T extends string | number>({
  steps,
  currentStep,
  completedSteps,
  onStepClick,
}: StepIndicatorProps<T>) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);

  const getStepStatus = (
    step: Step<T>,
    index: number
  ): "pending" | "current" | "completed" => {
    if (step.id === currentStep) return "current";

    // If completedSteps is provided, use it; otherwise use sequential logic
    if (completedSteps) {
      if (completedSteps.includes(step.id)) return "completed";
    } else {
      // Sequential logic: steps before current are completed
      if (index < currentIndex) return "completed";
    }

    return "pending";
  };

  return (
    <div className="mt-4 -mx-6 px-6 overflow-x-auto scrollbar-thin scrollbar-thumb-muted">
      <div className="flex items-center gap-1 min-w-max pb-2">
        {steps.map((step, index) => {
          const status = getStepStatus(step, index);
          const isClickable = status === "completed" || status === "current";

          return (
            <div key={String(step.id)} className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (isClickable) {
                    onStepClick(step.id);
                  }
                }}
                disabled={!isClickable}
                className={cn(
                  "flex items-center gap-2 transition-all shrink-0",
                  isClickable
                    ? "cursor-pointer hover:opacity-80"
                    : "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors shrink-0",
                    status === "completed" &&
                      "bg-primary text-primary-foreground",
                    status === "current" && "bg-primary text-primary-foreground",
                    status === "pending" && "bg-muted text-muted-foreground"
                  )}
                >
                  {status === "completed" ? (
                    <CheckIcon className="w-3.5 h-3.5" />
                  ) : (
                    index + 1
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium whitespace-nowrap max-w-[120px] truncate",
                    status === "pending"
                      ? "text-muted-foreground"
                      : "text-foreground"
                  )}
                  title={step.label}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-6 shrink-0",
                    status === "completed" ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
