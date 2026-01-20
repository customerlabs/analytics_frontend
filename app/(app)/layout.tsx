import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { resolveWorkspace, getUserWorkspaceList } from '@/lib/workspace/resolver';
import { logout } from '@/lib/actions/auth';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { TabNavigation, defaultTabs } from '@/components/layout/TabNavigation';
import { WorkspaceProvider } from '@/lib/workspace/context';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // Get session first (required for auth check)
  const session = await getSession();

  // Redirect to login if not authenticated
  if (!session.user) {
    redirect('/login');
  }

  // Parallelize workspace operations (both benefit from cached session)
  const [workspaces, currentWorkspace] = await Promise.all([
    getUserWorkspaceList(),
    resolveWorkspace(),
  ]);

  // If no workspaces, redirect to create one
  if (workspaces.length === 0) {
    redirect('/workspaces/new');
  }

  // If no workspace resolved, redirect to workspace selector
  if (!currentWorkspace) {
    redirect('/workspaces');
  }

  return (
    <WorkspaceProvider workspace={currentWorkspace}>
      <div className="min-h-screen bg-slate-50">
        {/* Header */}
        <AuthHeader
          user={session.user}
          currentWorkspace={currentWorkspace}
          workspaces={workspaces}
          onLogout={logout}
        />

        {/* Tab Navigation */}
        <TabNavigation tabs={defaultTabs} workspaceId={currentWorkspace.id} />

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>
      </div>
    </WorkspaceProvider>
  );
}
