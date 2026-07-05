import { cn } from "@/lib/utils";

/**
 * Numbered chapter marker — threads the homepage sections into a single film
 * (01 … 06). Replaces ad-hoc eyebrows so every beat shares one editorial system.
 */
export function ChapterLabel({
  index,
  label,
  className,
}: {
  index: string;
  label: string;
  className?: string;
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <span className="font-display text-sm font-semibold tabular-nums text-accent">
        {index}
      </span>
      <span className="h-px w-10 bg-accent/40" />
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-fg-muted">
        {label}
      </span>
    </div>
  );
}
