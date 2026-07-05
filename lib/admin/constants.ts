// Single source of truth for admin enums + their Bulgarian labels.
// SQLite stores these as strings; this file keeps them type-safe and validated.

import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";

// ── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = [
  "super_admin",
  "owner",
  "sales_manager",
  "inventory_manager",
  "marketing_manager",
  "customer_support",
  "photographer",
  "content_editor",
  "accountant",
  "read_only",
] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  super_admin: "Супер админ",
  owner: "Собственик",
  sales_manager: "Мениджър продажби",
  inventory_manager: "Мениджър инвентар",
  marketing_manager: "Маркетинг мениджър",
  customer_support: "Клиентска поддръжка",
  photographer: "Фотограф",
  content_editor: "Редактор съдържание",
  accountant: "Счетоводител",
  read_only: "Само за четене",
};

// ── Vehicle status ───────────────────────────────────────────────────────────
export const VEHICLE_STATUSES = [
  "draft",
  "available",
  "reserved",
  "sold",
  "archived",
] as const;
export type VehicleStatus = (typeof VEHICLE_STATUSES)[number];

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  draft: "Чернова",
  available: "Наличен",
  reserved: "Резервиран",
  sold: "Продаден",
  archived: "Архивиран",
};

/** Tailwind classes for the status pill (matches the graphite/titanium theme). */
export const STATUS_STYLES: Record<VehicleStatus, string> = {
  draft: "bg-white/8 text-fg-muted border-line-strong",
  available: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  reserved: "bg-amber-500/12 text-amber-300 border-amber-500/25",
  sold: "bg-sky-500/12 text-sky-300 border-sky-500/25",
  archived: "bg-white/5 text-fg-subtle border-line",
};

// ── Other vehicle enums ──────────────────────────────────────────────────────
export const FUEL_TYPES = ["petrol", "diesel", "hybrid", "electric"] as const;
export const TRANSMISSIONS = ["manual", "automatic"] as const;
export const DRIVETRAINS = ["fwd", "rwd", "awd"] as const;
export const COLLECTIONS = ["performance", "executive", "signature"] as const;
export type Collection = (typeof COLLECTIONS)[number];

export const COLLECTION_LABELS: Record<Collection, string> = {
  performance: "Performance",
  executive: "Executive",
  signature: "Signature",
};

// Re-export the existing public-site label maps so the admin shares one vocabulary.
export { fuelLabels, transmissionLabels, drivetrainLabels };

export function isRole(value: string): value is Role {
  return (ROLES as readonly string[]).includes(value);
}
