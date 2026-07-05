"use client";

import { useEffect, useRef } from "react";
import { motion, animate, useMotionValue, useInView, useReducedMotion } from "framer-motion";
import { ShieldCheck, Gauge, FileCheck, Wrench } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { StatCounter } from "@/components/motion/StatCounter";
import { ButtonLink } from "@/components/ui/Button";
import { ease } from "@/lib/motion";

const standards = [
  {
    n: "01",
    Icon: ShieldCheck,
    title: "Писмена гаранция",
    body: "Ясни условия в писмен вид — спокойствие, което започва от подписа, не от обещанието.",
  },
  {
    n: "02",
    Icon: Gauge,
    title: "Мултиточкова проверка",
    body: "Над 100 точки техническа диагностика. Нито един автомобил не влиза в залата без нея.",
  },
  {
    n: "03",
    Icon: FileCheck,
    title: "Проверена история",
    body: "Произход, обслужване и автентичен пробег — документирани и проверими.",
  },
  {
    n: "04",
    Icon: Wrench,
    title: "Всичко под един покрив",
    body: "Лизинг, застраховки, сервиз и Auto Spa — грижата продължава дълго след покупката.",
  },
];

const proof: { to: number; suffix: string; label: string }[] = [
  { to: 100, suffix: "+", label: "точки техническа диагностика" },
  { to: 20, suffix: "+", label: "години една репутация" },
  { to: 4800, suffix: "+", label: "автомобила, доставени по този стандарт" },
];

/**
 * Chapter 06 — The Standard, presented as the engineering certificate it is:
 * technical-drawing paper, a corner-ticked frame, a live diagnostic gauge that
 * sweeps to 100+ as it enters view, the four guarantees as machined rows, and
 * a rotating inspection seal. Trust rendered as instrumentation, not slogans.
 */
export function StandardScene() {
  return (
    <section
      data-chapter="05"
      data-chapter-label="Стандартът"
      className="sheet light relative -mt-[8vh] overflow-hidden bg-[#edeef1] py-16 md:py-[14vh]"
    >
      {/* technical-drawing frame */}
      <div aria-hidden className="pointer-events-none absolute inset-4 hidden border border-fg/[0.07] md:inset-6 md:block">
        <span className="absolute -left-px -top-px h-6 w-6 border-l-2 border-t-2 border-fg/25" />
        <span className="absolute -right-px -top-px h-6 w-6 border-r-2 border-t-2 border-fg/25" />
        <span className="absolute -bottom-px -left-px h-6 w-6 border-b-2 border-l-2 border-fg/25" />
        <span className="absolute -bottom-px -right-px h-6 w-6 border-b-2 border-r-2 border-fg/25" />
      </div>
      <span
        aria-hidden
        className="pointer-events-none absolute right-[-2%] top-[4%] hidden select-none font-display text-[26vw] font-extrabold leading-none tracking-tighter text-fg/[0.028] lg:block"
      >
        05
      </span>

      <div className="relative z-10 mx-auto max-w-wide px-5 sm:px-8 md:px-12">
        <div className="grid gap-x-16 gap-y-14 lg:grid-cols-12">
          {/* Left — the argument + the instrument */}
          <div className="lg:col-span-5">
            <FadeIn>
              <p className="label-fine text-fg-subtle"><span aria-hidden className="mr-2 text-accent">[</span>05 · Стандартът<span aria-hidden className="ml-2 text-accent">]</span></p>
            </FadeIn>
            <Reveal>
              <h2 className="mt-6 font-display text-display-sm font-extrabold leading-[0.96] tracking-tight text-fg md:text-[clamp(2.4rem,4.2vw,4rem)]">
                Един стандарт.
                <span className="block font-medium tracking-[-0.02em] text-fg-muted">без компромис.</span>
              </h2>
            </Reveal>
            <FadeIn delay={0.12}>
              <p className="mt-6 max-w-md text-fg-muted md:text-lg">
                Всеки автомобил — наличен или поръчан — преминава през един и същ
                безкомпромисен процес, преди да получи нов собственик.
              </p>
            </FadeIn>

            {/* The diagnostic gauge */}
            <FadeIn delay={0.18}>
              <DiagnosticGauge />
            </FadeIn>

            <FadeIn delay={0.26}>
              <div className="mt-8">
                <ButtonLink href="/za-nas" variant="ghost" size="md" arrow>
                  Повече за нас
                </ButtonLink>
              </div>
            </FadeIn>
          </div>

          {/* Right — the four guarantees */}
          <div className="relative lg:col-span-7">
            <ul>
              {standards.map((s, i) => (
                <FadeIn key={s.n} delay={i * 0.07}>
                  <li className="group relative flex items-start gap-6 border-b border-line py-7 transition-colors duration-300 first:border-t hover:bg-fg/[0.025] md:-mx-5 md:px-5">
                    <span
                      aria-hidden
                      className="absolute bottom-0 left-0 h-px w-0 bg-fg/40 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-full"
                    />
                    <span className="mt-1 w-12 shrink-0 font-display text-2xl font-semibold tabular-nums text-fg-subtle transition-colors duration-300 group-hover:text-fg md:text-3xl">
                      {s.n}
                    </span>
                    <div className="flex-1 transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1">
                      <div className="flex items-center justify-between gap-4">
                        <h3 className="font-display text-xl font-bold tracking-tight text-fg">
                          {s.title}
                        </h3>
                        <s.Icon
                          className="size-5 shrink-0 text-fg-subtle transition-colors duration-300 group-hover:text-fg"
                          strokeWidth={1.5}
                          aria-hidden
                        />
                      </div>
                      <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">
                        {s.body}
                      </p>
                    </div>
                  </li>
                </FadeIn>
              ))}
            </ul>

            {/* rotating inspection seal */}
            <div aria-hidden className="pointer-events-none absolute -bottom-6 right-0 hidden lg:block">
              <InspectionSeal />
            </div>
          </div>
        </div>

        {/* Proof in numbers */}
        <FadeIn>
          <div className="mt-16 grid gap-y-10 border-t border-line-strong pt-10 sm:grid-cols-3 sm:gap-x-8 md:mt-24 md:pt-12">
            {proof.map((p) => (
              <div key={p.label}>
                <p className="font-display text-4xl font-extrabold leading-none tracking-tight text-fg md:text-5xl xl:text-6xl">
                  <StatCounter to={p.to} suffix={p.suffix} duration={2.2} />
                </p>
                <p className="mt-3 max-w-[16rem] text-xs uppercase leading-relaxed tracking-wider text-fg-muted">
                  {p.label}
                </p>
              </div>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/** Semi-circular gauge — needle sweeps and the arc fills as it enters view. */
function DiagnosticGauge() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const on = reduce || inView;

  const ticks = Array.from({ length: 11 }, (_, i) => {
    const a = Math.PI - (i / 10) * Math.PI; // 180° → 0°
    const x1 = 140 + 112 * Math.cos(a);
    const y1 = 150 - 112 * Math.sin(a);
    const x2 = 140 + 122 * Math.cos(a);
    const y2 = 150 - 122 * Math.sin(a);
    return [x1, y1, x2, y2] as const;
  });

  return (
    <div ref={ref} className="relative mt-10 max-w-[300px]">
      <svg viewBox="0 0 280 170" fill="none" aria-hidden className="w-full text-fg">
        {/* track */}
        <path d="M36 150 A104 104 0 0 1 244 150" stroke="currentColor" strokeOpacity={0.12} strokeWidth={3} />
        {/* fill sweeps with the needle */}
        <motion.path
          d="M36 150 A104 104 0 0 1 244 150"
          stroke="currentColor"
          strokeWidth={3}
          initial={reduce ? { pathLength: 0.94 } : { pathLength: 0 }}
          animate={on ? { pathLength: 0.94 } : {}}
          transition={{ duration: 1.8, ease: ease.entrance, delay: 0.2 }}
        />
        {ticks.map(([x1, y1, x2, y2], i) => (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={0.3} strokeWidth={1.5} />
        ))}
        {/* needle — rotated via the SVG attribute about the exact hub point
            (CSS transform-origin on SVG groups is unreliable) */}
        <GaugeNeedle on={on} reduce={!!reduce} />
        <circle cx={140} cy={150} r={5} fill="currentColor" />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
        <p className="font-display text-3xl font-extrabold leading-none text-fg md:text-4xl">
          <StatCounter to={100} suffix="+" duration={1.9} />
        </p>
        <p className="label-fine mt-1.5 text-fg-muted">точки диагностика</p>
      </div>
    </div>
  );
}

/** Slow-rotating "inspection seal" — circular type around the monogram idea. */
function InspectionSeal() {
  return (
    <div className="vd-spin size-28 opacity-60">
      <svg viewBox="0 0 120 120" fill="none" className="size-full text-fg">
        <defs>
          <path id="sealCircle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <circle cx={60} cy={60} r={57} stroke="currentColor" strokeOpacity={0.35} />
        <circle cx={60} cy={60} r={33} stroke="currentColor" strokeOpacity={0.35} />
        <text className="fill-current" style={{ fontSize: 10.5, letterSpacing: "0.32em", textTransform: "uppercase" }}>
          <textPath href="#sealCircle">
            Аутохаус · Проверен стандарт · Пловдив ·
          </textPath>
        </text>
      </svg>
    </div>
  );
}

/** Gauge needle — SVG-attribute rotation about the hub (140,150); sweeps in
 *  with a physical ease when the certificate enters view. */
function GaugeNeedle({ on, reduce }: { on: boolean; reduce: boolean }) {
  const ref = useRef<SVGGElement>(null);
  const angle = useMotionValue(reduce ? 79 : -90);
  useEffect(() => {
    const apply = (v: number) =>
      ref.current?.setAttribute("transform", `rotate(${v} 140 150)`);
    apply(angle.get());
    const unsub = angle.on("change", apply);
    if (reduce) {
      angle.set(79);
      return unsub;
    }
    if (on) {
      const ctrl = animate(angle, 79, { duration: 1.8, ease: ease.entrance, delay: 0.2 });
      return () => {
        unsub();
        ctrl.stop();
      };
    }
    return unsub;
  }, [on, reduce, angle]);
  return (
    <g ref={ref}>
      <line x1={140} y1={150} x2={140} y2={62} stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" />
    </g>
  );
}
