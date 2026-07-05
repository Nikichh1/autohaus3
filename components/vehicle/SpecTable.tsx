import type { Vehicle } from "@/types";
import { formatNumber } from "@/lib/utils";
import { fuelLabels, transmissionLabels, drivetrainLabels } from "@/lib/labels";

/** Best-effort mapping of a free-text colour name (BG or EN) to a swatch colour.
 *  Returns a CSS colour, or null when the name isn't recognised. */
function colorSwatch(name: string): string | null {
  const n = name.toLowerCase();
  const table: Array<[RegExp, string]> = [
    [/(черн|black|antrac|антрац)/, "#1c1f24"],
    [/(бял|бяло|white)/, "#e9ebee"],
    [/(сребрист|сребро|silver)/, "linear-gradient(150deg,#d6dadf,#9aa1a9)"],
    [/(сив|сиво|grey|gray|графит|graphite)/, "#71777f"],
    [/(тъмносин|navy|тъмно син)/, "#1b3a6b"],
    [/(син|синьо|blue)/, "#2360cf"],
    [/(бордо|bordeaux|винен)/, "#6b1f2a"],
    [/(червен|red)/, "#b5392b"],
    [/(зелен|green)/, "#2e7d46"],
    [/(жълт|yellow)/, "#e3b53a"],
    [/(оранж|orange)/, "#e06a2a"],
    [/(кафяв|brown|шоколад)/, "#6b4423"],
    [/(беж|beige|пясъч|sand)/, "#c9b18a"],
    [/(злат|gold|шампан|champagne)/, "linear-gradient(150deg,#e6cf9a,#c9a86e)"],
    [/(лилав|виолет|purple|violet)/, "#5b3b8c"],
  ];
  for (const [re, css] of table) if (re.test(n)) return css;
  return null;
}

export function SpecTable({ vehicle }: { vehicle: Vehicle }) {
  const swatch = vehicle.exteriorColor ? colorSwatch(vehicle.exteriorColor) : null;

  const rows: Array<[string, React.ReactNode]> = [
    ["Година", vehicle.year],
    ["Пробег", `${formatNumber(vehicle.mileage)} км`],
    ["Двигател", vehicle.engineCC ? `${formatNumber(vehicle.engineCC)} см³` : undefined],
    ["Мощност", `${vehicle.power} к.с.`],
    ["Въртящ момент", vehicle.torque ? `${vehicle.torque} Nm` : undefined],
    ["0–100 км/ч", vehicle.acceleration ? `${vehicle.acceleration} с` : undefined],
    ["Макс. скорост", vehicle.topSpeed ? `${vehicle.topSpeed} км/ч` : undefined],
    ["Гориво", fuelLabels[vehicle.fuelType]],
    ["Трансмисия", transmissionLabels[vehicle.transmission]],
    ["Задвижване", drivetrainLabels[vehicle.drivetrain]],
    ["Тип каросерия", vehicle.bodyType],
    ["Врати", vehicle.doors],
    ["Места", vehicle.seats],
    [
      "Цвят екстериор",
      vehicle.exteriorColor ? (
        <span className="flex items-center gap-2">
          {swatch && (
            <span
              aria-hidden
              className="size-3.5 shrink-0 rounded-full border border-white/25"
              style={{ background: swatch }}
            />
          )}
          {vehicle.exteriorColor}
        </span>
      ) : undefined,
    ],
    ["Цвят интериор", vehicle.interiorColor],
    ["VIN", vehicle.vin],
  ];

  const visible = rows.filter(([, value]) => value !== undefined && value !== "");

  return (
    <dl className="grid grid-cols-1">
      {visible.map(([label, value]) => (
        <div
          key={label}
          className="flex items-center justify-between gap-4 border-b border-line py-3.5 transition-colors last:border-0 hover:bg-white/[0.02]"
        >
          <dt className="text-sm text-fg-muted">{label}</dt>
          <dd className="text-right text-sm font-medium tabular-nums text-fg">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
