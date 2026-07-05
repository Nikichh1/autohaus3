import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "ghost" | "solid" | "link";
type Size = "sm" | "md" | "lg";

const base =
  "group/btn relative inline-flex items-center justify-center overflow-hidden rounded-full font-medium transition-[color,background-color,transform,box-shadow,border-color] duration-300 ease-out focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap";

const sizes: Record<Size, string> = {
  sm: "h-10 px-5 text-xs",
  md: "h-12 px-6 text-sm",
  lg: "h-14 px-8 text-sm",
};

const shells: Record<Variant, string> = {
  // Secondary — quiet pill; a thick accent line lights up the left edge on hover
  ghost: "border border-line-strong text-fg hover:border-accent",
  // Primary — sporty filled pill; a skewed panel wipes across to INVERT it on
  // hover (light↔dark), with a lift. High-contrast, dynamic, unmistakable.
  solid:
    "bg-fg text-ink shadow-[0_10px_26px_-14px_rgba(8,9,12,0.55)] hover:-translate-y-0.5 hover:shadow-[0_20px_44px_-16px_rgba(8,9,12,0.65)]",
  // Inline text link
  link: "text-fg hover:text-accent gap-1.5",
};

function ButtonContent({
  variant,
  arrow,
  children,
}: {
  variant: Variant;
  arrow: boolean;
  children: ReactNode;
}) {
  const arrowEl = arrow ? (
    <ArrowRight className="size-4 shrink-0 transition-transform duration-300 ease-out group-hover/btn:translate-x-1" />
  ) : null;

  if (variant === "link") {
    return (
      <>
        {children}
        {arrowEl}
      </>
    );
  }

  if (variant === "ghost") {
    return (
      <>
        {/* Thick accent line on the LEFT edge — grows in on hover. The simpler,
            quieter secondary cue (vs. the primary's full inverting sweep). */}
        <span
          aria-hidden
          className="absolute left-0 top-1/2 z-0 h-0 w-[4px] -translate-y-1/2 rounded-r-sm bg-accent transition-[height] duration-300 ease-out group-hover/btn:h-3/5"
        />
        <span className="relative z-10 inline-flex items-center gap-2 transition-transform duration-300 ease-out group-hover/btn:translate-x-1.5">
          {children}
          {arrowEl}
        </span>
      </>
    );
  }

  // solid — a skewed panel wipes across and INVERTS the pill on hover (sporty)
  return (
    <>
      <span
        aria-hidden
        className="absolute inset-y-0 -left-3 -right-3 z-0 -translate-x-[112%] -skew-x-[18deg] bg-ink transition-transform duration-[450ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/btn:translate-x-0"
      />
      <span className="relative z-10 inline-flex items-center gap-2 transition-colors duration-300 ease-out group-hover/btn:text-fg">
        {children}
        {arrowEl}
      </span>
    </>
  );
}

type ButtonProps = ComponentProps<"button"> & {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
};

export function Button({
  variant = "ghost",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(base, shells[variant], variant !== "link" && sizes[size], className)}
      {...props}
    >
      <ButtonContent variant={variant} arrow={arrow}>
        {children}
      </ButtonContent>
    </button>
  );
}

type ButtonLinkProps = ComponentProps<typeof Link> & {
  variant?: Variant;
  size?: Size;
  arrow?: boolean;
};

export function ButtonLink({
  variant = "ghost",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(base, shells[variant], variant !== "link" && sizes[size], className)}
      {...props}
    >
      <ButtonContent variant={variant} arrow={arrow}>
        {children}
      </ButtonContent>
    </Link>
  );
}
