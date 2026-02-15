"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { StepWrapper } from "../shared/StepWrapper";
import { FieldMappingGrid } from "../shared/FieldMappingGrid";
import {
  useOnboardingData,
  useRecommendations,
} from "../../hooks/useOnboardingData";
import { UTM_FIELD_TARGETS } from "../../utils/form-options";
import { utmEventsConfigSchema } from "../../schemas/onboarding-schemas";
import { StepKey } from "../../types";
import type { UtmEventsConfig, StepData, FieldMapping, SourceField } from "../../types";

interface UtmEventsStepProps {
  accountId: string;
  onValidationChange: (isValid: boolean) => void;
  onRegisterData: (getData: () => StepData | null) => void;
}

export function UtmEventsStep({
  accountId,
  onValidationChange,
  onRegisterData,
}: UtmEventsStepProps) {
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingData(accountId);
  const { data: recommendationsData, isLoading: recommendationsLoading } = useRecommendations(accountId);

  const isLoading = onboardingLoading || recommendationsLoading;

  const existingData = onboardingData?.step_data?.[StepKey.UTM_EVENTS] as
    | UtmEventsConfig
    | undefined;

  // Get UTM field mappings from new backend format
  const utmFields = useMemo(
    () => recommendationsData?.utmFields ?? [],
    [recommendationsData?.utmFields]
  );

  // Build source fields from AI recommendations
  // Deduplicate by field_name (key) to prevent React key warnings
  const sourceFields: SourceField[] = useMemo(() => {
    const seen = new Set<string>();
    return utmFields
      .filter((field) => {
        if (seen.has(field.key)) return false;
        seen.add(field.key);
        return true;
      })
      .map((field) => ({
        field_name: field.key,
        field_type: field.type,
        occurrence_count: 1,
      }));
  }, [utmFields]);

  // Compute initial values from existing data or AI recommendations
  const computeInitialState = useCallback(() => {
    if (existingData) {
      return existingData.field_mappings;
    }
    
    if (utmFields.length > 0) {
      // Pre-fill field mappings from UTM recommendations
      // utmFields has: key (source), outputName (target UTM param), type
      const initialMappings: Partial<FieldMapping>[] = UTM_FIELD_TARGETS.map((target) => {
        // Find matching UTM field by outputName
        // API returns outputName as short form (e.g., "source") while target.field has utm_ prefix (e.g., "utm_source")
        const targetWithoutPrefix = target.field.replace(/^utm_/, "");
        const aiField = utmFields.find(
          (field) => field.outputName.toLowerCase() === targetWithoutPrefix.toLowerCase()
        );
        
        return {
          target_field: target.field,
          source_field: aiField?.key ?? "",
          is_required: target.required,
        };
      });

      return initialMappings;
    }
    
    return [];
  }, [existingData, utmFields]);

  const [fieldMappings, setFieldMappings] = useState<Partial<FieldMapping>[]>([]);
  const isInitializedRef = useRef(false);

  // Initialize state when data becomes available
  useEffect(() => {
    if (isInitializedRef.current || isLoading) return;

    // Only proceed if we have data to initialize with
    const hasData = existingData || utmFields.length > 0;
    if (!hasData) return;

    const initialMappings = computeInitialState();

    queueMicrotask(() => {
      setFieldMappings(initialMappings);
    });

    isInitializedRef.current = true;
  }, [isLoading, computeInitialState, existingData, utmFields]);

  // Validate form data - UTM events are optional, so always valid
  useEffect(() => {
    const data = {
      selected_events: [] as string[],
      field_mappings: fieldMappings.filter(
        (m) => m.source_field,
      ) as FieldMapping[],
    };
    const result = utmEventsConfigSchema.safeParse(data);
    onValidationChange(result.success);
  }, [fieldMappings, onValidationChange]);

  // Register getData function
  const getData = useCallback((): StepData | null => {
    const data = {
      selected_events: [] as string[],
      field_mappings: fieldMappings.filter(
        (m) => m.source_field,
      ) as FieldMapping[],
    };
    const result = utmEventsConfigSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }
    return null;
  }, [fieldMappings]);

  useEffect(() => {
    onRegisterData(getData);
  }, [onRegisterData, getData]);

  const fieldTargets = UTM_FIELD_TARGETS.map((t) => ({
    field: t.field,
    label: t.label,
    required: t.required,
  }));

  if (isLoading) {
    return (
      <StepWrapper
        title="UTM Parameters Configuration"
        description="Loading configuration..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-muted-foreground">Loading recommendations...</span>
        </div>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper
      title="UTM Parameters Configuration"
      description="Configure UTM parameter tracking to attribute marketing campaigns and traffic sources."
    >
      <div className="space-y-8">
        {/* Info Box */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
            About UTM Parameters
          </h4>
          <p className="text-sm text-blue-700 dark:text-blue-300">
            UTM parameters help you track where your traffic comes from. They
            are typically captured on page views or session start events. Common
            parameters include utm_source, utm_medium, and utm_campaign.
          </p>
        </div>

        {/* Field Mappings */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">
              UTM Parameter Mappings
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Map your event properties to standard UTM parameters.
            </p>
          </div>

          <FieldMappingGrid
            fieldTargets={fieldTargets}
            mappings={fieldMappings}
            sourceFields={sourceFields}
            onChange={setFieldMappings}
          />
        </div>

        {/* Optional step info */}
        <div className="rounded-lg border border-border bg-muted/30 p-4">
          <p className="text-sm text-muted-foreground">
            UTM parameter configuration is optional. You can skip this step or
            configure it later.
          </p>
        </div>
      </div>
    </StepWrapper>
  );
}
