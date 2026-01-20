import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { getWorkspaceFromAccount } from '@/lib/workspace/resolver';
import { getAccountRole } from '@/lib/keycloak/permissions/checker';
import { getSession } from '@/lib/auth/session';
import { routes } from '@/lib/routes';
import { redirect } from 'next/navigation';
import { cn } from '@/lib/utils';

interface AccountDetailPageProps {
  params: Promise<{ accountId: string }>;
}

export default async function AccountDetailPage({
  params,
}: AccountDetailPageProps) {
  const { accountId } = await params;
  const session = await getSession();

  if (!session.user) {
    redirect('/login');
  }

  // Get workspace from account (account is globally unique)
  const workspace = await getWorkspaceFromAccount(accountId);

  if (!workspace) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-semibold text-gray-900">
          Account Not Found
        </h1>
        <p className="mt-2 text-gray-500">
          You don&apos;t have access to this account.
        </p>
        <Link
          href="/workspaces"
          className="mt-4 inline-block text-blue-600 hover:text-blue-800"
        >
          Go to Workspaces
        </Link>
      </div>
    );
  }

  // Get user's role for this account
  const role = await getAccountRole(session.user.id, workspace.id, accountId);
  const isAdmin = role === 'account-admin';

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href={routes.accounts.list(workspace.id)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{accountId}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Workspace: {workspace.name}
          </p>
        </div>

        {isAdmin && (
          <Link
            href={routes.accounts.settings(accountId)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-white border border-gray-300 text-gray-700 text-sm font-medium',
              'hover:bg-gray-50 transition-colors'
            )}
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
        )}
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overview Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Overview</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Account ID</dt>
              <dd className="mt-1 text-sm text-gray-900">{accountId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Workspace</dt>
              <dd className="mt-1 text-sm text-gray-900">{workspace.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Your Role</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                    role === 'account-admin'
                      ? 'bg-blue-100 text-blue-800'
                      : role === 'account-editor'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                  )}
                >
                  {role?.replace('account-', '') || 'Member'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link
              href={routes.accounts.settings(accountId)}
              className="block w-full px-4 py-3 text-left rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              <p className="text-sm font-medium text-gray-900">
                Account Settings
              </p>
              <p className="text-sm text-gray-500">
                Configure account preferences
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
