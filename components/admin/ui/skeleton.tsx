import { cn } from "@/lib/utils";

/**
 * Admin loading skeletons.
 *
 * Every admin route ships a `loading.tsx` built from these blocks, so navigating
 * the panel shows an instant shimmer placeholder (matching the real layout)
 * while the server render + DB reads stream in — never a blank frozen screen.
 */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("admin-skeleton", className)} aria-hidden />;
}

/** Page title + subtitle block, mirroring <PageHeader>. */
export function HeaderSkeleton({ withAction = true }: { withAction?: boolean }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-3">
      <div className="space-y-2.5">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      {withAction ? <Skeleton className="h-9 w-36 rounded-lg" /> : null}
    </div>
  );
}

/** Row of stat cards (dashboard). */
export function StatCardsSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-5 rounded-md" />
          </div>
          <Skeleton className="mt-4 h-8 w-12" />
        </div>
      ))}
    </div>
  );
}

/** Generic table placeholder. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex items-center gap-4 border-b border-line px-5 py-3.5">
        <Skeleton className="h-4 w-10" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="ml-auto h-4 w-20" />
      </div>
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-3">
            <Skeleton className="h-12 w-16 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-20 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Stacked list rows (leads, audit). */
export function ListSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="divide-y divide-line">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-5 py-4">
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-6 w-16 shrink-0 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** A single content card placeholder. */
export function CardSkeleton({ className, lines = 4 }: { className?: string; lines?: number }) {
  return (
    <div className={cn("rounded-xl border border-line bg-surface p-5", className)}>
      <Skeleton className="h-5 w-40" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className={cn("h-4", i === lines - 1 && "w-2/3")} />
        ))}
      </div>
    </div>
  );
}

/** Form-shaped placeholder (settings, editors). */
export function FormSkeleton({ fields = 6 }: { fields?: number }) {
  return (
    <div className="space-y-6 rounded-xl border border-line bg-surface p-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
      <Skeleton className="h-10 w-32 rounded-lg" />
    </div>
  );
}
