import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthHeader } from '@/components/layout/AuthHeader';
import { getSession } from '@/lib/auth';
import { getUserWorkspaceList } from '@/lib/workspace/resolver';

export default async function WorkspaceNotFound() {
  const session = await getSession();
  const workspaces = await getUserWorkspaceList();

  return (
    <div className="min-h-screen bg-background">
      {session?.user && (
        <AuthHeader
          user={session.user}
          workspaces={workspaces}
        />
      )}

      <div className="flex min-h-[80vh] flex-col items-center justify-center px-4 pt-14">
        <div className="flex flex-col items-center text-center max-w-md">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
            <ShieldAlert className="h-8 w-8 text-destructive" />
          </div>

          <h1 className="text-2xl font-semibold text-foreground">
            Access Denied
          </h1>

          <p className="mt-3 text-muted-foreground">
            You don&apos;t have permission to access this workspace. Please
            contact the workspace owner if you believe this is a mistake.
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
