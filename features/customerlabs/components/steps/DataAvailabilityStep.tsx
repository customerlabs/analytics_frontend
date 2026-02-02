"use client";

import { useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  CheckCircleIcon,
  AlertCircleIcon,
  RefreshCwIcon,
  XCircleIcon,
} from "lucide-react";
import { StepWrapper } from "../shared/StepWrapper";
import { useStepData } from "../../hooks/useOnboardingData";
import { StepKey } from "../../types";
import type { DataAvailabilityData, StepData } from "../../types";

interface DataAvailabilityStepProps {
  accountId: string;
  onValidationChange: (isValid: boolean) => void;
  onRegisterData: (getData: () => StepData | null) => void;
}

export function DataAvailabilityStep({
  accountId,
  onValidationChange,
  onRegisterData,
}: DataAvailabilityStepProps) {
  // Fetch step-specific data from the data_availability endpoint
  const { data: stepData, isLoading, isError, error, refetch } = useStepData<DataAvailabilityData>(
    accountId,
    StepKey.DATA_AVAILABILITY
  );

  // This is a read-only step, always valid if data is available
  useEffect(() => {
    onValidationChange(stepData?.has_data ?? false);
  }, [stepData?.has_data, onValidationChange]);

  // Register getData function (returns the existing data as this is read-only)
  const getData = useCallback((): StepData | null => {
    return stepData ?? null;
  }, [stepData]);

  useEffect(() => {
    onRegisterData(getData);
  }, [onRegisterData, getData]);

  if (isLoading) {
    return (
      <StepWrapper
        title="Data Availability Check"
        description="Checking your account data..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </StepWrapper>
    );
  }

  if (isError) {
    return (
      <StepWrapper
        title="Data Availability Check"
        description="Unable to check your account data."
      >
        <Card className="border-2 border-destructive/50 bg-destructive/10">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <XCircleIcon className="h-6 w-6 text-destructive shrink-0" />
              <div className="flex-1">
                <h3 className="font-medium text-foreground">
                  Failed to load data
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {error instanceof Error
                    ? error.message
                    : "An error occurred while fetching data availability. Please try again."}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => refetch()}
                  className="mt-4"
                >
                  <RefreshCwIcon className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper
      title="Data Availability Check"
      description="Checking if your account has data for analysis."
    >
      <Card
        className={cn(
          "border-2",
          stepData?.has_data
            ? "border-green-200 dark:border-green-900 bg-green-50 dark:bg-green-950/30"
            : "border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30",
        )}
      >
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {stepData?.has_data ? (
              <CheckCircleIcon className="h-6 w-6 text-green-600 dark:text-green-400 shrink-0" />
            ) : (
              <AlertCircleIcon className="h-6 w-6 text-amber-600 dark:text-amber-400 shrink-0" />
            )}
            <div>
              <h3 className="font-medium text-foreground">
                {stepData?.has_data
                  ? "Data is available"
                  : "Limited data available"}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {stepData?.has_data
                  ? "We have detected events from your account. You can proceed with the configuration."
                  : "We haven't received much data yet. You can still proceed, but some configurations may need to be updated later."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </StepWrapper>
  );
}
