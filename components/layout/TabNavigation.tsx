'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface Tab {
  name: string;
  href: string;
  pattern?: RegExp; // Optional pattern for matching active state
}

interface TabNavigationProps {
  tabs: Tab[];
  workspaceId: string;
  className?: string;
}

export function TabNavigation({
  tabs,
  workspaceId,
  className,
}: TabNavigationProps) {
  const pathname = usePathname();

  // Check if tab is active
  const isActiveTab = (tab: Tab): boolean => {
    if (tab.pattern) {
      return tab.pattern.test(pathname);
    }

    // Check exact match or starts with for nested routes
    const tabPath = tab.href.split('?')[0];

    if (tabPath === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(tabPath);
  };

  // Build tab URL with workspace context in path
  const buildTabUrl = (tab: Tab): string => {
    const baseUrl = tab.href;

    if (baseUrl.startsWith(`/ws/${workspaceId}`)) {
      return baseUrl;
    }

    if (baseUrl === '/ws' || baseUrl.startsWith('/ws/')) {
      const suffix = baseUrl === '/ws' ? '' : baseUrl.slice('/ws'.length);
      return `/ws/${workspaceId}${suffix}`;
    }

    return baseUrl;
  };

  return (
    <nav
      className={cn(
        'bg-background border-b border-border',
        'px-4 sm:px-6',
        className
      )}
    >
      <div className="flex gap-1 -mb-px">
        {tabs.map((tab) => {
          const isActive = isActiveTab(tab);
          const href = buildTabUrl(tab);

          return (
            <Link
              key={tab.name}
              href={href}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                isActive
                  ? 'text-foreground border-primary'
                  : 'text-muted-foreground border-transparent hover:text-foreground hover:border-muted-foreground'
              )}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Default tabs for the main app
 */
export const defaultTabs: Tab[] = [
  {
    name: 'Dashboard',
    href: '/ws',
    pattern: /^\/ws\/[^/]+$/,
  },
  {
    name: 'Accounts',
    href: '/ws/accounts',
    pattern: /^\/ws\/[^/]+\/accounts/,
  },
  {
    name: 'Settings',
    href: '/ws/settings',
    pattern: /^\/ws\/[^/]+\/settings/,
  },
];
