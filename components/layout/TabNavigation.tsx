'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
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
  const searchParams = useSearchParams();

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

  // Build tab URL with workspace context
  const buildTabUrl = (tab: Tab): string => {
    const baseUrl = tab.href;

    // If URL already has workspace, use as-is
    if (baseUrl.includes('?ws=')) {
      return baseUrl;
    }

    // Check if URL needs workspace context
    const noContextPaths = ['/profile', '/workspaces'];
    const needsContext = !noContextPaths.some((p) => baseUrl.startsWith(p));

    // Account detail pages don't need workspace
    const isAccountDetail = /^\/accounts\/[^/]+/.test(baseUrl);

    if (!needsContext || isAccountDetail) {
      return baseUrl;
    }

    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}ws=${workspaceId}`;
  };

  return (
    <nav
      className={cn(
        'bg-white border-b border-gray-200',
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
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
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
    href: '/',
    pattern: /^\/$/,
  },
  {
    name: 'Accounts',
    href: '/accounts',
    pattern: /^\/accounts/,
  },
  {
    name: 'Settings',
    href: '/settings',
    pattern: /^\/settings/,
  },
];
