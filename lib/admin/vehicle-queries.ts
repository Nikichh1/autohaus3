import { Prisma } from "@prisma/client";
import { VEHICLE_STATUSES, COLLECTIONS, FUEL_TYPES } from "./constants";

export const PAGE_SIZE = 12;

export type VehicleListParams = {
  q?: string;
  status?: string;
  collection?: string;
  fuelType?: string;
  featured?: string;
  sort?: string;
  page?: string;
};

const SORTS: Record<string, Prisma.VehicleOrderByWithRelationInput[]> = {
  updated: [{ updatedAt: "desc" }],
  newest: [{ createdAt: "desc" }],
  oldest: [{ createdAt: "asc" }],
  price_desc: [{ price: "desc" }],
  price_asc: [{ price: "asc" }],
  year_desc: [{ year: "desc" }],
  year_asc: [{ year: "asc" }],
};

export function buildVehicleQuery(params: VehicleListParams) {
  const where: Prisma.VehicleWhereInput = {};
  const and: Prisma.VehicleWhereInput[] = [];

  const q = params.q?.trim();
  if (q) {
    and.push({
      OR: [
        { brand: { contains: q } },
        { model: { contains: q } },
        { variant: { contains: q } },
        { vin: { contains: q } },
        { description: { contains: q } },
      ],
    });
  }

  if (params.status && (VEHICLE_STATUSES as readonly string[]).includes(params.status)) {
    and.push({ status: params.status });
  } else {
    // Default list hides archived unless explicitly requested.
    and.push({ status: { not: "archived" } });
  }

  if (params.collection && (COLLECTIONS as readonly string[]).includes(params.collection)) {
    and.push({ collection: params.collection });
  }
  if (params.fuelType && (FUEL_TYPES as readonly string[]).includes(params.fuelType)) {
    and.push({ fuelType: params.fuelType });
  }
  if (params.featured === "1") and.push({ featured: true });

  if (and.length) where.AND = and;

  const orderBy = SORTS[params.sort ?? "updated"] ?? SORTS.updated;
  const page = Math.max(1, Number(params.page) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  return { where, orderBy, page, skip, take: PAGE_SIZE };
}

export function parseFeatures(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}
