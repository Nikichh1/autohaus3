"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowUpRight, X, Phone, Mail, MapPin } from "lucide-react";
import { services, contactInfo } from "@/lib/nav";

const allLinks = [
  { href: "/avtomobili", label: "Автомобили" },
  { href: "/pod-naem", label: "Под наем" },
  ...services,
  { href: "/kontakti", label: "Контакти" },
];

export function MobileMenu({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="field-graphite fixed inset-0 z-[60] overflow-y-auto lg:hidden"
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

          <div className="relative flex min-h-full flex-col">
            {/* Header */}
            <div className="flex h-20 items-center justify-between px-4">
              <Link href="/" onClick={onClose} aria-label="AutoHaus — Начало">
                <Image src="/brand/logo.svg" alt="AutoHaus" width={140} height={25} unoptimized className="h-6 w-auto" />
              </Link>
              <button
                type="button"
                aria-label="Затвори меню"
                onClick={onClose}
                className="flex size-10 items-center justify-center rounded-full border border-line-strong text-fg transition-colors hover:border-accent"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Links */}
            <nav className="mt-2 flex flex-col px-4">
              {allLinks.map((item, i) => (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.05 + i * 0.04, ease: [0.2, 0, 0, 1] }}
                  className="border-b border-line first:border-t"
                >
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className="group flex items-center justify-between gap-4 py-5"
                  >
                    <span className="flex items-baseline gap-4">
                      <span className="font-display text-xs tabular-nums text-fg-subtle">
                        0{i + 1}
                      </span>
                      <span className="font-display text-3xl font-semibold tracking-tight text-fg transition-colors group-hover:text-accent">
                        {item.label}
                      </span>
                    </span>
                    <ArrowUpRight className="size-5 text-fg-muted transition-all duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-accent" />
                  </Link>
                </motion.div>
              ))}
            </nav>

            {/* Primary CTA */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.05 + allLinks.length * 0.04 }}
              className="mt-8 px-4"
            >
              <Link
                href="/kontakti"
                onClick={onClose}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-full bg-fg text-sm font-medium text-ink transition-colors hover:bg-accent"
              >
                Запазете оглед
                <ArrowUpRight className="size-4" />
              </Link>
            </motion.div>

            {/* Contact */}
            <div className="mt-auto px-4 pb-10 pt-12">
              <div className="grid gap-3 border-t border-line pt-6 text-sm">
                <a href={`tel:${contactInfo.phone.replace(/\s/g, "")}`} className="flex items-center gap-3 text-fg transition-colors hover:text-accent">
                  <Phone className="size-4 text-accent" strokeWidth={1.7} />
                  <span className="tabular-nums">{contactInfo.phone}</span>
                </a>
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-3 text-fg-muted transition-colors hover:text-fg">
                  <Mail className="size-4 text-accent" strokeWidth={1.7} />
                  {contactInfo.email}
                </a>
                <p className="flex items-center gap-3 text-fg-muted">
                  <MapPin className="size-4 text-accent" strokeWidth={1.7} />
                  {contactInfo.address.street}, {contactInfo.address.city}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
