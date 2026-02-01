"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAccountTemplates } from "../hooks";
import { AccountTemplateGrid } from "./AccountTemplateGrid";
import { AccountTemplateGridSkeleton } from "./skeletons";
import { CustomerLabsAuthorizeModal } from "@/features/customerlabs/components/CustomerLabsAuthorizeModal";
import { useOnboardingSheet } from "@/features/customerlabs/hooks/useOnboardingSheet";
import type { AccountTemplate } from "../types";

interface AddAccountPanelProps {
  workspaceId: string;
  isOpen: boolean;
  onClose?: () => void;
  className?: string;
}

export function AddAccountPanel({
  workspaceId,
  isOpen,
  onClose,
  className,
}: AddAccountPanelProps) {
  const { data: templates, isLoading } = useAccountTemplates({
    workspaceId,
    enabled: isOpen,
  });

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<AccountTemplate | null>(null);
  const openOnboarding = useOnboardingSheet((state) => state.open);

  const handleTemplateSelect = useCallback((template: AccountTemplate) => {
    if (template.account_type === "customerlabs") {
      setSelectedTemplate(template);
      setShowAuthModal(true);
    } else {
      console.log("Selected template:", template.name);
    }
  }, []);

  const handleAccountCreated = useCallback(
    (accountId: string) => {
      setShowAuthModal(false);
      onClose?.();
      openOnboarding(accountId);
    },
    [onClose, openOnboarding]
  );

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6",
        "animate-in fade-in-0 slide-in-from-top-2 duration-200",
        className
      )}
    >
      <div className="mb-4">
        <h3 className="text-lg font-medium text-foreground">
          Select a source to connect
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Choose from available integrations to add to your workspace
        </p>
      </div>

      {isLoading ? (
        <AccountTemplateGridSkeleton count={6} />
      ) : (
        <AccountTemplateGrid
          templates={templates ?? []}
          showSearch
          groupByCategory
          onSelect={handleTemplateSelect}
        />
      )}

      {selectedTemplate && (
        <CustomerLabsAuthorizeModal
          workspaceId={workspaceId}
          templateId={selectedTemplate.id}
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setSelectedTemplate(null);
          }}
          onAccountCreated={handleAccountCreated}
        />
      )}
    </div>
  );
}
