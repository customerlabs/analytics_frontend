"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { AddAccountPanel } from "./AddAccountPanel";
import { OnboardingSheet } from "@/features/customerlabs/components/OnboardingSheet";
import { useOnboardingSheet } from "@/features/customerlabs/hooks/useOnboardingSheet";
import { FacebookConfigDrawer } from "@/features/facebook";
import { useFacebookConfigStore } from "@/features/facebook/hooks/useFacebookConfig";
import { useWorkspaceAccounts } from "../hooks";
import { deleteAccount, type AccountStatus } from "@/lib/api/accounts";
import type { AccountResponse } from "@/features/facebook";

interface AccountsPageClientProps {
  workspaceId: string;
  workspaceName: string;
}

export function AccountsPageClient({
  workspaceId,
  workspaceName,
}: AccountsPageClientProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [showAddPanel, setShowAddPanel] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const { data: accounts = [], isLoading: accountsLoading } =
    useWorkspaceAccounts({ workspaceId });

  const openOnboarding = useOnboardingSheet((state) => state.open);
  const openFacebookConfig = useFacebookConfigStore((state) => state.open);

  const handleOpenAccount = (accountId: string, status: AccountStatus, accountType: string) => {
    if (status === "pending" || status === "draft") {
      // Open appropriate drawer based on account type
      if (accountType === "ads") {
        openFacebookConfig(accountId);
      } else {
        openOnboarding(accountId);
      }
    } else {
      // Navigate to account page for active accounts
      router.push(`/ws/${workspaceId}/accounts/${accountId}`);
    }
  };

  const handleAccountCreated = useCallback(
    (account: AccountResponse) => {
      // Invalidate accounts list query to refresh UI immediately
      queryClient.invalidateQueries({ queryKey: ["workspace-accounts", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["account-templates", workspaceId] });
      // Close the add panel
      setShowAddPanel(false);

      // Open appropriate drawer based on account type for accounts that need setup
      if (account.status === "pending" || account.status === "draft") {
        if (account.account_type === "ads") {
          openFacebookConfig(account.id);
        } else if (account.account_type === "customerlabs") {
          openOnboarding(account.id);
        }
      }
    },
    [queryClient, workspaceId, openOnboarding, openFacebookConfig]
  );

  const handleRemoveAccount = async (accountId: string, accountName: string) => {
    if (!confirm(`Remove "${accountName}" from this workspace?\n\nThis action cannot be undone.`)) {
      return;
    }

    setRemovingId(accountId);
    try {
      await deleteAccount(accountId);
      // Invalidate queries to refresh the list
      queryClient.invalidateQueries({ queryKey: ["workspace-accounts", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["account-templates", workspaceId] });
    } catch (error) {
      console.error("Failed to remove account:", error);
      alert("Failed to remove account. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  const getStatusBadge = (status: AccountStatus) => {
    switch (status) {
      case "active":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full">
            <CheckCircle className="size-3" />
            Ready
          </span>
        );
      case "pending":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-full">
            <AlertCircle className="size-3" />
            Pending
          </span>
        );
      case "draft":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-full">
            <AlertCircle className="size-3" />
            Needs Setup
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Accounts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage accounts in {workspaceName}
          </p>
        </div>

        <button
          onClick={() => setShowAddPanel(!showAddPanel)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg",
            "text-sm font-medium transition-colors",
            "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
            showAddPanel
              ? "bg-secondary text-secondary-foreground hover:bg-secondary/80 focus:ring-secondary"
              : "bg-primary text-primary-foreground hover:bg-primary/90 focus:ring-primary"
          )}
        >
          {showAddPanel ? (
            <>
              <X className="w-4 h-4" />
              Cancel
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" />
              Add Account
            </>
          )}
        </button>
      </div>

      {/* Add Account Panel */}
      <AddAccountPanel
        workspaceId={workspaceId}
        isOpen={showAddPanel}
        onClose={() => setShowAddPanel(false)}
        onAccountCreated={handleAccountCreated}
      />

      {/* Connected Accounts Table */}
      <div className="rounded-lg border border-border bg-card overflow-hidden">
        {accountsLoading ? (
          // Loading skeleton
          <div className="p-4 space-y-3">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 animate-pulse"
              >
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : accounts.length === 0 ? (
          // Empty state
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              No accounts connected
            </p>
          </div>
        ) : (
          // Accounts Table
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[20%]">
                    Account
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[12%]">
                    Platform
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[18%]">
                    Account ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[12%]">
                    Setup Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[12%]">
                    Timezone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[10%]">
                    Currency
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider w-[16%]">
                    Actions
                  </th>
                </tr>
              </thead>
            <tbody className="divide-y divide-border">
              {accounts.map((account) => {
                const isRemoving = removingId === account.id;
                // Get app_id from auth_data for display
                const appId = (account.auth_data?.app_id as string) || account.account_id;
                // Get timezone and currency from config_data
                const timezone = (account.config_data?.timezone as string) || "-";
                const currency = (account.config_data?.currency as string) || "-";

                const accountUrl = `/ws/${workspaceId}/accounts/${account.id}`;

                return (
                  <tr
                    key={account.id}
                    className="hover:bg-muted/50 transition-colors group relative"
                  >
                    <td className="px-6 py-4">
                      <Link
                        href={accountUrl}
                        className="font-medium text-foreground after:absolute after:inset-0 after:content-['']"
                      >
                        {account.unique_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-muted text-muted-foreground rounded">
                        {account.template?.name || account.account_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-muted-foreground bg-muted px-2 py-1 rounded">
                        {appId}
                      </code>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(account.status)}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {timezone}
                    </td>
                    <td className="px-6 py-4 text-sm text-muted-foreground">
                      {currency}
                    </td>
                    <td className="px-6 py-4 text-right relative z-10">
                      <div className="flex items-center justify-end gap-2">
                        {/* Open / Complete Setup Button */}
                        {account.status === "active" ? (
                          <button
                            onClick={() => handleOpenAccount(account.id, account.status, account.account_type)}
                            className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors"
                          >
                            Open
                          </button>
                        ) : (
                          <button
                            onClick={() => handleOpenAccount(account.id, account.status, account.account_type)}
                            className="px-3 py-1.5 text-sm font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-lg hover:bg-amber-100 transition-colors dark:text-amber-400 dark:bg-amber-900/20 dark:border-amber-800"
                          >
                            Complete Setup
                          </button>
                        )}

                        {/* Remove Button */}
                        <button
                          onClick={() => handleRemoveAccount(account.id, account.unique_name)}
                          disabled={isRemoving}
                          className="inline-flex items-center gap-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-medium text-sm disabled:opacity-50 transition-colors"
                        >
                          {isRemoving ? (
                            <>
                              <Loader2 className="size-4 animate-spin" />
                              Removing...
                            </>
                          ) : (
                            <>
                              <Trash2 className="size-4" />
                              Remove
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CustomerLabs Onboarding Sheet */}
      <OnboardingSheet />

      {/* Facebook Config Drawer */}
      <FacebookConfigDrawer />
    </div>
  );
}
