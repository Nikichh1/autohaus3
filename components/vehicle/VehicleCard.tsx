import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Vehicle } from "@/types";
import { cn, displayPrice, formatNumber } from "@/lib/utils";
import { fuelLabels, drivetrainLabels } from "@/lib/labels";
import { BlurImage } from "@/components/motion/BlurImage";
import { TiltCard } from "@/components/motion/TiltCard";

type VehicleCardProps = {
  vehicle: Vehicle;
  priority?: boolean;
  className?: string;
};

/**
 * Magazine-grade vehicle card — photography-first. Clean image (no baked text),
 * an interactive gallery cross-fade on hover, an elegant "view" cue, a premium
 * three-spec strip, and a price-led footer. Depth + lift handled by TiltCard.
 */
export function VehicleCard({ vehicle, priority, className }: VehicleCardProps) {
  const hasSecond = vehicle.images.length > 1;

  return (
    <TiltCard max={3} className={className}>
      <Link
        href={`/avtomobili/${vehicle.slug}`}
        data-cursor="view"
        className="group block [transform:translateZ(0)]"
      >
        {/* Photography-first frame */}
        <div className="sheen edge-light relative aspect-[16/11] overflow-hidden rounded-[1.25rem] bg-elevated shadow-[0_1px_0_0_rgb(255_255_255_/_0.04)_inset] ring-1 ring-line transition-shadow duration-500 group-hover:shadow-[0_36px_80px_-34px_rgb(0_0_0_/_0.75)]">
          <BlurImage
            src={vehicle.images[0]}
            alt={`${vehicle.brand} ${vehicle.model}`}
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
            priority={priority}
          />
          {/* Cinematic reveal — the second shot wipes in left→right on hover */}
          {hasSecond && (
            <div className="absolute inset-0 [clip-path:inset(0_100%_0_0)] transition-[clip-path] duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:[clip-path:inset(0_0%_0_0)]">
              <BlurImage
                src={vehicle.images[1]}
                alt=""
                fill
                sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
                className="object-cover transition-transform duration-[1500ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
              />
            </div>
          )}
          {/* Titanium light-sweep leading the reveal edge */}
          {hasSecond && (
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.25rem]">
              <div className="absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-0 mix-blend-screen blur-[1px] transition-[transform,opacity] duration-[1150ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-[440%] group-hover:opacity-100" />
            </div>
          )}

          {/* Engine sound — signature selling point */}
          {vehicle.engineSound && (
            <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5 rounded-full border border-accent/40 bg-black/55 py-1.5 pl-2.5 pr-3.5 backdrop-blur-md transition-transform duration-300 group-hover:scale-105">
              <span className="flex items-end gap-[2px]" aria-hidden>
                <span className="eq-bar h-2 w-[2px] rounded-full bg-accent" style={{ animationDelay: "0ms" }} />
                <span className="eq-bar h-3 w-[2px] rounded-full bg-accent" style={{ animationDelay: "150ms" }} />
                <span className="eq-bar h-1.5 w-[2px] rounded-full bg-accent" style={{ animationDelay: "300ms" }} />
              </span>
              <span className="text-[11px] font-medium tracking-tight text-white">
                Чуйте двигателя
              </span>
            </div>
          )}

          {/* Rental status — discoverable at a glance */}
          {vehicle.rentalPerDay !== undefined && (
            <div className="pointer-events-none absolute left-4 top-4 z-10 flex items-center gap-2 rounded-full border border-white/15 bg-black/45 py-1.5 pl-2.5 pr-3.5 backdrop-blur-md">
              <span className="size-1.5 rounded-full bg-accent" />
              <span className="text-[11px] font-medium tracking-tight text-white">
                Наем · от {formatNumber(vehicle.rentalPerDay)} €/ден
              </span>
            </div>
          )}

          {/* Cinematic floor gradient — appears on hover for the cue */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-transparent to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

          {/* "View" cue — slides up on hover */}
          <div className="pointer-events-none absolute inset-x-5 bottom-5 flex translate-y-2 items-center justify-between opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100">
            <span className="text-sm font-medium tracking-tight text-white">
              Разгледай детайли
            </span>
            <span className="flex size-9 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white backdrop-blur-md">
              <ArrowUpRight className="size-4" />
            </span>
          </div>
        </div>

        {/* Editorial caption */}
        <div className="mt-5">
          <div className="flex items-baseline justify-between gap-3">
            <p className="eyebrow text-fg-subtle">
              {vehicle.brand} · {vehicle.year}
            </p>
            <p className="text-[11px] uppercase tracking-[0.18em] text-fg-subtle">
              {vehicle.bodyType}
            </p>
          </div>

          <h3 className="mt-2 font-display text-xl font-bold leading-tight tracking-tight text-fg md:text-2xl">
            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1px] bg-left-bottom bg-no-repeat pb-1 transition-[background-size] duration-500 ease-out group-hover:bg-[length:100%_1px]">
              {vehicle.model}
            </span>
            {vehicle.variant && (
              <span className="ml-2 text-base font-medium text-fg-muted">
                {vehicle.variant}
              </span>
            )}
          </h3>

          {/* Premium spec strip */}
          <dl className="mt-5 grid grid-cols-3 border-y border-line">
            <Spec label="Мощност" value={`${vehicle.power} к.с.`} />
            <Spec label="Задвижване" value={drivetrainLabels[vehicle.drivetrain]} divided />
            <Spec label="Гориво" value={fuelLabels[vehicle.fuelType]} divided />
          </dl>

          <div className="mt-5 flex items-end justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-fg-subtle">
                {formatNumber(vehicle.mileage)} км
              </p>
              <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-fg tabular-nums">
                {displayPrice(vehicle.price)}
              </p>
            </div>
            <span className="flex size-10 items-center justify-center rounded-full border border-line-strong text-fg transition-all duration-300 ease-out group-hover:border-accent group-hover:bg-accent group-hover:text-ink">
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </span>
          </div>
        </div>
      </Link>
    </TiltCard>
  );
}

function Spec({
  label,
  value,
  divided,
}: {
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div className={cn("min-w-0 py-3", divided && "border-l border-line pl-3")}>
      <dt className="truncate text-[10px] uppercase tracking-[0.06em] text-fg-subtle">
        {label}
      </dt>
      <dd className="mt-1 truncate font-display text-sm font-semibold text-fg">{value}</dd>
    </div>
  );
}
