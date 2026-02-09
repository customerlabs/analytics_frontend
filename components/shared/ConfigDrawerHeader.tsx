"use client";

import { X, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepIndicator, type Step } from "./StepIndicator";

interface ConfigDrawerHeaderProps<T extends string | number> {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClose: () => void;
  // Refresh props (optional)
  onRefresh?: () => void;
  isRefreshing?: boolean;
  // Step indicator props (optional)
  steps?: Step<T>[];
  currentStep?: T;
  completedSteps?: T[];
  onStepClick?: (step: T) => void;
  className?: string;
}

export function ConfigDrawerHeader<T extends string | number>({
  title,
  description,
  onClose,
  onRefresh,
  isRefreshing,
  steps,
  currentStep,
  completedSteps,
  onStepClick,
  className,
}: ConfigDrawerHeaderProps<T>) {
  return (
    <div
      className={cn(
        "px-6 py-4 border-b border-border bg-linear-to-r from-primary/5 to-primary/10 shrink-0",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="font-bold text-lg text-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Refresh data (clears cache)"
            >
              <RefreshCw className={cn("w-5 h-5", isRefreshing && "animate-spin")} />
            </button>
          )}
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Step Indicator (optional) */}
      {steps && currentStep !== undefined && onStepClick && (
        <StepIndicator
          steps={steps}
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={onStepClick}
        />
      )}
    </div>
  );
}
