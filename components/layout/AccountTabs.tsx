"use client";

import { cn } from "@/lib/utils";
import { useAccountTabs } from "@/hooks/useAccountTabs";
import type { AccountType } from "@/lib/api/accounts";

interface AccountTabsProps {
  accountType: AccountType;
  className?: string;
}

export function AccountTabs({ accountType, className }: AccountTabsProps) {
  const { tabs, activeTab, setActiveTab } = useAccountTabs({ accountType });

  return (
    <nav
      className={cn(
        "flex items-center gap-1 border-b border-border",
        className
      )}
    >
      {tabs.map((tab, index) => {
        const isActive = activeTab === tab.id;
        const showSection = tab.section && index > 0;

        return (
          <div key={tab.id} className="flex items-center">
            {/* Section label */}
            {showSection && (
              <span className="px-3 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {tab.section}
              </span>
            )}

            {/* Tab button */}
            <button
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive
                  ? "text-foreground border-primary"
                  : "text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          </div>
        );
      })}
    </nav>
  );
}
