"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Save } from "lucide-react";
import { Card } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Field, Input, Select, Textarea } from "@/components/admin/ui/input";
import { toast } from "@/components/admin/ui/toast";
import { updateSettings } from "@/lib/settings/actions";
import { FINANCING_TERMS } from "@/lib/settings/config";
import type {
  SiteSettings,
  ContactSettings,
  SocialSettings,
  HoursSettings,
  BrandingSettings,
  FinancingSettings,
  SettingsGroup,
} from "@/lib/settings/config";

function Section({
  title,
  description,
  group,
  data,
  children,
}: {
  title: string;
  description?: string;
  group: SettingsGroup;
  data: unknown;
  children: React.ReactNode;
}) {
  const [saving, start] = useTransition();
  function save() {
    start(async () => {
      const res = await updateSettings(group, data);
      if (res.ok) toast("Запазено");
      else toast(res.error, "error");
    });
  }
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-fg">{title}</h2>
          {description ? <p className="mt-1 text-xs text-fg-muted">{description}</p> : null}
        </div>
        <Button variant="primary" size="sm" icon={<Save className="size-4" />} loading={saving} onClick={save}>
          Запази
        </Button>
      </div>
      {children}
    </Card>
  );
}

export function SettingsForms({ initial }: { initial: SiteSettings }) {
  return (
    <div className="flex flex-col gap-6">
      <ContactSection initial={initial.contact} />
      <HoursSection initial={initial.hours} />
      <SocialSection initial={initial.social} />
      <BrandingSection initial={initial.branding} />
      <FinancingSection initial={initial.financing} />
    </div>
  );
}

function FinancingSection({ initial }: { initial: FinancingSettings }) {
  // Kept as strings while editing so the inputs stay controlled and empty states
  // don't flash NaN; the server schema coerces back to numbers on save.
  const [f, setF] = useState({
    annualRatePct: String(initial.annualRatePct),
    downPaymentPct: String(initial.downPaymentPct),
    termMonths: String(initial.termMonths),
  });
  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Section
      title="Лизинг и финансиране"
      description="Управлява публичния калкулатор за лизинг и ориентировъчната месечна вноска на всяка продуктова страница. Стойностите са примерни, не са обвързваща оферта."
      group="financing"
      data={f}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Годишна лихва (%)">
          <Input
            type="number"
            step="0.1"
            min="0"
            max="100"
            inputMode="decimal"
            value={f.annualRatePct}
            onChange={(e) => set("annualRatePct", e.target.value)}
          />
        </Field>
        <Field label="Първоначална вноска (%)">
          <Input
            type="number"
            step="1"
            min="0"
            max="90"
            inputMode="numeric"
            value={f.downPaymentPct}
            onChange={(e) => set("downPaymentPct", e.target.value)}
          />
        </Field>
        <Field label="Срок по подразбиране">
          <Select value={f.termMonths} onChange={(e) => set("termMonths", e.target.value)}>
            {FINANCING_TERMS.map((t) => (
              <option key={t} value={t}>
                {t} месеца
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Section>
  );
}

function ContactSection({ initial }: { initial: ContactSettings }) {
  const [f, setF] = useState(initial);
  const set = (k: keyof ContactSettings, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Section title="Контактна информация" description="Показва се във футъра и на страница „Контакти“." group="contact" data={f}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Фирма" className="sm:col-span-2">
          <Input value={f.company} onChange={(e) => set("company", e.target.value)} />
        </Field>
        <Field label="Телефон">
          <Input value={f.phone} onChange={(e) => set("phone", e.target.value)} />
        </Field>
        <Field label="Имейл">
          <Input value={f.email} onChange={(e) => set("email", e.target.value)} />
        </Field>
        <Field label="ЕИК">
          <Input value={f.eik} onChange={(e) => set("eik", e.target.value)} />
        </Field>
        <Field label="ДДС №">
          <Input value={f.vat} onChange={(e) => set("vat", e.target.value)} />
        </Field>
        <Field label="Улица" className="sm:col-span-2">
          <Input value={f.street} onChange={(e) => set("street", e.target.value)} />
        </Field>
        <Field label="Район">
          <Input value={f.area} onChange={(e) => set("area", e.target.value)} />
        </Field>
        <Field label="Град">
          <Input value={f.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label="Пощенски код">
          <Input value={f.postcode} onChange={(e) => set("postcode", e.target.value)} />
        </Field>
        <Field label="Държава">
          <Input value={f.country} onChange={(e) => set("country", e.target.value)} />
        </Field>
      </div>
    </Section>
  );
}

function HoursSection({ initial }: { initial: HoursSettings }) {
  const [items, setItems] = useState(initial.items.length ? initial.items : [{ days: "", time: "" }]);
  const data = { items };
  return (
    <Section title="Работно време" group="hours" data={data}>
      <div className="flex flex-col gap-2.5">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              placeholder="Понеделник – Петък"
              value={it.days}
              onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, days: e.target.value } : x)))}
              className="flex-1"
            />
            <Input
              placeholder="09:00 – 18:00"
              value={it.time}
              onChange={(e) => setItems((p) => p.map((x, j) => (j === i ? { ...x, time: e.target.value } : x)))}
              className="w-44"
            />
            <button
              onClick={() => setItems((p) => p.filter((_, j) => j !== i))}
              className="flex size-9 shrink-0 items-center justify-center rounded-lg text-fg-subtle transition-colors hover:bg-red-500/10 hover:text-red-300"
              aria-label="Премахни"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={() => setItems((p) => [...p, { days: "", time: "" }])}
        className="mt-3 inline-flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
      >
        <Plus className="size-4" /> Добави ред
      </button>
    </Section>
  );
}

function SocialSection({ initial }: { initial: SocialSettings }) {
  const [f, setF] = useState(initial);
  const set = (k: keyof SocialSettings, v: string) => setF((p) => ({ ...p, [k]: v }));
  return (
    <Section title="Социални мрежи" group="social" data={f}>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Facebook">
          <Input value={f.facebook} onChange={(e) => set("facebook", e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="Instagram">
          <Input value={f.instagram} onChange={(e) => set("instagram", e.target.value)} placeholder="https://…" />
        </Field>
        <Field label="YouTube">
          <Input value={f.youtube} onChange={(e) => set("youtube", e.target.value)} placeholder="https://…" />
        </Field>
      </div>
    </Section>
  );
}

function BrandingSection({ initial }: { initial: BrandingSettings }) {
  const [f, setF] = useState(initial);
  return (
    <Section title="Брандинг" description="Име и подзаглавие, използвани във футъра." group="branding" data={f}>
      <div className="flex flex-col gap-4">
        <Field label="Име на сайта">
          <Input value={f.siteName} onChange={(e) => setF((p) => ({ ...p, siteName: e.target.value }))} />
        </Field>
        <Field label="Подзаглавие (футър)">
          <Textarea value={f.tagline} onChange={(e) => setF((p) => ({ ...p, tagline: e.target.value }))} rows={3} />
        </Field>
      </div>
    </Section>
  );
}
