import { redirect } from 'next/navigation';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';

export const dynamic = 'force-dynamic';

interface MembersPageProps {
  searchParams: Promise<{ ws?: string }>;
}

export default async function MembersPage({ searchParams }: MembersPageProps) {
  const params = await searchParams;
  const workspace = await resolveWorkspaceOrRedirect(params.ws, '/settings/members');
  redirect(routes.ws.settings.members(workspace.id));
}
