import type { FuelType, Transmission, Drivetrain } from "@/types";

export const fuelLabels: Record<FuelType, string> = {
  petrol: "Бензин",
  diesel: "Дизел",
  hybrid: "Хибрид",
  electric: "Електрически",
};

export const transmissionLabels: Record<Transmission, string> = {
  manual: "Ръчна",
  automatic: "Автоматична",
};

export const drivetrainLabels: Record<Drivetrain, string> = {
  fwd: "Предно",
  rwd: "Задно",
  awd: "4×4",
};
