import { ShieldCheck, Check } from "lucide-react";
import type { Vehicle } from "@/types";
import { formatNumber } from "@/lib/utils";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";

/**
 * Transparent vehicle-history / certification layout. Frames the dealership's
 * standard verification process for THIS car (honest — it's what gets checked),
 * plus factual provenance (first registration, verified mileage, VIN). Builds
 * confidence without inventing per-car claims.
 */
export function VehicleProvenance({ vehicle }: { vehicle: Vehicle }) {
  const checks = [
    "Проверен произход и история на собственост",
    "Пълна сервизна документация",
    "Мултиточкова техническа проверка",
    "Проверка на пробег и автентичност",
    "Оценка на купе и лак за структурни щети",
  ];

  const facts: Array<{ label: string; value: string }> = [
    { label: "Първа регистрация", value: String(vehicle.year) },
    { label: "Заверен пробег", value: `${formatNumber(vehicle.mileage)} км` },
    { label: "Каросерия", value: vehicle.bodyType },
    ...(vehicle.vin ? [{ label: "VIN", value: vehicle.vin }] : []),
  ];

  return (
    <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
      <div className="lg:col-span-5">
        <FadeIn>
          <div className="flex items-center gap-3">
            <ShieldCheck className="size-5" strokeWidth={1.5} style={{ color: "var(--vg, var(--color-accent))" }} />
            <p className="eyebrow" style={{ color: "var(--vg-soft, var(--color-fg-muted))" }}>
              Прозрачна история
            </p>
          </div>
        </FadeIn>
        <Reveal>
          <h2 className="mt-5 font-mega text-[clamp(2rem,4.4vw,3.4rem)] leading-[0.95] text-fg">
            Сертифицирано състояние
          </h2>
        </Reveal>
        <FadeIn delay={0.1}>
          <p className="mt-5 max-w-md text-sm leading-relaxed text-fg-muted">
            Всеки автомобил преминава щателна проверка, преди да достигне
            шоурума. Получавате пълна документация и ясна история — купувате с
            увереност, а не с надежда.
          </p>
        </FadeIn>

        <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-6">
          {facts.map((f) => (
            <FadeIn key={f.label}>
              <dt className="text-xs uppercase tracking-wider text-fg-subtle">
                {f.label}
              </dt>
              <dd className="mt-1.5 font-display text-base font-semibold text-fg">
                {f.value}
              </dd>
            </FadeIn>
          ))}
        </dl>
      </div>

      <div className="lg:col-span-6 lg:col-start-7">
        <ul className="vd-card overflow-hidden rounded-[1.5rem]">
          {checks.map((c, i) => (
            <FadeIn key={c} delay={i * 0.06}>
              <li className="flex items-center gap-4 border-b border-line px-6 py-5 transition-colors last:border-0 hover:bg-elevated">
                <span
                  className="flex size-8 shrink-0 items-center justify-center rounded-full"
                  style={{ background: "rgb(var(--vg-glow, 169 130 76) / 0.14)", color: "var(--vg, var(--color-accent))" }}
                >
                  <Check className="size-4" strokeWidth={2.5} />
                </span>
                <span className="text-sm text-fg">{c}</span>
              </li>
            </FadeIn>
          ))}
        </ul>
      </div>
    </div>
  );
}
