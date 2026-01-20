import Link from 'next/link';
import { Plus } from 'lucide-react';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { getAccountsForWorkspace } from '@/lib/keycloak/permissions/resolver';
import { getSession } from '@/lib/auth/session';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface AccountsPageProps {
  searchParams: Promise<{ ws?: string }>;
}

export default async function AccountsPage({
  searchParams,
}: AccountsPageProps) {
  const params = await searchParams;
  const workspace = await resolveWorkspaceOrRedirect(params.ws);
  const session = await getSession();

  // Get accounts for this workspace
  const accounts = session.user
    ? await getAccountsForWorkspace(session.user.id, workspace.id)
    : [];

  const isAdmin = workspace.role === 'workspace-admin';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Accounts</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage accounts in {workspace.name}
          </p>
        </div>

        {isAdmin && (
          <button
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-blue-600 text-white text-sm font-medium',
              'hover:bg-blue-700 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
            )}
          >
            <Plus className="w-4 h-4" />
            Add Account
          </button>
        )}
      </div>

      {/* Accounts Grid */}
      {accounts.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 px-4 py-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg
              className="w-6 h-6 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900">No accounts</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? 'Get started by adding your first account.'
              : 'You don\'t have access to any accounts in this workspace.'}
          </p>
          {isAdmin && (
            <button
              className={cn(
                'mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg',
                'bg-blue-600 text-white text-sm font-medium',
                'hover:bg-blue-700 transition-colors'
              )}
            >
              <Plus className="w-4 h-4" />
              Add Account
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Account
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Your Role
                </th>
                <th scope="col" className="relative px-6 py-3">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {accounts.map((account) => (
                <tr key={account.accountId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Link
                      href={routes.accounts.detail(account.accountId)}
                      className="text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                      {account.accountId}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={cn(
                        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                        account.role === 'account-admin'
                          ? 'bg-blue-100 text-blue-800'
                          : account.role === 'account-editor'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                      )}
                    >
                      {account.role.replace('account-', '')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      href={routes.accounts.settings(account.accountId)}
                      className="text-gray-600 hover:text-gray-900"
                    >
                      Settings
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
