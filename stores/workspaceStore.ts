import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Workspace } from '@/lib/keycloak/types';

interface WorkspaceState {
  // Current active workspace (client-side state)
  activeWorkspace: Workspace | null;

  // List of user's workspaces
  workspaces: Workspace[];

  // Actions
  setActiveWorkspace: (workspace: Workspace) => void;
  setWorkspaces: (workspaces: Workspace[]) => void;
  clearWorkspaceState: () => void;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      activeWorkspace: null,
      workspaces: [],

      setActiveWorkspace: (workspace) => {
        set({ activeWorkspace: workspace });
      },

      setWorkspaces: (workspaces) => {
        set({ workspaces });
      },

      clearWorkspaceState: () => {
        set({ activeWorkspace: null, workspaces: [] });
      },
    }),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        // Only persist activeWorkspace ID, not full data
        activeWorkspaceId: state.activeWorkspace?.id,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useActiveWorkspace = () =>
  useWorkspaceStore((state) => state.activeWorkspace);

export const useWorkspaces = () =>
  useWorkspaceStore((state) => state.workspaces);

export const useIsWorkspaceAdmin = () =>
  useWorkspaceStore(
    (state) => state.activeWorkspace?.role === 'workspace-admin'
  );
