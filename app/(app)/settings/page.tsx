import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { cn } from '@/lib/utils';

interface SettingsPageProps {
  searchParams: Promise<{ ws?: string }>;
}

export default async function SettingsPage({
  searchParams,
}: SettingsPageProps) {
  const params = await searchParams;
  const workspace = await resolveWorkspaceOrRedirect(params.ws);

  const isAdmin = workspace.role === 'workspace-admin';

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Workspace Settings
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage settings for {workspace.name}
        </p>
      </div>

      {/* Settings Form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">General</h2>
          <p className="mt-1 text-sm text-gray-500">
            Basic workspace configuration
          </p>
        </div>

        <div className="p-6 space-y-6">
          {/* Workspace Name */}
          <div>
            <label
              htmlFor="workspaceName"
              className="block text-sm font-medium text-gray-700"
            >
              Workspace Name
            </label>
            <input
              type="text"
              id="workspaceName"
              defaultValue={workspace.name}
              disabled={!isAdmin}
              className={cn(
                'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2',
                'text-sm text-gray-900',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                'disabled:bg-gray-50 disabled:text-gray-500'
              )}
            />
          </div>

          {/* Workspace Slug */}
          <div>
            <label
              htmlFor="workspaceSlug"
              className="block text-sm font-medium text-gray-700"
            >
              Workspace ID
            </label>
            <input
              type="text"
              id="workspaceSlug"
              defaultValue={workspace.slug}
              disabled
              className={cn(
                'mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2',
                'text-sm text-gray-500 bg-gray-50'
              )}
            />
            <p className="mt-1 text-xs text-gray-500">
              The workspace ID cannot be changed
            </p>
          </div>

          {/* Save Button */}
          {isAdmin && (
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
          )}
        </div>
      </div>

      {/* Danger Zone */}
      {isAdmin && (
        <div className="bg-white rounded-lg border border-red-200">
          <div className="p-6 border-b border-red-200">
            <h2 className="text-lg font-medium text-red-600">Danger Zone</h2>
            <p className="mt-1 text-sm text-gray-500">
              Irreversible actions for this workspace
            </p>
          </div>

          <div className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-gray-900">
                  Delete Workspace
                </h3>
                <p className="text-sm text-gray-500">
                  Permanently delete this workspace and all its accounts
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
