"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { container: "size-6", text: "text-xs" },
  md: { container: "size-8", text: "text-sm" },
  lg: { container: "size-12", text: "text-lg" },
};

interface PlatformIconProps {
  provider: string;
  iconPath?: string;
  brandColor?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function PlatformIcon({
  provider,
  iconPath,
  brandColor,
  size = "md",
  className,
}: PlatformIconProps) {
  const [hasError, setHasError] = useState(false);
  const { container, text } = sizeMap[size];

  // Fallback to letter-based icon when no icon path or image fails to load
  if (!iconPath || hasError) {
    return (
      <div
        className={cn(
          container,
          "flex items-center justify-center rounded-lg font-semibold text-white",
          className
        )}
        style={{ backgroundColor: brandColor || "#6B7280" }}
      >
        <span className={text}>{provider.charAt(0).toUpperCase()}</span>
      </div>
    );
  }

  // Determine image dimensions based on size
  const dimensions = size === "lg" ? 48 : size === "md" ? 32 : 24;

  return (
    <Image
      src={`/icons/platforms/${iconPath}`}
      alt={`${provider} icon`}
      width={dimensions}
      height={dimensions}
      className={cn(container, "object-contain", className)}
      onError={() => setHasError(true)}
    />
  );
}
