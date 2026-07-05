import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/admin/ratelimit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Soft cap to avoid abuse; excess is silently ignored.
  if (!rateLimit(`view:${ip}`, 120, 60 * 1000)) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  const slug = typeof body?.slug === "string" ? body.slug.slice(0, 160) : "";
  if (!slug) return NextResponse.json({ ok: false }, { status: 400 });

  await prisma.vehicleView.create({ data: { vehicleSlug: slug } });
  return NextResponse.json({ ok: true });
}
