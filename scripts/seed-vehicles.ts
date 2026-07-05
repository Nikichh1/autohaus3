// Imports the existing static inventory into the database (idempotent by slug).
// Run: node --env-file=.env --experimental-strip-types scripts/seed-vehicles.ts
import { vehicles } from "../data/vehicles.ts";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const seen = new Set<string>();
let created = 0;
let skipped = 0;

for (const v of vehicles) {
  let slug = v.slug || `${v.brand}-${v.model}`.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  while (seen.has(slug)) slug = `${slug}-x`;
  seen.add(slug);

  const exists = await prisma.vehicle.findUnique({ where: { slug }, select: { id: true } });
  if (exists) {
    skipped++;
    continue;
  }

  const price = v.price ?? 0;
  await prisma.vehicle.create({
    data: {
      slug,
      status: "available",
      featured: Boolean(v.featured),
      brand: v.brand,
      model: v.model,
      variant: v.variant ?? null,
      year: v.year,
      bodyType: v.bodyType ?? "",
      collection: v.collection,
      fuelType: v.fuelType,
      transmission: v.transmission,
      drivetrain: v.drivetrain,
      price,
      priceOnRequest: price === 0,
      rentalPerDay: v.rentalPerDay ?? null,
      mileage: v.mileage ?? 0,
      power: v.power ?? 0,
      torque: v.torque ?? null,
      engineCC: v.engineCC ?? null,
      acceleration: v.acceleration ?? null,
      topSpeed: v.topSpeed ?? null,
      doors: v.doors ?? null,
      seats: v.seats ?? null,
      exteriorColor: v.exteriorColor ?? null,
      interiorColor: v.interiorColor ?? null,
      vin: v.vin ?? null,
      features: JSON.stringify(v.features ?? []),
      description: v.description ?? "",
      publishedAt: new Date(),
      images: {
        create: (v.images ?? []).map((url, i) => ({ url, position: i, isPrimary: i === 0 })),
      },
    },
  });
  created++;
}

console.log(`✓ Seeded vehicles — created: ${created}, skipped(existing): ${skipped}`);
await prisma.$disconnect();
