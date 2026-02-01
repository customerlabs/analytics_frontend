"use client";

import { cn } from "@/lib/utils";

interface StepWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function StepWrapper({
  title,
  description,
  children,
  className,
}: StepWrapperProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground">{title}</h2>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}
