"use client";

import { useState, useCallback } from "react";
import type { Workspace } from "@/types/workspace";

interface UseWorkspaceListOptions {
  /** Initial workspaces to use as fallback while loading */
  fallbackData?: Workspace[];
}

export function useWorkspaceList(options?: UseWorkspaceListOptions) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>(
    options?.fallbackData ?? []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/workspaces");
      if (!res.ok) throw new Error("Failed to fetch workspaces");
      const data = await res.json();
      setWorkspaces(data.workspaces);
    } catch (err) {
      setError(err instanceof Error ? err : new Error("Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { workspaces, isLoading, error, refetch };
}
