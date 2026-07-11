"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, animate, useMotionValue, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Gauge, Calendar, Fuel } from "lucide-react";
import type { Vehicle } from "@/types";
import { displayPrice, formatNumber } from "@/lib/utils";
import { fuelLabels } from "@/lib/labels";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";
import { Magnetic } from "@/components/fx/Magnetic";
import { usePageTransition } from "@/components/transition/PageTransition";
import { useThemeMorph } from "@/components/fx/ScrollThemeMorph";

type CollectionCopy = { eyebrow: string; heading: string; subcopy: string };
type Props = { vehicles: Vehicle[]; total: number; copy?: CollectionCopy };

const DEFAULT_COPY: CollectionCopy = {
  eyebrow: "01 · Подбрани от нас",
  heading: "Колекция",
  subcopy:
    "Малка по обем, безкомпромисна по подбор. Всеки автомобил — проверен, с история и готов за пътя.",
};

/**
 * Chapter 03 — The Collection.
 *
 * A modern editorial bento: one wide feature card leads, the rest tile in an
 * asymmetric grid, and a dark CTA tile closes it. Every card is photography-
 * first with machined corner ticks, a glass price plate and a spec row that
 * lifts into focus on hover — engineered detailing over soft frames. No
 * scroll-hijack: a plain, robust, fully responsive grid that reflows to a clean
 * single column on phones (compact, not shrunk).
 */

// lg column spans (6-col grid): [4,2] · [2,2,2] · [2, CTA 4] tiles perfectly for
// the common 6-car feature set; fixed auto-rows keep every cell equal height.
const SPANS = ["lg:col-span-4", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2", "lg:col-span-2"];

export function CollectionGallery({ vehicles, total, copy = DEFAULT_COPY }: Props) {
  // When inside the scroll-morph zone, the theme (background + all tokens) is
  // driven by the wrapper, so we drop the static `.light`/`bg-[#eef0f2]` and go
  // TRANSPARENT — the wrapper's GPU-composited pane paints the morphing
  // background behind us (opacity crossfade, no per-frame repaint of this tall
  // section). The `data-rail-theme` keeps the chapter rail contrasting
  // correctly even without the `.light` class it used to sniff for.
  const active = useThemeMorph()?.active ?? false;
  if (!vehicles.length) return null;
  const remaining = Math.max(total - vehicles.length, 0);

  return (
    <section
      data-chapter="01"
      data-chapter-label="Колекция"
      data-rail-theme="light"
      // Phones drop the sheet's pull-up: the opening is a single screen there,
      // and a white sliver riding over its letterbox reads as a glitch.
      className={`sheet relative -mt-[10vh] py-16 max-md:mt-0 md:py-[13vh] ${
        active ? "" : "light bg-[#eef0f2]"
      }`}
    >
      <div className="mx-auto max-w-wide px-5 sm:px-8 md:px-12">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <FadeIn>
              <p className="label-fine text-fg-subtle">
                <span aria-hidden className="mr-2 text-racing">[</span>
                {copy.eyebrow}
                <span aria-hidden className="ml-2 text-racing">]</span>
              </p>
            </FadeIn>
            <Reveal>
              <h2 className="mt-4 font-display text-[clamp(2.4rem,4.6vw,4.4rem)] font-extrabold leading-[0.94] tracking-[-0.035em] text-fg">
                {copy.heading}<span className="text-racing">.</span>
              </h2>
            </Reveal>
            <FadeIn delay={0.1}>
              <p className="mt-5 max-w-md text-fg-muted md:text-lg">
                {copy.subcopy}
              </p>
            </FadeIn>
          </div>
          {/* Gate on the WRAPPER: `hidden` merged into the button's own class
              list loses to its `inline-flex` in the stylesheet order, which
              leaked this desktop pill onto phones (a duplicate CTA). */}
          <FadeIn delay={0.15} className="hidden md:block">
            <ViewAllLink total={total} />
          </FadeIn>
        </div>

        {/* Bento grid — fixed row height on lg so every cell is equal and gap-free */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 md:mt-12 md:gap-5 lg:grid-cols-6 lg:auto-rows-[clamp(14rem,19vw,18rem)]">
          {vehicles.map((v, i) => (
            <FadeIn
              key={v.id}
              y={26}
              delay={(i % 3) * 0.07}
              className={`h-full ${SPANS[i] ?? "lg:col-span-2"} ${i === 0 ? "sm:col-span-2" : ""}`}
            >
              <VehicleTile v={v} feature={i === 0} />
            </FadeIn>
          ))}

          {/* Closing CTA tile — fills the last cell of the bento */}
          <FadeIn y={26} delay={0.1} className="h-full sm:col-span-2 lg:col-span-4">
            <CtaTile remaining={remaining} total={total} />
          </FadeIn>
        </div>

        {/* The closing bento CTA tile already carries the mobile "view all"
            action; a second pill here only duplicated it AND sat in the seam
            where the next section's sheet rides up over it. */}
      </div>
    </section>
  );
}

function VehicleTile({ v, feature }: { v: Vehicle; feature?: boolean }) {
  // The dyno pull — hover a machine and its power figure runs up from zero
  // like a dyno readout settling. The number enthusiasts read first, alive.
  const [dyno, setDyno] = useState(false);
  return (
    <Link
      href={`/avtomobili/${v.slug}`}
      data-cursor="view"
      onMouseEnter={() => setDyno(true)}
      onMouseLeave={() => setDyno(false)}
      className="group relative block h-full"
    >
      <div className="sheen edge-light relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-elevated shadow-luxe transition-shadow duration-500 group-hover:shadow-[0_40px_90px_-40px_rgba(10,12,16,0.55)] sm:aspect-[16/11] lg:aspect-auto lg:h-full">
        <Image
          src={v.images[0]}
          alt={`${v.brand} ${v.model}`}
          fill
          sizes={feature ? "(min-width:1024px) 46vw, 100vw" : "(min-width:1024px) 30vw, (min-width:640px) 50vw, 100vw"}
          className="object-cover transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05]"
        />
        {/* legibility gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />
        {/* machined corner ticks — engineered counter to the soft frame */}
        <span aria-hidden className="absolute left-4 top-4 size-7 border-l border-t border-white/40" />
        <span aria-hidden className="absolute bottom-4 right-4 size-7 border-b border-r border-white/40" />

        {/* top row: brand chip + arrow */}
        <div className="absolute inset-x-4 top-4 flex items-start justify-between">
          <span className="rounded-full border border-white/20 bg-black/35 px-3 py-1 backdrop-blur-md">
            <span className="label-fine text-white/90">{v.brand}</span>
          </span>
          <span className="flex size-9 items-center justify-center rounded-full border border-white/20 bg-black/35 text-white backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
            <ArrowUpRight className="size-4" />
          </span>
        </div>

        {/* bottom: name + price + spec row */}
        <div className="absolute inset-x-0 bottom-0 p-5 md:p-6">
          {/* Phones stack name → price so the pill can never ride over the
              model name on a narrow tile; md+ keeps the original side-by-side
              row (name left, price right, aligned to the same baseline). */}
          <div className="flex flex-col items-start gap-2.5 md:flex-row md:items-end md:justify-between md:gap-3">
            <div className="min-w-0 max-md:w-full">
              <p className="label-fine text-white/60">{v.year}</p>
              {/* Phones wrap to two lines instead of chopping the model name
                  ("Range Rove…"); md+ keeps the original single-line truncate. */}
              <p
                className={`mt-1 font-display font-extrabold tracking-tight text-white max-md:line-clamp-2 max-md:leading-[1.05] md:truncate ${
                  feature ? "text-3xl md:text-4xl" : "text-2xl"
                }`}
              >
                {v.model}
              </p>
            </div>
            {/* literal ink — `text-ink` flips light inside .light sections */}
            <span className="shrink-0 rounded-full bg-white/95 px-3.5 py-1.5 font-display text-sm font-bold text-[#08090c] shadow-lg">
              {displayPrice(v.price)}
            </span>
          </div>

          {/* spec row — always readable, brightens + lifts on hover */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-white/15 pt-3 text-white/75 transition-all duration-500 group-hover:text-white">
            <span className="flex items-center gap-1.5 text-xs font-medium tabular-nums">
              <Gauge className="size-3.5 opacity-70" strokeWidth={1.8} aria-hidden />
              <DynoPower hp={v.power} active={dyno} />
            </span>
            <SpecChip Icon={Calendar} label={`${formatNumber(v.mileage)} км`} />
            <SpecChip Icon={Fuel} label={fuelLabels[v.fuelType]} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function SpecChip({ Icon, label }: { Icon: typeof Gauge; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium">
      <Icon className="size-3.5 opacity-70" strokeWidth={1.8} aria-hidden />
      {label}
    </span>
  );
}

/** The power figure runs 0 → hp on hover, fast rise with a soft settle —
 *  a dyno readout, not a tooltip. Motion-value driven: no re-renders. */
function DynoPower({ hp, active }: { hp: number; active: boolean }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(hp);
  const text = useTransform(mv, (v) => `${Math.round(v)} к.с.`);
  useEffect(() => {
    if (!active || reduce) return;
    mv.set(0);
    const ctrl = animate(mv, hp, { duration: 0.8, ease: [0.16, 0.9, 0.25, 1] });
    return () => {
      ctrl.stop();
      mv.set(hp);
    };
  }, [active, hp, mv, reduce]);
  return <motion.span>{text}</motion.span>;
}

function CtaTile({ remaining, total }: { remaining: number; total: number }) {
  const { navigate } = usePageTransition();
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => navigate("/avtomobili")}
      onPointerEnter={() => router.prefetch("/avtomobili")}
      onFocus={() => router.prefetch("/avtomobili")}
      aria-label={`Разгледайте всички ${total} автомобила`}
      className="carbon group relative flex aspect-[16/11] w-full flex-col justify-between overflow-hidden rounded-xl border border-white/10 p-6 text-left shadow-luxe md:p-7 lg:aspect-auto lg:h-full"
    >
      {/* sheen sweep on hover */}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.1)_50%,transparent_58%)] transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full"
      />
      <div className="relative">
        <p className="label-fine text-white/50">Колекцията продължава</p>
        <p className="mt-3 font-display text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold leading-[0.98] tracking-[-0.03em] text-white">
          Още {remaining} автомобила
          <span className="block font-medium text-white/55">ви очакват.</span>
        </p>
      </div>
      <div className="relative flex items-center gap-3">
        <span className="inline-flex h-12 items-center gap-2.5 rounded-full bg-white pl-5 pr-2 font-display text-sm font-bold text-[#08090c] transition-transform duration-150 group-active:scale-[0.97]">
          Разгледайте всички
          <span className="flex size-8 items-center justify-center rounded-full bg-[#08090c] text-white">
            <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </button>
  );
}

function ViewAllLink({ total, className = "" }: { total: number; className?: string }) {
  const { navigate } = usePageTransition();
  const router = useRouter();
  return (
    <Magnetic strength={0.14}>
      <button
        type="button"
        onClick={() => navigate("/avtomobili")}
        onPointerEnter={() => router.prefetch("/avtomobili")}
        onFocus={() => router.prefetch("/avtomobili")}
        className={`group inline-flex items-center gap-2.5 rounded-full border border-fg/15 bg-white/60 px-5 py-3 font-display text-sm font-bold tracking-tight text-fg backdrop-blur transition-colors hover:border-fg/30 ${className}`}
      >
        Всички {total} автомобила
        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
      </button>
    </Magnetic>
  );
}
