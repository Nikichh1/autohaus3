"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";

export function VehicleInquiryForm({
  vehicleLabel,
  vehicleSlug,
  bare = false,
}: {
  vehicleLabel: string;
  vehicleSlug?: string;
  /** Hide the built-in eyebrow + heading (the page supplies them in a left column). */
  bare?: boolean;
}) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const payload = {
      name: fd.get("name")?.toString() ?? "",
      phone: fd.get("phone")?.toString() ?? "",
      email: fd.get("email")?.toString() ?? "",
      message: fd.get("message")?.toString() ?? "",
      vehicleSlug: vehicleSlug ?? "",
      vehicleLabel,
      source: "vehicle_inquiry",
      company: fd.get("company")?.toString() ?? "",
    };
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Възникна грешка. Опитайте отново.");
        setSending(false);
        return;
      }
      setSent(true);
    } catch {
      setError("Възникна грешка. Опитайте отново.");
      setSending(false);
    }
  }

  if (sent) {
    return (
      <div className="vd-card flex flex-col items-start gap-4 rounded-[1.5rem] p-8 md:p-10">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Check className="size-6" />
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-fg">
          Благодарим за запитването.
        </h3>
        <p className="max-w-md text-fg-muted">
          Наш консултант ще се свърже с вас относно {vehicleLabel} в рамките на работния ден.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="vd-card rounded-[1.5rem] p-6 md:p-8"
    >
      {!bare && (
        <>
          <p className="label-fine text-fg-subtle">Запитване</p>
          <h3 className="mt-3 font-display text-2xl font-bold tracking-tight text-fg md:text-3xl">
            Заявете оглед или попитайте за {vehicleLabel}
          </h3>
        </>
      )}

      <div className={`grid gap-5 sm:grid-cols-2 ${bare ? "" : "mt-8"}`}>
        <Input name="name" label="Име" placeholder="Вашето име" required />
        <Input name="phone" label="Телефон" type="tel" placeholder="+359 ..." required />
        <Input
          name="email"
          label="Имейл"
          type="email"
          placeholder="you@example.com"
          className="sm:col-span-2"
        />
        <Textarea
          name="message"
          label="Съобщение"
          placeholder="Интересувам се от оглед и тест драйв..."
          className="sm:col-span-2"
          defaultValue={`Здравейте, интересувам се от ${vehicleLabel}.`}
        />
      </div>

      {/* honeypot */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pointer-events-none absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      {error ? (
        <p className="mt-6 rounded-lg border border-red-500/25 bg-red-500/10 px-4 py-2.5 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={sending}
        className="vd-pill mt-6 flex h-[52px] w-full items-center justify-center rounded-full text-sm font-semibold disabled:opacity-60"
      >
        {sending ? "Изпращане…" : "Изпрати запитване"}
      </button>
      <p className="mt-3 text-xs text-fg-subtle">
        С изпращането се съгласявате с обработката на личните ви данни.
      </p>
    </form>
  );
}
