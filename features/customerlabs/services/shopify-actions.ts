"use server";

import { z } from "zod";
import { fetchFromBackendAPI, fetchFromCustomerLabsAPI } from "@/lib/apiFetcherServer";
import type {
  ListShopifyStoresResponse,
  CreateShopifySourceRequest,
  CreateShopifySourceResponse,
  CreateSystemSourceResponse,
  InitiateImportResponse,
  HistoricalImportRecord,
  SaveImportRecordInput,
  ShopifySourceConfig,
} from "../types/shopify";

// =============================================================================
// Zod Validation Schemas
// =============================================================================

const AppIdSchema = z.string().min(1, "App ID is required");

const SourceIdSchema = z.string().min(1, "Source ID is required");

const AccountIdSchema = z.string().min(1, "Account ID is required");

const DatasetIdSchema = z.string().min(1, "Dataset ID is required");

const ShopifySourceConfigSchema = z.object({
  shopify_domain: z
    .string()
    .min(1, "Shopify domain is required")
    .regex(
      /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/i,
      "Invalid Shopify domain format"
    ),
  shopify_client_id: z.string().min(1, "Client ID is required"),
  shopify_client_secret: z.string().min(1, "Client Secret is required"),
});

const CreateShopifySourceInputSchema = z.object({
  userEmail: z.string().email("Invalid email format"),
  appId: AppIdSchema,
  sourceName: z.string().min(1, "Source name is required"),
  sourceConfig: ShopifySourceConfigSchema,
});

const SaveImportRecordInputSchema = z.object({
  source_type: z.string().min(1),
  source_id: z.string().min(1),
  source_name: z.string().min(1),
  source_domain: z.string().optional(),
  connection_method: z.enum(["app_installed", "custom_app"]),
  job_id: z.string().min(1),
  dataset_id: z.string().min(1),
  status: z.enum(["initiated", "processing", "completed", "failed"]),
});

// Analytics backend paths
const IMPORTS_BASE = "/api/v1/imports";

// =============================================================================
// CustomerLabs App API (External - Server-to-Server)
// =============================================================================

/**
 * List all connected Shopify stores for an account.
 * Groups stores by connection method: public_app vs custom_app
 */
export async function listShopifyStores(
  appId: string
): Promise<ListShopifyStoresResponse> {
  try {
    AppIdSchema.parse(appId);

    const endpoint = `/morning-coffee/sources/list?app_id=${encodeURIComponent(appId)}&source_type=shopify`;

    return await fetchFromCustomerLabsAPI<ListShopifyStoresResponse>(endpoint, {
      authType: "api_key",
      method: "GET",
    });
  } catch {
    // Return empty data on network/fetch errors to prevent page crash
    return {
      success: false,
      data: {
        app_id: appId,
        source_type: "shopify",
        total_sources: 0,
        public_app_sources: [],
        custom_app_sources: [],
      },
    };
  }
}

/**
 * Create a new Shopify source via Custom App credentials.
 * Used when user manually enters their Shopify app credentials.
 */
export async function createShopifySource(
  userEmail: string,
  appId: string,
  sourceName: string,
  sourceConfig: ShopifySourceConfig
): Promise<CreateShopifySourceResponse> {
  CreateShopifySourceInputSchema.parse({
    userEmail,
    appId,
    sourceName,
    sourceConfig,
  });

  const payload: CreateShopifySourceRequest = {
    user_email: userEmail,
    app_id: appId,
    source_name: sourceName,
    source_type: "custom_shopify",
    source_config: sourceConfig,
  };

  return fetchFromCustomerLabsAPI<CreateShopifySourceResponse>(
    "/morning-coffee/source/create",
    {
      authType: "api_key",
      method: "POST",
      body: payload,
    }
  );
}

/**
 * Create a system source for import tracking.
 * Creates a duplicate source with is_system_source flag for internal operations.
 */
export async function createSystemSource(
  appId: string,
  sourceId: string
): Promise<CreateSystemSourceResponse> {
  AppIdSchema.parse(appId);
  SourceIdSchema.parse(sourceId);

  return fetchFromCustomerLabsAPI<CreateSystemSourceResponse>(
    "/morning-coffee/sources/system/create",
    {
      authType: "api_key",
      method: "POST",
      body: {
        app_id: appId,
        source_id: sourceId,
      },
    }
  );
}

/**
 * Initiate historical data import job.
 * Triggers the Decision Maker workflow to start importing historical data.
 */
export async function initiateHistoricalImport(
  appId: string,
  sourceId: string,
  datasetId: string
): Promise<InitiateImportResponse> {
  AppIdSchema.parse(appId);
  SourceIdSchema.parse(sourceId);
  DatasetIdSchema.parse(datasetId);

  return fetchFromCustomerLabsAPI<InitiateImportResponse>(
    "/morning-coffee/historical-import/initiate",
    {
      authType: "api_key",
      method: "POST",
      body: {
        app_id: appId,
        source_id: sourceId,
        mc_dataset_id: datasetId,
      },
    }
  );
}

// =============================================================================
// Analytics Backend API (Internal)
// =============================================================================

interface ImportRecordsResponse {
  imports: HistoricalImportRecord[];
}

/**
 * Save import record to analytics backend for tracking.
 * Creates a new record in the historical_imports table.
 */
export async function saveImportRecord(
  accountId: string,
  data: SaveImportRecordInput
): Promise<HistoricalImportRecord> {
  AccountIdSchema.parse(accountId);
  SaveImportRecordInputSchema.parse(data);

  const response = await fetchFromBackendAPI<{ result: HistoricalImportRecord }>(
    IMPORTS_BASE,
    {
      method: "POST",
      body: {
        account_id: accountId,
        ...data,
      },
    }
  );

  if (!response?.result) {
    throw new Error("Failed to save import record");
  }

  return response.result;
}

/**
 * Get import history for an account.
 * Optionally filter by source_type.
 */
export async function getImportHistory(
  accountId: string,
  sourceType?: string
): Promise<HistoricalImportRecord[]> {
  AccountIdSchema.parse(accountId);

  let url = `${IMPORTS_BASE}?account_id=${encodeURIComponent(accountId)}`;

  if (sourceType) {
    url += `&source_type=${encodeURIComponent(sourceType)}`;
  }

  const response =
    await fetchFromBackendAPI<{ result: ImportRecordsResponse }>(url);

  return response?.result?.imports || [];
}

/**
 * Get a single import record by ID.
 */
export async function getImportRecord(
  importId: string
): Promise<HistoricalImportRecord | null> {
  const response = await fetchFromBackendAPI<{
    result: HistoricalImportRecord;
  }>(`${IMPORTS_BASE}/${importId}`);

  return response?.result || null;
}

