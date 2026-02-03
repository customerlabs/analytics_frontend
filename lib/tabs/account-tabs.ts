import type { AccountType } from "@/lib/api/accounts";

export interface AccountTab {
  id: string;
  label: string;
  section?: string; // Section label like "ADVANCED"
}

export interface AccountTabConfig {
  defaultTab: string;
  tabs: AccountTab[];
}

export const accountTabConfigs: Record<AccountType, AccountTabConfig> = {
  ads: {
    defaultTab: "summary",
    tabs: [
      { id: "summary", label: "Summary" },
      { id: "goals", label: "Goals" },
      { id: "portfolio", label: "Portfolio", section: "ADVANCED" },
      { id: "products", label: "Products" },
      { id: "creatives", label: "Creatives" },
      { id: "audit", label: "Audit" },
      { id: "syndicate", label: "Syndicate" },
    ],
  },
  customerlabs: {
    defaultTab: "overview",
    tabs: [
      { id: "overview", label: "Overview" },
      { id: "backfill", label: "Backfill Data" },
      { id: "settings", label: "Settings" },
      { id: "logs", label: "Logs" },
    ],
  },
};

export function getAccountTabConfig(accountType: AccountType): AccountTabConfig {
  return accountTabConfigs[accountType];
}

export function getDefaultTab(accountType: AccountType): string {
  return accountTabConfigs[accountType].defaultTab;
}

export function isValidTab(accountType: AccountType, tabId: string): boolean {
  const config = accountTabConfigs[accountType];
  return config.tabs.some((tab) => tab.id === tabId);
}

export function getValidTabOrDefault(accountType: AccountType, tabId: string | null): string {
  if (!tabId) return getDefaultTab(accountType);
  return isValidTab(accountType, tabId) ? tabId : getDefaultTab(accountType);
}
