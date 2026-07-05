"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  useInView,
  useReducedMotion,
} from "framer-motion";
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/fx/Magnetic";
import { StatCounter } from "@/components/motion/StatCounter";
import { ease } from "@/lib/motion";

export type HeroContent = {
  eyebrow: string;
  headline: string;
  subcopy: string;
  ctaPrimary: string;
  ctaSecondary: string;
};

const DEFAULTS: HeroContent = {
  eyebrow: "Пловдив · Дом за премиум автомобили",
  headline: "Колата, която\nви заслужава.",
  subcopy:
    "Не просто автомобил, а начало. Всяка кола в нашата колекция е подбрана и проверена — за да я карате с увереност, не с надежда.",
  ctaPrimary: "Разгледай колекцията",
  ctaSecondary: "Запазете оглед",
};

const TICKER = [
  "AutoHaus · Пловдив",
  "20+ години",
  "4800+ доставени автомобила",
  "35 марки",
  "Издирване и внос",
  "Лизинг · Сервиз · Auto Spa",
];

const STATS: [number, string, string][] = [
  [20, "+", "години"],
  [4800, "+", "автомобила"],
  [35, "", "марки"],
];

/**
 * Chapter 01 — The Stage. The opening film dissolves into this frame: the
 * showroom at golden hour, presented nearly clean — the photograph carries the
 * luxury. One type family does all the talking: extrabold tight-tracked caps
 * against a lighter, quieter second line. Depth comes from three parallax
 * layers that separate on scroll and micro-shift with the mouse; the chapter
 * exits by being buried under the next film sheet while the stage scales back
 * and dims.
 */
export function HeroStage({ content }: { content?: Partial<HeroContent> }) {
  const c = { ...DEFAULTS, ...content };
  const [line1 = "", line2 = ""] = c.headline.split("\n");
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // The entrance fires when the stage emerges from the film's dissolve.
  const seen = useInView(ref, { once: true, amount: 0.25 });
  const on = reduce || seen;

  // ── Scroll exit — pinned while the next sheet rides over it.
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const still = reduce;
  const photoScale = useTransform(scrollYProgress, [0, 1], still ? [1, 1] : [1, 1.14]);
  const photoY = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["0%", "6%"]);
  const dim = useTransform(scrollYProgress, [0.15, 0.75], [0, 0.55]);
  const headY = useTransform(scrollYProgress, [0, 0.7], still ? [0, 0] : [0, -130]);
  const eyebrowY = useTransform(scrollYProgress, [0, 0.7], still ? [0, 0] : [0, -190]);
  const cardY = useTransform(scrollYProgress, [0, 0.7], still ? [0, 0] : [0, -70]);
  const fade = useTransform(scrollYProgress, [0.3, 0.62], [1, 0]);

  // ── Mouse parallax — micro depth on precise pointers.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const smx = useSpring(mx, { stiffness: 60, damping: 18 });
  const smy = useSpring(my, { stiffness: 60, damping: 18 });
  const photoMX = useTransform(smx, [-1, 1], [10, -10]);
  const photoMY = useTransform(smy, [-1, 1], [6, -6]);
  const headMX = useTransform(smx, [-1, 1], [-7, 7]);
  const onMouse = (e: React.MouseEvent) => {
    if (reduce) return;
    const r = e.currentTarget.getBoundingClientRect();
    mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
    my.set(((e.clientY - r.top) / r.height) * 2 - 1);
  };

  const rise = (delay: number) => ({
    initial: reduce ? false : ({ y: 34, opacity: 0 } as const),
    animate: on ? { y: 0, opacity: 1 } : {},
    transition: { duration: 0.9, ease: ease.entrance, delay },
  });

  return (
    <section
      ref={ref}
      data-chapter="01"
      data-chapter-label="Начало"
      onMouseMove={onMouse}
      className="relative h-[140svh] bg-base"
      aria-label="Начало"
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {/* ── Layer 0: the photograph, nearly clean ── */}
        <motion.div
          style={{ scale: photoScale, y: photoY }}
          className="absolute inset-0"
        >
          <motion.div style={{ x: photoMX, y: photoMY }} className="absolute -inset-4">
            <motion.div
              initial={reduce ? false : { scale: 1.08 }}
              animate={on ? { scale: 1 } : {}}
              transition={{ duration: 2.4, ease: ease.entrance }}
              className="absolute inset-0"
            >
              <Image
                src="/photos/autohaus_lights.webp"
                alt="Шоурумът на AutoHaus по залез — премиум автосалон в Пловдив"
                fill
                priority
                quality={92}
                sizes="100vw"
                className="object-cover object-[50%_40%]"
              />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Minimal staging — one breath of contrast where type and nav live. */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-base/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[34%] bg-gradient-to-t from-base/80 via-base/25 to-transparent" />
        <motion.div style={{ opacity: dim }} className="pointer-events-none absolute inset-0 bg-base" />

        {/* ── Layer 1: composition ── */}
        <div className="relative z-10 flex h-full flex-col">
          {/* eyebrow — machined instrument label */}
          <motion.div style={{ y: eyebrowY, opacity: fade }} className="mt-24 px-5 sm:px-8 md:mt-28 md:px-12">
            <motion.p {...rise(0.1)} className="label-fine max-w-xs text-fg/85 sm:max-w-none">
              <span aria-hidden className="mr-2 text-accent">[</span>
              {c.eyebrow}
              <span aria-hidden className="ml-2 text-accent">]</span>
            </motion.p>
          </motion.div>

          {/* headline block — one family, hierarchy by weight and scale */}
          <div className="mt-auto flex items-end justify-between gap-8 px-5 pb-20 sm:px-8 md:px-12 md:pb-20">
            <motion.div style={{ y: headY, opacity: fade }} className="min-w-0">
              <motion.h1 style={{ x: headMX }} className="font-display text-fg">
                <span className="block overflow-hidden">
                  <motion.span
                    className="block text-[clamp(2.2rem,7.5vw,6.8rem)] font-extrabold leading-[0.96] tracking-[-0.035em]"
                    initial={reduce ? false : { y: "108%" }}
                    animate={on ? { y: "0%" } : {}}
                    transition={{ duration: 1.05, ease: ease.entrance, delay: 0.06 }}
                  >
                    {line1}
                  </motion.span>
                </span>
                <span className="block overflow-hidden pb-[0.1em]">
                  <motion.span
                    className="block text-[clamp(1.9rem,6.4vw,5.8rem)] font-medium leading-[1] tracking-[-0.02em] text-accent-warm"
                    initial={reduce ? false : { y: "108%" }}
                    animate={on ? { y: "0%" } : {}}
                    transition={{ duration: 1.05, ease: ease.entrance, delay: 0.18 }}
                  >
                    {line2}
                  </motion.span>
                </span>
              </motion.h1>

              <motion.p {...rise(0.34)} className="mt-6 max-w-md text-sm leading-relaxed text-fg/90 md:text-base">
                {c.subcopy}
              </motion.p>

              <motion.div {...rise(0.46)} className="mt-7 flex flex-wrap items-center gap-4">
                <Magnetic strength={0.14}>
                  <ButtonLink href="/avtomobili" variant="solid" size="lg" arrow>
                    {c.ctaPrimary}
                  </ButtonLink>
                </Magnetic>
                <ButtonLink href="/kontakti" variant="ghost" size="lg">
                  {c.ctaSecondary}
                </ButtonLink>
              </motion.div>
            </motion.div>

            {/* floating instrument card — corner-notched, quiet proof */}
            <motion.div style={{ y: cardY, opacity: fade }} className="hidden shrink-0 lg:block">
              <motion.div {...rise(0.5)} className="vd-notch panel-glass w-56 p-5">
                <p className="label-fine text-fg-subtle">Доказано</p>
                <div className="mt-4 space-y-4">
                  {STATS.map(([to, suffix, label]) => (
                    <div key={label} className="flex items-baseline justify-between gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
                      <span className="font-display text-2xl font-extrabold leading-none text-fg">
                        <StatCounter to={to} suffix={suffix} duration={2} />
                      </span>
                      <span className="label-fine text-fg-muted">{label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* signature ticker — the brand strip that closes the first frame */}
          <motion.div
            {...rise(0.6)}
            className="vd-marquee absolute inset-x-0 bottom-0 overflow-hidden border-t border-line bg-base/45 py-3 backdrop-blur-md"
          >
            <div className="vd-marquee-track" style={{ "--vd-marquee-dur": "40s" } as React.CSSProperties}>
              {[0, 1].map((copy) => (
                <span key={copy} aria-hidden={copy === 1} className="inline-flex items-center">
                  {TICKER.map((t) => (
                    <span key={t} className="inline-flex items-center">
                      <span className="label-fine text-fg/60">{t}</span>
                      <span aria-hidden className="mx-8 inline-block size-1 rotate-45 bg-accent/50" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
