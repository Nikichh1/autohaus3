"use client";

import { useRef } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useReducedMotion,
} from "framer-motion";
import { Reveal } from "@/components/motion/Reveal";

type ServiceHeroProps = {
  label: string;
  tagline: string;
  image: string;
};

export function ServiceHero({ label, tagline, image }: ServiceHeroProps) {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const y = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? ["0%", "0%"] : ["0%", "18%"],
  );
  const scale = useTransform(
    scrollYProgress,
    [0, 1],
    reduce ? [1, 1] : [1, 1.12],
  );

  return (
    <section
      ref={ref}
      className="relative flex h-[88vh] min-h-[560px] w-full items-end overflow-hidden bg-black"
    >
      <motion.div style={{ y, scale }} className="absolute inset-0">
        <Image
          src={image}
          alt={label}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-base via-base/45 to-base/20" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-base/70 to-transparent" />
      <div aria-hidden className="pointer-events-none absolute inset-5 hidden md:inset-6 md:block">
        <span className="absolute left-0 top-0 h-9 w-9 border-l border-t border-white/20" />
        <span className="absolute right-0 top-0 h-9 w-9 border-r border-t border-white/20" />
        <span className="absolute bottom-0 left-0 h-9 w-9 border-b border-l border-white/20" />
        <span className="absolute bottom-0 right-0 h-9 w-9 border-b border-r border-white/20" />
      </div>

      <div className="relative z-10 w-full pb-20 md:pb-28">
        <div className="mx-auto w-full max-w-wide px-4 md:px-8 xl:px-12">
          <Reveal>
            <p className="flex items-center gap-3 text-accent">
              <span className="h-px w-8 bg-accent/50" />
              <span className="label-fine">Услуга</span>
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h1 className="mt-6 font-display text-display-sm font-extrabold leading-[0.95] tracking-tight text-fg md:text-display-lg">
              {label}
            </h1>
          </Reveal>
          <Reveal delay={0.22}>
            <p className="mt-6 max-w-xl text-lg text-fg/80 md:text-xl">
              {tagline}
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
