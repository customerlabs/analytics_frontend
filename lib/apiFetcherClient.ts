"use client";

import { APIClientError } from "@/lib/apiErrors";

export interface FetchClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
  token?: string; // Optional Bearer token for backend API calls
  baseUrl?: string; // Override default base URL
}

export async function fetchFromAPIClient<T>(
  endpoint: string,
  options?: FetchClientOptions
): Promise<T> {
  const defaultBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://open.dirtyvocal.com';
  const baseUrl = options?.baseUrl || defaultBaseUrl;
  const url = endpoint.startsWith('http') ? endpoint : new URL(endpoint, baseUrl).toString();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  // Add Bearer token if provided (for backend API calls)
  if (options?.token) {
    headers['Authorization'] = `Bearer ${options.token}`;
  }

  const res = await fetch(url, {
    method: options?.method || 'GET',
    credentials: 'include', // This ensures cookies are sent with the request
    headers,
    body: options?.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    // Return null for 404 to avoid logging noise
    if (res.status === 404) {
      return null as T;
    }
    throw new APIClientError(
      `API request failed: ${res.status} ${res.statusText} - ${endpoint}`,
      res.status,
      endpoint
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
 */
export async function fetchFromBackendAPI<T>(
  endpoint: string,
  token: string,
  options?: Omit<FetchClientOptions, 'token' | 'baseUrl'>
): Promise<T> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  return fetchFromAPIClient<T>(endpoint, {
    ...options,
    token,
    baseUrl: backendUrl,
  });
} 