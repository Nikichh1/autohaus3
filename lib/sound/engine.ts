/**
 * AutoHaus sound engine — a single, robust Web Audio instrument for the whole
 * site. Every sound is synthesized (no asset downloads) with a graphite/
 * titanium, mechanical-luxury character: precise switch clicks, a muted door
 * thunk, cinematic air whooshes between film chapters, a sub-bass swell on the
 * finale, and an engine idle under the Machine scene.
 *
 * Design rules that keep it from ever crashing the page (the previous engine
 * did — a temporal-dead-zone bug in the rumble loop):
 *   • one lazily-created AudioContext, resumed inside the enabling gesture;
 *   • every public method is a no-op when disabled and wrapped so a throw in
 *     the audio graph can never bubble into React;
 *   • all local state is declared before the render loop that reads it.
 *
 * Opt-in and off by default. The gesture that enables it also unlocks audio.
 */

type Ctx = AudioContext;

class SoundEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  enabled = false;

  private rumble: {
    raf: number;
    master: GainNode;
    filter: BiquadFilterNode;
    osc: OscillatorNode;
    noise: AudioBufferSourceNode;
    lastY: number;
    vel: number;
    lastGear: number;
  } | null = null;

  private hoverAt = 0; // throttle guard for hover ticks

  /** Lazily build (and resume) the context. Returns false if audio is unusable. */
  private ensure(): boolean {
    if (typeof window === "undefined") return false;
    try {
      if (!this.ctx) {
        const AC: typeof AudioContext | undefined =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AC) return false;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.9;
        this.master.connect(this.ctx.destination);
        this.noiseBuffer = this.makeNoise(this.ctx, 1.4);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  private makeNoise(ctx: Ctx, seconds: number): AudioBuffer {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const data = buf.getChannelData(0);
    // Brown-ish noise — warmer than white, the body of mechanical sounds.
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.4;
    }
    return buf;
  }

  setEnabled(v: boolean) {
    this.enabled = v;
    if (v) this.ensure();
    else this.stopRumble();
  }

  /** Guard + timing helper for one-shots. */
  private go<T>(fn: (ctx: Ctx, master: GainNode, t: number) => T): void {
    if (!this.enabled) return;
    if (!this.ensure() || !this.ctx || !this.master) return;
    try {
      fn(this.ctx, this.master, this.ctx.currentTime);
    } catch {
      /* audio must never break the UI */
    }
  }

  private ping(ctx: Ctx, out: GainNode, t: number, opts: {
    type?: OscillatorType;
    from: number;
    to?: number;
    dur: number;
    gain: number;
    delay?: number;
  }) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = opts.type ?? "sine";
    const start = t + (opts.delay ?? 0);
    o.frequency.setValueAtTime(opts.from, start);
    if (opts.to != null) o.frequency.exponentialRampToValueAtTime(Math.max(1, opts.to), start + opts.dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(opts.gain, start + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, start + opts.dur);
    o.connect(g);
    g.connect(out);
    o.start(start);
    o.stop(start + opts.dur + 0.02);
  }

  private noiseBurst(ctx: Ctx, out: GainNode, t: number, opts: {
    type: BiquadFilterType;
    freq: number;
    freqTo?: number;
    q?: number;
    dur: number;
    gain: number;
    rate?: number;
  }) {
    if (!this.noiseBuffer) return;
    const n = ctx.createBufferSource();
    n.buffer = this.noiseBuffer;
    n.loop = true;
    n.playbackRate.value = opts.rate ?? 1;
    const f = ctx.createBiquadFilter();
    f.type = opts.type;
    f.frequency.setValueAtTime(opts.freq, t);
    if (opts.freqTo != null) f.frequency.linearRampToValueAtTime(opts.freqTo, t + opts.dur);
    f.Q.value = opts.q ?? 0.8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(opts.gain, t + Math.min(0.05, opts.dur * 0.25));
    g.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
    n.connect(f);
    f.connect(g);
    g.connect(out);
    n.start(t);
    n.stop(t + opts.dur + 0.02);
  }

  // ── One-shots ──────────────────────────────────────────────────────────

  /** Faint high "tk" for hovering an interactive element. Throttled. */
  hover() {
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - this.hoverAt < 70) return;
    this.hoverAt = now;
    this.go((ctx, out, t) => {
      this.ping(ctx, out, t, { type: "sine", from: 2100, dur: 0.045, gain: 0.028 });
    });
  }

  /** Precise mechanical switch — button / link press. */
  click() {
    this.go((ctx, out, t) => {
      this.noiseBurst(ctx, out, t, { type: "highpass", freq: 1400, q: 0.7, dur: 0.03, gain: 0.05 });
      this.ping(ctx, out, t, { type: "triangle", from: 900, to: 520, dur: 0.06, gain: 0.09 });
    });
  }

  /** Muted door thunk — overlays opening (mobile menu, filter sheet, lightbox). */
  thunk() {
    this.go((ctx, out, t) => {
      this.ping(ctx, out, t, { type: "sine", from: 120, to: 62, dur: 0.22, gain: 0.16 });
      this.noiseBurst(ctx, out, t, { type: "lowpass", freq: 260, q: 0.9, dur: 0.14, gain: 0.06, rate: 0.8 });
    });
  }

  /** Cinematic air pass — a new film chapter arriving under the scroll. */
  whoosh() {
    this.go((ctx, out, t) => {
      this.noiseBurst(ctx, out, t, { type: "bandpass", freq: 360, freqTo: 1150, q: 0.9, dur: 0.5, gain: 0.05 });
      this.noiseBurst(ctx, out, t, { type: "bandpass", freq: 1150, freqTo: 300, q: 0.7, dur: 0.55, gain: 0.035 });
    });
  }

  /** Sub-bass swell — the finale reveal. Felt more than heard. */
  swell() {
    this.go((ctx, out, t) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(58, t);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.13, t + 0.9);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
      o.connect(g);
      g.connect(out);
      o.start(t);
      o.stop(t + 2.5);
    });
  }

  /** Ignition — plays when the system is switched on: an engine catching. */
  ignition() {
    // Force-enable path: this is the gesture that unlocks audio, so bypass the
    // enabled flag (which the caller sets in the same tick) and play directly.
    if (!this.ensure() || !this.ctx || !this.master) return;
    try {
      const ctx = this.ctx;
      const out = this.master;
      const t = ctx.currentTime;
      // cranking rise
      this.ping(ctx, out, t, { type: "sawtooth", from: 55, to: 190, dur: 0.5, gain: 0.09 });
      this.ping(ctx, out, t, { type: "sine", from: 40, to: 120, dur: 0.55, gain: 0.11 });
      this.noiseBurst(ctx, out, t, { type: "lowpass", freq: 200, freqTo: 520, q: 0.8, dur: 0.5, gain: 0.05 });
      // catch — a quick settle blip
      this.ping(ctx, out, t, { type: "triangle", from: 240, to: 150, dur: 0.18, gain: 0.06, delay: 0.5 });
    } catch {
      /* ignore */
    }
  }

  // ── Engine idle rumble (Machine scene) ───────────────────────────────────

  startRumble() {
    if (!this.enabled || this.rumble) return;
    if (!this.ensure() || !this.ctx || !this.master || !this.noiseBuffer) return;
    try {
      const ctx = this.ctx;
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      noise.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 68;
      filter.Q.value = 0.6;

      const osc = ctx.createOscillator();
      osc.type = "sine";
      osc.frequency.value = 45;
      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.35;

      const rmaster = ctx.createGain();
      rmaster.gain.value = 0;

      noise.connect(filter);
      filter.connect(rmaster);
      osc.connect(oscGain);
      oscGain.connect(filter);
      rmaster.connect(this.master);
      noise.start();
      osc.start();

      // NOTE: every field the loop reads is initialised here, BEFORE the loop
      // starts — the bug that crashed the old engine was reading `lastGear`
      // before its declaration.
      const state = {
        raf: 0,
        master: rmaster,
        filter,
        osc,
        noise,
        lastY: typeof window !== "undefined" ? window.scrollY : 0,
        vel: 0,
        lastGear: 0,
      };
      this.rumble = state;

      const tick = () => {
        state.raf = requestAnimationFrame(tick);
        const el = document.querySelector("[data-rumble]");
        const y = window.scrollY;
        state.vel = state.vel * 0.9 + Math.min(Math.abs(y - state.lastY) / 40, 1) * 0.1;
        state.lastY = y;
        let vis = 0;
        if (el) {
          const r = el.getBoundingClientRect();
          const vh = window.innerHeight;
          const overlap = Math.min(r.bottom, vh) - Math.max(r.top, 0);
          vis = Math.max(0, Math.min(overlap / vh, 1));
          const dist = r.height - vh;
          const p = dist > 0 ? Math.min(Math.max(-r.top / dist, 0), 1) : 0;
          const gear = 1 + Math.floor(Math.min(5.999, p * 6));
          if (vis > 0.5) {
            if (state.lastGear !== 0 && gear !== state.lastGear) this.shiftBlip();
            state.lastGear = gear;
          } else {
            state.lastGear = 0;
          }
        }
        const target = vis * (0.018 + state.vel * 0.035);
        const t = ctx.currentTime;
        state.master.gain.setTargetAtTime(target, t, 0.3);
        state.filter.frequency.setTargetAtTime(60 + vis * 26 + state.vel * 24, t, 0.4);
        state.osc.frequency.setTargetAtTime(43 + state.vel * 10, t, 0.5);
      };
      tick();
    } catch {
      this.rumble = null;
    }
  }

  private shiftBlip() {
    if (!this.ctx || !this.master || !this.noiseBuffer) return;
    try {
      const ctx = this.ctx;
      const t = ctx.currentTime;
      const n = ctx.createBufferSource();
      n.buffer = this.noiseBuffer;
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
      g.connect(this.master);
      n.start(t);
      n.stop(t + 0.2);
      this.rumble?.osc.frequency.setTargetAtTime(36, t, 0.03);
      this.rumble?.osc.frequency.setTargetAtTime(45, t + 0.1, 0.15);
    } catch {
      /* ignore */
    }
  }

  stopRumble() {
    const r = this.rumble;
    if (!r) return;
    this.rumble = null;
    try {
      cancelAnimationFrame(r.raf);
      if (this.ctx) r.master.gain.setTargetAtTime(0, this.ctx.currentTime, 0.08);
      setTimeout(() => {
        try {
          r.noise.stop();
          r.osc.stop();
        } catch {
          /* already stopped */
        }
      }, 260);
    } catch {
      /* ignore */
    }
  }
}

export const sound = new SoundEngine();
export type { SoundEngine };
