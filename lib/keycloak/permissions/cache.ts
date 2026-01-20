'use server';

import type { UserPermissions } from '../types';

// In-memory cache for permissions
// In production, consider using Redis for multi-instance support
const memoryCache = new Map<
  string,
  { data: UserPermissions; expiresAt: number }
>();

// Default TTL: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

/**
 * Get cached permissions for a user
 */
export async function getPermissionCache(
  userId: string
): Promise<UserPermissions | null> {
  const cacheKey = `permissions:${userId}`;
  const cached = memoryCache.get(cacheKey);

  if (!cached) {
    return null;
  }

  // Check if expired
  if (cached.expiresAt < Date.now()) {
    memoryCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Set cached permissions for a user
 */
export async function setPermissionCache(
  userId: string,
  permissions: UserPermissions,
  ttl: number = DEFAULT_TTL
): Promise<void> {
  const cacheKey = `permissions:${userId}`;
  memoryCache.set(cacheKey, {
    data: permissions,
    expiresAt: Date.now() + ttl,
  });
}

/**
 * Invalidate cached permissions for a user
 */
export async function invalidatePermissionCache(userId: string): Promise<void> {
  const cacheKey = `permissions:${userId}`;
  memoryCache.delete(cacheKey);
}

/**
 * Invalidate all cached permissions
 */
export async function invalidateAllPermissionCaches(): Promise<void> {
  memoryCache.clear();
}

/**
 * Get cache stats (for debugging)
 */
export async function getCacheStats(): Promise<{
  size: number;
  keys: string[];
}> {
  return {
    size: memoryCache.size,
    keys: Array.from(memoryCache.keys()),
  };
}
