import { redirect } from 'next/navigation';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';

export const dynamic = 'force-dynamic';

interface SettingsPageProps {
  searchParams: Promise<{ ws?: string }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;
  const workspace = await resolveWorkspaceOrRedirect(params.ws, '/settings');
  redirect(routes.ws.settings.general(workspace.id));
}
