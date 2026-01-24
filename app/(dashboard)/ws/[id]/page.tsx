import { WorkspaceDashboardPage } from '@/features/workspace/dashboard/WorkspaceDashboardPage';

interface WorkspaceDashboardRouteProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceDashboardRoute({
  params,
}: WorkspaceDashboardRouteProps) {
  const { id } = await params;
  return <WorkspaceDashboardPage workspaceId={id} />;
}
