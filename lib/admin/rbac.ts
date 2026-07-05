import type { Role } from "./constants";

/**
 * Permission keys are `resource.action`. Code checks permissions, never role names,
 * so roles stay tunable. `super_admin` implicitly has every permission.
 */
export type Permission =
  | "dashboard.view"
  | "vehicle.view"
  | "vehicle.create"
  | "vehicle.update"
  | "vehicle.set_price"
  | "vehicle.publish"
  | "vehicle.feature"
  | "vehicle.archive"
  | "vehicle.delete"
  | "vehicle.duplicate"
  | "vehicle.bulk"
  | "media.upload"
  | "cms.view"
  | "cms.update"
  | "lead.view"
  | "lead.update"
  | "lead.delete"
  | "analytics.view"
  | "audit.view"
  | "user.manage"
  | "settings.manage"
  | "backup.manage";

const ALL: Permission[] = [
  "dashboard.view",
  "vehicle.view",
  "vehicle.create",
  "vehicle.update",
  "vehicle.set_price",
  "vehicle.publish",
  "vehicle.feature",
  "vehicle.archive",
  "vehicle.delete",
  "vehicle.duplicate",
  "vehicle.bulk",
  "media.upload",
  "cms.view",
  "cms.update",
  "lead.view",
  "lead.update",
  "lead.delete",
  "analytics.view",
  "audit.view",
  "user.manage",
  "settings.manage",
  "backup.manage",
];

const VIEW_ONLY: Permission[] = ["dashboard.view", "vehicle.view"];

const FULL_VEHICLE: Permission[] = [
  "dashboard.view",
  "vehicle.view",
  "vehicle.create",
  "vehicle.update",
  "vehicle.set_price",
  "vehicle.publish",
  "vehicle.feature",
  "vehicle.archive",
  "vehicle.delete",
  "vehicle.duplicate",
  "vehicle.bulk",
  "media.upload",
];

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  owner: ALL,
  sales_manager: [...FULL_VEHICLE, "lead.view", "lead.update", "lead.delete", "analytics.view"],
  inventory_manager: [
    "dashboard.view",
    "vehicle.view",
    "vehicle.create",
    "vehicle.update",
    "vehicle.set_price",
    "vehicle.archive",
    "vehicle.duplicate",
    "vehicle.bulk",
    "media.upload",
    "analytics.view",
  ],
  marketing_manager: [
    "dashboard.view",
    "vehicle.view",
    "vehicle.publish",
    "vehicle.feature",
    "media.upload",
    "cms.view",
    "cms.update",
    "analytics.view",
  ],
  customer_support: ["dashboard.view", "vehicle.view", "lead.view", "lead.update"],
  photographer: ["dashboard.view", "vehicle.view", "media.upload"],
  content_editor: ["dashboard.view", "vehicle.view", "vehicle.update", "cms.view", "cms.update"],
  accountant: ["dashboard.view", "vehicle.view", "analytics.view"],
  read_only: VIEW_ONLY,
};

export function hasPermission(role: string, permission: Permission): boolean {
  if (role === "super_admin") return true;
  const perms = ROLE_PERMISSIONS[role as Role];
  return perms ? perms.includes(permission) : false;
}

/** True if a role may enter the admin at all (i.e. has any permission). */
export function canAccessAdmin(role: string): boolean {
  return role === "super_admin" || Boolean(ROLE_PERMISSIONS[role as Role]?.length);
}

export function permissionsFor(role: string): Permission[] {
  if (role === "super_admin") return ALL;
  return ROLE_PERMISSIONS[role as Role] ?? [];
}
