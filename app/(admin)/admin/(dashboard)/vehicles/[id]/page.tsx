import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/admin/session";
import { permissionsFor } from "@/lib/admin/rbac";
import { parseFeatures } from "@/lib/admin/vehicle-queries";
import { VehicleEditor, type EditorVehicle } from "@/components/admin/vehicles/VehicleEditor";

export const dynamic = "force-dynamic";

const s = (n: number | null | undefined) => (n == null ? "" : String(n));

export default async function EditVehiclePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getSessionUser();
  const permissions = permissionsFor(user?.role ?? "");

  const v = await prisma.vehicle.findUnique({
    where: { id },
    include: { images: { orderBy: { position: "asc" } } },
  });
  if (!v) notFound();

  const vehicle: EditorVehicle = {
    id: v.id,
    slug: v.slug,
    status: v.status,
    brand: v.brand,
    model: v.model,
    variant: v.variant ?? "",
    year: String(v.year),
    bodyType: v.bodyType,
    collection: v.collection,
    featured: v.featured,
    fuelType: v.fuelType,
    transmission: v.transmission,
    drivetrain: v.drivetrain,
    price: String(v.price),
    priceOnRequest: v.priceOnRequest,
    rentalPerDay: s(v.rentalPerDay),
    mileage: String(v.mileage),
    power: String(v.power),
    torque: s(v.torque),
    engineCC: s(v.engineCC),
    acceleration: s(v.acceleration),
    topSpeed: s(v.topSpeed),
    doors: s(v.doors),
    seats: s(v.seats),
    exteriorColor: v.exteriorColor ?? "",
    interiorColor: v.interiorColor ?? "",
    vin: v.vin ?? "",
    features: parseFeatures(v.features),
    description: v.description,
    internalNotes: v.internalNotes ?? "",
  };

  const images = v.images.map((i) => ({ id: i.id, url: i.url, isPrimary: i.isPrimary }));

  const sound = v.engineSoundUrl
    ? {
        url: v.engineSoundUrl,
        name: v.engineSoundName,
        format: v.engineSoundFormat,
        duration: v.engineSoundDuration,
        size: v.engineSoundSize,
        peaks: v.engineSoundPeaks ? (JSON.parse(v.engineSoundPeaks) as number[]) : [],
        published: v.engineSoundPublished,
      }
    : null;

  return <VehicleEditor vehicle={vehicle} images={images} sound={sound} permissions={permissions} />;
}
