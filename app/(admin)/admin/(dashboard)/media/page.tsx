import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { prisma } from "@/lib/db";
import { Prisma } from "@prisma/client";
import { requireUser } from "@/lib/admin/session";
import { hasPermission } from "@/lib/admin/rbac";
import { PageHeader, Card } from "@/components/admin/ui/card";
import { MediaLibrary, type MediaItem } from "@/components/admin/media/MediaLibrary";

export const metadata: Metadata = { title: "Медия" };
export const dynamic = "force-dynamic";

function parseTags(json: string): string[] {
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default async function MediaPage({
  searchParams,
}: {
  searchParams: Promise<{ folder?: string; q?: string }>;
}) {
  const user = await requireUser();
  if (!hasPermission(user.role, "media.upload")) {
    return (
      <div>
        <PageHeader title="Медия" />
        <Card className="flex flex-col items-center gap-3 px-6 py-16 text-center">
          <Lock className="size-8 text-fg-subtle" />
          <p className="text-sm text-fg-muted">Нямате достъп до медийната библиотека.</p>
        </Card>
      </div>
    );
  }

  const sp = await searchParams;
  const folder = sp.folder?.trim() ?? "";
  const q = sp.q?.trim() ?? "";

  const grouped = await prisma.mediaAsset.groupBy({ by: ["folder"], _count: { folder: true } });
  const folders = grouped.map((g) => g.folder).sort();

  const where: Prisma.MediaAssetWhereInput = {};
  const and: Prisma.MediaAssetWhereInput[] = [];
  if (folder) and.push({ folder });
  if (q)
    and.push({
      OR: [{ originalName: { contains: q } }, { alt: { contains: q } }, { tags: { contains: q } }],
    });
  if (and.length) where.AND = and;

  const assets = await prisma.mediaAsset.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 160,
  });

  const items: MediaItem[] = assets.map((a) => ({
    id: a.id,
    url: a.url,
    originalName: a.originalName,
    folder: a.folder,
    tags: parseTags(a.tags),
    alt: a.alt,
    width: a.width,
    height: a.height,
    sizeBytes: a.sizeBytes,
  }));

  return (
    <div>
      <PageHeader
        title="Медийна библиотека"
        description={`${items.length} файла${folder ? ` · папка „${folder}"` : ""}`}
      />
      <MediaLibrary items={items} folders={folders} currentFolder={folder} q={q} />
    </div>
  );
}
