import "server-only";
import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import type { Vehicle, FuelType, Transmission, Drivetrain, Collection } from "@/types";
import { parseFeatures } from "@/lib/admin/vehicle-queries";

// The public pages are statically rendered and read from the database here. Freshness
// comes from on-demand revalidation: admin mutations call revalidatePath() for these
// routes (see lib/admin/vehicle-actions.ts), which regenerates them with new data.
// React cache() dedupes repeated reads within a single render pass.

const PLACEHOLDER_IMAGE = "/placeholder-vehicle.svg";

// Listing surfaces show the active inventory; detail pages also resolve sold cars
// (so shared links keep working) but never drafts or archived vehicles.
const LISTING_STATUS = ["available", "reserved"];
const DETAIL_STATUS = ["available", "reserved", "sold"];

const withImages = {
  images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }] },
} satisfies Prisma.VehicleInclude;

type Row = Prisma.VehicleGetPayload<{ include: typeof withImages }>;

function toPublic(row: Row): Vehicle {
  return {
    id: row.id,
    slug: row.slug,
    brand: row.brand,
    model: row.model,
    variant: row.variant ?? undefined,
    year: row.year,
    // "Price on request" renders as 0 publicly (→ "При запитване"), regardless of any
    // stale numeric price left in the field.
    price: row.priceOnRequest ? 0 : row.price,
    mileage: row.mileage,
    fuelType: row.fuelType as FuelType,
    transmission: row.transmission as Transmission,
    drivetrain: row.drivetrain as Drivetrain,
    bodyType: row.bodyType,
    collection: row.collection as Collection,
    rentalPerDay: row.rentalPerDay ?? undefined,
    power: row.power,
    torque: row.torque ?? undefined,
    engineCC: row.engineCC ?? undefined,
    acceleration: row.acceleration ?? undefined,
    topSpeed: row.topSpeed ?? undefined,
    doors: row.doors ?? undefined,
    seats: row.seats ?? undefined,
    exteriorColor: row.exteriorColor ?? "",
    interiorColor: row.interiorColor ?? undefined,
    vin: row.vin ?? undefined,
    features: parseFeatures(row.features),
    description: row.description,
    // Guarantee at least one image so public components never receive undefined.
    images: row.images.length ? row.images.map((i) => i.url) : [PLACEHOLDER_IMAGE],
    featured: row.featured,
    engineSound:
      row.engineSoundPublished && row.engineSoundUrl
        ? {
            url: row.engineSoundUrl,
            peaks: parsePeaks(row.engineSoundPeaks),
            duration: row.engineSoundDuration ?? 0,
            format: row.engineSoundFormat ?? "mp3",
          }
        : null,
  };
}

function parsePeaks(json: string | null): number[] {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.map((n) => Number(n) || 0) : [];
  } catch {
    return [];
  }
}

export const getAllPublicVehicles = cache(async (): Promise<Vehicle[]> => {
  const rows = await prisma.vehicle.findMany({
    where: { status: { in: LISTING_STATUS } },
    orderBy: [{ featured: "desc" }, { createdAt: "desc" }],
    include: withImages,
  });
  return rows.map(toPublic);
});

export const getVehicleBySlug = cache(async (slug: string): Promise<Vehicle | null> => {
  const row = await prisma.vehicle.findFirst({
    where: { slug, status: { in: DETAIL_STATUS } },
    include: withImages,
  });
  return row ? toPublic(row) : null;
});

export const getFeaturedVehicles = cache(async (): Promise<Vehicle[]> => {
  const rows = await prisma.vehicle.findMany({
    where: { status: { in: LISTING_STATUS }, featured: true },
    orderBy: { createdAt: "desc" },
    include: withImages,
  });
  return rows.map(toPublic);
});

export const getRentalVehicles = cache(async (): Promise<Vehicle[]> => {
  const rows = await prisma.vehicle.findMany({
    where: { status: { in: LISTING_STATUS }, rentalPerDay: { not: null } },
    orderBy: { rentalPerDay: "asc" },
    include: withImages,
  });
  return rows.map(toPublic);
});

export const getPublicSlugs = cache(async (): Promise<string[]> => {
  const rows = await prisma.vehicle.findMany({
    where: { status: { in: DETAIL_STATUS } },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
});

export async function getSimilarVehicles(vehicle: Vehicle, count = 3): Promise<Vehicle[]> {
  const all = await getAllPublicVehicles();
  return all
    .filter((v) => v.id !== vehicle.id)
    .sort((a, b) => {
      const aSameBrand = a.brand === vehicle.brand ? -1 : 0;
      const bSameBrand = b.brand === vehicle.brand ? -1 : 0;
      return aSameBrand - bSameBrand || Math.abs(a.price - vehicle.price) - Math.abs(b.price - vehicle.price);
    })
    .slice(0, count);
}

/** Public routes that must be revalidated when vehicle data changes. */
export const PUBLIC_VEHICLE_ROUTES = ["/", "/avtomobili", "/pod-naem", "/kontakti"] as const;
