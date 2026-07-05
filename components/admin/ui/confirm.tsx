"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
};

type Pending = ConfirmOptions & { resolve: (v: boolean) => void };

let setPendingExternal: ((p: Pending | null) => void) | null = null;

/** Promise-based confirm. `await confirmDialog({ title })` → true/false. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    setPendingExternal?.({ ...options, resolve });
  });
}

export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null);

  useEffect(() => {
    setPendingExternal = setPending;
    return () => {
      setPendingExternal = null;
    };
  }, []);

  if (!pending) return null;

  function close(value: boolean) {
    pending?.resolve(value);
    setPending(null);
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-overlay backdrop-blur-sm" onClick={() => close(false)} />
      <div className="relative w-full max-w-sm rounded-2xl border border-line-strong bg-elevated p-6 shadow-cinema">
        <div className="flex items-start gap-3">
          {pending.danger ? (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-red-500/12 text-red-400">
              <AlertTriangle className="size-5" />
            </span>
          ) : null}
          <div>
            <h2 className="text-base font-semibold text-fg">{pending.title}</h2>
            {pending.description ? (
              <p className="mt-1 text-sm text-fg-muted">{pending.description}</p>
            ) : null}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => close(false)}>
            {pending.cancelLabel ?? "Отказ"}
          </Button>
          <Button variant={pending.danger ? "danger" : "primary"} onClick={() => close(true)}>
            {pending.confirmLabel ?? "Потвърди"}
          </Button>
        </div>
      </div>
    </div>
  );
}
