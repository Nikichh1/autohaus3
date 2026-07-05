import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-lg bg-base/60 border border-line-strong text-fg placeholder:text-fg-subtle px-3 text-sm outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent/40 disabled:opacity-50";

export function Input({ className, ...props }: ComponentProps<"input">) {
  return <input className={cn(fieldBase, "h-9", className)} {...props} />;
}

export function Textarea({ className, ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={cn(fieldBase, "min-h-24 py-2 leading-relaxed", className)} {...props} />
  );
}

export function Select({ className, children, ...props }: ComponentProps<"select">) {
  return (
    <select
      className={cn(fieldBase, "h-9 appearance-none pr-8", className)}
      {...props}
    >
      {children}
    </select>
  );
}

export function Label({
  className,
  children,
  hint,
  ...props
}: ComponentProps<"label"> & { hint?: ReactNode }) {
  return (
    <label
      className={cn("mb-1.5 flex items-center justify-between text-xs font-medium text-fg-muted", className)}
      {...props}
    >
      <span>{children}</span>
      {hint ? <span className="text-fg-subtle">{hint}</span> : null}
    </label>
  );
}

export function Field({
  label,
  htmlFor,
  hint,
  error,
  children,
  className,
}: {
  label?: ReactNode;
  htmlFor?: string;
  hint?: ReactNode;
  error?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col", className)}>
      {label ? (
        <Label htmlFor={htmlFor} hint={hint}>
          {label}
        </Label>
      ) : null}
      {children}
      {error ? <p className="mt-1 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
