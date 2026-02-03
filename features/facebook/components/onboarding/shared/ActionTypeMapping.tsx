"use client";

import { useState, useMemo } from "react";
import { CheckCircle, XCircle, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import type { ActionType, EventVerification } from "../../../types/config";

interface ActionTypeMappingProps {
  eventName: string;
  value: string;
  onChange: (value: string) => void;
  options: ActionType[];
  verification?: EventVerification;
  isLoading?: boolean;
}

export function ActionTypeMapping({
  eventName,
  value,
  onChange,
  options,
  verification,
  isLoading = false,
}: ActionTypeMappingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Prioritize and filter options
  const filteredOptions = useMemo(() => {
    const eventLower = eventName.toLowerCase();
    const searchLower = searchQuery.toLowerCase();

    return options
      .filter((opt) => {
        if (searchQuery) {
          return opt.actionType.toLowerCase().includes(searchLower);
        }
        return true;
      })
      .map((opt) => {
        let priority = 1000;
        const actionTypeLower = opt.actionType.toLowerCase();

        // Exact match
        if (actionTypeLower === eventLower) {
          priority = 0;
        }
        // Contains event name
        else if (actionTypeLower.includes(eventLower)) {
          priority = 100;
        }
        // Boost omni_ events
        if (actionTypeLower.startsWith("omni_")) {
          priority -= 50;
        }

        return { ...opt, priority };
      })
      .sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return b.conversions - a.conversions;
      });
  }, [options, eventName, searchQuery]);

  const selectedOption = options.find((opt) => opt.actionType === value);

  const handleSelect = (actionType: string) => {
    onChange(actionType);
    setIsOpen(false);
    setSearchQuery("");
  };

  if (!eventName) {
    return null;
  }

  return (
    <div className="mt-3">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Facebook Action Type Mapping{" "}
        <span className="text-gray-500 text-xs font-normal">(Required)</span>
      </label>
      <p className="text-xs text-gray-500 mb-2">
        Select the Facebook action_type that corresponds to &quot;{eventName}
        &quot;. Related events are prioritized at the top.
      </p>

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading conversion events...
        </div>
      ) : (
        <>
          <Input
            type="text"
            placeholder="Search action types..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full mb-2"
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={cn(
                "w-full text-left border border-gray-300 bg-white px-3 py-2 text-sm rounded-lg",
                "focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                "flex items-center justify-between gap-1.5",
                isOpen && "ring-2 ring-blue-500 border-blue-500"
              )}
            >
              <span
                className={cn(
                  "truncate",
                  selectedOption ? "text-gray-900" : "text-gray-500"
                )}
              >
                {selectedOption
                  ? `${selectedOption.actionType} (${selectedOption.conversions.toLocaleString()}) ${selectedOption.isCustom ? "[Custom]" : "[Standard]"}`
                  : "Select Facebook action_type..."}
              </span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 text-gray-400 flex-shrink-0 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            {isOpen && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-gray-500 text-center">
                    No action types found
                  </div>
                ) : (
                  filteredOptions.map((opt) => (
                    <div
                      key={opt.actionType}
                      onClick={() => handleSelect(opt.actionType)}
                      className={cn(
                        "px-3 py-2 text-sm cursor-pointer",
                        opt.actionType === value
                          ? "bg-blue-50 text-blue-700"
                          : "text-gray-900 hover:bg-gray-50"
                      )}
                    >
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="truncate">
                          {opt.actionType}{" "}
                          {opt.conversions > 0 &&
                            `(${opt.conversions.toLocaleString()})`}{" "}
                          {opt.isCustom ? "[Custom]" : "[Standard]"}
                        </span>
                        {opt.actionType === value && (
                          <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {value && (
            <div className="mt-2">
              <div className="text-xs text-gray-600">
                Selected: <span className="font-mono">{value}</span>
              </div>
            </div>
          )}
        </>
      )}

      {/* Verification status */}
      {value && verification && (
        <div className="mt-2">
          {verification.hasData ? (
            <div className="flex items-center gap-2 text-xs text-green-700 bg-green-50 px-2 py-1 rounded">
              <CheckCircle className="w-3 h-3" />
              <span>
                ✓ Mapping verified: {verification.totalConversions?.toLocaleString()}{" "}
                conversions found
              </span>
            </div>
          ) : (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 px-2 py-1 rounded border border-red-300">
              <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <div className="font-semibold">
                  No data found for this mapping
                </div>
                <div className="mt-0.5">
                  Selected: <span className="font-mono">{value}</span>
                </div>
                <div className="mt-1">
                  Please select a different action_type that has conversion
                  data.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
