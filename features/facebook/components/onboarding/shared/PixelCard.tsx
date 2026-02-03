"use client";

import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FacebookPixel } from "../../../types/config";

interface PixelCardProps {
  pixel: FacebookPixel;
  isSelected: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function PixelCard({
  pixel,
  isSelected,
  onSelect,
  disabled = false,
}: PixelCardProps) {
  return (
    <button
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        "w-full text-left p-4 border-2 rounded-lg transition-all",
        isSelected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-medium text-gray-900">{pixel.name}</div>
            {pixel.isDefault && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded">
                Default
              </span>
            )}
          </div>
          <div className="text-sm text-gray-500">Pixel ID: {pixel.id}</div>
        </div>
        {isSelected && (
          <div className="ml-4">
            <CheckCircle className="w-5 h-5 text-blue-600" />
          </div>
        )}
      </div>
    </button>
  );
}
