import { AccountSettingsPage } from '@/features/accounts/pages';

interface AccountSettingsRouteProps {
  params: Promise<{ id: string; accountId: string }>;
}

export default async function AccountSettingsRoute({
  params,
}: AccountSettingsRouteProps) {
  const { id, accountId } = await params;
  return <AccountSettingsPage workspaceId={id} accountId={accountId} />;
}
