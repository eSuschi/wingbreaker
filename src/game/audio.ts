export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;
  private lastShot = 0;
  private lastGraze = 0;
  private lastArmor = 0;
  private noiseBuf: AudioBuffer | null = null;
  private drones: OscillatorNode[] = [];
  private droneGain: GainNode | null = null;

  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0, pan = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    const dest = this.pan(pan);
    g.connect(dest);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  private pan(amount: number): AudioNode {
    if (!this.ctx) throw new Error("audio");
    const p = Math.max(-0.85, Math.min(0.85, amount));
    if (Math.abs(p) < 0.02 || typeof this.ctx.createStereoPanner !== "function") return this.ctx.destination;
    const node = this.ctx.createStereoPanner();
    node.pan.value = p;
    node.connect(this.ctx.destination);
    return node;
  }

  private noise(dur: number, gain: number, cutoff = 900) {
    if (this.muted || !this.ctx) return;
    if (!this.noiseBuf) {
      const n = Math.floor(this.ctx.sampleRate * 0.45);
      const buf = this.ctx.createBuffer(1, n, this.ctx.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
      this.noiseBuf = buf;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = cutoff;
    const g = this.ctx.createGain();
    const t = this.ctx.currentTime;
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  shot(level: number, hot: boolean, pan = 0) {
    const now = performance.now();
    if (now - this.lastShot < 48) return;
    this.lastShot = now;
    const jitter = 1 + (Math.random() - 0.5) * 0.08;
    if (level >= 6) {
      this.tone(920 * jitter, 0.045, "sawtooth", hot ? 0.016 : 0.011, 380, pan);
      this.tone(240, 0.04, "square", 0.008, -30, pan);
      return;
    }
    if (level === 5) {
      this.tone((hot ? 210 : 168) * jitter, 0.08, "sine", 0.028, -70, pan);
      this.tone(90, 0.06, "triangle", 0.016, -20, pan);
      return;
    }
    if (level === 4) {
      this.noise(0.035, hot ? 0.04 : 0.028, 2000);
      this.tone(540 * jitter, 0.04, "square", 0.01, -200, pan);
      return;
    }
    const freq = (hot ? 640 : 470 + level * 28) * jitter;
    this.tone(freq, 0.04, "square", hot ? 0.02 : 0.014, hot ? -360 : -240, pan);
    this.tone(160 + level * 8, 0.03, "triangle", 0.012, -30, pan);
  }

  missile() {
    this.tone(260, 0.11, "sawtooth", 0.028, 240);
    this.noise(0.07, 0.035, 640);
  }

  kill(big: boolean) {
    this.noise(big ? 0.34 : 0.1, big ? 0.2 : 0.07, big ? 420 : 1100);
    const f = (big ? 78 : 150) * (0.92 + Math.random() * 0.16);
    this.tone(f, big ? 0.28 : 0.09, "sawtooth", big ? 0.055 : 0.028, big ? -50 : -80);
    if (big) this.tone(220, 0.12, "triangle", 0.03, 80);
  }

  armor() {
    const now = performance.now();
    if (now - this.lastArmor < 48) return;
    this.lastArmor = now;
    this.noise(0.04, 0.045, 1400);
    this.tone(210, 0.03, "square", 0.012, -40);
  }

  graze() {
    const now = performance.now();
    if (now - this.lastGraze < 80) return;
    this.lastGraze = now;
    this.tone(1400 + Math.random() * 200, 0.03, "sine", 0.012, 200);
  }

  pickup() {
    this.tone(620, 0.07, "triangle", 0.045);
    this.tone(930, 0.1, "triangle", 0.035);
  }

  drive() {
    this.tone(220, 0.12, "sawtooth", 0.04, 180);
    this.tone(440, 0.16, "triangle", 0.035, 220);
  }

  shield() {
    this.tone(520, 0.1, "sine", 0.04, -200);
    this.noise(0.08, 0.05, 1600);
  }

  hurt() {
    this.tone(160, 0.22, "sawtooth", 0.07, -110);
    this.noise(0.18, 0.08, 500);
  }

  bomb() {
    this.noise(0.42, 0.22, 380);
    this.tone(180, 0.36, "sawtooth", 0.06, -130);
    this.tone(90, 0.4, "sine", 0.05, -40);
  }

  wave() {
    this.tone(196, 0.09, "triangle", 0.03);
    this.tone(294, 0.14, "triangle", 0.025);
  }

  boss() {
    this.noise(0.3, 0.1, 300);
    this.tone(73, 0.4, "sawtooth", 0.045, -20);
    this.tone(146, 0.28, "triangle", 0.03, 10);
  }

  clean() {
    this.tone(523, 0.08, "triangle", 0.035);
    this.tone(784, 0.12, "triangle", 0.03);
  }

  drone(on: boolean) {
    this.unlock();
    if (!this.ctx) return;
    if (!this.drones.length) {
      const gain = this.ctx.createGain();
      gain.gain.value = 0.0001;
      gain.connect(this.ctx.destination);
      this.droneGain = gain;
      for (const [f, v] of [
        [55, 0.65],
        [82.5, 0.22],
        [110, 0.18],
      ] as const) {
        const o = this.ctx.createOscillator();
        o.type = "sine";
        o.frequency.value = f;
        const g = this.ctx.createGain();
        g.gain.value = v;
        o.connect(g);
        g.connect(gain);
        o.start();
        this.drones.push(o);
      }
    }
    const target = on && !this.muted ? 0.02 : 0.0001;
    this.droneGain?.gain.setTargetAtTime(target, this.ctx.currentTime, 0.12);
  }
}
