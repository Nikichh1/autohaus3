import { NextResponse, type NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { leadCaptureSchema } from "@/lib/admin/leads";
import { rateLimit } from "@/lib/admin/ratelimit";
import { notifyByPermission } from "@/lib/admin/notify";

export const runtime = "nodejs";

function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);

  // 5 submissions / 10 min / IP.
  if (!rateLimit(`lead:${ip}`, 5, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Твърде много заявки. Опитайте отново по-късно." },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Невалидна заявка." }, { status: 400 });
  }

  const parsed = leadCaptureSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Невалидни данни." },
      { status: 400 },
    );
  }
  const data = parsed.data;

  // Honeypot — silently accept bots without storing anything.
  if (data.company && data.company.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  // Require at least one way to reach the customer.
  if (!data.email && !data.phone) {
    return NextResponse.json(
      { error: "Посочете имейл или телефон." },
      { status: 400 },
    );
  }

  const lead = await prisma.lead.create({
    data: {
      name: data.name,
      email: data.email || null,
      phone: data.phone || null,
      message: data.message || null,
      vehicleSlug: data.vehicleSlug || null,
      vehicleLabel: data.vehicleLabel || null,
      source: data.source,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
      activities: { create: { type: "created", body: "Запитване получено от сайта" } },
    },
    select: { id: true },
  });

  await notifyByPermission("lead.view", {
    type: "lead.new",
    title: `Ново запитване от ${data.name}`,
    body: data.vehicleLabel || data.message?.slice(0, 90) || undefined,
    link: `/admin/leads/${lead.id}`,
  });

  revalidatePath("/admin/leads");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}
