import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { resolveWorkspaceOrRedirect } from "@/lib/workspace/resolver";
import { auth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { Button } from "@/components/ui/button";

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
    redirect("/login");
  }

  const workspace = await resolveWorkspaceOrRedirect(workspaceId);

  // TODO: Fetch role from backend API when available
  const role = "account-admin";

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <Link
        href={routes.ws.accounts.detail(workspace.slug, accountId)}
        className="back-link"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Account
      </Link>

      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Account Settings</h1>
        <p className="page-subtitle">{accountId}</p>
      </div>

      {/* Settings Form */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h2 className="settings-card-header-title">General</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Basic account configuration
          </p>
        </div>

        <div className="settings-card-body">
          {/* Account Name */}
          <div className="form-group">
            <label htmlFor="accountName" className="form-label">
              Account Name
            </label>
            <input
              type="text"
              id="accountName"
              defaultValue={accountId}
              className="form-input"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="button">Save Changes</Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      {role === "account-admin" && (
        <div className="danger-card">
          <div className="danger-card-header">
            <h2 className="danger-card-title">Danger Zone</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Irreversible actions for this account
            </p>
          </div>

          <div className="danger-card-body">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  Delete Account
                </h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this account and all its data
                </p>
              </div>
              <Button type="button" variant="destructive">
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
