"use client";

import { Timer, Gauge, Zap, Activity, Cog, Fuel, GaugeCircle, Droplet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Vehicle } from "@/types";
import { cn } from "@/lib/utils";
import { drivetrainLabels, transmissionLabels, fuelLabels } from "@/lib/labels";
import { StatCounter } from "@/components/motion/StatCounter";
import { FadeIn } from "@/components/motion/FadeIn";

type Capsule = {
  Icon: LucideIcon;
  label: string;
  to?: number;
  decimals?: number;
  unit?: string;
  text?: string;
  /** The pure-performance figures — these run hot on performance cars. */
  hero?: boolean;
};

/**
 * Dynamics band — the figures a driver reads first, as a row of machined
 * capsules with numbers that spin up on scroll. Compact and visual, it turns
 * the spec sheet into the moment enthusiasts came for, without a wall of rows.
 * Renders only the stats a given car actually has (min. two).
 *
 * Performance-collection cars IGNITE the Autohaus R identity here: a red edge
 * filament, racing icons and ticks, and the two hero figures (0–100, top
 * speed) melting into red. Executive / Signature stay pure titanium — the
 * band's temperature tells you what kind of machine you're reading.
 */
export function DynamicsBand({ vehicle }: { vehicle: Vehicle }) {
  const hot = vehicle.collection === "performance";
  // Prioritise the pure-performance numbers, then fall back to the
  // dynamics-adjacent specs every car has, so the band always reads full
  // (four capsules) rather than sparse when a car lacks 0–100 / top-speed data.
  const caps: (Capsule | null)[] = [
    vehicle.acceleration ? { Icon: Timer, label: "0–100 км/ч", to: vehicle.acceleration, decimals: 1, unit: "с", hero: true } : null,
    vehicle.topSpeed ? { Icon: Gauge, label: "Макс. скорост", to: vehicle.topSpeed, unit: "км/ч", hero: true } : null,
    vehicle.power ? { Icon: Zap, label: "Мощност", to: vehicle.power, unit: "к.с." } : null,
    vehicle.torque ? { Icon: Activity, label: "Въртящ момент", to: vehicle.torque, unit: "Nm" } : null,
    vehicle.engineCC ? { Icon: GaugeCircle, label: "Работен обем", to: vehicle.engineCC, unit: "см³" } : null,
    { Icon: Cog, label: "Задвижване", text: drivetrainLabels[vehicle.drivetrain] },
    { Icon: Activity, label: "Трансмисия", text: transmissionLabels[vehicle.transmission] },
    { Icon: vehicle.fuelType === "electric" ? Zap : vehicle.fuelType === "diesel" ? Droplet : Fuel, label: "Гориво", text: fuelLabels[vehicle.fuelType] },
  ];
  const capsules = caps.filter((c): c is Capsule => c !== null).slice(0, 4);
  if (capsules.length < 2) return null;

  return (
    <section
      data-section="dynamics"
      data-section-label="Динамика"
      aria-label="Динамика"
      className={cn(
        "relative overflow-hidden border-t border-line px-6 py-[clamp(56px,8vh,110px)] md:px-8",
        "vd-dark",
        hot ? "edge-race" : "edge-light",
      )}
      style={{ background: "radial-gradient(130% 120% at 50% -20%,#1b1f26 0%,#111419 55%,#0b0d12 100%)" }}
    >
      {/* red heat rising off the filament — performance cars only */}
      {hot && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-[40vh]"
          style={{ background: "radial-gradient(60% 100% at 50% 0%, rgb(var(--racing-glow) / 0.09), transparent 70%)" }}
        />
      )}

      {/* ghost watermark */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-4 top-2 select-none font-mega text-[26vw] leading-none tracking-tighter md:text-[16vw]",
          hot ? "text-racing/[0.04]" : "text-white/[0.02]",
        )}
      >
        01
      </span>

      <div className="relative mx-auto max-w-[1320px]">
        <div className="mb-[clamp(28px,4vh,48px)] flex flex-wrap items-end justify-between gap-4">
          <div className="flex items-center gap-3">
            <p className={cn("text-[11px] font-semibold uppercase tracking-[0.22em]", hot ? "text-racing" : "text-accent")}>
              [ 01 — Динамика ]
            </p>
            {hot && (
              <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-racing/40 bg-racing/[0.08] px-2 py-1 text-[9px] font-bold uppercase tracking-[0.16em] text-racing">
                <span aria-hidden className="race-led size-1 rounded-full bg-racing" />
                Спортна серия
              </span>
            )}
          </div>
          <p className="max-w-[300px] text-[13px] leading-relaxed text-fg-muted">
            Заводски стойности — характерът на този автомобил, в цифри.
          </p>
        </div>

        <div className={`grid gap-3 md:gap-4 ${capsules.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : capsules.length === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
          {capsules.map((c, i) => {
            const heroHot = hot && c.hero;
            return (
              <FadeIn key={c.label} delay={i * 0.07} y={22}>
                <div
                  className={cn(
                    "sheen group relative h-full overflow-hidden rounded-[3px] border bg-white/[0.02] p-4 transition-colors duration-500 md:p-6",
                    heroHot
                      ? "border-racing/30 hover:border-racing/60"
                      : hot
                        ? "border-line-strong hover:border-racing/45"
                        : "border-line-strong hover:border-accent/45",
                  )}
                >
                  {/* corner tick */}
                  <span
                    aria-hidden
                    className={cn(
                      "absolute right-3.5 top-3.5 size-5 border-r border-t transition-colors duration-500 md:right-4 md:top-4",
                      heroHot
                        ? "border-racing/45 group-hover:border-racing/70"
                        : hot
                          ? "border-white/15 group-hover:border-racing/50"
                          : "border-white/15 group-hover:border-accent/50",
                    )}
                  />
                  <c.Icon className={cn("size-5", hot ? "text-racing" : "text-accent")} strokeWidth={1.6} aria-hidden />
                  {c.to !== undefined ? (
                    <p className="mt-6 flex items-baseline gap-1.5 md:mt-8">
                      <StatCounter
                        to={c.to}
                        decimals={c.decimals ?? 0}
                        duration={1.9}
                        className={cn(
                          "font-mega leading-none tabular-nums text-[clamp(32px,5.2vw,64px)]",
                          heroHot ? "text-racing-num" : "text-titanium-num",
                        )}
                      />
                      {c.unit && <span className="text-[13px] font-medium text-[#8e959d]">{c.unit}</span>}
                    </p>
                  ) : (
                    /* text values (Автоматична, Задно…) are sized to always fit the
                       capsule — smaller than the big numerals, wrapping if needed. */
                    <p className="text-titanium-num font-mega mt-6 hyphens-auto break-words leading-[1.02] text-[clamp(19px,4.4vw,34px)] md:mt-8">{c.text}</p>
                  )}
                  <p className="mt-3 text-[10.5px] font-semibold uppercase tracking-[0.16em] text-fg-subtle md:mt-4">{c.label}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
