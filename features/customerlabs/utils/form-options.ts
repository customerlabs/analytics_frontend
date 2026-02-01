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
  try {
    const timezones = Intl.supportedValuesOf("timeZone");
    return timezones.map((tz) => ({
      label: tz.replace(/_/g, " "),
      value: tz,
    }));
  } catch {
    // Fallback for environments that don't support supportedValuesOf
    const commonTimezones = [
      "America/New_York",
      "America/Chicago",
      "America/Denver",
      "America/Los_Angeles",
      "America/Anchorage",
      "Pacific/Honolulu",
      "Europe/London",
      "Europe/Paris",
      "Europe/Berlin",
      "Asia/Tokyo",
      "Asia/Shanghai",
      "Asia/Kolkata",
      "Asia/Dubai",
      "Australia/Sydney",
      "Pacific/Auckland",
      "UTC",
    ];
    return commonTimezones.map((tz) => ({
      label: tz.replace(/_/g, " "),
      value: tz,
    }));
  }
}

/**
 * Get all ISO 4217 currencies using Intl API
 */
export function getCurrencies(): SelectOption[] {
  try {
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
  } catch {
    // Fallback for environments that don't support supportedValuesOf
    const commonCurrencies = [
      { code: "USD", name: "US Dollar" },
      { code: "EUR", name: "Euro" },
      { code: "GBP", name: "British Pound" },
      { code: "JPY", name: "Japanese Yen" },
      { code: "CNY", name: "Chinese Yuan" },
      { code: "INR", name: "Indian Rupee" },
      { code: "AUD", name: "Australian Dollar" },
      { code: "CAD", name: "Canadian Dollar" },
      { code: "CHF", name: "Swiss Franc" },
      { code: "KRW", name: "South Korean Won" },
      { code: "SGD", name: "Singapore Dollar" },
      { code: "BRL", name: "Brazilian Real" },
      { code: "MXN", name: "Mexican Peso" },
    ];
    return commonCurrencies.map(({ code, name }) => ({
      label: `${code} - ${name}`,
      value: code,
    }));
  }
}

/**
 * Business categories for account configuration
 */
export const BUSINESS_CATEGORIES: SelectOption[] = [
  { label: "E-commerce / Retail", value: "ecommerce" },
  { label: "SaaS / Software", value: "saas" },
  { label: "Media / Publishing", value: "media" },
  { label: "Travel / Hospitality", value: "travel" },
  { label: "Finance / Banking", value: "finance" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Education", value: "education" },
  { label: "Real Estate", value: "real_estate" },
  { label: "Automotive", value: "automotive" },
  { label: "Food & Beverage", value: "food_beverage" },
  { label: "Entertainment / Gaming", value: "entertainment" },
  { label: "Non-profit", value: "nonprofit" },
  { label: "B2B Services", value: "b2b_services" },
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
