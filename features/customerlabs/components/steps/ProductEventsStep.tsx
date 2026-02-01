"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { StepWrapper } from "../shared/StepWrapper";
import { FieldMappingGrid } from "../shared/FieldMappingGrid";
import {
  useOnboardingData,
  useRecommendations,
} from "../../hooks/useOnboardingData";
import { PRODUCT_FIELD_TARGETS } from "../../utils/form-options";
import { productEventsConfigSchema } from "../../schemas/onboarding-schemas";
import { StepKey } from "../../types";
import type { ProductEventsConfig, StepData, FieldMapping, SourceField } from "../../types";

interface ProductEventsStepProps {
  accountId: string;
  onValidationChange: (isValid: boolean) => void;
  onRegisterData: (getData: () => StepData | null) => void;
}

export function ProductEventsStep({
  accountId,
  onValidationChange,
  onRegisterData,
}: ProductEventsStepProps) {
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingData(accountId);
  const { data: recommendationsData, isLoading: recommendationsLoading } = useRecommendations(accountId);

  const isLoading = onboardingLoading || recommendationsLoading;

  const existingData = onboardingData?.step_data?.[StepKey.PRODUCT_EVENTS] as
    | ProductEventsConfig
    | undefined;

  // Use product field mappings from the new backend format
  const productFields = useMemo(
    () => recommendationsData?.productFields ?? [],
    [recommendationsData?.productFields]
  );

  // Build source fields from AI recommendations
  // Maps key -> outputName for product field mappings
  // Deduplicate by field_name (key) to prevent React key warnings
  const sourceFields: SourceField[] = useMemo(() => {
    const seen = new Set<string>();
    return productFields
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
  }, [productFields]);

  // Compute initial values from existing data or AI recommendations
  const computeInitialState = useCallback(() => {
    if (existingData) {
      return existingData.field_mappings;
    }
    
    if (productFields.length > 0) {
      // Pre-fill field mappings from AI recommendations
      // Map productFields to our FieldMapping structure
      const initialMappings: Partial<FieldMapping>[] = PRODUCT_FIELD_TARGETS.map((target) => {
        // Find matching AI recommendation by outputName
        const aiField = productFields.find(
          (pf) => pf.outputName.toLowerCase() === target.field.toLowerCase()
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
  }, [existingData, productFields]);

  const [fieldMappings, setFieldMappings] = useState<Partial<FieldMapping>[]>([]);
  const isInitializedRef = useRef(false);

  // Initialize state when data becomes available
  // Using queueMicrotask to batch the updates and satisfy the linter
  useEffect(() => {
    if (isInitializedRef.current || isLoading) return;
    
    const initialMappings = computeInitialState();
    
    // Only update if we have data to set
    if (existingData || productFields.length > 0) {
      queueMicrotask(() => {
        setFieldMappings(initialMappings);
      });
    }
    
    isInitializedRef.current = true;
  }, [isLoading, computeInitialState, existingData, productFields]);

  // Validate form data - product events are optional, so always valid
  useEffect(() => {
    const data = {
      selected_events: [] as string[],
      field_mappings: fieldMappings.filter(
        (m) => m.source_field,
      ) as FieldMapping[],
    };
    const result = productEventsConfigSchema.safeParse(data);
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
    const result = productEventsConfigSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }
    return null;
  }, [fieldMappings]);

  useEffect(() => {
    onRegisterData(getData);
  }, [onRegisterData, getData]);

  const fieldTargets = PRODUCT_FIELD_TARGETS.map((t) => ({
    field: t.field,
    label: t.label,
    required: t.required,
  }));

  if (isLoading) {
    return (
      <StepWrapper
        title="Product Field Mappings"
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
      title="Product Field Mappings"
      description="Map your event properties to standard product fields for catalog tracking."
    >
      <div className="space-y-8">
        {/* Field Mappings */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Field Mappings</Label>
            <p className="text-sm text-muted-foreground mt-1">
              Map your event properties to standard product fields for catalog
              tracking.
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
            Product field mapping is optional. You can skip this step or
            configure it later.
          </p>
        </div>
      </div>
    </StepWrapper>
  );
}
