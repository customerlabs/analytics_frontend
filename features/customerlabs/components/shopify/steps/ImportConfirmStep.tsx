"use client";

import { Store, Package, Users, ShoppingCart, Info, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConnectionBadge } from "../shared";
import { useShopifyImport } from "@/features/customerlabs/hooks/useShopifyImport";

const dataToImport = [
  { icon: ShoppingCart, label: "Orders and transactions" },
  { icon: Users, label: "Customer profiles" },
  { icon: Package, label: "Product catalog" },
];

export function ImportConfirmStep() {
  const { selectedStore, error } = useShopifyImport();

  if (!selectedStore) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No store selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Confirm Import Details</h3>
        <p className="text-sm text-muted-foreground">
          Review your import settings before starting
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Selected Store Card */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Selected Store
        </h4>
        <div className="rounded-lg border border-border p-4 bg-muted/30">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Store className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-foreground">
                {selectedStore.source_name}
              </h4>
              <p className="text-sm text-muted-foreground">
                {selectedStore.shopify_domain}
              </p>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Connection:</span>
                <ConnectionBadge method={selectedStore.connection_method} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Data to Import */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Data to be Imported
        </h4>
        <div className="rounded-lg border border-border divide-y divide-border">
          {dataToImport.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={index}
                className="flex items-center gap-3 p-3"
              >
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-green-600" />
                </div>
                <span className="text-sm">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Info Note */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-blue-50 border border-blue-200">
        <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p>
            The import will run in the background. You can track progress in the
            Import History section.
          </p>
        </div>
      </div>
    </div>
  );
}
