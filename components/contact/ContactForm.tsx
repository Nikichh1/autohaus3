"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { Input, Textarea } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

type ContactFormProps = {
  vehicleOptions: { value: string; label: string }[];
  defaultVehicle?: string;
  defaultMessage?: string;
};

export function ContactForm({
  vehicleOptions,
  defaultVehicle,
  defaultMessage,
}: ContactFormProps) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    const slug = fd.get("vehicle")?.toString() || "";
    const payload = {
      name: fd.get("name")?.toString() ?? "",
      phone: fd.get("phone")?.toString() ?? "",
      email: fd.get("email")?.toString() ?? "",
      message: fd.get("message")?.toString() ?? "",
      vehicleSlug: slug,
      vehicleLabel: vehicleOptions.find((o) => o.value === slug)?.label ?? "",
      source: "contact_form",
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
      <div className="panel-glass edge-light flex flex-col items-start gap-4 rounded-[1.25rem] p-8 md:p-10">
        <div className="flex size-12 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Check className="size-6" />
        </div>
        <h3 className="font-display text-2xl font-bold tracking-tight text-fg">
          Съобщението е изпратено.
        </h3>
        <p className="max-w-md text-fg-muted">
          Благодарим, че се свързахте с AutoHaus. Ще ви отговорим в най-кратък срок.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-metal edge-light rounded-[1.25rem] p-6 md:p-10"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <Input name="name" label="Име" placeholder="Вашето име" required />
        <Input
          name="phone"
          label="Телефон"
          type="tel"
          placeholder="+359 ..."
          required
        />
        <Input
          name="email"
          label="Имейл"
          type="email"
          placeholder="you@example.com"
          className="sm:col-span-2"
        />
        <Select
          name="vehicle"
          label="Автомобил от интерес"
          defaultValue={defaultVehicle}
          className="sm:col-span-2"
        >
          <option value="">Общо запитване</option>
          {vehicleOptions.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
        <Textarea
          name="message"
          label="Съобщение"
          placeholder="С какво можем да помогнем?"
          className="sm:col-span-2"
          defaultValue={defaultMessage}
          required
        />
      </div>

      {/* honeypot — hidden from users, catches bots */}
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

      <div className="mt-8 flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" variant="solid" arrow disabled={sending}>
          {sending ? "Изпращане…" : "Изпрати съобщение"}
        </Button>
        <p className="text-xs text-fg-subtle">
          С изпращането се съгласявате с обработката на личните ви данни.
        </p>
      </div>
    </form>
  );
}
