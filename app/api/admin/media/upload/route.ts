import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requirePermission } from "@/lib/admin/session";
import { saveImage } from "@/lib/admin/storage";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
const MAX_BYTES = 20 * 1024 * 1024;

function cleanFolder(v: string | undefined): string {
  const f = (v ?? "general").trim().toLowerCase().replace(/[^a-z0-9Ѐ-ӿ -]/g, "");
  return f || "general";
}

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requirePermission("media.upload");
  } catch {
    return NextResponse.json({ error: "Нямате права за качване." }, { status: 403 });
  }

  const form = await req.formData();
  const folder = cleanFolder(form.get("folder")?.toString());
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return NextResponse.json({ error: "Няма файлове." }, { status: 400 });

  for (const file of files) {
    if (!ALLOWED.includes(file.type)) {
      return NextResponse.json({ error: `Неподдържан формат: ${file.type || "?"}` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Файлът е твърде голям (макс. 20MB)." }, { status: 400 });
    }
  }

  const created = [];
  for (const file of files) {
    const stored = await saveImage(file, "media");
    const asset = await prisma.mediaAsset.create({
      data: {
        url: stored.url,
        originalName: file.name.slice(0, 200),
        mimeType: file.type,
        sizeBytes: stored.sizeBytes,
        width: stored.width,
        height: stored.height,
        folder,
        createdById: user.id,
      },
    });
    created.push(asset);
  }

  revalidatePath("/admin/media");
  return NextResponse.json({ assets: created });
}
