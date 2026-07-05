import { cn } from "@/lib/utils";

/**
 * Cinematic colour-grade overlay for the scroll-scrubbed film scenes (intro +
 * feature). A warm gold sheen with a faint cool counter (soft-light), a contrast
 * vignette, and subtle edge darkening — gives the footage a graded, "shot on
 * cinema glass" feel. Non-interactive; drop it over a canvas/video.
 *
 * `deep` — a heavier grade for bright/daylight footage (the intro): a graphite
 * multiply wash pulls the frame toward the brand palette and the vignette bites
 * harder, so raw daytime source reads as a night-shoot dealership film.
 */
export function CinematicGrade({ className, deep = false }: { className?: string; deep?: boolean }) {
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0", className)}>
      {/* graphite multiply wash — tames daylight footage into the brand's dusk */}
      {deep && (
        <div
          className="absolute inset-0 mix-blend-multiply"
          style={{
            background:
              "linear-gradient(160deg, rgba(52,62,78,0.55) 0%, rgba(38,44,56,0.42) 48%, rgba(22,26,34,0.6) 100%)",
          }}
        />
      )}
      {/* cool steel sheen + deep shadow — the titanium "look" */}
      <div
        className="absolute inset-0 mix-blend-soft-light"
        style={{
          opacity: deep ? 0.7 : 0.55,
          background:
            "linear-gradient(125deg, rgba(20,30,44,0.45) 0%, transparent 44%, rgba(178,192,208,0.5) 100%)",
        }}
      />
      {/* gentle bloom toward the steel highlight side */}
      <div
        className="absolute inset-0 mix-blend-screen"
        style={{
          opacity: 0.12,
          background:
            "radial-gradient(60% 70% at 78% 38%, rgba(188,202,218,0.45), transparent 70%)",
        }}
      />
      {/* contrast vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: deep
            ? "radial-gradient(115% 115% at 50% 42%, transparent 44%, rgba(0,0,0,0.68) 100%)"
            : "radial-gradient(125% 125% at 50% 42%, transparent 52%, rgba(0,0,0,0.55) 100%)",
        }}
      />
      {/* cinematic edge darkening */}
      <div className={cn("absolute inset-x-0 top-0 bg-gradient-to-b to-transparent", deep ? "h-28 from-black/50" : "h-20 from-black/35")} />
      <div className={cn("absolute inset-x-0 bottom-0 bg-gradient-to-t to-transparent", deep ? "h-28 from-black/50" : "h-20 from-black/35")} />
    </div>
  );
}
