import {
  LEVELS,
  bossHp,
  bulletScale,
  buySkin,
  buyUpgrade,
  cadenceScale,
  chapterOf,
  equipSkin,
  isBossLevel,
  loadFile,
  loadoutOf,
  salvageMul,
  writeFile,
  type Campaign,
  type RunSnap,
  type SkinId,
  type UpgradeId,
} from "./meta";

export let WORLD_W = 1280;
export let WORLD_H = 720;

export type Kind = "dart" | "wedge" | "cruiser" | "drone" | "boss";
export type PickupKind = "W" | "S" | "B" | "M" | "$";
export type Mode = "menu" | "shop" | "options" | "standby" | "play" | "pause" | "over" | "clear" | "victory";
export type Motion = "rank" | "sine" | "swoop" | "pincer" | "hold" | "boss";
export type Cue = "kill" | "big" | "hit" | "graze" | "pickup" | "hurt" | "shield" | "bomb" | "wave" | "boss" | "clean" | "drive";

export type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  friendly: boolean;
  dmg: number;
  life: number;
  homing: boolean;
  grazed: boolean;
  hot: boolean;
  tint: number;
};

export type Enemy = {
  kind: Kind;
  x: number;
  y: number;
  ox: number;
  vx: number;
  vy: number;
  hp: number;
  max: number;
  r: number;
  t: number;
  fire: number;
  score: number;
  spin: number;
  motion: Motion;
  flash: number;
  drop?: PickupKind;
  dropValue: number;
  mark: number;
  oy: number;
  ch: number;
  look: number;
};

export type Pickup = { kind: PickupKind; x: number; y: number; vx: number; vy: number; value: number; rest: number };
export type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
  rot: number;
  vr: number;
  w: number;
  h: number;
  chunk: boolean;
};
export type Floater = { x: number; y: number; text: string; life: number; ember: boolean };
export type Ring = { x: number; y: number; r: number; life: number; max: number; color: string; width: number };

export type Player = {
  x: number;
  y: number;
  lives: number;
  inv: number;
  weapon: number;
  feed: number;
  bombs: number;
  shield: boolean;
  fireCd: number;
  alive: boolean;
  speedUp: number;
  bank: number;
  muzzle: number;
};

export type World = {
  mode: Mode;
  time: number;
  wave: number;
  banner: string;
  bannerT: number;
  between: number;
  resolved: boolean;
  spawns: Spawn[];
  spawnClock: number;
  bossUp: boolean;
  player: Player;
  bullets: Bullet[];
  enemies: Enemy[];
  pickups: Pickup[];
  parts: Particle[];
  floaters: Floater[];
  rings: Ring[];
  cues: Cue[];
  score: number;
  best: number;
  record: boolean;
  chain: number;
  chainT: number;
  perfect: boolean;
  trauma: number;
  flash: number;
  hitstop: number;
  grazeCd: number;
  reduce: boolean;
  touch: boolean;
  formX: number;
  formDir: number;
  level: number;
  meta: Campaign;
  snap: RunSnap | null;
  clearCash: number;
  clearing: boolean;
  lootT: number;
  lockShake: boolean;
  returnMode: Mode;
  stars: { x: number; y: number; z: number; s: number }[];
  rng: () => number;
};

export type InputState = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  focus: boolean;
  fire: boolean;
  bomb: boolean;
  pointer: { x: number; y: number } | null;
};

type Spawn = {
  at: number;
  kind: Kind;
  x: number;
  motion: Motion;
  drop?: PickupKind;
  value?: number;
  vx?: number;
  spin?: number;
  oy?: number;
};

const BEST_KEY = "wingbreaker.best.v1";

function laneTop() {
  return WORLD_H * 0.58;
}

export function fitWorld(w: World, cssW: number, cssH: number) {
  const nw = Math.max(320, Math.round(cssW));
  const nh = Math.max(420, Math.round(cssH));
  if (nw === WORLD_W && nh === WORLD_H) return;
  const sx = nw / WORLD_W;
  const sy = nh / WORLD_H;
  WORLD_W = nw;
  WORLD_H = nh;
  const place = (o: { x: number; y: number }) => {
    o.x *= sx;
    o.y *= sy;
  };
  place(w.player);
  w.player.x = clamp(w.player.x, 22, WORLD_W - 22);
  w.player.y = clamp(w.player.y, laneTop(), WORLD_H - 36);
  for (const s of w.stars) {
    s.x *= sx;
    s.y = ((s.y * sy) % WORLD_H + WORLD_H) % WORLD_H;
  }
  const want = Math.round((WORLD_W * WORLD_H) / 5200);
  while (w.stars.length < want) {
    w.stars.push({
      x: w.rng() * WORLD_W,
      y: w.rng() * WORLD_H,
      z: 0.3 + w.rng() * 1.3,
      s: w.rng() < 0.14 ? 1.7 : 1,
    });
  }
  if (w.stars.length > want + 30) w.stars.length = want;
  for (const e of w.enemies) {
    e.x *= sx;
    e.y *= sy;
    e.ox *= sx;
    e.oy *= sy;
  }
  for (const b of w.bullets) place(b);
  for (const pk of w.pickups) place(pk);
  for (const part of w.parts) place(part);
  for (const r of w.rings) place(r);
  for (const s of w.spawns) s.x *= sx;
}

let reduceMotion = false;
let coarsePointer = false;

export function setReduceMotion(on: boolean) {
  reduceMotion = on;
}

export function setCoarsePointer(on: boolean) {
  coarsePointer = on;
}

export function loadBest(): number {
  try {
    return Number(localStorage.getItem(BEST_KEY) || 0) || 0;
  } catch {
    return 0;
  }
}

export function saveBest(n: number) {
  try {
    localStorage.setItem(BEST_KEY, String(n));
  } catch {
    /* private mode */
  }
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWorld(best = 0): World {
  const file = loadFile();
  if (best > file.campaign.best) file.campaign.best = best;
  const stars = [];
  const rng = mulberry32(0x51f);
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: rng() * WORLD_W,
      y: rng() * WORLD_H,
      z: 0.2 + rng() * 1.5,
      s: rng() < 0.12 ? 1.7 : 1,
    });
  }
  return {
    mode: "menu",
    time: 0,
    wave: file.campaign.level,
    banner: "",
    bannerT: 0,
    between: 0,
    resolved: false,
    spawns: [],
    spawnClock: 0,
    bossUp: false,
    player: freshPlayer(),
    bullets: [],
    enemies: [],
    pickups: [],
    parts: [],
    floaters: [],
    rings: [],
    cues: [],
    score: 0,
    best: file.campaign.best,
    record: false,
    chain: 0,
    chainT: 0,
    perfect: true,
    trauma: 0,
    flash: 0,
    hitstop: 0,
    grazeCd: 0,
    reduce: reduceMotion || !file.campaign.shake,
    touch: coarsePointer,
    formX: 0,
    formDir: 1,
    level: file.campaign.level,
    meta: file.campaign,
    snap: file.run,
    clearCash: 0,
    clearing: false,
    lootT: 0,
    lockShake: reduceMotion,
    returnMode: "menu",
    stars,
    rng,
  };
}

function freshPlayer(): Player {
  return {
    x: WORLD_W / 2,
    y: WORLD_H - 110,
    lives: 3,
    inv: 0,
    weapon: 1,
    feed: 0,
    bombs: 2,
    shield: false,
    fireCd: 0,
    alive: true,
    speedUp: 0,
    bank: 0,
    muzzle: 0,
  };
}

export function startRun(w: World) {
  startSortie(w);
}

function liveSnap(w: World): RunSnap {
  const p = w.player;
  return {
    level: w.level,
    lives: Math.max(1, p.lives),
    weapon: p.weapon,
    bombs: p.bombs,
    shield: p.shield,
    score: w.score,
    feed: p.feed,
  };
}

export function persist(w: World, run: RunSnap | null) {
  w.meta.best = Math.max(w.meta.best, w.best);
  w.meta.level = clamp(w.meta.level, 1, LEVELS);
  w.snap = run;
  writeFile(w.meta, run);
  saveBest(w.meta.best);
}

export function saveNow(w: World) {
  const live = w.mode === "play" || w.mode === "pause";
  persist(w, live ? liveSnap(w) : w.snap);
}

export function openMode(w: World, mode: Mode) {
  if ((mode === "shop" || mode === "options") && w.mode !== "shop" && w.mode !== "options") {
    w.returnMode = w.mode === "play" ? "pause" : w.mode;
  }
  w.mode = mode;
  w.player.speedUp = 0;
}

export function closeOverlay(w: World) {
  const back = w.returnMode;
  w.mode = back === "play" ? "pause" : back;
  w.player.speedUp = 0;
}

export function newMission(w: World) {
  w.meta.level = 1;
  w.meta.cleared = false;
  w.level = 1;
  w.score = 0;
  w.record = false;
  persist(w, null);
  w.mode = "menu";
}

function bumpSnap(w: World) {
  if (!w.snap) return;
  const kit = loadoutOf(w.meta);
  w.snap = {
    ...w.snap,
    lives: Math.max(w.snap.lives, kit.lives),
    weapon: Math.max(w.snap.weapon, kit.weapon),
    bombs: Math.max(w.snap.bombs, kit.bombs),
  };
}

export function purchaseUpgrade(w: World, id: UpgradeId) {
  const result = buyUpgrade(w.meta, id);
  if (result === "ok") {
    bumpSnap(w);
    persist(w, w.snap);
  }
  return result;
}

export function purchaseSkin(w: World, id: SkinId) {
  const result = buySkin(w.meta, id);
  if (result === "ok") persist(w, w.snap);
  return result;
}

export function wearSkin(w: World, id: SkinId) {
  if (!equipSkin(w.meta, id)) return false;
  persist(w, w.snap);
  return true;
}

export function setShake(w: World, on: boolean) {
  w.meta.shake = on;
  w.reduce = w.lockShake || !on;
  persist(w, w.snap);
}

export function setMuted(w: World, on: boolean) {
  w.meta.mute = on;
  persist(w, w.snap);
}

function resetField(w: World) {
  w.bullets = [];
  w.enemies = [];
  w.pickups = [];
  w.parts = [];
  w.floaters = [];
  w.rings = [];
  w.spawns = [];
  w.spawnClock = 0;
  w.between = 0;
  w.resolved = false;
  w.bossUp = false;
  w.clearing = false;
  w.lootT = 0;
  w.clearCash = 0;
  w.chain = 0;
  w.chainT = 0;
  w.formX = 0;
  w.formDir = 1;
  w.hitstop = 0;
  w.flash = 0;
  w.trauma = 0;
  w.banner = "";
  w.bannerT = 0;
  w.perfect = true;
}

function parkPlayer(w: World, snap: RunSnap | null) {
  const kit = loadoutOf(w.meta);
  const p = w.player;
  p.x = WORLD_W / 2;
  p.y = Math.max(laneTop(), WORLD_H - 110);
  p.lives = snap?.lives ?? kit.lives;
  p.weapon = snap?.weapon ?? kit.weapon;
  p.bombs = snap?.bombs ?? kit.bombs;
  p.shield = snap?.shield ?? false;
  p.feed = snap?.feed ?? 0;
  p.inv = 1.35;
  p.alive = true;
  p.fireCd = 0.2;
  p.speedUp = 0;
  p.bank = 0;
  p.muzzle = 0;
  w.score = snap?.score ?? 0;
}

export function startSortie(w: World, snap?: RunSnap | null) {
  const use = snap ?? null;
  const n = clamp(use?.level ?? w.meta.level, 1, LEVELS);
  resetField(w);
  w.level = n;
  w.wave = n;
  w.meta.level = n;
  w.record = false;
  parkPlayer(w, use);
  w.mode = "play";
  w.rng = mulberry32((Math.random() * 1e9) | 0);
  launchLevel(w);
  persist(w, liveSnap(w));
}

export function resumeSaved(w: World) {
  if (!w.snap) return false;
  startSortie(w, w.snap);
  return true;
}

export function retryLevel(w: World) {
  w.meta.level = clamp(w.level || w.meta.level, 1, LEVELS);
  startSortie(w, null);
}

export function startOrResume(w: World) {
  if (w.snap) startSortie(w, w.snap);
  else startSortie(w, null);
}

export function nextLevel(w: World) {
  if (w.level >= LEVELS) {
    w.mode = "victory";
    return;
  }
  const kit = loadoutOf(w.meta);
  startSortie(w, {
    level: w.level + 1,
    lives: kit.lives,
    weapon: Math.max(w.player.weapon, kit.weapon),
    bombs: Math.max(w.player.bombs, kit.bombs),
    shield: w.player.shield,
    score: w.score,
    feed: w.player.feed,
  });
}

function launchLevel(w: World) {
  const n = w.level;
  const ch = chapterOf(n);
  if (isBossLevel(n)) {
    w.banner = ch.boss.toUpperCase();
    w.bannerT = 1.8;
    w.bossUp = true;
    w.cues.push("boss");
    spawnEnemy(w, "boss", WORLD_W / 2, "boss", undefined, -48);
    return;
  }
  w.banner = `${ch.name.toUpperCase()}  ${String(n).padStart(2, "0")}`;
  w.bannerT = 1.25;
  w.cues.push("wave");
  const list = layout(n);
  grant(list, n);
  w.spawns = list;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function grant(list: Spawn[], level: number) {
  const slot = ((level - 1) % 10) + 1;
  const give = (drop: PickupKind, value = 0, prefer?: Kind) => {
    const pool = list.filter((item) => !item.drop && (!prefer || item.kind === prefer));
    const fallback = pool.length ? pool : list.filter((item) => !item.drop);
    if (!fallback.length) return;
    fallback.sort((a, b) => Math.abs(a.x - WORLD_W / 2) - Math.abs(b.x - WORLD_W / 2));
    const pick = fallback[Math.min(1, fallback.length - 1)];
    pick.drop = drop;
    pick.value = value;
  };
  if (slot === 5 || slot === 9) give("W");
  else if (slot === 4 || slot === 8) give("S");
  else if (slot === 6) give("B");
  give("$", 10 + level * 2, "dart");
}

function layout(n: number): Spawn[] {
  const slot = ((n - 1) % 10) + 1;
  const ch = Math.floor((n - 1) / 10);
  const out: Spawn[] = [];
  const H = WORLD_H;
  const dartCols = Math.min(Math.round(WORLD_W / 108), 6 + Math.floor(ch / 2) + (slot >= 8 ? 1 : 0));
  const cols = Math.max(5, dartCols);
  const rank = (at: number, kind: Kind, motion: Motion, count: number, oy: number, inset = Math.max(78, WORLD_W * 0.1)) => {
    pushRow(out, at, kind, motion, count, inset, oy);
  };

  if (slot === 1) {
    rank(0.05, "dart", "rank", cols, H * 0.12);
    rank(0.55, "dart", "rank", Math.max(4, cols - 1), H * 0.24);
  } else if (slot === 2) {
    rank(0.05, "dart", "rank", cols, H * 0.12);
    rank(0.7, "wedge", "rank", Math.max(4, cols - 2), H * 0.26);
  } else if (slot === 3) {
    const gap = clamp(WORLD_W * 0.14, 70, 180);
    const mids = 1 + Math.min(3, Math.floor(ch / 2));
    for (let i = 0; i < mids; i++) {
      out.push({ at: 0.12 + i * 0.18, kind: "wedge", x: WORLD_W / 2 - gap, motion: "sine", spin: i, oy: H * 0.16 });
      out.push({ at: 0.12 + i * 0.18, kind: "wedge", x: WORLD_W / 2 + gap, motion: "sine", spin: i + 1, oy: H * 0.16 });
    }
    out.push({ at: 0.2, kind: "wedge", x: WORLD_W / 2, motion: "sine", oy: H * 0.28 });
    rank(0.85, "dart", "rank", Math.max(5, cols - 1), H * 0.36);
  } else if (slot === 4) {
    const count = Math.min(14, 7 + ch);
    for (let i = 0; i < count; i++) {
      out.push({
        at: 0.08 + (i % 5) * 0.16,
        kind: i % 3 === 0 ? "wedge" : "dart",
        x: 90 + (i / Math.max(1, count - 1)) * (WORLD_W - 180),
        motion: "swoop",
        spin: i,
        oy: H * (0.14 + (i % 3) * 0.07),
      });
    }
  } else if (slot === 5) {
    out.push({ at: 0.15, kind: "cruiser", x: WORLD_W * 0.28, motion: "hold", oy: H * 0.15 });
    out.push({ at: 0.15, kind: "cruiser", x: WORLD_W * 0.72, motion: "hold", oy: H * 0.15 });
    if (ch >= 5) out.push({ at: 0.4, kind: "cruiser", x: WORLD_W * 0.5, motion: "hold", oy: H * 0.28 });
    rank(0.7, "dart", "rank", cols, H * 0.34);
  } else if (slot === 6) {
    const nP = Math.min(8, 4 + Math.floor(ch / 2));
    for (let i = 0; i < nP; i++) {
      const left = i % 2 === 0;
      out.push({
        at: 0.12 + i * 0.22,
        kind: i % 3 === 2 ? "drone" : "wedge",
        x: left ? Math.max(64, WORLD_W * 0.08) : WORLD_W - Math.max(64, WORLD_W * 0.08),
        motion: "pincer",
        vx: left ? 140 : -140,
        oy: H * (0.16 + (i % 3) * 0.08),
      });
    }
    rank(0.4, "dart", "rank", Math.max(5, cols - 1), H * 0.18);
  } else if (slot === 7) {
    const drones = Math.min(8, 4 + Math.floor(ch / 2));
    for (let i = 0; i < drones; i++) {
      out.push({
        at: 0.1 + i * 0.16,
        kind: "drone",
        x: 70 + (i / Math.max(1, drones - 1)) * (WORLD_W - 140),
        motion: "sine",
        oy: H * 0.2,
        spin: i,
      });
    }
    rank(0.85, "wedge", "rank", Math.max(4, cols - 2), H * 0.34);
  } else if (slot === 8) {
    out.push({ at: 0.1, kind: "cruiser", x: WORLD_W * 0.22, motion: "hold", oy: H * 0.14 });
    out.push({ at: 0.1, kind: "cruiser", x: WORLD_W * 0.78, motion: "hold", oy: H * 0.14 });
    const count = Math.min(12, 6 + Math.floor(ch / 2));
    for (let i = 0; i < count; i++) {
      out.push({
        at: 0.35 + (i % 4) * 0.14,
        kind: i % 2 ? "wedge" : "dart",
        x: 50 + (i / Math.max(1, count - 1)) * (WORLD_W - 100),
        motion: "swoop",
        spin: i * 0.7,
        oy: H * (0.22 + (i % 2) * 0.1),
      });
    }
  } else {
    rank(0.05, "dart", "rank", cols, H * 0.11);
    rank(0.45, "wedge", "sine", Math.max(4, cols - 2), H * 0.22);
    out.push({ at: 0.3, kind: "cruiser", x: WORLD_W * 0.32, motion: "hold", oy: H * 0.16 });
    out.push({ at: 0.3, kind: "cruiser", x: WORLD_W * 0.68, motion: "hold", oy: H * 0.16 });
    const drones = Math.min(6, 3 + Math.floor(ch / 3));
    for (let i = 0; i < drones; i++) {
      out.push({
        at: 0.9 + i * 0.18,
        kind: "drone",
        x: WORLD_W * (0.2 + (i / Math.max(1, drones - 1)) * 0.6),
        motion: "sine",
        oy: H * 0.36,
      });
    }
    if (ch >= 4) {
      out.push({ at: 1.2, kind: "wedge", x: Math.max(64, WORLD_W * 0.08), motion: "pincer", vx: 120, oy: H * 0.3 });
      out.push({ at: 1.2, kind: "wedge", x: WORLD_W - Math.max(64, WORLD_W * 0.08), motion: "pincer", vx: -120, oy: H * 0.3 });
    }
  }
  return out;
}

function pushRow(out: Spawn[], at: number, kind: Kind, motion: Motion, cols: number, inset: number, oy: number) {
  const span = WORLD_W - inset * 2;
  for (let i = 0; i < cols; i++) {
    const x = cols === 1 ? WORLD_W / 2 : inset + (span * i) / (cols - 1);
    out.push({ at, kind, x, motion, spin: i * 0.45, oy });
  }
}

function spawnEnemy(w: World, kind: Kind, x: number, motion: Motion, drop?: PickupKind, y = -28, vx = 0, spin?: number, oy?: number, value = 0) {
  const level = Math.max(1, w.level);
  const ch = Math.min(9, Math.floor((level - 1) / 10));
  let hp = 1;
  let r = 11;
  let score = 80 + level;
  let vy = 72;
  if (kind === "drone") {
    hp = Math.min(5, 2 + Math.floor((level - 1) / 20));
    r = 12;
    score = 140 + level * 2;
    vy = 78;
  } else if (kind === "wedge") {
    hp = Math.min(9, 3 + Math.floor((level - 1) / 11));
    r = 15;
    score = 160 + level * 2;
    vy = 64;
  } else if (kind === "cruiser") {
    hp = Math.min(18, 5 + Math.floor((level - 1) / 7) + Math.floor(ch / 3));
    r = 22;
    score = 320 + level * 3;
    vy = 42;
  } else if (kind === "boss") {
    hp = bossHp(level);
    r = 40;
    score = 4000 + level * 40;
    vy = 46;
  }
  const fire =
    motion === "swoop" ? 0.35 : kind === "boss" ? 1.35 : kind === "dart" ? 1.15 + w.rng() * 0.4 : 0.75 + w.rng() * 0.35;
  w.enemies.push({
    kind,
    x,
    y,
    ox: x,
    vx,
    vy,
    hp,
    max: hp,
    r,
    t: 0,
    fire,
    score,
    spin: spin ?? w.rng() * Math.PI * 2,
    motion,
    flash: 0,
    drop,
    dropValue: value,
    mark: 0,
    oy: oy ?? (kind === "boss" ? Math.min(WORLD_H * 0.18, 132) : kind === "cruiser" ? WORLD_H * 0.16 : WORLD_H * 0.22),
    ch,
    look:
      kind === "boss"
        ? ch
        : ((level - 1) % 10 + (Math.round((spin ?? 0) / 0.45) % 3) * 3) % 10,
  });
}

function burst(w: World, x: number, y: number, color: string, n: number, speed: number, chunk = false) {
  const count = w.reduce ? Math.max(1, Math.ceil(n * 0.35)) : n;
  for (let i = 0; i < count; i++) {
    if (w.parts.length > 220) w.parts.shift();
    const a = w.rng() * Math.PI * 2;
    const s = speed * (0.35 + w.rng() * 0.75);
    const size = chunk ? 2.2 + w.rng() * 3.4 : 1.2 + w.rng() * 1.6;
    w.parts.push({
      x,
      y,
      vx: Math.cos(a) * s,
      vy: Math.sin(a) * s,
      life: (chunk ? 0.35 : 0.18) + w.rng() * 0.28,
      max: 0.55,
      color,
      rot: w.rng() * 6,
      vr: (w.rng() - 0.5) * (chunk ? 10 : 4),
      w: size,
      h: chunk ? size * (0.45 + w.rng() * 0.5) : size,
      chunk,
    });
  }
}

function ring(w: World, x: number, y: number, color: string, life: number, start: number, width: number) {
  if (w.reduce && life < 0.2) return;
  if (w.rings.length > 22) w.rings.shift();
  w.rings.push({ x, y, r: start, life, max: life, color, width });
}

function float(w: World, x: number, y: number, text: string, ember = false) {
  if (w.floaters.length > 8) w.floaters.shift();
  w.floaters.push({ x, y, text, life: 0.8, ember });
}

function addTrauma(w: World, amount: number) {
  if (w.reduce) return;
  w.trauma = Math.min(1, w.trauma + amount);
}

function addScore(w: World, base: number, x: number, y: number, show: boolean) {
  const mult = multiplierOf(w);
  const gained = Math.round(base * mult);
  w.score += gained;
  const prev = w.chain;
  w.chain = Math.min(40, w.chain + 1);
  w.chainT = 1.75;
  if (show || w.chain >= 10) float(w, x, y - 8, String(gained), gained >= 200);
  if ((prev < 10 && w.chain >= 10) || (prev < 20 && w.chain >= 20) || (prev < 30 && w.chain >= 30)) {
    float(w, x, y - 26, `x${multiplierOf(w).toFixed(1)}`, true);
  }
}

function bank(w: World, amount: number, x: number, y: number, show: boolean) {
  const n = Math.max(1, Math.round(amount * salvageMul(w.meta.upgrades.salvage)));
  w.meta.dollars += n;
  if (show) {
    float(w, x, y - 18, `+$${n}`, true);
    w.cues.push("pickup");
  }
}

function killEnemy(w: World, e: Enemy) {
  const big = e.kind === "boss" || e.kind === "cruiser";
  const pal = chapterOf(Math.max(1, e.ch * 10 + 1));
  burst(w, e.x, e.y, pal.edge, big ? 16 : 8, big ? 200 : 130, true);
  burst(w, e.x, e.y, e.kind === "boss" ? pal.accent : pal.flame, big ? 12 : 5, 160, false);
  ring(w, e.x, e.y, big ? pal.accent : pal.edge, big ? 0.38 : 0.18, e.r, big ? 2 : 1);
  addTrauma(w, e.kind === "boss" ? 0.75 : e.kind === "cruiser" ? 0.4 : 0.14);
  if (e.kind === "boss") w.hitstop = 0.075;
  else if (e.kind === "cruiser") w.hitstop = 0.028;
  w.cues.push(big ? "big" : "kill");
  addScore(w, e.score, e.x, e.y, big);
  if (e.kind === "boss") {
    bossLoot(w, e);
    return;
  }
  const purse = e.kind === "cruiser" ? 8 : e.kind === "wedge" ? 4 : 2;
  bank(w, purse + Math.floor(w.level / 12), e.x, e.y, e.kind === "cruiser");
  if (e.drop) {
    dropPickup(w, e.drop, e.x, e.y, e.dropValue);
  } else {
    const chance = e.kind === "cruiser" ? 0.16 : e.kind === "wedge" ? 0.07 : e.kind === "drone" ? 0.06 : 0.03;
    if (w.rng() < chance) {
      const roll = w.rng();
      const kind: PickupKind = roll < 0.55 ? "$" : roll < 0.75 ? "M" : roll < 0.9 ? "S" : roll < 0.97 ? "B" : "W";
      dropPickup(w, kind, e.x, e.y, kind === "$" ? 8 + w.level : 0);
    }
  }
}

function bossLoot(w: World, e: Enemy) {
  const base = 28 + w.level * 3;
  const items: { kind: PickupKind; value: number }[] = [
    { kind: "$", value: base },
    { kind: "$", value: base + 10 },
    { kind: "W", value: 0 },
    { kind: "$", value: Math.round(base * 1.4) },
    { kind: "S", value: 0 },
    { kind: "B", value: 0 },
    { kind: "$", value: base + 18 },
    { kind: "M", value: 0 },
  ];
  items.forEach((item, i) => {
    const a = -Math.PI * 0.15 + (i / (items.length - 1)) * Math.PI * 1.3;
    w.pickups.push({
      kind: item.kind,
      value: item.value,
      x: e.x,
      y: e.y + 8,
      vx: Math.cos(a) * 42,
      vy: 62 + (i % 4) * 14,
      rest: 0,
    });
  });
  float(w, e.x, e.y - 36, "ŁUP", true);
}

function takePickup(w: World, kind: PickupKind, value: number) {
  const p = w.player;
  if (kind === "W") {
    if (p.weapon < 6) {
      p.weapon += 1;
      w.cues.push("pickup");
      float(w, p.x, p.y - 28, `BROŃ ${p.weapon}`, true);
    } else {
      p.feed = 6.5;
      w.cues.push("drive");
      float(w, p.x, p.y - 28, "DOPALENIE", true);
    }
  } else if (kind === "S") {
    p.shield = true;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "TARCZA");
  } else if (kind === "B") {
    p.bombs = Math.min(5, p.bombs + 1);
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "BOMBA", true);
  } else if (kind === "$") {
    bank(w, value || 10, p.x, p.y, true);
  } else {
    w.chain = Math.min(40, w.chain + 8);
    w.chainT = 2.1;
    w.cues.push("drive");
    float(w, p.x, p.y - 28, "SERIA", true);
  }
}

function dropPickup(w: World, kind: PickupKind, x: number, y: number, value = 0) {
  const dir = Math.sign(w.player.x - x) || (w.rng() < 0.5 ? -1 : 1);
  w.pickups.push({ kind, x, y, vx: dir * 22, vy: 78, value, rest: 0 });
}

function hurtPlayer(w: World) {
  const p = w.player;
  if (!p.alive || p.inv > 0) return;
  if (p.shield) {
    p.shield = false;
    p.inv = 0.4;
    burst(w, p.x, p.y, "#7eb6d6", 12, 150, false);
    ring(w, p.x, p.y, "#7eb6d6", 0.28, 8, 1.5);
    addTrauma(w, 0.28);
    w.cues.push("shield");
    return;
  }
  p.lives -= 1;
  p.inv = 1.85;
  w.chain = 0;
  w.perfect = false;
  if (p.weapon > 1) {
    p.weapon -= 1;
    p.feed = 0;
    float(w, p.x, p.y - 46, `BROŃ ${p.weapon}`);
  }
  w.flash = 0.22;
  addTrauma(w, 0.66);
  burst(w, p.x, p.y, "#e07a3d", 18, 200, true);
  w.bullets = w.bullets.filter((b) => b.friendly);
  w.cues.push("hurt");
  if (p.lives <= 0) {
    p.alive = false;
    w.mode = "over";
    w.clearing = false;
    w.record = w.score > w.best;
    if (w.record) w.best = w.score;
    w.meta.best = Math.max(w.meta.best, w.best);
    w.meta.level = clamp(w.level, 1, LEVELS);
    persist(w, w.snap);
    w.cues.push("big");
  }
}

function firePlayer(w: World) {
  const p = w.player;
  const feed = p.feed > 0;
  const lvl = p.weapon;
  const side = lvl >= 3 ? 34 : 12;
  const shots: { ox: number; vx: number; vy: number; homing?: boolean; r?: number; dmg?: number }[] = [];
  shots.push({ ox: 0, vx: 0, vy: -740 });
  if (lvl >= 2) {
    shots.push({ ox: -8, vx: -side, vy: -720 });
    shots.push({ ox: 8, vx: side, vy: -720 });
  }
  if (lvl >= 4) shots.push({ ox: 0, vx: 0, vy: -840, r: 3.1, dmg: 1.45 });
  if (lvl >= 5) shots.push({ ox: 0, vx: 0, vy: -480, homing: true, r: 3 });
  if (lvl >= 6) {
    shots.push({ ox: -16, vx: -58, vy: -680 });
    shots.push({ ox: 16, vx: 58, vy: -680 });
  }
  for (const s of shots) {
    if (w.bullets.length > 160) break;
    w.bullets.push({
      x: p.x + s.ox,
      y: p.y - 20,
      vx: s.vx,
      vy: s.vy,
      r: s.r ?? 2.1,
      friendly: true,
      dmg: s.dmg ?? 1,
      life: 1.2,
      homing: !!s.homing,
      grazed: false,
      hot: feed,
      tint: 0,
    });
  }
  p.muzzle = 0.045;
  const base = 0.145 - Math.min(lvl, 6) * 0.008;
  p.fireCd = Math.max(0.072, feed ? base * 0.72 : base);
}

function enemyShoot(w: World, e: Enemy) {
  const p = w.player;
  if (!p.alive || e.y > p.y - 8) return;
  const aim = Math.atan2(p.y - e.y, p.x - e.x);
  const scale = bulletScale(w.level);
  const tint = e.ch;
  const push = (a: number, speed: number, r = 3.3) => {
    if (w.bullets.length > 240) return;
    w.bullets.push({
      x: e.x + Math.cos(a) * 4,
      y: e.y + Math.sin(a) * 4,
      vx: Math.cos(a) * speed * scale,
      vy: Math.sin(a) * speed * scale,
      r,
      friendly: false,
      dmg: 1,
      life: 4.5,
      homing: false,
      grazed: false,
      hot: false,
      tint,
    });
  };
  if (e.kind === "dart") {
    if (w.level < 2) return;
    push(Math.PI / 2, 145, 2.8);
  } else if (e.kind === "drone") {
    push(aim, 175, 2.9);
  } else if (e.kind === "wedge") {
    push(aim - 0.16, 188);
    push(aim + 0.16, 188);
  } else if (e.kind === "cruiser") {
    push(aim, 170, 3.4);
    push(Math.PI / 2 - 0.22, 150, 2.8);
    push(Math.PI / 2 + 0.22, 150, 2.8);
  } else if (e.kind === "boss") {
    bossVolley(e, push, aim);
  }
}

function bossVolley(e: Enemy, push: (a: number, speed: number, r?: number) => void, aim: number) {
  if (e.mark === 0) {
    for (const s of [-0.18, 0, 0.18]) push(aim + s, 158, 3.4);
    return;
  }
  const fast = e.mark >= 2;
  const sweep = Math.sin(e.t * (fast ? 1.15 : 0.78)) * 0.55;
  const base = Math.PI / 2 + sweep;
  const step = fast ? 0.13 : 0.15;
  const n = fast ? 6 : 5;
  for (let i = -n; i <= n; i++) {
    if (Math.abs(i) <= 1) continue;
    push(base + i * step, fast ? 156 : 138, 3.15);
  }
  if (fast) {
    push(Math.PI / 2 - 0.85, 210, 2.7);
    push(Math.PI / 2 + 0.85, 210, 2.7);
  }
}

function nearestEnemy(w: World, x: number, y: number): Enemy | null {
  let best: Enemy | null = null;
  let bestD = 1e9;
  for (const e of w.enemies) {
    if (e.hp <= 0) continue;
    const d = (e.x - x) ** 2 + (e.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = e;
    }
  }
  return best;
}

function reap(w: World) {
  const next: Enemy[] = [];
  let bossDied = false;
  for (const e of w.enemies) {
    if (e.hp <= 0) {
      if (e.kind === "boss") bossDied = true;
      killEnemy(w, e);
      continue;
    }
    next.push(e);
  }
  w.enemies = next;
  if (bossDied) {
    w.bossUp = false;
    w.banner = "ŁUP";
    w.bannerT = 1.4;
  }
}

function detonate(w: World) {
  const p = w.player;
  if (!p.alive || p.bombs <= 0 || w.mode !== "play") return;
  p.bombs -= 1;
  w.flash = 0.32;
  w.hitstop = 0.05;
  addTrauma(w, 0.85);
  w.bullets = w.bullets.filter((b) => b.friendly);
  for (const e of w.enemies) {
    e.hp -= e.kind === "boss" ? e.max * 0.18 : e.hp;
    e.flash = 0.1;
  }
  ring(w, p.x, p.y, "#e7eaee", 0.48, 12, 2);
  ring(w, p.x, WORLD_H * 0.35, "#e07a3d", 0.4, 8, 1.5);
  burst(w, p.x, p.y, "#e7eaee", 26, 280, false);
  w.cues.push("bomb");
  reap(w);
}

export function requestBomb(w: World) {
  detonate(w);
}

function present(w: World, dt: number, timers: boolean) {
  if (timers) {
    w.trauma = Math.max(0, w.trauma - dt * 2.05);
    w.flash = Math.max(0, w.flash - dt);
    w.bannerT = Math.max(0, w.bannerT - dt);
    w.chainT -= dt;
    if (w.chainT <= 0) w.chain = 0;
    w.player.feed = Math.max(0, w.player.feed - dt);
    w.player.inv = Math.max(0, w.player.inv - dt);
    w.player.muzzle = Math.max(0, w.player.muzzle - dt);
    w.grazeCd = Math.max(0, w.grazeCd - dt);
  }
  if (w.mode === "pause") return;
  for (const p of w.parts) {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 28 * dt;
    p.rot += p.vr * dt;
  }
  w.parts = w.parts.filter((p) => p.life > 0);
  for (const r of w.rings) {
    r.life -= dt;
    r.r += (r.max > 0.3 ? 260 : 110) * dt;
  }
  w.rings = w.rings.filter((r) => r.life > 0);
  for (const f of w.floaters) {
    f.life -= dt;
    f.y -= 32 * dt;
  }
  w.floaters = w.floaters.filter((f) => f.life > 0);
  for (const e of w.enemies) e.flash = Math.max(0, e.flash - dt);
}

function moveEnemy(w: World, e: Enemy, dt: number) {
  e.t += dt;
  if (e.motion === "boss") {
    const nest = Math.min(WORLD_H * 0.18, 132);
    const ch = e.ch;
    e.y += e.y < nest ? 52 * dt : 0;
    if (e.y > nest) e.y = nest + Math.sin(e.t * 1.4) * 4;
    e.x = clamp(WORLD_W / 2 + Math.sin(e.t * 0.55) * Math.min(120, WORLD_W * 0.12), edgeOf("boss"), WORLD_W - edgeOf("boss"));
    const ratio = e.hp / e.max;
    if (e.mark < 1 && ratio < 0.66) {
      e.mark = 1;
      e.fire = 0.9;
      w.banner = "PĘKNIĘCIE";
      w.bannerT = 0.75;
      spawnEnemy(w, ch >= 6 ? "drone" : "wedge", e.x - 40, "sine", undefined, e.y + 24, 0, undefined, e.y + 36);
      spawnEnemy(w, ch >= 6 ? "drone" : "wedge", e.x + 40, "sine", undefined, e.y + 24, 0, undefined, e.y + 36);
      if (ch >= 4) spawnEnemy(w, "dart", e.x, "swoop", undefined, e.y + 18, 0, 1, WORLD_H * 0.3);
    } else if (e.mark < 2 && ratio < 0.33) {
      e.mark = 2;
      e.fire = 0.7;
      w.banner = "RDZEŃ";
      w.bannerT = 0.75;
      spawnEnemy(w, "dart", e.x - 50, "swoop", undefined, e.y + 10, -90, undefined, WORLD_H * 0.28);
      spawnEnemy(w, "dart", e.x + 50, "swoop", undefined, e.y + 10, 90, undefined, WORLD_H * 0.28);
      if (ch >= 7) spawnEnemy(w, "wedge", e.x, "pincer", undefined, e.y + 16, 120, undefined, WORLD_H * 0.26);
    }
    return;
  }
  const cap = WORLD_H * 0.46;
  const goal = Math.min((e.oy > 0 ? e.oy : WORLD_H * 0.22) + Math.min(WORLD_H * 0.08, e.t * 3), cap);
  if (e.motion === "pincer") {
    if (Math.abs(e.vx) < 20) e.vx = e.ox < WORLD_W / 2 ? 130 : -130;
    e.x += e.vx * dt;
    if (e.x < edgeOf(e.kind) || e.x > WORLD_W - edgeOf(e.kind)) e.vx *= -1;
    if (e.y < goal) e.y += 110 * dt;
    else e.y = goal + Math.sin(e.t * 1.5 + e.spin) * 8;
    contain(e);
    return;
  }
  if (e.motion === "hold") {
    const nest = Math.min(e.oy || WORLD_H * 0.16, cap);
    if (e.y < nest) e.y += 64 * dt;
    else e.y = nest + Math.sin(e.t * 1.1) * 6;
    if (Math.abs(e.vx) < 20) e.vx = e.ox < WORLD_W / 2 ? 70 : -70;
    e.x += e.vx * dt;
    if (e.x < edgeOf(e.kind) || e.x > WORLD_W - edgeOf(e.kind)) e.vx *= -1;
    contain(e);
    return;
  }
  if (e.y < goal - 2) e.y += 120 * dt;
  else e.y += (goal - e.y) * Math.min(1, 5 * dt);
  const amp = e.motion === "swoop" ? 36 : e.motion === "sine" ? 16 : 4;
  const sway = Math.sin(e.t * (e.motion === "swoop" ? 1.25 : 0.8) + e.spin) * amp;
  e.x = e.ox + w.formX + sway;
  contain(e);
}

function edgeOf(kind: Kind) {
  if (kind === "boss") return Math.min(120, Math.max(92, WORLD_W * 0.11));
  if (kind === "cruiser") return Math.min(96, Math.max(70, WORLD_W * 0.08));
  return Math.min(72, Math.max(52, WORLD_W * 0.062));
}

function bodyClearance(kind: Kind) {
  if (kind === "boss") return 108;
  if (kind === "cruiser") return 72;
  if (kind === "wedge") return 54;
  return 46;
}

function contain(e: Enemy) {
  const m = edgeOf(e.kind);
  e.x = clamp(e.x, m, WORLD_W - m);
}

export function step(w: World, dt: number, input: InputState) {
  dt = Math.min(dt, 0.05);
  if (w.hitstop > 0 && w.mode === "play") {
    w.hitstop -= dt;
    w.time += dt;
    present(w, dt, true);
    return;
  }
  w.time += dt;
  const presentDt = w.mode === "play" ? dt : w.mode === "over" ? dt : dt * 0.45;
  present(w, presentDt, w.mode === "play");
  if (w.mode !== "play") {
    w.player.speedUp = 0;
    return;
  }

  const p = w.player;
  if (p.alive) {
    let ax = (input.right ? 1 : 0) - (input.left ? 1 : 0);
    let ay = (input.down ? 1 : 0) - (input.up ? 1 : 0);
    const keying = ax !== 0 || ay !== 0;
    const mag = Math.hypot(ax, ay);
    if (mag > 0) {
      ax /= mag;
      ay /= mag;
    }
    const speed = input.focus ? Math.max(170, WORLD_W * 0.16) : Math.max(340, WORLD_W * 0.46);
    let bankTarget = ax * 0.36;
    if (!keying && input.pointer) {
      const dx = input.pointer.x - p.x;
      const dy = input.pointer.y - p.y;
      const dist = Math.hypot(dx, dy) || 1;
      const spd = (input.focus ? Math.max(200, WORLD_W * 0.2) : Math.max(520, WORLD_W * 0.72)) * dt;
      const stepLen = Math.min(dist, spd);
      p.x += (dx / dist) * stepLen;
      p.y += (dy / dist) * stepLen;
      p.speedUp = dy < -1 ? Math.min(speed, Math.abs(dy) / Math.max(dt, 1e-4)) : 0;
      bankTarget = clamp(dx / 70, -1, 1) * 0.36;
    } else {
      p.x += ax * speed * dt;
      p.y += ay * speed * dt;
      p.speedUp = Math.max(0, -ay * speed);
    }
    p.x = clamp(p.x, 22, WORLD_W - 22);
    p.y = clamp(p.y, laneTop(), WORLD_H - 36);
    p.bank += (bankTarget - p.bank) * (1 - Math.exp(-12 * dt));
    p.fireCd -= dt;
    if (input.fire && p.fireCd <= 0) firePlayer(w);
  } else {
    p.speedUp = 0;
    p.bank += (0 - p.bank) * (1 - Math.exp(-8 * dt));
  }

  if (input.bomb) detonate(w);

  const stride = Math.min(28, WORLD_W * 0.028);
  w.formX += w.formDir * 62 * dt;
  if (w.formX > stride) w.formDir = -1;
  if (w.formX < -stride) w.formDir = 1;

  w.spawnClock += dt;
  if (!w.bossUp) {
    w.spawns = w.spawns.filter((s) => {
      if (w.spawnClock >= s.at) {
        spawnEnemy(w, s.kind, s.x, s.motion, s.drop, -28, s.vx ?? 0, s.spin, s.oy, s.value ?? 0);
        return false;
      }
      return true;
    });
  }

  for (const e of w.enemies) {
    if (e.hp <= 0) continue;
    moveEnemy(w, e, dt);
    e.fire -= dt;
    const heat = cadenceScale(w.level);
    let cadence = e.kind === "dart" ? 1.15 : e.kind === "drone" ? 1.25 : e.kind === "wedge" ? 1.05 : e.kind === "cruiser" ? 0.98 : e.mark === 0 ? 1.05 : e.mark === 1 ? 0.78 : 0.62;
    cadence *= heat;
    const m = edgeOf(e.kind);
    const visible =
      e.y > bodyClearance(e.kind) &&
      e.y < WORLD_H * 0.48 &&
      e.x >= m &&
      e.x <= WORLD_W - m;
    if (e.fire <= 0 && visible && (e.motion === "boss" || e.y > e.oy - 24)) {
      enemyShoot(w, e);
      e.fire = cadence;
    }
  }

  for (const b of w.bullets) {
    if (b.homing && b.friendly) {
      const target = nearestEnemy(w, b.x, b.y);
      if (target) {
        const a = Math.atan2(target.y - b.y, target.x - b.x);
        b.vx += Math.cos(a) * 1400 * dt;
        b.vy += Math.sin(a) * 1400 * dt;
        const sp = Math.hypot(b.vx, b.vy) || 1;
        const max = 700;
        if (sp > max) {
          b.vx = (b.vx / sp) * max;
          b.vy = (b.vy / sp) * max;
        }
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }

  if (p.alive) {
    const floorY = WORLD_H - 32;
    const reach = 52 + w.meta.upgrades.magnet * 18;
    for (const pk of w.pickups) {
      const landed = pk.y >= floorY - 0.5;
      if (landed) {
        const dx = p.x - pk.x;
        const adx = Math.abs(dx);
        if (adx < reach && adx > 0.01) pk.vx += Math.sign(dx) * 420 * dt;
      }
      pk.vy += 170 * dt;
      const sp = Math.hypot(pk.vx, pk.vy);
      const cap = landed ? 360 : 220;
      if (sp > cap) {
        pk.vx = (pk.vx / sp) * cap;
        pk.vy = (pk.vy / sp) * cap;
      }
      pk.x = clamp(pk.x + pk.vx * dt, 16, WORLD_W - 16);
      if (pk.y + pk.vy * dt >= floorY) {
        pk.y = floorY;
        pk.vy = 0;
        pk.vx *= 0.82;
        pk.rest += dt;
      } else {
        pk.y += pk.vy * dt;
        pk.rest = 0;
      }
    }
  } else {
    for (const pk of w.pickups) {
      pk.vy += 170 * dt;
      pk.y += pk.vy * dt;
    }
  }

  for (const b of w.bullets) {
    if (!b.friendly || b.life <= 0) continue;
    for (const e of w.enemies) {
      if (e.hp <= 0) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
        e.hp -= b.dmg;
        e.flash = 0.07;
        b.life = 0;
        burst(w, b.x, b.y, b.hot ? "#e07a3d" : "#d6eef8", 3, 70, false);
        if (e.kind === "boss" || e.kind === "cruiser") w.cues.push("hit");
        break;
      }
    }
  }

  if (p.alive && p.inv <= 0) {
    const hitR = input.focus ? 4.5 : 7;
    for (const b of w.bullets) {
      if (b.friendly || b.life <= 0) continue;
      const d = Math.hypot(b.x - p.x, b.y - p.y);
      if (d < hitR + b.r) {
        b.life = 0;
        hurtPlayer(w);
      } else if (!b.grazed && d < 26 && w.grazeCd <= 0) {
        b.grazed = true;
        w.grazeCd = 0.045;
        w.score += 15;
        w.chainT = Math.max(w.chainT, 0.45);
        w.cues.push("graze");
        ring(w, p.x, p.y, "#7eb6d6", 0.16, 6, 1);
      }
    }
    if (p.alive && p.inv <= 0) {
      for (const e of w.enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x - p.x, e.y - p.y) < e.r * 0.72 + hitR) {
          if (e.kind !== "boss") e.hp = 0;
          hurtPlayer(w);
        }
      }
    }
  }

  if (p.alive) {
    const floorY = WORLD_H - 32;
    for (const pk of w.pickups) {
      if (pk.y < floorY - 0.5) continue;
      if (Math.hypot(pk.x - p.x, pk.y - p.y) < 28) {
        pk.y = 9999;
        takePickup(w, pk.kind, pk.value);
      }
    }
  }

  reap(w);
  if (w.mode !== "play") {
    w.bullets = w.bullets.filter((b) => b.life > 0 && b.x > -30 && b.x < WORLD_W + 30 && b.y > -50 && b.y < WORLD_H + 40);
    w.pickups = w.pickups.filter((pk) => pk.y < WORLD_H + 24 && pk.x > -30 && pk.x < WORLD_W + 30);
    return;
  }

  if (w.mode === "play" && !w.bossUp && w.spawns.length === 0 && w.enemies.length === 0 && w.level > 0) {
    const floorY = WORLD_H - 32;
    const hanging = w.pickups.some((pk) => pk.y < 9000 && (pk.y < floorY - 0.5 || pk.rest < 1.25));
    if (!w.clearing) {
      w.clearing = true;
      w.banner = w.perfect ? "CZYSTO" : "WYŁOM";
      w.bannerT = 1.1;
      if (w.perfect) w.cues.push("clean");
    }
    if (!hanging) finishLevel(w);
  }

  w.bullets = w.bullets.filter((b) => b.life > 0 && b.x > -30 && b.x < WORLD_W + 30 && b.y > -50 && b.y < WORLD_H + 40);
  w.pickups = w.pickups.filter((pk) => pk.y < WORLD_H + 24 && pk.x > -30 && pk.x < WORLD_W + 30);
}

function finishLevel(w: World) {
  if (w.mode !== "play") return;
  w.pickups = w.pickups.filter((pk) => pk.y > 9000);
  const bonus = Math.round((16 + w.level * 3) * (w.perfect ? 1.55 : 1) * salvageMul(w.meta.upgrades.salvage));
  w.meta.dollars += bonus;
  w.clearCash = bonus;
  if (w.perfect) w.score += 400;
  if (w.score > w.best) {
    w.best = w.score;
    w.record = true;
  }
  w.meta.best = Math.max(w.meta.best, w.best);
  if (w.level >= LEVELS) {
    w.meta.cleared = true;
    w.meta.level = LEVELS;
    w.mode = "victory";
    persist(w, null);
  } else {
    const kit = loadoutOf(w.meta);
    w.meta.level = w.level + 1;
    w.mode = "clear";
    persist(w, {
      level: w.level + 1,
      lives: kit.lives,
      weapon: Math.max(w.player.weapon, kit.weapon),
      bombs: Math.max(w.player.bombs, kit.bombs),
      shield: w.player.shield,
      score: w.score,
      feed: w.player.feed,
    });
  }
}

export function multiplierOf(w: World) {
  return 1 + Math.min(w.chain, 30) * 0.12;
}
