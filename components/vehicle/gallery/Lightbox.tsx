"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ChevronLeft, ChevronRight, ZoomIn, Minus, Plus, CalendarCheck, MoveHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

const EVENT = "ah:gallery";
const EASE = [0.16, 1, 0.3, 1] as const;
const MAX_SCALE = 4;
const ZOOM_STEP = 2.4;

export type GallerySpec = { label: string; value: string };

/** Open the shared vehicle lightbox at `index`. Triggers dispatch this so the
 *  hero gallery and the editorial collage share one immersive viewer. */
export function openGallery(index: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: { index } }));
}

/**
 * The immersive viewer — one instance per product page, opened by any image on
 * the page. Beyond a standard gallery it is an INSPECTION tool: deep zoom + pan
 * to examine paint, wheels and interior condition (the decisive question on a
 * used luxury car), with the vehicle's key specs and a book-a-viewing CTA held
 * in view the whole time — so looking turns into deciding without leaving the
 * image. Keyboard, swipe, pinch/double-tap/wheel zoom, adjacent-image preload.
 */
export function Lightbox({
  images,
  alt,
  specs = [],
  title,
  bookHref = "#inquiry",
}: {
  images: string[];
  alt: string;
  specs?: GallerySpec[];
  title?: string;
  bookHref?: string;
}) {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [interacting, setInteracting] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const panRef = useRef({ x: 0, y: 0 });
  const scaleRef = useRef(1);
  const viewportRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const count = images.length;

  const setScaleBoth = useCallback((s: number) => {
    scaleRef.current = s;
    setScale(s);
  }, []);
  const setPanBoth = useCallback((p: { x: number; y: number }) => {
    panRef.current = p;
    setPan(p);
  }, []);

  const resetZoom = useCallback(() => {
    setPanBoth({ x: 0, y: 0 });
    setScaleBoth(1);
  }, [setPanBoth, setScaleBoth]);

  const clampPan = useCallback((x: number, y: number, s: number) => {
    const el = viewportRef.current;
    if (!el) return { x, y };
    const maxX = ((s - 1) * el.clientWidth) / 2;
    const maxY = ((s - 1) * el.clientHeight) / 2;
    return { x: Math.max(-maxX, Math.min(maxX, x)), y: Math.max(-maxY, Math.min(maxY, y)) };
  }, []);

  const applyScale = useCallback(
    (next: number, originX = 0, originY = 0) => {
      const s = Math.max(1, Math.min(MAX_SCALE, next));
      if (s === 1) {
        resetZoom();
        return;
      }
      const cur = scaleRef.current;
      const ratio = s / cur;
      const nx = originX - (originX - panRef.current.x) * ratio;
      const ny = originY - (originY - panRef.current.y) * ratio;
      setPanBoth(clampPan(nx, ny, s));
      setScaleBoth(s);
    },
    [clampPan, resetZoom, setPanBoth, setScaleBoth],
  );

  const zoomBy = useCallback((delta: number) => applyScale(scaleRef.current + delta), [applyScale]);

  const go = useCallback(
    (d: number) => {
      resetZoom();
      setDir(d);
      setIndex((i) => (i + d + count) % count);
    },
    [count, resetZoom],
  );

  const jump = useCallback(
    (i: number) => {
      resetZoom();
      setIndex((cur) => {
        setDir(i > cur ? 1 : -1);
        return ((i % count) + count) % count;
      });
    },
    [count, resetZoom],
  );

  // Open via the shared event.
  useEffect(() => {
    const onOpen = (e: Event) => {
      const detail = (e as CustomEvent<{ index?: number }>).detail;
      resetZoom();
      setIndex(detail?.index ?? 0);
      setOpen(true);
    };
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, [resetZoom]);

  // Scroll lock + keyboard while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") zoomBy(ZOOM_STEP - 1);
      else if (e.key === "-" || e.key === "_") zoomBy(-(ZOOM_STEP - 1));
      else if (e.key === "0") resetZoom();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, go, resetZoom, zoomBy]);

  // A one-time gesture hint on phones — shown on open, retires after a moment
  // so first-time visitors immediately know they can swipe and zoom.
  useEffect(() => {
    if (!open) {
      setShowHint(false);
      return;
    }
    setShowHint(true);
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, [open]);

  // Preload the neighbours so navigation and zoom are instant.
  useEffect(() => {
    if (!open || count < 2) return;
    [1, -1].forEach((d) => {
      const img = new Image();
      img.src = images[(index + d + count) % count];
    });
  }, [open, index, count, images]);

  // ── Pointer handling: pan, pinch, swipe, double-tap ──
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ startX: number; startY: number; panX: number; panY: number; pinchDist: number; pinchScale: number; moved: boolean } | null>(null);
  const lastTap = useRef(0);
  const downTarget = useRef<HTMLElement | null>(null);

  const onPointerDown = (e: React.PointerEvent) => {
    try {
      (e.target as Element).setPointerCapture?.(e.pointerId);
    } catch {
      /* pointer already released / not capturable — safe to ignore */
    }
    downTarget.current = e.target as HTMLElement;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setInteracting(true);
    if (pointers.current.size === 1) {
      gesture.current = {
        startX: e.clientX,
        startY: e.clientY,
        panX: panRef.current.x,
        panY: panRef.current.y,
        pinchDist: 0,
        pinchScale: scaleRef.current,
        moved: false,
      };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        ...(gesture.current ?? { startX: 0, startY: 0, panX: 0, panY: 0, moved: true }),
        pinchDist: Math.hypot(a.x - b.x, a.y - b.y),
        pinchScale: scaleRef.current,
        panX: panRef.current.x,
        panY: panRef.current.y,
        moved: true,
      };
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (!g) return;

    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (g.pinchDist > 0) {
        const el = viewportRef.current;
        const r = el?.getBoundingClientRect();
        const cx = r ? (a.x + b.x) / 2 - (r.left + el!.clientWidth / 2) : 0;
        const cy = r ? (a.y + b.y) / 2 - (r.top + el!.clientHeight / 2) : 0;
        applyScale((dist / g.pinchDist) * g.pinchScale, cx, cy);
      }
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.moved = true;
    if (scaleRef.current > 1) {
      setPanBoth(clampPan(g.panX + dx, g.panY + dy, scaleRef.current));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    const startX = g?.startX ?? 0;
    const startY = g?.startY ?? 0;
    const moved = g?.moved ?? false;
    const target = downTarget.current;
    pointers.current.delete(e.pointerId);
    if (pointers.current.size !== 0) return; // still mid pinch

    setInteracting(false);
    const s = scaleRef.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    // Swipe to navigate — only when not zoomed.
    if (s === 1 && Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
      gesture.current = null;
      return;
    }

    if (!moved) {
      const isImage = target?.tagName === "IMG";
      const isControl = !!target?.closest?.("button, a");
      const now = Date.now();
      const isDouble = now - lastTap.current < 300;

      if (isDouble && (isImage || s > 1)) {
        // Double-tap / double-click the image: toggle zoom. Zoomed → back to
        // the original preview; not zoomed → zoom into the tapped point.
        lastTap.current = 0;
        if (s > 1) {
          resetZoom();
        } else {
          const el = viewportRef.current;
          const r = el?.getBoundingClientRect();
          const ox = r ? e.clientX - (r.left + el!.clientWidth / 2) : 0;
          const oy = r ? e.clientY - (r.top + el!.clientHeight / 2) : 0;
          applyScale(ZOOM_STEP, ox, oy);
        }
      } else {
        lastTap.current = now;
        // A single tap on the empty backdrop (not the photo, not a control),
        // while not zoomed, exits the viewer.
        if (s === 1 && !isImage && !isControl) setOpen(false);
      }
    }
    gesture.current = null;
  };

  const onWheel = (e: React.WheelEvent) => {
    const el = viewportRef.current;
    const r = el?.getBoundingClientRect();
    const ox = r ? e.clientX - (r.left + el!.clientWidth / 2) : 0;
    const oy = r ? e.clientY - (r.top + el!.clientHeight / 2) : 0;
    applyScale(scaleRef.current - e.deltaY * 0.0016 * scaleRef.current, ox, oy);
  };

  // Fast, directional crossfade — a hair of travel reads as motion without
  // making the viewer wait. Preloaded neighbours mean the frame is ready.
  const slide = {
    enter: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * 34 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: reduce ? 0 : d * -34 }),
  };

  const zoomed = scale > 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label={title ? `Галерия — ${title}` : "Галерия"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.32, ease: EASE }}
          data-lenis-prevent
          data-lb-root
          className="fixed inset-0 z-[110] flex flex-col bg-[#06070a]/98 backdrop-blur-md"
        >
          {/* top bar — on phones it floats over the image with a scrim */}
          <div
            className="relative z-30 flex items-center justify-between gap-4 px-4 py-4 md:px-6 max-md:absolute max-md:inset-x-0 max-md:top-0 max-md:bg-gradient-to-b max-md:from-black/75 max-md:via-black/35 max-md:to-transparent max-md:pb-12"
            style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}
          >
            <div className="flex items-center gap-3 text-white/70">
              <span className="font-mega text-sm tabular-nums text-white">{String(index + 1).padStart(2, "0")}</span>
              <span className="h-px w-6 bg-white/25" />
              <span className="text-xs tabular-nums text-white/45">{String(count).padStart(2, "0")}</span>
              {title && <span className="ml-2 hidden truncate text-xs font-medium text-white/55 sm:block">{title}</span>}
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-1 rounded-full border border-white/12 bg-white/[0.04] p-1 sm:flex">
                <IconBtn label="Намали" onClick={() => zoomBy(-(ZOOM_STEP - 1))} disabled={!zoomed}>
                  <Minus className="size-4" />
                </IconBtn>
                <span className="min-w-[3ch] text-center text-[11px] font-semibold tabular-nums text-white/70">{Math.round(scale * 100)}%</span>
                <IconBtn label="Приближи" onClick={() => zoomBy(ZOOM_STEP - 1)} disabled={scale >= MAX_SCALE}>
                  <Plus className="size-4" />
                </IconBtn>
              </div>
              <button
                ref={closeRef}
                type="button"
                aria-label="Затвори"
                onClick={() => setOpen(false)}
                className="flex size-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.05] text-white transition-colors hover:border-white/50"
              >
                <X className="size-5" />
              </button>
            </div>
          </div>

          {/* Phone gesture hint — a friendly, self-dismissing cue so anyone
              instantly knows how to browse and zoom the photos. */}
          <AnimatePresence>
            {showHint && !zoomed && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="pointer-events-none absolute inset-x-0 z-30 flex justify-center px-4 md:hidden"
                style={{ top: "calc(env(safe-area-inset-top) + 4.75rem)" }}
              >
                <div className="flex items-center gap-2.5 whitespace-nowrap rounded-full border border-white/12 bg-black/65 px-4 py-2 text-[11px] font-medium text-white/90 backdrop-blur-md">
                  <span className="flex items-center gap-1.5">
                    <MoveHorizontal className="size-3.5 text-accent" strokeWidth={1.8} />
                    Плъзнете
                  </span>
                  <span className="h-3 w-px bg-white/20" />
                  <span className="flex items-center gap-1.5">
                    <ZoomIn className="size-3.5 text-accent" strokeWidth={1.8} />
                    Двоен допир за близък план
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* stage — desktop: a flex row between the bars; phone: full-bleed so
              the photo is as large as possible and the chrome floats over it */}
          <div
            ref={viewportRef}
            data-lb-stage
            data-zoomed={zoomed ? "true" : "false"}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            className={cn("relative flex-1 touch-none select-none overflow-hidden max-md:absolute max-md:inset-0 max-md:z-0", zoomed && "cursor-grab active:cursor-grabbing")}
          >
            <AnimatePresence custom={dir} initial={false}>
              <motion.div
                key={index}
                custom={dir}
                variants={slide}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.26, ease: EASE }}
                className="absolute inset-0 flex items-center justify-center p-3 md:p-8"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={images[index]}
                  alt={`${alt} — ${index + 1}`}
                  draggable={false}
                  className="max-h-full max-w-full object-contain will-change-transform"
                  style={{
                    transform: `translate3d(${pan.x}px, ${pan.y}px, 0) scale(${scale})`,
                    transition: interacting ? "none" : "transform 0.28s cubic-bezier(0.16,1,0.3,1)",
                  }}
                />
              </motion.div>
            </AnimatePresence>

            {count > 1 && !zoomed && (
              <>
                <NavArrow side="left" onClick={() => go(-1)} />
                <NavArrow side="right" onClick={() => go(1)} />
              </>
            )}

            {!zoomed && (
              <div className="pointer-events-none absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/12 bg-black/40 px-3.5 py-1.5 text-[11px] font-medium text-white/70 backdrop-blur-md sm:flex">
                <ZoomIn className="size-3.5 text-accent" />
                Огледайте в детайл — двоен допир или колело
              </div>
            )}
          </div>

          {/* Bottom controls — a solid rail on desktop; on phones they float over
              the lower letterbox with a scrim, so the photo fills the frame. */}
          <div className="max-md:pointer-events-none max-md:absolute max-md:inset-x-0 max-md:bottom-0 max-md:z-20 max-md:bg-gradient-to-t max-md:from-black/90 max-md:via-black/55 max-md:to-transparent max-md:pt-14 md:contents">
          {/* decision rail — specs + book a viewing, held in view while inspecting */}
          {(specs.length > 0 || bookHref) && (
            <div className="pointer-events-auto relative z-20 md:border-t md:border-white/10 md:bg-black/40 md:backdrop-blur-md">
              <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-6">
                {specs.length > 0 && (
                  <dl className="no-scrollbar flex items-center gap-5 overflow-x-auto md:gap-8">
                    {specs.map((s) => (
                      <div key={s.label} className="shrink-0">
                        <dt className="text-[9.5px] font-semibold uppercase tracking-[0.16em] text-white/40">{s.label}</dt>
                        <dd className="mt-0.5 font-mega text-sm text-white">{s.value}</dd>
                      </div>
                    ))}
                  </dl>
                )}
                <a
                  href={bookHref}
                  onClick={() => setOpen(false)}
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-[#e7eaed] px-5 text-sm font-bold text-[#0a0c10] transition-transform hover:-translate-y-0.5"
                >
                  <CalendarCheck className="size-4" />
                  Запази оглед
                </a>
              </div>
            </div>
          )}

          {/* filmstrip */}
          {count > 1 && (
            <div
              className="no-scrollbar pointer-events-auto relative z-20 flex gap-2 overflow-x-auto px-4 py-3 md:border-t md:border-white/10 md:bg-black/30 md:px-6"
              style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
            >
              {images.map((src, i) => (
                <button
                  key={i}
                  type="button"
                  aria-label={`Снимка ${i + 1}`}
                  onClick={() => jump(i)}
                  className={cn(
                    "relative h-12 w-16 shrink-0 overflow-hidden rounded-[3px] transition-all duration-300 md:h-14 md:w-20",
                    i === index ? "opacity-100 ring-2 ring-accent" : "opacity-40 hover:opacity-80",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function IconBtn({
  children,
  label,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className="flex size-8 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function NavArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label={side === "left" ? "Предишна" : "Следваща"}
      onClick={onClick}
      className={cn(
        "absolute top-1/2 z-10 flex size-12 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-black/40 text-white backdrop-blur-md transition-colors hover:border-white/60",
        side === "left" ? "left-3 md:left-6" : "right-3 md:right-6",
      )}
    >
      {side === "left" ? <ChevronLeft className="size-5" /> : <ChevronRight className="size-5" />}
    </button>
  );
}
