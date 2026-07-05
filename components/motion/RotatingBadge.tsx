"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Rotating circular-text badge — a continuously spinning "moving object" (icon in
 * the middle, circular caption around it). Pure CSS transform; stops under reduced
 * motion. Colour follows `currentColor`.
 */
export function RotatingBadge({
  label = "AUTOHAUS · ОГЛЕД · ТЕСТ ДРАЙВ · ",
  children,
  className,
}: {
  label?: string;
  children?: ReactNode;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const pathId = `badge-${id}`;
  return (
    <div className={cn("relative", className)} aria-hidden>
      <svg viewBox="0 0 120 120" className="vd-spin size-full">
        <defs>
          <path id={pathId} d="M60,60 m-42,0 a42,42 0 1,1 84,0 a42,42 0 1,1 -84,0" fill="none" />
        </defs>
        <text style={{ fontSize: "10.5px", letterSpacing: "2.4px", fontWeight: 600, fill: "currentColor", textTransform: "uppercase" }}>
          <textPath href={`#${pathId}`} startOffset="0">{label}{label}</textPath>
        </text>
      </svg>
      {children && (
        <span className="absolute inset-0 flex items-center justify-center">{children}</span>
      )}
    </div>
  );
}
