"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
} from "framer-motion";
import { ArrowUpRight, ChevronDown, Menu, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { services, contactInfo } from "@/lib/nav";
import { MobileMenu } from "./MobileMenu";

export function Nav() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const barRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    setScrolled(y > 60);
  });

  // Cursor-tracked specular — a soft pool of light follows the pointer across
  // the glass (desktop only). The signature liquid-glass micro-interaction.
  const mx = useMotionValue(-400);
  const my = useMotionValue(16);
  const specular = useMotionTemplate`radial-gradient(220px circle at ${mx}px ${my}px, rgb(255 255 255 / 0.09), rgb(255 255 255 / 0.02) 40%, transparent 66%)`;

  const onBarMove = (e: React.MouseEvent) => {
    const el = barRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    mx.set(e.clientX - r.left);
    my.set(e.clientY - r.top);
  };

  const transparentRoutes = [
    "/",
    "/pod-naem",
    "/zastrahovki",
    "/lizing",
    "/serviz",
    "/auto-spa",
    "/kafe-bar",
  ];
  const allowsTransparent = transparentRoutes.includes(pathname);
  const isSolid = scrolled || !allowsTransparent;

  return (
    <>
      <header data-site-nav className="fixed inset-x-0 top-0 z-50">
        <div
          className={cn(
            "mx-auto transition-[max-width,margin,padding] duration-500 ease-out",
            isSolid
              ? "mt-3 max-w-[calc(var(--container-wide)+1.5rem)] px-3 md:px-6"
              : "mt-0 max-w-wide px-4 md:px-8 xl:px-12",
          )}
        >
          <motion.div
            ref={barRef}
            onMouseMove={reduce ? undefined : onBarMove}
            initial={false}
            className={cn(
              "group/nav relative flex items-center justify-between gap-6 rounded-[1.35rem] transition-[height,padding] duration-500 ease-out",
              isSolid ? "h-16 px-4 md:px-6" : "h-20 px-0",
            )}
          >
            {/* ───── Liquid glass material (fades in once the bar detaches) ─────
                Clean and smooth: edge-light top hairline + a faint backdrop
                saturation (content behind stays vivid through the glass), with a
                single subtle light that follows the cursor. No texture. */}
            <motion.div
              aria-hidden
              initial={false}
              animate={{ opacity: isSolid ? 1 : 0 }}
              transition={{ duration: 0.45, ease: [0.2, 0, 0, 1] }}
              className="glass-pane edge-light pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] backdrop-blur-xl backdrop-saturate-150"
            >
              {/* cursor-tracked specular — a soft pool of light follows the
                  pointer across the glass (desktop only) */}
              {!reduce && (
                <motion.div
                  className="absolute inset-0 opacity-0 mix-blend-screen transition-opacity duration-500 ease-out group-hover/nav:opacity-100"
                  style={{ background: specular }}
                />
              )}
            </motion.div>

            {/* Logo */}
            <Link
              href="/"
              aria-label="AutoHaus — Начало"
              className="relative z-10 flex items-center transition-opacity hover:opacity-80"
            >
              <Image
                src="/brand/logo.svg"
                alt="AutoHaus"
                width={150}
                height={27}
                priority
                unoptimized
                className="h-6 w-auto md:h-7"
              />
            </Link>

            {/* Desktop nav — centred, with a glass lozenge that glides between items */}
            <nav
              onMouseLeave={() => setHovered(null)}
              className="absolute left-1/2 z-10 hidden -translate-x-1/2 items-center gap-1 lg:flex"
            >
              <NavLink
                href="/avtomobili"
                itemKey="avtomobili"
                active={pathname.startsWith("/avtomobili")}
                hovered={hovered}
                onHover={setHovered}
              >
                Автомобили
              </NavLink>

              <NavLink
                href="/pod-naem"
                itemKey="pod-naem"
                active={pathname === "/pod-naem"}
                hovered={hovered}
                onHover={setHovered}
              >
                Под наем
              </NavLink>

              <div
                className="relative"
                onMouseEnter={() => {
                  setServicesOpen(true);
                  setHovered("services");
                }}
                onMouseLeave={() => setServicesOpen(false)}
              >
                <button
                  type="button"
                  aria-haspopup="true"
                  aria-expanded={servicesOpen}
                  onClick={() => setServicesOpen((s) => !s)}
                  className="group/link relative flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-fg/80 transition-colors hover:text-fg"
                >
                  {hovered === "services" && (
                    <motion.span
                      layoutId="nav-lozenge"
                      className="edge-light absolute inset-0 rounded-full border border-white/10 bg-white/[0.06]"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    Услуги
                    <ChevronDown
                      className={cn(
                        "size-3.5 transition-transform duration-300",
                        servicesOpen && "rotate-180",
                      )}
                    />
                  </span>
                </button>

                <AnimatePresence>
                  {servicesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                      exit={{ opacity: 0, y: 10, filter: "blur(6px)" }}
                      transition={{ duration: 0.28, ease: [0.2, 0, 0, 1] }}
                      className="glass-pane edge-light absolute left-1/2 top-full mt-4 w-[36rem] -translate-x-1/2 overflow-hidden rounded-2xl p-2.5 backdrop-blur-xl backdrop-saturate-150"
                    >
                      <div className="grid grid-cols-2 gap-1">
                        {services.map((s) => (
                          <Link
                            key={s.href}
                            href={s.href}
                            className="group/item rounded-xl p-4 transition-colors hover:bg-white/[0.06]"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-display text-base font-semibold text-fg">
                                {s.label}
                              </span>
                              <ArrowUpRight className="size-4 -translate-y-0.5 translate-x-0.5 text-fg-muted opacity-0 transition-all duration-300 group-hover/item:translate-x-0 group-hover/item:translate-y-0 group-hover/item:text-accent group-hover/item:opacity-100" />
                            </div>
                            {s.description && (
                              <p className="mt-1 text-xs leading-relaxed text-fg-muted">
                                {s.description}
                              </p>
                            )}
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <NavLink
                href="/kontakti"
                itemKey="kontakti"
                active={pathname === "/kontakti"}
                hovered={hovered}
                onHover={setHovered}
              >
                Контакти
              </NavLink>
            </nav>

            {/* Right cluster */}
            <div className="relative z-10 flex items-center gap-2 md:gap-3">
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                className="hidden items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-fg/80 transition-colors hover:text-fg xl:inline-flex"
              >
                <Phone className="size-3.5" />
                <span className="tabular-nums">{contactInfo.phone}</span>
              </a>
              <span className="hidden h-5 w-px bg-line-strong xl:block" />
              <Link
                href="/kontakti"
                className="group/cta relative hidden items-center gap-2 overflow-hidden rounded-full border border-line-strong px-5 py-2.5 text-sm font-medium text-fg lg:inline-flex"
              >
                <span
                  aria-hidden
                  className="absolute inset-0 z-0 translate-y-[102%] bg-fg transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover/cta:translate-y-0"
                />
                <span className="relative z-10 inline-flex items-center gap-2 transition-colors duration-300 group-hover/cta:text-ink">
                  Запазете оглед
                  <ArrowUpRight className="size-3.5" />
                </span>
              </Link>
              {/* One-tap call — phones surface the number where it converts */}
              <a
                href={`tel:${contactInfo.phone.replace(/\s/g, "")}`}
                aria-label={`Обадете се: ${contactInfo.phone}`}
                className="flex size-10 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-accent hover:text-accent lg:hidden"
              >
                <Phone className="size-[1.05rem]" />
              </a>
              <button
                type="button"
                aria-label="Отвори меню"
                onClick={() => setMobileOpen(true)}
                className="flex size-10 items-center justify-center rounded-full border border-line text-fg transition-colors hover:border-accent lg:hidden"
              >
                <Menu className="size-5" />
              </button>
            </div>
          </motion.div>
        </div>
      </header>

      <MobileMenu open={mobileOpen} onClose={() => setMobileOpen(false)} />
    </>
  );
}

function NavLink({
  href,
  children,
  active,
  itemKey,
  hovered,
  onHover,
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
  itemKey: string;
  hovered: string | null;
  onHover: (key: string) => void;
}) {
  const isHovered = hovered === itemKey;
  return (
    <Link
      href={href}
      onMouseEnter={() => onHover(itemKey)}
      className={cn(
        "relative rounded-full px-4 py-2 text-sm transition-colors",
        active ? "text-fg" : "text-fg/80 hover:text-fg",
      )}
    >
      {/* Glass lozenge — the shared layoutId makes it glide between links */}
      {isHovered && (
        <motion.span
          layoutId="nav-lozenge"
          className="edge-light absolute inset-0 rounded-full border border-white/10 bg-white/[0.06]"
          transition={{ type: "spring", stiffness: 420, damping: 34 }}
        />
      )}
      <span className="relative z-10">
        {children}
        <span
          className={cn(
            "absolute -bottom-1 left-0 h-px w-full origin-left bg-accent transition-transform duration-300 ease-out",
            active ? "scale-x-100" : "scale-x-0",
          )}
        />
      </span>
    </Link>
  );
}
