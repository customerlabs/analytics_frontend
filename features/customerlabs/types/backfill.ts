export type BackfillPlatform =
  | "shopify"
  | "bigcommerce"
  | "woocommerce"
  | "google_analytics";

export interface BackfillPlatformConfig {
  id: BackfillPlatform;
  title: string;
  description: string;
  icon: string;
}

export const BACKFILL_PLATFORMS: BackfillPlatformConfig[] = [
  {
    id: "shopify",
    title: "Shopify",
    description: "Import historical orders, customers, and products",
    icon: "/icons/platforms/shopify-logo.svg",
  },
  {
    id: "bigcommerce",
    title: "BigCommerce",
    description: "Import historical orders, customers, and products",
    icon: "/icons/platforms/BigCommerce-logo-dark.svg",
  },
  {
    id: "woocommerce",
    title: "WooCommerce",
    description: "Import historical orders, customers, and products",
    icon: "/icons/platforms/Woo_logo_color.svg",
  },
  {
    id: "google_analytics",
    title: "Google Analytics",
    description: "Import historical sessions, events, and conversions",
    icon: "/icons/platforms/google-analytics.svg",
  },
];

export interface BackfillFormData {
  startDate: string;
  endDate: string;
}
