import { HeaderSkeleton, ListSkeleton } from "@/components/admin/ui/skeleton";

export default function UsersLoading() {
  return (
    <div>
      <HeaderSkeleton />
      <ListSkeleton rows={6} />
    </div>
  );
}
