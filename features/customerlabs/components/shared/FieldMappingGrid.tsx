"use client";

import { cn } from "@/lib/utils";
import { FieldMappingRow } from "./FieldMappingRow";
import type { FieldMapping, SourceField } from "../../types";

interface FieldTarget {
  field: string;
  label: string;
  required: boolean;
}

interface FieldMappingGridProps {
  fieldTargets: FieldTarget[];
  mappings: Partial<FieldMapping>[];
  sourceFields: SourceField[];
  onChange: (mappings: Partial<FieldMapping>[]) => void;
  className?: string;
}

export function FieldMappingGrid({
  fieldTargets,
  mappings,
  sourceFields,
  onChange,
  className,
}: FieldMappingGridProps) {
  const getMappingForTarget = (targetField: string) => {
    return (
      mappings.find((m) => m.target_field === targetField) || {
        target_field: targetField,
        source_field: "",
        is_required:
          fieldTargets.find((t) => t.field === targetField)?.required ?? false,
      }
    );
  };

  const handleMappingChange = (
    targetField: string,
    updatedMapping: Partial<FieldMapping>,
  ) => {
    const existingIndex = mappings.findIndex(
      (m) => m.target_field === targetField,
    );
    const newMappings = [...mappings];

    if (existingIndex >= 0) {
      newMappings[existingIndex] = updatedMapping;
    } else {
      newMappings.push(updatedMapping);
    }

    onChange(newMappings);
  };

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 border-b border-border rounded-t-lg">
        <div className="col-span-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Target Field
          </span>
        </div>
        <div className="col-span-4">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Source Field
          </span>
        </div>
        <div className="col-span-5">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Fallback / Default
          </span>
        </div>
      </div>

      {/* Mapping Rows */}
      <div className="px-4">
        {fieldTargets.map((target) => (
          <FieldMappingRow
            key={target.field}
            targetField={target.field}
            targetLabel={target.label}
            isRequired={target.required}
            value={getMappingForTarget(target.field)}
            sourceFields={sourceFields}
            onChange={(value) => handleMappingChange(target.field, value)}
          />
        ))}
      </div>
    </div>
  );
}
