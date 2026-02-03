import { redirect, notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { getAccount } from "@/lib/api/accounts";
import { getValidTabOrDefault } from "@/lib/tabs/account-tabs";
import { AccountTabContent } from "@/features/accounts/components/AccountTabContent";

interface AccountDetailRouteProps {
  params: Promise<{ id: string; accountId: string }>;
  searchParams: Promise<{ tab?: string }>;
}

export default async function AccountDetailRoute({
  params,
  searchParams,
}: AccountDetailRouteProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const { accountId } = await params;
  const { tab } = await searchParams;

  // Fetch account to determine type
  const account = await getAccount(accountId);

  if (!account) {
    notFound();
  }

  // Get valid tab based on account type
  const activeTab = getValidTabOrDefault(account.account_type, tab || null);

  return (
    <AccountTabContent
      accountId={accountId}
      accountType={account.account_type}
      activeTab={activeTab}
    />
  );
}
