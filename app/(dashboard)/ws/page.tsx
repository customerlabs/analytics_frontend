import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { resolveWorkspace, getUserWorkspaceList } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';
import { NoWorkspacesView } from './NoWorkspacesView';
import { AuthHeader } from '@/components/layout/AuthHeader';

export const dynamic = 'force-dynamic';

export default async function WorkspaceIndex() {
  const session = await auth();
  const workspace = await resolveWorkspace();

  // If user has a workspace, redirect to it
  if (workspace) {
    redirect(routes.ws.dashboard(workspace.slug));
  }

  // No workspaces - show create workspace UI with header
  const workspaces = await getUserWorkspaceList();

  if (workspaces.length === 0) {
    // Map session user to expected User type (same pattern as dashboard layout)
    const user = {
      id: session!.user!.id,
      email: session!.user!.email || '',
      name: session!.user!.name || '',
    };

    return (
      <>
        <AuthHeader
          user={user}
          currentWorkspace={undefined}
          workspaces={[]}
        />
        <div className="pt-14">
          <NoWorkspacesView />
        </div>
      </>
    );
  }

  // Fallback: redirect to first workspace
  redirect(routes.ws.dashboard(workspaces[0].slug));
}
