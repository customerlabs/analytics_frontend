"use client";

import useSWR from "swr";
import type { Workspace } from "@/types/workspace";

const fetcher = (url: string) =>
  fetch(url).then((res) => {
    if (!res.ok) throw new Error("Failed to fetch workspaces");
    return res.json();
  });

interface UseWorkspaceListOptions {
  /** Initial workspaces to use as fallback while loading */
  fallbackData?: Workspace[];
}

export function useWorkspaceList(options?: UseWorkspaceListOptions) {
  const { data, error, isLoading, mutate } = useSWR<{ workspaces: Workspace[] }>(
    "/api/workspaces",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnMount: true,
      fallbackData: options?.fallbackData
        ? { workspaces: options.fallbackData }
        : undefined,
    }
  );

  return {
    workspaces: data?.workspaces ?? [],
    isLoading,
    error,
    refetch: mutate,
  };
}
