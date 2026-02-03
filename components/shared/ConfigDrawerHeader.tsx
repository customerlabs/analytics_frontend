"use client";

import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { StepIndicator, type Step } from "./StepIndicator";

interface ConfigDrawerHeaderProps<T extends string | number> {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClose: () => void;
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
        <button
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Close"
        >
          <X className="w-6 h-6" />
        </button>
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
