'use server';

import { cache } from 'react';
import { getIronSession, IronSession } from 'iron-session';
import { cookies } from 'next/headers';
import type { SessionData, SessionUser, SessionTokens } from '@/lib/keycloak/types';
import { sessionOptions } from './session-config';

// Default empty session
const defaultSession: SessionData = {
  user: null,
  tokens: null,
};

// Internal session getter (not cached)
async function getSessionInternal(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  // Initialize with defaults if empty
  if (!session.user) {
    session.user = defaultSession.user;
  }
  if (!session.tokens) {
    session.tokens = defaultSession.tokens;
  }

  return session;
}

// Cached session getter - deduplicated within a single request
export const getSession = cache(getSessionInternal);

// Check if user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session.user !== null && session.tokens !== null;
}

// Get current user from session
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getSession();
  return session.user;
}

// Get current tokens from session
export async function getTokens(): Promise<SessionTokens | null> {
  const session = await getSession();
  return session.tokens;
}

// Set session data after login (minimal data to keep cookie small)
export async function setSessionData(
  user: SessionUser,
  tokens: SessionTokens
): Promise<void> {
  const session = await getSession();
  session.user = user;
  session.tokens = tokens;
  await session.save();
}

// Update tokens in session (for refresh)
export async function updateSessionTokens(tokens: SessionTokens): Promise<void> {
  const session = await getSession();
  session.tokens = tokens;
  await session.save();
}

// Clear session (logout)
export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

// Check if session has valid tokens (not expired)
export async function hasValidTokens(): Promise<boolean> {
  const session = await getSession();
  if (!session.tokens) return false;

  // Check if access token is expired (with 60s buffer)
  const now = Date.now();
  const bufferMs = 60 * 1000; // 60 seconds
  return session.tokens.expiresAt > now + bufferMs;
}

// Check if refresh token is still valid
export async function hasValidRefreshToken(): Promise<boolean> {
  const session = await getSession();
  if (!session.tokens) return false;

  const now = Date.now();
  return session.tokens.refreshExpiresAt > now;
}
