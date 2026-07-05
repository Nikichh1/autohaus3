import type { Metadata } from "next";
import Image from "next/image";
import { CalendarCheck, Car, KeyRound, ShieldCheck, ArrowUpRight } from "lucide-react";
import { getRentalVehicles } from "@/lib/data/vehicles";
import { contactInfo } from "@/lib/nav";
import { VehicleCard } from "@/components/vehicle/VehicleCard";
import { ButtonLink } from "@/components/ui/Button";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";
import { ChapterLabel } from "@/components/ui/ChapterLabel";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Автомобили под наем",
  description:
    "Подбран флот от премиум автомобили под наем в Пловдив — спортни, луксозни и представителни модели. Дневни тарифи, пълна застраховка и доставка.",
};

const steps = [
  {
    n: "01",
    Icon: Car,
    title: "Изберете автомобил",
    body: "Разгледайте флота и изберете модела за вашия повод — от ежедневен лукс до суперавтомобил.",
  },
  {
    n: "02",
    Icon: CalendarCheck,
    title: "Резервирайте датите",
    body: "Свържете се с нас за наличност, условия и индивидуална тарифа. Потвърждаваме до часове.",
  },
  {
    n: "03",
    Icon: KeyRound,
    title: "Карайте",
    body: "Доставяме автомобила готов за път — заредени, застраховани и безупречни. Вие просто се качвате.",
  },
];

const assurances = [
  "Пълна застраховка включена",
  "Доставка в Пловдив и страната",
  "Гъвкави срокове — ден, уикенд или месец",
  "Подготвен и детайлно почистен",
];

export default async function RentalPage() {
  const fleet = (await getRentalVehicles()).sort((a, b) => (a.rentalPerDay ?? 0) - (b.rentalPerDay ?? 0));

  return (
    <div className="field-graphite">
      {/* ── Hero ── */}
      <section className="relative flex h-[82vh] min-h-[600px] w-full items-end overflow-hidden bg-base">
        <Image
          src="/cars/g63.webp"
          alt="Mercedes-AMG G 63 под наем"
          fill
          priority
          quality={92}
          sizes="100vw"
          className="object-cover object-[58%_55%]"
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-base/75 via-base/20 to-transparent" />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, var(--color-base) 1%, rgba(8,9,12,0.8) 22%, rgba(8,9,12,0.3) 46%, transparent 66%)",
          }}
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "linear-gradient(to right, rgba(8,9,12,0.7) 0%, transparent 52%)",
          }}
        />
        <div aria-hidden className="pointer-events-none absolute inset-5 hidden md:inset-6 md:block">
          <span className="absolute left-0 top-0 h-9 w-9 border-l border-t border-white/20" />
          <span className="absolute right-0 top-0 h-9 w-9 border-r border-t border-white/20" />
          <span className="absolute bottom-0 left-0 h-9 w-9 border-b border-l border-white/20" />
          <span className="absolute bottom-0 right-0 h-9 w-9 border-b border-r border-white/20" />
        </div>

        <div className="relative z-10 w-full pb-14 md:pb-20">
          <div className="mx-auto w-full max-w-wide px-4 md:px-8 xl:px-12">
            <Reveal>
              <p className="flex items-center gap-3 text-accent">
                <span className="h-px w-8 bg-accent/50" />
                <span className="label-fine">AutoHaus · Под наем</span>
              </p>
            </Reveal>
            <h1 className="mt-6 max-w-[15ch] text-balance font-display text-display-sm font-extrabold leading-[0.9] tracking-tight text-fg md:text-display-lg xl:text-display-xl">
              Карайте мечтата си.
            </h1>
            <Reveal delay={0.2}>
              <p className="mt-6 max-w-lg text-base leading-relaxed text-fg/80 md:text-lg">
                Подбран флот от премиум автомобили под наем — за уикенда, за
                специалния повод или просто защото можете.
              </p>
            </Reveal>
            <FadeIn delay={0.34}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <ButtonLink href="#fleet" variant="solid" size="lg" arrow>
                  Разгледай флота
                </ButtonLink>
                <ButtonLink href="/kontakti" variant="ghost" size="lg">
                  Запитване за наем
                </ButtonLink>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Assurances strip ── */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-wide grid-cols-2 gap-px overflow-hidden md:grid-cols-4">
          {assurances.map((a) => (
            <div key={a} className="flex items-center gap-3 px-5 py-6 md:px-8">
              <ShieldCheck className="size-4 shrink-0 text-accent" strokeWidth={1.6} />
              <span className="text-xs leading-tight text-fg-muted md:text-sm">{a}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Fleet ── */}
      <section id="fleet" className="scroll-mt-24 py-[14vh]">
        <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <FadeIn>
                <ChapterLabel index="01" label="Флотът" />
              </FadeIn>
              <Reveal>
                <h2 className="mt-5 font-display text-display-sm font-bold leading-[0.95] tracking-tight text-fg md:text-display-md">
                  Налични за наем.
                </h2>
              </Reveal>
            </div>
            <FadeIn delay={0.1}>
              <p className="max-w-xs text-sm text-fg-muted md:text-right">
                {fleet.length} модела · дневни тарифи от{" "}
                {Math.min(...fleet.map((v) => v.rentalPerDay ?? 0))} €
              </p>
            </FadeIn>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
            {fleet.map((v, i) => (
              <FadeIn key={v.id} delay={(i % 3) * 0.08} y={24}>
                <VehicleCard vehicle={v} priority={i === 0} />
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="bg-surface py-[14vh]">
        <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
          <div className="max-w-2xl">
            <FadeIn>
              <ChapterLabel index="02" label="Процесът" />
            </FadeIn>
            <Reveal>
              <h2 className="mt-5 font-display text-display-sm font-bold leading-[0.98] tracking-tight text-fg md:text-display-md">
                Три стъпки до волана.
              </h2>
            </Reveal>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {steps.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.08}>
                <div className="panel-metal edge-light h-full rounded-[1.25rem] p-7 md:p-8">
                  <div className="flex items-center justify-between">
                    <span className="flex size-12 items-center justify-center rounded-full border border-line-strong text-accent">
                      <s.Icon className="size-5" strokeWidth={1.5} />
                    </span>
                    <span className="font-display text-sm font-semibold tabular-nums text-fg-subtle">
                      {s.n} / 03
                    </span>
                  </div>
                  <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-fg">
                    {s.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-fg-muted">{s.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative overflow-hidden py-[16vh]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(55% 60% at 50% 40%, rgba(201,207,214,0.12), transparent 62%)",
          }}
        />
        <div className="relative z-10 mx-auto max-w-wide px-4 text-center md:px-8">
          <FadeIn>
            <p className="flex items-center justify-center gap-3 text-accent">
              <span className="h-px w-8 bg-accent/50" />
              <span className="label-fine">Готови за път</span>
              <span className="h-px w-8 bg-accent/50" />
            </p>
          </FadeIn>
          <Reveal>
            <h2 className="mx-auto mt-7 max-w-[18ch] text-balance font-display text-display-sm font-extrabold leading-[0.94] tracking-tight text-fg md:text-display-md">
              Резервирайте своя автомобил.
            </h2>
          </Reveal>
          <FadeIn delay={0.2}>
            <p className="mx-auto mt-6 max-w-md text-fg/70 md:text-lg">
              Кажете ни модела и датите — ще се погрижим за всичко останало.
            </p>
          </FadeIn>
          <FadeIn delay={0.32}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <ButtonLink href="/kontakti" variant="solid" size="lg" arrow>
                Запитване за наем
              </ButtonLink>
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                className="group inline-flex items-center gap-2 text-sm font-medium text-fg transition-colors hover:text-accent"
              >
                {contactInfo.phone}
                <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
