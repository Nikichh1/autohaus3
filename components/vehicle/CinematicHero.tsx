"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, Phone, ShieldCheck, Check, KeyRound } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import type { Vehicle } from "@/types";
import { displayPrice, formatNumber, formatPriceEUR } from "@/lib/utils";
import { fuelLabels, transmissionLabels } from "@/lib/labels";
import { Magnetic } from "@/components/fx/Magnetic";
import { SplitText } from "@/components/motion/SplitText";
import { VehicleStage } from "@/components/vehicle/VehicleStage";
import { EngineSoundPlayer } from "@/components/vehicle/EngineSoundPlayer";

const EASE = [0.16, 1, 0.3, 1] as const;

export function CinematicHero({
  vehicle,
  monthly,
  collLabel,
  phone,
}: {
  vehicle: Vehicle;
  monthly: number;
  collLabel: string;
  phone: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const fullLabel = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const telHref = `tel:${phone.replace(/\s/g, "")}`;
  const recLabel = `● REC · ${vehicle.year} · ${formatNumber(vehicle.mileage)} KM`;
  const subtitle = [
    vehicle.variant || vehicle.bodyType,
    vehicle.engineCC ? `${(vehicle.engineCC / 1000).toFixed(1)}L` : null,
    fuelLabels[vehicle.fuelType],
    transmissionLabels[vehicle.transmission],
  ].filter(Boolean).join(" · ");

  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const ghostX = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);

  return (
    <section
      ref={ref}
      className="vd-dark relative overflow-hidden px-6 pb-14 pt-28 md:px-8 md:pt-32"
      style={{ background: "radial-gradient(135% 90% at 50% -10%,#20242c 0%,#14171c 44%,#0a0c10 100%)" }}
    >
      {/* Ghost watermark */}
      <motion.div
        aria-hidden
        style={{ x: ghostX }}
        className="text-stroke pointer-events-none absolute left-[-2%] top-12 z-0 select-none whitespace-nowrap font-mega text-[clamp(110px,24vw,330px)] leading-[0.8]"
      >
        {vehicle.brand} {vehicle.model}
      </motion.div>

      <div className="relative z-[2] mx-auto max-w-[1320px]">
        {/* Telemetry breadcrumb */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-fg-subtle">
          <nav aria-label="Навигация" className="text-fg-muted">
            <Link href="/" className="transition-colors hover:text-fg">Начало</Link>
            <span className="px-1.5 opacity-40">/</span>
            <Link href="/avtomobili" className="transition-colors hover:text-fg">Автомобили</Link>
            <span className="px-1.5 opacity-40">/</span>
            <span className="text-accent">{vehicle.brand} {vehicle.model}</span>
          </nav>
          <span className="hidden lg:block">BG · ПЛОВДИВ · 42.14°N 24.75°E</span>
        </div>

        <div className="grid grid-cols-1 items-end gap-10 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
          {/* LEFT — identity */}
          <div>
            <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="mb-5 flex items-center gap-2.5">
              <span className="size-[7px] rounded-full bg-accent" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-fg-muted">[ 01 — {collLabel || "AutoHaus"} Collection ]</span>
            </motion.div>

            <h1 className="font-mega text-[clamp(58px,10vw,150px)] leading-[0.86] text-fg">
              <SplitText text={vehicle.model} />
            </h1>
            {subtitle && (
              <motion.p initial={reduce ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-4 text-[clamp(15px,1.6vw,18px)] font-medium text-fg-muted">
                {subtitle}
              </motion.p>
            )}

            <motion.div initial={reduce ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.5 }}>
              <div className="mt-8 flex flex-wrap items-baseline gap-x-6 gap-y-2.5">
                <span className="text-titanium-num font-mega text-[clamp(38px,4.6vw,60px)] leading-none">{displayPrice(vehicle.price)}</span>
                {monthly > 0 && (
                  <a href="#financing" className="inline-flex items-center gap-1.5 text-[13px] font-medium text-fg-muted transition-colors hover:text-accent">
                    ≈ {formatPriceEUR(monthly)} / мес
                    <ChevronRight className="size-3.5" aria-hidden />
                  </a>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Magnetic strength={0.3} className="min-w-[200px] flex-1">
                  <a href="#inquiry" className="ah-sheen flex h-14 w-full items-center justify-center gap-2 rounded-[2px] bg-[#e7eaed] text-sm font-bold text-[#0a0c10] transition-transform hover:-translate-y-0.5">
                    Запази оглед
                  </a>
                </Magnetic>
                <a href={telHref} className="inline-flex h-14 items-center justify-center gap-2 rounded-[2px] border border-line-strong px-6 text-sm font-semibold text-fg transition-colors hover:border-accent">
                  <Phone className="size-4" aria-hidden /> Обади се
                </a>
              </div>

              <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[12.5px] text-fg-muted">
                <span className="inline-flex items-center gap-2"><ShieldCheck className="size-[15px] text-accent" strokeWidth={1.7} aria-hidden /> Писмена гаранция</span>
                <span className="inline-flex items-center gap-2"><Check className="size-[15px] text-accent" strokeWidth={2} aria-hidden /> Проверена история</span>
                {vehicle.rentalPerDay !== undefined && (
                  <span className="inline-flex items-center gap-2"><KeyRound className="size-[15px] text-accent" strokeWidth={1.7} aria-hidden /> Под наем · {formatNumber(vehicle.rentalPerDay)} €/ден</span>
                )}
              </div>
            </motion.div>
          </div>

          {/* RIGHT — stage + engine */}
          <motion.div initial={reduce ? false : { opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.3, ease: EASE }}>
            <VehicleStage images={vehicle.images} alt={fullLabel} recLabel={recLabel} />
            {vehicle.engineSound && (
              <div className="vd-cut carbon mt-4 border border-line-strong p-1.5">
                <EngineSoundPlayer sound={vehicle.engineSound} accent compact title="Чуйте двигателя" subtitle="истински запис" className="bg-transparent" />
              </div>
            )}
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="mt-12 flex items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-fg-subtle">
          <span className="vd-scrollcue block h-9 w-px" style={{ background: "linear-gradient(180deg,#c9cfd6,transparent)" }} />
          Скрол
        </div>
      </div>
    </section>
  );
}
