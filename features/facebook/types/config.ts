// Step tracking
export type ConfigStep = 1 | 2 | 3;

// Business types
export type BusinessType = "LEAD_GEN" | "ECOMMERCE";

// Pixel type
export interface FacebookPixel {
  id: string;
  name: string;
  isDefault?: boolean;
}

// Conversion event from pixel
export interface ConversionEvent {
  value: string;
  label: string;
  count: number;
  isCustom?: boolean;
}

// Facebook action type for mapping
export interface ActionType {
  actionType: string;
  conversions: number;
  isCustom?: boolean;
}

// Event verification result
export interface EventVerification {
  hasData: boolean;
  totalConversions?: number;
  period?: string;
  error?: string;
}

// Lead configuration
export interface LeadConfig {
  primaryEvent: string;
  primaryEventMapping: string;
  qualityEvent?: string;
  qualityEventMapping?: string;
}

// Ecommerce configuration
export interface EcommerceConfig {
  purchaseEvent: string;
  purchaseEventMapping: string;
  newCustomerEvent?: string;
  newCustomerEventMapping?: string;
}

// Product insights configuration
export interface ProductsConfig {
  enabled: boolean;
}

// Form state for the configuration wizard
export interface ConfigFormState {
  pixelId: string | null;
  businessType: BusinessType;
  lead: LeadConfig;
  ecommerce: EcommerceConfig;
  products: ProductsConfig;
}

// Default form state
export const DEFAULT_CONFIG_FORM: ConfigFormState = {
  pixelId: null,
  businessType: "LEAD_GEN",
  lead: {
    primaryEvent: "",
    primaryEventMapping: "",
    qualityEvent: "",
    qualityEventMapping: "",
  },
  ecommerce: {
    purchaseEvent: "",
    purchaseEventMapping: "",
    newCustomerEvent: "",
    newCustomerEventMapping: "",
  },
  products: {
    enabled: false,
  },
};
