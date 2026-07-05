import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/admin/ratelimit";

export const runtime = "nodejs";

/** Records one site-wide page view. Privacy-friendly: no IP is stored — the
 *  client sends an ephemeral session id (sessionStorage) that approximates a
 *  visitor, plus the path, referrer host and device class. */
export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  // Soft cap to blunt abuse; excess is silently accepted-but-ignored.
  if (!rateLimit(`pv:${ip}`, 240, 60 * 1000)) return NextResponse.json({ ok: true });

  const body = await req.json().catch(() => null);
  const path = typeof body?.path === "string" ? body.path.slice(0, 300) : "";
  if (!path || !path.startsWith("/")) return NextResponse.json({ ok: false }, { status: 400 });
  const sessionId = typeof body?.sessionId === "string" ? body.sessionId.slice(0, 64) : "anon";
  const referrer = typeof body?.referrer === "string" && body.referrer ? body.referrer.slice(0, 120) : null;
  const device = body?.device === "mobile" || body?.device === "desktop" ? body.device : null;

  await prisma.pageView.create({ data: { path, sessionId, referrer, device } });
  return NextResponse.json({ ok: true });
}
