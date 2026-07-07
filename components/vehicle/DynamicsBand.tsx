"use client";

import { Timer, Gauge, Zap, Activity, Cog, Fuel, GaugeCircle, Droplet } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Vehicle } from "@/types";
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
};

/**
 * Dynamics band — the figures a driver reads first, as a row of machined
 * capsules with numbers that spin up on scroll. Compact and visual, it turns
 * the spec sheet into the moment enthusiasts came for, without a wall of rows.
 * Renders only the stats a given car actually has (min. two).
 */
export function DynamicsBand({ vehicle }: { vehicle: Vehicle }) {
  // Prioritise the pure-performance numbers, then fall back to the
  // dynamics-adjacent specs every car has, so the band always reads full
  // (four capsules) rather than sparse when a car lacks 0–100 / top-speed data.
  const caps: (Capsule | null)[] = [
    vehicle.acceleration ? { Icon: Timer, label: "0–100 км/ч", to: vehicle.acceleration, decimals: 1, unit: "с" } : null,
    vehicle.topSpeed ? { Icon: Gauge, label: "Макс. скорост", to: vehicle.topSpeed, unit: "км/ч" } : null,
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
      className="vd-dark edge-light relative overflow-hidden border-t border-line px-6 py-[clamp(56px,8vh,110px)] md:px-8"
      style={{ background: "radial-gradient(130% 120% at 50% -20%,#1b1f26 0%,#111419 55%,#0b0d12 100%)" }}
    >
      {/* ghost watermark */}
      <span
        aria-hidden
        className="pointer-events-none absolute -right-4 top-2 select-none font-mega text-[26vw] leading-none tracking-tighter text-white/[0.02] md:text-[16vw]"
      >
        01
      </span>

      <div className="relative mx-auto max-w-[1320px]">
        <div className="mb-[clamp(28px,4vh,48px)] flex flex-wrap items-end justify-between gap-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">[ 01 — Динамика ]</p>
          <p className="max-w-[300px] text-[13px] leading-relaxed text-fg-muted">
            Заводски стойности — характерът на този автомобил, в цифри.
          </p>
        </div>

        <div className={`grid gap-3 md:gap-4 ${capsules.length >= 4 ? "grid-cols-2 lg:grid-cols-4" : capsules.length === 3 ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2"}`}>
          {capsules.map((c, i) => (
            <FadeIn key={c.label} delay={i * 0.07} y={22}>
              <div className="sheen group relative h-full overflow-hidden rounded-[3px] border border-line-strong bg-white/[0.02] p-4 transition-colors duration-500 hover:border-accent/45 md:p-6">
                {/* corner tick */}
                <span aria-hidden className="absolute right-3.5 top-3.5 size-5 border-r border-t border-white/15 transition-colors duration-500 group-hover:border-accent/50 md:right-4 md:top-4" />
                <c.Icon className="size-5 text-accent" strokeWidth={1.6} aria-hidden />
                {c.to !== undefined ? (
                  <p className="mt-6 flex items-baseline gap-1.5 md:mt-8">
                    <StatCounter
                      to={c.to}
                      decimals={c.decimals ?? 0}
                      duration={1.9}
                      className="text-titanium-num font-mega leading-none tabular-nums text-[clamp(32px,5.2vw,64px)]"
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
          ))}
        </div>
      </div>
    </section>
  );
}
