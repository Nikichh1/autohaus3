"use client";

import { useEffect, useRef, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

/**
 * Engine rumble — an opt-in layer of immersion. A low synthesized idle (brown
 * noise through a low-pass + a sub oscillator, no audio asset needed) swells
 * only while the Machine film ([data-rumble]) is on screen, and responds to
 * scroll momentum like revs. Deliberately quiet — felt more than heard.
 *
 * Off by default; browsers require a gesture for audio anyway, so the toggle
 * *is* the gesture. Choice persists for the session. Desktop only — phones
 * keep their speakers out of it.
 */
export function EngineRumble() {
  const [on, setOn] = useState(false);
  const [available, setAvailable] = useState(false);
  const audioRef = useRef<{
    ctx: AudioContext;
    master: GainNode;
    filter: BiquadFilterNode;
    osc: OscillatorNode;
  } | null>(null);
  const lastY = useRef(0);
  const vel = useRef(0);

  useEffect(() => {
    const gate = window.matchMedia("(hover: hover) and (pointer: fine) and (min-width: 1024px)");
    const apply = () => setAvailable(gate.matches);
    apply();
    gate.addEventListener("change", apply);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (sessionStorage.getItem("ah-sound") === "1" && gate.matches) setOn(true);
    return () => gate.removeEventListener("change", apply);
  }, []);

  useEffect(() => {
    if (!on) return;
    const ctx = new AudioContext();

    // Brown noise buffer — the body of the idle.
    const seconds = 2;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 68;
    filter.Q.value = 0.6;

    // Sub oscillator — a pure sine fundamental: felt, never buzzy.
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 45;
    const oscGain = ctx.createGain();
    oscGain.gain.value = 0.35;

    const master = ctx.createGain();
    master.gain.value = 0;

    noise.connect(filter);
    filter.connect(master);
    osc.connect(oscGain);
    oscGain.connect(filter);
    master.connect(ctx.destination);
    noise.start();
    osc.start();

    audioRef.current = { ctx, master, filter, osc };
    lastY.current = window.scrollY;

    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const a = audioRef.current;
      if (!a) return;
      // Scroll velocity → revs (smoothed, clamped).
      const y = window.scrollY;
      vel.current = vel.current * 0.9 + Math.min(Math.abs(y - lastY.current) / 40, 1) * 0.1;
      lastY.current = y;
      // Visibility of the Machine film → presence.
      const el = document.querySelector("[data-rumble]");
      let vis = 0;
      if (el) {
        const r = el.getBoundingClientRect();
        const vh = window.innerHeight;
        const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
        vis = Math.max(0, Math.min(overlap / vh, 1));
        // Mirror the M-Tach's gear math; blip exactly when the box shifts.
        const dist = r.height - vh;
        const p = dist > 0 ? Math.min(Math.max(-r.top / dist, 0), 1) : 0;
        const gear = 1 + Math.floor(Math.min(5.999, p * 6));
        if (vis > 0.5) {
          if (lastGear !== 0 && gear !== lastGear) shiftBlip();
          lastGear = gear;
        } else {
          lastGear = 0;
        }
      }
      // Quieter, slower-breathing presence — felt under the film, never heard
      // over it. Velocity adds a gentle swell instead of revs.
      const target = vis * (0.018 + vel.current * 0.035);
      const t = a.ctx.currentTime;
      a.master.gain.setTargetAtTime(target, t, 0.3);
      a.filter.frequency.setTargetAtTime(60 + vis * 26 + vel.current * 24, t, 0.4);
      a.osc.frequency.setTargetAtTime(43 + vel.current * 10, t, 0.5);
    };
    tick();

    // ── The one designed sound event: the gear shift. Synchronized with the
    // M-Tach's visual shift — a breath of exhaust (band-passed air from the
    // same noise buffer) over a momentary throttle-lift dip in the sub.
    // Nothing plays on ordinary UI; sound exists only where the car does.
    let lastGear = 0;
    const shiftBlip = () => {
      const t = ctx.currentTime;
      const n = ctx.createBufferSource();
      n.buffer = buffer;
      n.loop = true;
      n.playbackRate.value = 0.85;
      const f = ctx.createBiquadFilter();
      f.type = "bandpass";
      f.frequency.value = 300;
      f.Q.value = 1.1;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.05, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      n.connect(f);
      f.connect(g);
      g.connect(ctx.destination);
      n.start(t);
      n.stop(t + 0.2);
      // throttle lift — the sub dips and settles back
      osc.frequency.setTargetAtTime(36, t, 0.03);
      osc.frequency.setTargetAtTime(45, t + 0.1, 0.15);
    };

    return () => {
      cancelAnimationFrame(raf);
      const a = audioRef.current;
      if (a) {
        a.master.gain.setTargetAtTime(0, a.ctx.currentTime, 0.05);
        setTimeout(() => a.ctx.close().catch(() => {}), 200);
      }
      audioRef.current = null;
    };
  }, [on]);

  if (!available) return null;

  const toggle = () => {
    const next = !on;
    setOn(next);
    sessionStorage.setItem("ah-sound", next ? "1" : "0");
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={on}
      aria-label={on ? "Изключете звука" : "Включете звука"}
      className="panel-glass edge-light fixed bottom-6 right-6 z-40 flex h-11 cursor-pointer items-center gap-2.5 rounded-full px-4 text-fg/80 backdrop-blur-xl transition-colors hover:text-fg"
    >
      {on ? (
        <Volume2 className="size-4" strokeWidth={1.7} />
      ) : (
        <VolumeX className="size-4" strokeWidth={1.7} />
      )}
      <span className="label-fine">Звук</span>
      {on && (
        <span aria-hidden className="flex items-end gap-0.5">
          {[0.5, 0.9, 0.65].map((d, i) => (
            <span
              key={i}
              className="eq-bar w-0.5 rounded-full bg-accent"
              style={{ height: 10, animationDelay: `${i * 0.18}s`, animationDuration: `${d + 0.5}s` }}
            />
          ))}
        </span>
      )}
    </button>
  );
}
