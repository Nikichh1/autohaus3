import { forwardRef, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

type InputProps = ComponentProps<"input"> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="eyebrow text-fg-muted">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "h-12 w-full bg-transparent border-b border-line-strong px-0 text-base text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none",
            error && "border-red-400 focus:border-red-400",
            className,
          )}
          {...props}
        />
        {(hint || error) && (
          <p
            className={cn(
              "text-xs",
              error ? "text-red-400" : "text-fg-muted",
            )}
          >
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

type TextareaProps = ComponentProps<"textarea"> & {
  label?: string;
  hint?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, hint, error, className, id, ...props }, ref) => {
    const inputId = id || props.name;
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="eyebrow text-fg-muted">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "min-h-[120px] w-full bg-transparent border-b border-line-strong px-0 py-3 text-base text-fg placeholder:text-fg-subtle transition-colors focus:border-accent focus:outline-none resize-none",
            error && "border-red-400 focus:border-red-400",
            className,
          )}
          {...props}
        />
        {(hint || error) && (
          <p className={cn("text-xs", error ? "text-red-400" : "text-fg-muted")}>
            {error || hint}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";
