import type { Metadata } from "next";
import { Suspense } from "react";
import { ShieldCheck, FileCheck, Globe2 } from "lucide-react";
import { getAllPublicVehicles } from "@/lib/data/vehicles";
import { VehicleListing } from "./VehicleListing";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Автомобили",
  description:
    "Подбрана колекция от премиум автомобили — BMW M, Mercedes-AMG, Rolls-Royce, Lamborghini и други водещи марки. Всеки с проверена история и гаранция.",
};

const badges = [
  { Icon: ShieldCheck, label: "Сертифицирано състояние" },
  { Icon: FileCheck, label: "Писмена гаранция" },
  { Icon: Globe2, label: "Внос по поръчка" },
];

export default async function VehiclesPage() {
  const vehicles = await getAllPublicVehicles();
  return (
    <div className="field-graphite relative">
      {/* showroom spotlight + top hairline */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[70vh]"
        style={{
          background:
            "radial-gradient(70% 100% at 50% 0%, rgba(201,207,214,0.08), transparent 65%)",
        }}
      />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />

      <div className="relative mx-auto max-w-wide px-4 pb-32 pt-32 md:px-8 md:pt-40 xl:px-12">
        <header className="mb-14 max-w-3xl md:mb-20">
          <FadeIn>
            <p className="flex items-center gap-3 text-accent">
              <span className="h-px w-8 bg-accent/50" />
              <span className="label-fine">Нашата колекция</span>
            </p>
          </FadeIn>
          <Reveal>
            <h1 className="mt-6 font-display text-display-sm font-extrabold leading-[0.95] tracking-tight text-fg md:text-display-md xl:text-display-lg">
              Намерете своята.
            </h1>
          </Reveal>
          <FadeIn delay={0.18}>
            <p className="mt-6 max-w-xl text-base text-fg-muted md:text-lg">
              Всеки автомобил тук е преминал нашата проверка и носи гаранция — за
              да изберете със сърце и да карате с увереност.
            </p>
          </FadeIn>
          <FadeIn delay={0.28}>
            <div className="mt-8 flex flex-wrap gap-2.5">
              {badges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-4 py-2 text-xs font-medium text-fg-muted"
                >
                  <b.Icon className="size-3.5 text-accent" strokeWidth={1.7} />
                  {b.label}
                </span>
              ))}
            </div>
          </FadeIn>
        </header>

        <Suspense
          fallback={
            <div className="h-96 animate-pulse rounded-2xl bg-surface" />
          }
        >
          <VehicleListing vehicles={vehicles} />
        </Suspense>
      </div>
    </div>
  );
}
