import type {
  Vehicle,
  FuelType,
  Transmission,
  Drivetrain,
  Collection,
} from "@/types";

export type Filters = {
  collection?: Collection;
  rentalOnly?: boolean;
  brands: string[];
  bodyTypes: string[];
  fuels: FuelType[];
  transmissions: Transmission[];
  drivetrains: Drivetrain[];
  yearMin?: number;
  yearMax?: number;
  priceMin?: number;
  priceMax?: number;
  mileageMax?: number;
};

export type SortKey =
  | "newest"
  | "price_asc"
  | "price_desc"
  | "mileage_asc";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "newest", label: "Най-нови първо" },
  { value: "price_asc", label: "Цена ↑" },
  { value: "price_desc", label: "Цена ↓" },
  { value: "mileage_asc", label: "Километри ↑" },
];

export const emptyFilters: Filters = {
  brands: [],
  bodyTypes: [],
  fuels: [],
  transmissions: [],
  drivetrains: [],
};

export function parseFiltersFromParams(
  params: URLSearchParams,
): Filters {
  return {
    collection: (params.get("collection") as Collection) || undefined,
    rentalOnly: params.get("rent") === "1" || undefined,
    brands: splitParam(params.get("brand")),
    bodyTypes: splitParam(params.get("body")),
    fuels: splitParam(params.get("fuel")) as FuelType[],
    transmissions: splitParam(params.get("trans")) as Transmission[],
    drivetrains: splitParam(params.get("drive")) as Drivetrain[],
    yearMin: numParam(params.get("year_min")),
    yearMax: numParam(params.get("year_max")),
    priceMin: numParam(params.get("price_min")),
    priceMax: numParam(params.get("price_max")),
    mileageMax: numParam(params.get("mileage_max")),
  };
}

export function serializeFilters(
  f: Filters,
  sort: SortKey | undefined,
): URLSearchParams {
  const params = new URLSearchParams();
  if (f.collection) params.set("collection", f.collection);
  if (f.rentalOnly) params.set("rent", "1");
  if (f.brands.length) params.set("brand", f.brands.join(","));
  if (f.bodyTypes.length) params.set("body", f.bodyTypes.join(","));
  if (f.fuels.length) params.set("fuel", f.fuels.join(","));
  if (f.transmissions.length) params.set("trans", f.transmissions.join(","));
  if (f.drivetrains.length) params.set("drive", f.drivetrains.join(","));
  if (f.yearMin !== undefined) params.set("year_min", String(f.yearMin));
  if (f.yearMax !== undefined) params.set("year_max", String(f.yearMax));
  if (f.priceMin !== undefined) params.set("price_min", String(f.priceMin));
  if (f.priceMax !== undefined) params.set("price_max", String(f.priceMax));
  if (f.mileageMax !== undefined) params.set("mileage_max", String(f.mileageMax));
  if (sort && sort !== "newest") params.set("sort", sort);
  return params;
}

export function applyFilters(vehicles: Vehicle[], f: Filters): Vehicle[] {
  return vehicles.filter(
    (v) =>
      (!f.collection || v.collection === f.collection) &&
      (!f.rentalOnly || v.rentalPerDay !== undefined) &&
      (!f.brands.length || f.brands.includes(v.brand)) &&
      (!f.bodyTypes.length || f.bodyTypes.includes(v.bodyType)) &&
      (!f.fuels.length || f.fuels.includes(v.fuelType)) &&
      (!f.transmissions.length || f.transmissions.includes(v.transmission)) &&
      (!f.drivetrains.length || f.drivetrains.includes(v.drivetrain)) &&
      (f.yearMin === undefined || v.year >= f.yearMin) &&
      (f.yearMax === undefined || v.year <= f.yearMax) &&
      (f.priceMin === undefined || v.price >= f.priceMin) &&
      (f.priceMax === undefined || v.price <= f.priceMax) &&
      (f.mileageMax === undefined || v.mileage <= f.mileageMax),
  );
}

export function sortVehicles(
  vehicles: Vehicle[],
  sort: SortKey,
): Vehicle[] {
  const sorted = [...vehicles];
  switch (sort) {
    case "newest":
      return sorted.sort((a, b) => b.year - a.year || a.mileage - b.mileage);
    case "price_asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price_desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "mileage_asc":
      return sorted.sort((a, b) => a.mileage - b.mileage);
    default:
      return sorted;
  }
}

export function activeFilterCount(f: Filters): number {
  return (
    (f.rentalOnly ? 1 : 0) +
    f.brands.length +
    f.bodyTypes.length +
    f.fuels.length +
    f.transmissions.length +
    f.drivetrains.length +
    (f.yearMin !== undefined ? 1 : 0) +
    (f.yearMax !== undefined ? 1 : 0) +
    (f.priceMin !== undefined ? 1 : 0) +
    (f.priceMax !== undefined ? 1 : 0) +
    (f.mileageMax !== undefined ? 1 : 0)
  );
}

function splitParam(v: string | null): string[] {
  if (!v) return [];
  return v.split(",").filter(Boolean);
}

function numParam(v: string | null): number | undefined {
  if (!v) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}
