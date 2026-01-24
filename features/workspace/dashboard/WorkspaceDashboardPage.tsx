import Link from 'next/link';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';

interface WorkspaceDashboardPageProps {
  workspaceId: string;
}

export async function WorkspaceDashboardPage({
  workspaceId,
}: WorkspaceDashboardPageProps) {
  const workspace = await resolveWorkspaceOrRedirect(workspaceId);

  // TODO: Fetch accounts from backend API when available
  const accounts: { accountId: string; role: string }[] = [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome to {workspace.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Accounts */}
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Total Accounts
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900">
            {accounts.length}
          </dd>
        </div>

        {/* Workspace Role */}
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Your Role
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-gray-900 capitalize">
            {workspace.role.replace('workspace-', '')}
          </dd>
        </div>

        {/* Quick Actions */}
        <div className="bg-white overflow-hidden rounded-lg border border-gray-200 px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-gray-500 truncate">
            Workspace
          </dt>
          <dd className="mt-1 text-lg font-semibold text-gray-900 truncate">
            {workspace.name}
          </dd>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Accounts</h2>
          <p className="mt-1 text-sm text-gray-500">
            Accounts you have access to in this workspace
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-gray-500">No accounts yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <li key={account.accountId}>
                <Link
                  href={routes.ws.accounts.detail(
                    workspace.slug,
                    account.accountId
                  )}
                  className="block px-4 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {account.accountId}
                      </p>
                      <p className="text-sm text-gray-500 capitalize">
                        {account.role.replace('account-', '')}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
