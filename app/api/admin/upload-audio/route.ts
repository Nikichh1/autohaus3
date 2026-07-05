import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/session";
import { saveAudio, deleteUpload, audioFormatFor } from "@/lib/admin/storage";
import { prisma } from "@/lib/db";
import { PUBLIC_VEHICLE_ROUTES } from "@/lib/data/vehicles";

export const runtime = "nodejs";

const MAX_BYTES = 40 * 1024 * 1024; // 40 MB (wav can be large)

export async function POST(req: NextRequest) {
  try {
    await requirePermission("media.upload");
  } catch {
    return NextResponse.json({ error: "Нямате права за качване." }, { status: 403 });
  }

  const form = await req.formData();
  const vehicleId = form.get("vehicleId")?.toString();
  const file = form.get("file");
  const duration = Number(form.get("duration") ?? 0);

  if (!vehicleId) return NextResponse.json({ error: "Липсва vehicleId." }, { status: 400 });
  if (!(file instanceof File)) return NextResponse.json({ error: "Няма файл." }, { status: 400 });

  const format = audioFormatFor(file.type, file.name);
  if (!format) {
    return NextResponse.json({ error: "Поддържат се само MP3, WAV и M4A." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Файлът е твърде голям (макс. 40MB)." }, { status: 400 });
  }

  // Parse the browser-computed waveform peaks.
  let peaks: number[] = [];
  try {
    const raw = JSON.parse(form.get("peaks")?.toString() || "[]");
    if (Array.isArray(raw)) {
      peaks = raw.map((n) => Math.max(0, Math.min(1, Number(n) || 0))).slice(0, 400);
    }
  } catch {
    peaks = [];
  }

  const existing = await prisma.vehicle.findUnique({
    where: { id: vehicleId },
    select: { id: true, engineSoundUrl: true },
  });
  if (!existing) return NextResponse.json({ error: "Автомобилът не е намерен." }, { status: 404 });

  const stored = await saveAudio(file, format);

  // Remove the previous file when replacing.
  if (existing.engineSoundUrl && existing.engineSoundUrl !== stored.url) {
    await deleteUpload(existing.engineSoundUrl);
  }

  const updated = await prisma.vehicle.update({
    where: { id: vehicleId },
    data: {
      engineSoundUrl: stored.url,
      engineSoundName: file.name.slice(0, 120),
      engineSoundFormat: format,
      engineSoundDuration: Number.isFinite(duration) && duration > 0 ? duration : null,
      engineSoundSize: stored.sizeBytes,
      engineSoundPeaks: JSON.stringify(peaks),
      engineSoundUpdatedAt: new Date(),
    },
    select: {
      engineSoundUrl: true,
      engineSoundName: true,
      engineSoundFormat: true,
      engineSoundDuration: true,
      engineSoundSize: true,
      engineSoundPeaks: true,
      engineSoundPublished: true,
    },
  });

  revalidatePath(`/admin/vehicles/${vehicleId}`);
  for (const route of PUBLIC_VEHICLE_ROUTES) revalidatePath(route);
  revalidatePath("/avtomobili/[slug]", "page");

  return NextResponse.json({ sound: updated });
}
