import { redirect } from 'next/navigation';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';

export const dynamic = 'force-dynamic';

interface WorkspaceIndexProps {
  searchParams: Promise<{ ws?: string }>;
}

export default async function WorkspaceIndex({
  searchParams,
}: WorkspaceIndexProps) {
  const params = await searchParams;
  const workspace = await resolveWorkspaceOrRedirect(params.ws, '/ws');
  redirect(routes.ws.dashboard(workspace.id));
}
