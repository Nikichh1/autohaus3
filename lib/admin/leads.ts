import { z } from "zod";

export const LEAD_STATUSES = ["new", "contacted", "qualified", "won", "lost", "spam"] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "Ново",
  contacted: "Свързан",
  qualified: "Квалифициран",
  won: "Спечелен",
  lost: "Загубен",
  spam: "Спам",
};

export const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  new: "bg-sky-500/12 text-sky-300 border-sky-500/25",
  contacted: "bg-amber-500/12 text-amber-300 border-amber-500/25",
  qualified: "bg-violet-500/12 text-violet-300 border-violet-500/25",
  won: "bg-emerald-500/12 text-emerald-300 border-emerald-500/25",
  lost: "bg-white/5 text-fg-subtle border-line",
  spam: "bg-red-500/10 text-red-300 border-red-500/25",
};

export const LEAD_SOURCES = ["contact_form", "vehicle_inquiry"] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export const LEAD_SOURCE_LABELS: Record<LeadSource, string> = {
  contact_form: "Форма за контакт",
  vehicle_inquiry: "Запитване за автомобил",
};

export function isLeadStatus(v: string): v is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(v);
}

/** Public lead-capture payload. `company` is a honeypot (must stay empty). */
export const leadCaptureSchema = z.object({
  name: z.string().trim().min(2, "Въведете име").max(120),
  email: z.union([z.string().trim().email().max(160), z.literal("")]).optional(),
  phone: z.union([z.string().trim().max(40), z.literal("")]).optional(),
  message: z.union([z.string().trim().max(4000), z.literal("")]).optional(),
  vehicleSlug: z.union([z.string().trim().max(160), z.literal("")]).optional(),
  vehicleLabel: z.union([z.string().trim().max(200), z.literal("")]).optional(),
  source: z.enum(LEAD_SOURCES).default("contact_form"),
  company: z.string().optional(), // honeypot
});

export type LeadCaptureInput = z.infer<typeof leadCaptureSchema>;
