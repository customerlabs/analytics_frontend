"use client";

import { Store, Loader2, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ConfigDrawerHeader } from "@/components/shared";
import { useShopifyImport } from "@/features/customerlabs/hooks/useShopifyImport";
import type { ShopifyImportStep } from "@/features/customerlabs/types/shopify";

import {
  StoreSelectionStep,
  ConnectStoreStep,
  ImportConfirmStep,
  ImportStatusStep,
} from "./steps";

// Step definitions for the header indicator
const steps: Array<{ id: ShopifyImportStep; label: string }> = [
  { id: 1, label: "Stores" },
  { id: 2, label: "Connect" },
  { id: 3, label: "Confirm" },
  { id: 4, label: "Status" },
];

export function ShopifyImportDrawer() {
  const {
    isOpen,
    step,
    saving,
    selectedStore,
    close,
    setStep,
    startImport,
    isLoadingStores,
    isRefreshingStores,
    refreshStores,
    hasStores,
  } = useShopifyImport();

  // Determine which steps to show in the header
  // Hide "Connect" step if user has stores and is on step 1, 3, or 4
  const visibleSteps = step === 2 ? steps : steps.filter((s) => s.id !== 2);

  // Map current step for display (skip step 2 in indicator if not on connect)
  const displayStep = step === 2 ? 2 : step > 2 ? step - 1 : step;
  const mappedSteps = visibleSteps.map((s, idx) => ({
    ...s,
    id: (idx + 1) as ShopifyImportStep,
  }));

  // Determine button states
  const canProceedStep1 = !!selectedStore;
  const canProceedStep3 = !!selectedStore;
  const isOnFinalStep = step === 4;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      setStep(3); // Skip connect step, go to confirm
    } else if (step === 2) {
      // Connect step - handled by form submission
    } else if (step === 3) {
      // Start import
      startImport();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1); // Go back to store selection
    } else if (step === 3) {
      setStep(1); // Go back to store selection
    }
  };

  const handleStepClick = (clickedStep: ShopifyImportStep) => {
    // Only allow navigating to previous steps or step 1
    if (clickedStep < step || clickedStep === 1) {
      // Map back from display step to actual step
      if (step !== 2) {
        // If not on connect step, clicking step 2 in display = step 3 actual
        const actualStep = clickedStep === 1 ? 1 : clickedStep + 1;
        setStep(actualStep as ShopifyImportStep);
      } else {
        setStep(clickedStep);
      }
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && close()}>
      <SheetContent
        side="right"
        className="w-full max-w-3xl p-0 flex flex-col"
        showCloseButton={false}
      >
        {/* Visually hidden title for accessibility */}
        <SheetTitle className="sr-only">Shopify Data Import</SheetTitle>

        {/* Header with gradient */}
        <ConfigDrawerHeader<number>
          icon={<Store className="w-6 h-6 text-primary-foreground" />}
          title="Shopify Data Import"
          description="Import historical data from your store"
          onClose={close}
          onRefresh={step === 1 ? refreshStores : undefined}
          isRefreshing={isRefreshingStores}
          steps={mappedSteps}
          currentStep={displayStep}
          onStepClick={(s) => handleStepClick(s as ShopifyImportStep)}
        />

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          {isLoadingStores ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <div className="text-sm text-muted-foreground">
                  Loading stores...
                </div>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && <StoreSelectionStep />}
              {step === 2 && <ConnectStoreStep />}
              {step === 3 && <ImportConfirmStep />}
              {step === 4 && <ImportStatusStep />}
            </>
          )}
        </div>

        {/* Footer */}
        {!isLoadingStores && (
          <div className="px-6 py-4 border-t border-border bg-muted shrink-0 flex items-center justify-between">
            <div>
              {(step === 2 || step === 3) && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={saving}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              {step === 1 && hasStores() && (
                <Button onClick={handleNext} disabled={!canProceedStep1}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}

              {step === 3 && (
                <Button onClick={handleNext} disabled={saving || !canProceedStep3}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Starting Import...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Start Import
                    </>
                  )}
                </Button>
              )}

              {step === 4 && (
                <Button onClick={close}>Done</Button>
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
