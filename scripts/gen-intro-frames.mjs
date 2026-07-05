// Regenerate the scroll-scrubbed intro frame sequence from a source clip.
//
// Pipeline (Apple-style "pre-exploded frames painted to <canvas>"):
//   1. ffmpeg decodes the source video, motion-compensated-interpolates it to a
//      higher, even frame rate (optical-flow `minterpolate`) so the scrub steps
//      finer, and high-quality-downscales it to a master width → PNG frames.
//   2. sharp encodes each PNG to a tuned WebP twice: a crisp desktop set
//      (public/intro/frames) and a light mobile set (public/intro/frames-m).
//   3. The first frame becomes the poster (public/intro/intro-poster.jpg), used
//      for the first paint and the reduced-motion still.
//
// Why frames and not <video>: a <video> can't be scrubbed smoothly (seeking
// stalls/decodes), especially on mobile. Painting a pre-decoded frame per scroll
// position is jank-free on every device. minterpolate adds the optical-flow
// in-betweens the user asked for; the component additionally eases the painted
// index for sub-frame smoothness.
//
// Run: node scripts/gen-intro-frames.mjs [sourceVideo] [ffmpegPath]
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import {
  rmSync,
  mkdirSync,
  readdirSync,
  existsSync,
} from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC =
  process.argv[2] ||
  "C:/Users/Chavd/Downloads/ElevenLabs_video_topaz-video-upscale_2026-05-31T18_29_44.mp4";
// ffmpeg must support HEVC decode, the `minterpolate` filter, and lanczos scale.
// Resolution order: CLI arg → bundled .work/ffmpeg.exe → "ffmpeg" on PATH.
const scratchFfmpeg = path.join(ROOT, ".work", "ffmpeg.exe");
const FFMPEG =
  process.argv[3] || (existsSync(scratchFfmpeg) ? scratchFfmpeg : "ffmpeg");

// --- tuning -----------------------------------------------------------------
// Native aspect of the source (3448x1444 ≈ 2.39:1) is preserved; the component's
// canvas cover-crops it per viewport. Master width drives desktop sharpness while
// keeping decoded-frame memory at/under the previous sequence (no perf regression).
const MASTER_W = 1600; // desktop frame width (height derived, ~670)
const MOBILE_W = 854; // mobile frame width (~358)
const FPS = 30; // interpolate 24 → 30 for a finer, smoother scrub
const DESKTOP_Q = 85;
const MOBILE_Q = 80;

const PUB = path.join(ROOT, "public", "intro");
const DESK_DIR = path.join(PUB, "frames");
const MOB_DIR = path.join(PUB, "frames-m");
const TMP = path.join(ROOT, ".work", "pngs");
const pad = (n) => String(n).padStart(3, "0");

function sh(file, args) {
  return execFileSync(file, args, { stdio: ["ignore", "pipe", "inherit"] });
}

// 1) decode → optical-flow interpolate → downscale → PNG master frames --------
if (!existsSync(SRC)) throw new Error(`source video not found: ${SRC}`);
if (FFMPEG !== "ffmpeg" && !existsSync(FFMPEG))
  throw new Error(`ffmpeg not found: ${FFMPEG}`);

rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const vf = [
  `scale=${MASTER_W}:-2:flags=lanczos`,
  `minterpolate=fps=${FPS}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1`,
].join(",");

console.log(`ffmpeg: decode + minterpolate→${FPS}fps + scale→${MASTER_W}w …`);
sh(FFMPEG, [
  "-hide_banner",
  "-loglevel", "error",
  "-stats",
  "-i", SRC,
  "-vf", vf,
  "-pix_fmt", "rgb24",
  path.join(TMP, "m_%04d.png"),
]);

const pngs = readdirSync(TMP).filter((f) => f.endsWith(".png")).sort();
const N = pngs.length;
if (N < 2) throw new Error(`expected many frames, got ${N}`);
console.log(`→ ${N} master frames`);

// 2) encode tuned WebP sets ---------------------------------------------------
for (const dir of [DESK_DIR, MOB_DIR]) {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
}

console.log("sharp: encoding desktop + mobile WebP …");
for (let i = 0; i < N; i++) {
  const src = path.join(TMP, pngs[i]);
  const out = `f${pad(i + 1)}.webp`;
  // Desktop: master res, gentle unsharp to recover WebP softening.
  await sharp(src)
    .sharpen({ sigma: 0.6 })
    .webp({ quality: DESKTOP_Q, effort: 6, smartSubsample: true })
    .toFile(path.join(DESK_DIR, out));
  // Mobile: high-quality downscale then sharpen.
  await sharp(src)
    .resize(MOBILE_W, null, { kernel: "lanczos3" })
    .sharpen({ sigma: 0.7 })
    .webp({ quality: MOBILE_Q, effort: 6, smartSubsample: true })
    .toFile(path.join(MOB_DIR, out));
  if ((i + 1) % 20 === 0 || i === N - 1) console.log(`  ${i + 1}/${N}`);
}

// 3) poster (first frame) — first paint + reduced-motion still ----------------
console.log("sharp: poster …");
await sharp(path.join(TMP, pngs[0]))
  .resize(1920, null, { kernel: "lanczos3" })
  .jpeg({ quality: 84, mozjpeg: true, chromaSubsampling: "4:4:4" })
  .toFile(path.join(PUB, "intro-poster.jpg"));

rmSync(TMP, { recursive: true, force: true });

console.log(`\n✅ Done. FRAME_COUNT = ${N}`);
console.log(`   Set FRAME_COUNT in components/home/IntroVideoScroll.tsx to ${N}.`);
