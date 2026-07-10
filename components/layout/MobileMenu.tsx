"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X, Phone, Mail, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { services, contactInfo } from "@/lib/nav";

const EASE = [0.2, 0, 0, 1] as const;

/** The destinations, ranked the way a phone visitor actually uses them:
 *  the three primary journeys full-bleed, the services as a quiet grid. */
const primary = [
  { href: "/avtomobili", label: "Автомобили" },
  { href: "/pod-naem", label: "Под наем" },
  { href: "/kontakti", label: "Контакти" },
];

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="Навигация"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="field-graphite fixed inset-0 z-[60] overflow-y-auto overscroll-contain lg:hidden"
          data-lenis-prevent
        >
          {/* depth */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-[50vh]"
            style={{
              background:
                "radial-gradient(80% 100% at 70% 0%, rgba(201,207,214,0.08), transparent 65%)",
            }}
          />

          <div
            className="relative flex min-h-full flex-col"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))",
            }}
          >
            {/* Header */}
            <div className="flex h-20 items-center justify-between px-5">
              <Link
                href="/"
                onClick={onClose}
                aria-label="AutoHaus — Начало"
                className="-my-2 flex items-center py-2 active:opacity-70"
              >
                <Image src="/brand/logo.svg" alt="AutoHaus" width={140} height={25} unoptimized className="h-6 w-auto" />
              </Link>
              <button
                type="button"
                aria-label="Затвори меню"
                onClick={onClose}
                className="flex size-11 items-center justify-center rounded-full border border-line-strong text-fg transition-[border-color,transform] duration-200 hover:border-accent active:scale-90"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Primary journeys — full-bleed, numbered, thumb-height rows */}
            <nav aria-label="Основна навигация" className="mt-1 flex flex-col px-5">
              {primary.map((item, i) => {
                const active = isActive(item.href);
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 + i * 0.05, ease: EASE }}
                    className="border-b border-line first:border-t"
                  >
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className="group flex items-center justify-between gap-4 py-5 active:opacity-70"
                    >
                      <span className="flex items-baseline gap-4">
                        <span className="font-display text-xs tabular-nums text-fg-subtle">
                          0{i + 1}
                        </span>
                        <span
                          className={cn(
                            "font-display text-[2rem] font-semibold leading-none tracking-tight transition-colors",
                            active ? "text-accent-warm" : "text-fg group-hover:text-accent",
                          )}
                        >
                          {item.label}
                        </span>
                        {active && (
                          <span aria-hidden className="size-1.5 translate-y-[-0.4em] rounded-full bg-accent" />
                        )}
                      </span>
                      <ArrowUpRight className="size-5 text-fg-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Services — a quiet, scannable grid */}
            <motion.nav
              aria-label="Услуги"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.24, ease: EASE }}
              className="mt-8 px-5"
            >
              <p className="label-fine text-fg-subtle">Услуги</p>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                {services.map((s) => {
                  const active = isActive(s.href);
                  return (
                    <Link
                      key={s.href}
                      href={s.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex min-h-[3.25rem] items-center justify-between gap-2 rounded-xl border px-4 py-3 transition-colors active:bg-white/[0.07]",
                        active
                          ? "border-accent/50 bg-white/[0.06] text-fg"
                          : "border-line bg-white/[0.03] text-fg/85",
                      )}
                    >
                      <span className="font-display text-[0.9375rem] font-semibold tracking-tight">
                        {s.label}
                      </span>
                      <ArrowUpRight className="size-3.5 shrink-0 text-fg-subtle" />
                    </Link>
                  );
                })}
              </div>
            </motion.nav>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
              className="mt-8 px-5"
            >
              <Link
                href="/kontakti"
                onClick={onClose}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-fg font-display text-sm font-bold tracking-tight text-ink transition-transform duration-150 active:scale-[0.98]"
              >
                Запазете оглед
                <ArrowUpRight className="size-4" />
              </Link>
            </motion.div>

            {/* Contact — real tap targets, one per row */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.36, ease: EASE }}
              className="mt-auto px-5 pt-10"
            >
              <div className="grid border-t border-line pt-3 text-sm">
                <a
                  href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                  className="flex items-center gap-3 py-2.5 text-fg transition-colors hover:text-accent active:opacity-70"
                >
                  <Phone className="size-4 text-accent" strokeWidth={1.7} />
                  <span className="tabular-nums">{contactInfo.phone}</span>
                </a>
                <a
                  href={`mailto:${contactInfo.email}`}
                  className="flex items-center gap-3 py-2.5 text-fg-muted transition-colors hover:text-fg active:opacity-70"
                >
                  <Mail className="size-4 text-accent" strokeWidth={1.7} />
                  {contactInfo.email}
                </a>
                <p className="flex items-center gap-3 py-2.5 text-fg-muted">
                  <MapPin className="size-4 text-accent" strokeWidth={1.7} />
                  {contactInfo.address.street}, {contactInfo.address.city}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
