"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import {
  listShopifyStores,
  createShopifySource,
  createSystemSource,
  initiateHistoricalImport,
  saveImportRecord,
} from "../services/shopify-actions";
import {
  generateDatasetId,
  normalizeShopifyDomain,
} from "../utils/shopify-helpers";
import type {
  ShopifyImportStep,
  ShopifyStore,
  ImportJob,
  CustomAppFormState,
  ShopifySourceConfig,
} from "../types/shopify";
import { DEFAULT_CUSTOM_APP_FORM } from "../types/shopify";

// =============================================================================
// Zustand Store
// =============================================================================

interface ShopifyImportState {
  // UI State
  isOpen: boolean;
  step: ShopifyImportStep;
  loading: boolean;
  saving: boolean;
  error: string | null;
  successMessage: string | null;

  // Account Data
  accountId: string | null;
  workspaceId: string | null;
  appId: string | null;
  userEmail: string | null;

  // Store Data
  stores: ShopifyStore[];
  selectedStore: ShopifyStore | null;
  currentJob: ImportJob | null;

  // Form State (for Custom App connection)
  customAppForm: CustomAppFormState;

  // Derived (computed on set)
  appInstalledStores: ShopifyStore[];
  customAppStores: ShopifyStore[];

  // Actions
  open: (params: {
    accountId: string;
    workspaceId: string;
    appId: string;
    userEmail: string;
  }) => void;
  close: () => void;
  setStep: (step: ShopifyImportStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToConnectStep: () => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  setSuccessMessage: (message: string | null) => void;
  setStores: (stores: ShopifyStore[]) => void;
  selectStore: (store: ShopifyStore | null) => void;
  setCurrentJob: (job: ImportJob | null) => void;
  updateCustomAppForm: (updates: Partial<CustomAppFormState>) => void;
  resetCustomAppForm: () => void;
  reset: () => void;
  resetStep: () => void;

  // Helpers
  canProceedToStep: (step: ShopifyImportStep) => boolean;
  hasStores: () => boolean;
  getDatasetId: () => string;
}

const initialState = {
  isOpen: false,
  step: 1 as ShopifyImportStep,
  loading: false,
  saving: false,
  error: null,
  successMessage: null,
  accountId: null,
  workspaceId: null,
  appId: null,
  userEmail: null,
  stores: [] as ShopifyStore[],
  selectedStore: null,
  currentJob: null,
  customAppForm: DEFAULT_CUSTOM_APP_FORM,
  appInstalledStores: [] as ShopifyStore[],
  customAppStores: [] as ShopifyStore[],
};

export const useShopifyImportStore = create<ShopifyImportState>((set, get) => ({
  ...initialState,

  open: ({ accountId, workspaceId, appId, userEmail }) => {
    set({
      isOpen: true,
      accountId,
      workspaceId,
      appId,
      userEmail,
      step: 1,
      loading: true,
      error: null,
      selectedStore: null,
      currentJob: null,
    });
  },

  close: () => {
    set({ isOpen: false });
    // Reset after animation completes
    setTimeout(() => get().reset(), 300);
  },

  setStep: (step: ShopifyImportStep) => {
    const { canProceedToStep } = get();
    if (canProceedToStep(step)) {
      set({ step, error: null });
    }
  },

  nextStep: () => {
    const { step } = get();
    const nextStep = (step + 1) as ShopifyImportStep;
    if (nextStep <= 4) {
      set({ step: nextStep, error: null });
    }
  },

  prevStep: () => {
    const { step } = get();
    if (step > 1) {
      set({ step: (step - 1) as ShopifyImportStep, error: null });
    }
  },

  goToConnectStep: () => {
    set({ step: 2, error: null });
  },

  setLoading: (loading) => set({ loading }),
  setSaving: (saving) => set({ saving }),
  setError: (error) => set({ error, successMessage: null }),
  setSuccessMessage: (successMessage) => set({ successMessage, error: null }),

  setStores: (stores) => {
    const appInstalledStores = stores.filter(
      (s) => s.connection_method === "app_installed"
    );
    const customAppStores = stores.filter(
      (s) => s.connection_method === "custom_app"
    );
    set({
      stores,
      appInstalledStores,
      customAppStores,
      loading: false,
      error: null,
    });
  },

  selectStore: (store) => set({ selectedStore: store, error: null }),

  setCurrentJob: (job) => set({ currentJob: job }),

  updateCustomAppForm: (updates) =>
    set((state) => ({
      customAppForm: { ...state.customAppForm, ...updates },
    })),

  resetCustomAppForm: () => set({ customAppForm: DEFAULT_CUSTOM_APP_FORM }),

  reset: () => set({ ...initialState }),

  resetStep: () => {
    set({
      step: 1,
      loading: true,
      error: null,
      successMessage: null,
      stores: [],
      selectedStore: null,
      currentJob: null,
      appInstalledStores: [],
      customAppStores: [],
      customAppForm: DEFAULT_CUSTOM_APP_FORM,
    });
  },

  canProceedToStep: (step: ShopifyImportStep) => {
    const { selectedStore } = get();
    switch (step) {
      case 1:
        return true;
      case 2:
        // Connect step - always accessible if user wants to add store
        return true;
      case 3:
        // Confirm step - need a selected store
        return !!selectedStore;
      case 4:
        // Status step - need a selected store
        return !!selectedStore;
      default:
        return false;
    }
  },

  hasStores: () => get().stores.length > 0,

  getDatasetId: () => {
    const { workspaceId, appId } = get();
    if (!workspaceId || !appId) return "";
    return generateDatasetId(workspaceId, appId);
  },
}));

// =============================================================================
// Selector Hooks (for optimized re-renders)
// =============================================================================

export const useShopifyImportOpen = () =>
  useShopifyImportStore((state) => state.isOpen);

export const useShopifyImportStep = () =>
  useShopifyImportStore((state) => state.step);

export const useShopifyImportStores = () =>
  useShopifyImportStore((state) => state.stores);

export const useShopifyImportSelectedStore = () =>
  useShopifyImportStore((state) => state.selectedStore);

// =============================================================================
// Main Hook (combines Zustand + React Query)
// =============================================================================

export function useShopifyImport() {
  const store = useShopifyImportStore();
  const queryClient = useQueryClient();

  // Extract stable action references to avoid infinite loops in useEffect
  const { setError, setLoading, setStores } = store;

  // Fetch stores when drawer opens
  const storesQuery = useQuery({
    queryKey: ["shopify-stores", store.appId],
    queryFn: async () => {
      if (!store.appId) throw new Error("App ID required");
      const response = await listShopifyStores(store.appId);
      // Return full response to check success flag
      return response;
    },
    enabled: store.isOpen && !!store.appId,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false,
  });

  // Sync query data to store
  useEffect(() => {
    if (storesQuery.data) {
      // Check if the API returned success: false
      if (storesQuery.data.success === false) {
        setError(storesQuery.data.error ?? null);
        setLoading(false);
        return;
      }

      const allStores = [
        ...(storesQuery.data.data.public_app_sources || []),
        ...(storesQuery.data.data.custom_app_sources || []),
      ];
      setStores(allStores);
    }
  }, [storesQuery.data, setError, setLoading, setStores]);

  // Handle query error (network errors)
  useEffect(() => {
    if (storesQuery.error) {
      setError(storesQuery.error.message);
      setLoading(false);
    }
  }, [storesQuery.error, setError, setLoading]);

  // Create source mutation (for Custom App connection)
  const createSourceMutation = useMutation({
    mutationFn: async (form: CustomAppFormState) => {
      if (!store.userEmail || !store.appId) {
        throw new Error("User email and app ID required");
      }

      const sourceConfig: ShopifySourceConfig = {
        shopify_domain: normalizeShopifyDomain(form.shopifyDomain),
        shopify_client_id: form.clientId,
        shopify_client_secret: form.clientSecret,
      };

      const response = await createShopifySource(
        store.userEmail,
        store.appId,
        `Shopify - ${form.shopifyDomain}`,
        sourceConfig
      );

      // Check API response for errors
      if (!response.success) {
        throw new Error(response.error || response.message || "Failed to connect store");
      }

      return response;
    },
    onSuccess: () => {
      // Invalidate stores query to refresh list
      queryClient.invalidateQueries({ queryKey: ["shopify-stores", store.appId] });
      store.resetCustomAppForm();
      // Set success message and go back to store selection
      store.setSuccessMessage("Store connected successfully!");
      store.setStep(1);
    },
    onError: (error: Error) => {
      store.setError(error.message);
    },
  });

  // Initiate import mutation
  const initiateImportMutation = useMutation({
    mutationFn: async () => {
      if (!store.selectedStore || !store.appId || !store.accountId) {
        throw new Error("Store, app ID, and account ID required");
      }

      const datasetId = store.getDatasetId();

      // Step 1: Create system source (if needed)
      try {
        await createSystemSource(store.appId, store.selectedStore.source_id);
      } catch {
        // Ignore errors - system source creation is optional
      }

      // Step 2: Initiate historical import
      const response = await initiateHistoricalImport(
        store.appId,
        store.selectedStore.source_id,
        datasetId
      );

      // Check API response for errors
      if (!response.success) {
        throw new Error(response.error);
      }

      // Step 3: Save import record to analytics backend
      await saveImportRecord(store.accountId, {
        source_type: "shopify",
        source_id: store.selectedStore.source_id,
        source_name: store.selectedStore.source_name,
        source_domain: store.selectedStore.shopify_domain,
        connection_method: store.selectedStore.connection_method,
        job_id: response.data.job_id,
        dataset_id: datasetId,
        status: response.data.status,
      });

      return response.data;
    },
    onSuccess: (job) => {
      store.setCurrentJob(job);
      store.setStep(4); // Go to status step
    },
    onError: (error: Error) => {
      store.setError(error.message);
    },
  });

  // Refresh stores - full state reset for fresh reload
  const refreshStores = useCallback(() => {
    // Reset all step state to show fresh loading UI
    store.resetStep();
    // Remove cached data and refetch
    queryClient.removeQueries({ queryKey: ["shopify-stores", store.appId] });
    queryClient.invalidateQueries({ queryKey: ["shopify-stores", store.appId] });
  }, [queryClient, store]);

  // Connect store (Custom App)
  const connectStore = useCallback(
    (form: CustomAppFormState) => {
      store.setSaving(true);
      store.setError(null);
      createSourceMutation.mutate(form, {
        onSettled: () => store.setSaving(false),
      });
    },
    [createSourceMutation, store]
  );

  // Start import
  const startImport = useCallback(() => {
    store.setSaving(true);
    store.setError(null);
    initiateImportMutation.mutate(undefined, {
      onSettled: () => store.setSaving(false),
    });
  }, [initiateImportMutation, store]);

  return {
    // State
    ...store,

    // Query state
    isLoadingStores: storesQuery.isLoading,
    isRefreshingStores: storesQuery.isFetching && !storesQuery.isLoading,

    // Mutations
    isConnecting: createSourceMutation.isPending,
    isInitiating: initiateImportMutation.isPending,

    // Actions
    refreshStores,
    connectStore,
    startImport,
  };
}
