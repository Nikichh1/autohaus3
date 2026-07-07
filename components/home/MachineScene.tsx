"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  type MotionValue,
} from "framer-motion";
import { CinematicGrade } from "@/components/fx/CinematicGrade";

/**
 * Chapter 04 — The Machine. Full-screen scroll-scrubbed film (pre-decoded
 * frame sequence, canvas-painted — no <video>, no stalls). The composition is
 * now pure cinema: the title lands word by word across the centre of the frame
 * as the car pulls out of the dark, an RPM rail climbs the left edge with your
 * scroll, and a single CTA surfaces at the reveal. No side columns, no cards —
 * the footage is the section.
 */

const FRAME_COUNT = 120;
const SCRUB_VH = 280;
const pad = (n: number) => String(n).padStart(3, "0");

const TITLE: [string, [number, number]][] = [
  ["Създадени", [0.1, 0.2]],
  ["за", [0.22, 0.3]],
  ["движение.", [0.32, 0.42]],
];

export function MachineScene() {
  const reduce = useReducedMotion();
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const drawnP = useRef(0);
  const lastIdx = useRef(-1);
  const activeRef = useRef(false);

  const [mounted, setMounted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [near, setNear] = useState(false);

  const progress = useMotionValue(0);

  // HUD choreography
  const scanTop = useTransform(progress, [0.08, 0.96], ["18%", "82%"]);
  const scanOpacity = useTransform(progress, [0.06, 0.16, 0.88, 1], [0, 0.7, 0.7, 0]);
  const subOpacity = useTransform(progress, [0.46, 0.56], [0, 1]);
  const subY = useTransform(progress, [0.46, 0.56], [26, 0]);
  const hudOpacity = useTransform(progress, [0.05, 0.15], [0, 1]);
  // The film itself breathes with the scroll — a slow push-in.
  const filmScale = useTransform(progress, [0, 1], [1.09, 1]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobile(!window.matchMedia("(min-width: 1024px)").matches);
    setMounted(true);
  }, []);

  // Preload starts ~1.5 screens out; never competes with the hero.
  useEffect(() => {
    if (!mounted) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "150% 0px 150% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  useEffect(() => {
    if (!mounted) return;
    const el = sectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        activeRef.current = entry.isIntersecting;
      },
      { rootMargin: "0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [mounted]);

  useEffect(() => {
    // Phones never download the frame sequence — they get the static
    // idling composition below instead.
    if (!mounted || !near || isMobile) return;
    const dir = "frames";
    const imgs: HTMLImageElement[] = [];
    let count = 0;
    let cancelled = false;
    for (let i = 1; i <= FRAME_COUNT; i++) {
      const img = new Image();
      img.decoding = "async";
      img.src = `/feature/${dir}/f${pad(i)}.webp`;
      const done = () => {
        if (cancelled) return;
        count += 1;
        setLoaded(count);
      };
      img.decode().then(done).catch(done);
      imgs[i - 1] = img;
    }
    framesRef.current = imgs;
    return () => {
      cancelled = true;
    };
  }, [mounted, isMobile, near]);

  const draw = (index: number) => {
    const canvas = canvasRef.current;
    const img = framesRef.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cw = canvas.clientWidth;
    const ch = canvas.clientHeight;
    if (!cw || !ch) return;
    const tw = Math.round(cw * dpr);
    const th = Math.round(ch * dpr);
    if (canvas.width !== tw || canvas.height !== th) {
      canvas.width = tw;
      canvas.height = th;
    }
    const scale = Math.max(tw / img.naturalWidth, th / img.naturalHeight);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    ctx.filter = "brightness(1.22) contrast(1.03) saturate(1.06)";
    ctx.drawImage(img, (tw - dw) / 2, (th - dh) / 2, dw, dh);
    ctx.filter = "none";
  };

  useAnimationFrame(() => {
    if (isMobile || !activeRef.current) return;
    const el = sectionRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const dist = rect.height - window.innerHeight;
    const p = dist > 0 ? Math.min(Math.max(-rect.top / dist, 0), 1) : 0;
    progress.set(p);

    if (reduce) {
      if (lastIdx.current !== 0) {
        draw(0);
        lastIdx.current = 0;
      }
      return;
    }
    drawnP.current += (p - drawnP.current) * 0.2;
    if (Math.abs(p - drawnP.current) < 0.0005) drawnP.current = p;
    let idx = Math.round(drawnP.current * (FRAME_COUNT - 1));
    if (loaded < FRAME_COUNT) idx = Math.min(idx, Math.max(loaded - 1, 0));
    if (idx !== lastIdx.current) {
      draw(idx);
      lastIdx.current = idx;
    }
  });

  useEffect(() => {
    const onResize = () => {
      lastIdx.current = -1;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  useEffect(() => {
    if (loaded > 0) lastIdx.current = -1;
  }, [loaded]);

  const ready = loaded >= FRAME_COUNT;

  // ── Mobile: one cinematic still, the engine idling in the cluster — no pin,
  // no canvas, no frame downloads. Pre-hydration BOTH variants ship in the
  // server HTML, CSS-gated (`.machine-mobile` / `.machine-desktop` in
  // globals.css mirror the JS width test) — phones never lay out the 280vh
  // scrub placeholder. The wrapper div keeps its identity across hydration so
  // the phone scene never remounts (and never re-plays its entrance). The SSR
  // copy carries no chapter attributes: the desktop section owns `03` until
  // the swap, so the chapter rail never sees duplicates.
  const showMobile = !mounted || isMobile;
  const showDesktop = !mounted || !isMobile;
  return (
    <>
    {showMobile ? (
      <div className="machine-mobile">
        <MobileMachine chapter={mounted} />
      </div>
    ) : null}
    {showDesktop ? (
    <section
      ref={sectionRef}
      data-chapter="03"
      data-chapter-label="Машината"
      data-rumble
      style={{ height: `${isMobile ? 200 : SCRUB_VH}vh` }}
      className={`sheet relative -mt-[10vh] bg-base text-fg ${mounted ? "" : "machine-desktop"}`}
    >
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden rounded-[inherit]">
        <motion.div style={reduce ? undefined : { scale: filmScale }} className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/feature/poster.jpg"
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <canvas ref={canvasRef} aria-hidden className="absolute inset-0 h-full w-full" />
          <CinematicGrade />
        </motion.div>

        {/* seams into the neighbouring sheets */}
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-base/70 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-base via-base/35 to-transparent" />

        {/* ── Left content rail — 40% of the frame held dark (the film runs in
            the remaining 60%). Structured top → middle → bottom: chapter mark,
            the statement, and the three qualities that define the machine. ── */}
        <div className="absolute inset-y-0 left-0 z-10 hidden w-[40%] flex-col justify-between border-r border-line bg-gradient-to-r from-base via-base/90 to-transparent px-10 py-24 lg:flex xl:px-14">
          <motion.p style={{ opacity: hudOpacity }} className="label-fine flex items-center gap-3 text-fg/80">
            <span aria-hidden className="text-accent">[</span>
            03 · Машината
            <span aria-hidden className="text-accent">]</span>
          </motion.p>

          <div>
            <h2 className="font-display text-[clamp(2.2rem,3.2vw,3.8rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-fg">
              {TITLE.map(([word, [a, b]]) => (
                <span key={word} className="block">
                  <TitleWord word={word} range={[a, b]} progress={progress} reduce={!!reduce} />
                </span>
              ))}
            </h2>
            <motion.p
              style={reduce ? undefined : { opacity: subOpacity, y: subY }}
              className="mt-5 max-w-[32ch] text-sm leading-relaxed text-fg/70 xl:text-[16px]"
            >
              Силует, мощност и баланс в перфектна хармония — усещате я още преди
              да запалите двигателя.
            </motion.p>
          </div>

          <Pillars progress={progress} reduce={!!reduce} />
        </div>

        {/* scan line — sweeps the film side only */}
        {!reduce && (
          <motion.div
            aria-hidden
            style={{ top: scanTop, opacity: scanOpacity }}
            className="absolute left-[8%] right-[8%] z-10 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent lg:left-[45%] lg:right-[6%]"
          />
        )}

        {/* loading shimmer */}
        {!ready && near && (
          <div className="pointer-events-none absolute inset-x-0 bottom-8 flex justify-center">
            <div className="h-px w-40 overflow-hidden bg-white/15">
              <div
                className="h-full bg-accent transition-[width] duration-200"
                style={{ width: `${Math.round((loaded / FRAME_COUNT) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </section>
    ) : null}
    </>
  );
}

function TitleWord({
  word,
  range,
  progress,
  reduce,
}: {
  word: string;
  range: [number, number];
  progress: ReturnType<typeof useMotionValue<number>>;
  reduce: boolean;
}) {
  const opacity = useTransform(progress, range, [0, 1]);
  const y = useTransform(progress, range, [46, 0]);
  if (reduce) return <span>{word}</span>;
  return (
    <span className="inline-block overflow-hidden pb-[0.08em]">
      <motion.span style={{ opacity, y }} className="inline-block">
        {word}
      </motion.span>
    </span>
  );
}

/* ── The three qualities — silhouette, power, balance. The scene's emotional
   signature, drawn as a calm engineered triad instead of an instrument
   cluster: an index, a word, a line. Each resolves in turn as the car is
   revealed by the scroll. */

const PILLARS: [string, string][] = [
  ["Силует", "Форма, родена от вятъра."],
  ["Мощност", "Характер, който усещате."],
  ["Баланс", "Контрол във всеки завой."],
];

/** Desktop: the triad reveals with the scroll (progress-driven stagger). */
function Pillars({ progress, reduce }: { progress: MotionValue<number>; reduce: boolean }) {
  return (
    <div className="grid grid-cols-3 gap-x-4 border-t border-line pt-6">
      {PILLARS.map(([title, sub], i) => (
        <Pillar key={title} index={i} title={title} sub={sub} progress={progress} reduce={reduce} />
      ))}
    </div>
  );
}

function Pillar({
  index,
  title,
  sub,
  progress,
  reduce,
}: {
  index: number;
  title: string;
  sub: string;
  progress: MotionValue<number>;
  reduce: boolean;
}) {
  const a = 0.5 + index * 0.05;
  const opacity = useTransform(progress, [a, a + 0.12], [0, 1]);
  const y = useTransform(progress, [a, a + 0.12], [18, 0]);
  return (
    <motion.div style={reduce ? undefined : { opacity, y }}>
      <span className="label-fine text-accent">0{index + 1}</span>
      <p className="mt-2 font-display text-lg font-bold tracking-tight text-fg xl:text-xl">{title}</p>
      <p className="mt-1.5 text-xs leading-relaxed text-fg/55">{sub}</p>
    </motion.div>
  );
}

/** Mobile / static: the same triad, revealed once as the section enters. */
function PillarsStatic() {
  return (
    <div className="mt-9 grid w-full max-w-md grid-cols-3 gap-x-3 border-t border-line pt-6 text-left">
      {PILLARS.map(([title, sub], i) => (
        <motion.div
          key={title}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.6 }}
          transition={{ duration: 0.6, delay: 0.1 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <span className="label-fine text-accent">0{i + 1}</span>
          <p className="mt-1.5 font-display text-base font-bold tracking-tight text-fg">{title}</p>
          <p className="mt-1 text-[11px] leading-relaxed text-fg/55">{sub}</p>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * The mobile Machine — purpose-built: one cinematic still of the car settling
 * out of the dark, the statement, and the three qualities that define it. No
 * pin, no canvas, no frame downloads — instant and fluid on any phone.
 */
function MobileMachine({ chapter = true }: { chapter?: boolean }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);

  return (
    <section
      ref={ref}
      data-chapter={chapter ? "03" : undefined}
      data-chapter-label={chapter ? "Машината" : undefined}
      className="sheet relative -mt-[10vh] bg-base text-fg"
    >
      <div className="relative flex min-h-[94svh] flex-col justify-end overflow-hidden rounded-[inherit] pb-16">
        {/* one slow cinematic settle as the scene enters — a filmed shot */}
        <motion.img
          src="/feature/poster.jpg"
          alt=""
          aria-hidden
          loading="lazy"
          decoding="async"
          initial={reduce ? false : { scale: 1.12 }}
          whileInView={{ scale: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 h-full w-full object-cover"
        />
        <CinematicGrade />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-base via-base/25 to-base/55" />

        <div className="relative z-10 flex flex-col items-center px-5 text-center">
          <p className="label-fine mb-5 text-fg/80">
            <span aria-hidden className="mr-2 text-accent">[</span>
            03 · Машината
            <span aria-hidden className="ml-2 text-accent">]</span>
          </p>
          <h2 className="font-display text-[clamp(1.9rem,7.5vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-fg">
            Създадени за движение.
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-fg/75">
            Силует, мощност и баланс в перфектна хармония — усещате я още преди
            да запалите двигателя.
          </p>
          <PillarsStatic />
        </div>
      </div>
    </section>
  );
}
