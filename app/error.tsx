"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO: report to error monitoring (e.g. Sentry)
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow text-accent">Възникна грешка</p>
      <h1 className="mt-6 max-w-2xl font-display text-display-xs font-extrabold leading-[0.95] tracking-tight text-fg md:text-display-sm">
        Нещо се обърка.
      </h1>
      <p className="mt-6 max-w-md text-base text-fg-muted md:text-lg">
        Извиняваме се за неудобството. Опитайте отново или се върнете по-късно.
      </p>
      <button
        type="button"
        onClick={reset}
        className="group mt-10 inline-flex h-14 items-center gap-3 rounded-full bg-fg px-8 text-sm font-medium text-ink transition-colors hover:bg-accent"
      >
        <RotateCcw className="size-4 transition-transform duration-500 group-hover:-rotate-180" />
        Опитай отново
      </button>
    </main>
  );
}
