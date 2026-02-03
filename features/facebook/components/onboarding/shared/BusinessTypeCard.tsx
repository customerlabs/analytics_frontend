"use client";

import { CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BusinessType } from "../../../types/config";

interface BusinessTypeCardProps {
  type: BusinessType;
  title: string;
  description: string;
  icon: React.ReactNode;
  isSelected: boolean;
  onSelect: () => void;
}

export function BusinessTypeCard({
  title,
  description,
  icon,
  isSelected,
  onSelect,
}: BusinessTypeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "p-6 border-2 rounded-lg text-left transition-all",
        isSelected
          ? "border-blue-600 bg-blue-50"
          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
      )}
    >
      <div className="flex items-start justify-between mb-3">
        {icon}
        {isSelected && <CheckCircle className="w-5 h-5 text-blue-600" />}
      </div>
      <div className="font-semibold text-gray-900 mb-1">{title}</div>
      <div className="text-sm text-gray-600">{description}</div>
    </button>
  );
}
