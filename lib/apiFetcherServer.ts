"use server";

import { cookies } from "next/headers";
import { APIError } from "@/lib/apiErrors";

interface FetchOptions {
  revalidate?: number; // Cache duration in seconds (default: 300 = 5 minutes)
  tags?: string[]; // Cache tags for selective invalidation
}

/**
 * Fetches data from internal API with smart caching
 * @param endpoint - API endpoint to fetch from
 * @param options - Cache options (revalidate time, tags)
 * @returns Typed API response
 */
export async function fetchFromAPI<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  const cookieStore = cookies();
  // Use internal URL for server-side requests within Docker
  const baseUrl = process.env.INTERNAL_API_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  const url = endpoint.startsWith('http') ? endpoint : new URL(endpoint, baseUrl).toString();

  // Extract resource type from endpoint for auto-tagging (e.g., /api/v1/audio/trending → 'audio')
  const resourceMatch = endpoint.match(/\/api\/v1\/([^\/]+)/);
  const resourceType = resourceMatch ? resourceMatch[1] : 'default';

  const res = await fetch(url, {
    headers: {
      'Cookie': cookieStore.toString(),
    },
    next: {
      revalidate: options?.revalidate ?? 300, // Default 5-minute cache
      tags: options?.tags ?? [resourceType], // Auto-tag by resource type
    }
  });

  if (!res.ok) {
    // Return null for 404 to avoid logging noise
    if (res.status === 404) {
      return null as T;
    }
    throw new APIError(
      `API request failed: ${res.status} ${res.statusText} - ${endpoint}`,
      res.status,
      endpoint,
      res.statusText
    );
  }

  return res.json();
}