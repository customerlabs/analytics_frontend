import { auth, logoutAction } from '@/lib/auth';
import { getUserWorkspaceList, resolveWorkspace } from '@/lib/workspace/resolver';
import { AppShell } from '@/components/layout/AppShell';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // Session is guaranteed by proxy.ts - no redirect needed here
  // Single auth() call - pass session to child functions to avoid redundant calls
  const session = await auth();

  const [workspaces, currentWorkspace] = await Promise.all([
    getUserWorkspaceList(session),
    resolveWorkspace(null, session),
  ]);

  // Map NextAuth session user to expected format (session guaranteed by proxy)
  const user = {
    id: session!.user!.id,
    email: session!.user!.email || '',
    name: session!.user!.name || '',
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
