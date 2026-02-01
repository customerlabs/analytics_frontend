"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { ChevronDownIcon, XIcon } from "lucide-react";
import type { FieldMapping, SourceField } from "../../types";

interface FieldMappingRowProps {
  targetField: string;
  targetLabel: string;
  isRequired: boolean;
  value: Partial<FieldMapping>;
  sourceFields: SourceField[];
  onChange: (value: Partial<FieldMapping>) => void;
  className?: string;
}

export function FieldMappingRow({
  targetField,
  targetLabel,
  isRequired,
  value,
  sourceFields,
  onChange,
  className,
}: FieldMappingRowProps) {
  const [showFallback, setShowFallback] = useState(!!value.fallback_field);
  const [showDefault, setShowDefault] = useState(!!value.default_value);

  const handleSourceChange = (sourceField: string) => {
    onChange({
      ...value,
      target_field: targetField,
      source_field: sourceField,
      is_required: isRequired,
    });
  };

  const handleFallbackChange = (fallbackField: string) => {
    onChange({
      ...value,
      fallback_field: fallbackField || undefined,
    });
  };

  const handleDefaultChange = (defaultValue: string) => {
    onChange({
      ...value,
      default_value: defaultValue || undefined,
    });
  };

  return (
    <div
      className={cn(
        "grid grid-cols-12 gap-4 items-start py-3 border-b border-border last:border-0",
        className,
      )}
    >
      {/* Target Field Label */}
      <div className="col-span-3">
        <Label className="text-sm font-medium">
          {targetLabel}
          {isRequired && <span className="text-destructive ml-1">*</span>}
        </Label>
      </div>

      {/* Source Field Select */}
      <div className="col-span-4">
        <div className="relative">
          <select
            value={value.source_field || ""}
            onChange={(e) => handleSourceChange(e.target.value)}
            className={cn(
              "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              "appearance-none cursor-pointer",
            )}
          >
            <option value="">Select source field...</option>
            {sourceFields.map((field) => (
              <option key={field.field_name} value={field.field_name}>
                {field.field_name} ({field.field_type})
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {/* Fallback & Default Fields */}
      <div className="col-span-5 flex flex-col gap-2">
        {showFallback ? (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <select
                value={value.fallback_field || ""}
                onChange={(e) => handleFallbackChange(e.target.value)}
                className={cn(
                  "w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm",
                  "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  "appearance-none cursor-pointer",
                )}
              >
                <option value="">Fallback field...</option>
                {sourceFields.map((field) => (
                  <option key={field.field_name} value={field.field_name}>
                    {field.field_name}
                  </option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <button
              type="button"
              onClick={() => {
                setShowFallback(false);
                handleFallbackChange("");
              }}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowFallback(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            + Add fallback
          </button>
        )}

        {showDefault ? (
          <div className="flex items-center gap-2">
            <Input
              value={value.default_value || ""}
              onChange={(e) => handleDefaultChange(e.target.value)}
              placeholder="Default value..."
              className="flex-1 h-9"
            />
            <button
              type="button"
              onClick={() => {
                setShowDefault(false);
                handleDefaultChange("");
              }}
              className="p-1 text-muted-foreground hover:text-foreground"
            >
              <XIcon className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowDefault(true)}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            + Add default value
          </button>
        )}
      </div>
    </div>
  );
}
