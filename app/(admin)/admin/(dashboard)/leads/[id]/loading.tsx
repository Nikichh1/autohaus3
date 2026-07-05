import { HeaderSkeleton, CardSkeleton } from "@/components/admin/ui/skeleton";

export default function LeadDetailLoading() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <CardSkeleton className="lg:col-span-2" lines={6} />
        <div className="space-y-6">
          <CardSkeleton lines={3} />
          <CardSkeleton lines={3} />
        </div>
      </div>
    </div>
  );
}
