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

type CustomerLabsAuthType = 'token' | 'api_key';

interface CustomerLabsFetchOptions {
  authType: CustomerLabsAuthType;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  accessToken?: string; // Optional override for token auth
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


  // Build headers
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Use Bearer token for backend API, cookies for internal API
  if (options?.useBackendAPI) {
    // Use provided token or fall back to session
    let accessToken = options?.accessToken;

    if (!accessToken) {
      const session = await getSession();

      // Check for token refresh failure before using expired token
      if (session?.error === "RefreshTokenError") {
        throw new APIError(
          "Your session has expired. Please sign in again.",
          401,
          endpoint,
          "SessionExpired"
        );
      }

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

/**
 * Convenience function for CustomerLabs API calls with flexible authentication
 * @param endpoint - CustomerLabs API endpoint (e.g., '/morning-coffee/sources/list')
 * @param options - Request options including auth type ('token' or 'api_key')
 * @returns Typed API response
 */
export async function fetchFromCustomerLabsAPI<T>(
  endpoint: string,
  options: CustomerLabsFetchOptions
): Promise<T> {
  const { authType, accessToken, method = 'GET', body } = options;

  const baseUrl = process.env.CUSTOMERLABS_APP_API_URL;
  if (!baseUrl) {
    throw new Error('CUSTOMERLABS_APP_API_URL environment variable is not set');
  }

  const url = `${baseUrl}${endpoint}`;

  // Build headers based on auth type
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authType === 'api_key') {
    const apiKey = process.env.CUSTOMERLABS_APP_API_KEY;
    if (!apiKey) {
      throw new Error('CUSTOMERLABS_APP_API_KEY environment variable is not set');
    }
    headers['API-KEY'] = apiKey;
  } else {
    // Token auth - get from session or use provided token
    let token = accessToken;
    if (!token) {
      const session = await getSession();
      if (!session?.accessToken) {
        throw new APIError('No access token available', 401, endpoint, 'Unauthorized');
      }
      token = session.accessToken;
    }
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return null as T;
  }

  // CustomerLabs API always returns JSON with { success: boolean, data/error: ... }
  // Return the actual response for both success and error cases
  // so the caller can check response.success
  return response.json();
}
