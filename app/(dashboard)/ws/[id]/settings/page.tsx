import { WorkspaceSettingsPage } from '@/features/workspace/settings/WorkspaceSettingsPage';

interface WorkspaceSettingsRouteProps {
  params: Promise<{ id: string }>;
}

export default async function WorkspaceSettingsRoute({
  params,
}: WorkspaceSettingsRouteProps) {
  const { id } = await params;
  return <WorkspaceSettingsPage workspaceId={id} />;
}
