"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Save, Trash2, ExternalLink } from "lucide-react";
import { Card } from "@/components/admin/ui/card";
import { Button } from "@/components/admin/ui/button";
import { Field, Input, Select, Textarea, Label } from "@/components/admin/ui/input";
import { StatusBadge } from "./StatusBadge";
import { ImageManager, type EditorImage } from "./ImageManager";
import { EngineSoundManager, type EditorSound } from "./EngineSoundManager";
import { TagInput } from "./TagInput";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import { saveVehicle, deleteVehicle, duplicateVehicle } from "@/lib/admin/vehicle-actions";
import type { Permission } from "@/lib/admin/rbac";
import {
  VEHICLE_STATUSES,
  STATUS_LABELS,
  COLLECTIONS,
  COLLECTION_LABELS,
  FUEL_TYPES,
  fuelLabels,
  TRANSMISSIONS,
  transmissionLabels,
  DRIVETRAINS,
  drivetrainLabels,
} from "@/lib/admin/constants";

export type EditorVehicle = {
  id: string;
  slug: string;
  status: string;
  brand: string;
  model: string;
  variant: string;
  year: string;
  bodyType: string;
  collection: string;
  featured: boolean;
  fuelType: string;
  transmission: string;
  drivetrain: string;
  price: string;
  priceOnRequest: boolean;
  rentalPerDay: string;
  mileage: string;
  power: string;
  torque: string;
  engineCC: string;
  acceleration: string;
  topSpeed: string;
  doors: string;
  seats: string;
  exteriorColor: string;
  interiorColor: string;
  vin: string;
  features: string[];
  description: string;
  internalNotes: string;
};

export function VehicleEditor({
  vehicle,
  images,
  sound,
  permissions,
}: {
  vehicle: EditorVehicle;
  images: EditorImage[];
  sound: EditorSound;
  permissions: Permission[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<EditorVehicle>(vehicle);
  const [dirty, setDirty] = useState(false);
  const [saving, startSave] = useTransition();
  const [deleting, startDelete] = useTransition();

  const can = (p: Permission) => permissions.includes(p);
  const canUpdate = can("vehicle.update");
  const ro = !canUpdate;

  useEffect(() => {
    function warn(e: BeforeUnloadEvent) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function set<K extends keyof EditorVehicle>(key: K, value: EditorVehicle[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function onSave() {
    if (!form.brand.trim() || !form.model.trim()) {
      toast("Марката и моделът са задължителни.", "error");
      return;
    }
    startSave(async () => {
      const payload = {
        ...form,
        year: form.year,
        price: form.price,
        mileage: form.mileage,
        power: form.power,
      };
      const res = await saveVehicle(vehicle.id, payload);
      if (res.ok) {
        toast("Запазено");
        setDirty(false);
        router.refresh();
      } else {
        toast(res.error, "error");
      }
    });
  }

  async function onDelete() {
    const ok = await confirmDialog({
      title: "Изтриване на автомобила?",
      description: `${form.brand} ${form.model} ще бъде изтрит безвъзвратно.`,
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (!ok) return;
    startDelete(async () => {
      const res = await deleteVehicle(vehicle.id);
      if (res.ok) {
        toast("Изтрит");
        router.push("/admin/vehicles");
      } else {
        toast(res.error, "error");
      }
    });
  }

  const title = form.brand || form.model ? `${form.brand} ${form.model}`.trim() : "Нов автомобил";

  return (
    <div className="mx-auto max-w-5xl">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link
          href="/admin/vehicles"
          className="flex size-9 items-center justify-center rounded-lg text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
          aria-label="Назад"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="truncate font-display text-xl font-bold text-fg">{title}</h1>
            <StatusBadge status={form.status} />
            {dirty ? <span className="text-xs text-amber-400">• незапазено</span> : null}
          </div>
          <p className="text-xs text-fg-subtle">/{form.slug}</p>
        </div>

        <div className="ml-auto flex items-center gap-2">
          {form.status === "available" ? (
            <Link
              href={`/avtomobili/${form.slug}/`}
              target="_blank"
              className="flex h-9 items-center gap-1.5 rounded-lg px-3 text-sm text-fg-muted transition-colors hover:bg-white/5 hover:text-fg"
            >
              <ExternalLink className="size-4" /> Преглед
            </Link>
          ) : null}

          {can("vehicle.duplicate") ? (
            <form action={duplicateVehicle.bind(null, vehicle.id)}>
              <Button type="submit" variant="secondary" icon={<Copy className="size-4" />}>
                Дублирай
              </Button>
            </form>
          ) : null}

          {can("vehicle.delete") ? (
            <Button variant="danger" icon={<Trash2 className="size-4" />} onClick={onDelete} loading={deleting}>
              Изтрий
            </Button>
          ) : null}

          {canUpdate ? (
            <Button variant="primary" icon={<Save className="size-4" />} onClick={onSave} loading={saving}>
              Запази
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {/* Overview */}
          <Section title="Основни данни">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Марка *">
                <Input value={form.brand} disabled={ro} onChange={(e) => set("brand", e.target.value)} placeholder="BMW" />
              </Field>
              <Field label="Модел *">
                <Input value={form.model} disabled={ro} onChange={(e) => set("model", e.target.value)} placeholder="530d" />
              </Field>
              <Field label="Вариант">
                <Input value={form.variant} disabled={ro} onChange={(e) => set("variant", e.target.value)} placeholder="M Sport" />
              </Field>
              <Field label="Година">
                <Input type="number" value={form.year} disabled={ro} onChange={(e) => set("year", e.target.value)} />
              </Field>
              <Field label="Тип каросерия">
                <Input value={form.bodyType} disabled={ro} onChange={(e) => set("bodyType", e.target.value)} placeholder="Седан" />
              </Field>
              <Field label="Колекция">
                <Select value={form.collection} disabled={ro} onChange={(e) => set("collection", e.target.value)}>
                  {COLLECTIONS.map((c) => (
                    <option key={c} value={c}>{COLLECTION_LABELS[c]}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Статус">
                <Select value={form.status} disabled={ro} onChange={(e) => set("status", e.target.value)}>
                  {VEHICLE_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </Select>
              </Field>
              <div className="flex items-end">
                <label className={`flex h-9 cursor-pointer items-center gap-2 text-sm ${can("vehicle.feature") ? "text-fg" : "text-fg-subtle"}`}>
                  <input
                    type="checkbox"
                    checked={form.featured}
                    disabled={!can("vehicle.feature")}
                    onChange={(e) => set("featured", e.target.checked)}
                    className="size-4 rounded border-line-strong bg-base accent-accent"
                  />
                  Промотиран (featured)
                </label>
              </div>
            </div>
          </Section>

          {/* Specs */}
          <Section title="Технически данни">
            <div className="grid gap-4 sm:grid-cols-3">
              <Field label="Гориво">
                <Select value={form.fuelType} disabled={ro} onChange={(e) => set("fuelType", e.target.value)}>
                  {FUEL_TYPES.map((f) => (<option key={f} value={f}>{fuelLabels[f]}</option>))}
                </Select>
              </Field>
              <Field label="Скоростна кутия">
                <Select value={form.transmission} disabled={ro} onChange={(e) => set("transmission", e.target.value)}>
                  {TRANSMISSIONS.map((t) => (<option key={t} value={t}>{transmissionLabels[t]}</option>))}
                </Select>
              </Field>
              <Field label="Задвижване">
                <Select value={form.drivetrain} disabled={ro} onChange={(e) => set("drivetrain", e.target.value)}>
                  {DRIVETRAINS.map((d) => (<option key={d} value={d}>{drivetrainLabels[d]}</option>))}
                </Select>
              </Field>
              <Field label="Мощност (к.с.)">
                <Input type="number" value={form.power} disabled={ro} onChange={(e) => set("power", e.target.value)} />
              </Field>
              <Field label="Пробег (км)">
                <Input type="number" value={form.mileage} disabled={ro} onChange={(e) => set("mileage", e.target.value)} />
              </Field>
              <Field label="Въртящ момент (Nm)">
                <Input type="number" value={form.torque} disabled={ro} onChange={(e) => set("torque", e.target.value)} />
              </Field>
              <Field label="Кубатура (cc)">
                <Input type="number" value={form.engineCC} disabled={ro} onChange={(e) => set("engineCC", e.target.value)} />
              </Field>
              <Field label="0–100 км/ч (сек)">
                <Input type="number" step="0.1" value={form.acceleration} disabled={ro} onChange={(e) => set("acceleration", e.target.value)} />
              </Field>
              <Field label="Макс. скорост (км/ч)">
                <Input type="number" value={form.topSpeed} disabled={ro} onChange={(e) => set("topSpeed", e.target.value)} />
              </Field>
              <Field label="Врати">
                <Input type="number" value={form.doors} disabled={ro} onChange={(e) => set("doors", e.target.value)} />
              </Field>
              <Field label="Места">
                <Input type="number" value={form.seats} disabled={ro} onChange={(e) => set("seats", e.target.value)} />
              </Field>
              <Field label="VIN">
                <Input value={form.vin} disabled={ro} onChange={(e) => set("vin", e.target.value)} placeholder="WBA…" />
              </Field>
              <Field label="Външен цвят">
                <Input value={form.exteriorColor} disabled={ro} onChange={(e) => set("exteriorColor", e.target.value)} />
              </Field>
              <Field label="Вътрешен цвят">
                <Input value={form.interiorColor} disabled={ro} onChange={(e) => set("interiorColor", e.target.value)} />
              </Field>
            </div>
          </Section>

          {/* Media */}
          <Section title="Снимки">
            <ImageManager vehicleId={vehicle.id} initial={images} canEdit={can("media.upload")} />
          </Section>

          {/* Engine sound */}
          <Section title="Звук на двигателя">
            <EngineSoundManager
              vehicleId={vehicle.id}
              initial={sound}
              canManage={can("media.upload")}
              canPublish={can("vehicle.update")}
            />
          </Section>

          {/* Description */}
          <Section title="Описание и оборудване">
            <Field label="Описание" className="mb-4">
              <Textarea value={form.description} disabled={ro} onChange={(e) => set("description", e.target.value)} rows={6} />
            </Field>
            <Label>Оборудване (Enter за добавяне)</Label>
            <TagInput value={form.features} onChange={(v) => set("features", v)} placeholder="Напр. Панорама, Камера 360°…" />
          </Section>
        </div>

        {/* Sidebar */}
        <div className="flex flex-col gap-6">
          <Section title="Цена">
            <div className="flex flex-col gap-4">
              <Field label="Цена (EUR)">
                <Input type="number" value={form.price} disabled={ro || form.priceOnRequest} onChange={(e) => set("price", e.target.value)} />
              </Field>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-fg">
                <input
                  type="checkbox"
                  checked={form.priceOnRequest}
                  disabled={ro}
                  onChange={(e) => set("priceOnRequest", e.target.checked)}
                  className="size-4 rounded border-line-strong bg-base accent-accent"
                />
                Цена при запитване
              </label>
              <Field label="Под наем / ден (EUR)" hint="по желание">
                <Input type="number" value={form.rentalPerDay} disabled={ro} onChange={(e) => set("rentalPerDay", e.target.value)} placeholder="—" />
              </Field>
            </div>
          </Section>

          <Section title="Вътрешни бележки">
            <Textarea
              value={form.internalNotes}
              disabled={ro}
              onChange={(e) => set("internalNotes", e.target.value)}
              rows={5}
              placeholder="Видими само за екипа…"
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="p-5">
      <h2 className="mb-4 text-sm font-semibold text-fg">{title}</h2>
      {children}
    </Card>
  );
}
