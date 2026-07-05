"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { Phone, Mail, MapPin, ArrowUpRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/FadeIn";
import { Magnetic } from "@/components/fx/Magnetic";
import { SigLine } from "@/components/ui/BrandMark";
import { contactInfo } from "@/lib/nav";
import { ease } from "@/lib/motion";

const channels = [
  {
    Icon: Phone,
    label: "Обадете се",
    value: contactInfo.phone,
    sub: contactInfo.hours[0].time,
    href: `tel:${contactInfo.phone.replace(/\s/g, "")}`,
  },
  {
    Icon: Mail,
    label: "Пишете ни",
    value: contactInfo.email,
    sub: "Отговаряме в рамките на деня",
    href: `mailto:${contactInfo.email}`,
  },
  {
    Icon: MapPin,
    label: "Посетете ни",
    value: `${contactInfo.address.city}`,
    sub: contactInfo.address.street,
    href: "/kontakti",
  },
];

const CREDITS = [
  "20+ години на пазара",
  "4800+ доставени автомобила",
  "35 представени марки",
  "Издирване и внос",
  "Гаранция в писмен вид",
];

/**
 * Chapter 08 — The Invitation. The film's end credits: the showroom returns at
 * golden hour beneath the DRL light signature, the closing line lands in the
 * brand's two voices (mega caps / serif italic), one magnetic CTA, the contact
 * strip, and the credentials rolling past like a credits crawl.
 */
export function FinaleScene() {
  const reduce = useReducedMotion();
  const headRef = useRef<HTMLHeadingElement>(null);
  const headInView = useInView(headRef, { once: true, amount: 0.2 });

  return (
    <section
      data-chapter="08"
      data-chapter-label="Покана"
      className="sheet field-graphite relative -mt-[8vh] flex min-h-[100svh] flex-col justify-center overflow-hidden py-16 md:py-[14vh]"
    >
      {/* the showroom, returning */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <motion.div
          className="absolute inset-0"
          initial={reduce ? false : { scale: 1.08 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 2.2, ease: ease.entrance }}
        >
          <Image
            src="/photos/autohaus_lights.webp"
            alt=""
            fill
            sizes="100vw"
            className="object-cover object-[50%_45%] opacity-[0.2]"
          />
        </motion.div>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, var(--color-base) 0%, rgba(8,9,12,0.55) 34%, rgba(8,9,12,0.72) 64%, var(--color-base) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-wide px-5 sm:px-8 md:px-12">
        <div className="flex flex-col items-center text-center">
          <FadeIn>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/brand/logo.svg"
              alt="AutoHaus"
              className="w-36 select-none opacity-90 md:w-44"
            />
          </FadeIn>

          {/* the DRL light signature */}
          <div className="mt-9 w-full max-w-2xl">
            <SigLine />
          </div>

          <h2
            ref={headRef}
            className="mx-auto mt-10 text-balance font-display text-fg md:mt-12"
          >
            <span className="block overflow-hidden">
              <motion.span
                className="block text-[clamp(2.2rem,7.5vw,6.8rem)] font-extrabold leading-[0.96] tracking-[-0.035em]"
                initial={reduce ? false : { y: "110%" }}
                animate={reduce || headInView ? { y: "0%" } : { y: "110%" }}
                transition={{ duration: 1.05, ease: ease.entrance, delay: 0.12 }}
              >
                Вашата следваща
              </motion.span>
            </span>
            <span className="block overflow-hidden pb-[0.12em]">
              <motion.span
                className="block text-[clamp(2rem,6.2vw,5.6rem)] font-medium leading-[1] tracking-[-0.02em] text-accent-warm"
                initial={reduce ? false : { y: "110%" }}
                animate={reduce || headInView ? { y: "0%" } : { y: "110%" }}
                transition={{ duration: 1.05, ease: ease.entrance, delay: 0.26 }}
              >
                глава.
              </motion.span>
            </span>
          </h2>

          <FadeIn delay={0.24}>
            <p className="mx-auto mt-7 max-w-lg text-fg/70 md:text-lg">
              Открийте автомобила, който ще разказва вашата история — на живо в
              Пловдив или чрез нашата услуга по издирване и внос.
            </p>
          </FadeIn>

          <FadeIn delay={0.34}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Magnetic strength={0.22}>
                <ButtonLink href="/avtomobili" variant="solid" size="lg" arrow>
                  Разгледай колекцията
                </ButtonLink>
              </Magnetic>
              <ButtonLink href="/kontakti" variant="ghost" size="lg">
                Заявете автомобил
              </ButtonLink>
            </div>
          </FadeIn>
        </div>

        {/* Contact strip */}
        <FadeIn delay={0.42}>
          <div className="mx-auto mt-16 grid max-w-4xl overflow-hidden rounded-[1.25rem] panel-metal edge-light sm:grid-cols-3">
            {channels.map((c, i) => (
              <a
                key={c.label}
                href={c.href}
                className={`group flex items-start gap-4 p-6 transition-colors hover:bg-white/[0.03] md:p-7 ${
                  i > 0 ? "border-t border-line sm:border-l sm:border-t-0" : ""
                }`}
              >
                <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-full border border-line-strong text-accent transition-colors group-hover:border-accent">
                  <c.Icon className="size-4" strokeWidth={1.6} />
                </span>
                <span className="min-w-0">
                  <span className="label-fine flex items-center gap-1 text-fg-subtle">
                    {c.label}
                    <ArrowUpRight className="size-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
                  </span>
                  <span className="mt-1.5 block truncate font-display text-base font-semibold text-fg">
                    {c.value}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-fg-muted">{c.sub}</span>
                </span>
              </a>
            ))}
          </div>
        </FadeIn>

        {/* Credits crawl */}
        <div className="vd-marquee edge-fade-x mt-14 overflow-hidden whitespace-nowrap">
          <div className="vd-marquee-track" style={{ "--vd-marquee-dur": "42s" } as React.CSSProperties}>
            {[0, 1].map((copy) => (
              <span key={copy} aria-hidden={copy === 1} className="inline-flex items-center">
                {CREDITS.map((t) => (
                  <span key={t} className="inline-flex items-center">
                    <span className="label-fine text-fg-muted">{t}</span>
                    <span aria-hidden className="mx-8 inline-block size-1 rotate-45 bg-accent/40" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
