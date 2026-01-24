import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserWorkspaceList } from '@/lib/workspace/resolver';

export const dynamic = 'force-dynamic';

export default async function PostLoginPage() {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const workspaces = await getUserWorkspaceList();

  if (workspaces.length === 0) {
    // No workspaces - redirect to /ws which shows create workspace UI
    redirect('/ws');
  }

  // Has workspaces - redirect to the first workspace dashboard
  redirect(`/ws/${workspaces[0].slug}`);
}
