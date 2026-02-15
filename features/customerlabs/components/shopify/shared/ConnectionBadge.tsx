"use client";

import { cn } from "@/lib/utils";
import type { ConnectionMethod } from "@/features/customerlabs/types/shopify";

interface ConnectionBadgeProps {
  method: ConnectionMethod;
  className?: string;
}

const badgeStyles: Record<ConnectionMethod, { bg: string; text: string; label: string }> = {
  app_installed: {
    bg: "bg-green-100",
    text: "text-green-700",
    label: "App Installed",
  },
  custom_app: {
    bg: "bg-blue-100",
    text: "text-blue-700",
    label: "Custom App",
  },
};

export function ConnectionBadge({ method, className }: ConnectionBadgeProps) {
  const style = badgeStyles[method];

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium",
        style.bg,
        style.text,
        className
      )}
    >
      {style.label}
    </span>
  );
}
