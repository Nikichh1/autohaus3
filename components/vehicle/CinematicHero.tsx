"use client";

import { useRef } from "react";
import Link from "next/link";
import { ChevronRight, Phone, ShieldCheck, Check, KeyRound, ArrowLeft } from "lucide-react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import type { Vehicle } from "@/types";
import { formatNumber, formatPriceEUR } from "@/lib/utils";
import { fuelLabels, transmissionLabels } from "@/lib/labels";
import { Magnetic } from "@/components/fx/Magnetic";
import { SplitText } from "@/components/motion/SplitText";
import { PriceRoll } from "@/components/vehicle/PriceRoll";
import { ShareButton } from "@/components/vehicle/ShareButton";
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
  // Autohaus R — performance cars carry the racing identity through the hero.
  const hot = vehicle.collection === "performance";

  const fullLabel = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const telHref = `tel:${phone.replace(/\s/g, "")}`;
  const recLabel = `● REC · ${vehicle.year} · ${formatNumber(vehicle.mileage)} KM`;
  const subtitle = [
    vehicle.variant || vehicle.bodyType,
    vehicle.engineCC ? `${(vehicle.engineCC / 1000).toFixed(1)}L` : null,
    fuelLabels[vehicle.fuelType],
    transmissionLabels[vehicle.transmission],
  ]
    .filter(Boolean)
    .join(" · ");
  const overline = collLabel ? `${vehicle.brand} · ${collLabel}` : vehicle.brand;

  // Ghost watermark drifts with scroll (desktop only — off on touch for perf).
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const ghostX = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -120]);

  const gallery = (
    <>
      <VehicleStage images={vehicle.images} alt={fullLabel} recLabel={recLabel} />
      {vehicle.engineSound && (
        <div className={`vd-cut carbon mt-3 border p-1.5 md:mt-4 ${hot ? "border-racing/30" : "border-line-strong"}`}>
          <EngineSoundPlayer
            sound={vehicle.engineSound}
            accent
            hot={hot}
            compact
            title="Чуйте двигателя"
            subtitle="истински запис"
            className="bg-transparent"
          />
        </div>
      )}
    </>
  );

  const identity = (
    <div>
      {/* brand · collection — one refined overline */}
      <motion.p
        initial={reduce ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.05 }}
        className="flex flex-wrap items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-muted"
      >
        <span className={`size-[6px] rounded-full ${hot ? "race-led bg-racing" : "bg-accent"}`} />
        {overline}
        {hot && (
          <span className="inline-flex items-center gap-1.5 rounded-[4px] border border-racing/40 bg-racing/[0.08] px-2 py-0.5 text-[9px] font-bold tracking-[0.16em] text-racing">
            Спортна серия
          </span>
        )}
      </motion.p>

      {/* model — restrained, fills the column and wraps cleanly (2 lines for a
          long name), never clipped. The width comes from the column, not a
          tight ch-cap, so it reads premium rather than oversized. */}
      <h1 className="mt-4 font-mega uppercase leading-[1.04] text-fg text-[clamp(1.9rem,7.6vw,2.7rem)] md:mt-5 md:text-[clamp(2.5rem,4vw,3.9rem)] md:leading-[1.01]">
        <SplitText text={vehicle.model} />
      </h1>

      {subtitle && (
        <motion.p
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-3.5 text-[13px] font-medium text-fg-muted md:mt-4 md:text-[15px]"
        >
          {subtitle}
        </motion.p>
      )}

      <motion.div
        initial={reduce ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.45 }}
      >
        {/* price — rolls into place on load */}
        <div className="mt-7 flex flex-wrap items-baseline gap-x-5 gap-y-2 md:mt-8">
          <PriceRoll
            value={vehicle.price}
            className="font-mega leading-none text-fg text-[clamp(2rem,7vw,2.6rem)] md:text-[clamp(2.4rem,3.4vw,3.4rem)]"
          />
          {monthly > 0 && (
            <a
              href="#financing"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-fg-muted transition-colors hover:text-accent"
            >
              ≈ {formatPriceEUR(monthly)} / мес
              <ChevronRight className="size-3.5" aria-hidden />
            </a>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Magnetic strength={0.3} className="flex-1 sm:min-w-[200px] sm:flex-initial">
            <a
              href="#inquiry"
              className="ah-sheen flex h-14 w-full items-center justify-center gap-2 rounded-[2px] bg-[#e7eaed] text-sm font-bold text-[#0a0c10] transition-transform hover:-translate-y-0.5"
            >
              Запази оглед
            </a>
          </Magnetic>
          <div className="flex gap-3">
            <a
              href={telHref}
              className="inline-flex h-14 flex-1 items-center justify-center gap-2 rounded-[2px] border border-line-strong px-6 text-sm font-semibold text-fg transition-colors hover:border-accent sm:flex-initial"
            >
              <Phone className="size-4" aria-hidden /> Обади се
            </a>
            <ShareButton title={fullLabel} text={`${fullLabel} — ${subtitle}`} />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-[12.5px] text-fg-muted">
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="size-[15px] text-accent" strokeWidth={1.7} aria-hidden /> Писмена гаранция
          </span>
          <span className="inline-flex items-center gap-2">
            <Check className="size-[15px] text-accent" strokeWidth={2} aria-hidden /> Проверена история
          </span>
          {vehicle.rentalPerDay !== undefined && (
            <span className="inline-flex items-center gap-2">
              <KeyRound className="size-[15px] text-accent" strokeWidth={1.7} aria-hidden /> Под наем ·{" "}
              {formatNumber(vehicle.rentalPerDay)} €/ден
            </span>
          )}
        </div>
      </motion.div>
    </div>
  );

  return (
    <section
      ref={ref}
      className="vd-dark relative overflow-hidden px-6 pb-14 pt-24 md:px-8 md:pt-32"
      style={{ background: "radial-gradient(135% 90% at 50% -10%,#20242c 0%,#14171c 44%,#0a0c10 100%)" }}
    >
      {/* Ghost watermark — desktop only */}
      <motion.div
        aria-hidden
        style={{ x: ghostX }}
        className="text-stroke pointer-events-none absolute left-[-2%] top-16 z-0 hidden select-none whitespace-nowrap font-mega text-[clamp(110px,22vw,300px)] leading-[0.8] lg:block"
      >
        {vehicle.brand} {vehicle.model}
      </motion.div>

      <div className="relative z-[2] mx-auto max-w-[1320px]">
        {/* Breadcrumb — compact back on phones, full trail from sm+ */}
        <nav aria-label="Навигация" className="mb-7 md:mb-9">
          <Link
            href="/avtomobili"
            className="inline-flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.14em] text-fg-muted transition-colors hover:text-fg sm:hidden"
          >
            <ArrowLeft className="size-3.5" /> Автомобили
          </Link>
          <span className="hidden items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] sm:inline-flex">
            <Link href="/" className="text-fg-subtle transition-colors hover:text-fg">
              Начало
            </Link>
            <span className="text-fg-subtle/40">/</span>
            <Link href="/avtomobili" className="text-fg-subtle transition-colors hover:text-fg">
              Автомобили
            </Link>
            <span className="text-fg-subtle/40">/</span>
            <span className="max-w-[42ch] truncate text-accent">{vehicle.brand}</span>
          </span>
        </nav>

        {/* Gallery leads on mobile (order-1); sits right on desktop (order-2). */}
        <div className="flex flex-col gap-9 lg:grid lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:items-end lg:gap-14">
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease: EASE }}
            className="order-1 lg:order-2"
          >
            {gallery}
          </motion.div>
          <div className="order-2 lg:order-1">{identity}</div>
        </div>

        {/* Scroll cue (desktop) */}
        <div className="mt-12 hidden items-center gap-3 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-fg-subtle lg:flex">
          <span className="vd-scrollcue block h-9 w-px" style={{ background: "linear-gradient(180deg,#c9cfd6,transparent)" }} />
          Скрол
        </div>
      </div>
    </section>
  );
}
