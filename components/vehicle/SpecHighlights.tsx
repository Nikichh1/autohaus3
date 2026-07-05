"use client";

import type { Vehicle } from "@/types";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { StatCounter } from "@/components/motion/StatCounter";
import { fuelLabels } from "@/lib/labels";

type Item =
  | { kind: "num"; value: number; unit: string; label: string; decimals: number }
  | { kind: "text"; value: string; label: string };

export function SpecHighlights({ vehicle }: { vehicle: Vehicle }) {
  // Build from whatever this listing actually provides — power, mileage, year
  // and fuel are always present; torque / 0–100 / top speed are shown when known.
  const items: Item[] = [
    { kind: "num", value: vehicle.power, unit: "к.с.", label: "Мощност", decimals: 0 },
    vehicle.torque
      ? { kind: "num" as const, value: vehicle.torque, unit: "Nm", label: "Въртящ момент", decimals: 0 }
      : null,
    vehicle.acceleration
      ? { kind: "num" as const, value: vehicle.acceleration, unit: "сек", label: "0–100 км/ч", decimals: 1 }
      : null,
    vehicle.topSpeed
      ? { kind: "num" as const, value: vehicle.topSpeed, unit: "км/ч", label: "Макс. скорост", decimals: 0 }
      : null,
    { kind: "num", value: vehicle.mileage, unit: "км", label: "Пробег", decimals: 0 },
    { kind: "text", value: String(vehicle.year), label: "Първа регистрация" },
    { kind: "text", value: fuelLabels[vehicle.fuelType], label: "Гориво" },
  ].filter(Boolean) as Item[];

  // Keep to a tidy 4-up row.
  const shown = items.slice(0, 4);

  return (
    <Stagger
      stagger={0.08}
      className="edge-light grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] border border-line-strong bg-line shadow-cinema lg:grid-cols-4"
    >
      {shown.map((item) => (
        <StaggerItem
          key={item.label}
          className="relative bg-gradient-to-b from-[#191c22] to-[#0f1216] px-5 py-8 md:px-7 md:py-10"
        >
          <p className="label-fine text-fg-subtle">{item.label}</p>
          <p className="mt-5 flex items-baseline gap-2 font-display font-extrabold leading-none">
            <span className="text-titanium text-display-2xs tabular-nums md:text-display-xs">
              {item.kind === "num" ? (
                <StatCounter to={item.value} decimals={item.decimals} />
              ) : (
                item.value
              )}
            </span>
            {item.kind === "num" && (
              <span className="text-sm font-medium text-fg-muted">{item.unit}</span>
            )}
          </p>
        </StaggerItem>
      ))}
    </Stagger>
  );
}
