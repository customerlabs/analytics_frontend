"use client";

import { Clock, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ImportJob, ImportJobStatus } from "@/features/customerlabs/types/shopify";

interface ImportStatusCardProps {
  job: ImportJob;
  storeName?: string;
  className?: string;
}

const statusConfig: Record<
  ImportJobStatus,
  {
    icon: typeof CheckCircle;
    iconClass: string;
    bgClass: string;
    label: string;
  }
> = {
  initiated: {
    icon: Clock,
    iconClass: "text-blue-600",
    bgClass: "bg-blue-50",
    label: "Initiated",
  },
  processing: {
    icon: Loader2,
    iconClass: "text-yellow-600 animate-spin",
    bgClass: "bg-yellow-50",
    label: "Processing",
  },
  completed: {
    icon: CheckCircle,
    iconClass: "text-green-600",
    bgClass: "bg-green-50",
    label: "Completed",
  },
  failed: {
    icon: AlertCircle,
    iconClass: "text-red-600",
    bgClass: "bg-red-50",
    label: "Failed",
  },
};

export function ImportStatusCard({
  job,
  storeName,
  className,
}: ImportStatusCardProps) {
  const config = statusConfig[job.status];
  const Icon = config.icon;

  const formatDate = (dateString?: string) => {
    if (!dateString) return new Date().toLocaleString();
    return new Date(dateString).toLocaleString();
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border p-4",
        config.bgClass,
        className
      )}
    >
      <div className="space-y-3">
        {/* Status Header */}
        <div className="flex items-center gap-2">
          <Icon className={cn("w-5 h-5", config.iconClass)} />
          <span className="font-medium">{config.label}</span>
        </div>

        {/* Job Details */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Job ID</span>
            <span className="font-mono text-xs">{job.job_id}</span>
          </div>

          {storeName && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Store</span>
              <span>{storeName}</span>
            </div>
          )}

          <div className="flex justify-between">
            <span className="text-muted-foreground">Started</span>
            <span>{formatDate()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
