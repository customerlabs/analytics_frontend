import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Plus, ArrowRight } from 'lucide-react';
import { getSession } from '@/lib/auth/session';
import { getUserWorkspaceList, setWorkspaceCookie } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

interface WorkspacesPageProps {
  searchParams: Promise<{ redirect?: string; error?: string }>;
}

export default async function WorkspacesPage({
  searchParams,
}: WorkspacesPageProps) {
  const params = await searchParams;
  const session = await getSession();

  if (!session.user) {
    redirect('/login');
  }

  const workspaces = await getUserWorkspaceList();

  const buildWorkspaceRedirect = (
    workspaceId: string,
    redirectPath?: string
  ) => {
    if (!redirectPath || redirectPath === '/') {
      return routes.ws.dashboard(workspaceId);
    }

    if (/^\/ws\/[^/]+/.test(redirectPath)) {
      return redirectPath.replace(/^\/ws\/[^/]+/, `/ws/${workspaceId}`);
    }

    if (redirectPath === '/ws' || redirectPath.startsWith('/ws/')) {
      const suffix =
        redirectPath === '/ws'
          ? ''
          : redirectPath.slice('/ws'.length);
      return `/ws/${workspaceId}${suffix}`;
    }

    return `/ws/${workspaceId}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`}`;
  };

  // If user has workspaces and came from redirect, auto-select first one
  if (workspaces.length === 1 && params.redirect) {
    await setWorkspaceCookie(workspaces[0].id);
    const redirectUrl = buildWorkspaceRedirect(
      workspaces[0].id,
      params.redirect
    );
    redirect(redirectUrl);
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Select a Workspace
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Choose a workspace to continue
          </p>
        </div>

        {/* Error Message */}
        {params.error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              {params.error === 'access_denied'
                ? "You don't have access to that workspace"
                : params.error === 'not_found'
                  ? 'Workspace not found'
                  : 'An error occurred'}
            </p>
          </div>
        )}

        {/* Workspaces List */}
        {workspaces.length === 0 ? (
          <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Plus className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              No workspaces yet
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Create your first workspace to get started
            </p>
            <Link
              href="/workspaces/new"
              className={cn(
                'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-blue-600 text-white text-sm font-medium',
                'hover:bg-blue-700 transition-colors'
              )}
            >
              <Plus className="w-4 h-4" />
              Create Workspace
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {workspaces.map((workspace) => (
                <li key={workspace.id}>
                  <Link
                    href={buildWorkspaceRedirect(workspace.id, params.redirect)}
                    className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {workspace.name}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {workspace.role.replace('workspace-', '')}
                      </p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-400" />
                  </Link>
                </li>
              ))}
            </ul>

            {/* Create New */}
            <div className="border-t border-gray-200 p-4">
              <Link
                href="/workspaces/new"
                className={cn(
                  'flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg',
                  'border border-gray-300 text-gray-700 text-sm font-medium',
                  'hover:bg-gray-50 transition-colors'
                )}
              >
                <Plus className="w-4 h-4" />
                Create New Workspace
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
