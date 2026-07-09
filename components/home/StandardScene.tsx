"use client";

import { ShieldCheck, Gauge, FileCheck, Wrench } from "lucide-react";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { ButtonLink } from "@/components/ui/Button";

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
    body: "Задълбочена техническа диагностика. Нито един автомобил не влиза в залата без нея.",
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

/**
 * Chapter 06 — The Standard. Presented as an engineering certificate: a
 * technical-drawing frame, a signed-guarantee seal, and the four assurances as
 * machined rows. Trust rendered as calm craft — no gauges, no loud counters,
 * closing on a single quiet line of reputation.
 */
type StandardCopy = {
  eyebrow: string;
  headingLine1: string;
  headingLine2: string;
  subcopy: string;
};

const DEFAULT_COPY: StandardCopy = {
  eyebrow: "05 · Стандартът",
  headingLine1: "Един стандарт.",
  headingLine2: "без компромис.",
  subcopy:
    "Всеки автомобил — наличен или поръчан — преминава през един и същ безкомпромисен процес, преди да получи нов собственик.",
};

export function StandardScene({ copy = DEFAULT_COPY }: { copy?: StandardCopy }) {
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
          {/* Left — the argument + the sealed guarantee */}
          <div className="lg:col-span-5">
            <FadeIn>
              <p className="label-fine text-fg-subtle"><span aria-hidden className="mr-2 text-racing">[</span>{copy.eyebrow}<span aria-hidden className="ml-2 text-racing">]</span></p>
            </FadeIn>
            <Reveal>
              <h2 className="mt-6 font-display text-[clamp(2.1rem,9vw,3.25rem)] font-extrabold leading-[1.02] tracking-tight text-fg md:text-[clamp(2.4rem,4.2vw,4rem)] md:leading-[0.96]">
                {copy.headingLine1}
                <span className="block font-medium tracking-[-0.02em] text-fg-muted">{copy.headingLine2}</span>
              </h2>
            </Reveal>
            <FadeIn delay={0.12}>
              <p className="mt-6 max-w-md text-fg-muted md:text-lg">
                {copy.subcopy}
              </p>
            </FadeIn>

            {/* Sealed guarantee — the certificate's emblem, calm and tactile */}
            <FadeIn delay={0.18}>
              <div className="mt-10 flex items-center gap-5 rounded-2xl border border-line bg-surface/70 p-5 shadow-luxe">
                <InspectionSeal className="size-[72px] shrink-0" />
                <div>
                  <p className="font-display text-base font-bold tracking-tight text-fg">
                    Гаранция в писмен вид
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-fg-muted">
                    Всеки автомобил напуска залата с подписан документ — спокойствие, което държите в ръце.
                  </p>
                </div>
              </div>
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
          </div>
        </div>

        {/* Closing line — reputation as a quiet statement, not a scoreboard */}
        <FadeIn>
          <div className="mt-16 border-t border-line-strong pt-10 md:mt-24 md:pt-12">
            <p className="mx-auto max-w-3xl text-center font-display text-[clamp(1.35rem,2.6vw,2.1rem)] font-semibold leading-snug tracking-tight text-fg">
              Над две десетилетия. Хиляди доверени собственици.
              <span className="text-fg-muted"> Един стандарт.</span>
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

/** Slow-rotating inspection seal — circular type around the monogram idea.
 *  Honours reduced motion via the `.vd-spin` rule in globals.css. */
function InspectionSeal({ className = "size-28" }: { className?: string }) {
  return (
    <div className={`vd-spin ${className}`}>
      <svg viewBox="0 0 120 120" fill="none" className="size-full text-fg">
        <defs>
          <path id="sealCircle" d="M60,60 m-46,0 a46,46 0 1,1 92,0 a46,46 0 1,1 -92,0" />
        </defs>
        <circle cx={60} cy={60} r={57} stroke="currentColor" strokeOpacity={0.28} />
        <circle cx={60} cy={60} r={33} stroke="currentColor" strokeOpacity={0.28} />
        {/* centre mark — a check, the signature of approval */}
        <path d="M50 60 L57 67 L72 51" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.8} />
        <text className="fill-current" style={{ fontSize: 10.5, letterSpacing: "0.32em", textTransform: "uppercase" }}>
          <textPath href="#sealCircle">
            Аутохаус · Проверен стандарт · Пловдив ·
          </textPath>
        </text>
      </svg>
    </div>
  );
}
