"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
  useMotionValue,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import type { Vehicle } from "@/types";
import { displayPrice, formatNumber } from "@/lib/utils";
import { Magnetic } from "@/components/fx/Magnetic";
import { usePageTransition } from "@/components/transition/PageTransition";

type Props = { vehicles: Vehicle[]; total: number };

/* Track geometry in vw — title panel, cards, closing CTA panel. */
const TITLE_VW = 46;
const CARD_VW = 54;
const GAP_VW = 5;
const CTA_VW = 92;

/**
 * Chapter 03 — The Collection as a horizontal journey.
 *
 * On desktop the page stops scrolling down and starts driving sideways: a
 * pinned track carries the chapter title, then each machine as a full film
 * panel gliding past — ghost indices, oversized type, photography first — and
 * ends on the invitation into the full inventory. A progress rail and counter
 * keep the viewer oriented. On mobile the same panels become a native
 * snap-scroll gallery: designed for the thumb, not shrunk from the desktop.
 */
export function CollectionGallery({ vehicles, total }: Props) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const n = vehicles.length;

  const trackVw = TITLE_VW + n * (CARD_VW + GAP_VW) + CTA_VW;
  const travel = Math.max(trackVw - 100, 0);

  const { scrollYProgress: p } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const x = useTransform(p, [0, 1], ["0vw", `-${travel}vw`]);
  const barScaleX = useTransform(p, [0, 1], [0, 1]);
  const counter = useTransform(p, (v) =>
    String(Math.min(n, Math.max(1, Math.round(v * (n - 1)) + 1))).padStart(2, "0"),
  );

  if (!n) return null;

  return (
    <section
      ref={ref}
      data-chapter="03"
      data-chapter-label="Колекция"
      className="sheet light relative -mt-[10vh] bg-[#eef0f2]"
      style={{ height: reduce ? "auto" : undefined }}
    >
      {/* ── Desktop: pinned horizontal drive ── */}
      <div
        className="hidden lg:block"
        style={{ height: reduce ? "auto" : `calc(${travel}vw + 100vh)` }}
      >
        <div
          data-cursor="scroll"
          className={reduce ? "relative overflow-hidden py-[14vh]" : "sticky top-0 h-screen overflow-hidden"}
        >
          <motion.div
            style={reduce ? undefined : { x }}
            className={
              reduce
                ? "flex flex-wrap gap-10 px-12"
                : "flex h-full items-center pl-12"
            }
          >
            {/* Title panel */}
            <div style={{ width: reduce ? "100%" : `${TITLE_VW}vw` }} className="shrink-0 pr-[6vw]">
              <p className="label-fine flex items-center gap-3 text-fg-subtle">
                <span aria-hidden className="text-fg/40">[</span>
                03 · Подбрани от нас
                <span aria-hidden className="text-fg/40">]</span>
              </p>
              <h2 className="mt-6 font-display text-[clamp(3.4rem,7vw,7.5rem)] font-extrabold leading-[0.92] tracking-[-0.04em] text-fg">
                Колекция<span className="text-fg-muted">.</span>
              </h2>
              <p className="mt-6 max-w-sm text-fg-muted md:text-lg">
                Малка по обем, безкомпромисна по подбор. Всеки автомобил —
                проверен, с история и готов за пътя.
              </p>
              <p className="label-fine mt-10 flex items-center gap-3 text-fg-subtle">
                Скролирайте
                <ArrowRight className="size-4" aria-hidden />
              </p>
            </div>

            {/* Car panels */}
            {vehicles.map((v, i) => (
              <GalleryPanel key={v.id} v={v} i={i} width={`${CARD_VW}vw`} gap={`${GAP_VW}vw`} />
            ))}

            {/* Closing CTA panel */}
            <div style={{ width: reduce ? "100%" : `${CTA_VW}vw` }} className="flex shrink-0 items-center justify-center">
              <EndCta total={total} />
            </div>
          </motion.div>

          {/* progress rail + live counter */}
          {!reduce && (
            <div className="pointer-events-none absolute inset-x-12 bottom-9 flex items-center gap-6">
              <span className="font-display text-sm font-bold tabular-nums text-fg">
                <motion.span>{counter}</motion.span>
                <span className="text-fg-subtle"> / {String(n).padStart(2, "0")}</span>
              </span>
              <div className="h-px flex-1 bg-fg/15">
                <motion.div style={{ scaleX: barScaleX }} className="h-full origin-left bg-fg" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Mobile: designed as a hand-held gallery ── */}
      <div className="py-[13vh] lg:hidden">
        <div className="px-5 sm:px-8">
          <p className="label-fine text-fg-subtle">[ 03 · Подбрани от нас ]</p>
          <h2 className="mt-4 font-display text-[clamp(2.3rem,10vw,4.2rem)] font-extrabold leading-[0.92] tracking-[-0.035em] text-fg">
            Колекция<span className="text-fg-muted">.</span>
          </h2>
        </div>
        <div className="no-scrollbar mt-9 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 sm:px-8">
          {vehicles.map((v, i) => (
            <div key={v.id} className="w-[76vw] max-w-sm shrink-0 snap-center">
              <MobileCard v={v} i={i} />
            </div>
          ))}
          <div className="flex w-[76vw] max-w-sm shrink-0 snap-center items-center justify-center rounded-[1.25rem] border border-line-strong">
            <EndCta total={total} compact />
          </div>
        </div>
      </div>
    </section>
  );
}

function GalleryPanel({ v, i, width, gap }: { v: Vehicle; i: number; width: string; gap: string }) {
  // Material tilt + glare: the panel leans toward the pointer like a plate of
  // glass being examined, a specular spot tracking the hand. Mouse-only.
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rX = useSpring(useTransform(my, [0, 1], [3.5, -3.5]), { stiffness: 160, damping: 18 });
  const rY = useSpring(useTransform(mx, [0, 1], [-4.5, 4.5]), { stiffness: 160, damping: 18 });
  const gx = useTransform(mx, (v2) => v2 * 100);
  const gy = useTransform(my, (v2) => v2 * 100);
  const glare = useMotionTemplate`radial-gradient(380px circle at ${gx}% ${gy}%, rgba(255,255,255,0.13), transparent 62%)`;
  const onMove = (e: React.MouseEvent) => {
    const r = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - r.left) / r.width);
    my.set((e.clientY - r.top) / r.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <div style={{ width, marginRight: gap }} className="relative shrink-0 [perspective:1000px]">
      <span
        aria-hidden
        className="pointer-events-none absolute -top-[1.15em] left-[-0.06em] select-none font-display text-[8rem] font-extrabold leading-none tracking-tighter text-fg/[0.05]"
      >
        {String(i + 1).padStart(2, "0")}
      </span>
      <Link
        href={`/avtomobili/${v.slug}`}
        data-cursor="view"
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        className="group relative block"
      >
        <motion.div
          style={{ rotateX: rX, rotateY: rY, transformStyle: "preserve-3d" }}
          className="img-zoom sheen edge-light relative aspect-[16/10] overflow-hidden rounded-xl bg-elevated shadow-luxe"
        >
          <motion.div
            aria-hidden
            style={{ background: glare }}
            className="pointer-events-none absolute inset-0 z-10"
          />
          <Image
            src={v.images[0]}
            alt={`${v.brand} ${v.model}`}
            fill
            sizes="54vw"
            className="object-cover"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          {/* machined corner ticks — the engineered counter to the soft frame */}
          <span aria-hidden className="absolute left-4 top-4 size-7 border-l border-t border-white/35" />
          <span aria-hidden className="absolute bottom-4 right-4 size-7 border-b border-r border-white/35" />
          {/* price plate */}
          <div className="absolute bottom-5 left-5 rounded-full bg-black/45 px-4 py-2 backdrop-blur-md">
            <span className="font-display text-base font-bold text-white">{displayPrice(v.price)}</span>
          </div>
          <ArrowUpRight
            aria-hidden
            className="absolute right-5 top-5 size-6 text-white/80 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
          />
        </motion.div>
        <div className="mt-5 flex items-end justify-between gap-6">
          <div className="min-w-0">
            <p className="label-fine text-fg-subtle">
              {v.brand} · {v.year}
            </p>
            <p className="mt-1.5 truncate font-display text-2xl font-extrabold tracking-tight text-fg xl:text-3xl">{v.model}</p>
          </div>
          <p className="label-fine shrink-0 pb-1 text-fg-muted">
            {v.power} к.с. · {formatNumber(v.mileage)} км
          </p>
        </div>
      </Link>
    </div>
  );
}

function MobileCard({ v, i }: { v: Vehicle; i: number }) {
  return (
    <Link href={`/avtomobili/${v.slug}`} className="group block">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.25rem] bg-elevated shadow-luxe">
        <Image
          src={v.images[0]}
          alt={`${v.brand} ${v.model}`}
          fill
          sizes="82vw"
          className="object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
        <span className="absolute left-4 top-3 font-display text-xl font-extrabold tracking-tight text-white/50">
          {String(i + 1).padStart(2, "0")}
        </span>
        <div className="absolute bottom-4 left-4 rounded-full bg-black/45 px-3.5 py-1.5 backdrop-blur-md">
          <span className="font-display text-sm font-bold text-white">{displayPrice(v.price)}</span>
        </div>
      </div>
      <div className="mt-3.5">
        <p className="label-fine text-fg-subtle">
          {v.brand} · {v.year}
        </p>
        <p className="mt-1 truncate font-display text-xl font-extrabold tracking-tight text-fg">{v.model}</p>
        <p className="label-fine mt-1.5 text-fg-muted">
          {v.power} к.с. · {formatNumber(v.mileage)} км
        </p>
      </div>
    </Link>
  );
}

function EndCta({ total, compact }: { total: number; compact?: boolean }) {
  const { navigate } = usePageTransition();
  const router = useRouter();
  return (
    <div className={compact ? "px-6 py-10 text-center" : "text-center"}>
      <p className="label-fine text-fg-subtle">Колекцията продължава</p>
      <p className={`mt-4 font-display font-extrabold tracking-[-0.03em] text-fg ${compact ? "text-2xl" : "text-[clamp(2.2rem,3.8vw,3.8rem)] leading-[0.98]"}`}>
        Още {total} автомобила
        <br />
        <span className="font-medium text-fg-muted">ви очакват.</span>
      </p>
      <div className={compact ? "mt-7" : "mt-9"}>
        <Magnetic strength={0.2}>
          <button
            type="button"
            onClick={() => navigate("/avtomobili")}
            onPointerEnter={() => router.prefetch("/avtomobili")}
            onFocus={() => router.prefetch("/avtomobili")}
            className="group relative inline-flex h-14 items-center gap-3 overflow-hidden rounded-full bg-fg pl-7 pr-3 text-ink shadow-luxe transition-transform duration-150 ease-out active:scale-[0.97] md:h-16 md:pl-9"
          >
            <span
              aria-hidden
              className="absolute inset-0 -translate-x-full bg-[linear-gradient(115deg,transparent_42%,rgba(255,255,255,0.28)_50%,transparent_58%)] transition-transform duration-[1100ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-full"
            />
            <span className="relative z-10 whitespace-nowrap font-display text-sm font-bold tracking-tight md:text-base">
              Разгледайте всички
            </span>
            <span className="relative z-10 flex size-10 items-center justify-center rounded-full bg-ink text-fg md:size-11">
              <ArrowRight className="size-5 transition-transform duration-150 group-hover:translate-x-1" />
            </span>
          </button>
        </Magnetic>
      </div>
    </div>
  );
}
