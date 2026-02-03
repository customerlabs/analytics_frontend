"use client";

import { useState } from "react";
import { CheckCircle, XCircle, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ConversionEvent, EventVerification } from "../../../types/config";

interface EventDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: ConversionEvent[];
  placeholder?: string;
  label: string;
  description?: string;
  required?: boolean;
  verification?: EventVerification;
  isLoading?: boolean;
}

export function EventDropdown({
  value,
  onChange,
  options,
  placeholder = "Select event...",
  label,
  description,
  required = false,
  verification,
  isLoading = false,
}: EventDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  // Group events by custom vs standard
  const standardEvents = options.filter((e) => !e.isCustom);
  const customEvents = options.filter((e) => e.isCustom);

  const handleSelect = (eventValue: string) => {
    onChange(eventValue);
    setIsOpen(false);
  };

  const getDisplayText = (event: ConversionEvent) => {
    return `${event.label} (${event.count.toLocaleString()})${verification?.hasData ? " ✓" : ""}`;
  };

  return (
    <div>
      <label className="block text-sm font-semibold text-gray-900 mb-2">
        {label} {required && <span className="text-red-600">*</span>}
      </label>
      {description && (
        <p className="text-xs text-gray-500 mb-3">{description}</p>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-sm text-gray-600 py-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading events...
        </div>
      ) : (
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
              {selectedOption ? getDisplayText(selectedOption) : placeholder}
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
              {options.length === 0 ? (
                <div className="px-3 py-2 text-sm text-gray-500 text-center">
                  No events available
                </div>
              ) : (
                <>
                  {standardEvents.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 sticky top-0">
                        Standard Events
                      </div>
                      {standardEvents.map((event) => (
                        <div
                          key={event.value}
                          onClick={() => handleSelect(event.value)}
                          className={cn(
                            "px-3 py-2 text-sm cursor-pointer",
                            event.value === value
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate">
                              {event.label} ({event.count.toLocaleString()})
                            </span>
                            {event.value === value && (
                              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}

                  {customEvents.length > 0 && (
                    <>
                      <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50 border-b border-gray-100 sticky top-0">
                        Custom Events
                      </div>
                      {customEvents.map((event) => (
                        <div
                          key={event.value}
                          onClick={() => handleSelect(event.value)}
                          className={cn(
                            "px-3 py-2 text-sm cursor-pointer",
                            event.value === value
                              ? "bg-blue-50 text-blue-700"
                              : "text-gray-900 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="truncate">
                              {event.label} ({event.count.toLocaleString()})
                            </span>
                            {event.value === value && (
                              <CheckCircle className="w-4 h-4 text-blue-600 flex-shrink-0" />
                            )}
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* Verification status */}
      {value && verification && (
        <div className="mt-2">
          {verification.hasData ? (
            <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
              <CheckCircle className="w-4 h-4" />
              <span>
                ✓ Verified: {verification.totalConversions?.toLocaleString()}{" "}
                conversions {verification.period && `(${verification.period})`}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded">
              <XCircle className="w-4 h-4" />
              <span>No conversion data found for this event</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
