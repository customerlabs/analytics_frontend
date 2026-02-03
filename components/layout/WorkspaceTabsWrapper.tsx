"use client";

import { usePathname } from "next/navigation";
import { TabNavigation, defaultTabs } from "./TabNavigation";

interface WorkspaceTabsWrapperProps {
  workspaceId: string;
  className?: string;
}

export function WorkspaceTabsWrapper({
  workspaceId,
  className,
}: WorkspaceTabsWrapperProps) {
  const pathname = usePathname();

  // Hide tabs on account detail pages (e.g., /ws/abc/accounts/123)
  const isAccountDetailPage = /\/ws\/[^/]+\/accounts\/[^/]+/.test(pathname);

  if (isAccountDetailPage) {
    return null;
  }

  return (
    <TabNavigation
      tabs={defaultTabs}
      workspaceId={workspaceId}
      className={className}
    />
  );
}
