import { AccountsPage } from '@/features/accounts/AccountsPage';

interface AccountsRouteProps {
  params: Promise<{ id: string }>;
}

export default async function AccountsRoute({ params }: AccountsRouteProps) {
  const { id } = await params;
  return <AccountsPage workspaceId={id} />;
}
