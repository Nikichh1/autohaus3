"use client";

import { useEffect, useState } from "react";
import { Phone, CalendarCheck } from "lucide-react";
import { motion, AnimatePresence, useMotionValueEvent, useScroll } from "framer-motion";
import type { Vehicle } from "@/types";
import { displayPrice } from "@/lib/utils";
import { contactInfo } from "@/lib/nav";

export function VehicleStickyBar({
  vehicle,
  phone = contactInfo.phone,
}: {
  vehicle: Vehicle;
  /** Admin-managed phone (Настройки → Контакти); falls back to the static default. */
  phone?: string;
}) {
  const [show, setShow] = useState(false);
  // Phones retire the bar while the inquiry section is on screen — it points
  // at the same form it would otherwise cover. Desktop keeps it throughout.
  const [overForm, setOverForm] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    const threshold =
      typeof window !== "undefined" ? window.innerHeight * 0.9 : 800;
    setShow(y > threshold);
  });

  useEffect(() => {
    if (!window.matchMedia("(max-width: 767px)").matches) return;
    const target = document.getElementById("inquiry");
    if (!target) return;
    const io = new IntersectionObserver(
      ([entry]) => setOverForm(entry.isIntersecting),
      { rootMargin: "0px 0px -20% 0px" },
    );
    io.observe(target);
    return () => io.disconnect();
  }, []);

  const label = `${vehicle.brand} ${vehicle.model}`;
  const telHref = `tel:${phone.replace(/\s/g, "")}`;

  return (
    <AnimatePresence>
      {show && !overForm && (
        <motion.div
          initial={{ y: "130%" }}
          animate={{ y: 0 }}
          exit={{ y: "130%" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 md:px-8"
          style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
        >
          <div className="vd-dark glass-pane pointer-events-auto flex w-full max-w-wide items-center justify-between gap-4 rounded-full py-2.5 pl-5 pr-2.5 backdrop-blur-2xl backdrop-saturate-150 md:pl-7">
            <div className="flex min-w-0 items-center gap-3">
              <span className="truncate font-display text-sm font-bold text-fg">
                {label}
                {vehicle.variant && (
                  <span className="font-medium text-fg-muted"> {vehicle.variant}</span>
                )}
              </span>
              <span className="shrink-0 font-display text-base font-extrabold text-accent">
                {displayPrice(vehicle.price)}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {/* Phones get a one-tap call icon; larger screens the full pill */}
              <a
                href={telHref}
                aria-label={`Обадете се: ${phone}`}
                className="flex size-11 items-center justify-center rounded-full border border-line-strong text-fg transition-transform duration-150 active:scale-90 sm:hidden"
              >
                <Phone className="size-[1.05rem]" />
              </a>
              <a
                href={telHref}
                className="hidden h-11 items-center gap-2 rounded-full border border-line-strong px-4 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent sm:inline-flex"
              >
                <Phone className="size-4" />
                Обади се
              </a>
              <a
                href="#inquiry"
                className="vd-pill inline-flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold"
              >
                <CalendarCheck className="size-4" />
                Запази оглед
              </a>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
