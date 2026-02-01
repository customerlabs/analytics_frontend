"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, ArrowRightIcon, SkipForwardIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { OnboardingStepContent } from "./OnboardingStepContent";
import { StepIndicator } from "./shared/StepIndicator";
import {
  useOnboardingSheet,
  useOnboardingAccountId,
} from "../hooks/useOnboardingSheet";
import {
  useOnboardingData,
  useSkipStep,
  useUpdateSettings,
} from "../hooks/useOnboardingData";
import {
  StepKey,
  type StepData,
  type CustomerlabsSettingsUpdate,
  type UtmEventsConfig,
  type ConversionEventsConfig,
  type ProductEventsConfig,
} from "../types";

export function OnboardingSheet() {
  const {
    isOpen,
    close,
    steps,
    currentStepKey,
    completedSteps,
    setSteps,
    setCompletedSteps,
    setCurrentStep,
    markStepCompleted,
    markStepSkipped,
    setStepData,
    getCurrentStepIndex,
    getNextStep,
    getPreviousStep,
    canSkipCurrentStep,
  } = useOnboardingSheet();

  const accountId = useOnboardingAccountId();
  const { data: onboardingData, isLoading } = useOnboardingData(accountId);
  const skipStepMutation = useSkipStep(accountId);
  const updateSettingsMutation = useUpdateSettings(accountId);

  const [isValid, setIsValid] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(
    null,
  );
  const getDataRef = useRef<(() => StepData | null) | null>(null);

  // Initialize steps from API data
  useEffect(() => {
    if (onboardingData) {
      setSteps(onboardingData.steps);
      setCompletedSteps(onboardingData.completed_steps);

      // Set current step if not already set
      if (!currentStepKey && onboardingData.current_step) {
        setCurrentStep(onboardingData.current_step);
      }

      // Load existing step data
      if (onboardingData.step_data) {
        Object.entries(onboardingData.step_data).forEach(([key, data]) => {
          if (data) {
            setStepData(key as StepKey, data);
          }
        });
      }
    }
  }, [
    onboardingData,
    setSteps,
    setCompletedSteps,
    setCurrentStep,
    setStepData,
    currentStepKey,
  ]);

  const handleValidationChange = useCallback((valid: boolean) => {
    setIsValid(valid);
  }, []);

  const handleRegisterData = useCallback((getData: () => StepData | null) => {
    getDataRef.current = getData;
  }, []);

  // Clear slide animation after it completes
  useEffect(() => {
    if (slideDirection) {
      const timer = setTimeout(() => setSlideDirection(null), 300);
      return () => clearTimeout(timer);
    }
  }, [slideDirection]);

  const handleGoBack = () => {
    const previousStep = getPreviousStep();
    if (previousStep) {
      setSlideDirection("right");
      setCurrentStep(previousStep);
    }
  };

  const handleStepClick = (stepKey: StepKey) => {
    if (stepKey === currentStepKey) return;

    const clickedIndex = steps.findIndex((s) => s.step_key === stepKey);
    const currentIndex = getCurrentStepIndex();

    setSlideDirection(clickedIndex > currentIndex ? "left" : "right");
    setCurrentStep(stepKey);
  };

  const handleSkip = async () => {
    if (!currentStepKey || !canSkipCurrentStep()) return;

    try {
      await skipStepMutation.mutateAsync({
        stepKey: currentStepKey,
      });

      markStepSkipped(currentStepKey);

      const nextStep = getNextStep();
      if (nextStep) {
        setSlideDirection("left");
        setCurrentStep(nextStep);
      } else {
        // All steps completed
        close();
      }
    } catch (error) {
      console.error("Failed to skip step:", error);
    }
  };

  const handleSaveAndContinue = async () => {
    if (!currentStepKey || !isValid) return;

    const data = getDataRef.current?.() ?? null;

    // Build payload based on step type - backend expects arrays for event configs
    let payload: CustomerlabsSettingsUpdate = { step_key: currentStepKey };

    if (data) {
      switch (currentStepKey) {
        case StepKey.UTM_EVENTS:
          payload.utm_settings = [data as UtmEventsConfig];
          break;
        case StepKey.CONVERSION_EVENTS:
          payload.conversion_settings = [data as ConversionEventsConfig];
          break;
        case StepKey.PRODUCT_EVENTS:
          payload.product_settings = [data as ProductEventsConfig];
          break;
        case StepKey.BASIC_ACCOUNT:
          // Basic account uses flat fields, spread directly
          Object.assign(payload, data);
          break;
        default:
          Object.assign(payload, data);
      }
    }

    try {
      // Use the unified settings endpoint for saving step data
      // Include step_key so backend marks the step as completed
      await updateSettingsMutation.mutateAsync(payload);
      if (data) {
        setStepData(currentStepKey, data);
      }
      markStepCompleted(currentStepKey);

      const nextStep = getNextStep();
      if (nextStep) {
        setSlideDirection("left");
        setCurrentStep(nextStep);
      } else {
        // All steps completed
        close();
      }
    } catch (error) {
      console.error("Failed to save settings:", error);
    }
  };

  const currentStepIndex = getCurrentStepIndex();
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === steps.length - 1;
  const currentStep = steps.find((s) => s.step_key === currentStepKey);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-full max-w-3xl p-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Header */}
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <SheetTitle className="text-xl">Account Setup</SheetTitle>
              <SheetDescription>
                Configure your account for optimal data collection and tracking.
              </SheetDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={close}>
              Close
            </Button>
          </div>
        </SheetHeader>

        {/* Step Indicator */}
        <div className="px-6 py-4 border-b border-border bg-muted/30">
          <StepIndicator
            steps={steps}
            currentStepKey={currentStepKey}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />
        </div>

        {/* Main Content Area with slide animation */}
        <div className="flex-1 overflow-hidden">
          <div
            className={cn(
              "h-full overflow-y-auto p-6",
              slideDirection === "left" && "animate-in slide-in-from-right duration-300",
              slideDirection === "right" && "animate-in slide-in-from-left duration-300",
            )}
          >
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : accountId ? (
              <OnboardingStepContent
                accountId={accountId}
                onValidationChange={handleValidationChange}
                onRegisterData={handleRegisterData}
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">No account selected</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer with Actions */}
        <SheetFooter className="border-t border-border p-4">
          <div className="flex items-center justify-between w-full">
            <Button
              variant="outline"
              onClick={handleGoBack}
              disabled={isFirstStep || skipStepMutation.isPending || updateSettingsMutation.isPending}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Go Back
            </Button>

            <div className="flex items-center gap-3">
              {canSkipCurrentStep() && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  disabled={skipStepMutation.isPending || updateSettingsMutation.isPending}
                >
                  <SkipForwardIcon className="h-4 w-4 mr-2" />
                  Skip
                  {currentStep?.skippable_type === "temporary"
                    ? " for now"
                    : ""}
                </Button>
              )}

              <Button
                onClick={handleSaveAndContinue}
                disabled={!isValid || updateSettingsMutation.isPending}
              >
                {updateSettingsMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    {isLastStep ? "Complete Setup" : "Save and Continue"}
                    {!isLastStep && <ArrowRightIcon className="h-4 w-4 ml-2" />}
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
