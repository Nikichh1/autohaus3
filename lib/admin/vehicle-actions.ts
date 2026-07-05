"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/admin/session";
import { hasPermission, type Permission } from "@/lib/admin/rbac";
import { uniqueVehicleSlug } from "@/lib/admin/slug";
import { deleteImage as deleteStoredImage, deleteUpload } from "@/lib/admin/storage";
import { vehicleFormSchema } from "@/lib/admin/vehicle-schema";
import type { VehicleStatus } from "@/lib/admin/constants";
import { PUBLIC_VEHICLE_ROUTES } from "@/lib/data/vehicles";
import { writeAudit } from "@/lib/admin/audit";
import { STATUS_LABELS } from "@/lib/admin/constants";

export type ActionResult = { ok: true; id?: string } | { ok: false; error: string };

/** Refresh both the admin views and the public website after any vehicle change. */
function revalidate(id?: string) {
  // Admin
  revalidatePath("/admin/vehicles");
  revalidatePath("/admin");
  if (id) revalidatePath(`/admin/vehicles/${id}`);

  // Public website — regenerate every route that reads vehicle data.
  for (const route of PUBLIC_VEHICLE_ROUTES) revalidatePath(route);
  revalidatePath("/avtomobili/[slug]", "page");
  revalidatePath("/sitemap.xml");
}

/** Unlink files that are no longer referenced by any VehicleImage row. */
async function gcImageFiles(urls: string[]) {
  for (const url of urls) {
    const stillUsed = await prisma.vehicleImage.count({ where: { url } });
    if (stillUsed === 0) await deleteStoredImage(url);
  }
}

// ── Create ───────────────────────────────────────────────────────────────────
export async function createDraftVehicle() {
  const user = await requirePermission("vehicle.create");

  // Reuse an existing untouched blank draft by this user (avoids clutter from
  // repeated "New vehicle" clicks).
  const blank = await prisma.vehicle.findFirst({
    where: { createdById: user.id, status: "draft", brand: "", model: "" },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (blank) redirect(`/admin/vehicles/${blank.id}`);

  const slug = await uniqueVehicleSlug(`chernova-${Date.now()}`);
  const vehicle = await prisma.vehicle.create({
    data: {
      slug,
      status: "draft",
      brand: "",
      model: "",
      year: new Date().getFullYear(),
      createdById: user.id,
    },
    select: { id: true },
  });
  revalidate();
  redirect(`/admin/vehicles/${vehicle.id}`);
}

// ── Update (full form save) ───────────────────────────────────────────────────
export async function saveVehicle(id: string, raw: unknown): Promise<ActionResult> {
  try {
    const user = await requirePermission("vehicle.update");

    const parsed = vehicleFormSchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, error: parsed.error.issues[0]?.message ?? "Невалидни данни." };
    }
    const v = parsed.data;

    const current = await prisma.vehicle.findUnique({
      where: { id },
      select: { status: true, slug: true, brand: true, model: true, variant: true, year: true },
    });
    if (!current) return { ok: false, error: "Автомобилът не е намерен." };

    // Permission guards on status transitions.
    if (v.status !== current.status) {
      if (
        (v.status === "available" || current.status === "available") &&
        !hasPermission(user.role, "vehicle.publish")
      ) {
        return { ok: false, error: "Нямате права да публикувате/скривате." };
      }
      if (v.status === "archived" && !hasPermission(user.role, "vehicle.archive")) {
        return { ok: false, error: "Нямате права да архивирате." };
      }
    }
    if (v.featured && !hasPermission(user.role, "vehicle.feature")) {
      // Silently ignore featuring if not permitted, rather than failing the save.
      v.featured = false;
    }

    // Regenerate slug if the identity fields changed.
    let slug = current.slug;
    const identityChanged =
      v.brand !== current.brand ||
      v.model !== current.model ||
      (v.variant ?? "") !== (current.variant ?? "") ||
      v.year !== current.year;
    if (identityChanged && v.brand && v.model) {
      slug = await uniqueVehicleSlug(`${v.brand}-${v.model}-${v.variant ?? ""}-${v.year}`, id);
    }

    const wasPublished = current.status === "available";
    const nowPublished = v.status === "available";

    await prisma.vehicle.update({
      where: { id },
      data: {
        slug,
        brand: v.brand,
        model: v.model,
        variant: v.variant,
        year: v.year,
        bodyType: v.bodyType,
        collection: v.collection,
        status: v.status,
        featured: v.featured,
        fuelType: v.fuelType,
        transmission: v.transmission,
        drivetrain: v.drivetrain,
        price: v.price,
        priceOnRequest: v.priceOnRequest,
        rentalPerDay: v.rentalPerDay,
        mileage: v.mileage,
        power: v.power,
        torque: v.torque,
        engineCC: v.engineCC,
        acceleration: v.acceleration,
        topSpeed: v.topSpeed,
        doors: v.doors,
        seats: v.seats,
        exteriorColor: v.exteriorColor,
        interiorColor: v.interiorColor,
        vin: v.vin,
        features: JSON.stringify(v.features),
        description: v.description,
        internalNotes: v.internalNotes,
        publishedAt: nowPublished && !wasPublished ? new Date() : undefined,
        soldAt: v.status === "sold" ? new Date() : null,
        archivedAt: v.status === "archived" ? new Date() : null,
      },
    });

    await writeAudit({
      actor: user,
      action: "vehicle.update",
      entityType: "vehicle",
      entityId: id,
      summary: `Обнови „${v.brand} ${v.model}" (${STATUS_LABELS[v.status]})`,
    });
    revalidate(id);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка при запис." };
  }
}

// ── Status quick-actions ──────────────────────────────────────────────────────
const STATUS_PERMISSION: Record<VehicleStatus, Permission> = {
  draft: "vehicle.publish",
  available: "vehicle.publish",
  reserved: "vehicle.update",
  sold: "vehicle.update",
  archived: "vehicle.archive",
};

export async function setVehicleStatus(id: string, status: VehicleStatus): Promise<ActionResult> {
  try {
    const user = await requirePermission(STATUS_PERMISSION[status]);
    const v = await prisma.vehicle.update({
      where: { id },
      data: {
        status,
        publishedAt: status === "available" ? new Date() : undefined,
        soldAt: status === "sold" ? new Date() : null,
        reservedUntil: status === "reserved" ? new Date(Date.now() + 7 * 864e5) : null,
        archivedAt: status === "archived" ? new Date() : null,
      },
      select: { brand: true, model: true },
    });
    await writeAudit({
      actor: user,
      action: "vehicle.status",
      entityType: "vehicle",
      entityId: id,
      summary: `„${v.brand} ${v.model}" → ${STATUS_LABELS[status]}`,
    });
    revalidate(id);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function toggleFeatured(id: string, featured: boolean): Promise<ActionResult> {
  try {
    await requirePermission("vehicle.feature");
    await prisma.vehicle.update({ where: { id }, data: { featured } });
    revalidate(id);
    return { ok: true, id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

// ── Duplicate ─────────────────────────────────────────────────────────────────
export async function duplicateVehicle(id: string) {
  const user = await requirePermission("vehicle.duplicate");
  const source = await prisma.vehicle.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!source) redirect("/admin/vehicles");

  const slug = await uniqueVehicleSlug(`${source.brand}-${source.model}-kopie`);
  const copy = await prisma.vehicle.create({
    data: {
      slug,
      status: "draft",
      featured: false,
      brand: source.brand,
      model: source.model,
      variant: source.variant,
      year: source.year,
      bodyType: source.bodyType,
      collection: source.collection,
      fuelType: source.fuelType,
      transmission: source.transmission,
      drivetrain: source.drivetrain,
      price: source.price,
      priceOnRequest: source.priceOnRequest,
      rentalPerDay: source.rentalPerDay,
      mileage: source.mileage,
      power: source.power,
      torque: source.torque,
      engineCC: source.engineCC,
      acceleration: source.acceleration,
      topSpeed: source.topSpeed,
      doors: source.doors,
      seats: source.seats,
      exteriorColor: source.exteriorColor,
      interiorColor: source.interiorColor,
      vin: null,
      features: source.features,
      description: source.description,
      internalNotes: source.internalNotes,
      createdById: user.id,
      images: {
        create: source.images.map((img) => ({
          url: img.url,
          position: img.position,
          isPrimary: img.isPrimary,
          width: img.width,
          height: img.height,
          alt: img.alt,
        })),
      },
    },
    select: { id: true },
  });
  revalidate();
  redirect(`/admin/vehicles/${copy.id}`);
}

// ── Delete ────────────────────────────────────────────────────────────────────
export async function deleteVehicle(id: string): Promise<ActionResult> {
  try {
    const user = await requirePermission("vehicle.delete");
    const v = await prisma.vehicle.findUnique({ where: { id }, select: { brand: true, model: true } });
    const images = await prisma.vehicleImage.findMany({ where: { vehicleId: id }, select: { url: true } });
    await prisma.vehicle.delete({ where: { id } }); // cascades image rows
    await gcImageFiles(images.map((i) => i.url));
    await writeAudit({
      actor: user,
      action: "vehicle.delete",
      entityType: "vehicle",
      entityId: id,
      summary: `Изтри „${v?.brand ?? ""} ${v?.model ?? ""}"`.trim(),
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка при изтриване." };
  }
}

// ── Bulk operations ───────────────────────────────────────────────────────────
export async function bulkSetStatus(ids: string[], status: VehicleStatus): Promise<ActionResult> {
  try {
    await requirePermission(STATUS_PERMISSION[status]);
    if (!ids.length) return { ok: false, error: "Няма избрани." };
    await prisma.vehicle.updateMany({
      where: { id: { in: ids } },
      data: {
        status,
        ...(status === "available" ? { publishedAt: new Date() } : {}),
        ...(status === "sold" ? { soldAt: new Date() } : {}),
        ...(status === "archived" ? { archivedAt: new Date() } : {}),
      },
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function bulkSetFeatured(ids: string[], featured: boolean): Promise<ActionResult> {
  try {
    await requirePermission("vehicle.feature");
    await prisma.vehicle.updateMany({ where: { id: { in: ids } }, data: { featured } });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function bulkDelete(ids: string[]): Promise<ActionResult> {
  try {
    const user = await requirePermission("vehicle.delete");
    if (!ids.length) return { ok: false, error: "Няма избрани." };
    const images = await prisma.vehicleImage.findMany({
      where: { vehicleId: { in: ids } },
      select: { url: true },
    });
    await prisma.vehicle.deleteMany({ where: { id: { in: ids } } });
    await gcImageFiles([...new Set(images.map((i) => i.url))]);
    await writeAudit({
      actor: user,
      action: "vehicle.bulk_delete",
      entityType: "vehicle",
      summary: `Изтри ${ids.length} автомобила (групово)`,
    });
    revalidate();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

// ── Image management ──────────────────────────────────────────────────────────
export async function reorderImages(vehicleId: string, orderedIds: string[]): Promise<ActionResult> {
  try {
    await requirePermission("media.upload");
    await prisma.$transaction(
      orderedIds.map((imgId, index) =>
        prisma.vehicleImage.update({ where: { id: imgId }, data: { position: index } })
      )
    );
    revalidate(vehicleId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function deleteVehicleImage(imageId: string): Promise<ActionResult> {
  try {
    await requirePermission("media.upload");
    const img = await prisma.vehicleImage.findUnique({ where: { id: imageId } });
    if (!img) return { ok: false, error: "Снимката не е намерена." };
    await prisma.vehicleImage.delete({ where: { id: imageId } });
    // Promote a new primary if we removed the primary one.
    if (img.isPrimary) {
      const next = await prisma.vehicleImage.findFirst({
        where: { vehicleId: img.vehicleId },
        orderBy: { position: "asc" },
      });
      if (next) await prisma.vehicleImage.update({ where: { id: next.id }, data: { isPrimary: true } });
    }
    await gcImageFiles([img.url]);
    revalidate(img.vehicleId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function setPrimaryImage(imageId: string): Promise<ActionResult> {
  try {
    await requirePermission("media.upload");
    const img = await prisma.vehicleImage.findUnique({ where: { id: imageId }, select: { vehicleId: true } });
    if (!img) return { ok: false, error: "Снимката не е намерена." };
    await prisma.$transaction([
      prisma.vehicleImage.updateMany({ where: { vehicleId: img.vehicleId }, data: { isPrimary: false } }),
      prisma.vehicleImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
    ]);
    revalidate(img.vehicleId);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

// ── Engine sound ──────────────────────────────────────────────────────────────
export async function setEngineSoundPublished(id: string, published: boolean): Promise<ActionResult> {
  try {
    await requirePermission("vehicle.update");
    const v = await prisma.vehicle.findUnique({ where: { id }, select: { engineSoundUrl: true } });
    if (!v?.engineSoundUrl) return { ok: false, error: "Няма качен звук за публикуване." };
    await prisma.vehicle.update({ where: { id }, data: { engineSoundPublished: published } });
    revalidate(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}

export async function deleteEngineSound(id: string): Promise<ActionResult> {
  try {
    await requirePermission("media.upload");
    const v = await prisma.vehicle.findUnique({ where: { id }, select: { engineSoundUrl: true } });
    if (v?.engineSoundUrl) await deleteUpload(v.engineSoundUrl);
    await prisma.vehicle.update({
      where: { id },
      data: {
        engineSoundUrl: null,
        engineSoundName: null,
        engineSoundFormat: null,
        engineSoundDuration: null,
        engineSoundSize: null,
        engineSoundPeaks: null,
        engineSoundPublished: false,
        engineSoundUpdatedAt: new Date(),
      },
    });
    revalidate(id);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Грешка." };
  }
}
