// Custom next/image loader. Maps a requested width to the nearest pre-generated
// variant (scripts/gen-variants.mjs) so each device fetches a right-sized image
// via srcset — WITHOUT Next re-encoding the originals. The largest entry per
// image is the untouched full-res `{name}.webp`.
import manifest from "./lib/image-manifest.json";

const widthsByKey = manifest as Record<string, number[]>;

export default function imageLoader({
  src,
  width,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  // Non-webp (logo.svg, etc.) or unknown → serve as-authored.
  if (!src.endsWith(".webp")) return src;
  const key = src.slice(0, -".webp".length);
  const widths = widthsByKey[key];
  if (!widths || widths.length === 0) return src;

  const max = widths[widths.length - 1];
  const chosen = widths.find((w) => w >= width) ?? max;
  // The largest available width is the base file (no suffix).
  return chosen >= max ? src : `${key}-${chosen}.webp`;
}
