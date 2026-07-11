"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";
import { FadeIn } from "@/components/motion/FadeIn";
import { ButtonLink } from "@/components/ui/Button";

type ServiceHeroProps = {
  label: string;
  tagline: string;
  image: string;
  index?: string;
};

/**
 * Service hero — a light editorial opening (the light end of the page's
 * light→dark scroll morph). Instead of stretching a modest-resolution photo to
 * a full-bleed 88vh banner (which read soft), the image lives in a CONTAINED,
 * machined frame at ~44vw — where the source is pixel-crisp — with a restrained
 * parallax inside the frame. Everything paints from theme tokens, so the hero
 * belongs to the morph like the rest of the page.
 */
export function ServiceHero({ label, tagline, image, index }: ServiceHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  // Touch devices hold the image still — a scroll-scrubbed transform on the
  // largest asset is a real jank source on older phones, and at scroll 0 it is
  // already identity, so dropping it is invisible. Desktop keeps the parallax.
  const [motionOn, setMotionOn] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMotionOn(window.matchMedia("(pointer: fine)").matches);
  }, []);
  const still = reduce || !motionOn;
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], still ? ["0%", "0%"] : ["-6%", "6%"]);
  const scale = useTransform(scrollYProgress, [0, 1], still ? [1, 1] : [1.06, 1.14]);

  return (
    <section
      ref={ref}
      className="relative overflow-hidden pt-32 pb-14 md:pt-40 md:pb-24"
    >
      {/* Oversized service numeral — a quiet editorial watermark */}
      {index ? (
        <span
          aria-hidden
          className="pointer-events-none absolute right-[-3%] top-20 select-none font-display text-[30vw] font-extrabold leading-none tracking-tighter text-fg/[0.035] lg:text-[17vw]"
        >
          {index}
        </span>
      ) : null}

      <div className="mx-auto grid max-w-wide items-center gap-10 px-5 md:px-8 lg:grid-cols-12 lg:gap-16 xl:px-12">
        {/* Copy */}
        <div className="lg:col-span-6">
          <Reveal>
            <p className="flex items-center gap-3 text-accent">
              <span className="h-px w-10 bg-accent/50" />
              <span className="label-fine">Услуга{index ? ` · ${index}` : ""}</span>
            </p>
          </Reveal>
          <Reveal delay={0.08}>
            <h1 className="mt-6 font-display text-display-sm font-extrabold leading-[0.92] tracking-[-0.03em] text-fg md:text-display-lg">
              {label}
            </h1>
          </Reveal>
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-fg-muted md:text-xl">
              {tagline}
            </p>
          </FadeIn>
          <FadeIn delay={0.32}>
            <div className="mt-9 flex flex-wrap gap-3">
              <ButtonLink href="/kontakti" variant="solid" size="lg" arrow>
                Запитване
              </ButtonLink>
              <ButtonLink href="/avtomobili" variant="ghost" size="lg">
                Автомобилите
              </ButtonLink>
            </div>
          </FadeIn>
        </div>

        {/* Framed image — contained, machined, crisp */}
        <FadeIn delay={0.15} className="lg:col-span-6">
          <div className="relative mx-auto w-full max-w-sm lg:ml-auto lg:max-w-none">
            {/* corner ticks */}
            <span aria-hidden className="absolute -left-3 -top-3 z-10 size-8 border-l border-t border-accent/40" />
            <span aria-hidden className="absolute -bottom-3 -right-3 z-10 size-8 border-b border-r border-accent/40" />
            <div className="edge-light relative aspect-[4/5] w-full overflow-hidden rounded-[1.5rem] border border-line-strong shadow-cinema">
              <motion.div style={{ y, scale }} className="absolute inset-0">
                <Image
                  src={image}
                  alt={label}
                  fill
                  priority
                  sizes="(min-width: 1024px) 44vw, (min-width: 768px) 60vw, 100vw"
                  className="object-cover"
                />
              </motion.div>
              {/* soft top gloss so the frame reads as glass, not a flat crop */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 22%, transparent 72%, rgba(0,0,0,0.28) 100%)",
                }}
              />
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
