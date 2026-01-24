import { Suspense } from 'react';
import { NewWorkspaceForm } from './new-workspace-form';

export const dynamic = 'force-dynamic';

export default function NewWorkspacePage() {
  return (
    <Suspense fallback={<NewWorkspaceFormSkeleton />}>
      <NewWorkspaceForm />
    </Suspense>
  );
}

function NewWorkspaceFormSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="h-4 w-32 bg-gray-200 rounded animate-pulse mb-6" />
        <div className="text-center mb-8">
          <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mx-auto" />
          <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mx-auto mt-2" />
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="space-y-6">
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
