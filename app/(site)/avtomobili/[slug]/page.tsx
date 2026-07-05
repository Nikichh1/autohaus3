import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Check, Phone } from "lucide-react";
import type { Vehicle } from "@/types";
import { getVehicleBySlug, getSimilarVehicles, getPublicSlugs } from "@/lib/data/vehicles";
import { getSettingsGroup } from "@/lib/settings/read";
import type { FinancingSettings } from "@/lib/settings/config";
import { collections } from "@/lib/collections";
import { formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";
import { contactInfo } from "@/lib/nav";
import { CinematicHero } from "@/components/vehicle/CinematicHero";
import { ProductLoader } from "@/components/vehicle/ProductLoader";
import { VehicleCollage } from "@/components/vehicle/VehicleCollage";
import { VelocityMarquee } from "@/components/motion/VelocityMarquee";
import { Parallax } from "@/components/motion/Parallax";
import { SplitText } from "@/components/motion/SplitText";
import { SpecTable } from "@/components/vehicle/SpecTable";
import { FinancingCalculator } from "@/components/vehicle/FinancingCalculator";
import { VehicleInquiryForm } from "@/components/vehicle/VehicleInquiryForm";
import { VehicleStickyBar } from "@/components/vehicle/VehicleStickyBar";
import { SimilarVehicles } from "@/components/vehicle/SimilarVehicles";
import { TrackView } from "@/components/vehicle/TrackView";
import { FadeIn } from "@/components/motion/FadeIn";
import { StatCounter } from "@/components/motion/StatCounter";
import { BlurImage } from "@/components/motion/BlurImage";

// Statically generated per vehicle, refreshed on admin edits via revalidatePath
// (see lib/admin/vehicle-actions.ts) + an hourly ISR safety net. New/unknown
// slugs render on demand and are cached (dynamicParams defaults to true).
export const revalidate = 3600;

export async function generateStaticParams() {
  try {
    const slugs = await getPublicSlugs();
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

const BASE_URL = "https://autohaus.bg";

type PageProps = { params: Promise<{ slug: string }> };

function absUrl(path: string): string {
  return path.startsWith("http") ? path : `${BASE_URL}${path}`;
}

function vehicleSummary(v: Vehicle): string {
  return [`${v.year} г.`, `${formatNumber(v.mileage)} км`, fuelLabels[v.fuelType], transmissionLabels[v.transmission], v.power ? `${v.power} к.с.` : null]
    .filter(Boolean)
    .join(" · ");
}

function metaDescription(v: Vehicle, fullLabel: string): string {
  const base = v.description?.trim();
  if (base) return base.slice(0, 160);
  return `${fullLabel} — ${vehicleSummary(v)}. Проверена история и писмена гаранция от AutoHaus, Пловдив.`.slice(0, 160);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) return {};
  const title = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const description = metaDescription(vehicle, title);
  const canonical = `/avtomobili/${vehicle.slug}/`;
  const images = vehicle.images.slice(0, 4).map((url) => ({ url: absUrl(url), alt: title }));
  return {
    title,
    description,
    keywords: [vehicle.brand, vehicle.model, vehicle.variant, vehicle.bodyType, "автомобил", "продажба", "лизинг", "Пловдив"].filter((k): k is string => Boolean(k)),
    alternates: { canonical },
    openGraph: { type: "website", title: `${title} · AutoHaus`, description, url: canonical, images: images.length ? images : undefined },
    twitter: { card: "summary_large_image", title: `${title} · AutoHaus`, description, images: images.map((i) => i.url) },
  };
}

function indicativeMonthly(price: number, f: FinancingSettings): number {
  if (price <= 0) return 0;
  const financed = price * (1 - f.downPaymentPct / 100);
  if (financed <= 0) return 0;
  const r = f.annualRatePct / 100 / 12;
  const n = f.termMonths;
  if (r <= 0) return Math.round(financed / n);
  return Math.round((financed * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1));
}

function buildJsonLd(
  vehicle: Vehicle,
  fullLabel: string,
  description: string,
  contact: { company: string; phone: string; street: string; city: string; postcode: string; country: string },
) {
  const canonicalUrl = absUrl(`/avtomobili/${vehicle.slug}/`);
  const engine: Record<string, unknown> = { "@type": "EngineSpecification" };
  if (vehicle.power) engine.enginePower = { "@type": "QuantitativeValue", value: vehicle.power, unitText: "к.с." };
  if (vehicle.torque) engine.torque = { "@type": "QuantitativeValue", value: vehicle.torque, unitText: "Nm" };
  if (vehicle.engineCC) engine.engineDisplacement = { "@type": "QuantitativeValue", value: vehicle.engineCC, unitCode: "CMQ" };
  const car: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: fullLabel,
    description,
    url: canonicalUrl,
    brand: { "@type": "Brand", name: vehicle.brand },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    productionDate: String(vehicle.year),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: vehicle.mileage, unitCode: "KMT" },
    fuelType: fuelLabels[vehicle.fuelType],
    vehicleTransmission: transmissionLabels[vehicle.transmission],
    driveWheelConfiguration: drivetrainLabels[vehicle.drivetrain],
    vehicleEngine: engine,
    image: vehicle.images.map(absUrl),
    ...(vehicle.variant ? { vehicleConfiguration: vehicle.variant } : {}),
    ...(vehicle.bodyType ? { bodyType: vehicle.bodyType } : {}),
    ...(vehicle.exteriorColor ? { color: vehicle.exteriorColor } : {}),
    ...(vehicle.vin ? { vehicleIdentificationNumber: vehicle.vin } : {}),
    ...(vehicle.doors ? { numberOfDoors: vehicle.doors } : {}),
    ...(vehicle.seats ? { seatingCapacity: vehicle.seats } : {}),
    ...(vehicle.topSpeed ? { speed: { "@type": "QuantitativeValue", value: vehicle.topSpeed, unitCode: "KMH" } } : {}),
    ...(vehicle.acceleration ? { accelerationTime: { "@type": "QuantitativeValue", value: vehicle.acceleration, unitCode: "SEC" } } : {}),
  };
  if (vehicle.price > 0) {
    car.offers = {
      "@type": "Offer",
      priceCurrency: "EUR",
      price: vehicle.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      url: canonicalUrl,
      seller: {
        "@type": "AutoDealer",
        name: contact.company || "AutoHaus",
        ...(contact.phone ? { telephone: contact.phone } : {}),
        address: { "@type": "PostalAddress", ...(contact.street ? { streetAddress: contact.street } : {}), ...(contact.city ? { addressLocality: contact.city } : {}), ...(contact.postcode ? { postalCode: contact.postcode } : {}), addressCountry: "BG" },
      },
    };
  }
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Начало", item: `${BASE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Автомобили", item: `${BASE_URL}/avtomobili/` },
      { "@type": "ListItem", position: 3, name: fullLabel, item: canonicalUrl },
    ],
  };
  return [car, breadcrumb];
}

export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = await getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const [similar, financing, contact] = await Promise.all([
    getSimilarVehicles(vehicle, 3),
    getSettingsGroup("financing"),
    getSettingsGroup("contact"),
  ]);

  const fullLabel = `${vehicle.brand} ${vehicle.model}${vehicle.variant ? " " + vehicle.variant : ""}`;
  const description = metaDescription(vehicle, fullLabel);
  const monthly = indicativeMonthly(vehicle.price, financing);
  const phone = contact.phone?.trim() || contactInfo.phone;
  const telHref = `tel:${phone.replace(/\s/g, "")}`;
  const jsonLd = buildJsonLd(vehicle, fullLabel, description, contact);
  const coll = collections.find((c) => c.slug === vehicle.collection);

  const detailImg = vehicle.images[1] ?? vehicle.images[0];
  const immersiveImg = vehicle.images[Math.min(2, vehicle.images.length - 1)] ?? vehicle.images[0];
  const ctaImg = vehicle.images[0];

  // Numeric stats animate (count-up); text stats render in the same titanium type.
  // Drawing on both keeps the row stack full even for cars with sparse specs.
  type PerfRow = { label: string; sub: string; to?: number; dec?: number; unit?: string; text?: string };
  const perfRows = (
    [
      vehicle.power ? { to: vehicle.power, dec: 0, unit: "к.с.", label: "Максимална мощност", sub: vehicle.engineCC ? `${formatNumber(vehicle.engineCC)} см³` : fuelLabels[vehicle.fuelType] } : null,
      vehicle.torque ? { to: vehicle.torque, dec: 0, unit: "Nm", label: "Въртящ момент", sub: "пикова стойност" } : null,
      vehicle.acceleration ? { to: vehicle.acceleration, dec: 1, unit: "сек", label: "Ускорение 0–100 км/ч", sub: transmissionLabels[vehicle.transmission] } : null,
      vehicle.topSpeed ? { to: vehicle.topSpeed, dec: 0, unit: "км/ч", label: "Максимална скорост", sub: "електронно ограничена" } : null,
      vehicle.engineCC ? { to: vehicle.engineCC, dec: 0, unit: "см³", label: "Работен обем", sub: "двигател" } : null,
      vehicle.mileage ? { to: vehicle.mileage, dec: 0, unit: "км", label: "Заверен пробег", sub: vehicle.exteriorColor || "проверен" } : null,
      { text: transmissionLabels[vehicle.transmission], label: "Трансмисия", sub: drivetrainLabels[vehicle.drivetrain] },
      { text: fuelLabels[vehicle.fuelType], label: "Гориво", sub: vehicle.bodyType || `${vehicle.year} г.` },
      vehicle.seats ? { text: `${vehicle.seats}`, label: "Места", sub: vehicle.doors ? `${vehicle.doors} врати` : "седалки" } : null,
    ].filter(Boolean) as PerfRow[]
  ).slice(0, 6);

  const marqueeText = [
    `${vehicle.power} К.С.`,
    vehicle.torque ? `${vehicle.torque} NM` : null,
    vehicle.acceleration ? `0–100 ЗА ${vehicle.acceleration} С` : null,
    vehicle.topSpeed ? `${vehicle.topSpeed} КМ/Ч` : null,
    fuelLabels[vehicle.fuelType].toUpperCase(),
    transmissionLabels[vehicle.transmission].toUpperCase(),
  ].filter(Boolean).join("  ◦  ");

  const facts = [
    { k: "Първа регистрация", v: String(vehicle.year) },
    { k: "Заверен пробег", v: `${formatNumber(vehicle.mileage)} км` },
    { k: "Двигател", v: vehicle.engineCC ? `${(vehicle.engineCC / 1000).toFixed(1)}L` : fuelLabels[vehicle.fuelType] },
    { k: "Задвижване", v: drivetrainLabels[vehicle.drivetrain] },
  ];

  const highlights = vehicle.features;

  return (
    <article className="vehicle-detail text-fg">
      <TrackView slug={vehicle.slug} />
      <ProductLoader slug={vehicle.slug} brand={vehicle.brand} model={vehicle.model} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />

      {/* 1 · HERO */}
      <CinematicHero vehicle={vehicle} monthly={monthly} collLabel={coll?.label ?? ""} phone={phone} />

      {/* MARQUEE — telemetry stats */}
      <div className="overflow-hidden bg-[#d2d7dc] py-3.5 text-[#0a0c10]">
        <VelocityMarquee text={marqueeText} baseVelocity={-2.2} separator="◦" className="text-sm font-bold uppercase tracking-[0.12em]" />
      </div>

      {/* 2 · PERFORMANCE — stat rows */}
      <section className="vd-dark relative overflow-hidden px-6 py-[clamp(90px,13vh,170px)] md:px-8" style={{ background: "radial-gradient(120% 90% at 50% 0%,#181c23 0%,#101319 52%,#0b0d12 100%)" }}>
        <div className="relative mx-auto max-w-[1320px]">
          <div className="mb-[clamp(40px,6vh,72px)] flex flex-wrap items-end justify-between gap-6">
            <div>
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">[ 02 — Перформанс ]</p>
              <h2 className="font-mega text-[clamp(38px,5.6vw,86px)] leading-[0.94]"><SplitText text={"Числата разказват\nсамо началото"} /></h2>
            </div>
            <p className="max-w-[280px] text-[13.5px] leading-relaxed text-fg-muted">Заводски стойности — мощност, динамика и характер на този автомобил.</p>
          </div>
          <div>
            {perfRows.map((r, i) => (
              <FadeIn key={r.label}>
                <div className={`flex items-center justify-between gap-6 border-t border-line py-[clamp(18px,3vh,34px)] ${i === perfRows.length - 1 ? "border-b" : ""}`}>
                  <div className="flex items-baseline gap-4 md:gap-[18px]">
                    <span className="text-xs font-semibold text-accent">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <p className="font-mega text-[clamp(15px,1.6vw,20px)] leading-none">{r.label}</p>
                      <p className="mt-1.5 text-xs text-fg-subtle">{r.sub}</p>
                    </div>
                  </div>
                  {typeof r.to === "number" ? (
                    <p className="flex items-baseline gap-2">
                      <StatCounter to={r.to} decimals={r.dec ?? 0} className="text-titanium-num font-mega text-[clamp(40px,7vw,100px)] leading-none tabular-nums" />
                      <span className="text-[clamp(13px,1.4vw,17px)] font-medium text-[#8e959d]">{r.unit}</span>
                    </p>
                  ) : (
                    <p className="text-titanium-num font-mega text-right text-[clamp(22px,3.4vw,46px)] leading-none">{r.text}</p>
                  )}
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* 3 · FINANCING */}
      {vehicle.price > 0 && (
        <section id="financing" className="vd-dark relative scroll-mt-20 overflow-hidden px-6 py-[clamp(80px,11vh,150px)] md:px-8" style={{ background: "radial-gradient(120% 90% at 50% 0%,#181c23 0%,#101319 55%,#0b0d12 100%)" }}>
          <div className="mx-auto max-w-[1180px]">
            <div className="mb-[clamp(36px,5vh,56px)] text-center">
              <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">[ 03 — Финансиране ]</p>
              <h2 className="font-mega text-[clamp(34px,4.8vw,74px)] leading-[0.94]"><SplitText text={"Притежавайте я при\nсвои условия"} /></h2>
            </div>
            <FadeIn>
              <FinancingCalculator price={vehicle.price} annualRatePct={financing.annualRatePct} downPaymentPct={financing.downPaymentPct} termMonths={financing.termMonths} />
            </FadeIn>
          </div>
        </section>
      )}

      {/* 4 · SPEC + EQUIPMENT (cream) */}
      <section id="equipment" className="relative scroll-mt-20 overflow-hidden bg-base px-6 py-[clamp(90px,13vh,160px)] text-fg md:px-8">
        <div className="mx-auto max-w-[1320px]">
          <div className="mb-[clamp(40px,6vh,68px)]">
            <p className="mb-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-subtle">[ 04 — Технически данни ]</p>
            <h2 className="font-mega text-[clamp(38px,5.6vw,86px)] leading-[0.94] text-fg"><SplitText text={"Всеки детайл,\nдокументиран"} /></h2>
          </div>
          <div className={`grid grid-cols-1 gap-[clamp(40px,5vw,72px)] ${highlights.length > 0 ? "md:grid-cols-2" : ""}`}>
            <FadeIn>
              <SpecTable vehicle={vehicle} />
            </FadeIn>
            {highlights.length > 0 && (
              <div>
                <h3 className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-subtle">Оборудване</h3>
                <FadeIn>
                  <ul className="grid grid-cols-1 gap-x-7 sm:grid-cols-2">
                    {highlights.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 border-b border-line py-3">
                        <Check className="mt-0.5 size-4 shrink-0 text-fg" strokeWidth={2.4} aria-hidden />
                        <span className="text-[13.5px] leading-snug text-fg/80">{f}</span>
                      </li>
                    ))}
                  </ul>
                </FadeIn>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 5 · IMMERSIVE full-bleed */}
      <section className="vd-dark relative h-[92vh] min-h-[520px] overflow-hidden bg-[#0a0c10]">
        <Parallax distance={90} className="absolute inset-x-0 inset-y-[-12%]">
          <BlurImage src={immersiveImg} alt={`${fullLabel} — присъствие`} fill sizes="100vw" className="object-cover object-[center_42%]" />
        </Parallax>
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-[#0a0c10]/55 via-[#0a0c10]/10 to-[#0a0c10]/85" />
        <div className="absolute inset-0 z-[3] flex flex-col items-center justify-center px-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">[ 05 ] Присъствие</p>
          <h2 className="mt-5 max-w-[16ch] font-mega text-[clamp(40px,8.4vw,132px)] leading-[0.9] [text-shadow:0_8px_50px_rgba(0,0,0,.5)]"><SplitText text="Създадена да доминира пътя" /></h2>
        </div>
        <div aria-hidden className="absolute bottom-6 left-6 z-[3] text-[10.5px] font-semibold uppercase tracking-[0.16em] text-fg-muted md:left-8">F: 1/640 · ISO 200 · 35MM</div>
      </section>

      {/* 6 · EDITORIAL DETAIL */}
      <section className="vd-dark relative overflow-hidden bg-[#0a0c10] px-6 py-[clamp(80px,11vh,150px)] md:px-8">
        <div className="mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-[clamp(36px,5vw,64px)] md:grid-cols-2">
          <div className="vd-cut relative aspect-[16/11] overflow-hidden border border-line shadow-[0_50px_110px_-54px_rgba(0,0,0,0.9)]">
            <Parallax distance={50} className="absolute inset-x-0 inset-y-[-10%]">
              <BlurImage src={detailImg} alt={`${fullLabel} — детайл`} fill sizes="(min-width:900px) 50vw, 100vw" className="object-cover" />
            </Parallax>
            <span className="absolute bottom-4 left-4 z-10 font-mega text-[10.5px] tracking-[0.16em] text-accent">{vehicle.exteriorColor || "ДЕТАЙЛ"} · ДЕТАЙЛ</span>
          </div>
          <div>
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">[ 06 — Произход ]</p>
            <h2 className="font-mega text-[clamp(32px,4.6vw,64px)] leading-[0.96]"><SplitText text={"Историята е\nчаст от стойността"} /></h2>
            <p className="mt-6 max-w-[460px] text-[clamp(15px,1.5vw,18px)] leading-relaxed text-fg/75">
              Всеки автомобил преминава щателна проверка, преди да достигне шоурума — пълна документация и ясна история. Купувате с увереност, а не с надежда.
            </p>
            <dl className="mt-10 grid max-w-[480px] grid-cols-1 gap-x-9 gap-y-7 sm:grid-cols-2">
              {facts.map((f) => (
                <FadeIn key={f.k}>
                  <dt className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-fg-subtle">{f.k}</dt>
                  <dd className="mt-2 font-mega text-[21px] leading-none">{f.v}</dd>
                </FadeIn>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* 7 · GALLERY collage (cream) */}
      <section className="relative overflow-hidden bg-base px-6 py-[clamp(70px,10vh,130px)] text-fg md:px-8">
        <div aria-hidden className="pointer-events-none absolute inset-x-0 top-10 z-0 flex justify-center overflow-hidden">
          <Parallax distance={50}>
            <span className="text-stroke block whitespace-nowrap font-mega text-[clamp(90px,18vw,250px)] leading-none">Колекция</span>
          </Parallax>
        </div>
        <div className="relative z-10 mx-auto max-w-[1320px]">
          <div className="mb-[clamp(34px,5vh,56px)] flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-fg-subtle">[ 07 — Галерия ]</p>
              <h2 className="font-mega text-[clamp(38px,5.6vw,86px)] leading-[0.94] text-fg"><SplitText text="В движение" /></h2>
            </div>
            <p className="max-w-[264px] text-[13px] leading-relaxed text-fg-muted">Скролвайте — всеки кадър се движи със собствен ритъм.</p>
          </div>
          <VehicleCollage images={vehicle.images} alt={fullLabel} />
        </div>
      </section>

      {/* 8 · CTA — inquiry on a notched dark panel */}
      <section id="inquiry" className="relative scroll-mt-0 overflow-hidden px-5 py-[clamp(70px,9vh,120px)] md:px-8" style={{ background: "linear-gradient(180deg,#efeee6 0%,#dfe1de 100%)" }}>
        <div className="vd-dark vd-cut-both relative mx-auto max-w-[1180px] overflow-hidden bg-[#0a0c10] shadow-[0_50px_120px_-50px_rgba(20,24,30,0.6)]">
          <Parallax distance={70} className="absolute inset-x-0 inset-y-[-12%]">
            <BlurImage src={ctaImg} alt="" fill sizes="100vw" className="object-cover object-[center_42%]" />
          </Parallax>
          <div aria-hidden className="absolute inset-0" style={{ background: "radial-gradient(90% 70% at 50% 0%,rgba(201,207,214,.14),transparent 55%),linear-gradient(180deg,rgba(10,12,16,.6),rgba(10,12,16,.85) 55%,rgba(10,12,16,.96))" }} />
          <div className="relative z-[3] px-[clamp(24px,5vw,72px)] py-[clamp(40px,7vw,84px)]">
            <div className="mx-auto max-w-[760px] text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-accent">[ 08 ] AutoHaus · Пловдив</p>
              <h2 className="mt-4 font-mega text-[clamp(44px,7.4vw,116px)] leading-[0.9]"><SplitText text="Заповядайте на оглед" /></h2>
              <p className="mx-auto mt-5 max-w-[480px] text-[15px] leading-relaxed text-fg/80">
                Оставете данните си или ни се обадете — ще подготвим автомобила за вашето посещение.
              </p>
              <a href={telHref} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-fg transition-colors hover:text-accent">
                <Phone className="size-4" aria-hidden /> {phone}
              </a>
            </div>
            <div className="mx-auto mt-8 max-w-[560px]">
              <VehicleInquiryForm vehicleLabel={fullLabel} vehicleSlug={vehicle.slug} bare />
            </div>
          </div>
        </div>
      </section>

      {/* 9 · SIMILAR */}
      {similar.length > 0 && (
        <section className="vd-dark relative overflow-hidden border-t border-line bg-[#0a0c10] px-6 py-[clamp(70px,9vh,120px)] md:px-8">
          <div className="mx-auto max-w-[1320px]">
            <p className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent">[ 09 — Колекцията продължава ]</p>
            <SimilarVehicles vehicles={similar} />
          </div>
        </section>
      )}

      <VehicleStickyBar vehicle={vehicle} phone={phone} />
    </article>
  );
}
