/**
 * CustomerLabs Onboarding Types
 */

// Step keys enum for type-safe step identification
// These must match the database master_onboarding_steps.step_key values
export enum StepKey {
  DATA_AVAILABILITY = "data_availability_check",
  BASIC_ACCOUNT = "basic_account_config",
  CONVERSION_EVENTS = "conversion_events_config",
  PRODUCT_EVENTS = "product_events_config",
  UTM_EVENTS = "utm_events_config",
}

// Step status for visual indicators
export type StepStatus = "pending" | "current" | "completed" | "skipped";

// Skippable types
export type SkippableType = "permanent" | "temporary" | null;

// Onboarding step definition
export interface OnboardingStep {
  step_key: StepKey;
  title: string;
  description?: string;
  step_order: number;
  is_required: boolean;
  skippable_type?: SkippableType;
  auto_fill_enabled: boolean;
  status?: StepStatus;
}

// Data availability check response (matches backend DataAvailabilityResponse)
export interface DataAvailabilityData {
  has_data: boolean;
  event_counts: EventCount[];
  total_events: number;
  date_range_start?: string | null;
  date_range_end?: string | null;
}

export interface EventCount {
  event_name: string;
  count: number;
  first_seen?: string | null;
  last_seen?: string | null;
}

// Basic account configuration
export interface BasicAccountConfig {
  timezone: string;
  currency: string;
  business_category: string;
  new_user_event: string;
  repeat_user_event: string;
}

// Field mapping for event configurations
export interface FieldMapping {
  target_field: string;
  source_field: string;
  fallback_field?: string;
  default_value?: string;
  is_required: boolean;
}

// Conversion events configuration
export interface ConversionEventsConfig {
  selected_events: string[];
  field_mappings: FieldMapping[];
}

// Product events configuration
export interface ProductEventsConfig {
  selected_events: string[];
  field_mappings: FieldMapping[];
}

// UTM events configuration
export interface UtmEventsConfig {
  selected_events: string[];
  field_mappings: FieldMapping[];
}

// Union type for all step data
export type StepData =
  | DataAvailabilityData
  | BasicAccountConfig
  | ConversionEventsConfig
  | ProductEventsConfig
  | UtmEventsConfig;

// Step data map for type-safe access
export interface StepDataMap {
  [StepKey.DATA_AVAILABILITY]: DataAvailabilityData;
  [StepKey.BASIC_ACCOUNT]: BasicAccountConfig;
  [StepKey.CONVERSION_EVENTS]: ConversionEventsConfig;
  [StepKey.PRODUCT_EVENTS]: ProductEventsConfig;
  [StepKey.UTM_EVENTS]: UtmEventsConfig;
}

// API response types
export interface OnboardingDataResponse {
  steps: OnboardingStep[];
  current_step: StepKey;
  completed_steps: StepKey[];
  step_data: Partial<StepDataMap>;
}

export interface SaveStepResponse {
  success: boolean;
  step_key: StepKey;
  next_step?: StepKey;
  errors?: Record<string, string[]>;
}

// =============================================================================
// AI Recommendations Types (from /api/v1/customerlabs/recommendations)
// =============================================================================

/** Field mapping suggestion from AI for conversion fields */
export interface ConversionFieldMapping {
  sourceField: string;
  fallback?: string;
  default?: string | number;
}

/** Conversion configuration from AI recommendations */
export interface ConversionsConfig {
  fields: Record<string, ConversionFieldMapping>;
  conversionEvents: string; // Primary conversion event name
}

/** Product field mapping from AI recommendations */
export interface ProductFieldMapping {
  key: string;
  outputName: string;
  type: "STRING" | "INT64" | "FLOAT64" | "BOOLEAN";
}

/** UTM field mapping from AI recommendations */
export interface UtmFieldMapping {
  key: string;
  outputName: string;
  type: "STRING";
}

/** Metadata about the recommendation generation */
export interface RecommendationMetadata {
  generated_at: string;
  model_version: string;
  warnings?: string[];
}

/**
 * Response containing AI-generated configuration recommendations.
 * Returned by the /api/v1/customerlabs/recommendations endpoint.
 */
export interface RecommendationsResponse {
  conversionsConfig: ConversionsConfig;
  productFields: ProductFieldMapping[];
  utmFields: UtmFieldMapping[];
  recommendations?: string[]; // Text recommendations from AI
  warnings?: string[];
  metadata: RecommendationMetadata;
}

// Available source fields from the account
export interface SourceField {
  field_name: string;
  field_type: string;
  sample_values?: string[];
  occurrence_count: number;
}

export interface AvailableEvent {
  event_name: string;
  event_count: number;
  sample_properties?: Record<string, unknown>;
}

// Step component props
export interface StepComponentProps {
  accountId: string;
  onValidationChange: (isValid: boolean) => void;
  onRegisterData: (getData: () => StepData | null) => void;
}

// Step wrapper props
export interface StepWrapperProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

// Progress indicator props
export interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  completedSteps: number;
}

// =============================================================================
// CustomerLabs Settings Types (for unified PUT /settings endpoint)
// =============================================================================

/**
 * Full CustomerLabs settings response from GET /api/v1/customerlabs/settings
 * This combines all configuration data into a single unified structure.
 */
export interface CustomerlabsSettings {
  account_id: string;
  client_timezone: string;
  base_currency: string;
  business_category: string;
  backfill_start_date?: string | null;
  multi_currency_enabled: boolean;
  new_user_event?: string | null;
  repeat_user_event?: string | null;
  conversion_settings: ConversionEventsConfig[];
  product_settings: ProductEventsConfig[];
  utm_settings: UtmEventsConfig[];
}

/**
 * Partial update type for PUT /api/v1/customerlabs/settings
 * Only provided fields will be updated (partial update semantics).
 * Include step_key to mark that step as completed.
 */
export type CustomerlabsSettingsUpdate = Partial<
  Omit<CustomerlabsSettings, "account_id">
> & {
  step_key?: string;
};
