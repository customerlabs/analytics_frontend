"use client";

import { useState } from "react";
import { BackfillOptionCard } from "../backfill/BackfillOptionCard";
import { BackfillSheet } from "../backfill/BackfillSheet";
import { ShopifyImportDrawer } from "../shopify/ShopifyImportDrawer";
import { useShopifyImportStore } from "../../hooks/useShopifyImport";
import { useAccount } from "@/features/accounts/hooks";
import {
  BACKFILL_PLATFORMS,
  type BackfillPlatformConfig,
} from "../../types/backfill";

interface BackfillTabProps {
  accountId: string;
}

export function BackfillTab({ accountId }: BackfillTabProps) {
  const [selectedPlatform, setSelectedPlatform] =
    useState<BackfillPlatformConfig | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Fetch account data to get workspace_id, app_id, user_email
  const { data: account } = useAccount({ accountId });

  // Get the open function from Shopify import store
  const openShopifyImport = useShopifyImportStore((state) => state.open);

  const handleCardClick = (platform: BackfillPlatformConfig) => {
    if (platform.id === "shopify") {
      // Open ShopifyImportDrawer with account context
      if (account) {
        openShopifyImport({
          accountId,
          workspaceId: account.workspace_id,
          appId: (account.auth_data?.app_id as string) || "",
          userEmail: (account.auth_data?.user_email as string) || "",
        });
      }
    } else {
      // Open generic BackfillSheet for other platforms
      setSelectedPlatform(platform);
      setIsSheetOpen(true);
    }
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
    setSelectedPlatform(null);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground mb-2">
          Backfill Data
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Configure and manage data backfill operations for historical data
          import.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {BACKFILL_PLATFORMS.map((platform) => (
            <BackfillOptionCard
              key={platform.id}
              platform={platform}
              onClick={() => handleCardClick(platform)}
              isSelected={selectedPlatform?.id === platform.id}
            />
          ))}
        </div>
      </div>

      {/* Generic BackfillSheet for non-Shopify platforms */}
      <BackfillSheet
        platform={selectedPlatform}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        accountId={accountId}
      />

      {/* Shopify-specific Import Drawer */}
      <ShopifyImportDrawer />
    </div>
  );
}
