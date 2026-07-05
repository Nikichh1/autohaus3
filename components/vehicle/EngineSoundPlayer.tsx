"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause, Volume2, VolumeX, Gauge, Loader2 } from "lucide-react";
import type { EngineSound } from "@/types";
import { cn } from "@/lib/utils";

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) s = 0;
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

/** Stable fallback waveform when no peaks were captured at upload. */
function synthPeaks(n: number): number[] {
  return Array.from({ length: n }, (_, i) => {
    const base = 0.5 + 0.42 * Math.sin(i * 0.5) * Math.cos(i * 0.13);
    const rev = 0.18 + 0.8 * (1 - Math.abs(i / n - 0.5) * 1.4);
    return Math.max(0.12, Math.min(1, Math.abs(base) * rev));
  });
}

export function EngineSoundPlayer({
  sound,
  title = "Звук на двигателя",
  subtitle = "Истински запис",
  className,
  compact = false,
  accent = false,
}: {
  sound: EngineSound;
  title?: string;
  subtitle?: string;
  className?: string;
  compact?: boolean;
  /** Use the accent colour for the play button (instead of the default light fill). */
  accent?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(sound.duration || 0);
  const [volume, setVolume] = useState(0.85);
  const [muted, setMuted] = useState(false);

  const peaks = useMemo(() => {
    const target = compact ? 56 : 96;
    if (sound.peaks && sound.peaks.length > 8) {
      // Resample stored peaks to the target bar count.
      const out: number[] = [];
      for (let i = 0; i < target; i++) {
        out.push(sound.peaks[Math.floor((i / target) * sound.peaks.length)] ?? 0.3);
      }
      return out;
    }
    return synthPeaks(target);
  }, [sound.peaks, compact]);

  const progress = duration > 0 ? current / duration : 0;

  const togglePlay = useCallback(async () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      try {
        setLoading(true);
        await a.play();
      } catch {
        setLoading(false);
      }
    } else {
      a.pause();
    }
  }, []);

  // Sync volume/mute to the element.
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
    }
  }, [volume, muted]);

  const seekToClientX = useCallback(
    (clientX: number) => {
      const el = barsRef.current;
      const a = audioRef.current;
      if (!el || !a || !duration) return;
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      a.currentTime = ratio * duration;
      setCurrent(ratio * duration);
    },
    [duration],
  );

  function onScrubStart(e: React.PointerEvent) {
    e.preventDefault();
    seekToClientX(e.clientX);
    const move = (ev: PointerEvent) => seekToClientX(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div
      className={cn(
        "engine-sound group relative overflow-hidden rounded-2xl border border-line-strong p-5 sm:p-6",
        className,
      )}
    >
      {/* ambient accent glow that intensifies while playing */}
      <div
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-700",
          playing && "opacity-100",
        )}
        style={{
          background:
            "radial-gradient(120% 90% at 15% 0%, rgba(201,207,214,0.16), transparent 60%)",
        }}
      />

      <div className="relative flex items-center gap-4 sm:gap-5">
        <button
          onClick={togglePlay}
          aria-label={playing ? "Пауза" : "Възпроизведи"}
          aria-pressed={playing}
          style={
            accent
              ? { background: "linear-gradient(180deg,var(--va,var(--color-accent)),var(--va-deep,var(--color-accent-deep)))", color: "var(--color-base)" }
              : undefined
          }
          className={cn(
            "relative flex shrink-0 items-center justify-center rounded-full shadow-[0_10px_30px_-12px_rgba(0,0,0,0.6)] transition-transform duration-200 hover:scale-105 active:scale-95",
            accent ? "" : "bg-fg text-ink",
            compact ? "size-12" : "size-14 sm:size-16",
          )}
        >
          {/* pulsing ring while playing */}
          {playing && (
            <span
              className={cn("absolute inset-0 animate-ping rounded-full", accent ? "bg-accent/30" : "bg-fg/30")}
              style={{ animationDuration: "1.6s" }}
            />
          )}
          {loading ? (
            <Loader2 className={cn("animate-spin", compact ? "size-5" : "size-6")} />
          ) : playing ? (
            <Pause className={cn(compact ? "size-5" : "size-6")} />
          ) : (
            <Play className={cn("translate-x-0.5", compact ? "size-5" : "size-6")} />
          )}
        </button>

        <div className="min-w-0 flex-1">
          {!compact && (
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Gauge className="size-4 text-accent" />
                <span className="text-sm font-semibold text-fg">{title}</span>
                <span className="hidden text-xs text-fg-subtle sm:inline">· {subtitle}</span>
              </div>
              <span className="text-xs tabular-nums text-fg-subtle">
                {formatTime(current)} / {formatTime(duration)}
              </span>
            </div>
          )}

          {/* Waveform */}
          <div
            ref={barsRef}
            onPointerDown={onScrubStart}
            role="slider"
            aria-label="Позиция на възпроизвеждане"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(current)}
            tabIndex={0}
            onKeyDown={(e) => {
              const a = audioRef.current;
              if (!a || !duration) return;
              if (e.key === "ArrowRight") a.currentTime = Math.min(duration, a.currentTime + 5);
              if (e.key === "ArrowLeft") a.currentTime = Math.max(0, a.currentTime - 5);
              if (e.key === " " || e.key === "Enter") {
                e.preventDefault();
                togglePlay();
              }
            }}
            className={cn(
              "flex cursor-pointer touch-none items-center gap-[2px] outline-none focus-visible:ring-2 focus-visible:ring-accent/50 rounded",
              compact ? "h-9" : "h-12 sm:h-14",
            )}
          >
            {peaks.map((p, i) => {
              const filled = i / peaks.length <= progress;
              return (
                <span
                  key={i}
                  className={cn(
                    "min-h-[3px] flex-1 rounded-full transition-colors duration-150",
                    filled ? "bg-accent" : "bg-fg/20",
                  )}
                  style={{
                    height: `${Math.round(p * 100)}%`,
                    transform: playing && filled && i / peaks.length > progress - 0.04 ? "scaleY(1.15)" : undefined,
                    transition: "height .2s, transform .2s, background-color .15s",
                  }}
                />
              );
            })}
          </div>

          {compact && (
            <div className="mt-1.5 flex items-center justify-between text-[11px] tabular-nums text-fg-subtle">
              <span>{formatTime(current)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* Volume (hidden on the most compact mobile) */}
        {!compact && (
          <div className="hidden items-center gap-2 sm:flex">
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label={muted ? "Включи звука" : "Изключи звука"}
              className="text-fg-muted transition-colors hover:text-fg"
            >
              {muted || volume === 0 ? <VolumeX className="size-[18px]" /> : <Volume2 className="size-[18px]" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={muted ? 0 : volume}
              onChange={(e) => {
                setVolume(Number(e.target.value));
                setMuted(false);
              }}
              aria-label="Сила на звука"
              className="h-1 w-20 cursor-pointer accent-accent"
            />
          </div>
        )}
      </div>

      {/* preload="none" → the file is fetched only when the user presses play (lazy). */}
      <audio
        ref={audioRef}
        src={sound.url}
        preload="none"
        onPlay={() => {
          setPlaying(true);
          setLoading(false);
        }}
        onPause={() => setPlaying(false)}
        onWaiting={() => setLoading(true)}
        onPlaying={() => setLoading(false)}
        onCanPlay={() => setLoading(false)}
        onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
            setDuration(e.currentTarget.duration);
          }
        }}
        onEnded={() => {
          setPlaying(false);
          setCurrent(0);
        }}
      />
    </div>
  );
}
