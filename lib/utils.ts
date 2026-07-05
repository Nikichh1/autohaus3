import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPriceEUR(value: number): string {
  return new Intl.NumberFormat("bg-BG", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Price for display: a formatted EUR amount, or "On request" when unpriced (0). */
export function displayPrice(value: number): string {
  return value > 0 ? formatPriceEUR(value) : "При запитване";
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("bg-BG").format(value);
}
