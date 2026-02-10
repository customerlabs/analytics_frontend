"use client";

import { Settings, Loader2, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useFacebookConfig } from "../../hooks/useFacebookConfig";
import { ConfigDrawerHeader } from "@/components/shared";
import { ValidationError } from "./shared/ValidationError";
import type { ConfigStep } from "../../types/config";
import { PixelSelectionStep } from "./steps/PixelSelectionStep";
import { BusinessTypeStep } from "./steps/BusinessTypeStep";
import { EventsConfigStep } from "./steps/EventsConfigStep";

interface FacebookConfigDrawerProps {
  accountId?: string;
}

export function FacebookConfigDrawer({ accountId }: FacebookConfigDrawerProps) {
  const {
    isOpen,
    step,
    setStep,
    loading,
    validationError,
    close,
    nextStep,
    prevStep,
    selectedPixelId,
    form,
    loadingEvents,
    saving,
    saveConfiguration,
    pixelEvents,
    isRefreshing,
    handleForceRefresh,
  } = useFacebookConfig();

  const canProceedStep1 = !!selectedPixelId && !loadingEvents;
  const canProceedStep2 = !!form.businessType;
  const canSave =
    form.businessType === "LEAD_GEN"
      ? !!form.lead.primaryEvent
      : !!form.ecommerce.purchaseEvent;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) nextStep();
    if (step === 2 && canProceedStep2) nextStep();
  };

  const handleSave = async () => {
    await saveConfiguration();
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-full max-w-2xl p-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Visually hidden title for accessibility */}
        <SheetTitle className="sr-only">Account Configuration</SheetTitle>

        {/* Header with gradient */}
        <ConfigDrawerHeader<ConfigStep>
          icon={<Settings className="w-6 h-6 text-primary-foreground" />}
          title="Account Configuration"
          description="Configure your conversion tracking"
          onClose={close}
          onRefresh={handleForceRefresh}
          isRefreshing={isRefreshing}
          steps={[
            { id: 1, label: "Pixel" },
            { id: 2, label: "Business Type" },
            { id: 3, label: "Events" },
          ]}
          currentStep={step}
          onStepClick={setStep}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <div className="text-sm text-muted-foreground">
                  Loading configuration...
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Validation Error */}
              {validationError && (
                <ValidationError message={validationError} />
              )}

              {/* Step Content */}
              {step === 1 && <PixelSelectionStep />}
              {step === 2 && <BusinessTypeStep />}
              {step === 3 && <EventsConfigStep />}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border bg-muted shrink-0 flex items-center justify-between">
          <div>
            {step > 1 && (
              <Button variant="outline" onClick={prevStep} disabled={loading || saving}>
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {step < 3 ? (
              <Button
                onClick={handleNext}
                disabled={
                  loading ||
                  (step === 1 && !canProceedStep1) ||
                  (step === 2 && !canProceedStep2)
                }
              >
                {loadingEvents ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Loading events...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleSave}
                disabled={saving || !canSave}
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    Save Configuration
                    <Check className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
