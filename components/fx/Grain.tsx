/**
 * Film-grain + faint vignette overlay. Fixed, non-interactive, ultra-low opacity
 * with a soft-light blend so it reads as graded film across the whole page
 * without muddying type. Animation is pure CSS (see globals.css `.grain-overlay`)
 * and is disabled under prefers-reduced-motion.
 */
export function Grain() {
  return (
    <>
      <div aria-hidden className="grain-overlay" />
      <div aria-hidden className="vignette-overlay" />
    </>
  );
}
