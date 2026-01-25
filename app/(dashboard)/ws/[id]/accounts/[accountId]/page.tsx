import { AccountDetailPage } from '@/features/accounts/pages';

interface AccountDetailRouteProps {
  params: Promise<{ id: string; accountId: string }>;
}

export default async function AccountDetailRoute({
  params,
}: AccountDetailRouteProps) {
  const { id, accountId } = await params;
  return <AccountDetailPage workspaceId={id} accountId={accountId} />;
}
