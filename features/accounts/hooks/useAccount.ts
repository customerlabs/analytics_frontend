"use client";

import { useQuery } from "@tanstack/react-query";
import { getAccount, type AccountResponse } from "@/lib/api/accounts";

interface UseAccountOptions {
  accountId: string;
  enabled?: boolean;
}

export function useAccount(options: UseAccountOptions) {
  const { accountId, enabled = true } = options;

  return useQuery<AccountResponse | null>({
    queryKey: ["account", accountId],
    queryFn: () => getAccount(accountId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: enabled && !!accountId,
  });
}
