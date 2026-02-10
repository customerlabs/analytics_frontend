"use client";

import { useState } from "react";
import { BackfillOptionCard } from "../backfill/BackfillOptionCard";
import { BackfillSheet } from "../backfill/BackfillSheet";
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

  const handleCardClick = (platform: BackfillPlatformConfig) => {
    setSelectedPlatform(platform);
    setIsSheetOpen(true);
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

      <BackfillSheet
        platform={selectedPlatform}
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        accountId={accountId}
      />
    </div>
  );
}
