"use client";

import { useState } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { PlatformIcon } from "./PlatformIcon";
import type { AccountTemplate } from "../types";

const accountTemplateCardVariants = cva(
  "group relative flex items-center gap-3 rounded-lg border bg-card p-4 transition-all duration-200",
  {
    variants: {
      variant: {
        default:
          "border-border hover:border-primary/30 hover:shadow-md cursor-pointer",
        selected: "border-primary bg-primary/5 shadow-md",
        connected: "border-border bg-muted/30 cursor-default",
        disabled: "border-border/50 opacity-50 cursor-not-allowed",
      },
      size: {
        default: "p-4",
        compact: "p-3",
        spacious: "p-6",
      },
      layout: {
        horizontal: "flex-row",
        vertical: "flex-col text-center",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      layout: "vertical",
    },
  }
);

export interface AccountTemplateCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "onSelect">,
    VariantProps<typeof accountTemplateCardVariants> {
  template: AccountTemplate;
  selected?: boolean;
  showDescription?: boolean;
  onSelect?: (template: AccountTemplate) => void;
}

export function AccountTemplateCard({
  template,
  selected = false,
  showDescription = false,
  variant,
  size,
  layout,
  onSelect,
  className,
  ...props
}: AccountTemplateCardProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Determine the effective variant based on state
  const isConnectedSingle = template.is_connected && !template.allows_multiple;
  const effectiveVariant = selected
    ? "selected"
    : isConnectedSingle
      ? "connected"
      : variant;

  const isInteractive = !isConnectedSingle;

  const handleClick = () => {
    if (isConnectedSingle) {
      // Show tooltip for connected single-account templates
      setShowTooltip(true);
      setTimeout(() => setShowTooltip(false), 2000);
      return;
    }
    if (onSelect) {
      onSelect(template);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      role="button"
      tabIndex={isInteractive ? 0 : -1}
      aria-pressed={selected}
      aria-disabled={!isInteractive}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={cn(
        accountTemplateCardVariants({ variant: effectiveVariant, size, layout }),
        className
      )}
      {...props}
    >
      {/* Tooltip for connected templates */}
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 z-10 px-3 py-1.5 text-xs font-medium text-white bg-foreground rounded-md shadow-lg whitespace-nowrap">
          Already connected
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
        </div>
      )}

      {/* Icon with brand color background */}
      <div
        className={cn(
          "shrink-0 rounded-lg p-2",
          layout === "vertical" && "mx-auto"
        )}
        style={{
          backgroundColor: template.assets.color
            ? `${template.assets.color}15`
            : undefined,
        }}
      >
        <PlatformIcon
          provider={template.platform}
          iconPath={template.assets.icon}
          brandColor={template.assets.color}
          size={size === "compact" ? "sm" : "md"}
        />
      </div>

      {/* Content */}
      <div className={cn("min-w-0 flex-1", layout === "vertical" && "mt-2")}>
        <h3 className="truncate text-sm font-medium text-foreground">
          {template.name}
        </h3>
        {showDescription && template.description && (
          <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
            {template.description}
          </p>
        )}
      </div>

      {/* Selection indicator */}
      {selected && (
        <div className="absolute right-3 top-3">
          <div className="flex size-5 items-center justify-center rounded-full bg-primary">
            <Check className="size-3 text-primary-foreground" strokeWidth={3} />
          </div>
        </div>
      )}

      {/* Connected badge for single-account templates */}
      {isConnectedSingle && (
        <div className="absolute right-3 top-3">
          <div className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-muted-foreground bg-muted rounded-full">
            <Link className="size-3" />
            Connected
          </div>
        </div>
      )}

      {/* Beta badge */}
      {template.is_beta && !isConnectedSingle && !selected && (
        <div className="absolute right-3 top-3">
          <span className="px-2 py-0.5 text-xs font-medium text-amber-600 bg-amber-100 rounded-full">
            Beta
          </span>
        </div>
      )}
    </div>
  );
}
