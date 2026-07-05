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
import { ButtonLink } from "@/components/ui/Button";
import { Magnetic } from "@/components/fx/Magnetic";
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
  const ctaOpacity = useTransform(progress, [0.58, 0.68], [0, 1]);
  const ctaY = useTransform(progress, [0.58, 0.68], [26, 0]);
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
    if (!mounted || !near) return;
    const dir = isMobile ? "frames-m" : "frames";
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
    if (!activeRef.current) return;
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

  return (
    <section
      ref={sectionRef}
      data-chapter="03"
      data-chapter-label="Машината"
      data-rumble
      style={{ height: `${isMobile ? 200 : SCRUB_VH}vh` }}
      className="sheet relative -mt-[10vh] bg-base text-fg"
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
            the remaining 60%); the existing gradient melts the seam ── */}
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
              className="mt-5 max-w-[30ch] text-sm leading-relaxed text-fg/70 xl:text-base"
            >
              Силует, мощност и баланс в перфектна хармония — усещате я още преди
              да запалите двигателя.
            </motion.p>
          </div>

          {/* Shift-through-the-gears instrument — scrolling revs the tach;
              hit the redline and the box shifts up. */}
          <motion.div style={{ opacity: hudOpacity }}>
            <MTach progress={progress} />
            <div className="mt-8">
              <Magnetic strength={0.14}>
                <ButtonLink href="/avtomobili" variant="solid" size="md" arrow>
                  Изберете вашата
                </ButtonLink>
              </Magnetic>
            </div>
          </motion.div>
        </div>

        {/* scan line — sweeps the film side only */}
        {!reduce && (
          <motion.div
            aria-hidden
            style={{ top: scanTop, opacity: scanOpacity }}
            className="absolute left-[8%] right-[8%] z-10 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent lg:left-[45%] lg:right-[6%]"
          />
        )}

        {/* ── Mobile composition: the title lands across the frame ── */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center px-5 pb-[13vh] text-center lg:hidden">
          <h2 className="flex flex-wrap justify-center gap-x-[0.26em] font-display text-[clamp(1.9rem,7.5vw,3.4rem)] font-extrabold leading-[1] tracking-[-0.03em] text-fg">
            {TITLE.map(([word, [a, b]]) => (
              <TitleWord key={word} word={word} range={[a, b]} progress={progress} reduce={!!reduce} />
            ))}
          </h2>
          <motion.p
            style={reduce ? undefined : { opacity: subOpacity, y: subY }}
            className="mt-5 max-w-md text-sm text-fg/75 md:text-base"
          >
            Силует, мощност и баланс в перфектна хармония — усещате я още преди
            да запалите двигателя.
          </motion.p>
          <motion.div
            style={reduce ? undefined : { opacity: ctaOpacity, y: ctaY }}
            className="pointer-events-auto mt-8"
          >
            <Magnetic strength={0.14}>
              <ButtonLink href="/avtomobili" variant="solid" size="lg" arrow>
                Изберете вашата
              </ButtonLink>
            </Magnetic>
          </motion.div>
        </div>

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

/* ── The M-Tach — shift through the gears with your scroll ──
   The scroll is divided into six gear windows: within each, the needle sweeps
   toward the redline and the shift LEDs walk titanium → amber → red; crest the
   window and the box snaps up a gear while the revs drop back. Speed numbers
   are for passengers — a rev counter with shift lights is the driver's story.
   The tricolour stripes are the quiet nod enthusiasts will catch. */

const REDLINE = 7200;
const RPM_IDLE = 1400;
const RPM_MAX = 8000;

function gearT(p: number) {
  const g = Math.min(5.999, Math.max(0, p * 6));
  return { gear: Math.floor(g) + 1, t: g % 1 };
}

const rad = (deg: number) => (deg * Math.PI) / 180;
/** Point on the dial: 0° = 12 o'clock, sweep −120°…+120°. */
function dialPoint(r: number, deg: number): [number, number] {
  return [100 + r * Math.sin(rad(deg)), 104 - r * Math.cos(rad(deg))];
}
const rpmDeg = (rpm: number) => -120 + (rpm / RPM_MAX) * 240;

function MTach({ progress }: { progress: MotionValue<number> }) {
  const rpm = useTransform(progress, (p) => RPM_IDLE + gearT(p).t * (REDLINE - RPM_IDLE));
  const needle = useTransform(rpm, (v) => rpmDeg(v));
  const gearNum = useTransform(progress, (p) => String(gearT(p).gear));
  const rpmText = useTransform(rpm, (v) => (v / 1000).toFixed(1));

  const [ax, ay] = dialPoint(80, -120);
  const [bx, by] = dialPoint(80, 120);
  const [rx1, ry1] = dialPoint(80, rpmDeg(7000));
  const [rx2, ry2] = dialPoint(80, rpmDeg(RPM_MAX));

  return (
    <div className="flex items-end gap-7">
      {/* dial */}
      <div className="relative w-[170px] shrink-0 xl:w-[200px]">
        <svg viewBox="0 0 200 118" fill="none" aria-hidden className="w-full text-accent">
          {/* track + redline zone */}
          <path d={`M ${ax} ${ay} A 80 80 0 1 1 ${bx} ${by}`} stroke="rgb(245 247 249 / 0.16)" strokeWidth={3} />
          <path d={`M ${rx1} ${ry1} A 80 80 0 0 1 ${rx2} ${ry2}`} stroke="#e7222e" strokeWidth={4} strokeOpacity={0.85} />
          {/* ticks + numerals, per 1000 rpm */}
          {Array.from({ length: 9 }, (_, k) => {
            const d = rpmDeg(k * 1000);
            const [x1, y1] = dialPoint(80, d);
            const [x2, y2] = dialPoint(70, d);
            const [nx, ny] = dialPoint(58, d);
            return (
              <g key={k}>
                <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={k >= 7 ? "#e7222e" : "currentColor"} strokeOpacity={k >= 7 ? 0.9 : 0.5} strokeWidth={1.5} />
                <text x={nx} y={ny + 3} textAnchor="middle" className="fill-current" style={{ fontSize: 9, opacity: 0.65 }}>
                  {k}
                </text>
              </g>
            );
          })}
          {/* needle */}
          <motion.g style={{ rotate: needle, transformOrigin: "100px 104px", transformBox: "view-box" }}>
            <line x1={100} y1={104} x2={100} y2={30} stroke="#e7222e" strokeWidth={2.5} strokeLinecap="round" />
            <line x1={100} y1={104} x2={100} y2={116} stroke="#e7222e" strokeWidth={2.5} strokeLinecap="round" strokeOpacity={0.5} />
          </motion.g>
          <circle cx={100} cy={104} r={5.5} fill="#14171c" stroke="currentColor" strokeOpacity={0.6} />
        </svg>
        <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
          <motion.span className="font-display text-sm font-bold tabular-nums text-fg">{rpmText}</motion.span>
          <span className="label-fine ml-1.5 text-fg-subtle">×1000 об/мин</span>
        </p>
      </div>

      {/* shift lights + gear box */}
      <div className="min-w-0 pb-1">
        <div className="mb-3.5 flex items-center gap-1.5">
          {Array.from({ length: 8 }, (_, i) => (
            <ShiftLed key={i} index={i} progress={progress} />
          ))}
        </div>
        <div className="flex items-baseline gap-3">
          <motion.span className="font-display text-6xl font-extrabold leading-none tabular-nums text-fg xl:text-7xl">
            {gearNum}
          </motion.span>
          <span className="label-fine text-fg-muted">предавка</span>
        </div>
        {/* the tricolour — the enthusiast's handshake */}
        <div aria-hidden className="mt-4 flex gap-1">
          <span className="h-1 w-7 -skew-x-[24deg] rounded-[1px] bg-[#81c4ff]" />
          <span className="h-1 w-7 -skew-x-[24deg] rounded-[1px] bg-[#16588e]" />
          <span className="h-1 w-7 -skew-x-[24deg] rounded-[1px] bg-[#e7222e]" />
        </div>
      </div>
    </div>
  );
}

/** One shift light — walks on as the window's revs climb; the last two warn. */
function ShiftLed({ index, progress }: { index: number; progress: MotionValue<number> }) {
  const color = index >= 6 ? "#e7222e" : index >= 4 ? "#f0b429" : "#c9cfd6";
  const on = useTransform(progress, (p) => (gearT(p).t * 8 >= index + 0.5 ? 1 : 0.16));
  return (
    <motion.span
      style={{ opacity: on, background: color, boxShadow: `0 0 8px ${color}66` }}
      className="h-1.5 w-4 rounded-[2px]"
    />
  );
}
