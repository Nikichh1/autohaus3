"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, MapPin } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { FadeIn } from "@/components/motion/FadeIn";
import { ButtonLink } from "@/components/ui/Button";
import { contactInfo } from "@/lib/nav";

const experiences = [
  {
    href: "/avtomobili",
    img: "/photos/showroom-bentley.webp",
    label: "Шоурум",
    desc: "Колекцията на живо, без бързане — всяка кола, готова за оглед и тест.",
  },
  {
    href: "/auto-spa",
    img: "/photos/detail-headlight.webp",
    label: "Auto Spa",
    desc: "Детайлинг и керамични покрития — грижа на ниво произведение.",
  },
  {
    href: "/kafe-bar",
    img: "/photos/cafe-terrace.webp",
    label: "Кафе бар",
    desc: "Пространство за гости и партньори — сделките започват на кафе.",
  },
  {
    href: "/kontakti",
    img: "/photos/building-dusk.webp",
    label: "Домът",
    desc: "Шоурум, сервиз и спа под един покрив в Пловдив — елате на място.",
  },
];

/**
 * Chapter 07 — The House, told the Rivian way: the experiences scroll past on
 * the left while a pinned cinema frame on the right cross-fades between them —
 * the building answering each promise with its picture. On mobile it becomes a
 * hand-held gallery of place cards. Ends on the visit strip: address, hours,
 * one CTA.
 */
export function HouseScene() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const els = itemRefs.current.filter(Boolean) as HTMLDivElement[];
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const idx = els.indexOf(entry.target as HTMLDivElement);
            if (idx >= 0) setActive(idx);
          }
        }
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <section
      data-chapter="06"
      data-chapter-label="Домът"
      className="light relative bg-[#eef0f2] py-16 md:py-[13vh]"
    >
      <div className="mx-auto max-w-wide px-5 sm:px-8 md:px-12">
        {/* Intro */}
        <div className="max-w-2xl">
          <FadeIn>
            <p className="label-fine text-fg-subtle"><span aria-hidden className="mr-2 text-accent">[</span>06 · Изживяването<span aria-hidden className="ml-2 text-accent">]</span></p>
          </FadeIn>
          <FadeIn delay={0.08}>
            <h2 className="mt-6 font-display text-display-sm font-bold leading-[0.98] tracking-tight text-fg md:text-[clamp(2.4rem,4.2vw,4rem)]">
              Повече от място
              <span className="block font-medium tracking-[-0.02em] text-fg-muted">за покупка.</span>
            </h2>
          </FadeIn>
        </div>

        {/* ── Desktop: scrolling promises · pinned cinema frame ── */}
        <div className="mt-4 hidden gap-x-14 lg:grid lg:grid-cols-12">
          {/* Left — the list */}
          <div className="lg:col-span-5">
            {experiences.map((e, i) => {
              const isActive = i === active;
              return (
                <div
                  key={e.href}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  className="flex min-h-[52vh] flex-col justify-center"
                >
                  <Link href={e.href} data-cursor="view" className="group block">
                    <p
                      className={`label-fine transition-colors duration-500 ${
                        isActive ? "text-fg-muted" : "text-fg-subtle/60"
                      }`}
                    >
                      0{i + 1} / 0{experiences.length}
                    </p>
                    <p
                      className={`mt-3 font-display text-5xl font-extrabold tracking-[-0.03em] transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] xl:text-6xl ${
                        isActive ? "translate-x-2 text-fg" : "text-fg/25 group-hover:text-fg/50"
                      }`}
                    >
                      {e.label}
                    </p>
                    <p
                      className={`mt-4 max-w-sm text-sm leading-relaxed transition-opacity duration-500 md:text-base ${
                        isActive ? "text-fg-muted opacity-100" : "opacity-0"
                      }`}
                    >
                      {e.desc}
                    </p>
                    <p
                      className={`mt-4 flex items-center gap-2 text-sm font-medium text-fg transition-all duration-500 ${
                        isActive ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
                      }`}
                    >
                      Разгледайте
                      <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                    </p>
                  </Link>
                </div>
              );
            })}
          </div>

          {/* Right — the pinned frame */}
          <div className="lg:col-span-7">
            <div className="sticky top-[12vh] h-[76vh]">
              <div className="relative h-full overflow-hidden rounded-[1.75rem] bg-elevated shadow-luxe">
                {experiences.map((e, i) => (
                  <motion.div
                    key={e.href}
                    className="absolute inset-0"
                    initial={false}
                    animate={{
                      opacity: i === active ? 1 : 0,
                      scale: reduce ? 1 : i === active ? 1 : 1.07,
                    }}
                    // Fast crossfade, then the shot keeps settling for six
                    // seconds — a filmed drift, not a static slide.
                    transition={{
                      opacity: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                      scale: { duration: 6, ease: [0.16, 1, 0.3, 1] },
                    }}
                  >
                    <Image
                      src={e.img}
                      alt={e.label}
                      fill
                      sizes="(min-width: 1024px) 55vw, 100vw"
                      className="object-cover"
                    />
                  </motion.div>
                ))}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-7">
                  <p className="label-fine text-white/70">АутоХаус · Пловдив</p>
                  <p className="mt-1.5 font-display text-lg font-semibold text-white">
                    {experiences[active].label}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Mobile: place cards, built for the thumb ── */}
        <div className="no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain px-5 pb-2 sm:-mx-8 sm:px-8 lg:hidden">
          {experiences.map((e, i) => (
            <Link
              key={e.href}
              href={e.href}
              className="group w-[74vw] max-w-xs shrink-0 snap-center"
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-[1.25rem] bg-elevated shadow-luxe">
                <Image
                  src={e.img}
                  alt={e.label}
                  fill
                  sizes="74vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <span className="absolute left-4 top-3.5 font-display text-lg font-extrabold tracking-tight text-white/50">
                  0{i + 1}
                </span>
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-5">
                  <div>
                    <p className="font-display text-2xl font-extrabold tracking-tight text-white">{e.label}</p>
                    <p className="mt-1 max-w-[13rem] text-xs leading-relaxed text-white/75">{e.desc}</p>
                  </div>
                  <ArrowUpRight className="size-5 shrink-0 text-white/80" />
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Visit strip */}
        <FadeIn>
          <div className="mt-12 flex flex-col items-start justify-between gap-7 rounded-2xl border border-line bg-surface px-7 py-8 md:flex-row md:items-center md:px-10">
            <div className="flex items-start gap-4">
              <span className="mt-0.5 flex size-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent">
                <MapPin className="size-5" strokeWidth={1.5} />
              </span>
              <div>
                <p className="font-display text-lg font-semibold text-fg">
                  {contactInfo.address.street}, {contactInfo.address.city}
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {contactInfo.address.area} · {contactInfo.hours[0].days}{" "}
                  {contactInfo.hours[0].time}
                </p>
              </div>
            </div>
            <ButtonLink href="/kontakti" variant="ghost" size="lg" arrow>
              Резервирайте посещение
            </ButtonLink>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
