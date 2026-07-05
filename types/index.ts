export type FuelType = "petrol" | "diesel" | "hybrid" | "electric";
export type Transmission = "manual" | "automatic";
export type Drivetrain = "fwd" | "rwd" | "awd";

/** Curated catalog collections (luxury sub-brands), not generic body classes. */
export type Collection = "performance" | "executive" | "signature";

export interface Vehicle {
  id: string;
  slug: string;
  brand: string;
  model: string;
  variant?: string;
  year: number;
  price: number; // EUR
  mileage: number; // km
  fuelType: FuelType;
  transmission: Transmission;
  drivetrain: Drivetrain;
  bodyType: string;
  /** Which curated collection this vehicle belongs to. */
  collection: Collection;
  /** Daily rental rate in EUR. Present ⇒ available to rent. */
  rentalPerDay?: number;
  power: number; // hp
  torque?: number; // Nm
  engineCC?: number;
  acceleration?: number; // 0-100 km/h, seconds
  topSpeed?: number; // km/h
  doors?: number;
  seats?: number;
  exteriorColor: string;
  interiorColor?: string;
  vin?: string;
  features: string[];
  description: string;
  images: string[];
  featured?: boolean;
  /** Present ⇒ this vehicle has a published engine sound recording. */
  engineSound?: EngineSound | null;
}

export interface EngineSound {
  url: string;
  /** Pre-computed waveform peaks (0–1), so the player never decodes the file. */
  peaks: number[];
  duration: number; // seconds
  format: string; // mp3 | wav | m4a
}

export type Service = {
  slug: string;
  label: string;
  shortLabel?: string;
  tagline: string;
  description: string;
  image: string;
  href: string;
  features: string[];
  // Sections used by the templated service page
  sections?: Array<{
    eyebrow: string;
    heading: string;
    body: string;
    image?: string;
  }>;
};
