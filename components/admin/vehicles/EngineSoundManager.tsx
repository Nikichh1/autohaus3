"use client";

import { useRef, useState, useTransition } from "react";
import { Music4, Upload, Trash2, Loader2, RefreshCw, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "@/components/admin/ui/toast";
import { confirmDialog } from "@/components/admin/ui/confirm";
import { EngineSoundPlayer } from "@/components/vehicle/EngineSoundPlayer";
import { setEngineSoundPublished, deleteEngineSound } from "@/lib/admin/vehicle-actions";

export type EditorSound = {
  url: string;
  name: string | null;
  format: string | null;
  duration: number | null;
  size: number | null;
  peaks: number[];
  published: boolean;
} | null;

/** Decode the audio in the browser to extract normalized waveform peaks + duration. */
async function extractPeaks(file: File): Promise<{ peaks: number[]; duration: number }> {
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  const ctx = new Ctx();
  try {
    const buf = await file.arrayBuffer();
    const audio = await ctx.decodeAudioData(buf.slice(0));
    const channel = audio.getChannelData(0);
    const N = 160;
    const block = Math.max(1, Math.floor(channel.length / N));
    const peaks: number[] = [];
    let max = 0;
    for (let i = 0; i < N; i++) {
      let peak = 0;
      for (let j = 0; j < block; j++) {
        const v = Math.abs(channel[i * block + j] || 0);
        if (v > peak) peak = v;
      }
      peaks.push(peak);
      if (peak > max) max = peak;
    }
    return { peaks: max > 0 ? peaks.map((p) => p / max) : peaks, duration: audio.duration };
  } finally {
    ctx.close();
  }
}

function fmtSize(bytes: number | null): string {
  if (!bytes) return "";
  return bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`;
}

export function EngineSoundManager({
  vehicleId,
  initial,
  canManage,
  canPublish,
}: {
  vehicleId: string;
  initial: EditorSound;
  canManage: boolean;
  canPublish: boolean;
}) {
  const [sound, setSound] = useState<EditorSound>(initial);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const ok = /\.(mp3|wav|m4a)$/i.test(file.name) || /audio\//.test(file.type);
    if (!ok) {
      toast("Поддържат се само MP3, WAV и M4A.", "error");
      return;
    }
    setUploading(true);
    try {
      let peaks: number[] = [];
      let duration = 0;
      try {
        const res = await extractPeaks(file);
        peaks = res.peaks;
        duration = res.duration;
      } catch {
        // Decoding unsupported in this browser — upload anyway; player falls back.
      }

      const fd = new FormData();
      fd.append("vehicleId", vehicleId);
      fd.append("file", file);
      fd.append("peaks", JSON.stringify(peaks));
      fd.append("duration", String(duration));

      const res = await fetch("/api/admin/upload-audio", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error ?? "Грешка при качване.", "error");
        return;
      }
      const s = data.sound;
      setSound({
        url: s.engineSoundUrl,
        name: s.engineSoundName,
        format: s.engineSoundFormat,
        duration: s.engineSoundDuration,
        size: s.engineSoundSize,
        peaks: s.engineSoundPeaks ? JSON.parse(s.engineSoundPeaks) : peaks,
        published: s.engineSoundPublished,
      });
      toast("Звукът е качен");
    } catch {
      toast("Грешка при качване.", "error");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function togglePublish(next: boolean) {
    if (!sound) return;
    setSound({ ...sound, published: next });
    startTransition(async () => {
      const res = await setEngineSoundPublished(vehicleId, next);
      if (!res.ok) {
        setSound((s) => (s ? { ...s, published: !next } : s));
        toast(res.error, "error");
      } else {
        toast(next ? "Звукът е публикуван" : "Звукът е скрит");
      }
    });
  }

  async function onDelete() {
    const ok = await confirmDialog({
      title: "Изтриване на звука?",
      description: "Записът на двигателя ще бъде премахнат.",
      danger: true,
      confirmLabel: "Изтрий",
    });
    if (!ok) return;
    setSound(null);
    startTransition(async () => {
      const res = await deleteEngineSound(vehicleId);
      if (!res.ok) toast(res.error, "error");
      else toast("Звукът е изтрит");
    });
  }

  return (
    <div>
      {sound ? (
        <div className="flex flex-col gap-4">
          <EngineSoundPlayer
            sound={{ url: sound.url, peaks: sound.peaks, duration: sound.duration ?? 0, format: sound.format ?? "mp3" }}
            title="Преглед"
            subtitle={sound.published ? "Публикуван" : "Чернова"}
            className="bg-base/40"
          />

          <div className="flex flex-wrap items-center gap-3 text-xs text-fg-subtle">
            <span className="inline-flex items-center gap-1.5">
              <Music4 className="size-3.5" /> {sound.name ?? "engine-sound"}
            </span>
            {sound.format && <span className="uppercase">{sound.format}</span>}
            {sound.size ? <span>{fmtSize(sound.size)}</span> : null}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canPublish && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-line-strong bg-base/40 px-3 py-2 text-sm text-fg">
                <input
                  type="checkbox"
                  checked={sound.published}
                  onChange={(e) => togglePublish(e.target.checked)}
                  className="size-4 rounded border-line-strong bg-base accent-accent"
                />
                <Volume2 className="size-4 text-accent" />
                Публикуван на сайта
              </label>
            )}
            {canManage && (
              <>
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-line-strong bg-elevated px-3 py-2 text-sm text-fg transition-colors hover:border-accent disabled:opacity-60"
                >
                  {uploading ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                  Замени
                </button>
                <button
                  onClick={onDelete}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/25 bg-red-500/10 px-3 py-2 text-sm text-red-300 transition-colors hover:bg-red-500/20"
                >
                  <Trash2 className="size-4" />
                  Изтрий
                </button>
              </>
            )}
          </div>
          {!sound.published && (
            <p className="text-xs text-amber-400/90">
              Звукът е чернова — видим е само тук, докато не го публикувате.
            </p>
          )}
        </div>
      ) : canManage ? (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            handleFile(e.dataTransfer.files?.[0]);
          }}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line-strong bg-base/40 px-6 py-10 text-center transition-colors hover:border-accent hover:bg-white/[0.02]",
            uploading && "pointer-events-none opacity-70",
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".mp3,.wav,.m4a,audio/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0])}
          />
          {uploading ? <Loader2 className="size-6 animate-spin text-fg-muted" /> : <Upload className="size-6 text-fg-subtle" />}
          <span className="text-sm text-fg-muted">
            {uploading ? "Обработка и качване…" : "Качете звук на двигателя"}
          </span>
          <span className="text-xs text-fg-subtle">MP3, WAV или M4A · до 40MB</span>
        </label>
      ) : (
        <p className="rounded-xl border border-line bg-base/40 px-4 py-6 text-center text-sm text-fg-subtle">
          Няма качен звук.
        </p>
      )}
      {/* hidden replace input lives above; keep ref usable when sound exists */}
      {sound && canManage && (
        <input
          ref={inputRef}
          type="file"
          accept=".mp3,.wav,.m4a,audio/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      )}
    </div>
  );
}
