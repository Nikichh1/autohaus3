import { HeaderSkeleton, Skeleton, ListSkeleton } from "@/components/admin/ui/skeleton";

export default function LeadsLoading() {
  return (
    <div>
      <HeaderSkeleton withAction={false} />
      <div className="mb-4 flex flex-wrap gap-2">
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>
      <ListSkeleton rows={9} />
    </div>
  );
}
