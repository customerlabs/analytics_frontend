import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { auth } from '@/lib/auth';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface AccountSettingsPageProps {
  workspaceId: string;
  accountId: string;
}

export async function AccountSettingsPage({
  workspaceId,
  accountId,
}: AccountSettingsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const workspace = await resolveWorkspaceOrRedirect(workspaceId);

  // TODO: Fetch role from backend API when available
  const role = 'account-admin';

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href={routes.ws.accounts.detail(workspace.slug, accountId)}
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Account
      </Link>

      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Account Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">{accountId}</p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">General</h2>
          <p className="mt-1 text-sm text-gray-500">
            Basic account configuration
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Account Name */}
          <div>
            <label
              htmlFor="accountName"
              className="block text-sm font-medium text-gray-700"
            >
              Account Name
            </label>
            <input
              type="text"
              id="accountName"
              defaultValue={accountId}
              className={cn(
                'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2',
                'text-sm text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
              )}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              className={cn(
                'px-4 py-2 rounded-lg',
                'bg-blue-600 text-white text-sm font-medium',
                'hover:bg-blue-700 transition-colors',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {role === 'account-admin' && (
        <div className="bg-white rounded-lg border border-red-200">
          <div className="p-6 border-b border-red-200">
            <h2 className="text-lg font-medium text-red-600">Danger Zone</h2>
            <p className="mt-1 text-sm text-gray-500">
              Irreversible actions for this account
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Delete Account
                </h3>
                <p className="text-sm text-gray-500">
                  Permanently delete this account and all its data
                </p>
              </div>
              <button
                type="button"
                className={cn(
                  'px-4 py-2 rounded-lg',
                  'bg-red-600 text-white text-sm font-medium',
                  'hover:bg-red-700 transition-colors'
                )}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
