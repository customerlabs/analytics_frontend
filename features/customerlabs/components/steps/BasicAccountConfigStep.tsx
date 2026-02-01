"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDownIcon } from "lucide-react";
import { StepWrapper } from "../shared/StepWrapper";
import {
  useOnboardingData,
  useAvailableEvents,
} from "../../hooks/useOnboardingData";
import {
  getTimezones,
  getCurrencies,
  BUSINESS_CATEGORIES,
  getBrowserTimezone,
} from "../../utils/form-options";
import { basicAccountConfigSchema } from "../../schemas/onboarding-schemas";
import { StepKey } from "../../types";
import type { BasicAccountConfig, StepData } from "../../types";

interface BasicAccountConfigStepProps {
  accountId: string;
  onValidationChange: (isValid: boolean) => void;
  onRegisterData: (getData: () => StepData | null) => void;
}

export function BasicAccountConfigStep({
  accountId,
  onValidationChange,
  onRegisterData,
}: BasicAccountConfigStepProps) {
  const { data: onboardingData, isLoading: onboardingLoading } = useOnboardingData(accountId);
  const { data: eventsData, isLoading: eventsLoading } = useAvailableEvents(accountId);

  const isLoading = onboardingLoading || eventsLoading;

  const existingData = onboardingData?.step_data?.[StepKey.BASIC_ACCOUNT] as
    | BasicAccountConfig
    | undefined;

  const [formData, setFormData] = useState<BasicAccountConfig>({
    timezone: existingData?.timezone ?? getBrowserTimezone(),
    currency: existingData?.currency ?? "USD",
    business_category: existingData?.business_category ?? "",
    new_user_event: existingData?.new_user_event ?? "",
    repeat_user_event: existingData?.repeat_user_event ?? "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const timezones = getTimezones();
  const currencies = getCurrencies();
  const events = eventsData?.events ?? [];

  // Validate form data
  useEffect(() => {
    const result = basicAccountConfigSchema.safeParse(formData);
    if (result.success) {
      setErrors({});
      onValidationChange(true);
    } else {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((issue) => {
        if (issue.path[0]) {
          newErrors[issue.path[0] as string] = issue.message;
        }
      });
      setErrors(newErrors);
      onValidationChange(false);
    }
  }, [formData, onValidationChange]);

  // Register getData function
  const getData = useCallback((): StepData | null => {
    const result = basicAccountConfigSchema.safeParse(formData);
    if (result.success) {
      return result.data;
    }
    return null;
  }, [formData]);

  useEffect(() => {
    onRegisterData(getData);
  }, [onRegisterData, getData]);

  // Update form when existing data loads
  useEffect(() => {
    if (existingData) {
      setFormData((prev) => ({
        ...prev,
        ...existingData,
      }));
    }
  }, [existingData]);

  const handleChange = (field: keyof BasicAccountConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (isLoading) {
    return (
      <StepWrapper
        title="Basic Account Configuration"
        description="Loading configuration..."
      >
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
          <span className="ml-3 text-muted-foreground">Loading configuration...</span>
        </div>
      </StepWrapper>
    );
  }

  return (
    <StepWrapper
      title="Basic Account Configuration"
      description="Configure your account's basic settings for accurate data processing and reporting."
    >
      <div className="space-y-6">
        {/* Timezone & Currency Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="timezone">
              Timezone <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <select
                id="timezone"
                value={formData.timezone}
                onChange={(e) => handleChange("timezone", e.target.value)}
                className={cn(
                  "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "appearance-none cursor-pointer",
                  errors.timezone && "border-destructive",
                )}
              >
                <option value="">Select timezone...</option>
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.timezone && (
              <p className="text-xs text-destructive">{errors.timezone}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="currency">
              Currency <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <select
                id="currency"
                value={formData.currency}
                onChange={(e) => handleChange("currency", e.target.value)}
                className={cn(
                  "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "appearance-none cursor-pointer",
                  errors.currency && "border-destructive",
                )}
              >
                <option value="">Select currency...</option>
                {currencies.map((curr) => (
                  <option key={curr.value} value={curr.value}>
                    {curr.label}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            {errors.currency && (
              <p className="text-xs text-destructive">{errors.currency}</p>
            )}
          </div>
        </div>

        {/* Business Category */}
        <div className="space-y-2">
          <Label htmlFor="business_category">
            Business Category <span className="text-destructive">*</span>
          </Label>
          <div className="relative">
            <select
              id="business_category"
              value={formData.business_category}
              onChange={(e) =>
                handleChange("business_category", e.target.value)
              }
              className={cn(
                "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "appearance-none cursor-pointer",
                errors.business_category && "border-destructive",
              )}
            >
              <option value="">Select business category...</option>
              {BUSINESS_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
          {errors.business_category && (
            <p className="text-xs text-destructive">
              {errors.business_category}
            </p>
          )}
        </div>

        {/* User Identification Section */}
        <div className="pt-4 border-t border-border">
          <h3 className="font-medium text-foreground mb-4">
            User Identification Events
          </h3>
          <p className="text-sm text-muted-foreground mb-6">
            Specify which events contain user identification information. This
            helps us properly attribute user actions across sessions.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new_user_event">New User Event</Label>
              <div className="relative">
                <select
                  id="new_user_event"
                  value={formData.new_user_event}
                  onChange={(e) =>
                    handleChange("new_user_event", e.target.value)
                  }
                  className={cn(
                    "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "appearance-none cursor-pointer",
                  )}
                >
                  <option key="__placeholder_new_user__" value="">
                    Select event (optional)...
                  </option>
                  {events.map((eventName) => (
                    <option key={eventName} value={eventName}>
                      {eventName}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground">
                Event triggered for new users
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="repeat_user_event">Repeat User Event</Label>
              <div className="relative">
                <select
                  id="repeat_user_event"
                  value={formData.repeat_user_event}
                  onChange={(e) =>
                    handleChange("repeat_user_event", e.target.value)
                  }
                  className={cn(
                    "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    "appearance-none cursor-pointer",
                  )}
                >
                  <option key="__placeholder_repeat_user__" value="">
                    Select event (optional)...
                  </option>
                  {events.map((eventName) => (
                    <option key={eventName} value={eventName}>
                      {eventName}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
              <p className="text-xs text-muted-foreground">
                Event triggered for returning users
              </p>
            </div>
          </div>
        </div>
      </div>
    </StepWrapper>
  );
}
