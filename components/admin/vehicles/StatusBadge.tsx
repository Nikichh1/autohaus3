import { cn } from "@/lib/utils";
import { STATUS_LABELS, STATUS_STYLES, type VehicleStatus } from "@/lib/admin/constants";

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = (status in STATUS_LABELS ? status : "draft") as VehicleStatus;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        STATUS_STYLES[s],
        className
      )}
    >
      {STATUS_LABELS[s]}
    </span>
  );
}
