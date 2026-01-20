"use client";

import { APIClientError } from "@/lib/apiErrors";

export async function fetchFromAPIClient<T>(endpoint: string): Promise<T> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://open.dirtyvocal.com';
  const url = endpoint.startsWith('http') ? endpoint : new URL(endpoint, baseUrl).toString();
  
  const res = await fetch(url, {
    credentials: 'include', // This ensures cookies are sent with the request
    headers: {
      'Content-Type': 'application/json',
    }
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

  return res.json();
} 