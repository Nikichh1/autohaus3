import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Service } from "@/types";
import { cn } from "@/lib/utils";
import { allServices } from "@/data/services";
import { ServiceHero } from "./ServiceHero";
import {
  ScrollThemeMorph,
  ThemeMorphBoundary,
} from "@/components/fx/ScrollThemeMorph";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { ScrollTilt } from "@/components/motion/ScrollTilt";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Service page — a single, premium light→dark journey.
 *
 * The whole article is wrapped in <ScrollThemeMorph>: it opens LIGHT (an
 * editorial hero + statement), then — as you scroll past the boundary marker —
 * the entire theme (background, text, borders, accents, card surfaces) morphs
 * to deep black as one continuous, reversible motion, the same effect as the
 * landing page. Every surface paints from tokens, so nothing is left behind.
 *
 * Imagery is deliberately CONTAINED (framed cards ≤ ~44vw, correct aspect) so
 * the modest-resolution photos render crisp instead of being stretched soft.
 */
export function ServicePageTemplate({ service }: { service: Service }) {
  const services = allServices.filter((s) => s.slug !== "avtomobili");
  const idx = services.findIndex((s) => s.slug === service.slug);
  const index = idx >= 0 ? String(idx + 1).padStart(2, "0") : undefined;
  const others = services.filter((s) => s.slug !== service.slug);

  return (
    // The morph lives near the FOOTER and runs long and gradual: the page stays
    // light through the hero, features and detail sections, then sinks to black
    // across the last ~1.5 viewports into the closing CTA. `bgLayer` paints the
    // background on a GPU opacity layer (no per-frame repaint) so it stays
    // flawless on phones; the sections are transparent so that layer shows.
    // bandStart + bandEnd ≈ 1 keeps the mid-grey crossover on the seam gap.
    <ScrollThemeMorph restLight bgLayer bandStart={1.25} bandEnd={-0.25}>
      <article>
        <ServiceHero
          label={service.label}
          tagline={service.tagline}
          image={service.image}
          index={index}
        />

        {/* Statement — the light end, still crisp and bright */}
        <section className="mx-auto max-w-wide px-5 pb-20 md:px-8 md:pb-28 xl:px-12">
          <div className="max-w-4xl border-t border-line pt-12 md:pt-16">
            <Reveal>
              <p className="font-display text-[clamp(1.5rem,3.3vw,2.6rem)] font-semibold leading-[1.18] tracking-tight text-fg">
                {service.description}
              </p>
            </Reveal>
          </div>
        </section>

        {/* What's included — a machined, numbered grid (still light) */}
        <section>
          <div className="mx-auto max-w-wide px-5 py-20 md:px-8 md:py-28 xl:px-12">
            <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
              <div className="lg:col-span-4">
                <FadeIn>
                  <p className="flex items-center gap-3 text-accent">
                    <span className="h-px w-8 bg-accent/50" />
                    <span className="label-fine">Какво включва</span>
                  </p>
                </FadeIn>
                <Reveal>
                  <h2 className="mt-6 font-display text-display-xs font-bold leading-[0.98] tracking-tight text-fg md:text-display-sm">
                    Услугата
                    <br />в детайли.
                  </h2>
                </Reveal>
              </div>

              <div className="lg:col-span-8">
                <FadeIn>
                  <ul className="grid grid-cols-1 gap-px overflow-hidden rounded-[1.5rem] border border-line-strong bg-line-strong sm:grid-cols-2">
                    {service.features.map((feature, i) => (
                      <li
                        key={feature}
                        className="group flex items-start gap-4 bg-base p-6 transition-colors duration-500 hover:bg-surface md:p-7"
                      >
                        <span className="mt-0.5 font-display text-sm font-bold tabular-nums text-accent">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[15px] leading-snug text-fg/90">
                          {feature}
                        </span>
                      </li>
                    ))}
                    {/* keep the grid visually even when the count is odd */}
                    {service.features.length % 2 === 1 ? (
                      <li aria-hidden className="hidden bg-base sm:block" />
                    ) : null}
                  </ul>
                </FadeIn>
              </div>
            </div>
          </div>
        </section>

        {/* Alternating detail sections — still light, crisp editorial */}
        {service.sections?.map((section, i) => (
          <ContentSection
            key={section.heading}
            section={section}
            index={String(i + 1).padStart(2, "0")}
            reversed={i % 2 === 1}
          />
        ))}

        {/* Explore the other services */}
        {others.length ? <MoreServices others={others} /> : null}

        {/* ── The whole page sinks into black across this seam, resolving into
            the dark CTA and straight on into the footer ── */}
        <ThemeMorphBoundary />

        {/* Closing CTA — the deep-black end of the morph */}
        <section className="relative overflow-hidden">
          {/* Titanium — never racing red; services sit on the calm baseline. */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(60% 80% at 15% 0%, rgba(201,207,214,0.10), transparent 60%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.4]"
            style={{
              background:
                "radial-gradient(50% 60% at 85% 100%, rgba(201,207,214,0.08), transparent 60%)",
            }}
          />
          <div className="relative mx-auto max-w-wide border-t border-line px-5 py-28 md:px-8 md:py-40 xl:px-12">
            <div className="max-w-3xl">
              <FadeIn>
                <p className="flex items-center gap-3 text-accent">
                  <span className="h-px w-8 bg-accent/50" />
                  <span className="label-fine">Готови сме да помогнем</span>
                </p>
              </FadeIn>
              <Reveal>
                <h2 className="mt-6 font-display text-display-xs font-extrabold leading-[0.95] tracking-tight text-fg md:text-display-md">
                  Свържете се
                  <br />с нас.
                </h2>
              </Reveal>
              <FadeIn delay={0.2}>
                <p className="mt-6 max-w-md text-base text-fg-muted md:text-lg">
                  Оставете запитване или ни посетете в шоурума в Пловдив. Ще ви
                  консултираме без ангажимент.
                </p>
              </FadeIn>
              <FadeIn delay={0.3}>
                <div className="mt-10 flex flex-wrap gap-4">
                  <ButtonLink href="/kontakti" variant="solid" size="lg" arrow>
                    Запитване
                  </ButtonLink>
                  <ButtonLink href="/avtomobili" variant="ghost" size="lg">
                    Разгледай автомобилите
                  </ButtonLink>
                </div>
              </FadeIn>
            </div>
          </div>
        </section>
      </article>
    </ScrollThemeMorph>
  );
}

function ContentSection({
  section,
  index,
  reversed,
}: {
  section: NonNullable<Service["sections"]>[number];
  index: string;
  reversed: boolean;
}) {
  return (
    <section>
      <div className="mx-auto max-w-wide px-5 py-14 md:px-8 md:py-20 xl:px-12">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-20">
          {section.image ? (
            <ScrollTilt
              tilt={4}
              className={cn(reversed ? "lg:order-2" : "lg:order-1")}
            >
              <MaskReveal
                className="edge-light aspect-[4/3] w-full overflow-hidden rounded-[1.5rem] border border-line-strong shadow-cinema"
                direction={reversed ? "right" : "left"}
              >
                <Image
                  src={section.image}
                  alt={section.heading}
                  fill
                  sizes="(min-width: 1024px) 44vw, 100vw"
                  className="object-cover"
                />
              </MaskReveal>
            </ScrollTilt>
          ) : (
            // No image → a machined numeral panel keeps the rhythm two-up
            <div
              className={cn(
                "relative hidden aspect-[4/3] items-center justify-center overflow-hidden rounded-[1.5rem] border border-line-strong bg-surface lg:flex",
                reversed ? "lg:order-2" : "lg:order-1",
              )}
            >
              <span className="font-display text-[14rem] font-extrabold leading-none tracking-tighter text-fg/[0.06]">
                {index}
              </span>
              <span aria-hidden className="absolute left-6 top-6 size-8 border-l border-t border-line-strong" />
              <span aria-hidden className="absolute bottom-6 right-6 size-8 border-b border-r border-line-strong" />
            </div>
          )}

          <div className={cn(reversed ? "lg:order-1" : "lg:order-2")}>
            <FadeIn>
              <p className="flex items-center gap-3">
                <span className="font-display text-sm font-bold tabular-nums text-accent">
                  {index}
                </span>
                <span className="h-px w-8 bg-line-strong" />
                <span className="eyebrow text-fg-muted">{section.eyebrow}</span>
              </p>
            </FadeIn>
            <Reveal delay={0.1}>
              <h2 className="mt-5 font-display text-display-2xs font-bold leading-[1.02] tracking-tight text-fg md:text-display-xs">
                {section.heading}
              </h2>
            </Reveal>
            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-fg-muted md:text-lg">
                {section.body}
              </p>
            </FadeIn>
          </div>
        </div>
      </div>
    </section>
  );
}

/** A refined footer nav to the sibling services — small, crisp framed thumbs. */
function MoreServices({ others }: { others: Service[] }) {
  return (
    <section>
      <div className="mx-auto max-w-wide border-t border-line px-5 py-20 md:px-8 md:py-28 xl:px-12">
        <FadeIn>
          <p className="flex items-center gap-3 text-accent">
            <span className="h-px w-8 bg-accent/50" />
            <span className="label-fine">Другите услуги</span>
          </p>
        </FadeIn>
        <div className="mt-10 grid grid-cols-2 gap-4 md:mt-12 md:gap-5 lg:grid-cols-4">
          {others.map((s) => (
            <Link
              key={s.slug}
              href={s.href}
              className="group relative block"
            >
              <div className="edge-light relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-line-strong bg-surface">
                <Image
                  src={s.image}
                  alt={s.label}
                  fill
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 45vw, 50vw"
                  className="object-cover opacity-90 transition-all duration-[900ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.05] group-hover:opacity-100"
                />
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full border border-white/25 bg-black/35 text-white backdrop-blur-md transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
                  <ArrowUpRight className="size-4" />
                </span>
                <p className="absolute inset-x-4 bottom-4 font-display text-lg font-bold tracking-tight text-white">
                  {s.label}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
