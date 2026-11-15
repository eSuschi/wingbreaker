export class Sfx {
  private ctx: AudioContext | null = null;
  muted = false;
  volume = 1;
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

  context() {
    this.unlock();
    return this.ctx;
  }

  private tone(freq: number, dur: number, type: OscillatorType, gain: number, slide = 0, pan = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), t);
    if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), t + dur);
    g.gain.setValueAtTime(gain * this.volume, t);
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
    g.gain.setValueAtTime(gain * this.volume, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    src.start(t);
    src.stop(t + dur + 0.02);
  }

  /** Every gun has a voice of its own; more power makes it a little fuller. */
  shot(level: number, hot: boolean, pan = 0, family = "") {
    const now = performance.now();
    if (now - this.lastShot < 48) return;
    this.lastShot = now;
    const jitter = 1 + (Math.random() - 0.5) * 0.08;
    const full = 1 + Math.min(6, Math.max(1, level)) * 0.06;
    const push = hot ? 1.3 : 1;
    if (family === "bubble") {
      // a wet little pop that slides up
      this.tone(430 * jitter, 0.05, "sine", 0.02 * full * push, 520, pan);
      return;
    }
    if (family === "soap") {
      this.tone(170 * jitter, 0.08, "sine", 0.03 * full * push, -70, pan);
      this.tone(88, 0.06, "triangle", 0.016, -20, pan);
      return;
    }
    if (family === "paste") {
      this.tone(940 * jitter, 0.045, "sawtooth", 0.011 * full * push, 360, pan);
      this.tone(240, 0.04, "square", 0.007, -30, pan);
      return;
    }
    if (family === "zap") {
      this.noise(0.03, 0.03 * push, 5200);
      this.tone(1500 * jitter, 0.05, "square", 0.009 * full, -900, pan);
      return;
    }
    if (family === "flush") {
      this.noise(0.11, 0.045 * push, 620);
      this.tone(150 * jitter, 0.1, "sine", 0.02 * full, -60, pan);
      return;
    }
    if (family === "mist") {
      this.noise(0.05, 0.022 * full * push, 3800);
      return;
    }
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
    if (big) {
      this.noise(0.34, 0.2, 420);
      this.tone(78 * (0.92 + Math.random() * 0.16), 0.28, "sawtooth", 0.055, -50);
      this.tone(220, 0.12, "triangle", 0.03, 80);
      return;
    }
    // small fry go three different ways, so a line of them is not one sound ten times
    const pick = Math.floor(Math.random() * 3);
    const j = 0.9 + Math.random() * 0.2;
    if (pick === 0) {
      this.noise(0.1, 0.07, 1100);
      this.tone(150 * j, 0.09, "sawtooth", 0.028, -80);
    } else if (pick === 1) {
      // plop
      this.tone(330 * j, 0.1, "sine", 0.06, -230);
      this.noise(0.04, 0.03, 900);
    } else {
      // squelch
      this.noise(0.12, 0.08, 520);
      this.tone(190 * j, 0.11, "triangle", 0.035, -110);
    }
  }

  /** Storm poop bursting: wet and short. */
  splat() {
    const j = 0.88 + Math.random() * 0.24;
    this.noise(0.13, 0.1, 640);
    this.tone(240 * j, 0.12, "sine", 0.05, -170);
  }

  /** A heavy going down. It is exactly what it sounds like. */
  fart() {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = 0.42 + Math.random() * 0.16;
    const osc = ctx.createOscillator();
    osc.type = "sawtooth";
    const f = 92 + Math.random() * 26;
    osc.frequency.setValueAtTime(f, t);
    osc.frequency.linearRampToValueAtTime(f * 1.25, t + dur * 0.25);
    osc.frequency.exponentialRampToValueAtTime(f * 0.5, t + dur);
    // the flutter is what makes it a raspberry and not a note
    const lfo = ctx.createOscillator();
    lfo.type = "square";
    lfo.frequency.setValueAtTime(34, t);
    lfo.frequency.linearRampToValueAtTime(19, t + dur);
    const depth = ctx.createGain();
    depth.gain.value = 0.5;
    const trem = ctx.createGain();
    trem.gain.value = 0.55;
    lfo.connect(depth);
    depth.connect(trem.gain);
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 520;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.2 * this.volume + 0.0001, t + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(filter);
    filter.connect(trem);
    trem.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    lfo.start(t);
    osc.stop(t + dur + 0.03);
    lfo.stop(t + dur + 0.03);
    this.noise(0.2, 0.09, 380);
  }

  /** The big flush: water going round and down, with a gurgle at the end. */
  flush() {
    if (this.muted || !this.ctx) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = 1.25;
    if (!this.noiseBuf) this.noise(0.01, 0.0001, 900);
    if (this.noiseBuf) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      src.loop = true;
      const band = ctx.createBiquadFilter();
      band.type = "bandpass";
      band.Q.value = 1.1;
      band.frequency.setValueAtTime(2200, t);
      band.frequency.exponentialRampToValueAtTime(260, t + dur);
      const swirl = ctx.createOscillator();
      swirl.frequency.setValueAtTime(5, t);
      swirl.frequency.linearRampToValueAtTime(13, t + dur);
      const depth = ctx.createGain();
      depth.gain.value = 0.4;
      const trem = ctx.createGain();
      trem.gain.value = 0.6;
      swirl.connect(depth);
      depth.connect(trem.gain);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.34 * this.volume + 0.0001, t + 0.08);
      g.gain.setValueAtTime(0.34 * this.volume + 0.0001, t + dur * 0.55);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(band);
      band.connect(trem);
      trem.connect(g);
      g.connect(ctx.destination);
      src.start(t);
      swirl.start(t);
      src.stop(t + dur + 0.05);
      swirl.stop(t + dur + 0.05);
    }
    this.tone(170, 0.9, "sine", 0.06, -120);
    // the last gulp
    const osc = ctx.createOscillator();
    const g2 = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(120, t + dur - 0.2);
    osc.frequency.exponentialRampToValueAtTime(48, t + dur + 0.12);
    g2.gain.setValueAtTime(0.0001, t + dur - 0.2);
    g2.gain.exponentialRampToValueAtTime(0.11 * this.volume + 0.0001, t + dur - 0.12);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.14);
    osc.connect(g2);
    g2.connect(ctx.destination);
    osc.start(t + dur - 0.2);
    osc.stop(t + dur + 0.2);
  }

  /** A pipe bursting at the valve: a clank and a hiss. */
  valve() {
    this.tone(640, 0.07, "square", 0.04, -180);
    this.tone(960, 0.11, "triangle", 0.03, -260);
    this.noise(0.3, 0.12, 2600);
    this.tone(84, 0.24, "sawtooth", 0.05, -30);
  }

  /** A few notes going up: something is charged and waiting. */
  ready() {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime;
    [392, 523, 659, 784].forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(f, t + i * 0.07);
      g.gain.setValueAtTime(0.045 * this.volume + 0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.16);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(t + i * 0.07);
      osc.stop(t + i * 0.07 + 0.18);
    });
  }

  /** The name card of a boss sliding in: one low hit. */
  card() {
    this.noise(0.5, 0.16, 240);
    this.tone(110, 0.55, "sawtooth", 0.05, -40);
    this.tone(165, 0.45, "triangle", 0.04, -30);
    this.tone(55, 0.6, "sine", 0.08, -10);
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

  plink(step = 0) {
    if (this.muted || !this.ctx) return;
    const t = this.ctx.currentTime + step * 0.07;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(540 + step * 70, t);
    g.gain.setValueAtTime(0.028, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.08);
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

  drone(_on: boolean) {
    /* replaced by the chapter sequencer */
  }
}
