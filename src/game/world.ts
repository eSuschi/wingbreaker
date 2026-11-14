import {
  LEVELS,
  FAUNA,
  buySkin,
  buyUpgrade,
  buyGun,
  chapterOf,
  equipSkin,
  isBossLevel,
  loadFile,
  loadoutOf,
  luckMul,
  gunName,
  salvageMul,
  writeFile,
  grantStars,
  starTotal,
  type Campaign,
  type RunSnap,
  type SkinId,
  type UpgradeId,
} from "./meta";
import {
  BOMB_LINES,
  BOSS_LINES,
  HONEY_RING,
  DEATH,
  FAMILIES,
  LAST_WORDS,
  arcadeStage,
  bossScript,
  clearCash,
  daySeed,
  enemyBody,
  extraLifeAt,
  aimedShare,
  fastKillLimit,
  fireBudget,
  sizeMul,
  volleySize,
  mayShoot,
  phaseIndex,
  planHazards,
  planLevel,
  podCount,
  poopShape,
  screenCap,
  starsOf,
  volley,
  type GunFamily,
  type VHazard,
} from "./v3";

export let WORLD_W = 1280;
export let WORLD_H = 720;
export let VIEW = 1;

export type Kind = "dart" | "wedge" | "cruiser" | "drone" | "boss";
export type PickupKind = "W" | "S" | "B" | "M" | "$" | "N" | "D";
export type Mode = "menu" | "shop" | "options" | "standby" | "play" | "pause" | "over" | "clear" | "victory" | "bridge" | "levels" | "guide" | "ranks" | "arcadeover";
export type Motion = "rank" | "sine" | "swoop" | "pincer" | "hold" | "boss" | "spiral" | "zigzag" | "conga" | "rain" | "dive";
export type Cue = "kill" | "big" | "hit" | "graze" | "pickup" | "hurt" | "shield" | "bomb" | "wave" | "boss" | "clean" | "drive" | "missile" | "plink";

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
  shape?: number;
  style?: number;
  pierce?: number;
  splash?: number;
  age?: number;
  bounces?: number;
  split?: boolean;
  /** enemies a piercing shot already passed through, so each is hit once */
  hit?: Enemy[];
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
  role: string;
  warn: number;
  plate: number;
  hide: number;
  /** draw and hit scale picked at spawn from the screen width */
  size?: number;
  /** true when the enemy left the screen alive: removed without a kill or rewards */
  gone?: boolean;
  /** boss charge timer (seconds into the charge), undefined when not charging */
  dash?: number;
  dashX?: number;
  /** boss banners already shown, so each one appears once */
  said?: string[];
};

export type Pickup = { kind: PickupKind; x: number; y: number; vx: number; vy: number; value: number; rest: number; hue?: number; age?: number };
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
  missiles: number;
  missileCd: number;
  family: GunFamily;
  splat: number;
  slow: number;
  insured: boolean;
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
  wing: Player | null;
  coop: boolean;
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
  bridgeT: number;
  budget: number;
  snacks: number;
  bombsUsed: number;
  born: number;
  slain: number;
  freeze: number;
  clock: number;
  hazards: VHazard[];
  arcade: boolean;
  arcadeStage: number;
  purse: number;
  replay: boolean;
  lifePaid: number;
  seed: number;
  dev: boolean;
  god: boolean;
  duck: boolean;
  deathLine: string;
  bombArmor: number;
  lockShake: boolean;
  returnMode: Mode;
  stars: { x: number; y: number; z: number; s: number }[];
  rng: () => number;
  pinned: number | null;
  starShow: string;
  daily: boolean;
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
  wingLeft?: boolean;
  wingRight?: boolean;
  wingUp?: boolean;
  wingDown?: boolean;
  wingFocus?: boolean;
  wingFire?: boolean;
  wingBomb?: boolean;
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
  role?: string;
};

const BEST_KEY = "wingbreaker.best.v1";

function laneTop() {
  return WORLD_H * 0.58;
}

export function fitWorld(w: World, cssW: number, cssH: number) {
  const safeW = Math.max(1, cssW);
  const safeH = Math.max(1, cssH);
  const nh = 720;
  const nw = Math.max(280, Math.round((nh * safeW) / safeH));
  VIEW = safeH / nh;
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
  if (w.wing) {
    place(w.wing);
    w.wing.x = clamp(w.wing.x, 22, WORLD_W - 22);
    w.wing.y = clamp(w.wing.y, laneTop(), WORLD_H - 36);
  }
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
    wing: null,
    coop: Boolean(file.run?.coop),
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
    bridgeT: 0,
    budget: 0,
    snacks: file.campaign.snacks || 0,
    bombsUsed: 0,
    born: 0,
    slain: 0,
    freeze: 0,
    clock: 0,
    hazards: [],
    arcade: false,
    arcadeStage: 0,
    purse: 0,
    replay: false,
    lifePaid: 0,
    seed: 1,
    dev: false,
    god: false,
    duck: false,
    deathLine: DEATH[0],
    bombArmor: 0,
    lockShake: reduceMotion,
    returnMode: "menu",
    stars,
    rng,
    pinned: null,
    starShow: "",
    daily: false,
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
    missiles: 0,
    missileCd: 0,
    family: "pulse",
    splat: 0,
    slow: 0,
    insured: false,
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
    coop: w.coop,
    missiles: Math.max(p.missiles, w.wing?.missiles ?? 0),
    family: p.family,
    snacks: Math.floor(w.snacks),
  };
}

export function persist(w: World, run: RunSnap | null) {
  w.meta.best = Math.max(w.meta.best, w.best);
  if (w.pinned != null) w.meta.level = w.pinned;
  w.meta.level = clamp(w.meta.level, 1, LEVELS);
  w.meta.snacks = Math.floor(w.snacks);
  grantStars(w.meta);
  if (w.pinned != null) {
    writeFile(w.meta, w.snap);
    saveBest(w.meta.best);
    return;
  }
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
  if (back === "bridge") {
    nextLevel(w);
    return;
  }
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

export function setAutoFire(w: World, on: boolean) {
  w.meta.autoFire = on;
  persist(w, w.snap);
}

export function setAutoNext(w: World, on: boolean) {
  w.meta.autoNext = on;
  persist(w, w.snap);
}

export function setMusic(w: World, value: number) {
  w.meta.music = Math.max(0, Math.min(100, Math.round(value)));
  persist(w, w.snap);
}

export function setSfx(w: World, value: number) {
  w.meta.sfx = Math.max(0, Math.min(100, Math.round(value)));
  persist(w, w.snap);
}

export function purchaseGun(w: World, family: GunFamily) {
  const result = buyGun(w.meta, family);
  if (result === "ok") persist(w, w.snap);
  return result;
}

export function ensureAutoFire(w: World, coarse: boolean) {
  if (typeof w.meta.autoFire === "boolean") return;
  w.meta.autoFire = coarse;
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
  w.budget = 0;
  w.bombsUsed = 0;
  w.born = 0;
  w.slain = 0;
  w.freeze = 0;
  w.clock = 0;
  w.hazards = [];
  w.duck = false;
  w.bombArmor = 0;
}

function parkPlayer(w: World, snap: RunSnap | null) {
  const kit = loadoutOf(w.meta);
  const p = w.player;
  p.x = WORLD_W / 2;
  p.y = Math.max(laneTop(), WORLD_H - 110);
  p.lives = w.arcade ? (snap?.lives ?? 3) : (snap?.lives ?? kit.lives);
  p.weapon = w.arcade ? (snap?.weapon ?? 1) : (snap?.weapon ?? kit.weapon);
  p.bombs = w.arcade ? (snap?.bombs ?? 2) : (snap?.bombs ?? kit.bombs);
  p.shield = w.arcade ? false : (snap?.shield ?? false);
  p.feed = snap?.feed ?? 0;
  p.missiles = w.arcade ? 0 : Math.max(kit.missiles, snap?.missiles ?? 0);
  p.missileCd = 0.4;
  p.family = w.arcade ? "pulse" : (snap?.family ?? kit.family);
  p.splat = 0;
  p.slow = 0;
  p.insured = !w.arcade && w.meta.upgrades.insurance > 0;
  p.inv = 1.35;
  p.alive = true;
  p.fireCd = 0.2;
  p.speedUp = 0;
  p.bank = 0;
  p.muzzle = 0;
  w.score = snap?.score ?? 0;
  if (w.coop) {
    const wing = freshPlayer();
    wing.weapon = p.weapon;
    wing.bombs = p.bombs;
    wing.lives = p.lives;
    wing.inv = 1.35;
    wing.fireCd = 0.2;
    wing.missiles = p.missiles;
    wing.missileCd = 0.55;
    wing.family = p.family;
    wing.alive = true;
    p.x = WORLD_W * 0.38;
    wing.x = WORLD_W * 0.62;
    wing.y = p.y;
    w.wing = wing;
  } else {
    w.wing = null;
  }
}

export function startSortie(w: World, snap?: RunSnap | null) {
  const use = snap ?? null;
  if (use && typeof use.coop === "boolean") w.coop = use.coop;
  const n = clamp(use?.level ?? w.meta.level, 1, LEVELS);
  resetField(w);
  w.level = n;
  w.wave = n;
  w.meta.level = n;
  w.record = false;
  parkPlayer(w, use);
  w.mode = "play";
  w.rng = mulberry32(w.daily && w.seed ? w.seed : (Math.random() * 1e9) | 0);
  if (!w.seed) w.seed = (Math.random() * 1e9) | 0;
  launchLevel(w);
  persist(w, liveSnap(w));
}

export function startSolo(w: World) {
  w.coop = false;
  if (w.snap) startSortie(w, { ...w.snap, coop: false });
  else startSortie(w, null);
}

export function startCoop(w: World) {
  w.coop = true;
  if (w.snap) startSortie(w, { ...w.snap, coop: true });
  else startSortie(w, null);
}

export function chooseCrew(w: World, crew: "solo" | "coop") {
  w.meta.crew = crew;
  w.pinned = null;
  w.arcade = false;
  w.daily = false;
  persist(w, w.snap);
  if (crew === "coop") startCoop(w);
  else startSolo(w);
}

export function resumeSaved(w: World) {
  if (!w.snap) return false;
  startSortie(w, w.snap);
  return true;
}

export function retryLevel(w: World) {
  if (w.arcade) {
    startArcade(w, w.daily);
    return;
  }
  if (w.pinned != null) {
    const frontier = w.pinned;
    const n = w.level;
    const kit = loadoutOf(w.meta);
    startSortie(w, {
      level: n,
      lives: kit.lives,
      weapon: kit.weapon,
      bombs: kit.bombs,
      shield: false,
      score: 0,
      feed: 0,
      coop: w.coop,
      missiles: kit.missiles,
      family: kit.family,
      snacks: Math.floor(w.snacks),
    });
    w.pinned = frontier;
    w.meta.level = frontier;
    persist(w, w.snap);
    return;
  }
  w.meta.level = clamp(w.level || w.meta.level, 1, LEVELS);
  startSortie(w, null);
}

export function practiceLevel(w: World, n: number) {
  const frontier = w.meta.level;
  if (n > frontier || n < 1) return;
  if (n < frontier && (w.meta.stars[n] ?? 0) <= 0) return;
  w.arcade = false;
  w.daily = false;
  w.pinned = n < frontier ? frontier : null;
  const kit = loadoutOf(w.meta);
  startSortie(w, {
    level: n,
    lives: kit.lives,
    weapon: kit.weapon,
    bombs: kit.bombs,
    shield: false,
    score: 0,
    feed: 0,
    coop: w.meta.crew === "coop",
    missiles: kit.missiles,
    family: kit.family,
    snacks: Math.floor(w.snacks),
  });
  if (w.pinned != null) {
    w.meta.level = w.pinned;
    persist(w, w.snap);
  }
}

export function leaveRun(w: World) {
  w.arcade = false;
  w.daily = false;
  w.pinned = null;
  w.mode = "menu";
  persist(w, w.snap);
}

export function stampRank(w: World, name: string) {
  const clean = name.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3).padEnd(3, "A");
  const row = [...w.meta.ranks].reverse().find((r) => r.name === "YOU" && r.score === w.score);
  if (row) row.name = clean;
  else w.meta.ranks = [{ name: clean, score: w.score, stage: w.arcadeStage, date: daySeed().key, skin: w.meta.skin }, ...w.meta.ranks].slice(0, 10);
  persist(w, w.snap);
}

export function startOrResume(w: World) {
  if (w.snap) startSortie(w, w.snap);
  else startSortie(w, null);
}

export function nextLevel(w: World) {
  if (w.arcade) {
    w.arcadeStage = Math.min(30, w.arcadeStage + 1);
    const spec = arcadeStage(w.arcadeStage);
    startSortie(w, {
      level: spec.level,
      lives: Math.max(1, w.player.lives),
      weapon: w.player.weapon,
      bombs: w.player.bombs,
      shield: w.player.shield,
      score: w.score,
      feed: w.player.feed,
      coop: false,
      missiles: w.player.missiles,
      family: w.player.family,
      snacks: w.snacks,
    });
    return;
  }
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
    coop: w.coop,
    missiles: Math.max(w.player.missiles, w.wing?.missiles ?? 0, kit.missiles),
    family: w.player.family,
    snacks: Math.floor(w.snacks),
  });
}

function launchLevel(w: World) {
  const n = w.level;
  const ch = chapterOf(n);
  w.clock = 0;
  w.bombsUsed = 0;
  w.born = 0;
  w.slain = 0;
  w.replay = !w.arcade && (w.meta.stars[n] ?? 0) > 0;
  const planned = planLevel(n, WORLD_W, WORLD_H, (w.seed || n * 997) + n * 13);
  w.hazards = planHazards(n, WORLD_W, WORLD_H);
  if (isBossLevel(n)) {
    const line = BOSS_LINES[Math.min(9, Math.floor((n - 1) / 10))];
    w.banner = line ? line[0] : ch.boss.toUpperCase();
    w.bannerT = 2;
    w.bossUp = true;
    w.cues.push("boss");
    spawnEnemy(w, "boss", WORLD_W / 2, "boss", undefined, -48);
    const boss = w.enemies[w.enemies.length - 1];
    if (boss && w.arcade) {
      const spec = arcadeStage(w.arcadeStage);
      if (spec.boss) {
        boss.hp = Math.round(boss.hp * spec.hpMul);
        boss.max = boss.hp;
      }
    }
    return;
  }
  w.banner = planned.banner || `${ch.name.toUpperCase()}  ${String(n).padStart(2, "0")}`;
  w.bannerT = planned.bonus ? 2.2 : 1.25;
  w.cues.push("wave");
  const list = planned.spawns.map((s) => ({
    at: s.at,
    kind: s.kind,
    x: s.x,
    motion: s.motion as Motion,
    role: s.role,
    oy: s.oy,
    vx: s.vx,
    spin: s.spin,
  }));
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
  if (slot === 2 || slot === 5 || slot === 8) give("W");
  else if (slot === 4 || slot === 9) give("S");
  else if (slot === 6) give("B");
  give("$", 8 + Math.round(level * 0.6), "dart");
}

function spawnEnemy(w: World, kind: Kind, x: number, motion: Motion, drop?: PickupKind, y = -28, vx = 0, spin?: number, oy?: number, value = 0, role = "") {
  const level = Math.max(1, w.level);
  const ch = Math.min(9, Math.floor((level - 1) / 10));
  const body = enemyBody(kind, level);
  const size = sizeMul(WORLD_W);
  let hp = body.hp;
  const r = body.r * size;
  if (role === "wall") hp *= 3;
  // the shell already makes it slow to kill; keep it from becoming a sponge
  if (role === "hermit") hp = Math.max(4, Math.ceil(hp * 0.6));
  if (role === "chip" || role === "rain" || role === "spore") hp = 1;
  if (role === "forge") {
    /* plate is the armor */
  }
  const score = body.score;
  const vy = role === "rain" ? 180 : motion === "conga" ? 120 : body.vy;
  const fire = motion === "boss" ? 1.1 : 0;
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
    look: kind === "boss" ? ch : (w.born * 5 + ch * 3 + (kind === "cruiser" ? 3 : kind === "drone" ? 1 : 0)) % FAUNA.length,
    role,
    warn: 0,
    plate: role === "forge" ? 12 : 0,
    hide: role === "hermit" ? 1.2 : 0,
    size,
  });
  w.born += 1;
  const id = role || kind;
  if (!w.meta.seen.includes(id)) w.meta.seen.push(id);
}

function burst(w: World, x: number, y: number, color: string, n: number, speed: number, chunk = false) {
  const count = w.reduce ? Math.max(1, Math.ceil(n * 0.35)) : n;
  const confetti = starTotal(w.meta) >= 100;
  const party = ["#e07a3d", "#7eb6d6", "#f2d24a", "#f4f1ea", "#c44536"];
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
      color: confetti ? party[i % party.length] : color,
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
  if (w.floaters.length > 14) w.floaters.shift();
  w.floaters.push({ x, y, text, life: 1.25, ember });
}

function cheer(w: World, x: number, y: number, color: string) {
  ring(w, x, y, color, 0.26, 12, 1.7);
  if (!w.reduce) ring(w, x, y, "#f4fbff", 0.14, 6, 0.9);
}

function sparkHit(w: World, e: Enemy, x: number, y: number) {
  const pal = chapterOf(Math.max(1, e.ch * 10 + 1));
  const gated = e.flash > 0.02;
  burst(w, x, y, pal.accent, gated ? 3 : 5, 120, false);
  burst(w, x, y, "#f7fbff", gated ? 2 : 4, 160, false);
  if (!gated) {
    ring(w, x, y, pal.edge, 0.2, Math.max(6, e.r * 0.35), 1.1);
    ring(w, x, y, "#f4fbff", 0.12, Math.max(4, e.r * 0.15), 0.7);
  }
  e.flash = 0.08;
}

function addTrauma(w: World, amount: number) {
  if (w.reduce) return;
  w.trauma = Math.min(1, w.trauma + amount);
}

function addScore(w: World, base: number, x: number, y: number, show: boolean) {
  const mult = multiplierOf(w);
  const gained = Math.round(base * mult);
  w.score += gained;
  if (w.arcade && w.player.lives < 6) {
    const extra = extraLifeAt(w.score, w.lifePaid);
    if (extra.grant > 0) {
      w.player.lives = Math.min(6, w.player.lives + extra.grant);
      w.lifePaid = extra.paid;
      float(w, w.player.x, w.player.y - 36, "1UP", true);
    }
  }
  const prev = w.chain;
  w.chain = Math.min(40, w.chain + 1);
  w.chainT = 1.75;
  if (show || w.chain >= 10) float(w, x, y - 8, String(gained), gained >= 200);
  if ((prev < 10 && w.chain >= 10) || (prev < 20 && w.chain >= 20) || (prev < 30 && w.chain >= 30)) {
    float(w, x, y - 26, `x${multiplierOf(w).toFixed(1)}`, true);
  }
}

function bank(w: World, amount: number, x: number, y: number, show: boolean) {
  const n = Math.max(1, Math.round(amount * (w.arcade ? 0.5 : salvageMul(w.meta.upgrades.salvage))));
  if (w.arcade) w.purse += n;
  else w.meta.dollars += n;
  if (show) {
    float(w, x, y - 18, `+$${n}`, true);
    w.cues.push("pickup");
  }
}

function killEnemy(w: World, e: Enemy) {
  const big = e.kind === "boss" || e.kind === "cruiser";
  const heavy = big || e.kind === "drone";
  const pal = chapterOf(Math.max(1, e.ch * 10 + 1));
  const chunks = e.kind === "boss" ? 26 : e.kind === "cruiser" ? 18 : e.kind === "drone" ? 14 : 8;
  const sparks = e.kind === "boss" ? 16 : e.kind === "cruiser" ? 12 : e.kind === "drone" ? 9 : 5;
  burst(w, e.x, e.y, pal.edge, chunks, big ? 240 : 155, true);
  burst(w, e.x, e.y, e.kind === "boss" ? pal.accent : pal.flame, sparks, 190, false);
  burst(w, e.x, e.y, "#f7fbff", heavy ? 8 : 3, 210, false);
  ring(w, e.x, e.y, big ? pal.accent : pal.edge, heavy ? 0.42 : 0.2, e.r, heavy ? 2.4 : 1.1);
  ring(w, e.x, e.y, "#f4fbff", heavy ? 0.28 : 0.14, Math.max(4, e.r * 0.45), 1);
  const trauma = e.kind === "boss" ? 0.92 : e.kind === "cruiser" ? 0.62 : e.kind === "drone" ? 0.36 : e.kind === "wedge" ? 0.16 : 0.14;
  addTrauma(w, trauma);
  if (e.kind === "boss") w.hitstop = 0.12;
  else if (e.kind === "cruiser") w.hitstop = 0.05;
  else if (e.kind === "drone") w.hitstop = 0.026;
  w.cues.push(big ? "big" : "kill");
  addScore(w, e.score, e.x, e.y, big);
  if (e.kind === "cruiser") {
    float(w, e.x, e.y - 22, FAUNA[e.look % FAUNA.length].toUpperCase(), true);
    if (w.rng() < 0.25) float(w, e.x, e.y - 40, LAST_WORDS[Math.floor(w.rng() * LAST_WORDS.length)] ?? "WORTH IT");
  }
  if (e.kind === "boss") {
    if (e.ch === 9) {
      w.banner = "IT WAS A TOILET THE WHOLE TIME.";
      w.bannerT = 2.4;
      if (!w.meta.owned.includes("throne")) w.meta.owned.push("throne");
    }
    bossLoot(w, e);
    w.slain += 1;
    return;
  }
  const body = enemyBody(e.kind, w.level);
  bank(w, e.role === "bonus" ? 1 : body.cash, e.x, e.y, e.kind === "cruiser");
  w.slain += 1;
  const snacks = e.kind === "cruiser" ? 5 : w.rng() < 0.35 ? 1 : 0;
  for (let i = 0; i < snacks; i++) dropPickup(w, "N", e.x + (i - 1) * 6, e.y, 1);
  if (!w.duck && w.rng() < 0.03) {
    w.duck = true;
    dropPickup(w, "D", e.x, e.y, 0);
  }
  if (e.role === "gnat" || e.role === "mother") {
    const bits = e.role === "mother" ? 4 : 3;
    for (let i = 0; i < bits; i++) {
      spawnEnemy(w, "dart", e.x, "rain", undefined, e.y, (i - 1) * 40, i, e.y, 0, e.role === "mother" ? "spore" : "chip");
    }
  }
  if (e.drop) {
    dropPickup(w, e.drop, e.x, e.y, e.dropValue);
  } else {
    const base = e.kind === "cruiser" ? 0.28 : e.kind === "wedge" ? 0.16 : e.kind === "drone" ? 0.13 : 0.11;
    // late formations are three times the size, so each enemy drops less often
    const thin = 1 - 0.5 * Math.min(1, (w.level - 1) / 99);
    const chance = Math.min(0.48, base * thin * luckMul(w.arcade ? 0 : w.meta.upgrades.luck));
    if (w.rng() < chance) {
      const roll = w.rng();
      const kind: PickupKind = roll < 0.34 ? "$" : roll < 0.56 ? "W" : roll < 0.72 ? "M" : roll < 0.86 ? "S" : "B";
      dropPickup(w, kind, e.x, e.y, kind === "$" ? 5 + Math.floor(w.level * 0.3) : 0);
    }
  }
}

function bossLoot(w: World, e: Enemy) {
  const base = 18 + w.level;
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
      vy: 48 + (i % 4) * 8,
      rest: 0,
    });
  });
  float(w, e.x, e.y - 36, "LOOT", true);
}

function takePickup(w: World, kind: PickupKind, value: number, who: Player = w.player) {
  const p = who;
  if (kind === "W") {
    const family = FAMILIES[(value || 0) % 3] ?? "pulse";
    if (family !== p.family) {
      p.family = family;
      w.cues.push("pickup");
      float(w, p.x, p.y - 28, gunName(p.weapon, p.family), true);
    } else if (p.weapon < 6) {
      p.weapon += 1;
      w.cues.push("pickup");
      float(w, p.x, p.y - 28, gunName(p.weapon, p.family), true);
    } else {
      p.feed = 6.5;
      w.cues.push("drive");
      float(w, p.x, p.y - 28, "AFTERBURNER", true);
    }
    cheer(w, p.x, p.y, family === "neutron" ? "#9ed24a" : family === "lance" ? "#e07a3d" : "#7eb6d6");
  } else if (kind === "S") {
    p.shield = true;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "TP SHIELD");
    cheer(w, p.x, p.y, "#7eb6d6");
  } else if (kind === "B") {
    w.player.bombs = Math.min(5, w.player.bombs + 1);
    if (w.wing) w.wing.bombs = w.player.bombs;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "AIR FRESHENER", true);
    cheer(w, p.x, p.y, "#e07a3d");
  } else if (kind === "$") {
    bank(w, value || 6, p.x, p.y, true);
    cheer(w, p.x, p.y, "#d2a84a");
  } else if (kind === "M") {
    p.missiles = Math.min(9, p.missiles + 3);
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "PLUNGERS ×3", true);
    cheer(w, p.x, p.y, "#e07a3d");
  } else if (kind === "N") {
    const mul = w.arcade ? 1 : w.meta.upgrades.pockets >= 2 ? 1.5 : w.meta.upgrades.pockets === 1 ? 1.25 : 1;
    w.snacks += mul;
    w.score += 1;
    while (w.snacks >= 100) {
      w.snacks -= 100;
      if (w.player.bombs >= 5) {
        w.score += 2000;
        float(w, p.x, p.y - 28, "+2,000", true);
      } else {
        w.player.bombs += 1;
        if (w.wing) w.wing.bombs = w.player.bombs;
        float(w, p.x, p.y - 28, "SNACK ATTACK! +1 BOMB", true);
      }
    }
  } else if (kind === "D") {
    w.freeze = w.bossUp ? 1.5 : 3;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "RUBBER DUCK – EVERYONE STOPS TO LOOK", true);
  } else {
    w.chain = Math.min(40, w.chain + 8);
    w.chainT = 2.1;
    w.cues.push("drive");
    float(w, p.x, p.y - 28, "CHAIN", true);
    cheer(w, p.x, p.y, "#e7eaee");
  }
}

function dropPickup(w: World, kind: PickupKind, x: number, y: number, value = 0) {
  const dir = Math.sign(w.player.x - x) || (w.rng() < 0.5 ? -1 : 1);
  // a gun gift starts on a random family colour and keeps cycling as it falls
  const hue = kind === "W" ? Math.floor(w.rng() * 3) : undefined;
  w.pickups.push({ kind, x, y, vx: dir * (12 + w.rng() * 16), vy: 70 + w.rng() * 40, value: hue ?? value, rest: 0, hue });
}

function stepPickups(w: World, dt: number) {
  const crew = living(w);
  const magnet = 1 + (w.meta.upgrades.magnet || 0);
  const vacuum = w.clearing && crew.length > 0;
  const next: Pickup[] = [];
  for (const pk of w.pickups) {
    if (pk.y > 9000) continue;
    if (!crew.length) {
      pk.vy = Math.min(140, pk.vy + 30 * dt);
      pk.y += pk.vy * dt;
      if (pk.y < WORLD_H + 48) next.push(pk);
      continue;
    }
    const who = nearestPilot(w, pk.x, pk.y);
    const dx = who.x - pk.x;
    const dy = who.y - pk.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (vacuum) {
      const speed = Math.min(900, 240 + w.lootT * 1800);
      pk.x += (dx / dist) * speed * dt;
      pk.y += (dy / dist) * speed * dt;
      if (dist < 30 || w.lootT >= 0.55) {
        takePickup(w, pk.kind, pk.value, who);
        w.cues.push("plink");
      } else next.push(pk);
      continue;
    }
    if (pk.kind === "W") {
      pk.age = (pk.age ?? 0) + dt;
      if ((pk.age ?? 0) >= 2) {
        pk.age = 0;
        pk.hue = ((pk.hue ?? 0) + 1) % 3;
        pk.value = pk.hue;
      }
    }
    if (pk.kind === "N") pk.vy = Math.max(pk.vy, 130);
    if (dist < 170 + magnet * 55) {
      pk.vx += (dx / dist) * (80 + magnet * 80) * dt;
      pk.vy += (dy / dist) * (60 + magnet * 46) * dt;
    }
    const fall = 78 + (Math.abs(pk.value) % 5) * 6;
    pk.vy += (fall - pk.vy) * Math.min(1, 2.4 * dt);
    pk.vx *= Math.max(0, 1 - 1.2 * dt);
    const sp = Math.hypot(pk.vx, pk.vy);
    const cap = 200 + magnet * 30;
    if (sp > cap) {
      pk.vx = (pk.vx / sp) * cap;
      pk.vy = (pk.vy / sp) * cap;
    }
    pk.x = clamp(pk.x + pk.vx * dt, 16, WORLD_W - 16);
    pk.y += pk.vy * dt;
    const scoop = dist < 32 + magnet * 6 || (Math.abs(dx) < 46 + magnet * 8 && pk.y > who.y - 18 && pk.y < who.y + 62);
    if (scoop) takePickup(w, pk.kind, pk.value, who);
    else if (pk.y < WORLD_H + 40) next.push(pk);
  }
  w.pickups = next;
}

function hurtPlayer(w: World, p: Player = w.player) {
  if (w.god) return;
  if (!p.alive || p.inv > 0) return;
  if (p.shield) {
    p.shield = false;
    p.inv = 0.4;
    burst(w, p.x, p.y, "#f4f1ea", 12, 150, false);
    ring(w, p.x, p.y, "#f4f1ea", 0.28, 8, 1.5);
    addTrauma(w, 0.28);
    float(w, p.x, p.y - 30, "TP SAVED YOU");
    w.cues.push("shield");
    return;
  }
  w.player.lives -= 1;
  p.inv = 1.85;
  w.chain = 0;
  w.perfect = false;
  if (w.rng() < 0.3) {
    p.splat = 2;
    float(w, p.x, p.y - 24, "SPLAT");
  }
  if (p.insured) {
    p.insured = false;
    float(w, p.x, p.y - 46, "INSURED");
  } else if (p.weapon > 1) {
    p.weapon -= 1;
    p.feed = 0;
    float(w, p.x, p.y - 46, gunName(p.weapon, p.family));
  }
  w.flash = 0.22;
  addTrauma(w, 0.66);
  burst(w, p.x, p.y, "#e07a3d", 18, 200, true);
  w.bullets = w.bullets.filter((b) => b.friendly);
  w.cues.push("hurt");
  if (w.player.lives <= 0) {
    w.player.alive = false;
    if (w.wing) w.wing.alive = false;
    w.deathLine = DEATH[Math.floor(w.rng() * DEATH.length)] ?? DEATH[0];
    if (w.arcade) {
      const pay = Math.round(w.purse);
      w.meta.dollars += pay;
      w.clearCash = pay;
      pushRank(w);
      w.mode = "arcadeover";
      const frontier = w.pinned;
      w.pinned = null;
      if (frontier != null) w.meta.level = frontier;
      persist(w, w.snap);
      w.pinned = frontier;
    } else {
      w.mode = "over";
      w.clearing = false;
      w.record = w.score > w.best;
      if (w.record) w.best = w.score;
      w.meta.best = Math.max(w.meta.best, w.best);
      w.meta.level = clamp(w.level, 1, LEVELS);
      persist(w, w.snap);
    }
    w.cues.push("big");
  }
}

function firePlayer(w: World, p: Player, focus: boolean) {
  const feed = p.feed > 0;
  const family = p.family || "pulse";
  const rank = Math.max(1, Math.min(6, p.weapon));
  const pack = volley(family, rank, focus);
  const kick = feed ? 1.18 : 1;
  for (const s of pack.shots) {
    if (w.bullets.length > 260) break;
    w.bullets.push({
      x: p.x + s.ox,
      y: p.y - 18 + (s.oy ?? 0),
      vx: s.vx,
      vy: s.vy,
      r: s.r,
      friendly: true,
      dmg: s.dmg * kick,
      life: s.life,
      homing: false,
      grazed: false,
      hot: feed,
      tint: 0,
      style: s.style,
      pierce: s.pierce,
      splash: s.splash,
    });
  }
  const pods = podCount(rank);
  for (let i = 0; i < pods; i++) {
    const a = w.time * 2.5 + i * Math.PI;
    if (w.bullets.length > 260) break;
    w.bullets.push({
      x: p.x + Math.cos(a) * 28,
      y: p.y + Math.sin(a) * 11,
      vx: 0,
      vy: -640,
      r: 1.6,
      friendly: true,
      dmg: 0.35 * kick,
      life: 1.2,
      homing: false,
      grazed: false,
      hot: feed,
      tint: 0,
      style: family === "neutron" ? 2 : family === "lance" ? 3 : 0,
      pierce: family === "lance" ? 1 : 0,
      splash: 0,
    });
  }
  p.muzzle = 0.05;
  const trig = 1 - (w.arcade ? 0 : w.meta.upgrades.trigger * 0.1);
  p.fireCd = Math.max(0.05, pack.cd * trig * (feed ? 0.7 : 1));
}

function tryMissile(w: World, p: Player, fire: boolean, dt: number) {
  p.missileCd = Math.max(0, p.missileCd - dt);
  if (!fire || !p.alive || p.missiles <= 0 || p.missileCd > 0) return;
  if (w.bullets.length > 200) return;
  p.missiles -= 1;
  p.missileCd = 0.46;
  const side = p.missiles % 2 === 0 ? 1 : -1;
  w.bullets.push({
    x: p.x + side * 12,
    y: p.y - 6,
    vx: side * 70,
    vy: -240,
    r: 3.6,
    friendly: true,
    dmg: 3.4,
    life: 2.6,
    homing: true,
    grazed: false,
    hot: true,
    tint: 0,
    style: 4,
    pierce: 0,
    splash: 18,
  });
  w.cues.push("missile");
}

export function podOffsets(time: number, weapon: number) {
  const pods: { x: number; y: number }[] = [];
  const a = time * 2.5;
  for (let i = 0; i < podCount(weapon); i++) pods.push({ x: Math.cos(a + i * Math.PI) * 28, y: Math.sin(a + i * Math.PI) * 11 });
  return pods;
}

function nearestPilot(w: World, x: number, y: number): Player {
  let best = w.player;
  const bestD = w.player.alive ? (w.player.x - x) ** 2 + (w.player.y - y) ** 2 : 1e12;
  const wing = w.wing;
  if (wing && wing.alive) {
    const d = (wing.x - x) ** 2 + (wing.y - y) ** 2;
    if (d < bestD) best = wing;
  }
  return best;
}

function hostileCount(w: World) {
  let n = 0;
  for (const b of w.bullets) if (!b.friendly && b.life > 0) n += 1;
  return n;
}

function pushHostile(w: World, x: number, y: number, a: number, speed: number, r: number, shape: number, child = false) {
  if (w.bullets.length > 300) return;
  const who = nearestPilot(w, x, y);
  if (!child && Math.hypot(who.x - x, who.y - y) < 100) return;
  w.bullets.push({
    x, y,
    vx: Math.cos(a) * speed,
    vy: Math.sin(a) * speed,
    r: Math.max(5, r * 0.72),
    friendly: false,
    dmg: 1,
    life: 6,
    homing: false,
    grazed: false,
    hot: false,
    tint: 0,
    shape,
    age: 0,
    bounces: 0,
    split: child,
  });
}

function releaseShot(w: World, e: Enemy) {
  const who = nearestPilot(w, e.x, e.y);
  const aim = Math.atan2(who.y - e.y, who.x - e.x);
  const down = Math.PI / 2;
  const budget = fireBudget(w.level, WORLD_W);
  const roll = w.rng();
  const aimed = roll < aimedShare(w.level);
  const angle = aimed ? aim : down;
  const shape = poopShape(e.ch, w.level, w.rng());
  const seenName = ["swirl", "pellets", "swirl", "swirl", "swirl", "frozen", "pebble", "comet", "honeyblob", "slime", "ghostpoop", "chili", "zap", "unicorn", "gold", "diamond", "fart"][shape] ?? "swirl";
  if (!w.meta.seen.includes(seenName)) w.meta.seen.push(seenName);
  const n = volleySize(w.level, w.rng(), w.rng());
  // shots that split later cost more of the shared budget, so chapters whose
  // signature shot multiplies are not suddenly twice as dense as their neighbours
  if (shape === 5) w.budget -= 1.2;
  else if (shape === 9) w.budget -= 0.6;
  if (shape === 1 && w.rng() < 0.35) {
    for (const a of [-0.2, 0, 0.2]) pushHostile(w, e.x, e.y + 10, down + a, budget.speed * 1.3, 4, 1);
    w.budget -= 0.5;
    return;
  }
  for (let i = 0; i < n; i++) {
    const spread = (i - (n - 1) / 2) * 0.16;
    pushHostile(w, e.x, e.y + 10, angle + spread, budget.speed, 6, shape);
  }
  if (!w.meta.seen.includes("swirl")) w.meta.seen.push("swirl");
}

function budgetShots(w: World, dt: number) {
  const rules = fireBudget(w.level, WORLD_W);
  w.budget += rules.rate * dt;
  if (w.budget < 1 || hostileCount(w) >= rules.cap) return;
  const crew = living(w);
  if (!crew.length) return;
  const who = crew[0];
  const pool = w.enemies.filter((e) => {
    if (e.hp <= 0 || e.kind === "boss" || e.warn > 0 || e.fire > 0) return false;
    if (hermitHidden(e)) return false;
    if (e.role === "ghost" && Math.sin(e.t * 2.4) < 0) return false;
    if (!mayShoot(e.kind, e.role, w.level, e.look)) return false;
    return e.motion !== "dive" && e.y > 20 && e.y < who.y - 140;
  });
  if (!pool.length) return;
  const e = pool[Math.floor(w.rng() * pool.length)];
  e.warn = w.level <= 20 || w.rng() < 0.55 ? 0.25 : 0.02;
  e.fire = rules.cdMin + w.rng() * Math.max(0.05, rules.cdMax - rules.cdMin);
  w.budget -= 1;
}

function runBoss(w: World, e: Enemy) {
  const who = nearestPilot(w, e.x, e.y);
  const aim = Math.atan2(who.y - e.y, who.x - e.x);
  const cmds = bossScript(e.ch, e.mark, e.t, aim, WORLD_W);
  const special = Math.floor(e.t) % 5 === 0;
  for (const cmd of cmds) {
    // boss shots do not split: its rings are dense enough already
    if (cmd.op === "shot") pushHostile(w, e.x, e.y + 16, cmd.a, cmd.speed, cmd.r, cmd.shape, cmd.shape === 5 || cmd.shape === 9);
    else if (cmd.op === "summon" && special && w.enemies.length < 5) spawnEnemy(w, cmd.kind, cmd.x, "sine", undefined, e.y + 20, 0, undefined, e.y + 30, 0, cmd.role);
    else if (cmd.op === "banner") {
      e.said = e.said ?? [];
      if (!e.said.includes(cmd.text)) {
        e.said.push(cmd.text);
        w.banner = cmd.text;
        w.bannerT = 1.2;
      }
    } else if (cmd.op === "clear") cashBullets(w);
    else if (cmd.op === "dive" && special && e.dash === undefined) {
      e.dash = 0;
      e.dashX = clamp(who.x, edgeOf("boss"), WORLD_W - edgeOf("boss"));
    }
  }
}

function cashBullets(w: World) {
  for (const b of w.bullets) {
    if (b.friendly || b.life <= 0) continue;
    b.life = 0;
    w.score += 5;
    if (w.rng() < 0.1) dropPickup(w, "$", b.x, b.y, 1);
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
    if (e.gone) continue;
    if (e.hp <= 0) {
      if (e.kind === "boss") bossDied = true;
      killEnemy(w, e);
      continue;
    }
    next.push(e);
  }
  w.enemies = next;
  if (bossDied) {
    // the boss's helpers go down with it, so the fight always ends
    for (const e of w.enemies) {
      const pal = chapterOf(Math.max(1, e.ch * 10 + 1));
      burst(w, e.x, e.y, pal.edge, 8, 160, true);
      ring(w, e.x, e.y, pal.edge, 0.2, e.r, 1.1);
    }
    w.enemies = [];
    w.spawns = [];
    w.bullets = w.bullets.filter((b) => b.friendly);
    w.bossUp = false;
    w.banner = "LOOT";
    w.bannerT = 1.4;
  }
}

function detonate(w: World, who?: Player) {
  const owner = who && who.alive ? who : w.player.alive ? w.player : w.wing;
  if (!owner || !owner.alive || w.player.bombs <= 0 || w.mode !== "play") return;
  w.player.bombs -= 1;
  if (w.wing) w.wing.bombs = w.player.bombs;
  w.bombsUsed += 1;
  w.flash = 0.32;
  w.hitstop = 0.05;
  addTrauma(w, 0.85);
  owner.inv = Math.max(owner.inv, 1);
  cashBullets(w);
  for (const e of w.enemies) {
    if (e.kind === "boss") {
      if (w.bombArmor > 0) {
        float(w, e.x, e.y - 20, "NICE TRY");
      } else {
        e.hp -= e.max * 0.06;
        w.bombArmor = 1.5;
      }
    } else e.hp = 0;
    e.flash = 0.1;
  }
  const line = BOMB_LINES[Math.floor(w.rng() * BOMB_LINES.length)] ?? "FRESH!";
  w.banner = line;
  w.bannerT = 0.8;
  ring(w, owner.x, owner.y, "#e7eaee", 0.48, 12, 2);
  burst(w, owner.x, owner.y, "#e7eaee", 26, 280, false);
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
    if (w.wing) {
      w.wing.feed = Math.max(0, w.wing.feed - dt);
      w.wing.inv = Math.max(0, w.wing.inv - dt);
      w.wing.muzzle = Math.max(0, w.wing.muzzle - dt);
    }
    w.grazeCd = Math.max(0, w.grazeCd - dt);
    w.freeze = Math.max(0, w.freeze - dt);
    w.bombArmor = Math.max(0, w.bombArmor - dt);
    w.clock += dt;
    w.player.splat = Math.max(0, w.player.splat - dt);
    w.player.slow = Math.max(0, w.player.slow - dt);
    if (w.wing) {
      w.wing.splat = Math.max(0, w.wing.splat - dt);
      w.wing.slow = Math.max(0, w.wing.slow - dt);
    }
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
    if (e.dash !== undefined) {
      // charge: 0.9 s warning line, dive at the marked lane, climb back to the nest
      e.dash += dt;
      const tx = e.dashX ?? e.x;
      const low = WORLD_H * 0.72;
      if (e.dash < DASH_WARN) {
        // hold still while the warning line shows
      } else if (e.dash < DASH_WARN + 2) {
        e.x += clamp(tx - e.x, -420 * dt, 420 * dt);
        e.y = Math.min(low, e.y + 420 * dt);
        if (e.y >= low) e.dash = DASH_WARN + 2;
      } else {
        e.y = Math.max(nest, e.y - 220 * dt);
        if (e.y <= nest) {
          e.dash = undefined;
          e.dashX = undefined;
        }
      }
      return;
    }
    e.y += e.y < nest ? 52 * dt : 0;
    if (e.y > nest) e.y = nest + Math.sin(e.t * 1.4) * 4;
    const want = clamp(WORLD_W / 2 + Math.sin(e.t * 0.55) * Math.min(120, WORLD_W * 0.12), edgeOf("boss"), WORLD_W - edgeOf("boss"));
    // ease back after a charge instead of snapping across the screen
    e.x += (want - e.x) * Math.min(1, 3 * dt);
    const ratio = e.hp / e.max;
    const phase = phaseIndex(e.ch, ratio);
    if (phase !== e.mark) {
      e.mark = phase;
      e.fire = 0.8;
      const line = BOSS_LINES[e.ch];
      w.banner = phase >= 3 ? "ECLIPSE" : line ? line[0] : "PHASE";
      w.bannerT = 0.8;
      cashBullets(w);
    }
    return;
  }
  const cap = WORLD_H * 0.5;
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
  if (e.motion === "spiral") {
    const nest = Math.min(e.oy || WORLD_H * 0.2, cap);
    if (e.y < nest) e.y += 100 * dt;
    else e.y = nest + Math.sin(e.t * 2.1) * 6;
    const rad = 18 + Math.sin(e.t * 0.8) * 8;
    e.x = e.ox + Math.cos(e.t * 2.2 + e.spin) * rad + w.formX * 0.35;
    contain(e);
    return;
  }
  if (e.motion === "zigzag") {
    const nest = Math.min(e.oy || WORLD_H * 0.22, cap);
    if (e.y < nest) e.y += 128 * dt;
    else e.y = nest + Math.sin(e.t * 1.7 + e.spin) * 5;
    const leg = 0.42;
    const dir = Math.floor(e.t / leg) % 2 === 0 ? 1 : -1;
    e.x += dir * 96 * dt;
    contain(e);
    return;
  }
  if (e.motion === "conga" || e.motion === "rain" || e.role === "bonus") {
    e.y += (e.motion === "rain" ? 200 : 130) * dt;
    e.x += Math.sin(e.t * 2 + e.spin) * 40 * dt;
    if (e.y > WORLD_H + 40) e.gone = true;
    return;
  }
  if (e.motion === "dive") {
    e.warn = Math.max(0, e.warn - dt);
    if (e.warn > 0) return;
    const who = nearestPilot(w, e.x, e.y);
    e.x += Math.sign(who.x - e.x || 1) * 160 * dt;
    e.y += 220 * dt;
    if (e.y > WORLD_H + 20) {
      e.y = -24;
      e.motion = "rank";
      e.x = e.ox;
    }
    return;
  }
  if (e.y < goal - 2) e.y += 120 * dt;
  else e.y += (goal - e.y) * Math.min(1, 5 * dt);
  const amp = e.motion === "swoop" ? 36 : e.motion === "sine" ? 16 : 4;
  const sway = Math.sin(e.t * (e.motion === "swoop" ? 1.25 : 0.8) + e.spin) * amp;
  e.x = e.ox + w.formX + sway;
  if ((e.motion === "rank" || e.motion === "swoop") && e.kind !== "boss" && e.role !== "bonus") {
    const d = Math.max(0, (w.level - 4) / 96);
    const chance = w.level < 4 ? 0 : 0.1 + 0.25 * d;
    if (w.rng() < chance * dt * 0.15) {
      const divers = w.enemies.reduce((n, o) => n + (o.motion === "dive" ? 1 : 0), 0);
      if (divers < 1 + Math.floor(w.level / 25) && e.y > 30) {
        e.motion = "dive";
        e.warn = 0.55;
        e.flash = 0.55;
      }
    }
  }
  contain(e);
}

function stepHazards(w: World, dt: number) {
  for (const h of w.hazards) {
    h.t -= dt;
    h.x += h.vx * dt;
    h.y += h.vy * dt;
    if (h.kind === "pane") {
      if (h.y > WORLD_H + 40) h.y = -80;
      for (const b of w.bullets) {
        if (b.life <= 0) continue;
        if (Math.abs(b.x - h.x) < h.w / 2 && Math.abs(b.y - h.y) < h.h / 2) {
          b.life = 0;
          h.hp -= 1;
        }
      }
      if (h.hp <= 0) {
        bank(w, 5, h.x, h.y, true);
        h.kind = "dead";
      }
    } else if (h.kind === "goo") {
      if (h.y > WORLD_H + 20) h.y = -30;
      for (const p of living(w)) {
        if (Math.hypot(p.x - h.x, p.y - h.y) < 28) {
          p.slow = 2;
          float(w, p.x, p.y - 18, "STICKY!");
        }
      }
    } else if (h.kind === "flare" && h.t < 0 && h.t > -1.5) {
      for (const p of living(w)) if (Math.abs(p.y - h.y) < h.h / 2 && p.inv <= 0) hurtPlayer(w, p);
    } else if (h.kind === "bolt" && h.t < 0 && h.t > -0.2) {
      for (const p of living(w)) if (Math.abs(p.x - h.x) < h.w && p.inv <= 0) hurtPlayer(w, p);
    } else if (h.kind === "cloud") {
      if (h.x > WORLD_W + 40) h.x = -40;
      if (h.phase <= 0) {
        for (const e of w.enemies) {
          if (Math.hypot(e.x - h.x, e.y - h.y) < 60) e.hp = Math.min(e.max, e.hp + e.max * 0.1 * dt);
        }
      } else h.phase -= dt;
    } else if (h.kind === "rocks" && h.t < 0 && h.phase === 0) {
      h.phase = 1;
      w.banner = "ROCKS INBOUND";
      w.bannerT = 1;
      for (let i = 0; i < 5; i++) spawnEnemy(w, "dart", 40 + i * (WORLD_W / 6), "rain", undefined, -20, 30, i, 0, 0, "rain");
    } else if (h.kind === "eclipse") {
      if (h.t < 0) {
        h.phase = h.phase > 0 ? 0 : 1.5;
        h.t = 14;
        if (h.phase > 0) {
          w.banner = "ECLIPSE";
          w.bannerT = 1;
        }
      }
    }
  }
  w.hazards = w.hazards.filter((h) => h.kind !== "dead");
  for (const b of w.bullets) {
    if (b.friendly && b.style === 2) {
      for (const h of w.hazards) if (h.kind === "cloud" && Math.hypot(b.x - h.x, b.y - h.y) < 50) h.phase = 3;
    }
  }
}

export const DASH_WARN = 0.9;

function edgeOf(kind: Kind) {
  if (kind === "boss") return Math.min(96, Math.max(64, WORLD_W * 0.1));
  if (kind === "cruiser") return Math.min(72, Math.max(44, WORLD_W * 0.07));
  return Math.min(52, Math.max(28, WORLD_W * 0.05));
}

export function hermitHidden(e: Enemy) {
  return e.role === "hermit" && (e.t + e.spin) % 3 < 1;
}

function contain(e: Enemy) {
  const m = edgeOf(e.kind);
  e.x = clamp(e.x, m, WORLD_W - m);
}

function living(w: World): Player[] {
  const list: Player[] = [];
  if (w.player.alive) list.push(w.player);
  if (w.wing?.alive) list.push(w.wing);
  return list;
}

function drivePilot(
  w: World,
  p: Player,
  left: boolean,
  right: boolean,
  up: boolean,
  down: boolean,
  focus: boolean,
  fire: boolean,
  pointer: { x: number; y: number } | null,
  dt: number,
) {
  if (!p.alive) {
    p.speedUp = 0;
    p.bank += (0 - p.bank) * (1 - Math.exp(-8 * dt));
    return;
  }
  let ax = (right ? 1 : 0) - (left ? 1 : 0);
  let ay = (down ? 1 : 0) - (up ? 1 : 0);
  const keying = ax !== 0 || ay !== 0;
  const mag = Math.hypot(ax, ay);
  if (mag > 0) {
    ax /= mag;
    ay /= mag;
  }
  const speed = (focus ? Math.max(170, WORLD_W * 0.16) : Math.max(340, WORLD_W * 0.46)) * (p.slow > 0 ? 0.6 : 1);
  let bankTarget = ax * 0.36;
  if (!keying && pointer) {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd = (focus ? Math.max(200, WORLD_W * 0.2) : Math.max(520, WORLD_W * 0.72)) * dt;
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
  if (fire && p.fireCd <= 0) firePlayer(w, p, focus);
  tryMissile(w, p, fire, dt);
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
  if (w.mode === "bridge") {
    w.bridgeT -= dt;
    if (w.bridgeT <= 0) nextLevel(w);
    return;
  }
  if (w.mode !== "play") {
    w.player.speedUp = 0;
    if (w.wing) w.wing.speedUp = 0;
    return;
  }

  drivePilot(w, w.player, input.left, input.right, input.up, input.down, input.focus, input.fire, input.pointer, dt);
  if (w.wing) {
    drivePilot(w, w.wing, !!input.wingLeft, !!input.wingRight, !!input.wingUp, !!input.wingDown, !!input.wingFocus, !!input.wingFire, null, dt);
  }

  if (input.bomb) detonate(w, w.player);
  else if (input.wingBomb && w.wing) detonate(w, w.wing);
  stepHazards(w, dt);

  const stride = Math.min(28, WORLD_W * 0.028);
  w.formX += w.formDir * 62 * dt;
  if (w.formX > stride) w.formDir = -1;
  if (w.formX < -stride) w.formDir = 1;

  w.spawnClock += dt;
  if (!w.bossUp) {
    const cap = screenCap(WORLD_W);
    const alive = w.enemies.reduce((n, e) => n + (e.hp > 0 ? 1 : 0), 0);
    if (alive >= cap) w.spawnClock -= dt;
    else {
      w.spawns = w.spawns.filter((s) => {
        if (w.spawnClock >= s.at) {
          spawnEnemy(w, s.kind, s.x, s.motion, s.drop, -28, s.vx ?? 0, s.spin, s.oy, s.value ?? 0, s.role ?? "");
          return false;
        }
        return true;
      });
    }
  }

  for (const e of w.enemies) {
    if (e.hp <= 0) continue;
    if (w.freeze > 0 && e.kind !== "boss") continue;
    if (w.freeze > 0 && e.kind === "boss" && w.freeze > 1.5) continue;
    moveEnemy(w, e, dt);
    if (e.kind === "boss") {
      e.fire -= dt;
      if (e.fire <= 0 && w.freeze <= 0) {
        runBoss(w, e);
        e.fire = Math.max(0.7, 1.5 - e.mark * 0.2);
      }
    } else {
      if (e.fire > 0) e.fire = Math.max(0, e.fire - dt);
      if (e.warn > 0) {
        e.warn -= dt;
        if (e.warn <= 0) releaseShot(w, e);
      }
    }
  }
  if (w.freeze <= 0) budgetShots(w, dt);

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
    if (w.freeze > 0 && !b.friendly) continue;
    b.age = (b.age ?? 0) + dt;
    if (!b.friendly && b.shape === 12) b.vx = Math.sin((b.age ?? 0) * 10) * 80;
    if (!b.friendly && b.shape === 13) b.vx = Math.sin((b.age ?? 0) * 6) * 50;
    if (!b.friendly && b.shape === 6 && (b.bounces ?? 0) < 1 && (b.x < 12 || b.x > WORLD_W - 12)) {
      b.vx *= -1;
      b.bounces = 1;
    }
    if (!b.friendly && b.shape === 5 && !b.split && b.y > WORLD_H * 0.45) {
      b.split = true;
      b.life = 0;
      for (const a of [-0.4, 0, 0.4]) pushHostile(w, b.x, b.y, Math.PI / 2 + a, 90, 4, 5, true);
    }
    if (!b.friendly && b.shape === 9 && !b.split && (b.age ?? 0) > 1) {
      b.split = true;
      b.life = 0;
      pushHostile(w, b.x - 8, b.y, Math.PI / 2 - 0.2, 80, 4, 9, true);
      pushHostile(w, b.x + 8, b.y, Math.PI / 2 + 0.2, 80, 4, 9, true);
    }
    const well = w.hazards.find((h) => h.kind === "well");
    if (well) {
      const dx = well.x - b.x;
      const dy = well.y - b.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist < well.w) {
        b.vx += (dx / dist) * 80 * dt;
        b.vy += (dy / dist) * 80 * dt;
      }
    }
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
  }

  stepPickups(w, dt);

  for (const b of w.bullets) {
    if (!b.friendly || b.life <= 0) continue;
    for (const e of w.enemies) {
      if (e.hp <= 0) continue;
      if (b.hit && b.hit.includes(e)) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
        if (e.role === "wall" && (b.pierce ?? 0) <= 0 && b.style !== 3 && Math.abs(b.x - e.x) < e.r * 0.65) {
          b.vy = Math.abs(b.vy);
          b.y = e.y + e.r + 4;
          sparkHit(w, e, b.x, b.y);
          break;
        }
        if (e.role === "forge" && e.plate > 0 && b.style !== 3 && (b.pierce ?? 0) <= 0 && b.y > e.y) {
          e.plate -= 1;
          b.life = 0;
          sparkHit(w, e, b.x, b.y);
          if (e.plate <= 0) float(w, e.x, e.y - 16, "PLATE OFF");
          break;
        }
        if (hermitHidden(e)) {
          b.life = 0;
          sparkHit(w, e, b.x, b.y);
          break;
        }
        if (e.role === "ghost" && Math.sin(e.t * 2.4) < 0) continue;
        if (e.role !== "honey" && e.kind !== "boss" && w.enemies.some((h) => h.role === "honey" && h.hp > 0 && Math.hypot(h.x - e.x, h.y - e.y) < HONEY_RING * (h.size ?? 1))) {
          // shielded: the shot slips through, so the turret behind can still be reached
          if (e.flash <= 0) {
            ring(w, e.x, e.y, "#e2b84a", 0.2, e.r, 1.4);
            e.flash = 0.25;
          }
          continue;
        }
        e.hp -= b.dmg;
        sparkHit(w, e, b.x, b.y);
        if ((b.splash ?? 0) > 0) {
          for (const other of w.enemies) {
            if (other === e || other.hp <= 0) continue;
            if (Math.hypot(b.x - other.x, b.y - other.y) < (b.splash ?? 0) + other.r * 0.45) other.hp -= b.dmg * 0.4;
          }
          ring(w, b.x, b.y, b.style === 2 ? "#b6e36a" : "#e07a3d", 0.18, 8, 1.2);
        }
        const left = b.pierce ?? 0;
        if (left > 0) {
          b.pierce = left - 1;
          (b.hit ??= []).push(e);
        } else b.life = 0;
        if (e.kind === "boss" || e.kind === "cruiser") w.cues.push("hit");
        break;
      }
    }
  }

  for (const ship of living(w)) {
    if (ship.inv > 0) continue;
    const hitR = ship === w.player && input.focus ? 4.5 : ship === w.wing && input.wingFocus ? 4.5 : 7;
    for (const b of w.bullets) {
      if (b.friendly || b.life <= 0) continue;
      const d = Math.hypot(b.x - ship.x, b.y - ship.y);
      if (d < hitR + b.r * 0.6) {
        if (b.shape === 16) {
          ship.x += Math.sign(ship.x - b.x || 1) * 60 * 0.016;
          b.grazed = true;
          continue;
        }
        b.life = 0;
        hurtPlayer(w, ship);
      } else if (!b.grazed && d < 26 && w.grazeCd <= 0) {
        b.grazed = true;
        w.grazeCd = 0.045;
        const bonus = b.shape === 14 ? 0 : b.shape === 15 ? 500 : 15;
        w.score += bonus;
        if (b.shape === 14) bank(w, 3, ship.x, ship.y, true);
        w.chainT = Math.max(w.chainT, 0.45);
        w.cues.push("graze");
        ring(w, ship.x, ship.y, "#7eb6d6", 0.16, 6, 1);
      }
    }
    if (ship.alive && ship.inv <= 0) {
      for (const e of w.enemies) {
        if (e.hp <= 0) continue;
        if (Math.hypot(e.x - ship.x, e.y - ship.y) < e.r * 0.55 + hitR) {
          if (e.role === "bonus") {
            if (e.mark === 0) {
              e.mark = 1;
              ship.x += Math.sign(ship.x - e.x || 1) * 28;
              if (!w.arcade) w.meta.dollars = Math.max(0, w.meta.dollars - 10);
              float(w, ship.x, ship.y - 20, "-$10 · RUDE");
            }
            continue;
          }
          if (e.kind !== "boss") e.hp = 0;
          hurtPlayer(w, ship);
        }
      }
    }
  }

  reap(w);
  if (w.mode !== "play") {
    w.bullets = w.bullets.filter((b) => b.life > 0 && b.x > -30 && b.x < WORLD_W + 30 && b.y > -50 && b.y < WORLD_H + 40);
    return;
  }

  if (!w.bossUp && w.spawns.length === 0 && w.enemies.length === 0 && w.level > 0) {
    if (!w.clearing) {
      w.clearing = true;
      w.lootT = 0;
      w.banner = w.perfect ? "CLEAN" : "BREACH";
      w.bannerT = 0.7;
      if (w.perfect) w.cues.push("clean");
    }
    w.lootT += dt;
    const hanging = w.pickups.some((pk) => pk.y < 9000);
    if (!hanging || w.lootT >= 1.15) finishLevel(w);
  }

  w.bullets = w.bullets.filter((b) => b.life > 0 && b.x > -30 && b.x < WORLD_W + 30 && b.y > -50 && b.y < WORLD_H + 40);
}

function finishLevel(w: World) {
  if (w.mode !== "play") return;
  w.pickups = w.pickups.filter((pk) => pk.y > 9000);
  const noBomb = w.bombsUsed === 0;
  const boss = isBossLevel(w.level);
  const fast = boss && w.clock <= fastKillLimit(w.level);
  if (w.perfect && w.arcade) w.score += 5000;
  if (fast) {
    const tip = 40 + w.level * 2;
    bank(w, tip, WORLD_W / 2, 120, false);
    float(w, WORLD_W / 2, 120, `FAST KILL +$${tip}`, true);
  }
  if (noBomb) w.banner = "NO BOMB";
  const slot = ((w.level - 1) % 10) + 1;
  if (!boss && slot === 5 && w.born > 0 && w.slain >= w.born) {
    w.banner = `PERFECT! ${w.slain}/${w.born}`;
    w.score += 150;
    if (w.arcade) w.purse += 50;
    else w.meta.dollars += 100;
    if (w.player.weapon < 6) w.player.weapon += 1;
    else w.player.feed = 6.5;
  } else if (!boss && slot === 5) {
    w.banner = `${w.slain}/${w.born}`;
  }
  const bonus = clearCash(w.level, w.perfect, noBomb, w.arcade ? 0 : w.meta.upgrades.salvage, w.replay);
  if (w.arcade) w.purse += Math.round(bonus * 0.5);
  else w.meta.dollars += bonus;
  w.clearCash = w.arcade ? Math.round(bonus * 0.5) : bonus;
  if (w.perfect) w.score += 400;
  const earned = starsOf(w.perfect, noBomb, w.slain, Math.max(1, w.born), fast, boss);
  w.starShow = `${"★".repeat(earned)}${"☆".repeat(Math.max(0, 3 - earned))}`;
  if (!w.arcade) w.meta.stars[w.level] = Math.max(w.meta.stars[w.level] ?? 0, earned);
  grantStars(w.meta);
  if (w.score > w.best) {
    w.best = w.score;
    w.record = true;
  }
  w.meta.best = Math.max(w.meta.best, w.best);
  w.bannerT = 0;
  if (w.arcade) {
    if (w.arcadeStage >= 30 || w.level >= LEVELS) {
      const pay = Math.round(w.purse);
      w.meta.dollars += pay;
      w.clearCash = pay;
      pushRank(w);
      w.mode = "arcadeover";
      const frontier = w.pinned;
      w.pinned = null;
      if (frontier != null) w.meta.level = frontier;
      persist(w, w.snap);
      w.pinned = frontier;
      return;
    }
    w.mode = "bridge";
    w.bridgeT = 1.4;
    return;
  }
  if (w.pinned != null) {
    w.mode = "bridge";
    w.bridgeT = 2.5;
    w.meta.level = w.pinned;
    persist(w, w.snap);
    return;
  }
  if (w.level >= LEVELS) {
    w.meta.cleared = true;
    w.meta.level = LEVELS;
    w.mode = "victory";
    persist(w, null);
  } else {
    const kit = loadoutOf(w.meta);
    w.meta.level = w.level + 1;
    const chapterEnd = isBossLevel(w.level);
    if (chapterEnd || w.meta.autoNext === false) w.mode = "clear";
    else {
      w.mode = "bridge";
      w.bridgeT = 2.5;
    }
    persist(w, {
      level: w.level + 1,
      lives: Math.max(w.player.lives, 1),
      weapon: Math.max(w.player.weapon, kit.weapon),
      bombs: Math.max(w.player.bombs, kit.bombs),
      shield: w.player.shield,
      score: w.score,
      feed: w.player.feed,
      coop: w.coop,
      missiles: Math.max(w.player.missiles, w.wing?.missiles ?? 0, kit.missiles),
      family: w.player.family,
      snacks: Math.floor(w.snacks),
    });
  }
}

function pushRank(w: World) {
  const row = {
    name: "YOU",
    score: w.score,
    stage: w.arcadeStage,
    date: daySeed().key,
    skin: w.meta.skin,
  };
  w.meta.ranks = [...w.meta.ranks, row].sort((a, b) => b.score - a.score).slice(0, 10);
  const today = daySeed();
  if (w.daily && w.meta.dailyDay !== today.key) {
    w.meta.dailyDay = today.key;
    w.meta.dailyScore = w.score;
  }
}

export function startArcade(w: World, daily = false) {
  const frontier = w.pinned ?? w.meta.level;
  w.pinned = frontier;
  w.arcade = true;
  w.daily = daily;
  w.arcadeStage = 1;
  w.purse = 0;
  w.coop = false;
  w.lifePaid = 0;
  w.score = 0;
  const today = daySeed();
  w.seed = daily ? today.seed : (Math.random() * 1e9) | 0;
  const spec = arcadeStage(1);
  startSortie(w, { level: spec.level, lives: 3, weapon: 1, bombs: 2, shield: false, score: 0, feed: 0, coop: false, missiles: 0, family: "pulse", snacks: w.snacks });
  w.pinned = frontier;
  w.meta.level = frontier;
  persist(w, w.snap);
}

export function skipBridge(w: World) {
  if (w.mode !== "bridge") return;
  if (w.arcade) {
    nextLevel(w);
    return;
  }
  if (w.pinned != null) {
    w.meta.level = w.pinned;
    w.pinned = null;
    w.mode = "levels";
    persist(w, w.snap);
    return;
  }
  nextLevel(w);
}

export function multiplierOf(w: World) {
  return 1 + Math.min(w.chain, 30) * 0.12;
}
