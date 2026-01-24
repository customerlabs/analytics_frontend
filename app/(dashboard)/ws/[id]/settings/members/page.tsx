import { WorkspaceMembersPage } from '@/features/workspace/settings/WorkspaceMembersPage';

interface WorkspaceMembersRouteProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceMembersRoute({
  params,
}: WorkspaceMembersRouteProps) {
  const { id } = await params;
  return <WorkspaceMembersPage workspaceId={id} />;
}
