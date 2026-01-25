import { redirect } from 'next/navigation';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';

export const dynamic = 'force-dynamic';

export default async function MembersPage() {
  const workspace = await resolveWorkspaceOrRedirect();
  redirect(routes.ws.settings.members(workspace.slug));
}
