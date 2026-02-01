"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { StepWrapper } from "../shared/StepWrapper";
import { FieldMappingGrid } from "../shared/FieldMappingGrid";
import { EventSelector } from "../shared/EventSelector";
import {
  useOnboardingData,
  useAvailableEvents,
  useRecommendations,
} from "../../hooks/useOnboardingData";
import { CONVERSION_FIELD_TARGETS } from "../../utils/form-options";
import { conversionEventsConfigSchema } from "../../schemas/onboarding-schemas";
import { StepKey } from "../../types";
import type {
  ConversionEventsConfig,
  StepData,
  FieldMapping,
  SourceField,
} from "../../types";

interface ConversionEventsStepProps {
  accountId: string;
  onValidationChange: (isValid: boolean) => void;
  onRegisterData: (getData: () => StepData | null) => void;
}

export function ConversionEventsStep({
  accountId,
  onValidationChange,
  onRegisterData,
}: ConversionEventsStepProps) {
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingData(accountId);
  const { data: eventsData, isLoading: eventsLoading } = useAvailableEvents(accountId);
  const { data: recommendationsData, isLoading: recommendationsLoading } = useRecommendations(accountId);

  const isLoading = onboardingLoading || eventsLoading || recommendationsLoading;

  const existingData = onboardingData?.step_data?.[
    StepKey.CONVERSION_EVENTS
  ] as ConversionEventsConfig | undefined;

  const events = useMemo(() => eventsData?.events ?? [], [eventsData?.events]);
  
  // Extract conversionsConfig from new backend format
  const conversionsConfig = useMemo(
    () => recommendationsData?.conversionsConfig ?? null,
    [recommendationsData?.conversionsConfig]
  );

  // Build source fields from the AI recommendation field mappings
  // This replaces the separate useSourceFields hook since that endpoint doesn't exist
  // Deduplicate by field_name to prevent React key warnings
  const sourceFields: SourceField[] = useMemo(() => {
    if (!conversionsConfig?.fields) return [];
    const seen = new Set<string>();
    return Object.entries(conversionsConfig.fields)
      .map(([fieldName, mapping]) => ({
        field_name: mapping.sourceField || fieldName,
        field_type: "STRING",
        occurrence_count: 1,
      }))
      .filter((field) => {
        if (seen.has(field.field_name)) return false;
        seen.add(field.field_name);
        return true;
      });
  }, [conversionsConfig]);

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [fieldMappings, setFieldMappings] = useState<Partial<FieldMapping>[]>(
    []
  );
  const isInitializedRef = useRef(false);

  // Compute initial values from existing data or AI recommendations
  const computeInitialState = useCallback(() => {
    if (existingData) {
      return {
        events: existingData.selected_events,
        mappings: existingData.field_mappings,
      };
    }
    
    if (conversionsConfig && events.length > 0) {
      // Pre-select AI recommended conversion event
      const recommendedEvent = conversionsConfig.conversionEvents;
      
      // Find the actual event name with correct casing from the events list
      const matchedEvents = events.filter((e) =>
        e.toLowerCase() === recommendedEvent?.toLowerCase()
      );

      // Pre-fill field mappings from AI recommendations
      const initialMappings: Partial<FieldMapping>[] = CONVERSION_FIELD_TARGETS.map((target) => {
        // Look up AI suggestion for this field from conversionsConfig.fields
        const aiMapping = conversionsConfig.fields[target.field];
        const suggestedSource = aiMapping?.sourceField ?? "";
        const suggestedFallback = aiMapping?.fallback ?? "";
        const suggestedDefault = aiMapping?.default !== undefined 
          ? String(aiMapping.default) 
          : "";

        return {
          target_field: target.field,
          source_field: suggestedSource,
          fallback_field: suggestedFallback,
          default_value: suggestedDefault,
          is_required: target.required,
        };
      });

      return {
        events: matchedEvents,
        mappings: initialMappings,
      };
    }
    
    return { events: [], mappings: [] };
  }, [existingData, conversionsConfig, events]);

  // Initialize state when data becomes available
  useEffect(() => {
    if (isInitializedRef.current || isLoading) return;
    
    const { events: initialEvents, mappings: initialMappings } = computeInitialState();
    
    if (existingData || (conversionsConfig && events.length > 0)) {
      queueMicrotask(() => {
        setSelectedEvents(initialEvents);
        setFieldMappings(initialMappings);
      });
    }
    
    isInitializedRef.current = true;
  }, [isLoading, computeInitialState, existingData, conversionsConfig, events]);

  // Build suggested events list from AI recommendations
  const suggestedEvents = useMemo(() => {
    if (!conversionsConfig?.conversionEvents) return [];
    return [conversionsConfig.conversionEvents.toLowerCase()];
  }, [conversionsConfig]);

  // Validate form data
  useEffect(() => {
    const data = {
      selected_events: selectedEvents,
      field_mappings: fieldMappings.filter(
        (m) => m.source_field
      ) as FieldMapping[],
    };
    const result = conversionEventsConfigSchema.safeParse(data);
    onValidationChange(result.success);
  }, [selectedEvents, fieldMappings, onValidationChange]);

  // Register getData function
  const getData = useCallback((): StepData | null => {
    const data = {
      selected_events: selectedEvents,
      field_mappings: fieldMappings.filter(
        (m) => m.source_field
      ) as FieldMapping[],
    };
    const result = conversionEventsConfigSchema.safeParse(data);
    if (result.success) {
      return result.data;
    }
    return null;
  }, [selectedEvents, fieldMappings]);

  useEffect(() => {
    onRegisterData(getData);
  }, [onRegisterData, getData]);


  const fieldTargets = CONVERSION_FIELD_TARGETS.map((t) => ({
    field: t.field,
    label: t.label,
    required: t.required,
  }));

  if (isLoading) {
    return (
      <StepWrapper
        title="Conversion Events Configuration"
        description="Loading configuration..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-muted-foreground">Loading events and recommendations...</span>
        </div>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper
      title="Conversion Events Configuration"
      description="Select which events represent conversions and map their fields for accurate attribution tracking."
    >
      <div className="space-y-8">
        {/* Event Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">
              Select Conversion Events{" "}
              <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose the events that represent completed conversions (e.g.,
              purchases, sign-ups).
            </p>
          </div>

          <EventSelector
            events={events}
            value={selectedEvents}
            onChange={(value) => setSelectedEvents(value as string[])}
            mode="multi"
            placeholder="Search conversion events..."
            suggestedEvents={suggestedEvents}
            suggestedLabel="AI Recommended"
          />
        </div>

        {/* Field Mappings */}
        {selectedEvents.length > 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-base font-medium">Field Mappings</Label>
              <p className="text-sm text-muted-foreground mt-1">
                Map your event properties to standard conversion fields for
                accurate tracking.
              </p>
            </div>

            <FieldMappingGrid
              fieldTargets={fieldTargets}
              mappings={fieldMappings}
              sourceFields={sourceFields}
              onChange={setFieldMappings}
            />
          </div>
        )}
      </div>
    </StepWrapper>
  );
}
