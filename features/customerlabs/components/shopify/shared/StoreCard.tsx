"use client";

import { Check, Store } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionBadge } from "./ConnectionBadge";
import type { ShopifyStore } from "@/features/customerlabs/types/shopify";

interface StoreCardProps {
  store: ShopifyStore;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function StoreCard({
  store,
  isSelected,
  onSelect,
  disabled = false,
}: StoreCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        isSelected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Store Icon */}
          <div
            className={cn(
              "flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center",
              isSelected ? "bg-primary/10" : "bg-muted"
            )}
          >
            <Store
              className={cn(
                "w-5 h-5",
                isSelected ? "text-primary" : "text-muted-foreground"
              )}
            />
          </div>

          {/* Store Details */}
          <div className="min-w-0 flex-1">
            <h4 className="font-medium text-foreground truncate">
              {store.source_name}
            </h4>
            <p className="text-sm text-muted-foreground truncate">
              {store.shopify_domain}
            </p>
            <div className="mt-1.5">
              <ConnectionBadge method={store.connection_method} />
            </div>
          </div>
        </div>

        {/* Selection Indicator */}
        <div
          className={cn(
            "flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors",
            isSelected
              ? "border-primary bg-primary"
              : "border-muted-foreground/30"
          )}
        >
          {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
        </div>
      </div>
    </button>
  );
}
