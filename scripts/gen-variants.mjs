// Responsive width variants for the custom next/image loader.
// The full-res `{name}.webp` (your pristine graded file) is left UNTOUCHED;
// we only add smaller `{name}-{w}.webp` downscales (q90) so phones/tablets
// fetch a right-sized image via srcset. Writes lib/image-manifest.json.
//
// Run after the grade scripts: node scripts/gen-variants.mjs
import sharp from "sharp";
import { readdirSync, writeFileSync, mkdirSync } from "node:fs";

const DIRS = ["public/photos", "public/cars"];
// Subset of next/image deviceSizes → loader returns exact-width files.
const LADDER = [640, 828, 1080, 1920];

const manifest = {};
let made = 0;

for (const dir of DIRS) {
  let files;
  try {
    files = readdirSync(dir);
  } catch {
    continue;
  }
  for (const f of files) {
    if (!f.endsWith(".webp")) continue;
    if (/-\d+\.webp$/.test(f)) continue; // skip existing variants
    const name = f.replace(/\.webp$/, "");
    const full = `${dir}/${f}`;
    const { width: W } = await sharp(full).metadata();
    const widths = [];
    for (const w of LADDER) {
      if (w < W) {
        await sharp(full)
          .resize(w)
          .webp({ quality: 90, effort: 6, smartSubsample: true })
          .toFile(`${dir}/${name}-${w}.webp`);
        widths.push(w);
        made++;
      }
    }
    widths.push(W); // largest = the untouched base file
    const key = `/${dir.replace(/^public\//, "")}/${name}`;
    manifest[key] = widths;
    console.log(`${key}  →  ${widths.join(", ")}`);
  }
}

mkdirSync("lib", { recursive: true });
writeFileSync("lib/image-manifest.json", JSON.stringify(manifest, null, 0) + "\n");
console.log(`\nDone — ${made} variants, ${Object.keys(manifest).length} images in lib/image-manifest.json`);
