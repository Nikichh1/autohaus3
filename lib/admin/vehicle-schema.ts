import { z } from "zod";
import {
  VEHICLE_STATUSES,
  COLLECTIONS,
  FUEL_TYPES,
  TRANSMISSIONS,
  DRIVETRAINS,
} from "./constants";

const optionalInt = z
  .union([z.coerce.number().int(), z.null(), z.literal("")])
  .transform((v) => (v === "" || v === null ? null : Number(v)))
  .pipe(z.number().int().nonnegative().nullable());

const optionalFloat = z
  .union([z.coerce.number(), z.null(), z.literal("")])
  .transform((v) => (v === "" || v === null ? null : Number(v)))
  .pipe(z.number().nonnegative().nullable());

const optStr = z
  .union([z.string(), z.null()])
  .transform((v) => (v == null ? "" : v.trim()))
  .transform((v) => (v.length ? v : null));

export const vehicleFormSchema = z.object({
  brand: z.string().trim().min(1, "Марката е задължителна").max(60),
  model: z.string().trim().min(1, "Моделът е задължителен").max(80),
  variant: optStr,
  year: z.coerce
    .number()
    .int()
    .min(1900, "Невалидна година")
    .max(new Date().getFullYear() + 2),
  bodyType: z.string().trim().max(60).default(""),
  collection: z.enum(COLLECTIONS),
  status: z.enum(VEHICLE_STATUSES),
  featured: z.boolean().default(false),

  fuelType: z.enum(FUEL_TYPES),
  transmission: z.enum(TRANSMISSIONS),
  drivetrain: z.enum(DRIVETRAINS),

  price: z.coerce.number().int().nonnegative().default(0),
  priceOnRequest: z.boolean().default(false),
  rentalPerDay: optionalInt,

  mileage: z.coerce.number().int().nonnegative().default(0),
  power: z.coerce.number().int().nonnegative().default(0),
  torque: optionalInt,
  engineCC: optionalInt,
  acceleration: optionalFloat,
  topSpeed: optionalInt,
  doors: optionalInt,
  seats: optionalInt,

  exteriorColor: optStr,
  interiorColor: optStr,
  vin: optStr,

  features: z.array(z.string().trim().min(1)).max(60).default([]),
  description: z.string().trim().max(8000).default(""),
  internalNotes: optStr,
});

export type VehicleFormInput = z.input<typeof vehicleFormSchema>;
export type VehicleFormValues = z.output<typeof vehicleFormSchema>;
