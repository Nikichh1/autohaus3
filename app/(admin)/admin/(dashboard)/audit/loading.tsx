import { HeaderSkeleton, ListSkeleton } from "@/components/admin/ui/skeleton";

export default function AuditLoading() {
  return (
    <div>
      <HeaderSkeleton withAction={false} />
      <ListSkeleton rows={12} />
    </div>
  );
}
