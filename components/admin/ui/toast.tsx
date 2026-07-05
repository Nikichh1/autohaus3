"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";
type Toast = { id: number; message: string; type: ToastType };

let counter = 0;
const listeners = new Set<(t: Toast[]) => void>();
let toasts: Toast[] = [];

function emit() {
  listeners.forEach((l) => l([...toasts]));
}

export function toast(message: string, type: ToastType = "success") {
  const id = ++counter;
  toasts = [...toasts, { id, message, type }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, 4000);
}

const ICONS = {
  success: <CheckCircle2 className="size-4 text-emerald-400" />,
  error: <XCircle className="size-4 text-red-400" />,
  info: <Info className="size-4 text-sky-400" />,
};

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    listeners.add(setItems);
    return () => {
      listeners.delete(setItems);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-80 flex-col gap-2">
      {items.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex items-start gap-2.5 rounded-xl border bg-elevated px-3.5 py-3 text-sm shadow-cinema",
            t.type === "error" ? "border-red-500/30" : "border-line-strong"
          )}
          role="status"
        >
          <span className="mt-0.5 shrink-0">{ICONS[t.type]}</span>
          <span className="flex-1 text-fg">{t.message}</span>
          <button
            onClick={() => {
              toasts = toasts.filter((x) => x.id !== t.id);
              emit();
            }}
            className="shrink-0 text-fg-subtle transition-colors hover:text-fg"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
