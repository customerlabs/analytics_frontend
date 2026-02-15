"use client";

import { useEffect, useCallback } from "react";
import { create } from "zustand";
import { useQueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useOnboardingSteps } from "@/features/accounts/hooks";
import {
  updateFacebookSettings,
  fetchAccountPixels,
  fetchPixelEvents,
  fetchActionTypes,
  type FacebookSettingsUpdate,
} from "../server";
import type {
  ConfigStep,
  ConfigFormState,
  FacebookPixel,
  ConversionEvent,
  ActionType,
  EventVerification,
  BusinessType,
} from "../types/config";
import { DEFAULT_CONFIG_FORM } from "../types/config";

interface FacebookConfigState {
  // UI State
  isOpen: boolean;
  step: ConfigStep;
  loading: boolean;
  saving: boolean;
  validationError: string | null;

  // Data
  accountId: string | null;
  pixels: FacebookPixel[];
  selectedPixelId: string | null;
  pixelEvents: ConversionEvent[];
  conversionEvents: ActionType[];
  form: ConfigFormState;
  loadingEvents: boolean;

  // Verification
  eventVerification: Map<string, EventVerification>;
  mappingVerification: Map<string, EventVerification>;

  // Actions
  open: (accountId: string) => void;
  close: () => void;
  setStep: (step: ConfigStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setPixels: (pixels: FacebookPixel[]) => void;
  selectPixel: (pixelId: string) => void;
  setPixelEvents: (events: ConversionEvent[]) => void;
  setConversionEvents: (events: ActionType[]) => void;
  setLoadingEvents: (loading: boolean) => void;
  setBusinessType: (type: BusinessType) => void;
  updateForm: (updates: Partial<ConfigFormState>) => void;
  updateLeadConfig: (updates: Partial<ConfigFormState["lead"]>) => void;
  updateEcommerceConfig: (
    updates: Partial<ConfigFormState["ecommerce"]>,
  ) => void;
  updateProductsConfig: (updates: Partial<ConfigFormState["products"]>) => void;
  setEventVerification: (
    event: string,
    verification: EventVerification,
  ) => void;
  setMappingVerification: (
    mapping: string,
    verification: EventVerification,
  ) => void;
  setValidationError: (error: string | null) => void;
  reset: () => void;

  // Helpers
  canProceedToStep: (step: ConfigStep) => boolean;
  getSelectedPixel: () => FacebookPixel | undefined;
}

const initialState = {
  isOpen: false,
  step: 1 as ConfigStep,
  loading: false,
  saving: false,
  validationError: null,
  accountId: null,
  pixels: [],
  selectedPixelId: null,
  pixelEvents: [],
  conversionEvents: [],
  form: DEFAULT_CONFIG_FORM,
  loadingEvents: false,
  eventVerification: new Map<string, EventVerification>(),
  mappingVerification: new Map<string, EventVerification>(),
};

export const useFacebookConfigStore = create<FacebookConfigState>(
  (set, get) => ({
    ...initialState,

    open: (accountId: string) => {
      set({
        isOpen: true,
        accountId,
        step: 1,
        loading: true,
        validationError: null,
        pixels: [],
        pixelEvents: [],
        conversionEvents: [],
      });
      // Loading state will be set to false when data is fetched via React Query
    },

    close: () => {
      set({ isOpen: false });
      // Reset after animation
      setTimeout(() => {
        get().reset();
      }, 300);
    },

    setStep: (step: ConfigStep) => {
      const currentStep = get().step;
      // Only allow going to completed steps or current step
      if (step <= currentStep) {
        set({ step, validationError: null });
      }
    },

    nextStep: () => {
      const { step, canProceedToStep } = get();
      const nextStep = (step + 1) as ConfigStep;
      if (nextStep <= 3 && canProceedToStep(nextStep)) {
        set({ step: nextStep, validationError: null });
      }
    },

    prevStep: () => {
      const { step } = get();
      if (step > 1) {
        set({ step: (step - 1) as ConfigStep, validationError: null });
      }
    },

    setLoading: (loading: boolean) => set({ loading }),

    setSaving: (saving: boolean) => set({ saving }),

    setPixels: (pixels: FacebookPixel[]) => set({ pixels }),

    selectPixel: (pixelId: string) => {
      const currentPixelId = get().selectedPixelId;

      // If selecting the same pixel, don't reset state (data is already cached)
      if (currentPixelId === pixelId) {
        return;
      }

      set((state) => ({
        selectedPixelId: pixelId,
        form: {
          ...state.form,
          pixelId,
          lead: { ...DEFAULT_CONFIG_FORM.lead },
          ecommerce: { ...DEFAULT_CONFIG_FORM.ecommerce },
        },
        loadingEvents: true,
        pixelEvents: [],
        eventVerification: new Map(),
      }));
      // Events will be loaded from API - loadingEvents will be set false when data arrives
    },

    setPixelEvents: (events: ConversionEvent[]) => set({ pixelEvents: events }),

    setConversionEvents: (events: ActionType[]) =>
      set({ conversionEvents: events }),

    setLoadingEvents: (loading: boolean) => set({ loadingEvents: loading }),

    setBusinessType: (type: BusinessType) => {
      set((state) => ({
        form: { ...state.form, businessType: type },
        validationError: null,
      }));
    },

    updateForm: (updates: Partial<ConfigFormState>) => {
      set((state) => ({
        form: { ...state.form, ...updates },
      }));
    },

    updateLeadConfig: (updates: Partial<ConfigFormState["lead"]>) => {
      set((state) => ({
        form: {
          ...state.form,
          lead: { ...state.form.lead, ...updates },
        },
      }));
    },

    updateEcommerceConfig: (updates: Partial<ConfigFormState["ecommerce"]>) => {
      set((state) => ({
        form: {
          ...state.form,
          ecommerce: { ...state.form.ecommerce, ...updates },
        },
      }));
    },

    updateProductsConfig: (updates: Partial<ConfigFormState["products"]>) => {
      set((state) => ({
        form: {
          ...state.form,
          products: { ...state.form.products, ...updates },
        },
      }));
    },

    setEventVerification: (event: string, verification: EventVerification) => {
      set((state) => {
        const newMap = new Map(state.eventVerification);
        newMap.set(event, verification);
        return { eventVerification: newMap };
      });
    },

    setMappingVerification: (
      mapping: string,
      verification: EventVerification,
    ) => {
      set((state) => {
        const newMap = new Map(state.mappingVerification);
        newMap.set(mapping, verification);
        return { mappingVerification: newMap };
      });
    },

    setValidationError: (error: string | null) =>
      set({ validationError: error }),

    reset: () => {
      set({
        ...initialState,
        eventVerification: new Map(),
        mappingVerification: new Map(),
      });
    },

    canProceedToStep: (step: ConfigStep) => {
      const { selectedPixelId, form } = get();

      switch (step) {
        case 1:
          return true;
        case 2:
          return !!selectedPixelId;
        case 3:
          return !!selectedPixelId && !!form.businessType;
        default:
          return false;
      }
    },

    getSelectedPixel: () => {
      const { pixels, selectedPixelId } = get();
      return pixels.find((p) => p.id === selectedPixelId);
    },
  }),
);

/**
 * Main hook for Facebook configuration wizard
 * Combines Zustand store with React Query for data fetching
 */
export function useFacebookConfig() {
  const store = useFacebookConfigStore();
  const queryClient = useQueryClient();

  // Fetch onboarding steps from shared hook
  const {
    data: onboardingData,
    isLoading: loadingSteps,
    refetch: refetchSteps,
  } = useOnboardingSteps({
    accountId: store.accountId,
    platform: "Facebook",
    enabled: store.isOpen && !!store.accountId,
  });

  // Fetch pixels when drawer opens
  const pixelsQuery = useQuery({
    queryKey: ["facebook-pixels", store.accountId],
    queryFn: () => fetchAccountPixels(store.accountId!),
    enabled: store.isOpen && !!store.accountId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when pixels load
  useEffect(() => {
    if (pixelsQuery.data) {
      store.setPixels(pixelsQuery.data);
      store.setLoading(false);
    }
    if (pixelsQuery.isLoading) {
      store.setLoading(true);
    }
    if (pixelsQuery.isError) {
      store.setLoading(false);
      store.setValidationError("Failed to load pixels. Please try again.");
    }
  }, [pixelsQuery.data, pixelsQuery.isLoading, pixelsQuery.isError]);

  // Fetch events when pixel is selected
  const eventsQuery = useQuery({
    queryKey: ["pixel-events", store.accountId, store.selectedPixelId],
    queryFn: () => fetchPixelEvents(store.accountId!, store.selectedPixelId!),
    enabled: !!store.accountId && !!store.selectedPixelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when events load
  useEffect(() => {
    if (eventsQuery.data) {
      const events = eventsQuery.data.map((e) => ({
        value: e.value,
        label: e.label,
        count: e.count,
        isCustom: e.is_custom,
      }));
      store.setPixelEvents(events);
      store.setLoadingEvents(false);
    }
    if (eventsQuery.isLoading && store.selectedPixelId) {
      store.setLoadingEvents(true);
    }
    if (eventsQuery.isError) {
      store.setLoadingEvents(false);
    }
  }, [
    eventsQuery.data,
    eventsQuery.isLoading,
    eventsQuery.isError,
    store.selectedPixelId,
  ]);

  // Fetch action types when pixel is selected
  const actionTypesQuery = useQuery({
    queryKey: ["action-types", store.accountId],
    queryFn: () => fetchActionTypes(store.accountId!),
    enabled: !!store.accountId && !!store.selectedPixelId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update store when action types load
  useEffect(() => {
    if (actionTypesQuery.data) {
      const actionTypes = actionTypesQuery.data.map((a) => ({
        actionType: a.action_type,
        conversions: a.conversions,
        isCustom: a.is_custom,
      }));
      store.setConversionEvents(actionTypes);
    }
  }, [actionTypesQuery.data]);

  // Force refresh - clears data and refetches fresh
  const handleForceRefresh = useCallback(async () => {
    if (!store.accountId) return;

    // Show loading spinner in body
    store.setLoading(true);

    // Clear current data while loading
    store.setPixels([]);
    if (store.selectedPixelId) {
      store.setPixelEvents([]);
    }

    try {
      // Refetch and wait for completion
      await queryClient.refetchQueries({
        queryKey: ["facebook-pixels", store.accountId],
      });

      if (store.selectedPixelId) {
        await queryClient.refetchQueries({
          queryKey: ["pixel-events", store.accountId, store.selectedPixelId],
        });
      }
    } finally {
      store.setLoading(false);
    }
  }, [store, queryClient]);

  // Mutation for saving settings
  const saveMutation = useMutation({
    mutationFn: async (data: FacebookSettingsUpdate) => {
      if (!store.accountId) throw new Error("No account ID");
      return updateFacebookSettings(store.accountId, data);
    },
    onSuccess: () => {
      // Invalidate onboarding steps to refresh progress
      queryClient.invalidateQueries({
        queryKey: ["onboarding-steps", store.accountId, "Facebook"],
      });
    },
    onError: (error) => {
      store.setValidationError(
        error instanceof Error ? error.message : "Failed to save settings",
      );
    },
  });

  // Save current step configuration
  const saveStep = async (stepKey: string) => {
    const { form, selectedPixelId, getSelectedPixel } = store;
    const selectedPixel = getSelectedPixel();

    let updateData: FacebookSettingsUpdate = { step_key: stepKey };

    switch (stepKey) {
      case "fb_pixel_selection":
        updateData = {
          ...updateData,
          pixel_id: selectedPixelId || undefined,
          pixel_name: selectedPixel?.name,
        };
        break;
      case "fb_business_type":
        updateData = {
          ...updateData,
          business_type: form.businessType.toLowerCase(),
        };
        break;
      case "fb_lead_events":
        updateData = {
          ...updateData,
          lead_config: {
            primaryEvent: form.lead.primaryEvent,
            primaryEventMapping: form.lead.primaryEventMapping,
          },
        };
        break;
      case "fb_ecommerce_events":
        updateData = {
          ...updateData,
          ecommerce_config: {
            purchaseEvent: form.ecommerce.purchaseEvent,
            purchaseEventMapping: form.ecommerce.purchaseEventMapping,
          },
        };
        break;
      case "fb_product_insights":
        updateData = {
          ...updateData,
          product_insights_enabled: form.products.enabled,
        };
        break;
    }

    store.setSaving(true);
    try {
      await saveMutation.mutateAsync(updateData);
      return true;
    } catch {
      return false;
    } finally {
      store.setSaving(false);
    }
  };

  // Save all configuration at once (Step 3)
  const saveConfiguration = async () => {
    const { form, selectedPixelId, getSelectedPixel } = store;
    const selectedPixel = getSelectedPixel();

    const stepKey =
      form.businessType === "LEAD_GEN"
        ? "fb_lead_events"
        : "fb_ecommerce_events";

    const updateData: FacebookSettingsUpdate = {
      step_key: stepKey,
      pixel_id: selectedPixelId || undefined,
      pixel_name: selectedPixel?.name,
      business_type: form.businessType.toLowerCase(),
      ...(form.businessType === "LEAD_GEN"
        ? {
            lead_config: {
              primaryEvent: form.lead.primaryEvent,
              primaryEventMapping: form.lead.primaryEventMapping,
            },
          }
        : {
            ecommerce_config: {
              purchaseEvent: form.ecommerce.purchaseEvent,
              purchaseEventMapping: form.ecommerce.purchaseEventMapping,
            },
            product_insights_enabled: form.products.enabled,
          }),
    };

    store.setSaving(true);
    try {
      await saveMutation.mutateAsync(updateData);
      // Invalidate workspace accounts to refresh status
      queryClient.invalidateQueries({ queryKey: ["workspace-accounts"] });
      store.close();
      return true;
    } catch {
      return false;
    } finally {
      store.setSaving(false);
    }
  };

  return {
    // Store state
    ...store,

    // Onboarding data
    onboardingData,
    loadingSteps,
    refetchSteps,

    // Refresh functionality
    isRefreshing: pixelsQuery.isFetching || eventsQuery.isFetching,
    handleForceRefresh,

    // Save methods
    saveStep,
    saveConfiguration,
    isSaving: saveMutation.isPending,
  };
}

// Selector hooks for specific state slices
export const useFacebookConfigOpen = () =>
  useFacebookConfigStore((state) => state.isOpen);
export const useFacebookConfigStep = () =>
  useFacebookConfigStore((state) => state.step);
export const useFacebookConfigForm = () =>
  useFacebookConfigStore((state) => state.form);
export const useFacebookConfigPixels = () =>
  useFacebookConfigStore((state) => state.pixels);
export const useFacebookConfigEvents = () =>
  useFacebookConfigStore((state) => state.pixelEvents);
