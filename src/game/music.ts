const CHAPTERS = [
  { bpm: 84, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 7] },
  { bpm: 110, root: 57, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 7] },
  { bpm: 104, root: 52, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 8, 3, 10] },
  { bpm: 112, root: 50, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 5, 0, 10] },
  { bpm: 96, root: 54, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 8, 3, 10] },
  { bpm: 116, root: 55, scale: [0, 2, 4, 5, 7, 9, 10], prog: [0, 10, 5, 0] },
  { bpm: 100, root: 59, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 8, 5, 7] },
  { bpm: 92, root: 49, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 8, 3, 10] },
  { bpm: 124, root: 52, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 1, 0, 10] },
  { bpm: 128, root: 55, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 8, 5, 10] },
  { bpm: 120, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 10, 8, 0] },
];

function midi(root: number, semi: number) {
  return 440 * Math.pow(2, (root + semi - 69) / 12);
}

export class Music {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private bus: GainNode | null = null;
  private timer = 0;
  private next = 0;
  private step = 0;
  private chapter = 0;
  private boss = false;
  private hot = false;
  private on = false;
  volume = 0.55;
  private noise: AudioBuffer | null = null;

  attach(ctx: AudioContext) {
    if (this.ctx) return;
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.volume;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.knee.value = 12;
    comp.ratio.value = 3;
    this.bus = ctx.createGain();
    this.bus.gain.value = 1;
    this.bus.connect(comp);
    comp.connect(this.master);
    this.master.connect(ctx.destination);
    const len = Math.floor(ctx.sampleRate * 1.2);
    this.noise = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = this.noise.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.35));
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master) this.master.gain.value = v;
  }

  duck() {
    if (!this.bus || !this.ctx) return;
    const t = this.ctx.currentTime;
    this.bus.gain.cancelScheduledValues(t);
    this.bus.gain.setValueAtTime(0.6, t);
    this.bus.gain.linearRampToValueAtTime(1, t + 0.4);
  }

  play(chapter: number, boss: boolean, menu: boolean) {
    this.on = true;
    this.chapter = menu ? 0 : Math.max(1, Math.min(10, chapter));
    this.boss = boss;
    this.hot = boss;
  }

  stop() {
    this.on = false;
    this.next = 0;
  }

  tick(now: number, enemies: number, gauntlet: boolean) {
    if (!this.on || !this.ctx || !this.bus) return;
    const song = CHAPTERS[this.chapter] ?? CHAPTERS[1];
    const bpm = song.bpm + (this.boss ? 6 : 0);
    const spb = 60 / bpm;
    const eighth = spb / 2;
    // after a pause, the shop or a muted stretch, start fresh instead of
    // firing every missed note at once
    if (this.next === 0 || this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + 0.05;
    while (this.next < this.ctx.currentTime + 0.1 && this.next < now + 5) {
      const beat = this.step % 8;
      const bar = Math.floor(this.step / 8) % 4;
      const chord = song.prog[bar] ?? 0;
      const drum = enemies > 8 || this.hot;
      const lead = this.hot || gauntlet;
      if (beat % 2 === 0) this.tone(midi(song.root, chord - 24), this.next, eighth * 1.6, "sawtooth", 0.04, 280);
      if (this.chapter !== 0 && beat % 2 === 1) this.tone(midi(song.root, chord + song.scale[beat % song.scale.length]), this.next, eighth * 0.8, "triangle", 0.03, 1400);
      if (drum && beat % 2 === 0) this.kick(this.next);
      if (drum && beat === 2) this.snare(this.next);
      if (drum && this.chapter !== 0) this.hat(this.next);
      if (lead && beat % 2 === 0) {
        const flip = Math.floor(this.step / 32) % 2 === 1 ? -1 : 1;
        const note = song.scale[(beat + bar) % song.scale.length] * flip;
        this.tone(midi(song.root, chord + Math.abs(note) + 12), this.next, eighth, "square", 0.025, 1800);
      }
      this.next += eighth;
      this.step += 1;
    }
  }

  private tone(freq: number, when: number, dur: number, type: OscillatorType, gain: number, cut: number) {
    if (!this.ctx || !this.bus) return;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const g = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(Math.max(40, freq), when);
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(cut, when);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(gain, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    osc.connect(filter);
    filter.connect(g);
    g.connect(this.bus);
    osc.start(when);
    osc.stop(when + dur + 0.02);
  }

  private kick(when: number) {
    if (!this.ctx || !this.bus) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(150, when);
    osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
    g.gain.setValueAtTime(0.2, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
    osc.connect(g);
    g.connect(this.bus);
    osc.start(when);
    osc.stop(when + 0.16);
  }

  private snare(when: number) {
    if (!this.ctx || !this.bus || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 1800;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.12, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.12);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.bus);
    src.start(when);
    src.stop(when + 0.14);
  }

  private hat(when: number) {
    if (!this.ctx || !this.bus || !this.noise) return;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "highpass";
    filter.frequency.value = 7000;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.035, when);
    g.gain.exponentialRampToValueAtTime(0.0001, when + 0.04);
    src.connect(filter);
    filter.connect(g);
    g.connect(this.bus);
    src.start(when);
    src.stop(when + 0.05);
  }
}
