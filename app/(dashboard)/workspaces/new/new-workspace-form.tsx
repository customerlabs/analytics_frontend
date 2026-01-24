'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWorkspace } from '@/lib/actions/workspaces';
import { routes } from '@/lib/routes';

export function NewWorkspaceForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorFromUrl = searchParams.get('error');

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-generate slug from name
  const handleNameChange = (value: string) => {
    setName(value);
    if (!isCustomSlug) {
      setSlug(
        value
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
      );
    }
  };

  const handleSlugChange = (value: string) => {
    setIsCustomSlug(true);
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]+/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    if (!slug.trim()) {
      setError('Workspace URL is required');
      return;
    }

    if (slug.length < 3) {
      setError('Workspace URL must be at least 3 characters');
      return;
    }

    setIsLoading(true);

    try {
      const result = await createWorkspace(name.trim(), slug.trim());

      if (!result.success || !result.workspaceId) {
        setError(result.error || 'Failed to create workspace');
        setIsLoading(false);
        return;
      }

      // Redirect to the new workspace dashboard
      router.push(routes.ws.dashboard(result.workspaceId));
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link
          href="/workspaces"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to workspaces
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">
            Create a Workspace
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            Workspaces help you organize accounts and collaborate with your team
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Error Display */}
            {(errorFromUrl || error) && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{errorFromUrl || error}</p>
              </div>
            )}

            {/* Workspace Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Workspace Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="My Company"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500">
                This is the display name for your workspace
              </p>
            </div>

            {/* Workspace Slug/URL */}
            <div className="space-y-2">
              <Label htmlFor="slug">Workspace URL</Label>
              <div className="flex items-center">
                <span className="text-sm text-gray-500 mr-2">analytics.app/</span>
                <Input
                  id="slug"
                  type="text"
                  placeholder="my-company"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  disabled={isLoading}
                  className="flex-1"
                />
              </div>
              <p className="text-xs text-gray-500">
                This will be used in URLs to identify your workspace
              </p>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !name.trim() || !slug.trim()}
            >
              {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Create Workspace
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
