import { z } from "zod";

// Editable site settings. Defaults mirror the current static values in lib/nav.ts,
// so nothing changes visually until an admin edits them.

export const contactSchema = z.object({
  company: z.string().trim().max(120).default(""),
  phone: z.string().trim().max(40).default(""),
  email: z.string().trim().max(120).default(""),
  eik: z.string().trim().max(40).default(""),
  vat: z.string().trim().max(40).default(""),
  street: z.string().trim().max(160).default(""),
  area: z.string().trim().max(120).default(""),
  city: z.string().trim().max(80).default(""),
  postcode: z.string().trim().max(20).default(""),
  country: z.string().trim().max(80).default(""),
});

export const socialSchema = z.object({
  facebook: z.string().trim().max(200).default(""),
  instagram: z.string().trim().max(200).default(""),
  youtube: z.string().trim().max(200).default(""),
});

export const hoursSchema = z.object({
  items: z
    .array(
      z.object({
        days: z.string().trim().max(80).default(""),
        time: z.string().trim().max(80).default(""),
      }),
    )
    .max(12)
    .default([]),
});

export const brandingSchema = z.object({
  siteName: z.string().trim().max(80).default("AutoHaus"),
  tagline: z.string().trim().max(400).default(""),
});

/** Loan terms (months) offered by the public financing calculator. */
export const FINANCING_TERMS = [12, 24, 36, 48, 60, 72, 84] as const;

// Drives the public FinancingCalculator AND the indicative monthly teaser on each
// product page. Editing the rate here updates every price estimate site-wide — the
// figures are indicative only, never a binding offer.
export const financingSchema = z.object({
  annualRatePct: z.coerce.number().min(0).max(100).default(6.9),
  downPaymentPct: z.coerce.number().int().min(0).max(90).default(20),
  termMonths: z.coerce.number().int().min(6).max(120).default(60),
});

export const SETTINGS_SCHEMAS = {
  contact: contactSchema,
  social: socialSchema,
  hours: hoursSchema,
  branding: brandingSchema,
  financing: financingSchema,
} as const;

export type SettingsGroup = keyof typeof SETTINGS_SCHEMAS;
export const SETTINGS_GROUPS = Object.keys(SETTINGS_SCHEMAS) as SettingsGroup[];

export type ContactSettings = z.infer<typeof contactSchema>;
export type SocialSettings = z.infer<typeof socialSchema>;
export type HoursSettings = z.infer<typeof hoursSchema>;
export type BrandingSettings = z.infer<typeof brandingSchema>;
export type FinancingSettings = z.infer<typeof financingSchema>;

export type SiteSettings = {
  contact: ContactSettings;
  social: SocialSettings;
  hours: HoursSettings;
  branding: BrandingSettings;
  financing: FinancingSettings;
};

export const DEFAULT_SETTINGS: SiteSettings = {
  contact: {
    company: "Аутохаус България ЕООД",
    phone: "+359 884 777 147",
    email: "autohausbg@gmail.com",
    eik: "200771286",
    vat: "BG200771286",
    street: "ул. „Нестор Абаджиев“ №24",
    area: "Асеновградско шосе",
    city: "Пловдив",
    postcode: "4023",
    country: "България",
  },
  social: {
    facebook: "https://facebook.com/autohaus.bg",
    instagram: "https://instagram.com/autohaus.bg",
    youtube: "",
  },
  hours: {
    items: [
      { days: "Понеделник – Петък", time: "09:00 – 18:00" },
      { days: "Auto Spa / Кафе бар", time: "Всеки ден 08:00 – 20:00" },
    ],
  },
  branding: {
    siteName: "AutoHaus",
    tagline:
      "Премиум автомобили, лизинг, застраховки и сервиз — събрани под един покрив в Пловдив.",
  },
  financing: {
    annualRatePct: 6.9,
    downPaymentPct: 20,
    termMonths: 60,
  },
};

export const SETTINGS_LABELS: Record<SettingsGroup, string> = {
  contact: "Контактна информация",
  hours: "Работно време",
  social: "Социални мрежи",
  branding: "Брандинг",
  financing: "Лизинг и финансиране",
};
