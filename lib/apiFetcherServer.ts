"use server";

import { cookies } from "next/headers";
import { getSession } from "@/lib/auth/helpers";
import { APIError } from "@/lib/apiErrors";

interface FetchOptions {
  revalidate?: number; // Cache duration in seconds (default: 300 = 5 minutes)
  tags?: string[]; // Cache tags for selective invalidation
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  useBackendAPI?: boolean; // When true, use Bearer token and backend URL
  skipCache?: boolean; // Skip caching for mutations
  accessToken?: string; // Optional access token to avoid redundant auth() calls
}

/**
 * Fetches data from internal API with smart caching
 * @param endpoint - API endpoint to fetch from
 * @param options - Cache options (revalidate time, tags) and request options
 * @returns Typed API response
 */
export async function fetchFromAPI<T>(
  endpoint: string,
  options?: FetchOptions
): Promise<T> {
  const cookieStore = await cookies();

  // Determine base URL based on whether we're calling backend API
  let baseUrl: string;
  if (options?.useBackendAPI) {
    baseUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  } else {
    baseUrl = process.env.INTERNAL_API_URL || process.env.NEXTAUTH_URL || 'http://localhost:3000';
  }

  const url = endpoint.startsWith('http') ? endpoint : new URL(endpoint, baseUrl).toString();

  // Extract resource type from endpoint for auto-tagging (e.g., /api/v1/audio/trending → 'audio')
  const resourceMatch = endpoint.match(/\/api\/v1\/([^\/]+)/);
  const resourceType = resourceMatch ? resourceMatch[1] : 'default';

  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Use Bearer token for backend API, cookies for internal API
  if (options?.useBackendAPI) {
    // Use provided token or fall back to getSession()
    let accessToken = options?.accessToken;

    if (!accessToken) {
      const session = await getSession();
      accessToken = session?.accessToken;
    }

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
  } else {
    headers['Cookie'] = cookieStore.toString();
  }

  // Build fetch options
  const fetchOptions: RequestInit & { next?: { revalidate?: number; tags?: string[] } } = {
    method: options?.method || 'GET',
    headers,
  };

  // Add body for non-GET requests
  if (options?.body && options.method !== 'GET') {
    fetchOptions.body = JSON.stringify(options.body);
  }

  // Add caching options for GET requests (skip for mutations)
  // TODO: Re-enable caching after debugging
  // const isMutation = options?.method && options.method !== 'GET';
  // if (!isMutation && !options?.skipCache) {
  //   fetchOptions.next = {
  //     revalidate: options?.revalidate ?? 300, // Default 5-minute cache
  //     tags: options?.tags ?? [resourceType], // Auto-tag by resource type
  //   };
  // }
  fetchOptions.cache = 'no-store';

  const res = await fetch(url, fetchOptions);

  if (!res.ok) {
    // Return null for 404 to avoid logging noise
    if (res.status === 404) {
      return null as T;
    }
    // Handle 401 - likely token expired
    if (res.status === 401) {
      throw new APIError(
        "Access denied. Your session may have expired.",
        401,
        endpoint,
        "Unauthorized"
      );
    }
    // Try to parse error body for user-friendly message
    let errorMessage = res.status === 409 
      ? "A resource with this identifier already exists"
      : `API request failed: ${res.status} ${res.statusText}`;
    try {
      const errorBody = await res.json();
      // Handle CommonResponse error format
      if (errorBody?.errors?.[0]?.message) {
        errorMessage = errorBody.errors[0].message;
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      } else if (errorBody?.detail) {
        errorMessage = errorBody.detail;
      }
    } catch {
      // Ignore JSON parse errors
    }
    throw new APIError(
      errorMessage,
      res.status,
      endpoint,
      res.statusText
    );
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204) {
    return null as T;
  }

  return res.json();
}

/**
 * Convenience function for backend API calls that require authentication
 * @param endpoint - Backend API endpoint (e.g., '/api/v1/workspaces')
 * @param options - Request options (method, body, cache settings)
 * @returns Typed API response
 */
export async function fetchFromBackendAPI<T>(
  endpoint: string,
  options?: Omit<FetchOptions, 'useBackendAPI'>
): Promise<T> {
  return fetchFromAPI<T>(endpoint, {
    ...options,
    useBackendAPI: true,
  });
}
