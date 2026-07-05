import { HeaderSkeleton, StatCardsSkeleton, Skeleton } from "@/components/admin/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <div>
      <HeaderSkeleton withAction={false} />
      <StatCardsSkeleton count={4} />
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-line bg-surface p-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="mt-5 h-56 w-full rounded-lg" />
          </div>
        ))}
      </div>
    </div>
  );
}
