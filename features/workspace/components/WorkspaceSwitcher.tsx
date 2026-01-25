'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus } from 'lucide-react';
import { useWorkspaceRouter } from '@/hooks/useWorkspaceRouter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useCreateWorkspaceSheet } from '@/hooks/useCreateWorkspaceSheet';
import { cn } from '@/lib/utils';
import type { Workspace } from '@/types/workspace';

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  className?: string;
}

// Hoist static lookup tables outside component to prevent recreation on every render
const ROLE_COLORS: Record<string, string> = {
  'workspace-admin': 'badge-admin',
  'workspace-billing': 'badge-billing',
  'workspace-member': 'badge-member',
};

const ROLE_LABELS: Record<string, string> = {
  'workspace-admin': 'Admin',
  'workspace-billing': 'Billing',
  'workspace-member': 'Member',
};

// Pure function moved outside component
function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={cn(
        'text-xs px-1.5 py-0.5 rounded font-medium',
        ROLE_COLORS[role] || 'badge-member'
      )}
    >
      {ROLE_LABELS[role] || role}
    </span>
  );
}

export function WorkspaceSwitcher({
  currentWorkspace,
  workspaces,
  className,
}: WorkspaceSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { switchWorkspace } = useWorkspaceRouter();
  const { setActiveWorkspace } = useWorkspaceStore();
  const { open: openCreateSheet } = useCreateWorkspaceSheet();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectWorkspace = async (workspace: Workspace) => {
    if (workspace.id === currentWorkspace.id) {
      setIsOpen(false);
      return;
    }

    // Update local state
    setActiveWorkspace(workspace);

    // Navigate to dashboard with new workspace (use slug for cleaner URLs)
    switchWorkspace(workspace.slug);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-secondary hover:bg-accent transition-colors',
          'text-sm font-medium text-foreground',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 focus:ring-offset-background'
        )}
      >
        <span className="max-w-[180px] truncate">{currentWorkspace.name}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 w-72',
            'bg-card rounded-lg shadow-xl border border-border',
            'z-50 py-1'
          )}
        >
          {/* Workspace List */}
          <div className="max-h-64 overflow-y-auto">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace)}
                className={cn(
                  'w-full flex items-center justify-between px-3 py-2',
                  'text-left hover:bg-accent transition-colors',
                  workspace.id === currentWorkspace.id && 'bg-primary/10'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        workspace.id === currentWorkspace.id
                          ? 'text-primary'
                          : 'text-foreground'
                      )}
                    >
                      {workspace.name}
                    </span>
                  </div>
                  <div className="mt-0.5">
                    <RoleBadge role={workspace.role} />
                  </div>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <Check className="w-4 h-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-border my-1" />

          {/* Create New Workspace */}
          <button
            onClick={() => {
              setIsOpen(false);
              openCreateSheet();
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2',
              'text-left text-sm text-emerald-500 hover:bg-emerald-500/10 transition-colors'
            )}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Workspace</span>
          </button>
        </div>
      )}
    </div>
  );
}
