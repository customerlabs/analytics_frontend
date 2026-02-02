'use client';

import { Plus } from 'lucide-react';
import { useCreateWorkspaceSheet } from '@/hooks/useCreateWorkspaceSheet';
import { Button } from '@/components/ui/button';

export function NoWorkspacesView() {
  const { open: openCreateSheet } = useCreateWorkspaceSheet();

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Plus className="w-8 h-8 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-semibold text-foreground">
          Welcome to Analytics
        </h1>
        <p className="mt-2 text-muted-foreground">
          Create your first workspace to get started
        </p>
        <Button onClick={openCreateSheet} size="lg" className="mt-6">
          <Plus className="w-5 h-5 mr-2" />
          Create Workspace
        </Button>
      </div>
    </div>
  );
}
