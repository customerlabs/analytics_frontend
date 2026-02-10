"use client";

import Image from "next/image";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BackfillPlatformConfig } from "../../types/backfill";

interface BackfillOptionCardProps {
  platform: BackfillPlatformConfig;
  onClick: () => void;
  disabled?: boolean;
  isSelected?: boolean;
}

export function BackfillOptionCard({
  platform,
  onClick,
  disabled = false,
  isSelected = false,
}: BackfillOptionCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "relative p-6 border-2 rounded-lg text-left transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5 ring-2 ring-primary/20"
          : "border-border hover:border-primary/50 hover:bg-accent/50",
        disabled && "opacity-50 cursor-not-allowed hover:border-border hover:bg-transparent"
      )}
    >
      {/* Selection indicator */}
      {isSelected && (
        <div className="absolute top-3 right-3 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Check className="size-3" />
        </div>
      )}

      <div className="flex items-start mb-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
          <Image
            src={platform.icon}
            alt={platform.title}
            width={24}
            height={24}
            className="object-contain"
          />
        </div>
      </div>
      <div className="font-semibold text-foreground mb-1">{platform.title}</div>
      <div className="text-sm text-muted-foreground">{platform.description}</div>
    </button>
  );
}
