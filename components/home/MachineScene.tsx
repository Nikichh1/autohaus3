"use client";

import { useEffect, useRef, useState } from "react";
import {
  motion,
  useTransform,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
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
  const rpm = useTransform(progress, [0.05, 0.95], [0, 1]);
  const scanTop = useTransform(progress, [0.08, 0.96], ["18%", "82%"]);
  const scanOpacity = useTransform(progress, [0.06, 0.16, 0.88, 1], [0, 0.7, 0.7, 0]);
  const subOpacity = useTransform(progress, [0.46, 0.56], [0, 1]);
  const subY = useTransform(progress, [0.46, 0.56], [26, 0]);
  const ctaOpacity = useTransform(progress, [0.58, 0.68], [0, 1]);
  const ctaY = useTransform(progress, [0.58, 0.68], [26, 0]);
  const hudOpacity = useTransform(progress, [0.05, 0.15], [0, 1]);
  // The film itself breathes with the scroll — a slow push-in.
  const filmScale = useTransform(progress, [0, 1], [1.09, 1]);
  // Live telemetry — the scene reads back your own momentum.
  const speed = useTransform(progress, (p) =>
    String(Math.round(Math.min(1, p * 1.15) * 280)).padStart(3, "0"),
  );
  const gear = useTransform(progress, (p) => String(Math.min(6, 1 + Math.floor(p * 5.99))));

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
      data-chapter="04"
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

        {/* ── Left telemetry rail — a quarter of the frame held dark while the
            film runs behind it; the scene reads back your own momentum ── */}
        <div className="absolute inset-y-0 left-0 z-10 hidden w-[25%] flex-col justify-between border-r border-line bg-gradient-to-r from-base via-base/85 to-transparent px-8 py-24 lg:flex xl:px-10">
          <motion.p style={{ opacity: hudOpacity }} className="label-fine flex items-center gap-3 text-fg/80">
            <span aria-hidden className="text-accent">[</span>
            04 · Машината
            <span aria-hidden className="text-accent">]</span>
          </motion.p>

          <div>
            <h2 className="font-display text-[clamp(2rem,2.9vw,3.2rem)] font-extrabold leading-[1.02] tracking-[-0.03em] text-fg">
              {TITLE.map(([word, [a, b]]) => (
                <span key={word} className="block">
                  <TitleWord word={word} range={[a, b]} progress={progress} reduce={!!reduce} />
                </span>
              ))}
            </h2>
            <motion.p
              style={reduce ? undefined : { opacity: subOpacity, y: subY }}
              className="mt-5 max-w-[24ch] text-sm leading-relaxed text-fg/70"
            >
              Силует, мощност и баланс в перфектна хармония — усещате я още преди
              да запалите двигателя.
            </motion.p>
          </div>

          {/* telemetry block */}
          <motion.div style={{ opacity: hudOpacity }}>
            <div className="flex items-end gap-6">
              <div>
                <motion.span className="font-display text-5xl font-extrabold leading-none tabular-nums text-fg xl:text-6xl">
                  {speed}
                </motion.span>
                <span className="label-fine ml-2 text-fg-muted">км/ч</span>
              </div>
              <div className="pb-1">
                <span className="label-fine text-fg-subtle">предавка</span>
                <motion.span className="ml-2 font-display text-xl font-extrabold tabular-nums text-accent">
                  {gear}
                </motion.span>
              </div>
            </div>
            <div className="mt-5 h-px w-full bg-white/12">
              <motion.div style={{ scaleX: rpm }} className="h-full origin-left bg-accent" />
            </div>
            <div className="mt-7">
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
            className="absolute left-[8%] right-[8%] z-10 h-px bg-gradient-to-r from-transparent via-accent/60 to-transparent lg:left-[30%] lg:right-[6%]"
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
