/**
 * Shopify Data Import Types
 * Types for the Shopify historical data import feature
 */

// Step tracking for the import wizard
export type ShopifyImportStep = 1 | 2 | 3 | 4;

// Connection method - how the store was connected
export type ConnectionMethod = "app_installed" | "custom_app";

// Import job status
export type ImportJobStatus =
  | "initiated"
  | "processing"
  | "completed"
  | "failed";

/**
 * Shopify store source from the List API
 */
export interface ShopifyStore {
  source_id: string;
  source_name: string;
  source_type: string;
  shopify_domain: string;
  connection_method: ConnectionMethod;
  is_active: boolean;
  is_system_source?: boolean;
  created_at: string;
  config?: {
    app_enabled?: boolean;
    shopify_client_id?: string;
    has_credentials?: boolean;
  };
}

/**
 * Response from List Shopify Sources API
 */
export interface ListShopifyStoresResponse {
  success: boolean;
  data: {
    app_id: string;
    source_type: string;
    total_sources: number;
    public_app_sources: ShopifyStore[];
    custom_app_sources: ShopifyStore[];
  };
  // Error fields (when success: false)
  error?: string;
  details?: {
    app_id?: string;
    [key: string]: unknown;
  };
}

/**
 * Configuration for creating a new Shopify source via Custom App
 */
export interface ShopifySourceConfig {
  shopify_domain: string;
  shopify_client_id: string;
  shopify_client_secret: string;
}

/**
 * Request payload for creating a Shopify source
 */
export interface CreateShopifySourceRequest {
  user_email: string;
  app_id: string;
  source_name: string;
  source_type: "shopify" | "custom_shopify";
  source_config: ShopifySourceConfig;
}

/**
 * Response from Create Shopify Source API
 */
export interface CreateShopifySourceResponse {
  success: boolean;
  data?: {
    source_id: string;
    source_name: string;
    source_type: string;
    source_domain: string;
    app_id: string;
  };
  error?: string;
  message?: string; // API may return message instead of error
}

/**
 * Response from Create System Source API
 */
export interface CreateSystemSourceResponse {
  success: boolean;
  data: {
    system_source_id: string;
    system_source_name: string;
    original_source_id: string;
    app_id: string;
    connection_method: ConnectionMethod;
    is_system_source: boolean;
    config: Record<string, unknown>;
  };
  error?: string;
}

/**
 * Import job returned from Initiate Historical Import API
 */
export interface ImportJob {
  job_id: string;
  status: ImportJobStatus;
  app_id: string;
  source_id: string;
  source_type: string;
  mc_dataset_id: string;
  message?: string;
}

/**
 * Response from Initiate Historical Import API
 */
export interface InitiateImportResponse {
  success: boolean;
  data: ImportJob;
  error?: string;
}

/**
 * Generalized import record stored in analytics backend
 * Supports all source types (Shopify, BigCommerce, WooCommerce, etc.)
 */
export interface HistoricalImportRecord {
  id: string;
  account_id: string;
  source_type: string;
  source_id: string;
  source_name: string;
  source_domain?: string;
  connection_method: ConnectionMethod;
  job_id: string;
  dataset_id: string;
  status: ImportJobStatus;
  error_message?: string;
  records_processed?: number;
  total_records?: number;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

/**
 * Input for saving an import record
 */
export interface SaveImportRecordInput {
  source_type: string;
  source_id: string;
  source_name: string;
  source_domain?: string;
  connection_method: ConnectionMethod;
  job_id: string;
  dataset_id: string;
  status: ImportJobStatus;
}

/**
 * Form state for connecting a new store via Custom App
 */
export interface CustomAppFormState {
  shopifyDomain: string;
  clientId: string;
  clientSecret: string;
}

/**
 * Default form state for Custom App connection
 */
export const DEFAULT_CUSTOM_APP_FORM: CustomAppFormState = {
  shopifyDomain: "",
  clientId: "",
  clientSecret: "",
};
