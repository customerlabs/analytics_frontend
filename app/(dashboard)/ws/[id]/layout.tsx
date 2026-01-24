import { redirect } from 'next/navigation';
import { getSession, logoutAction } from '@/lib/auth';
import {
  getUserWorkspaceList,
  resolveWorkspaceOrRedirect,
} from '@/lib/workspace/resolver';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { TabNavigation, defaultTabs } from '@/components/layout/TabNavigation';
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
  const session = await getSession();

  if (!session?.user) {
    redirect('/login');
  }

  const { id } = await params;

  const [workspaces, workspace] = await Promise.all([
    getUserWorkspaceList(),
    resolveWorkspaceOrRedirect(id),
  ]);

  if (workspaces.length === 0) {
    redirect('/ws');
  }

  return (
    <WorkspaceProvider workspace={workspace}>
      <div className="min-h-screen bg-slate-50">
        <AuthHeader
          user={session.user}
          currentWorkspace={workspace}
          workspaces={workspaces}
          onLogout={logoutAction}
        />

        <div className="pt-14">
          <TabNavigation
            tabs={defaultTabs}
            workspaceId={workspace.slug}
            className="sticky top-14 z-40"
          />

          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
        </div>

        {modal}
      </div>
    </WorkspaceProvider>
  );
}
