"use client";

import { useState, useMemo } from "react";
import { Search, Store, Plus, AlertCircle, RefreshCw, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { StoreCard } from "../shared";
import { useShopifyImport } from "@/features/customerlabs/hooks/useShopifyImport";

export function StoreSelectionStep() {
  const {
    appInstalledStores,
    customAppStores,
    selectedStore,
    selectStore,
    goToConnectStep,
    hasStores,
    error,
    successMessage,
    setSuccessMessage,
    refreshStores,
    isRefreshingStores,
  } = useShopifyImport();

  const [searchQuery, setSearchQuery] = useState("");

  // Filter stores by search query
  const filteredAppInstalled = useMemo(() => {
    if (!searchQuery) return appInstalledStores;
    const query = searchQuery.toLowerCase();
    return appInstalledStores.filter(
      (store) =>
        store.source_name.toLowerCase().includes(query) ||
        store.shopify_domain.toLowerCase().includes(query)
    );
  }, [appInstalledStores, searchQuery]);

  const filteredCustomApp = useMemo(() => {
    if (!searchQuery) return customAppStores;
    const query = searchQuery.toLowerCase();
    return customAppStores.filter(
      (store) =>
        store.source_name.toLowerCase().includes(query) ||
        store.shopify_domain.toLowerCase().includes(query)
    );
  }, [customAppStores, searchQuery]);

  const totalStores = appInstalledStores.length + customAppStores.length;
  const showSearch = totalStores > 3;

  // Error state - show before empty state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in-50 duration-200">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
        </div>
        <h3 className="text-lg font-medium mb-2">Failed to Load Stores</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">{error}</p>
        <Button onClick={refreshStores} disabled={isRefreshingStores}>
          <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshingStores ? "animate-spin" : ""}`} />
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state
  if (!hasStores()) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in-50 duration-200">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <Store className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No Stores Connected</h3>
        <p className="text-sm text-muted-foreground mb-6 max-w-sm">
          Connect your Shopify store to start importing historical data.
        </p>
        <Button onClick={goToConnectStep}>
          <Plus className="w-4 h-4 mr-2" />
          Connect a Store
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div>
        <h3 className="text-lg font-medium">Select a Store</h3>
        <p className="text-sm text-muted-foreground">
          Choose which Shopify store to import data from
        </p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-green-50 border border-green-200 animate-in fade-in-50 duration-200">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700 flex-1">{successMessage}</p>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Search */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {/* App Installed Stores */}
      {filteredAppInstalled.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            App Installed ({filteredAppInstalled.length})
          </h4>
          <div className="space-y-2">
            {filteredAppInstalled.map((store) => (
              <StoreCard
                key={store.source_id}
                store={store}
                isSelected={selectedStore?.source_id === store.source_id}
                onSelect={() => selectStore(store)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Custom App Stores */}
      {filteredCustomApp.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Custom App ({filteredCustomApp.length})
          </h4>
          <div className="space-y-2">
            {filteredCustomApp.map((store) => (
              <StoreCard
                key={store.source_id}
                store={store}
                isSelected={selectedStore?.source_id === store.source_id}
                onSelect={() => selectStore(store)}
              />
            ))}
          </div>
        </div>
      )}

      {/* No results */}
      {searchQuery && filteredAppInstalled.length === 0 && filteredCustomApp.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            No stores found matching "{searchQuery}"
          </p>
        </div>
      )}

      {/* Connect Another Store */}
      <div className="pt-2">
        <Button variant="outline" onClick={goToConnectStep} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Connect another store
        </Button>
      </div>
    </div>
  );
}
