"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { ArrowRight, Phone, Globe2, Search, ShieldCheck } from "lucide-react";
import { FadeIn } from "@/components/motion/FadeIn";
import { ChapterLabel } from "@/components/ui/ChapterLabel";
import { contactInfo } from "@/lib/nav";
import { ease } from "@/lib/motion";

const HEADLINE = ["Мечтаната кола —", "намерена и доставена."];

const steps = [
  {
    n: "01",
    Icon: Search,
    title: "Опишете автомобила",
    body: "Марка, модел, спецификация и бюджет — колкото и специфично да е желанието ви.",
  },
  {
    n: "02",
    Icon: Globe2,
    title: "Издирваме и проверяваме",
    body: "Активираме международна мрежа от партньори и проверяваме произход, история и състояние.",
  },
  {
    n: "03",
    Icon: ShieldCheck,
    title: "Доставяме до Пловдив",
    body: "Поемаме вноса, документите и регистрацията. Вие получавате готов, проверен автомобил.",
  },
];

const marques = [
  "Porsche",
  "Ferrari",
  "Lamborghini",
  "Rolls-Royce",
  "Bentley",
  "Mercedes-AMG",
  "BMW M",
  "Aston Martin",
  "McLaren",
  "Maserati",
];

/**
 * Chapter 05 — The Hunt. A split-screen cut: the sourced GT3 RS bleeds in from
 * the right behind a diagonal seam (the film's hard cut), the ask lives on the
 * graphite left — one console, one call. Below, the process as a drawn
 * timeline, and the sourcing network gliding past as the signature marquee.
 */
export function ConciergeScene() {
  const reduce = useReducedMotion();
  const headRef = useRef<HTMLHeadingElement>(null);
  const headInView = useInView(headRef, { once: true, amount: 0.2 });
  const lineRef = useRef<HTMLDivElement>(null);
  const lineInView = useInView(lineRef, { once: true, amount: 0.4 });

  return (
    <section
      data-chapter="05"
      data-chapter-label="Издирване"
      className="sheet field-graphite relative -mt-[8vh] overflow-hidden text-fg"
    >
      {/* ── The cut: image bleeds behind a diagonal seam (desktop) ── */}
      <div aria-hidden className="absolute inset-y-0 right-0 hidden w-[58%] lg:block">
        <div
          className="absolute inset-0"
          style={{ clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)" }}
        >
          <Image
            src="/photos/porsche-gt3rs.webp"
            alt=""
            fill
            quality={90}
            sizes="58vw"
            className="object-cover object-center"
          />
          {/* melt into the graphite, keep the car spotlit */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(100deg, rgb(14 17 22) 0%, rgb(14 17 22 / 0.55) 30%, transparent 58%), linear-gradient(to top, rgb(14 17 22 / 0.9) 4%, transparent 44%)",
            }}
          />
        </div>
        {/* the seam itself — a titanium edge light */}
        <div
          className="absolute inset-y-0 left-[11%] w-px -skew-x-[9deg]"
          style={{
            background:
              "linear-gradient(180deg, transparent, rgba(201,207,214,0.5) 30%, rgba(201,207,214,0.5) 70%, transparent)",
          }}
        />
        {/* caption riding the image */}
        <div className="absolute bottom-8 right-8 text-right">
          <p className="label-fine text-accent">Издирен за клиент</p>
          <p className="mt-2 font-display text-2xl font-extrabold tracking-tight text-white">Porsche 911 GT3 RS</p>
        </div>
      </div>

      {/* mobile image band */}
      <div className="relative aspect-[16/10] w-full lg:hidden">
        <Image
          src="/photos/porsche-gt3rs.webp"
          alt="Porsche 911 GT3 RS — издирен за клиент"
          fill
          quality={90}
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e1116] via-transparent to-[#0e1116]/40" />
        <div className="absolute bottom-4 left-5">
          <p className="label-fine text-accent">Издирен за клиент</p>
          <p className="mt-1 font-display text-xl font-extrabold tracking-tight text-white">Porsche 911 GT3 RS</p>
        </div>
      </div>

      <div className="relative z-10 mx-auto max-w-wide px-5 py-14 sm:px-8 md:px-12 md:py-[15vh]">
        {/* ── Left: the ask ── */}
        <div className="max-w-xl">
          <FadeIn>
            <ChapterLabel index="05" label="Издирване и внос" />
          </FadeIn>
          <h2
            ref={headRef}
            className="mt-6 text-balance font-display text-display-sm font-extrabold leading-[0.98] tracking-tight text-fg md:text-[clamp(3.2rem,4.6vw,4.6rem)]"
          >
            {HEADLINE.map((line, i) => (
              <span key={line} className="block overflow-hidden pb-[0.08em]">
                <motion.span
                  className="block"
                  initial={reduce ? false : { y: "115%" }}
                  animate={reduce || headInView ? { y: "0%" } : { y: "115%" }}
                  transition={{ duration: 1, ease: ease.entrance, delay: 0.06 + i * 0.12 }}
                >
                  {line}
                </motion.span>
              </span>
            ))}
          </h2>
          <FadeIn delay={0.14}>
            <p className="mt-6 max-w-lg text-fg-muted md:text-lg">
              Дори когато търсеният автомобил не е в нашата зала, го откриваме чрез
              проверена международна мрежа, инспектираме всеки детайл и го доставяме
              до Пловдив — напълно прозрачно.
            </p>
          </FadeIn>

          {/* Request console — corner-notched glass instrument */}
          <FadeIn delay={0.22}>
            <div className="vd-notch panel-glass mt-9 p-5 md:p-6">
              <div className="flex items-center gap-2">
                <Search className="size-4 text-accent" strokeWidth={1.7} />
                <p className="label-fine text-fg-muted">Опишете автомобила, който търсите</p>
              </div>
              <ConciergeRequest />
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                  className="inline-flex items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent"
                >
                  <Phone className="size-4" strokeWidth={1.7} />
                  <span className="tabular-nums">{contactInfo.phone}</span>
                </a>
                <span className="flex items-center gap-2 text-xs text-fg-subtle">
                  <Globe2 className="size-3.5 text-accent" strokeWidth={1.6} />
                  Глобална мрежа
                </span>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* ── The process — a drawn timeline ── */}
        <div ref={lineRef} className="relative mt-16 md:mt-24">
          {/* connecting line draws across */}
          <div aria-hidden className="absolute left-0 right-0 top-[22px] hidden h-px bg-line md:block">
            <motion.div
              className="h-full origin-left bg-accent/60"
              initial={reduce ? { scaleX: 1 } : { scaleX: 0 }}
              animate={lineInView ? { scaleX: 1 } : {}}
              transition={{ duration: 1.4, ease: ease.entrance }}
            />
          </div>
          <div className="grid gap-9 md:grid-cols-3 md:gap-6">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={0.15 + i * 0.14}>
                <div className="relative md:pt-12">
                  {/* node */}
                  <span className="absolute left-0 top-0 hidden size-11 items-center justify-center rounded-full border border-line-strong bg-surface text-accent md:flex">
                    <s.Icon className="size-4.5" strokeWidth={1.6} />
                  </span>
                  <div className="flex items-center gap-3 md:mt-4">
                    <span className="flex size-10 items-center justify-center rounded-full border border-line-strong text-accent md:hidden">
                      <s.Icon className="size-4" strokeWidth={1.6} />
                    </span>
                    <span className="font-display text-2xl font-semibold tabular-nums text-fg-subtle">{s.n}</span>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold tracking-tight text-fg md:text-xl">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>

        {/* ── The network, gliding past ── */}
        <div className="mt-14 border-t border-line pt-10 md:mt-20">
          <p className="text-center font-display text-xl font-bold tracking-tight text-fg sm:text-2xl">
            От всяка марка. <span className="font-medium text-fg-muted">От всеки пазар.</span>
          </p>
          <div className="vd-marquee edge-fade-x mt-8 overflow-hidden whitespace-nowrap">
            <div className="vd-marquee-track" style={{ "--vd-marquee-dur": "46s" } as React.CSSProperties}>
              {[0, 1].map((copy) => (
                <span key={copy} aria-hidden={copy === 1} className="inline-flex items-center">
                  {marques.map((m) => (
                    <span key={m} className="inline-flex items-center">
                      <span className="font-display text-lg font-semibold tracking-tight text-fg/30 transition-colors duration-300 hover:text-fg/75 sm:text-xl md:text-2xl">
                        {m}
                      </span>
                      <span aria-hidden className="mx-6 inline-block size-1 rotate-45 bg-fg/15 sm:mx-8" />
                    </span>
                  ))}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Concierge request entry — one elegant ask, routed to the contact desk. */
function ConciergeRequest() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = value.trim();
    router.push(q ? `/kontakti?vehicle=${encodeURIComponent(q)}` : "/kontakti");
  };

  return (
    <form onSubmit={submit} className="mt-3 flex flex-col gap-3 sm:flex-row">
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="напр. Porsche 911 GT3 RS, BMW M5 Touring…"
        aria-label="Опишете автомобила, който търсите"
        className="h-14 w-full rounded-full border border-line-strong bg-white/5 px-5 text-sm text-fg placeholder:text-fg-subtle focus:border-accent/60 focus:outline-none sm:flex-1"
      />
      <button
        type="submit"
        className="group/btn relative inline-flex h-14 shrink-0 items-center justify-center gap-2 overflow-hidden rounded-full bg-fg px-7 text-sm font-medium text-ink transition-colors hover:bg-accent"
      >
        Заявете
        <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
      </button>
    </form>
  );
}
