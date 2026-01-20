'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, Plus, Settings } from 'lucide-react';
import { useWorkspaceRouter } from '@/hooks/useWorkspaceRouter';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import type { Workspace } from '@/lib/keycloak/types';
import { cn } from '@/lib/utils';

interface WorkspaceSwitcherProps {
  currentWorkspace: Workspace;
  workspaces: Workspace[];
  className?: string;
}

// Hoist static lookup tables outside component to prevent recreation on every render
const ROLE_COLORS: Record<string, string> = {
  'workspace-admin': 'text-blue-600 bg-blue-50',
  'workspace-billing': 'text-amber-600 bg-amber-50',
  'workspace-member': 'text-gray-600 bg-gray-50',
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
        ROLE_COLORS[role] || 'text-gray-600 bg-gray-50'
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

    // Navigate to dashboard with new workspace
    switchWorkspace(workspace.id);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg',
          'bg-gray-100 hover:bg-gray-200 transition-colors',
          'text-sm font-medium text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1'
        )}
      >
        <span className="max-w-[180px] truncate">{currentWorkspace.name}</span>
        <ChevronDown
          className={cn(
            'w-4 h-4 text-gray-500 transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={cn(
            'absolute top-full left-0 mt-1 w-72',
            'bg-white rounded-lg shadow-xl border border-gray-200',
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
                  'text-left hover:bg-gray-50 transition-colors',
                  workspace.id === currentWorkspace.id && 'bg-blue-50'
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'text-sm font-medium truncate',
                        workspace.id === currentWorkspace.id
                          ? 'text-blue-600'
                          : 'text-gray-900'
                      )}
                    >
                      {workspace.name}
                    </span>
                  </div>
                  <div className="mt-0.5"><RoleBadge role={workspace.role} /></div>
                </div>
                {workspace.id === currentWorkspace.id && (
                  <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100 my-1" />

          {/* Workspace Settings (Admin only) */}
          {currentWorkspace.role === 'workspace-admin' && (
            <button
              onClick={() => {
                switchWorkspace(currentWorkspace.id, '/settings');
                setIsOpen(false);
              }}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2',
                'text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors'
              )}
            >
              <Settings className="w-4 h-4" />
              <span>Workspace Settings</span>
            </button>
          )}

          {/* Create New Workspace */}
          <button
            onClick={() => {
              window.location.href = '/workspaces/new';
            }}
            className={cn(
              'w-full flex items-center gap-2 px-3 py-2',
              'text-left text-sm text-green-600 hover:bg-green-50 transition-colors'
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
