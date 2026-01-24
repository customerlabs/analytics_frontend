"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "starredWorkspaces";

export function useStarredWorkspaces() {
  const [starred, setStarred] = useState<Set<string>>(new Set());
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount (SSR-safe)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            setStarred(new Set(parsed));
          }
        } catch {
          // Ignore parse errors
        }
      }
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever starred changes
  useEffect(() => {
    if (isHydrated && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...starred]));
    }
  }, [starred, isHydrated]);

  const toggle = useCallback((workspaceId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setStarred((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(workspaceId)) {
        newSet.delete(workspaceId);
      } else {
        newSet.add(workspaceId);
      }
      return newSet;
    });
  }, []);

  const isStarred = useCallback(
    (workspaceId: string) => starred.has(workspaceId),
    [starred]
  );

  return { starred, toggle, isStarred, isHydrated };
}
