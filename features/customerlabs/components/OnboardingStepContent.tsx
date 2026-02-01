"use client";

import { useOnboardingSheet } from "../hooks/useOnboardingSheet";
import { StepKey, StepData } from "../types";
import {
  DataAvailabilityStep,
  BasicAccountConfigStep,
  ConversionEventsStep,
  ProductEventsStep,
  UtmEventsStep,
} from "./steps";

interface OnboardingStepContentProps {
  accountId: string;
  onValidationChange: (isValid: boolean) => void;
  onRegisterData: (getData: () => StepData | null) => void;
}

export function OnboardingStepContent({
  accountId,
  onValidationChange,
  onRegisterData,
}: OnboardingStepContentProps) {
  const { currentStepKey } = useOnboardingSheet();

  if (!currentStepKey) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No step selected</p>
      </div>
    );
  }

  const stepProps = {
    accountId,
    onValidationChange,
    onRegisterData,
  };

  switch (currentStepKey) {
    case StepKey.DATA_AVAILABILITY:
      return <DataAvailabilityStep {...stepProps} />;
    case StepKey.BASIC_ACCOUNT:
      return <BasicAccountConfigStep {...stepProps} />;
    case StepKey.CONVERSION_EVENTS:
      return <ConversionEventsStep {...stepProps} />;
    case StepKey.PRODUCT_EVENTS:
      return <ProductEventsStep {...stepProps} />;
    case StepKey.UTM_EVENTS:
      return <UtmEventsStep {...stepProps} />;
    default:
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">
            Unknown step: {currentStepKey}
          </p>
        </div>
      );
  }
}
