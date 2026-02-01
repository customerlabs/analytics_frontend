"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SearchIcon, CheckIcon } from "lucide-react";

interface EventSelectorProps {
  events: string[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  mode?: "single" | "multi";
  placeholder?: string;
  emptyMessage?: string;
  suggestedEvents?: string[];
  suggestedLabel?: string;
  className?: string;
}

export function EventSelector({
  events,
  value,
  onChange,
  mode = "multi",
  placeholder = "Search events...",
  emptyMessage = "No events found. Please ensure your account is receiving data.",
  suggestedEvents = [],
  suggestedLabel = "Suggested",
  className,
}: EventSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  // Convert value to array for internal handling
  const selectedValues = useMemo(() => {
    if (mode === "single") {
      return value ? [value as string] : [];
    }
    return (value as string[]) || [];
  }, [value, mode]);

  // Filter events based on search query
  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const query = searchQuery.toLowerCase();
    return events.filter((event) => event.toLowerCase().includes(query));
  }, [events, searchQuery]);

  // Sort events: suggested first, then alphabetically
  const sortedEvents = useMemo(() => {
    const suggested = filteredEvents.filter((e) =>
      suggestedEvents.some(
        (s) => e.toLowerCase().includes(s) || s.includes(e.toLowerCase())
      )
    );
    const others = filteredEvents.filter(
      (e) =>
        !suggestedEvents.some(
          (s) => e.toLowerCase().includes(s) || s.includes(e.toLowerCase())
        )
    );
    return [...suggested, ...others];
  }, [filteredEvents, suggestedEvents]);

  const isSuggested = (eventName: string) => {
    return suggestedEvents.some(
      (s) =>
        eventName.toLowerCase().includes(s) || s.includes(eventName.toLowerCase())
    );
  };

  const isSelected = (eventName: string) => {
    return selectedValues.includes(eventName);
  };

  const handleSelect = (eventName: string) => {
    if (mode === "single") {
      // Single select: toggle or select new
      onChange(selectedValues.includes(eventName) ? "" : eventName);
    } else {
      // Multi select: add or remove from array
      if (selectedValues.includes(eventName)) {
        onChange(selectedValues.filter((e) => e !== eventName));
      } else {
        onChange([...selectedValues, eventName]);
      }
    }
  };

  // Scroll to top when search changes
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchQuery]);

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      {/* Search Input */}
      <div className="sticky top-0 z-10 bg-card border-b border-border p-3">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      {/* Events List */}
      <div
        ref={listRef}
        className="max-h-64 overflow-y-auto scroll-smooth"
      >
        {sortedEvents.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">
            {searchQuery ? `No events matching "${searchQuery}"` : emptyMessage}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sortedEvents.map((eventName) => {
              const suggested = isSuggested(eventName);
              const selected = isSelected(eventName);

              return (
                <label
                  key={eventName}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                    selected && "bg-primary/5"
                  )}
                >
                  {mode === "multi" ? (
                    <Checkbox
                      checked={selected}
                      onCheckedChange={() => handleSelect(eventName)}
                    />
                  ) : (
                    <div
                      className={cn(
                        "h-4 w-4 rounded-full border flex items-center justify-center transition-colors",
                        selected
                          ? "border-primary bg-primary"
                          : "border-input"
                      )}
                    >
                      {selected && (
                        <CheckIcon className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground truncate">
                        {eventName}
                      </span>
                      {suggested && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                          {suggestedLabel}
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* Selection Count (Multi-select only) */}
      {mode === "multi" && selectedValues.length > 0 && (
        <div className="border-t border-border px-4 py-2 bg-muted/30">
          <p className="text-sm text-muted-foreground">
            {selectedValues.length} event
            {selectedValues.length !== 1 ? "s" : ""} selected
          </p>
        </div>
      )}
    </div>
  );
}
