import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { auth, logoutAction } from '@/lib/auth';
import { getUserWorkspaceList } from '@/lib/workspace/resolver';
import { AuthHeader } from '@/components/layout/AuthHeader';

export default async function DashboardNotFound() {
  const session = await auth();
  const workspaces = await getUserWorkspaceList(session);

  return (
    <div className="min-h-screen bg-background">
      {session?.user && (
        <AuthHeader
          user={session.user}
          workspaces={workspaces}
          onLogout={logoutAction}
        />
      )}

      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 pt-14">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground">
            Page Not Found
          </h1>

          <p className="mt-3 text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or you
            don&apos;t have permission to access it.
          </p>

          <div className="mt-8 flex gap-3">
            <Button asChild variant="outline">
              <Link href="/ws">Go to My Workspaces</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
