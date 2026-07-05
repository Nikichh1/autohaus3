import { HeaderSkeleton, FormSkeleton, Skeleton } from "@/components/admin/ui/skeleton";

export default function NewVehicleLoading() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <FormSkeleton fields={7} />
        </div>
        <div className="space-y-4">
          <Skeleton className="aspect-video w-full rounded-lg" />
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
