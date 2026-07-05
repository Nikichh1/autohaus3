import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { getSettings } from "@/lib/settings/read";
import { getContent } from "@/lib/cms/read";
import { getAllPublicVehicles } from "@/lib/data/vehicles";
import { ContactForm } from "@/components/contact/ContactForm";
import { MapEmbed } from "@/components/contact/MapEmbed";
import { FadeIn } from "@/components/motion/FadeIn";
import { Reveal } from "@/components/motion/Reveal";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Контакти",
  description:
    "Свържете се с AutoHaus — адрес в Пловдив, телефони, имейли и работно време. Отдели продажби, сервиз, лизинг и застраховки.",
};

const departments = [
  {
    name: "Офис",
    phones: ["+359 884 777 147", "+359 885 760 284"],
    email: "autohausbg@gmail.com",
    hours: "Пон – Пет · 09:00 – 18:00",
  },
  {
    name: "Продажби",
    phones: ["+359 884 777 045", "+359 885 725 860"],
    email: "autohaussale@gmail.com",
    hours: "Пон – Пет · 09:00 – 18:00",
  },
  {
    name: "Брокер · Лизинг и застраховки",
    phones: ["+359 884 777 089", "+359 888 850 777"],
    email: "autohausbroker@gmail.com",
    note: "Щети: +359 884 560 502",
    hours: "Пон – Пет · 09:00 – 18:00",
  },
  {
    name: "Сервиз",
    phones: ["+359 884 777 321"],
    email: "autohausservices@gmail.com",
    note: "ГТП: +359 888 694 672",
    hours: "Пон – Пет · 09:00 – 18:00",
  },
  {
    name: "Auto Spa",
    phones: ["+359 884 777 148"],
    email: "autohauscomplex@gmail.com",
    hours: "Всеки ден · 08:00 – 20:00",
  },
  {
    name: "Кафе бар",
    phones: ["+359 884 777 148"],
    email: "autohauscomplex@gmail.com",
    hours: "Всеки ден · 08:00 – 20:00",
  },
];

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ vehicle?: string }>;
}) {
  const sp = await searchParams;
  const vehicles = await getAllPublicVehicles();
  const { contact, hours } = await getSettings();
  const cms = await getContent();
  const info = {
    company: contact.company,
    phone: contact.phone,
    email: contact.email,
    eik: contact.eik,
    vat: contact.vat,
    address: {
      street: contact.street,
      area: contact.area,
      city: contact.city,
      postcode: contact.postcode,
      country: contact.country,
    },
    hours: hours.items,
  };
  const requested = typeof sp.vehicle === "string" ? sp.vehicle.trim() : "";
  const matched = requested
    ? vehicles.find(
        (v) =>
          v.slug === requested ||
          `${v.brand} ${v.model}`.toLowerCase() === requested.toLowerCase(),
      )
    : undefined;
  const defaultMessage = requested
    ? `Здравейте, търся следния автомобил: ${requested}. Моля, свържете се с мен.`
    : undefined;

  const vehicleOptions = vehicles.map((v) => ({
    value: v.slug,
    label: `${v.brand} ${v.model}${v.variant ? " " + v.variant : ""}`,
  }));

  return (
    <div className="pb-32 pt-32 md:pt-40">
      <div className="mx-auto max-w-wide px-4 md:px-8 xl:px-12">
        {/* Header */}
        <header className="max-w-3xl">
          <FadeIn>
            <p className="eyebrow text-fg-muted">Контакти</p>
          </FadeIn>
          <Reveal>
            <h1 className="mt-6 font-display text-display-sm font-extrabold leading-[0.95] tracking-tight text-fg md:text-display-md">
              {cms["contact.heading"]}
            </h1>
          </Reveal>
          <FadeIn delay={0.2}>
            <p className="mt-6 max-w-xl text-base text-fg-muted md:text-lg">
              {cms["contact.subcopy"]}
            </p>
          </FadeIn>
        </header>

        {/* Form + details */}
        <div className="mt-16 grid gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Form */}
          <div className="lg:col-span-7">
            <ContactForm
              vehicleOptions={vehicleOptions}
              defaultVehicle={matched?.slug}
              defaultMessage={defaultMessage}
            />
          </div>

          {/* Details */}
          <div className="lg:col-span-5">
            <div className="space-y-10">
              <DetailRow icon={<MapPin className="size-5" />} label="Адрес">
                {info.address.street}
                <br />
                {info.address.area}
                <br />
                {info.address.postcode} {info.address.city},{" "}
                {info.address.country}
                <br />
                <span className="text-xs text-fg-subtle">
                  ЕИК {info.eik} · ДДС {info.vat}
                </span>
              </DetailRow>

              <DetailRow icon={<Phone className="size-5" />} label="Телефон">
                <a
                  href={`tel:${info.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-accent"
                >
                  {info.phone}
                </a>
              </DetailRow>

              <DetailRow icon={<Mail className="size-5" />} label="Имейл">
                <a
                  href={`mailto:${info.email}`}
                  className="transition-colors hover:text-accent"
                >
                  {info.email}
                </a>
              </DetailRow>

              <DetailRow icon={<Clock className="size-5" />} label="Работно време">
                <ul className="space-y-1">
                  {info.hours.map((h) => (
                    <li key={h.days} className="flex justify-between gap-6">
                      <span>{h.days}</span>
                      <span className="text-fg">{h.time}</span>
                    </li>
                  ))}
                </ul>
              </DetailRow>
            </div>
          </div>
        </div>

        {/* Departments */}
        <div className="mt-24">
          <FadeIn>
            <h2 className="eyebrow text-fg-muted">Отдели</h2>
          </FadeIn>
          <div className="edge-light mt-8 grid grid-cols-1 gap-px overflow-hidden rounded-[1.25rem] border border-line-strong bg-line md:grid-cols-3">
            {departments.map((d) => (
              <div
                key={d.name}
                className="bg-gradient-to-b from-[#16191e] to-[#0f1216] p-8 transition-colors hover:from-[#1b1f25]"
              >
                <h3 className="font-display text-xl font-semibold text-fg">
                  {d.name}
                </h3>
                <div className="mt-4 space-y-2 text-sm text-fg-muted">
                  {d.phones.map((p) => (
                    <p key={p}>
                      <a
                        href={`tel:${p.replace(/\s/g, "")}`}
                        className="transition-colors hover:text-accent"
                      >
                        {p}
                      </a>
                    </p>
                  ))}
                  {"note" in d && d.note && (
                    <p className="text-fg-subtle">{d.note}</p>
                  )}
                  <p>
                    <a
                      href={`mailto:${d.email}`}
                      className="transition-colors hover:text-accent"
                    >
                      {d.email}
                    </a>
                  </p>
                  <p className="pt-1 text-xs uppercase tracking-wider text-fg-subtle">
                    {d.hours}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="mt-24 h-[420px] w-full overflow-hidden border-y border-line md:h-[520px]">
        <MapEmbed query="Пловдив, България" title="AutoHaus локация — Пловдив" />
      </div>
    </div>
  );
}

function DetailRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <FadeIn>
      <div className="flex gap-5 border-b border-line pb-8">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-full border border-line text-accent">
          {icon}
        </div>
        <div>
          <p className="eyebrow text-fg-subtle">{label}</p>
          <div className="mt-2 text-fg-muted">{children}</div>
        </div>
      </div>
    </FadeIn>
  );
}
