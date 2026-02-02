'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, X, ChevronDown } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createWorkspace } from '@/lib/actions/workspaces';
import { useCreateWorkspaceSheet } from '@/hooks/useCreateWorkspaceSheet';
import { routes } from '@/lib/routes';
import { cn } from '@/lib/utils';
import {
  getTimezones,
  getCurrencies,
  getRegions,
  getBrowserTimezone,
} from '@/features/customerlabs/utils/form-options';

// Get domain for display (strip protocol)
const getDisplayDomain = () => {
  const url =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  return url.replace(/^https?:\/\//, '');
};

interface CreateWorkspaceSheetProps {
  onSuccess?: (workspaceSlug: string) => void;
}

export function CreateWorkspaceSheet({ onSuccess }: CreateWorkspaceSheetProps) {
  const router = useRouter();
  const { isOpen, onOpenChange, close } = useCreateWorkspaceSheet();
  const displayDomain = getDisplayDomain();

  // Form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [isCustomSlug, setIsCustomSlug] = useState(false);
  const [timezone, setTimezone] = useState(getBrowserTimezone());
  const [currency, setCurrency] = useState('USD');
  const [region, setRegion] = useState('US');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get options for dropdowns
  const timezones = getTimezones();
  const currencies = getCurrencies();
  const regions = getRegions();

  // Slug availability state
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [slugCheckError, setSlugCheckError] = useState<string | null>(null);

  // Reset form when sheet closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setSlug('');
      setIsCustomSlug(false);
      setTimezone(getBrowserTimezone());
      setCurrency('USD');
      setRegion('US');
      setError(null);
      setSlugStatus('idle');
      setSlugCheckError(null);
    }
  }, [isOpen]);

  // Debounced slug availability check
  const checkSlugAvailability = useCallback(async (slugToCheck: string) => {
    if (!slugToCheck || slugToCheck.length < 3) {
      setSlugStatus('idle');
      setSlugCheckError(null);
      return;
    }

    setSlugStatus('checking');
    setSlugCheckError(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await fetch(`${backendUrl}/api/v1/workspaces/check-slug/${slugToCheck}`);

      if (!res.ok) {
        throw new Error('Failed to check availability');
      }

      const data = await res.json();
      setSlugStatus(data.result?.available ? 'available' : 'taken');
    } catch {
      setSlugCheckError('Could not verify availability');
      setSlugStatus('idle');
    }
  }, []);

  // Reset status when slug changes
  useEffect(() => {
    if (slugStatus !== 'idle' && slugStatus !== 'checking') {
      setSlugStatus('idle');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

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
    const cleanedValue = value.toLowerCase().replace(/[^a-z0-9-]+/g, '');
    setIsCustomSlug(cleanedValue.length > 0);
    setSlug(cleanedValue);
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
      const result = await createWorkspace(
        name.trim(),
        slug.trim(),
        timezone,
        currency,
        region
      );

      if (!result.success || !result.workspaceId) {
        setError(result.error || 'Failed to create workspace');
        setIsLoading(false);
        return;
      }

      // Close sheet first
      close();

      // Call success callback or navigate
      if (onSuccess) {
        onSuccess(result.workspaceId);
      } else {
        router.push(routes.ws.dashboard(result.workspaceId));
      }
    } catch {
      setError('An unexpected error occurred');
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Create a Workspace</SheetTitle>
          <SheetDescription>
            Workspaces help you organize accounts and collaborate with your team
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6 px-4">
          {/* Error Display */}
          {error && (
            <div className="p-3 status-error rounded-lg">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {/* Workspace Name */}
          <div className="space-y-2">
            <Label htmlFor="sheet-name">Workspace Name</Label>
            <Input
              id="sheet-name"
              type="text"
              placeholder="My Company"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              onBlur={() => {
                if (!isCustomSlug && slug.length >= 3) {
                  checkSlugAvailability(slug);
                }
              }}
              disabled={isLoading}
            />
            <p className="form-helper">
              This is the display name for your workspace
            </p>
          </div>

          {/* Workspace Slug/URL */}
          <div className="space-y-2">
            <Label htmlFor="sheet-slug">Workspace URL</Label>
            <div className="flex items-center">
              <span className="text-sm text-muted-foreground mr-2">{displayDomain}/ws/</span>
              <div className="relative flex-1">
                <Input
                  id="sheet-slug"
                  type="text"
                  placeholder="my-company"
                  value={slug}
                  onChange={(e) => handleSlugChange(e.target.value)}
                  onBlur={() => {
                    if (slug.length >= 3 && slugStatus === 'idle') {
                      checkSlugAvailability(slug);
                    }
                  }}
                  disabled={isLoading}
                  className={cn(
                    'pr-8',
                    slugStatus === 'taken' && 'border-destructive focus-visible:ring-destructive',
                    slugStatus === 'available' && 'border-emerald-500 focus-visible:ring-emerald-500'
                  )}
                />
                {/* Status indicator */}
                {slug.length >= 3 && slugStatus !== 'idle' && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    {slugStatus === 'checking' && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    )}
                    {slugStatus === 'available' && (
                      <Check className="size-4 text-green-500" />
                    )}
                    {slugStatus === 'taken' && (
                      <X className="size-4 text-red-500" />
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Status message */}
            {slugStatus === 'taken' && (
              <p className="text-xs text-destructive">
                This workspace URL is already taken. Please choose a different one.
              </p>
            )}
            {slugStatus === 'available' && (
              <p className="text-xs text-emerald-500">This workspace URL is available!</p>
            )}
            {slugCheckError && <p className="text-xs text-amber-500">{slugCheckError}</p>}
            {slugStatus === 'idle' && !slugCheckError && (
              <p className="form-helper">
                This will be used in URLs to identify your workspace
              </p>
            )}
          </div>

          {/* Timezone */}
          <div className="space-y-2">
            <Label htmlFor="sheet-timezone">Timezone</Label>
            <div className="relative">
              <select
                id="sheet-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className={cn(
                  'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'appearance-none cursor-pointer'
                )}
                disabled={isLoading}
              >
                {timezones.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="form-helper">Used for reporting and scheduling</p>
          </div>

          {/* Currency */}
          <div className="space-y-2">
            <Label htmlFor="sheet-currency">Currency</Label>
            <div className="relative">
              <select
                id="sheet-currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={cn(
                  'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'appearance-none cursor-pointer'
                )}
                disabled={isLoading}
              >
                {currencies.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="form-helper">Default currency for financial data</p>
          </div>

          {/* Region / Data Location */}
          <div className="space-y-2">
            <Label htmlFor="sheet-region">Data Location</Label>
            <div className="relative">
              <select
                id="sheet-region"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className={cn(
                  'w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
                  'appearance-none cursor-pointer'
                )}
                disabled={isLoading}
              >
                <optgroup label="Multi-Region">
                  {regions
                    .filter((r) => r.category === 'multi-region')
                    .map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                </optgroup>
                <optgroup label="Single Region">
                  {regions
                    .filter((r) => r.category === 'region')
                    .map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                </optgroup>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="form-helper">
              Where your data will be stored (cannot be changed later)
            </p>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !name.trim() ||
              !slug.trim() ||
              slugStatus === 'taken' ||
              slugStatus === 'checking'
            }
          >
            {isLoading && <Loader2 className="mr-2 size-4 animate-spin" />}
            Create Workspace
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  );
}
