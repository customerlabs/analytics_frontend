'use client';

import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCreateWorkspaceSheet } from '@/hooks/useCreateWorkspaceSheet';

export function NoWorkspacesView() {
  const { open: openCreateSheet, isOpen } = useCreateWorkspaceSheet();

  // Auto-open the create workspace sheet on mount
  useEffect(() => {
    if (!isOpen) {
      // Small delay to ensure sheet component is mounted
      const timer = setTimeout(() => {
        openCreateSheet();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [openCreateSheet, isOpen]);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-6">
          <Plus className="w-8 h-8 text-gray-400" />
        </div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Welcome to Analytics
        </h1>
        <p className="mt-2 text-gray-500">
          Create your first workspace to get started
        </p>
        <button
          onClick={openCreateSheet}
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          Create Workspace
        </button>
      </div>
    </div>
  );
}
