import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="eyebrow text-accent">Грешка 404</p>
      <h1 className="mt-6 font-display text-display-md font-extrabold leading-[0.9] tracking-tight text-fg md:text-display-xl">
        404
      </h1>
      <p className="mt-6 max-w-md text-base text-fg-muted md:text-lg">
        Страницата, която търсите, не съществува или е била преместена.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <Link
          href="/"
          className="group inline-flex h-14 items-center gap-3 rounded-full bg-fg px-8 text-sm font-medium text-ink transition-colors hover:bg-accent"
        >
          Към началото
          <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
        </Link>
        <Link
          href="/avtomobili"
          className="inline-flex h-14 items-center rounded-full border border-line-strong px-8 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
        >
          Разгледай автомобилите
        </Link>
      </div>
    </main>
  );
}
