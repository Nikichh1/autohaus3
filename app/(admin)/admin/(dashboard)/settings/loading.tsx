import { HeaderSkeleton, FormSkeleton } from "@/components/admin/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div>
      <HeaderSkeleton withAction={false} />
      <div className="max-w-2xl">
        <FormSkeleton fields={6} />
      </div>
    </div>
  );
}
