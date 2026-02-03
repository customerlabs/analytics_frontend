"use client";

import { APIClientError } from "@/lib/apiErrors";

export interface FetchClientOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: unknown;
}

/**
 * Fetch from internal Next.js API routes (client-side)
 * For backend API calls, use server actions instead
 */
export async function fetchFromAPIClient<T>(
  endpoint: string,
  options?: FetchClientOptions
): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = endpoint.startsWith('http') ? endpoint : new URL(endpoint, baseUrl).toString();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

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