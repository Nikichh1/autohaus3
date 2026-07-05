// Cinematic — but clean & bright — grade for the real AutoHaus photos.
// Philosophy: preserve detail, lift exposure, gentle contrast. No crushed
// blacks, no heavy baked vignette (CSS handles staging where needed).
// The hero building is upscaled with Lanczos so it stays crisp on large screens.
//
// Run: node scripts/process-photos.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { statSync } from "node:fs";

const SRC = "public/brand";
const OUT = "public/photos";

// Grade profiles — kept deliberately light so images read as premium, not dim.
const GRADES = {
  // Architectural hero: airy, bright, true-to-render. Upscaled for big screens.
  hero: {
    modulate: { brightness: 1.04, saturation: 1.05 },
    linear: [1.06, -4],
    gamma: 1.02,
    sharpen: { sigma: 0.6 },
    vignette: 0,
  },
  // Inventory cars on dark UI: rich, contrasty, but never muddy.
  car: {
    modulate: { brightness: 1.02, saturation: 1.07 },
    linear: [1.1, -6],
    gamma: 1.03,
    sharpen: { sigma: 0.9 },
    vignette: 0.22,
  },
  // Showroom / lifestyle / building: natural and clean.
  scene: {
    modulate: { brightness: 1.03, saturation: 1.05 },
    linear: [1.07, -5],
    gamma: 1.02,
    sharpen: { sigma: 0.7 },
    vignette: 0.12,
  },
};

// source → output name, role, target max width (upscale only when `up: true`)
const MAP = [
  { src: "home-bg.jpg",       out: "building-dusk",   role: "hero",  w: 2880, up: true },
  { src: "unnamed (2).webp",  out: "building-day",    role: "scene", w: 1280 },
  { src: "unnamed (13).webp", out: "bmw7-front",      role: "car",   w: 1360 },
  { src: "unnamed (3).webp",  out: "bmw7-front-alt",  role: "car",   w: 1360 },
  { src: "unnamed (9).webp",  out: "bmw7-side",       role: "car",   w: 1360 },
  { src: "unnamed (14).webp", out: "brabus-front",    role: "car",   w: 1035 },
  { src: "unnamed (8).webp",  out: "brabus-rear",     role: "car",   w: 574  },
  { src: "unnamed (10).webp", out: "urus-front",      role: "car",   w: 574  },
  { src: "unnamed (11).webp", out: "audi-a8",         role: "car",   w: 765  },
  { src: "unnamed (4).webp",  out: "welcome-sign",    role: "scene", w: 1360 },
  { src: "unnamed (6).webp",  out: "cafe-terrace",    role: "scene", w: 1360 },
  { src: "unnamed (1).webp",  out: "showroom-sclass", role: "car",   w: 574  },
  { src: "unnamed.webp",      out: "showroom-bentley",role: "scene", w: 1280 },
  { src: "unnamed (7).webp",  out: "showroom-r8",     role: "scene", w: 1280 },
  { src: "unnamed (15).webp", out: "showroom-aston",  role: "scene", w: 1280 },
  { src: "unnamed (12).webp", out: "showroom-amg",    role: "scene", w: 1360 },
  { src: "unnamed (5).webp",  out: "showroom-merc",   role: "scene", w: 1280 },
];

function vignetteSvg(w, h, strength) {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="46%" r="80%">
          <stop offset="60%" stop-color="#05070a" stop-opacity="0"/>
          <stop offset="100%" stop-color="#05070a" stop-opacity="${strength}"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#v)"/>
    </svg>`,
  );
}

async function run() {
  await mkdir(OUT, { recursive: true });
  let total = 0;
  for (const m of MAP) {
    const g = GRADES[m.role];

    // Pass 1: orient, resize (Lanczos), clean grade.
    let pipe = sharp(`${SRC}/${m.src}`)
      .rotate()
      .resize({
        width: m.w,
        withoutEnlargement: !m.up,
        kernel: sharp.kernel.lanczos3,
      })
      .modulate(g.modulate)
      .linear(g.linear[0], g.linear[1])
      .gamma(g.gamma)
      .sharpen(g.sharpen);

    const graded = await pipe.toBuffer();
    const { width, height } = await sharp(graded).metadata();

    // Pass 2: optional subtle vignette, encode at high quality.
    let out = sharp(graded);
    if (g.vignette > 0) {
      out = out.composite([
        { input: vignetteSvg(width, height, g.vignette), blend: "over" },
      ]);
    }
    await out.webp({ quality: 90, effort: 6, smartSubsample: true }).toFile(
      `${OUT}/${m.out}.webp`,
    );

    const kb = (statSync(`${OUT}/${m.out}.webp`).size / 1024).toFixed(0);
    total += Number(kb);
    console.log(`✓ ${m.out}.webp  ${width}x${height}  ${kb}KB`);
  }
  console.log(`\nDone — ${MAP.length} photos graded into ${OUT}/  (~${total}KB total)`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
