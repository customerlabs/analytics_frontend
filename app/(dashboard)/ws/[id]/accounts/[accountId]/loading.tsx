export default function AccountDetailLoading() {
  return (
    <div className="space-y-0 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-4">
        <div className="flex items-center gap-4">
          {/* Back button */}
          <div className="w-5 h-5 bg-muted rounded" />

          <div className="flex items-center gap-3">
            {/* Account name */}
            <div className="h-6 w-48 bg-muted rounded" />

            {/* Badges */}
            <div className="flex items-center gap-2">
              <div className="h-5 w-12 bg-muted rounded" />
              <div className="h-5 w-24 bg-muted rounded" />
              <div className="h-5 w-16 bg-muted rounded" />
            </div>
          </div>
        </div>

        {/* Configure button */}
        <div className="h-9 w-28 bg-muted rounded" />
      </div>

      {/* Tabs Skeleton */}
      <div className="flex items-center gap-1 border-b border-border px-4 sm:px-6">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="px-4 py-3">
            <div className="h-4 w-16 bg-muted rounded" />
          </div>
        ))}
      </div>

      {/* Content Skeleton */}
      <div className="px-4 sm:px-6 py-6">
        <div className="rounded-lg border border-border bg-card p-6 space-y-4">
          <div className="h-6 w-32 bg-muted rounded" />
          <div className="h-4 w-full max-w-md bg-muted rounded" />
          <div className="h-4 w-full max-w-sm bg-muted rounded" />
        </div>
      </div>
    </div>
  );
}
