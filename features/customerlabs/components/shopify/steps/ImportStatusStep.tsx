"use client";

import { CheckCircle, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportStatusCard } from "../shared";
import { useShopifyImport } from "@/features/customerlabs/hooks/useShopifyImport";

export function ImportStatusStep() {
  const { currentJob, selectedStore, close } = useShopifyImport();

  if (!currentJob) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No import job found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Success Icon */}
      <div className="flex flex-col items-center text-center pt-4">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          Import Initiated Successfully
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
          Your historical data import has been queued and will process in the
          background.
        </p>
      </div>

      {/* Job Status Card */}
      <ImportStatusCard
        job={currentJob}
        storeName={selectedStore?.source_name}
      />

      {/* Actions */}
      <div className="space-y-3">
        <Button variant="outline" className="w-full" onClick={() => {
          // TODO: Navigate to import history
          close();
        }}>
          <History className="w-4 h-4 mr-2" />
          View Import History
        </Button>
      </div>
    </div>
  );
}
