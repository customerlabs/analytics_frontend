"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { format, differenceInDays } from "date-fns";
import { toast } from "sonner";
import { CalendarIcon, Clock, CalendarRange, Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { BackfillPlatformConfig } from "../../types/backfill";

interface BackfillSheetProps {
  platform: BackfillPlatformConfig | null;
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
}

const PRESETS = [
  { days: 30, label: "Last 30 days" },
  { days: 90, label: "Last 90 days" },
  { days: 365, label: "Last year" },
] as const;

export function BackfillSheet({
  platform,
  isOpen,
  onClose,
  accountId: _accountId,
}: BackfillSheetProps) {
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const daysBetween = useMemo(() => {
    if (!startDate || !endDate) return 0;
    return differenceInDays(endDate, startDate) + 1;
  }, [startDate, endDate]);

  const setPreset = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - days);
    setStartDate(start);
    setEndDate(end);
    setSelectedPreset(days);
    setError(null);
  };

  const handleStartDateSelect = (date: Date | undefined) => {
    setStartDate(date);
    setSelectedPreset(null);
    setError(null);
  };

  const handleEndDateSelect = (date: Date | undefined) => {
    setEndDate(date);
    setSelectedPreset(null);
    setError(null);
  };

  const validateDates = (): boolean => {
    if (!startDate || !endDate) {
      setError("Please select both start and end dates");
      return false;
    }
    if (startDate > endDate) {
      setError("Start date must be before end date");
      return false;
    }
    if (startDate > new Date()) {
      setError("Start date cannot be in the future");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!platform || !validateDates()) return;

    setIsSubmitting(true);

    // Mock API call - replace with actual implementation later
    await new Promise((resolve) => setTimeout(resolve, 1500));

    toast.success(`Backfill started for ${platform.title}`, {
      description: `Importing ${daysBetween} days of data from ${format(startDate!, "MMM d, yyyy")} to ${format(endDate!, "MMM d, yyyy")}`,
    });

    setIsSubmitting(false);
    handleClose();
  };

  const handleClose = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedPreset(null);
    setError(null);
    onClose();
  };

  if (!platform) return null;

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <SheetContent side="right" className="w-full max-w-md flex flex-col">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <Image
                src={platform.icon}
                alt={platform.title}
                width={24}
                height={24}
                className="object-contain"
              />
            </div>
            <div>
              <SheetTitle>{platform.title} Backfill</SheetTitle>
              <SheetDescription>
                Import historical data for analytics
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Quick Select Section */}
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Quick Select</Label>
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((preset) => (
                <Button
                  key={preset.days}
                  type="button"
                  variant={selectedPreset === preset.days ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPreset(preset.days)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </section>

          <Separator />

          {/* Custom Range Section */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <CalendarRange className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Custom Range</Label>
            </div>

            <div className="grid gap-4">
              {/* Start Date */}
              <div className="space-y-2">
                <Label htmlFor="start-date" className="text-sm text-muted-foreground">
                  Start Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="start-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP") : "Pick a start date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={handleStartDateSelect}
                      disabled={(date) => date > new Date()}
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <Label htmlFor="end-date" className="text-sm text-muted-foreground">
                  End Date
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="end-date"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP") : "Pick an end date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={handleEndDateSelect}
                      disabled={(date) =>
                        date > new Date() || (startDate ? date < startDate : false)
                      }
                      autoFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </section>

          {/* Error Display */}
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {/* Import Summary */}
          {startDate && endDate && !error && (
            <section className="rounded-lg bg-muted/50 border border-border p-4 space-y-2">
              <p className="text-sm font-medium">Import Summary</p>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {format(startDate, "MMM d, yyyy")} — {format(endDate, "MMM d, yyyy")}
                </p>
                <p className="text-xs text-muted-foreground">
                  Approximately {daysBetween} day{daysBetween !== 1 ? "s" : ""} of historical data
                </p>
              </div>
            </section>
          )}
        </div>

        <SheetFooter className="border-t pt-4 gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!startDate || !endDate || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Importing...
              </>
            ) : (
              "Start Backfill"
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
