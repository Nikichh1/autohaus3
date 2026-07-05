import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import { services } from "@/lib/nav";
import { getSettings } from "@/lib/settings/read";
import { FacebookIcon, InstagramIcon, YouTubeIcon } from "@/components/icons/brand";

const company = [
  { href: "/za-nas", label: "За нас" },
  { href: "/kontakti", label: "Контакти" },
  { href: "/kariera", label: "Кариери" },
  { href: "/novini", label: "Новини" },
];

const legal = [
  { href: "/politika-poveritelnost", label: "Политика за поверителност" },
  { href: "/obshti-usloviya", label: "Общи условия" },
  { href: "/bisquitki", label: "Бисквитки" },
];

export async function Footer() {
  const { contact, social, branding } = await getSettings();
  return (
    <footer className="border-t border-line bg-base">
      <div className="mx-auto max-w-(--container-wide) px-4 pb-12 pt-24 md:px-8 md:pt-32 xl:px-12">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-12">
          {/* Brand block */}
          <div className="md:col-span-5">
            <Link href="/" aria-label="AutoHaus — Начало">
              <Image
                src="/brand/logo.svg"
                alt="AutoHaus"
                width={200}
                height={36}
                unoptimized
                className="h-8 w-auto"
              />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-fg-muted">
              {branding.tagline}
            </p>

            <div className="mt-8 flex gap-3">
              {social.facebook ? (
                <SocialIcon href={social.facebook} label="Facebook">
                  <FacebookIcon className="size-4" />
                </SocialIcon>
              ) : null}
              {social.instagram ? (
                <SocialIcon href={social.instagram} label="Instagram">
                  <InstagramIcon className="size-4" />
                </SocialIcon>
              ) : null}
              {social.youtube ? (
                <SocialIcon href={social.youtube} label="YouTube">
                  <YouTubeIcon className="size-4" />
                </SocialIcon>
              ) : null}
            </div>
          </div>

          {/* Columns */}
          <div className="md:col-span-2">
            <FooterHeading>Услуги</FooterHeading>
            <ul className="mt-5 space-y-3">
              <FooterLink href="/avtomobili">Автомобили</FooterLink>
              {services.map((s) => (
                <FooterLink key={s.href} href={s.href}>
                  {s.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          <div className="md:col-span-2">
            <FooterHeading>Компания</FooterHeading>
            <ul className="mt-5 space-y-3">
              {company.map((c) => (
                <FooterLink key={c.href} href={c.href}>
                  {c.label}
                </FooterLink>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <FooterHeading>Контакти</FooterHeading>
            <ul className="mt-5 space-y-3 text-sm text-fg-muted">
              <li>
                <a
                  href={`tel:${contact.phone.replace(/\s/g, "")}`}
                  className="transition-colors hover:text-fg"
                >
                  {contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${contact.email}`}
                  className="transition-colors hover:text-fg"
                >
                  {contact.email}
                </a>
              </li>
              <li className="pt-2">
                {contact.street}
                <br />
                {contact.area}
                <br />
                {contact.postcode} {contact.city}, {contact.country}
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-20 flex flex-col gap-4 border-t border-line pt-8 text-xs text-fg-subtle md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {contact.company} · ЕИК {contact.eik}. Всички права запазени.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {legal.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="transition-colors hover:text-fg-muted">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}

function FooterHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="eyebrow text-fg-subtle">{children}</h3>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        {children}
        <ArrowUpRight className="size-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" />
      </Link>
    </li>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-10 items-center justify-center rounded-full border border-line text-fg-muted transition-colors hover:border-accent hover:text-accent"
    >
      {children}
    </a>
  );
}
