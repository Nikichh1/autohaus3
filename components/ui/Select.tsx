import { forwardRef, type ComponentProps } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

type SelectProps = ComponentProps<"select"> & {
  label?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, className, children, id, ...props }, ref) => {
    const selectId = id || props.name;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={selectId} className="eyebrow text-fg-muted">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            className={cn(
              "h-12 w-full appearance-none bg-transparent border-b border-line-strong pl-0 pr-8 text-base text-fg transition-colors focus:border-accent focus:outline-none",
              "[&>option]:bg-surface [&>option]:text-fg",
              className,
            )}
            {...props}
          >
            {children}
          </select>
          <ChevronDown className="pointer-events-none absolute right-0 top-1/2 size-4 -translate-y-1/2 text-fg-muted" />
        </div>
      </div>
    );
  },
);

Select.displayName = "Select";
