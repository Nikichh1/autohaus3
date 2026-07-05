// Prepare transparent car cutouts for the scroll showcase.
// Trims transparent margins, normalizes to a consistent width, keeps alpha,
// encodes as webp. Sources (pngimg.com, free) live in gitignored public/cars-src/.
//
// Run: node scripts/process-cars.mjs
import sharp from "sharp";
import { statSync } from "node:fs";

const SRC = "public/cars-src";
const OUT = "public/cars";

// chosen cutout per brand → output slug, target width
const MAP = [
  { src: "bmw_99560.png",      out: "bmw",         w: 2000 }, // M2 (3/4)
  { src: "ferrari_102812.png", out: "ferrari",     w: 2200 }, // F40 (side)
  { src: "lambo_102912.png",   out: "lamborghini", w: 2200 }, // Aventador (side)
  { src: "mercedes_80146.png", out: "mercedes",    w: 2000 }, // C63 (3/4)
  { src: "audi_1715.png",      out: "audi",        w: 2000 }, // A3 (3/4)
];

async function run() {
  const { mkdir } = await import("node:fs/promises");
  await mkdir(OUT, { recursive: true });
  for (const m of MAP) {
    await sharp(`${SRC}/${m.src}`)
      .trim({ threshold: 10 }) // crop away transparent padding
      .resize({ width: m.w, withoutEnlargement: false, kernel: sharp.kernel.lanczos3 })
      .sharpen({ sigma: 0.6 })
      .webp({ quality: 92, alphaQuality: 100, effort: 6 })
      .toFile(`${OUT}/${m.out}.webp`);

    const meta = await sharp(`${OUT}/${m.out}.webp`).metadata();
    const kb = (statSync(`${OUT}/${m.out}.webp`).size / 1024).toFixed(0);
    console.log(`✓ ${m.out}.webp  ${meta.width}x${meta.height}  ${kb}KB`);
  }
  console.log(`\nDone — ${MAP.length} car cutouts into ${OUT}/`);
}

run().catch((e) => { console.error(e); process.exit(1); });
