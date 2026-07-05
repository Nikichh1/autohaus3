import { HeaderSkeleton, CardSkeleton } from "@/components/admin/ui/skeleton";

export default function ContentLoading() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="space-y-6">
        <CardSkeleton lines={4} />
        <CardSkeleton lines={4} />
      </div>
    </div>
  );
}
