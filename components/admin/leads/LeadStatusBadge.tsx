import { cn } from "@/lib/utils";
import { LEAD_STATUS_LABELS, LEAD_STATUS_STYLES, type LeadStatus } from "@/lib/admin/leads";

export function LeadStatusBadge({ status, className }: { status: string; className?: string }) {
  const s = (status in LEAD_STATUS_LABELS ? status : "new") as LeadStatus;
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[11px] font-medium",
        LEAD_STATUS_STYLES[s],
        className,
      )}
    >
      {LEAD_STATUS_LABELS[s]}
    </span>
  );
}
