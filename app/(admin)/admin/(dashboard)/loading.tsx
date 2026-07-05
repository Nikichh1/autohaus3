import { HeaderSkeleton, CardSkeleton } from "@/components/admin/ui/skeleton";

/**
 * Default admin loading state — shown instantly on navigation while the page's
 * server render + DB reads stream in. Kept neutral so it reads correctly for any
 * route; folders with a distinct shape (dashboard, vehicles, leads, settings…)
 * ship their own closer `loading.tsx`.
 */
export default function AdminLoading() {
  return (
    <div>
      <HeaderSkeleton />
      <div className="grid gap-6 lg:grid-cols-3">
        <CardSkeleton className="lg:col-span-2" lines={6} />
        <CardSkeleton lines={5} />
      </div>
    </div>
  );
}
