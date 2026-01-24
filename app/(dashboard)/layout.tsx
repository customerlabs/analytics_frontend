import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { getUserWorkspaceList, resolveWorkspace } from '@/lib/workspace/resolver';
import { logout } from '@/lib/actions/auth';
import { AppShell } from '@/components/layout/AppShell';

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

  const [workspaces, currentWorkspace] = await Promise.all([
    getUserWorkspaceList(),
    resolveWorkspace(),
  ]);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShell
        user={session.user}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onLogout={logout}
      >
        {children}
      </AppShell>
    </div>
  );
}
