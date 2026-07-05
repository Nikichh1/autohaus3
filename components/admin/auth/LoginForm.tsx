"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import { signIn } from "@/lib/auth-client";
import { Button } from "@/components/admin/ui/button";
import { Field, Input } from "@/components/admin/ui/input";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/admin";
  const initialError =
    params.get("error") === "forbidden"
      ? "Този акаунт няма достъп до администрацията."
      : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(initialError);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await signIn.email({
      email: email.trim().toLowerCase(),
      password,
      rememberMe: remember,
    });

    if (error) {
      setError(
        error.status === 401 || error.status === 403
          ? "Невалиден имейл или парола."
          : error.message || "Възникна грешка. Опитайте отново."
      );
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label="Имейл" htmlFor="email">
        <div className="relative">
          <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            placeholder="вие@autohaus.bg"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 pl-9"
          />
        </div>
      </Field>

      <Field
        label="Парола"
        htmlFor="password"
        hint={
          <button
            type="button"
            className="text-fg-subtle transition-colors hover:text-fg"
            onClick={() => alert("Свържете се със супер админ за нулиране на паролата.")}
          >
            Забравена парола?
          </button>
        }
      >
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-fg-subtle" />
          <Input
            id="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            required
            placeholder="••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 pl-9 pr-10"
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-fg-subtle transition-colors hover:text-fg"
            aria-label={show ? "Скрий паролата" : "Покажи паролата"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
      </Field>

      <label className="flex cursor-pointer select-none items-center gap-2 text-sm text-fg-muted">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="size-4 rounded border-line-strong bg-base accent-accent"
        />
        Запомни това устройство
      </label>

      {error ? (
        <div className="rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
          {error}
        </div>
      ) : null}

      <Button type="submit" variant="primary" size="lg" loading={loading} className="mt-1 w-full">
        {loading ? "Влизане…" : "Вход в администрацията"}
      </Button>
    </form>
  );
}
