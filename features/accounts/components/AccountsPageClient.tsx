"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AddAccountPanel } from "./AddAccountPanel";

interface AccountsPageClientProps {
  workspaceId: string;
  workspaceName: string;
}

export function AccountsPageClient({
  workspaceId,
  workspaceName,
}: AccountsPageClientProps) {
  const [showAddPanel, setShowAddPanel] = useState(false);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage accounts in {workspaceName}
          </p>
        </div>

        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            "text-sm font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
            showAddPanel
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary"
              : "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
          )}
        >
          {showAddPanel ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Account
            </>
          )}
        </button>
      </div>

      {/* Add Account Panel */}
      <AddAccountPanel workspaceId={workspaceId} isOpen={showAddPanel} />

      {/* Empty State - always visible, shifts down when panel opens */}
      <div className="rounded-lg border border-border bg-card px-4 py-12 text-center">
        <p className="text-sm text-muted-foreground">No accounts connected</p>
      </div>
    </div>
  );
}
