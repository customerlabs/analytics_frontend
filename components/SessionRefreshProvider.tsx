'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';

const REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 min before expiry

export function SessionRefreshProvider({ children }: { children: React.ReactNode }) {
  const { data: session, update } = useSession();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);
  const isSigningOutRef = useRef(false);

  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // Prevent multiple signOut calls
    if (isSigningOutRef.current) {
      return;
    }

    // If session has error, sign out and redirect to login
    if (session?.error === 'RefreshTokenError') {
      console.log('Session refresh failed, signing out...');
      isSigningOutRef.current = true;
      signOut({ callbackUrl: '/login' });
      return;
    }

    // Check if refresh token is expired
    if (session?.refreshExpiresAt) {
      const refreshExpired = Date.now() >= session.refreshExpiresAt * 1000;
      if (refreshExpired) {
        console.log('Refresh token expired, signing out...');
        isSigningOutRef.current = true;
        signOut({ callbackUrl: '/login' });
        return;
      }
    }

    // No expiresAt means no scheduling needed
    if (!session?.expiresAt) return;

    const now = Date.now();
    const expiresAtMs = session.expiresAt * 1000;
    const refreshAt = expiresAtMs - REFRESH_BUFFER_MS;
    const delay = Math.max(0, refreshAt - now);

    // Only schedule if there's actually time to wait
    if (delay > 0) {
      console.log(`Session refresh scheduled in ${Math.round(delay / 1000 / 60)} minutes`);
      timerRef.current = setTimeout(async () => {
        if (!isRefreshingRef.current && !isSigningOutRef.current) {
          isRefreshingRef.current = true;
          console.log('Proactively refreshing session...');
          try {
            await update();
          } finally {
            isRefreshingRef.current = false;
          }
        }
      }, delay);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [session?.expiresAt, session?.refreshExpiresAt, session?.error, update]);

  return <>{children}</>;
}
