"use client";

import { useQuery } from "@tanstack/react-query";
import {
  getWorkspaceAccounts,
  type AccountResponse,
} from "@/lib/api/accounts";

interface UseWorkspaceAccountsOptions {
  workspaceId: string;
  enabled?: boolean;
}

export function useWorkspaceAccounts(options: UseWorkspaceAccountsOptions) {
  const { workspaceId, enabled = true } = options;

  return useQuery<AccountResponse[]>({
    queryKey: ["workspace-accounts", workspaceId],
    queryFn: () => getWorkspaceAccounts(workspaceId),
    staleTime: 30 * 1000, // 30 seconds
    enabled: enabled && !!workspaceId,
  });
}
