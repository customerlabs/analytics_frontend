import { create } from 'zustand';

interface CreateWorkspaceSheetState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  onOpenChange: (open: boolean) => void;
}

export const useCreateWorkspaceSheet = create<CreateWorkspaceSheetState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  onOpenChange: (open) => set({ isOpen: open }),
}));
