import { HeaderSkeleton, Skeleton } from "@/components/admin/ui/skeleton";

export default function MediaLoading() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
