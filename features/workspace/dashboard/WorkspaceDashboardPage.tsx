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
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Welcome to {workspace.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* Total Accounts */}
        <div className="bg-card overflow-hidden rounded-lg border border-border px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-muted-foreground truncate">
            Total Accounts
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-foreground">
            {accounts.length}
          </dd>
        </div>

        {/* Workspace Role */}
        <div className="bg-card overflow-hidden rounded-lg border border-border px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-muted-foreground truncate">
            Your Role
          </dt>
          <dd className="mt-1 text-3xl font-semibold text-foreground capitalize">
            {workspace.role.replace('workspace-', '')}
          </dd>
        </div>

        {/* Quick Actions */}
        <div className="bg-card overflow-hidden rounded-lg border border-border px-4 py-5 sm:p-6">
          <dt className="text-sm font-medium text-muted-foreground truncate">
            Workspace
          </dt>
          <dd className="mt-1 text-lg font-semibold text-foreground truncate">
            {workspace.name}
          </dd>
        </div>
      </div>

      {/* Accounts List */}
      <div className="bg-card rounded-lg border border-border">
        <div className="px-4 py-5 sm:px-6 border-b border-border">
          <h2 className="text-lg font-medium text-foreground">Your Accounts</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Accounts you have access to in this workspace
          </p>
        </div>

        {accounts.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">No accounts yet</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {accounts.map((account) => (
              <li key={account.accountId}>
                <Link
                  href={routes.ws.accounts.detail(
                    workspace.slug,
                    account.accountId
                  )}
                  className="block px-4 py-4 hover:bg-accent transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {account.accountId}
                      </p>
                      <p className="text-sm text-muted-foreground capitalize">
                        {account.role.replace('account-', '')}
                      </p>
                    </div>
                    <svg
                      className="h-5 w-5 text-muted-foreground"
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
