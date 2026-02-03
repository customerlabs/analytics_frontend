import Link from "next/link";
import { ArrowLeft, Settings, CheckCircle } from "lucide-react";
import { redirect, notFound } from "next/navigation";
import { resolveWorkspaceOrRedirect } from "@/lib/workspace/resolver";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { getAccount } from "@/lib/api/accounts";
import { Button } from "@/components/ui/button";
import { AccountTabs } from "@/components/layout/AccountTabs";

interface AccountLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string; accountId: string }>;
}

export default async function AccountLayout({
  children,
  params,
}: AccountLayoutProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { id, accountId } = await params;
  const workspace = await resolveWorkspaceOrRedirect(id);

  // Fetch account data
  const account = await getAccount(accountId);

  if (!account) {
    notFound();
  }

  // Extract display values from account
  const accountName = account.unique_name || account.account_id;
  const timezone = (account.config_data?.timezone as string) || null;
  const currency = (account.config_data?.currency as string) || null;
  const isActive = account.status === "active";

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        {/* Left side: Back link + Account info */}
        <div className="flex items-center gap-4">
          <Link
            href={routes.ws.accounts.list(workspace.slug)}
            className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Back to Accounts"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold text-foreground">
              {accountName}
            </h1>

            {/* Badges */}
            <div className="flex items-center gap-2">
              {currency && (
                <span className="px-2 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded">
                  {currency}
                </span>
              )}

              {timezone && (
                <span className="px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {timezone}
                </span>
              )}

              {isActive && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-green-700 dark:text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  Synced
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right side: Configure button */}
        <Button variant="outline" size="sm" asChild>
          <Link href={routes.ws.accounts.settings(workspace.slug, accountId)}>
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Link>
        </Button>
      </div>

      {/* Tabs */}
      <AccountTabs
        accountType={account.account_type}
        className="px-4 sm:px-6"
      />

      {/* Tab Content */}
      <div className="px-4 sm:px-6 py-6">{children}</div>
    </div>
  );
}
