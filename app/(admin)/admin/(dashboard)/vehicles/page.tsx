import type { Metadata } from "next";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/db";
import { getSessionUser } from "@/lib/admin/session";
import { permissionsFor } from "@/lib/admin/rbac";
import { buildVehicleQuery, PAGE_SIZE, type VehicleListParams } from "@/lib/admin/vehicle-queries";
import { createDraftVehicle } from "@/lib/admin/vehicle-actions";
import { PageHeader } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { VehicleFilters } from "@/components/admin/vehicles/VehicleFilters";
import { VehicleTable, type VehicleRow } from "@/components/admin/vehicles/VehicleTable";
import { Pagination } from "@/components/admin/vehicles/Pagination";

export const metadata: Metadata = { title: "Автомобили" };
export const dynamic = "force-dynamic";

export default async function VehiclesPage({
  searchParams,
}: {
  searchParams: Promise<VehicleListParams>;
}) {
  const params = await searchParams;
  const user = await getSessionUser();
  const perms = permissionsFor(user?.role ?? "");

  const { where, orderBy, page, skip, take } = buildVehicleQuery(params);

  const [vehicles, total] = await prisma.$transaction([
    prisma.vehicle.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        images: { orderBy: [{ isPrimary: "desc" }, { position: "asc" }], take: 1 },
        _count: { select: { images: true } },
      },
    }),
    prisma.vehicle.count({ where }),
  ]);

  const rows: VehicleRow[] = vehicles.map((v) => ({
    id: v.id,
    brand: v.brand || "—",
    model: v.model,
    variant: v.variant,
    year: v.year,
    price: v.price,
    priceOnRequest: v.priceOnRequest,
    status: v.status,
    featured: v.featured,
    mileage: v.mileage,
    collection: v.collection,
    fuelType: v.fuelType,
    imageCount: v._count.images,
    imageUrl: v.images[0]?.url ?? null,
    updatedAt: v.updatedAt.toISOString(),
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <PageHeader
        title="Автомобили"
        description={`${total} ${total === 1 ? "автомобил" : "автомобила"} в инвентара`}
        actions={
          perms.includes("vehicle.create") ? (
            <form action={createDraftVehicle}>
              <Button type="submit" variant="primary" icon={<Plus className="size-4" />}>
                Нов автомобил
              </Button>
            </form>
          ) : null
        }
      />

      <VehicleFilters />

      <div className="mt-4">
        <VehicleTable rows={rows} permissions={perms} />
      </div>

      <Pagination page={page} totalPages={totalPages} total={total} params={params} />
    </div>
  );
}
