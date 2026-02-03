import { getSession } from '@/lib/auth';
import {
  getUserWorkspaceList,
  resolveWorkspaceOrRedirect,
} from '@/lib/workspace/resolver';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { WorkspaceTabsWrapper } from '@/components/layout/WorkspaceTabsWrapper';
import { WorkspaceMainWrapper } from '@/components/layout/WorkspaceMainWrapper';
import { WorkspaceProvider } from '@/lib/workspace/context';

interface WorkspaceLayoutProps {
  children: React.ReactNode;
  modal: React.ReactNode;
  params: Promise<{ id: string }>;
}

export default async function WorkspaceLayout({
  children,
  modal,
  params,
}: WorkspaceLayoutProps) {
  // Session is guaranteed by proxy.ts - no redirect needed here
  const session = await getSession();
  const { id } = await params;

  // Resolve workspace - will call notFound() if no permission
  const workspace = await resolveWorkspaceOrRedirect(id);
  const workspaces = await getUserWorkspaceList();

  return (
    <WorkspaceProvider workspace={workspace}>
      <div className="min-h-screen bg-background">
        <AuthHeader
          user={session!.user}
          currentWorkspace={workspace}
          workspaces={workspaces}
        />

        <div className="pt-14">
          <WorkspaceTabsWrapper
            workspaceId={workspace.slug}
            className="sticky top-14 z-40"
          />

          <WorkspaceMainWrapper>
            {children}
          </WorkspaceMainWrapper>
        </div>

        {modal}
      </div>
    </WorkspaceProvider>
  );
}
