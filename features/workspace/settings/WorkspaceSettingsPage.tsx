import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { Button } from '@/components/ui/button';

interface WorkspaceSettingsPageProps {
  workspaceId: string;
}

export async function WorkspaceSettingsPage({
  workspaceId,
}: WorkspaceSettingsPageProps) {
  const workspace = await resolveWorkspaceOrRedirect(workspaceId);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title">Workspace Settings</h1>
        <p className="page-subtitle">Manage settings for {workspace.name}</p>
      </div>

      {/* Settings Form */}
      <div className="settings-card">
        <div className="settings-card-header">
          <h2 className="settings-card-header-title">General</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Basic workspace configuration
          </p>
        </div>

        <div className="settings-card-body">
          {/* Workspace Name */}
          <div className="form-group">
            <label htmlFor="workspaceName" className="form-label">
              Workspace Name
            </label>
            <input
              type="text"
              id="workspaceName"
              defaultValue={workspace.name}
              className="form-input"
            />
          </div>

          {/* Workspace Slug */}
          <div className="form-group">
            <label htmlFor="workspaceSlug" className="form-label">
              Workspace ID
            </label>
            <input
              type="text"
              id="workspaceSlug"
              defaultValue={workspace.slug}
              disabled
              className="form-input"
            />
            <p className="form-helper">The workspace ID cannot be changed</p>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button type="button">Save Changes</Button>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="danger-card">
        <div className="danger-card-header">
          <h2 className="danger-card-title">Danger Zone</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Irreversible actions for this workspace
          </p>
        </div>

        <div className="danger-card-body">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-foreground">
                Delete Workspace
              </h3>
              <p className="text-sm text-muted-foreground">
                Permanently delete this workspace and all its accounts
              </p>
            </div>
            <Button type="button" variant="destructive">
              Delete
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
