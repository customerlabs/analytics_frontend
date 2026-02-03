"use client";

import type { AccountType } from "@/lib/api/accounts";

// Facebook tabs
import {
  SummaryTab,
  GoalsTab,
  PortfolioTab,
  ProductsTab,
  CreativesTab,
  AuditTab,
  SyndicateTab,
} from "@/features/facebook/components/tabs";

// CustomerLabs tabs
import {
  OverviewTab,
  BackfillTab,
  SettingsTab,
  LogsTab,
} from "@/features/customerlabs/components/tabs";

interface AccountTabContentProps {
  accountId: string;
  accountType: AccountType;
  activeTab: string;
}

export function AccountTabContent({
  accountId,
  accountType,
  activeTab,
}: AccountTabContentProps) {
  // Facebook (ads) tabs
  if (accountType === "ads") {
    switch (activeTab) {
      case "summary":
        return <SummaryTab accountId={accountId} />;
      case "goals":
        return <GoalsTab accountId={accountId} />;
      case "portfolio":
        return <PortfolioTab accountId={accountId} />;
      case "products":
        return <ProductsTab accountId={accountId} />;
      case "creatives":
        return <CreativesTab accountId={accountId} />;
      case "audit":
        return <AuditTab accountId={accountId} />;
      case "syndicate":
        return <SyndicateTab accountId={accountId} />;
      default:
        return <SummaryTab accountId={accountId} />;
    }
  }

  // CustomerLabs tabs
  if (accountType === "customerlabs") {
    switch (activeTab) {
      case "overview":
        return <OverviewTab accountId={accountId} />;
      case "backfill":
        return <BackfillTab accountId={accountId} />;
      case "settings":
        return <SettingsTab accountId={accountId} />;
      case "logs":
        return <LogsTab accountId={accountId} />;
      default:
        return <OverviewTab accountId={accountId} />;
    }
  }

  // Fallback
  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <p className="text-sm text-muted-foreground">
        Unknown account type: {accountType}
      </p>
    </div>
  );
}
