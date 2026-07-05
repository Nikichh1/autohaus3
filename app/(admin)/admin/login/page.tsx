import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/auth/LoginForm";

export const metadata: Metadata = {
  title: "Вход · Администрация",
  robots: { index: false, follow: false },
};

export default function LoginPage() {
  return (
    <main className="field-graphite relative flex min-h-screen items-center justify-center px-4 py-12">
      {/* ambient accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            "radial-gradient(60% 50% at 50% 0%, rgba(201,207,214,0.10), transparent 70%)",
        }}
      />

      <div className="relative w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <div className="mb-5 inline-flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-fg text-ink">
              <span className="font-display text-lg font-extrabold">A</span>
            </span>
            <span className="font-display text-xl font-bold tracking-tight text-fg">
              AutoHaus
            </span>
          </div>
          <h1 className="font-display text-2xl font-bold text-fg">
            Администрация
          </h1>
          <p className="mt-1.5 text-sm text-fg-muted">
            Влезте, за да управлявате платформата.
          </p>
        </div>

        <div className="panel-metal rounded-2xl p-6 sm:p-8">
          <Suspense
            fallback={<div className="h-72 animate-pulse rounded-lg bg-white/5" />}
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-fg-subtle">
          Защитена зона · Достъпът се записва
        </p>
      </div>
    </main>
  );
}
