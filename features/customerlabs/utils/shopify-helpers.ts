/**
 * Shopify helper utilities.
 * These are pure functions that can be used in both client and server code.
 */

/**
 * Generate dataset ID from workspace ID and app ID.
 * Format: workspaceid_<app_id>
 */
export function generateDatasetId(workspaceId: string, appId: string): string {
  return `${workspaceId}_${appId}`;
}

/**
 * Validate Shopify domain format.
 * Returns true if domain matches pattern: *.myshopify.com
 */
export function isValidShopifyDomain(domain: string): boolean {
  // Remove protocol if present
  const cleanDomain = domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();

  // Check if it's a valid myshopify.com domain
  return /^[a-z0-9-]+\.myshopify\.com$/.test(cleanDomain);
}

/**
 * Clean and normalize Shopify domain.
 * Removes protocol and trailing slashes.
 */
export function normalizeShopifyDomain(domain: string): string {
  return domain
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "")
    .toLowerCase();
}
