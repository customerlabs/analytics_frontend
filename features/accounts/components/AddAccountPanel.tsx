"use client";

import { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useAccountTemplates } from "../hooks";
import { AccountTemplateGrid } from "./AccountTemplateGrid";
import { AccountTemplateGridSkeleton } from "./skeletons";
import { CustomerLabsAuthorizeModal } from "@/features/customerlabs/components/CustomerLabsAuthorizeModal";
import { FacebookAuthorizeModal, type AccountResponse } from "@/features/facebook";
import type { AccountTemplate } from "../types";

type ActiveModal = "customerlabs" | "facebook" | null;

interface AddAccountPanelProps {
  workspaceId: string;
  isOpen: boolean;
  onClose?: () => void;
  onAccountCreated?: (account: AccountResponse) => void;
  className?: string;
}

export function AddAccountPanel({
  workspaceId,
  isOpen,
  onAccountCreated,
  className,
}: AddAccountPanelProps) {
  const { data: templates, isLoading } = useAccountTemplates({
    workspaceId,
    enabled: isOpen,
  });

  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<AccountTemplate | null>(null);

  const handleTemplateSelect = useCallback((template: AccountTemplate) => {
    setSelectedTemplate(template);

    if (template.account_type === "customerlabs") {
      setActiveModal("customerlabs");
    } else if (
      template.platform.toLowerCase() === "facebook" ||
      template.platform.toLowerCase() === "meta" ||
      template.system_name.toLowerCase().includes("facebook")
    ) {
      setActiveModal("facebook");
    } else {
      // Future: handle other integrations
      console.log("Selected template (not yet implemented):", template.name);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setActiveModal(null);
    setSelectedTemplate(null);
  }, []);

  const handleCustomerLabsAccountCreated = useCallback(
    (accountId: string) => {
      handleCloseModal();
      // Create a minimal AccountResponse for backward compatibility
      onAccountCreated?.({
        id: accountId,
        workspace_id: workspaceId,
        account_id: accountId,
        unique_name: "",
        template_id: selectedTemplate?.id || "",
        account_type: "customerlabs",
        status: "pending",
        auth_data: {},
        config_data: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    },
    [handleCloseModal, onAccountCreated, workspaceId, selectedTemplate]
  );

  const handleFacebookAccountCreated = useCallback(
    (account: AccountResponse) => {
      handleCloseModal();
      onAccountCreated?.(account);
    },
    [handleCloseModal, onAccountCreated]
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

      {/* CustomerLabs Modal */}
      {selectedTemplate && activeModal === "customerlabs" && (
        <CustomerLabsAuthorizeModal
          workspaceId={workspaceId}
          templateId={selectedTemplate.id}
          isOpen={true}
          onClose={handleCloseModal}
          onAccountCreated={handleCustomerLabsAccountCreated}
        />
      )}

      {/* Facebook Modal */}
      {selectedTemplate && activeModal === "facebook" && (
        <FacebookAuthorizeModal
          workspaceId={workspaceId}
          templateId={selectedTemplate.id}
          isOpen={true}
          onClose={handleCloseModal}
          onAccountCreated={handleFacebookAccountCreated}
        />
      )}
    </div>
  );
}
