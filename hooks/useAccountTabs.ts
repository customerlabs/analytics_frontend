"use client";

import { useSearchParams, usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import type { AccountType } from "@/lib/api/accounts";
import {
  getAccountTabConfig,
  getValidTabOrDefault,
  type AccountTab,
} from "@/lib/tabs/account-tabs";

interface UseAccountTabsOptions {
  accountType: AccountType;
}

interface UseAccountTabsReturn {
  activeTab: string;
  tabs: AccountTab[];
  defaultTab: string;
  setActiveTab: (tabId: string) => void;
  isActive: (tabId: string) => boolean;
}

export function useAccountTabs({
  accountType,
}: UseAccountTabsOptions): UseAccountTabsReturn {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const config = useMemo(() => getAccountTabConfig(accountType), [accountType]);

  const activeTab = useMemo(() => {
    const tabParam = searchParams.get("tab");
    return getValidTabOrDefault(accountType, tabParam);
  }, [searchParams, accountType]);

  const setActiveTab = useCallback(
    (tabId: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // If setting to default tab, remove the param for cleaner URLs
      if (tabId === config.defaultTab) {
        params.delete("tab");
      } else {
        params.set("tab", tabId);
      }

      const query = params.toString();
      router.push(query ? `${pathname}?${query}` : pathname);
    },
    [searchParams, pathname, router, config.defaultTab]
  );

  const isActive = useCallback(
    (tabId: string) => activeTab === tabId,
    [activeTab]
  );

  return {
    activeTab,
    tabs: config.tabs,
    defaultTab: config.defaultTab,
    setActiveTab,
    isActive,
  };
}
