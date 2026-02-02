import { resolveWorkspaceOrRedirect } from "@/lib/workspace/resolver";
import { AccountsPageClient } from "../components/AccountsPageClient";

interface AccountsPageProps {
  workspaceId: string;
}

export async function AccountsPage({ workspaceId }: AccountsPageProps) {
  const workspace = await resolveWorkspaceOrRedirect(workspaceId);

  return (
    <AccountsPageClient
      workspaceId={workspace.slug}
      workspaceName={workspace.name}
    />
  );
}
