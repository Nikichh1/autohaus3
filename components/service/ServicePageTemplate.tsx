import Image from "next/image";
import { Check } from "lucide-react";
import type { Service } from "@/types";
import { cn } from "@/lib/utils";
import { ServiceHero } from "./ServiceHero";
import { MaskReveal } from "@/components/motion/MaskReveal";
import { ScrollTilt } from "@/components/motion/ScrollTilt";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";
import { ButtonLink } from "@/components/ui/Button";

export function ServicePageTemplate({ service }: { service: Service }) {
  return (
    <article className="field-graphite">
      <ServiceHero
        label={service.label}
        tagline={service.tagline}
        image={service.image}
      />

      {/* Intro */}
      <section className="mx-auto max-w-wide px-4 py-24 md:px-8 md:py-32 xl:px-12">
        <div className="max-w-3xl">
          <Reveal>
            <p className="font-serif text-2xl italic leading-relaxed text-fg md:text-display-2xs md:not-italic md:font-display md:font-semibold md:leading-tight">
              {service.description}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Alternating content sections */}
      {service.sections?.map((section, i) => (
        <ContentSection key={section.heading} section={section} reversed={i % 2 === 1} />
      ))}

      {/* Offerings */}
      <section className="bg-surface">
        <div className="mx-auto max-w-wide px-4 py-24 md:px-8 md:py-32 xl:px-12">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <FadeIn>
                <p className="flex items-center gap-3 text-accent">
                  <span className="h-px w-8 bg-accent/50" />
                  <span className="label-fine">Какво включва</span>
                </p>
              </FadeIn>
              <Reveal>
                <h2 className="mt-6 font-display text-display-xs font-bold text-fg md:text-display-sm">
                  Услугата в детайли.
                </h2>
              </Reveal>
            </div>
            <div className="lg:col-span-7">
              <FadeIn>
                <ul className="panel-metal edge-light grid grid-cols-1 gap-x-10 rounded-[1.5rem] p-6 sm:grid-cols-2 md:p-8">
                  {service.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-3.5 border-b border-line py-4 last:border-0 sm:[&:nth-last-child(2)]:border-0"
                    >
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent">
                        <Check className="size-3.5" strokeWidth={2.5} />
                      </span>
                      <span className="text-sm text-fg/90">{feature}</span>
                    </li>
                  ))}
                </ul>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-elevated">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(50% 80% at 15% 0%, rgba(201,207,214,0.1), transparent 60%)",
          }}
        />
        <div className="relative mx-auto max-w-wide px-4 py-28 md:px-8 md:py-40 xl:px-12">
          <div className="max-w-3xl">
            <FadeIn>
              <p className="flex items-center gap-3 text-accent">
                <span className="h-px w-8 bg-accent/50" />
                <span className="label-fine">Готови сме да помогнем</span>
              </p>
            </FadeIn>
            <Reveal>
              <h2 className="mt-6 font-display text-display-xs font-extrabold leading-[0.95] tracking-tight text-fg md:text-display-md">
                Свържете се с нас.
              </h2>
            </Reveal>
            <FadeIn delay={0.2}>
              <p className="mt-6 max-w-md text-base text-fg-muted md:text-lg">
                Оставете запитване или ни посетете в шоурума. Ще ви консултираме без ангажимент.
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
  );
}

function ContentSection({
  section,
  reversed,
}: {
  section: NonNullable<Service["sections"]>[number];
  reversed: boolean;
}) {
  return (
    <section className="mx-auto max-w-wide px-4 py-16 md:px-8 md:py-24 xl:px-12">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {section.image && (
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
                sizes="(min-width: 1024px) 45vw, 100vw"
                className="object-cover"
              />
            </MaskReveal>
          </ScrollTilt>
        )}
        <div className={cn(reversed ? "lg:order-1" : "lg:order-2")}>
          <FadeIn>
            <p className="eyebrow text-fg-muted">{section.eyebrow}</p>
          </FadeIn>
          <Reveal delay={0.1}>
            <h2 className="mt-4 font-display text-display-2xs font-bold text-fg md:text-display-xs">
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
    </section>
  );
}
