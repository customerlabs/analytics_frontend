/**
 * Form options utilities for onboarding configuration
 */

export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Get all IANA timezones using Intl API
 */
export function getTimezones(): SelectOption[] {
  const timezones = Intl.supportedValuesOf("timeZone");
    return timezones.map((tz) => ({
      label: tz.replace(/_/g, " "),
      value: tz,
    }));
}

/**
 * Get all ISO 4217 currencies using Intl API
 */
export function getCurrencies(): SelectOption[] {
  const currencies = Intl.supportedValuesOf("currency");
    return currencies.map((currency) => {
      let displayName = currency;
      try {
        displayName = new Intl.DisplayNames(["en"], { type: "currency" }).of(
          currency,
        ) as string;
      } catch {
        // Fallback to currency code
      }
      return {
        label: `${currency} - ${displayName}`,
        value: currency,
      };
    });
}

/**
 * Business categories for account configuration
 */
export const BUSINESS_CATEGORIES: SelectOption[] = [
  { label: "E-commerce / Retail", value: "ecommerce" },
  { label: "SaaS / Software", value: "saas" },
  { label: "Lead Generation", value: "lead_gen" },
  { label: "Marketplace", value: "marketplace" },
  { label: "Other", value: "other" },
];

/**
 * Standard conversion event field mappings
 */
export const CONVERSION_FIELD_TARGETS = [
  { field: "order_id", label: "Order ID", required: true },
  { field: "value", label: "Order Value", required: true },
  { field: "currency", label: "Currency", required: false },
  { field: "quantity", label: "Quantity", required: false },
  { field: "discount", label: "Discount", required: false },
  { field: "coupon_code", label: "Coupon Code", required: false },
];

/**
 * Standard product event field mappings
 */
export const PRODUCT_FIELD_TARGETS = [
  { field: "product_id", label: "Product ID", required: true },
  { field: "product_name", label: "Product Name", required: true },
  { field: "price", label: "Price", required: false },
  { field: "quantity", label: "Quantity", required: false },
  { field: "category", label: "Category", required: false },
  { field: "brand", label: "Brand", required: false },
  { field: "variant", label: "Variant", required: false },
  { field: "sku", label: "SKU", required: false },
];

/**
 * Standard UTM parameter field mappings
 */
export const UTM_FIELD_TARGETS = [
  { field: "utm_source", label: "UTM Source", required: true },
  { field: "utm_medium", label: "UTM Medium", required: true },
  { field: "utm_campaign", label: "UTM Campaign", required: true },
  { field: "utm_term", label: "UTM Term", required: false },
  { field: "utm_content", label: "UTM Content", required: false },
];

/**
 * Get user's browser timezone
 */
export function getBrowserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export interface RegionOption {
  label: string;
  value: string;
  category: "multi-region" | "region";
}

/**
 * Get supported data storage regions
 */
export function getRegions(): RegionOption[] {
  return [
    // Multi-Region
    { label: "US Multi-Region", value: "US", category: "multi-region" },
    { label: "EU Multi-Region", value: "EU", category: "multi-region" },
    // Single Regions
    {
      label: "Australia (australia-southeast1)",
      value: "australia-southeast1",
      category: "region",
    },
    { label: "India (asia-south1)", value: "asia-south1", category: "region" },
    {
      label: "London (europe-west2)",
      value: "europe-west2",
      category: "region",
    },
    {
      label: "Middle East (me-central1)",
      value: "me-central1",
      category: "region",
    },
    {
      label: "Saudi Arabia (me-central2)",
      value: "me-central2",
      category: "region",
    },
    {
      label: "Singapore (asia-southeast1)",
      value: "asia-southeast1",
      category: "region",
    },
  ];
}

/**
 * Format number with locale
 */
export function formatNumber(value: number, locale = "en-US"): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format date with locale and timezone
 */
export function formatDate(
  date: string | Date,
  timezone?: string,
  locale = "en-US",
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  }).format(dateObj);
}
