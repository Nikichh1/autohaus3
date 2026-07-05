import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";

export function PlaceholderPage({
  title,
  note,
}: {
  title: string;
  note?: string;
}) {
  return (
    <section className="field-graphite relative flex min-h-[100svh] items-center overflow-hidden">
      {/* depth */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(50% 55% at 30% 22%, rgba(201,207,214,0.1), transparent 60%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(245,247,249,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(245,247,249,0.6) 1px, transparent 1px)",
          backgroundSize: "82px 82px",
          maskImage: "radial-gradient(70% 70% at 30% 40%, #000 20%, transparent 72%)",
        }}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/brand/logo.svg"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-[10%] top-[28%] w-[80%] max-w-none opacity-[0.035]"
      />

      <div className="relative z-10 mx-auto w-full max-w-wide px-4 pt-32 pb-24 md:px-8 xl:px-12">
        <div className="max-w-2xl">
          <p className="flex items-center gap-3 text-accent">
            <span className="h-px w-8 bg-accent/50" />
            <span className="label-fine">AutoHaus · Пловдив</span>
          </p>
          <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-line-strong bg-white/[0.03] px-3.5 py-1.5">
            <span className="size-1.5 animate-pulse rounded-full bg-accent" />
            <span className="label-fine text-fg-muted">В подготовка</span>
          </div>
          <h1 className="mt-7 font-display text-display-md font-extrabold leading-[0.92] tracking-tight text-fg md:text-display-lg">
            {title}
          </h1>
          <p className="mt-8 max-w-xl text-lg leading-relaxed text-fg-muted">
            {note ??
              "Тази секция е в подготовка. За въпроси и допълнителна информация се свържете с нашия екип."}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/kontakti"
              className="group inline-flex h-14 items-center gap-2 rounded-full bg-fg px-6 text-sm font-medium text-ink transition-colors hover:bg-accent"
            >
              Свържете се с нас
              <ArrowUpRight className="size-4" />
            </Link>
            <Link
              href="/"
              className="group inline-flex h-14 items-center gap-2 rounded-full border border-line-strong px-6 text-sm font-medium text-fg transition-colors hover:border-accent hover:text-accent"
            >
              <ArrowLeft className="size-4 transition-transform duration-300 group-hover:-translate-x-1" />
              Към началото
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
