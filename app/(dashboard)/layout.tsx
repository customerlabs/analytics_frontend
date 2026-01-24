import { redirect } from 'next/navigation';
import { auth, logoutAction } from '@/lib/auth';
import { getUserWorkspaceList, resolveWorkspace } from '@/lib/workspace/resolver';
import { AppShell } from '@/components/layout/AppShell';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // Get session using NextAuth
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user) {
    redirect('/login');
  }

  const [workspaces, currentWorkspace] = await Promise.all([
    getUserWorkspaceList(),
    resolveWorkspace(),
  ]);

  // Map NextAuth session user to expected format
  const user = {
    id: session.user.id,
    email: session.user.email || '',
    name: session.user.name || '',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppShell
        user={user}
        currentWorkspace={currentWorkspace}
        workspaces={workspaces}
        onLogout={logoutAction}
      >
        {children}
      </AppShell>
    </div>
  );
}
