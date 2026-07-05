// Refresh the catalog from the live AutoHaus inventory.
//
//   node scripts/import-inventory.mjs
//
// Scrapes every car at https://autohaus.bg/cars/всички/ , extracts the spec
// table + gallery from each /car/<slug>/ detail page, maps it to our Vehicle
// shape and rewrites data/vehicles.ts. Photos are referenced REMOTELY from the
// AutoHaus media library (the custom next/image loader passes non-webp URLs
// through untouched), using the 768×480 variant when available. "On request"
// prices become 0 (shown as "При запитване"). Source has no descriptions, so a
// concise factual one is generated from the specs. Node 18+ (global fetch).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const LISTING = "https://autohaus.bg/cars/%D0%B2%D1%81%D0%B8%D1%87%D0%BA%D0%B8/";
const UA = { "User-Agent": "Mozilla/5.0" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const strip = (s) =>
  s.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#8211;/g, "–").replace(/\s+/g, " ").trim();

const BRANDS = ["Mercedes-Maybach","Mercedes-AMG","Mercedes-Benz","Land Rover","Rolls-Royce","Aston Martin","BMW","Audi","Porsche","Bentley","Maserati","Honda","Toyota","BRABUS","Lamborghini","Ferrari","McLaren","Lexus","Volkswagen"];
const brandOf = (f) => {
  for (const b of BRANDS) if (f.toLowerCase().startsWith(b.toLowerCase())) return b;
  if (/^a\d|^q\d|^rs ?q|^rs\d|^s\d.*tfsi|allroad/i.test(f)) return "Audi";
  if (/^x\d|^m\d|^\d{3}d|gran turismo|xdrive|^ix/i.test(f)) return "BMW";
  if (/^g \d|^s \d|^e \d|^c \d|^v \d|^gl|^cls|^cle|^sl |amg|sprinter/i.test(f)) return "Mercedes-Benz";
  return f.split(" ")[0];
};
const FUEL = (s) => (/електрич/i.test(s) ? "electric" : /хибрид|plug/i.test(s) ? "hybrid" : /дизел/i.test(s) ? "diesel" : "petrol");
const FUEL_BG = { petrol: "Бензинов", diesel: "Дизелов", hybrid: "Хибрид", electric: "Електрически" };
const TRANS = (s) => (/ръчна/i.test(s) ? "manual" : "automatic");
const TRANS_BG = { automatic: "автоматична скоростна кутия", manual: "ръчна скоростна кутия" };
const num = (s) => parseInt(String(s || "").replace(/[^\d]/g, ""), 10) || 0;
const yearOf = (r) => { const m = String(r || "").match(/(?:19|20)\d{2}/); return m ? +m[0] : 2026; };
const driveOf = (f) => (/quattro|xdrive|4matic|4motion|4x4|\bq4\b|4m\b|allrad|4wd/i.test(f) ? "awd" : "rwd");
const bodyOf = (m) => {
  if (/x-adv|r1100|caf[eé] racer/i.test(m)) return "Мотоциклет";
  if (/sprinter|\bv \d|v-300|freezer|vito/i.test(m)) return "Ван";
  if (/\bg \d|g-?\d|gle|glc|gls|gl \d|\bx\d|x-adv|x 350|cayenne|levante|land cruiser|range rover|\brr |discovery|\bq[378]\b|tundra|m60|\bix\b|defender|urus/i.test(m)) return "SUV";
  if (/cabrio|grancabrio|targa|spyder|spider|roadster|\bsl \d|sl-|cross cabin/i.test(m)) return "Кабрио";
  if (/coupe|coupé|granturismo|continental gt|gt r|m850|amg gt|\bcle\b/i.test(m)) return "Купе";
  return "Седан";
};
const collOf = (f) => {
  if (/amg|brabus|\bm5\d|\bm6\d|\bm8\d|m550|m850|gt r|gtr|\brs\d|rs q|turbo|competition|carrera|\b911\b|targa|panamera turbo|s 63|s8 plus|v10|cross cabin|caf[eé] racer|x-adv|m50i|m60/i.test(f)) return "performance";
  if (/maybach|guard|\bs 3\d|\bs 5\d|\bs 6\d|\ba8|730d|continental|flying spur|\blong\b|\bvip\b|professional|\bl \d?matic|gls 600|first edition|autobiography/i.test(f)) return "executive";
  return "signature";
};

function parseDetail(html, url) {
  const slug = url.match(/\/car\/([^/]+)\//)[1];
  const h1 = (html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/) || [])[1];
  const specs = {};
  const t = html.match(/<table[^>]*>[\s\S]*?<\/table>/);
  if (t) for (const r of t[0].matchAll(/<tr>\s*<td>([\s\S]*?)<\/td>\s*<td>([\s\S]*?)<\/td>\s*<\/tr>/g))
    specs[strip(r[1]).replace(/:$/, "").trim()] = strip(r[2]);
  const images = [...new Set([...html.matchAll(/https:\/\/autohaus\.bg\/wp-content\/uploads\/[^"' )]+\.(?:jpg|jpeg|png|webp)/gi)].map((m) => m[0]))]
    .filter((u) => !/favicon|logo|cropped|placeholder/i.test(u))
    .filter((u) => !/-\d+x\d+\.(jpg|jpeg|png|webp)$/i.test(u))
    .slice(0, 8);
  return { slug, title: h1 ? strip(h1) : "", specs, images };
}

const head = async (u) => { try { return (await fetch(u, { method: "HEAD", headers: UA })).ok; } catch { return false; } };
const variant = (u) => u.replace(/\.(jpg|jpeg|png)$/i, "-768x480.$1");
const fmtBG = (n) => new Intl.NumberFormat("bg-BG").format(n);

async function main() {
  console.log("Fetching listing…");
  const listing = await (await fetch(LISTING, { headers: UA })).text();
  const urls = [...new Set([...listing.matchAll(/https:\/\/autohaus\.bg\/car\/[a-z0-9-]+\//g)].map((m) => m[0]))];
  console.log(`Found ${urls.length} cars. Scraping detail pages…`);
  const cars = [];
  for (let i = 0; i < urls.length; i++) {
    try { cars.push(parseDetail(await (await fetch(urls[i], { headers: UA })).text(), urls[i])); }
    catch (e) { console.warn("skip", urls[i], e.message); }
    process.stdout.write(`\r${i + 1}/${urls.length}`);
    await sleep(120);
  }
  console.log("\nVerifying image variants…");
  const all = [...new Set(cars.flatMap((c) => c.images))];
  const map = {};
  let idx = 0;
  await Promise.all(Array.from({ length: 24 }, async () => {
    while (idx < all.length) { const u = all[idx++]; const v = variant(u); map[u] = (await head(v)) ? v : u; }
  }));

  const vehicles = cars.map((c, i) => {
    const full = (c.specs["Марка и модел"] || c.title || "").trim();
    const brand = brandOf(full);
    let model = full.toLowerCase().startsWith(brand.toLowerCase()) ? full.slice(brand.length).trim() : full;
    if (!model) model = c.title || full;
    const fuelType = FUEL(c.specs["Тип двигател"]);
    const transmission = TRANS(c.specs["Трансмисия"]);
    const power = num(c.specs["Мощност"]);
    const mileage = num(c.specs["Пробег"]);
    const exteriorColor = (c.specs["Цвят"] || "").trim() || "—";
    const reg = (c.specs["Регистрация"] || "").trim();
    const description =
      `${full}. ${FUEL_BG[fuelType]}, ${power} к.с., ${TRANS_BG[transmission]}.` +
      `${reg && !/без първа/i.test(reg) ? ` Първа регистрация: ${reg.replace(/\.\s*$/, "")}.` : " Без първа регистрация."}` +
      ` Пробег ${fmtBG(mileage)} км, цвят ${exteriorColor}. Проверен автомобил, готов за оглед в AutoHaus, Пловдив.`;
    return {
      id: "v" + String(i + 1).padStart(3, "0"), slug: c.slug, brand, model,
      year: yearOf(reg), price: /request|запитване/i.test(c.specs["Цена"] || "") ? 0 : num(c.specs["Цена"]),
      mileage, fuelType, transmission, drivetrain: driveOf(full), bodyType: bodyOf(full),
      collection: collOf(full), power, exteriorColor, features: [], description,
      images: c.images.map((u) => map[u]),
    };
  });
  const byPrice = [...vehicles].filter((v) => v.price > 0).sort((a, b) => b.price - a.price);
  byPrice.slice(0, 6).forEach((v) => { vehicles.find((x) => x.id === v.id).featured = true; });
  byPrice.slice(0, 12).forEach((v) => { vehicles.find((x) => x.id === v.id).rentalPerDay = Math.max(200, Math.round(v.price / 300 / 10) * 10); });

  const out = `import type { Vehicle } from "@/types";

// Real inventory imported from autohaus.bg (run: node scripts/import-inventory.mjs).
// Photos are served from the AutoHaus media library; "On request" prices are 0.
export const vehicles: Vehicle[] = ${JSON.stringify(vehicles, null, 2)};

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return vehicles.find((v) => v.slug === slug);
}

export function getFeaturedVehicles(): Vehicle[] {
  return vehicles.filter((v) => v.featured);
}

export function getSimilarVehicles(vehicle: Vehicle, count = 3): Vehicle[] {
  return vehicles
    .filter((v) => v.id !== vehicle.id)
    .sort((a, b) => {
      const aSameBrand = a.brand === vehicle.brand ? -1 : 0;
      const bSameBrand = b.brand === vehicle.brand ? -1 : 0;
      const aPriceDiff = Math.abs(a.price - vehicle.price);
      const bPriceDiff = Math.abs(b.price - vehicle.price);
      return aSameBrand - bSameBrand || aPriceDiff - bPriceDiff;
    })
    .slice(0, count);
}

export function getRentalVehicles(): Vehicle[] {
  return vehicles.filter((v) => v.rentalPerDay !== undefined);
}

export const uniqueBrands = Array.from(
  new Set(vehicles.map((v) => v.brand)),
).sort();
export const uniqueBodyTypes = Array.from(
  new Set(vehicles.map((v) => v.bodyType)),
).sort();
`;
  fs.writeFileSync(path.join(ROOT, "data/vehicles.ts"), out);
  console.log(`Wrote data/vehicles.ts — ${vehicles.length} vehicles (${vehicles.filter((v) => v.price > 0).length} priced, ${vehicles.filter((v) => v.price === 0).length} on request).`);
}

main();
