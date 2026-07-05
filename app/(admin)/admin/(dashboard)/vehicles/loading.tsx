import { HeaderSkeleton, Skeleton, TableSkeleton } from "@/components/admin/ui/skeleton";

export default function VehiclesLoading() {
  return (
    <div>
      <HeaderSkeleton />
      {/* filter bar */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-32 rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg" />
      </div>
      <TableSkeleton rows={10} />
    </div>
  );
}
