import Link from 'next/link';
import { ArrowLeft, Settings } from 'lucide-react';
import { redirect } from 'next/navigation';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { auth } from '@/lib/auth';
import { routes } from '@/lib/routes';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AccountDetailPageProps {
  workspaceId: string;
  accountId: string;
}

export async function AccountDetailPage({
  workspaceId,
  accountId,
}: AccountDetailPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const workspace = await resolveWorkspaceOrRedirect(workspaceId);

  // TODO: Fetch role from backend API when available
  const role = 'account-admin';

  const isAdmin = role === 'account-admin';

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link href={routes.ws.accounts.list(workspace.slug)} className="back-link">
        <ArrowLeft className="w-4 h-4" />
        Back to Accounts
      </Link>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1 className="page-title">{accountId}</h1>
          <p className="page-subtitle">Workspace: {workspace.name}</p>
        </div>

        {isAdmin && (
          <Button variant="outline" asChild>
            <Link href={routes.ws.accounts.settings(workspace.slug, accountId)}>
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
        )}
      </div>

      {/* Account Info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Overview Card */}
        <div className="settings-card p-6">
          <h2 className="settings-card-header-title mb-4">Overview</h2>
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Account ID</dt>
              <dd className="mt-1 text-sm text-foreground">{accountId}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Workspace</dt>
              <dd className="mt-1 text-sm text-foreground">{workspace.name}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Your Role</dt>
              <dd className="mt-1">
                <span
                  className={cn(
                    'badge-role',
                    role === 'account-admin'
                      ? 'badge-admin'
                      : role === 'account-editor'
                        ? 'badge-editor'
                        : 'badge-member'
                  )}
                >
                  {role.replace('account-', '')}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        {/* Quick Actions Card */}
        <div className="settings-card p-6">
          <h2 className="settings-card-header-title mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href={routes.ws.accounts.settings(workspace.slug, accountId)}
              className="action-link"
            >
              <p className="action-link-title">Account Settings</p>
              <p className="action-link-description">
                Configure account preferences
              </p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
