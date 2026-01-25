import { Plus } from 'lucide-react';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WorkspaceMembersPageProps {
  workspaceId: string;
}

export async function WorkspaceMembersPage({
  workspaceId,
}: WorkspaceMembersPageProps) {
  const workspace = await resolveWorkspaceOrRedirect(workspaceId);

  const members = [
    {
      id: '1',
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'workspace-admin',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="page-header">
          <h1 className="page-title">Members</h1>
          <p className="page-subtitle">
            Manage workspace members and their roles
          </p>
        </div>

        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Invite Member
        </Button>
      </div>

      {/* Members Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th scope="col">Member</th>
              <th scope="col">Role</th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.id}>
                <td>
                  <div>
                    <div className="font-medium text-foreground">
                      {member.name}
                    </div>
                    <div className="text-muted-foreground">{member.email}</div>
                  </div>
                </td>
                <td>
                  <span
                    className={cn(
                      'badge-role',
                      member.role === 'workspace-admin'
                        ? 'badge-admin'
                        : 'badge-member'
                    )}
                  >
                    {member.role.replace('workspace-', '')}
                  </span>
                </td>
                <td className="text-right font-medium">
                  <button className="text-muted-foreground hover:text-foreground transition-colors">
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
