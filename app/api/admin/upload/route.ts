import { NextResponse, type NextRequest } from "next/server";
import { requirePermission } from "@/lib/admin/session";
import { saveImage } from "@/lib/admin/storage";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB per file

export async function POST(req: NextRequest) {
  try {
    await requirePermission("media.upload");
  } catch {
    return NextResponse.json({ error: "Нямате права за качване." }, { status: 403 });
  }

  const form = await req.formData();
  const vehicleId = form.get("vehicleId")?.toString();
  const files = form.getAll("files").filter((f): f is File => f instanceof File);

  if (!vehicleId) return NextResponse.json({ error: "Липсва vehicleId." }, { status: 400 });
  if (files.length === 0) return NextResponse.json({ error: "Няма избрани файлове." }, { status: 400 });

  const vehicle = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, _count: { select: { images: true } } },
  });
  if (!vehicle) return NextResponse.json({ error: "Автомобилът не е намерен." }, { status: 404 });

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: `Неподдържан формат: ${file.type || "?"}` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: `Файлът е твърде голям (макс. 20MB).` }, { status: 400 });
    }
  }

  // Position appends after existing images; first-ever image becomes primary.
  const last = await prisma.vehicleImage.findFirst({
    where: { vehicleId },
    orderBy: { position: "desc" },
    select: { position: true },
  });
  let position = (last?.position ?? -1) + 1;
  const hadNone = vehicle._count.images === 0;

  const created = [];
  for (let i = 0; i < files.length; i++) {
    const stored = await saveImage(files[i]);
    const image = await prisma.vehicleImage.create({
      data: {
        vehicleId,
        url: stored.url,
        width: stored.width,
        height: stored.height,
        position,
        isPrimary: hadNone && i === 0,
      },
    });
    created.push(image);
    position += 1;
  }

  await prisma.vehicle.update({ where: { id: vehicleId }, data: { updatedAt: new Date() } });
  revalidatePath(`/admin/vehicles/${vehicleId}`);
  revalidatePath("/avtomobili/[slug]", "page");
  revalidatePath("/avtomobili");
  revalidatePath("/");

  return NextResponse.json({ images: created });
}
