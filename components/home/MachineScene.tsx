"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { CinematicGrade } from "@/components/fx/CinematicGrade";
import { Magnetic } from "@/components/fx/Magnetic";
import { ButtonLink } from "@/components/ui/Button";

/**
 * Chapter 04 — The Machine. Full-screen scroll-scrubbed film (pre-decoded
 * frame sequence, canvas-painted — no <video>, no stalls). The title lands
 * word by word as the car pulls out of the dark, and the R-Telemetry cluster
 * lives in the left rail: a real rev counter with needle physics, shift
 * lights, gear windows, a live speed / voltage / oil readout strip — the
 * driver's story, told by instruments. A single CTA surfaces at the reveal.
 */

const FRAME_COUNT = 120;
const SCRUB_VH = 280;
const pad = (n: number) => String(n).padStart(3, "0");

type MachineCopy = { title: string; subcopy: string };

const DEFAULT_COPY: MachineCopy = {
  title: "Създадени за движение.",
  subcopy:
    "Силует, мощност и баланс в перфектна хармония — усещате я още преди да запалите двигателя.",
};

/** Split the (CMS-editable) title into words, each with its own scroll window
 *  so the reveal cascades word by word regardless of how many words there are.
 *  Matches the original hand-tuned windows for the 3-word default. */
function titleWords(title: string): [string, [number, number]][] {
  const words = title.split(/\s+/).filter(Boolean);
  const start = 0.1;
  const lastStart = 0.32;
  const dur = 0.1;
  const step = words.length > 1 ? (lastStart - start) / (words.length - 1) : 0;
  return words.map((w, i) => [w, [start + i * step, start + i * step + dur]]);
}

export function MachineScene({ copy = DEFAULT_COPY }: { copy?: MachineCopy }) {
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
  // The CTA surfaces once the machine is fully revealed.
  const ctaOpacity = useTransform(progress, [0.52, 0.64], [0, 1]);
  const ctaY = useTransform(progress, [0.52, 0.64], [18, 0]);
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
        <MobileMachine chapter={mounted} copy={copy} />
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
            the statement, and the living R-Telemetry cluster. ── */}
        <div className="absolute inset-y-0 left-0 z-10 hidden w-[40%] flex-col justify-between border-r border-line bg-gradient-to-r from-base via-base/90 to-transparent px-10 py-20 lg:flex xl:px-14">
          <motion.p style={{ opacity: hudOpacity }} className="label-fine flex items-center gap-3 text-fg/80">
            <span aria-hidden className="text-racing">[</span>
            03 · Машината
            <span aria-hidden className="text-racing">]</span>
          </motion.p>

          <div>
            <h2 className="font-display text-[clamp(2.2rem,3.2vw,3.8rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-fg">
              {titleWords(copy.title).map(([word, [a, b]], i) => (
                <span key={`${word}-${i}`} className="block">
                  <TitleWord word={word} range={[a, b]} progress={progress} reduce={!!reduce} />
                </span>
              ))}
            </h2>
            <motion.p
              style={reduce ? undefined : { opacity: subOpacity, y: subY }}
              className="mt-5 max-w-[32ch] text-sm leading-relaxed text-fg/70 xl:text-[16px]"
            >
              {copy.subcopy}
            </motion.p>
          </div>

          <div>
            {/* Shift-through-the-gears telemetry — scrolling revs the tach;
                crest the window and the box snaps up a gear. */}
            <motion.div style={{ opacity: hudOpacity }}>
              <TachCluster progress={progress} reduce={!!reduce} />
            </motion.div>
            <motion.div
              style={reduce ? undefined : { opacity: ctaOpacity, y: ctaY }}
              className="mt-6"
            >
              <Magnetic strength={0.14}>
                <ButtonLink href="/avtomobili" variant="solid" size="md" arrow>
                  Изберете вашата
                </ButtonLink>
              </Magnetic>
            </motion.div>
          </div>
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

/* ── R-Telemetry — shift through the gears with your scroll ──
   The scroll divides into six gear windows: within each, the needle sweeps
   toward the redline and the shift LEDs walk titanium → amber → red; crest the
   window and the box snaps up a gear while the revs fall back. A live strip
   reads speed, charge voltage and oil temperature — the readouts fans check.
   Housed in the Autohaus R cockpit pod: chamfered carbon glass whose edge
   filament literally heats up with the revs. The tricolour is the quiet nod
   enthusiasts will catch. */

const REDLINE = 7200;
const RPM_IDLE = 1400;
const RPM_MAX = 8000;
/** Cumulative speed bands per gear — speed never falls at a shift. */
const SPEED_BANDS: [number, number][] = [
  [0, 55], [55, 92], [92, 132], [132, 171], [171, 208], [208, 243],
];

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

function TachCluster({ progress, reduce }: { progress: MotionValue<number>; reduce: boolean }) {
  const rpmRaw = useTransform(progress, (p) =>
    reduce ? RPM_IDLE : RPM_IDLE + gearT(p).t * (REDLINE - RPM_IDLE),
  );
  // Needle physics — mass, stiffness and damping like a real stepper gauge:
  // sweeps track the scroll smoothly and the gear-shift drop becomes a fast
  // physical fall with a hint of settle, never a teleport.
  const rpmSpring = useSpring(rpmRaw, { stiffness: 160, damping: 19, mass: 0.55 });

  // Ignition sweep — the needle's full sweep-and-return when the cluster first
  // wakes, exactly like a performance car on startup.
  const dialRef = useRef<HTMLDivElement>(null);
  const ignited = useInView(dialRef, { once: true, amount: 0.6 });
  const sweepMV = useMotionValue(0);
  useEffect(() => {
    if (!ignited || reduce) return;
    let cancelled = false;
    (async () => {
      await animate(sweepMV, RPM_MAX, { duration: 0.65, ease: [0.3, 0, 0.15, 1] });
      if (!cancelled) await animate(sweepMV, 0, { duration: 1.0, ease: [0.16, 1, 0.3, 1] });
    })();
    return () => {
      cancelled = true;
      sweepMV.stop();
    };
  }, [ignited, reduce, sweepMV]);

  // The gauge shows whichever is higher: the sprung scroll-revs or the sweep.
  const rpm = useTransform([rpmSpring, sweepMV], ([a, b]: number[]) => Math.max(a, b));
  const needle = useTransform(rpm, (v) => rpmDeg(v));
  const gearNum = useTransform(progress, (p) => (reduce ? "1" : String(gearT(p).gear)));
  const rpmText = useTransform(rpm, (v) => (v / 1000).toFixed(1));

  // Live rev arc — a red fill that chases the needle around the dial.
  const arcLen = useTransform(rpm, (v) => v / RPM_MAX);
  const arcOpacity = useTransform(rpm, [RPM_IDLE, REDLINE], [0.3, 0.9]);

  // The readouts fans check: speed climbs through the gears (never falls at a
  // shift), the alternator charges harder with revs, oil warms over the run.
  const speedRaw = useTransform(progress, (p) => {
    if (reduce) return 0;
    const { gear, t } = gearT(p);
    const [a, b] = SPEED_BANDS[gear - 1];
    return a + t * (b - a);
  });
  const speedSpring = useSpring(speedRaw, { stiffness: 120, damping: 22 });
  const speedText = useTransform(speedSpring, (v) => String(Math.round(Math.max(0, v))));
  const voltText = useTransform(rpm, (v) => (13.8 + (v / RPM_MAX) * 0.5).toFixed(1));
  const oilText = useTransform(progress, (p) => String(Math.round(88 + (reduce ? 2 : p * 16))));

  // The pod's rim heats with the revs.
  const rimHeat = useTransform(rpm, [RPM_IDLE, REDLINE], [0.15, 0.85]);

  const [ax, ay] = dialPoint(80, -120);
  const [bx, by] = dialPoint(80, 120);
  const [rx1, ry1] = dialPoint(80, rpmDeg(7000));
  const [rx2, ry2] = dialPoint(80, rpmDeg(RPM_MAX));

  return (
    <div style={{ filter: "drop-shadow(0 18px 32px rgb(0 0 0 / 0.45))" }}>
      <div className="clip-chamfer relative" style={{ ["--ch" as string]: "14px" }}>
        {/* pod material — carbon glass */}
        <div
          aria-hidden
          className="absolute inset-0 border border-white/10"
          style={{ background: "linear-gradient(180deg, rgb(21 24 30 / 0.92) 0%, rgb(10 12 16 / 0.94) 100%)" }}
        />
        <div aria-hidden className="carbon-fine absolute inset-0 opacity-30" />
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, rgb(245 247 249 / 0.06), transparent 40%)" }}
        />
        {/* edge filament — heats with the revs */}
        <motion.div aria-hidden style={{ opacity: rimHeat }} className="edge-race absolute inset-0" />

        <div className="relative p-4 xl:p-5">
          {/* header — live marker + the tricolour handshake */}
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span aria-hidden className="race-led size-1.5 rounded-full bg-racing" />
              <span className="label-fine text-[9px] text-fg-muted">Телеметрия · На живо</span>
            </span>
            <span aria-hidden className="flex gap-1">
              <span className="h-1 w-6 -skew-x-[24deg] rounded-[1px] bg-[#81c4ff]" />
              <span className="h-1 w-6 -skew-x-[24deg] rounded-[1px] bg-[#16588e]" />
              <span className="h-1 w-6 -skew-x-[24deg] rounded-[1px] bg-[#e7222e]" />
            </span>
          </div>

          <div className="mt-3 flex items-end gap-6">
            {/* dial */}
            <div ref={dialRef} className="relative w-[148px] shrink-0 xl:w-[172px]">
              <svg viewBox="0 0 200 118" fill="none" aria-hidden className="w-full text-accent">
                {/* track */}
                <path d={`M ${ax} ${ay} A 80 80 0 1 1 ${bx} ${by}`} stroke="rgb(245 247 249 / 0.14)" strokeWidth={3} />
                {/* live rev arc — halo + core chase the needle */}
                <motion.path
                  d={`M ${ax} ${ay} A 80 80 0 1 1 ${bx} ${by}`}
                  stroke="var(--color-racing)"
                  strokeWidth={7}
                  strokeOpacity={0.16}
                  strokeLinecap="round"
                  style={{ pathLength: arcLen }}
                />
                <motion.path
                  d={`M ${ax} ${ay} A 80 80 0 1 1 ${bx} ${by}`}
                  stroke="var(--color-racing)"
                  strokeWidth={3}
                  strokeLinecap="round"
                  style={{ pathLength: arcLen, opacity: arcOpacity }}
                />
                {/* redline zone */}
                <path d={`M ${rx1} ${ry1} A 80 80 0 0 1 ${rx2} ${ry2}`} stroke="var(--color-racing)" strokeWidth={4} strokeOpacity={0.9} />
                {/* minor ticks per 500 rpm */}
                {Array.from({ length: 17 }, (_, k) => {
                  if (k % 2 === 0) return null;
                  const d = rpmDeg(k * 500);
                  const [x1, y1] = dialPoint(80, d);
                  const [x2, y2] = dialPoint(74, d);
                  return (
                    <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeOpacity={0.28} strokeWidth={1} />
                  );
                })}
                {/* major ticks + numerals, per 1000 rpm */}
                {Array.from({ length: 9 }, (_, k) => {
                  const d = rpmDeg(k * 1000);
                  const [x1, y1] = dialPoint(80, d);
                  const [x2, y2] = dialPoint(70, d);
                  const [nx, ny] = dialPoint(58, d);
                  const red = k >= 7;
                  return (
                    <g key={k}>
                      <line
                        x1={x1} y1={y1} x2={x2} y2={y2}
                        stroke={red ? "var(--color-racing)" : "currentColor"}
                        strokeOpacity={red ? 0.9 : 0.5}
                        strokeWidth={1.5}
                      />
                      <text x={nx} y={ny + 3} textAnchor="middle" className="fill-current" style={{ fontSize: 9, opacity: red ? 0.9 : 0.6 }}>
                        {k}
                      </text>
                    </g>
                  );
                })}
                {/* needle — native SVG rotation about the exact hub point (CSS
                    transform-origin on SVG groups is unreliable across engines) */}
                <Needle angle={needle} />
                <circle cx={100} cy={104} r={5.5} fill="#14171c" stroke="currentColor" strokeOpacity={0.6} />
              </svg>
              <p className="pointer-events-none absolute inset-x-0 bottom-0 text-center">
                <motion.span className="font-display text-sm font-bold tabular-nums text-fg">{rpmText}</motion.span>
                <span className="label-fine ml-1.5 text-[9px] text-fg-subtle">×1000 об/мин</span>
              </p>
            </div>

            {/* shift lights + gear box */}
            <div className="min-w-0 pb-1">
              <div className="mb-3 flex items-center gap-1.5">
                {Array.from({ length: 8 }, (_, i) => (
                  <ShiftLed key={i} index={i} rpm={rpm} />
                ))}
              </div>
              <div className="flex items-baseline gap-3">
                <motion.span className="font-display text-5xl font-extrabold leading-none tabular-nums text-fg xl:text-6xl">
                  {gearNum}
                </motion.span>
                <span className="label-fine text-fg-muted">предавка</span>
              </div>
            </div>
          </div>

          {/* readout strip — speed / charge / oil */}
          <div className="mt-4 grid grid-cols-3 border-t border-white/10 pt-3">
            <Readout label="Скорост" value={speedText} unit="км/ч" />
            <Readout label="Волтаж" value={voltText} unit="V" divided />
            <Readout label="Масло" value={oilText} unit="°C" divided />
          </div>
        </div>
      </div>
    </div>
  );
}

/** One live digital readout — label above, motion-value figure below. */
function Readout({
  label,
  value,
  unit,
  divided,
}: {
  label: string;
  value: MotionValue<string>;
  unit: string;
  divided?: boolean;
}) {
  return (
    <div className={`min-w-0 ${divided ? "border-l border-white/10 pl-4" : ""}`}>
      <p className="label-fine text-[9px] text-fg-subtle">{label}</p>
      <p className="mt-1 font-display text-sm font-bold tabular-nums text-fg">
        <motion.span>{value}</motion.span>
        <span className="ml-1 text-[10px] font-medium text-fg-muted">{unit}</span>
      </p>
    </div>
  );
}

/** One shift light — follows the *sprung* revs (so it walks with the needle,
 *  including the ignition sweep); everything lights at the redline flash. */
function ShiftLed({ index, rpm }: { index: number; rpm: MotionValue<number> }) {
  const color = index >= 6 ? "#e11d2a" : index >= 4 ? "#f0b429" : "#c9cfd6";
  const on = useTransform(rpm, (v) => {
    if (v >= 7050) return 1; // redline — full strip
    const t = (v - RPM_IDLE) / (REDLINE - RPM_IDLE);
    return t * 8 >= index + 0.5 ? 1 : 0.16;
  });
  return (
    <motion.span
      style={{ opacity: on, background: color, boxShadow: `0 0 8px ${color}66` }}
      className="h-1.5 w-4 rounded-[2px]"
    />
  );
}

/** Needle group rotated via the SVG transform attribute — pivot locked to the
 *  hub (100,104), immune to CSS transform-origin quirks on SVG. */
function Needle({ angle }: { angle: MotionValue<number> }) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const apply = (v: number) =>
      ref.current?.setAttribute("transform", `rotate(${v} 100 104)`);
    apply(angle.get());
    return angle.on("change", apply);
  }, [angle]);
  return (
    <g ref={ref}>
      <line x1={100} y1={104} x2={100} y2={30} stroke="var(--color-racing)" strokeWidth={2.5} strokeLinecap="round" />
      <line x1={100} y1={104} x2={100} y2={116} stroke="var(--color-racing)" strokeWidth={2.5} strokeLinecap="round" strokeOpacity={0.5} />
    </g>
  );
}

/** Compact shift cluster for phones — the same living gearbox (LEDs, gear,
 *  sprung revs) so mobile keeps the scene's signature, in one slim row. */
function MiniCluster({ progress }: { progress: MotionValue<number> }) {
  const rpmRaw = useTransform(progress, (p) => RPM_IDLE + gearT(p).t * (REDLINE - RPM_IDLE));
  const rpm = useSpring(rpmRaw, { stiffness: 160, damping: 19, mass: 0.55 });
  const gearNum = useTransform(progress, (p) => String(gearT(p).gear));
  const rpmText = useTransform(rpm, (v) => (v / 1000).toFixed(1));
  return (
    <div className="mb-5 flex items-center gap-4 rounded-full border border-line bg-base/40 px-4 py-2.5 backdrop-blur-md">
      <span className="flex items-center gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <ShiftLed key={i} index={i} rpm={rpm} />
        ))}
      </span>
      <span className="flex items-baseline gap-1.5">
        <motion.span className="font-display text-xl font-extrabold leading-none tabular-nums text-fg">
          {gearNum}
        </motion.span>
        <span className="label-fine text-fg-muted">пр.</span>
      </span>
      <span className="flex items-baseline gap-1">
        <motion.span className="font-display text-sm font-bold tabular-nums text-fg/80">
          {rpmText}
        </motion.span>
        <span className="label-fine text-fg-subtle">×1000</span>
      </span>
    </div>
  );
}

/* ── The three qualities — silhouette, power, balance. Kept on phones, where
   there is no film: an index, a word, a line, revealed once on entry. */

const PILLARS: [string, string][] = [
  ["Силует", "Форма, родена от вятъра."],
  ["Мощност", "Характер, който усещате."],
  ["Баланс", "Контрол във всеки завой."],
];

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
 * The mobile Machine — purpose-built: one cinematic still with the engine
 * idling in the cluster (revs breathing around 1.5k, gear 1, first light
 * flickering), the statement, and the three qualities. No pin, no canvas,
 * no frame downloads — instant and fluid, while keeping the living-gearbox
 * signature.
 */
function MobileMachine({
  chapter = true,
  copy = DEFAULT_COPY,
}: {
  chapter?: boolean;
  copy?: MachineCopy;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  // The idle loop runs ONLY while the scene is near the viewport — an
  // infinite animation must never tick under the rest of the page.
  const onScreen = useInView(ref, { margin: "25% 0px 25% 0px" });
  const idle = useMotionValue(0.004);
  useEffect(() => {
    if (reduce || !onScreen) return;
    const ctrl = animate(idle, [0.004, 0.016, 0.006, 0.014, 0.004], {
      duration: 5.4,
      repeat: Infinity,
      ease: "easeInOut",
    });
    return () => ctrl.stop();
  }, [idle, reduce, onScreen]);

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
            <span aria-hidden className="mr-2 text-racing">[</span>
            03 · Машината
            <span aria-hidden className="ml-2 text-racing">]</span>
          </p>
          <MiniCluster progress={idle} />
          <h2 className="font-display text-[clamp(1.9rem,7.5vw,3rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-fg">
            {copy.title}
          </h2>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-fg/75">
            {copy.subcopy}
          </p>
          <PillarsStatic />
        </div>
      </div>
    </section>
  );
}
