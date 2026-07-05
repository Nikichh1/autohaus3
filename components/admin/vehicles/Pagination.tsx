import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VehicleListParams } from "@/lib/admin/vehicle-queries";

export function Pagination({
  page,
  totalPages,
  total,
  params,
}: {
  page: number;
  totalPages: number;
  total: number;
  params: VehicleListParams;
}) {
  if (totalPages <= 1) {
    return (
      <p className="mt-4 text-xs text-fg-subtle">
        {total} {total === 1 ? "резултат" : "резултата"}
      </p>
    );
  }

  function href(p: number) {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v && k !== "page") sp.set(k, String(v));
    }
    if (p > 1) sp.set("page", String(p));
    const qs = sp.toString();
    return `/admin/vehicles${qs ? `?${qs}` : ""}`;
  }

  // Compact window of page numbers around the current page.
  const windowPages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  for (let p = Math.max(1, end - 4); p <= end; p++) windowPages.push(p);

  return (
    <div className="mt-5 flex items-center justify-between gap-3">
      <p className="text-xs text-fg-subtle">
        Страница {page} от {totalPages} · {total} общо
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={href(page - 1)} disabled={page <= 1} aria-label="Назад">
          <ChevronLeft className="size-4" />
        </PageLink>
        {windowPages.map((p) => (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              "flex h-9 min-w-9 items-center justify-center rounded-lg px-2.5 text-sm transition-colors",
              p === page
                ? "bg-fg font-medium text-ink"
                : "text-fg-muted hover:bg-white/5 hover:text-fg"
            )}
          >
            {p}
          </Link>
        ))}
        <PageLink href={href(page + 1)} disabled={page >= totalPages} aria-label="Напред">
          <ChevronRight className="size-4" />
        </PageLink>
      </div>
    </div>
  );
}

function PageLink({
  href,
  disabled,
  children,
  ...props
}: {
  href: string;
  disabled?: boolean;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  if (disabled) {
    return (
      <span className="flex size-9 items-center justify-center rounded-lg text-fg-subtle/40" {...props}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={href}
      className="flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
      {...props}
    >
      {children}
    </Link>
  );
}
