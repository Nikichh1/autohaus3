// Process licensed high-res stock (Unsplash, free for commercial use) used ONLY
// as atmospheric full-bleed backdrops behind type — never as inventory.
// Sources live in public/stock-src/ (gitignored); outputs go to public/photos/.
//
// Run: node scripts/process-stock.mjs
import sharp from "sharp";
import { statSync } from "node:fs";

const SRC = "public/stock-src";
const OUT = "public/photos";

// source → output, target landscape size (cover-cropped, centered)
const MAP = [
  { src: "headlight-audi.jpg",  out: "detail-headlight", w: 2400, h: 1500 },
  { src: "silver-dramatic.jpg", out: "cta-supercar",     w: 2400, h: 1500 },
  { src: "black-dark.jpg",      out: "studio-suv",        w: 2000, h: 1500 },
];

function vignetteSvg(w, h, strength) {
  return Buffer.from(
    `<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="v" cx="50%" cy="48%" r="82%">
          <stop offset="58%" stop-color="#05070a" stop-opacity="0"/>
          <stop offset="100%" stop-color="#05070a" stop-opacity="${strength}"/>
        </radialGradient>
      </defs>
      <rect width="${w}" height="${h}" fill="url(#v)"/>
    </svg>`,
  );
}

async function run() {
  for (const m of MAP) {
    const graded = await sharp(`${SRC}/${m.src}`)
      .rotate()
      .resize({ width: m.w, height: m.h, fit: "cover", position: "centre" })
      .modulate({ brightness: 1.02, saturation: 1.04 })
      .linear(1.05, -3)
      .gamma(1.02)
      .sharpen({ sigma: 0.6 })
      .toBuffer();

    await sharp(graded)
      .composite([{ input: vignetteSvg(m.w, m.h, 0.2), blend: "over" }])
      .webp({ quality: 90, effort: 6, smartSubsample: true })
      .toFile(`${OUT}/${m.out}.webp`);

    const kb = (statSync(`${OUT}/${m.out}.webp`).size / 1024).toFixed(0);
    console.log(`✓ ${m.out}.webp  ${m.w}x${m.h}  ${kb}KB`);
  }
  console.log(`\nDone — ${MAP.length} stock backdrops graded into ${OUT}/`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
