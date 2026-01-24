import { Plus } from 'lucide-react';
import { redirect } from 'next/navigation';
import { resolveWorkspaceOrRedirect } from '@/lib/workspace/resolver';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';

interface WorkspaceMembersPageProps {
  workspaceId: string;
}

export async function WorkspaceMembersPage({
  workspaceId,
}: WorkspaceMembersPageProps) {
  const workspace = await resolveWorkspaceOrRedirect(
    workspaceId,
    routes.ws.settings.members(workspaceId)
  );

  if (workspace.role !== 'workspace-admin') {
    redirect(routes.ws.settings.general(workspace.id));
  }

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
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage workspace members and their roles
          </p>
        </div>

        <button
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg',
            'bg-blue-600 text-white text-sm font-medium',
            'hover:bg-blue-700 transition-colors'
          )}
        >
          <Plus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Member
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Role
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {member.name}
                    </div>
                    <div className="text-sm text-gray-500">{member.email}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize',
                      member.role === 'workspace-admin'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-gray-100 text-gray-800'
                    )}
                  >
                    {member.role.replace('workspace-', '')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button className="text-gray-600 hover:text-gray-900">
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
