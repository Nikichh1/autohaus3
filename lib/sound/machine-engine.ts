/**
 * Machine engine sound — a synthesized inline-six that revs with the RPM the
 * Machine-scene telemetry is showing. Driven entirely by `setRpm()`; the scroll
 * position sets the revs, so pulling the page down winds the engine up through
 * the gears and each shift drops it back — the audio mirrors the tach exactly.
 *
 * Pure Web Audio (no asset download). A stack of slightly-detuned saw voices at
 * the firing frequency + a sub for body + filtered noise for air, all glided
 * with `setTargetAtTime` so it never zippers. Opt-in and unlocked by a user
 * gesture (browser policy); every path is guarded so audio can't crash the UI.
 */

type Ctx = AudioContext;

const IDLE = 1200;
const MAX = 8000;

class MachineEngine {
  private ctx: Ctx | null = null;
  private master: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private graph: {
    voices: OscillatorNode[];
    sub: OscillatorNode;
    lp: BiquadFilterNode;
    engineGain: GainNode;
    noise: AudioBufferSourceNode;
    noiseBp: BiquadFilterNode;
    noiseGain: GainNode;
    out: GainNode;
  } | null = null;
  running = false;

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
        this.master.gain.value = 0.0;
        this.master.connect(this.ctx.destination);
        this.noiseBuf = this.makeNoise(this.ctx, 2);
      }
      if (this.ctx.state === "suspended") void this.ctx.resume().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

  private makeNoise(ctx: Ctx, seconds: number): AudioBuffer {
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * seconds), ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  /** Must be called from a user gesture. Returns true if the engine is running. */
  start(): boolean {
    if (this.running) return true;
    if (!this.ensure() || !this.ctx || !this.master || !this.noiseBuf) return false;
    try {
      const ctx = this.ctx;
      const out = ctx.createGain();
      out.gain.value = 1;

      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 500;
      lp.Q.value = 0.9;

      const engineGain = ctx.createGain();
      engineGain.gain.value = 0.18;

      // detuned saw voices at the firing frequency
      const detunes = [0, 8, -8, 1200 /* octave up, quiet */];
      const voices = detunes.map((cents, i) => {
        const o = ctx.createOscillator();
        o.type = "sawtooth";
        o.frequency.value = 60;
        o.detune.value = cents;
        const g = ctx.createGain();
        g.gain.value = i === 3 ? 0.12 : 0.32;
        o.connect(g);
        g.connect(lp);
        o.start();
        return o;
      });

      // sub sine for weight
      const sub = ctx.createOscillator();
      sub.type = "sine";
      sub.frequency.value = 30;
      const subGain = ctx.createGain();
      subGain.gain.value = 0.5;
      sub.connect(subGain);
      subGain.connect(lp);
      sub.start();

      lp.connect(engineGain);
      engineGain.connect(out);

      // air / intake noise
      const noise = ctx.createBufferSource();
      noise.buffer = this.noiseBuf;
      noise.loop = true;
      const noiseBp = ctx.createBiquadFilter();
      noiseBp.type = "bandpass";
      noiseBp.frequency.value = 900;
      noiseBp.Q.value = 0.7;
      const noiseGain = ctx.createGain();
      noiseGain.gain.value = 0.02;
      noise.connect(noiseBp);
      noiseBp.connect(noiseGain);
      noiseGain.connect(out);
      noise.start();

      out.connect(this.master);
      this.graph = { voices, sub, lp, engineGain, noise, noiseBp, noiseGain, out };
      this.running = true;
      // fade the master in
      this.master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.25);
      this.setRpm(IDLE);
      return true;
    } catch {
      this.graph = null;
      this.running = false;
      return false;
    }
  }

  /** Feed the current revs (called every animation frame while active). */
  setRpm(rpm: number) {
    const g = this.graph;
    if (!g || !this.ctx) return;
    try {
      const r = Math.max(IDLE, Math.min(MAX, rpm));
      const norm = (r - IDLE) / (MAX - IDLE); // 0..1
      const t = this.ctx.currentTime;
      const f0 = r / 22; // firing frequency, ~55–360 Hz
      // glide the voices + sub
      for (const o of g.voices) o.frequency.setTargetAtTime(f0, t, 0.04);
      g.sub.frequency.setTargetAtTime(f0 / 2, t, 0.05);
      // brighten with revs
      g.lp.frequency.setTargetAtTime(360 + norm * 3600, t, 0.06);
      g.noiseBp.frequency.setTargetAtTime(700 + norm * 2600, t, 0.06);
      // louder + airier the harder it revs
      g.engineGain.gain.setTargetAtTime(0.16 + norm * 0.16, t, 0.08);
      g.noiseGain.gain.setTargetAtTime(0.015 + norm * 0.05, t, 0.08);
    } catch {
      /* never break the UI */
    }
  }

  /** Fade the engine in/out as its scene enters/leaves the viewport. */
  setActive(on: boolean) {
    if (!this.running || !this.ctx || !this.master) return;
    try {
      this.master.gain.setTargetAtTime(on ? 0.55 : 0, this.ctx.currentTime, on ? 0.2 : 0.35);
    } catch {
      /* ignore */
    }
  }

  stop() {
    const g = this.graph;
    if (!g || !this.ctx || !this.master) {
      this.running = false;
      return;
    }
    this.running = false;
    this.graph = null;
    try {
      const ctx = this.ctx;
      this.master.gain.setTargetAtTime(0, ctx.currentTime, 0.15);
      setTimeout(() => {
        try {
          g.voices.forEach((o) => o.stop());
          g.sub.stop();
          g.noise.stop();
        } catch {
          /* already stopped */
        }
      }, 400);
    } catch {
      /* ignore */
    }
  }
}

export const machineEngine = new MachineEngine();
