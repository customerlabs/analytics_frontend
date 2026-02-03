"use client";

import { usePathname } from "next/navigation";

interface WorkspaceMainWrapperProps {
  children: React.ReactNode;
}

export function WorkspaceMainWrapper({ children }: WorkspaceMainWrapperProps) {
  const pathname = usePathname();

  // Account detail pages get full width, others get constrained width
  const isAccountDetailPage = /\/ws\/[^/]+\/accounts\/[^/]+/.test(pathname);

  if (isAccountDetailPage) {
    return <main>{children}</main>;
  }

  return (
    <main className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {children}
    </main>
  );
}
