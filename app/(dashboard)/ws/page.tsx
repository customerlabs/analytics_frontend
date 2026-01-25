import { redirect } from 'next/navigation';
import { resolveWorkspace, getUserWorkspaceList } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';
import { NoWorkspacesView } from './NoWorkspacesView';

export const dynamic = 'force-dynamic';

export default async function WorkspaceIndex() {
  const workspace = await resolveWorkspace();

  // If user has a workspace, redirect to it
  if (workspace) {
    redirect(routes.ws.dashboard(workspace.slug));
  }

  // No workspaces - show create workspace UI
  const workspaces = await getUserWorkspaceList();

  if (workspaces.length === 0) {
    return <NoWorkspacesView />;
  }

  // Fallback: redirect to first workspace
  redirect(routes.ws.dashboard(workspaces[0].slug));
}
