import { lookFor, lookId, lookName } from "./army";
import { perkCount, perkDef, rerollPrice, rollPerks } from "./perks";
import { DEX_ALL_CASH, DEX_ROOMS, DEX_ROOM_CASH, dexName, dexRoomDone, dexRoomOf } from "./album";
import {
  LEVELS,
  buySkin,
  buyUpgrade,
  buyGun,
  buyPower,
  chapterOf,
  equipSkin,
  claimFeats,
  isBossLevel,
  loadFile,
  loadoutOf,
  luckMul,
  gunName,
  salvageMul,
  skinDef,
  writeFile,
  grantStars,
  starTotal,
  type Campaign,
  type RunSnap,
  type SkinDef,
  type SkinId,
  type UpgradeId,
} from "./meta";
import {
  BOMB_LINES,
  BOSS_LINES,
  DUEL_TAUNTS,
  MINI_LINES,
  levelKind,
  HONEY_RING,
  DEATH,
  BOOST_MAX,
  BOOST_TIME,
  DRYER_LIFE,
  DUEL_GUNS,
  STYLE,
  familyColor,
  mistPower,
  LAST_WORDS,
  arcadeStage,
  bossScript,
  bossSignature,
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
  type LevelKind,
  type VHazard,
} from "./v3";

export let WORLD_W = 1280;
export let WORLD_H = 720;
export let VIEW = 1;

export type Kind = "dart" | "wedge" | "cruiser" | "drone" | "boss";
/** W gun gift, S shield, B bomb, M second-weapon ammo, $ coin, D duck, L extra life, G magnet, Y brush buddy, C coffee, T star */
export type PickupKind = "W" | "S" | "B" | "M" | "$" | "D" | "L" | "G" | "Y" | "C" | "T" | "F";
export type Mode = "menu" | "shop" | "options" | "standby" | "play" | "pause" | "over" | "clear" | "victory" | "bridge" | "levels" | "guide" | "ranks" | "arcadeover" | "duelover";
export type Motion = "rank" | "sine" | "swoop" | "pincer" | "hold" | "boss" | "spiral" | "zigzag" | "conga" | "rain" | "dive" | "fall";
export type Cue =
  | "kill"
  | "big"
  | "hit"
  | "graze"
  | "pickup"
  | "hurt"
  | "shield"
  | "bomb"
  | "wave"
  | "boss"
  | "clean"
  | "drive"
  | "missile"
  | "plink"
  | "splat"
  | "fart"
  | "flush"
  | "valve"
  | "ready"
  | "card";

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
  /** which pilot fired it: 0 pilot, 1 wingman */
  owner?: number;
  /** Zap Brush: jumps left */
  chain?: number;
  /** 0 small, 1 medium, 2 large: which drawing a player shot wears */
  rank?: number;
  /** Sponge Bomber: enemy shots it can still soak up, and how many it has */
  soak?: number;
  soaked?: number;
  /** Rubber Slingshot: seconds of squash left after a bounce */
  squash?: number;
  /** a number of its own, so the drawing can differ from shot to shot */
  seed?: number;
  /** which pull of the trigger it came from */
  volley?: number;
};

/** A short-lived picture where a shot landed. */
export type Puff = { x: number; y: number; life: number; max: number; style: number; size: number };
/** A lightning jump between two critters. */
export type Arc = { x1: number; y1: number; x2: number; y2: number; life: number };

/** A critter's picture for the moment after it dies: it swells, goes white and is gone. */
export type Pop = { x: number; y: number; look: number; kind: Kind; ch: number; role: string; size: number; life: number; max: number; spin: number; hurt: boolean };
/** The mess left on the sky where something died. */
export type Splat = { x: number; y: number; r: number; life: number; max: number; seed: number; color: string };

/** Two pilots against each other: one at the bottom, one at the top, first to three rounds. */
export type Duel = {
  hp: [number, number];
  wins: [number, number];
  round: number;
  state: "ready" | "fight" | "ko";
  /** seconds left on the countdown, or on the pause after a knockout */
  wait: number;
  giftT: number;
  /** who took the last round, -1 before the first */
  last: number;
  taunt: string;
  /** seconds this round has been fought: a long round turns into sudden death */
  clock: number;
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
  /** Flying in to its place in the formation: where it holds, and how far off that it still is. */
  path?: { hx: number; hy: number; dx: number; dy: number; cx: number; cy: number; u: number; dur: number };
  /** how far the sprite banks into its turn while flying in */
  lean?: number;
  /** boss: volleys fired so far, to time its own attack */
  sig?: number;
  /** pilot whose shot last hit it, for the two-pilot kill tally */
  by?: number;
  /** true when the enemy left the screen alive: removed without a kill or rewards */
  gone?: boolean;
  /** boss charge timer (seconds into the charge), undefined when not charging */
  dash?: number;
  dashX?: number;
  /** boss banners already shown, so each one appears once */
  said?: string[];
  /** Hair Dryer: how fast it is being blown back up the screen, world pixels a second */
  push?: number;
  /** Squeaky Duck: seconds it still moves and shoots at half speed */
  slow?: number;
  /** boss: the weak point showing right now, where it sits on the boss and how much it still takes */
  weak?: { dx: number; dy: number; r: number; hp: number; max: number; name: string; age: number } | null;
  /** boss: weak points still to come, and the seconds until the next one shows */
  weakLeft?: number;
  weakWait?: number;
  /** Hair Dryer: the last breath that touched it, and how many of its puffs did */
  airId?: number;
  airN?: number;
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
  /** current flying speed, world pixels a second */
  mx: number;
  my: number;
  muzzle: number;
  /** ammo for the second weapon */
  missiles: number;
  missileCd: number;
  /** which second weapon the ammo is for: 0 plunger missile, 1 bath bomb, 2 paper roll */
  sec: number;
  /** seconds left on the Brush Buddy and the Magnet */
  buddy: number;
  magnet: number;
  /** seconds left on the Coffee (fires faster) and the Star (cannot be hurt) */
  rush: number;
  star: number;
  family: GunFamily;
  /** gift boost: power steps on top of `weapon`, and the seconds they still last */
  boost: number;
  boostT: number;
  splat: number;
  slow: number;
  insured: boolean;
  /** perk Second Wind: still to be used on this level */
  wind?: boolean;
  /** two pilots only: shot down and waiting for the partner to fly over */
  down?: boolean;
  /** seconds the partner has spent reviving this pilot */
  revive?: number;
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
  /** achievement banners waiting their turn at the top of the screen */
  toasts: { text: string; life: number }[];
  puffs: Puff[];
  arcs: Arc[];
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
  /** which pilot lost the last duel of this sitting, and wears the mop until the page is closed: 0, 1 or null */
  cleaner: number | null;
  /** times the perk offer on the table has been rolled again */
  perkRolls: number;
  /** the shop's firing range: a throwaway world that shows a gun at work. Never saved, never cleared, nothing shoots back. */
  range?: boolean;
  rangeT?: number;
  starShow: string;
  daily: boolean;
  /** kills this level by pilot and wingman */
  tally: [number, number];
  /** both pilots flying close: shared damage bonus */
  link: boolean;
  linkCd: number;
  pops: Pop[];
  splats: Splat[];
  /** the name card of a boss or mini-boss that has just arrived; nothing hurts it until the card is gone */
  intro: { t: number; max: number; tag: string; title: string; sub: string } | null;
  /** which set piece this level is */
  kind: LevelKind;
  /** poop storm: when the last drop falls, on the spawn clock */
  stormEnd: number;
  /** two pilots: each one's Super Flush charge, 0..100 */
  team: [number, number];
  /** one pilot has called the Super Flush and waits a moment for the other */
  superWait: { who: number; t: number } | null;
  /** seconds left of the Super Flush whirl on screen */
  superT: number;
  superTold: boolean;
  /** two pilots: levels each has won on kills since they took off */
  series: [number, number];
  duel: Duel | null;
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
  /** analog stick, -1..1 on each axis; overrides the direction keys when it is pushed */
  stick?: { x: number; y: number } | null;
  /** touch: how far the finger moved since the last step, in world pixels */
  drag?: { dx: number; dy: number } | null;
  /** second weapon button */
  alt?: boolean;
  wingStick?: { x: number; y: number } | null;
  wingAlt?: boolean;
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
  line?: number;
  entry?: number;
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
  w.player.y = clamp(w.player.y, w.duel ? WORLD_H * 0.53 : laneTop(), WORLD_H - 36);
  if (w.wing) {
    place(w.wing);
    w.wing.x = clamp(w.wing.x, 22, WORLD_W - 22);
    w.wing.y = w.duel ? clamp(w.wing.y, 40, WORLD_H * 0.47) : clamp(w.wing.y, laneTop(), WORLD_H - 36);
  }
  for (const h of w.hazards) {
    h.x *= sx;
    if (h.x2 !== undefined) h.x2 *= sx;
    if (h.kind === "pipe") h.phase *= sx;
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
    toasts: [],
    puffs: [],
    arcs: [],
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
    cleaner: null,
    perkRolls: 0,
    starShow: "",
    daily: false,
    tally: [0, 0],
    link: false,
    linkCd: 0,
    pops: [],
    splats: [],
    intro: null,
    kind: "waves",
    stormEnd: 0,
    team: [0, 0],
    superWait: null,
    superT: 0,
    superTold: false,
    series: [0, 0],
    duel: null,
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
    mx: 0,
    my: 0,
    muzzle: 0,
    missiles: 0,
    missileCd: 0,
    sec: 0,
    buddy: 0,
    magnet: 0,
    rush: 0,
    star: 0,
    family: "bubble",
    boost: 0,
    boostT: 0,
    splat: 0,
    slow: 0,
    insured: false,
  };
}

/** The power a pilot's gun fires at right now: what the shop sold, plus any gift boost still running. */
export function gunRank(p: Player) {
  return Math.max(1, Math.min(6, p.weapon + (p.boostT > 0 ? p.boost : 0)));
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
    weapon2: w.wing?.weapon,
    family2: w.wing?.family,
  };
}

export function persist(w: World, run: RunSnap | null) {
  // the firing range is a second world next to the real one: it must never reach the save
  if (w.range) return;
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
  // a duel is a party game on the side: it never becomes the saved run
  if (w.duel) return;
  const live = w.mode === "play" || w.mode === "pause";
  persist(w, live ? liveSnap(w) : w.snap);
}

export function openMode(w: World, mode: Mode) {
  if (mode === "menu" && w.duel) {
    endDuel(w);
    return;
  }
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

/**
 * How hard the world pushes back right now: enemy toughness, how much they shoot and how
 * fast, what it pays, and how long a boss's marked strike waits. Set by the difficulty,
 * the New Game+ loop, or the arcade lap.
 */
/** How many times a perk is held, for the rules of the level being flown. Perks are the campaign's: not the arcade, a duel or the firing range. */
function perk(w: World, id: string) {
  if (w.arcade || w.duel || w.range) return 0;
  return perkCount(w.meta.perks, id);
}

/** After a mini-boss or a boss: three perks on the table, kept in the save until one is picked. */
function offerPerks(w: World) {
  const offer = rollPerks(w.meta.perks, w.coop, w.rng);
  w.meta.perkOffer = offer.length ? offer : null;
  w.perkRolls = 0;
}

export function pickPerk(w: World, id: string) {
  if (!w.meta.perkOffer || !w.meta.perkOffer.includes(id) || !perkDef(id)) return false;
  w.meta.perks.push(id);
  w.meta.perkOffer = null;
  w.perkRolls = 0;
  w.cues.push("clean");
  persist(w, w.snap);
  return true;
}

/** Pays to see three other perks. */
/** What seeing three other perks costs right now. */
export function rerollCost(w: World) {
  return rerollPrice(w.perkRolls);
}

export function rerollPerks(w: World) {
  const price = rerollPrice(w.perkRolls);
  if (!w.meta.perkOffer || w.meta.dollars < price) return false;
  const next = rollPerks(w.meta.perks, w.coop || w.meta.crew === "coop", Math.random, w.meta.perkOffer);
  if (!next.length) return false;
  w.meta.dollars -= price;
  w.meta.perkOffer = next;
  w.perkRolls += 1;
  w.cues.push("pickup");
  persist(w, w.snap);
  return true;
}

export function tuning(w: World) {
  // perks that change what things pay and how fast enemy shots fly
  const pay = (1 + 0.2 * perk(w, "deep_pockets")) * (perk(w, "loan_shark") ? 1.5 : 1);
  const rush = perk(w, "sugar_rush") ? 1.12 : 1;
  if (w.arcade) {
    const lap = arcadeStage(w.arcadeStage).lap;
    return { hp: 1 + lap * 0.6, heat: 1 + lap * 0.2, speed: 1 + lap * 0.05, pay: 1, warn: 1 };
  }
  const d = Math.max(0, Math.min(2, w.meta.difficulty ?? 1));
  const loop = w.meta.loop ?? 0;
  return {
    hp: [1, 1, 1.2][d] * (1 + loop * 0.6),
    heat: [0.65, 1, 1.35][d] * (1 + loop * 0.15),
    speed: [0.88, 1, 1.12][d] * (1 + Math.min(3, loop) * 0.04) * rush,
    pay: [0.8, 1, 1.25][d] * (1 + loop * 0.5) * pay,
    warn: [1.4, 1, 0.85][d],
  };
}

export function setDifficulty(w: World, level: number) {
  w.meta.difficulty = Math.max(0, Math.min(2, Math.round(level)));
  persist(w, w.snap);
}

/** The campaign is finished: start it again from level 1, a loop tougher and better paid. */
export function newLoop(w: World) {
  w.meta.loop = (w.meta.loop ?? 0) + 1;
  w.meta.level = 1;
  w.level = 1;
  w.score = 0;
  w.record = false;
  persist(w, null);
  w.mode = "menu";
}

export function newMission(w: World) {
  w.meta.level = 1;
  w.meta.loop = 0;
  w.meta.perks = [];
  w.meta.perkOffer = null;
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

export function purchaseSkin(w: World, id: SkinId, seat: 0 | 1 = 0) {
  const result = buySkin(w.meta, id, seat);
  if (result === "ok") persist(w, w.snap);
  return result;
}

export function wearSkin(w: World, id: SkinId, seat: 0 | 1 = 0) {
  if (!equipSkin(w.meta, id, seat)) return false;
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
  w.meta.autoAdvance = on;
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

export function purchaseGun(w: World, family: GunFamily, seat: 0 | 1 = 0) {
  const result = buyGun(w.meta, family, seat);
  if (result === "ok") persist(w, w.snap);
  return result;
}

export function purchasePower(w: World) {
  const result = buyPower(w.meta);
  if (result === "ok") {
    bumpSnap(w);
    persist(w, w.snap);
  }
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
  w.puffs = [];
  w.arcs = [];
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
  w.tally = [0, 0];
  w.link = false;
  w.linkCd = 0;
  w.pops = [];
  w.splats = [];
  w.intro = null;
  w.stormEnd = 0;
  w.superWait = null;
  w.superT = 0;
}

/** Adds to a lifetime counter and pays out any achievement that it completes. */
function note(w: World, key: string, n = 1, max = false) {
  const now = w.meta.tally[key] ?? 0;
  w.meta.tally[key] = max ? Math.max(now, n) : now + n;
  for (const f of claimFeats(w.meta)) {
    w.toasts.push({ text: `${f.name.toUpperCase()}  +$${f.cash}`, life: 3.2 });
    w.cues.push("clean");
  }
}

/** Pays for a room of the Poop-Dex the moment its last page is filled, and for the whole album after the tenth. */
function dexCheck(w: World, ch: number) {
  if (ch < 0 || w.meta.tally[`dexRoom${ch}`] || !dexRoomDone(w.meta, ch)) return;
  w.meta.tally[`dexRoom${ch}`] = 1;
  w.meta.dollars += DEX_ROOM_CASH;
  w.toasts.push({ text: `POOP-DEX: ${DEX_ROOMS[ch].title.toUpperCase()} COMPLETE  +$${DEX_ROOM_CASH}`, life: 3.6 });
  w.cues.push("clean");
  if (!w.meta.tally.dexAll && DEX_ROOMS.every((_, i) => w.meta.tally[`dexRoom${i}`])) {
    w.meta.tally.dexAll = 1;
    w.meta.dollars += DEX_ALL_CASH;
    w.toasts.push({ text: `POOP-DEX COMPLETE  +$${DEX_ALL_CASH}`, life: 4.5 });
  }
}

/** A critter shot down goes into the Poop-Dex: counted every time, announced the first. */
function dexLog(w: World, e: Enemy) {
  if (w.range) return;
  const id = lookId(e.look);
  const had = w.meta.dex[id] ?? 0;
  w.meta.dex[id] = had + 1;
  if (had > 0) return;
  // a new page: say so, unless the corner is already busy saying other things
  if (w.toasts.length < 2) w.toasts.push({ text: `POOP-DEX: ${dexName(id).toUpperCase()}`, life: 1.8 });
  dexCheck(w, dexRoomOf(id));
}

/** The ship a pilot is flying: the wingman has a hangar slot of their own. */
export function shipOf(w: World, p: Player) {
  const def = skinDef(p === w.wing ? w.meta.skin2 : w.meta.skin);
  return w.duel ? fairShip(def) : def;
}

const fair = new Map<string, SkinDef>();

/** In a duel every ship flies the same: only the looks differ. */
function fairShip(def: SkinDef): SkinDef {
  let f = fair.get(def.id);
  if (!f) {
    f = { ...def, speed: 1, hit: 1, rate: 1, dmg: 1, shield: false, buddy: false, magnet: 0, charge: 1, ammo: 0, cash: 1 };
    fair.set(def.id, f);
  }
  return f;
}

function parkPlayer(w: World, snap: RunSnap | null) {
  const kit = loadoutOf(w.meta);
  const p = w.player;
  const ship = skinDef(w.meta.skin);
  p.x = WORLD_W / 2;
  p.y = Math.max(laneTop(), WORLD_H - 110);
  p.lives = w.arcade ? (snap?.lives ?? 3) : (snap?.lives ?? kit.lives);
  // campaign: the power bought in the shop, always. Arcade has no shop: there gifts still build the gun up.
  p.weapon = w.arcade ? (snap?.weapon ?? 1) : kit.weapon;
  if (w.arcade && !snap) {
    p.boost = 0;
    p.boostT = 0;
  }
  p.bombs = w.arcade ? (snap?.bombs ?? 2) : (snap?.bombs ?? kit.bombs);
  p.shield = (w.arcade ? false : (snap?.shield ?? false)) || !!ship.shield;
  p.feed = snap?.feed ?? 0;
  p.missiles = w.arcade ? 0 : Math.max(kit.missiles, snap?.missiles ?? 0);
  p.missileCd = 0.4;
  // the gun is the one equipped in the shop: nothing in the field changes it
  p.family = kit.family;
  p.sec = 0;
  p.buddy = 0;
  p.magnet = 0;
  p.rush = 0;
  p.star = 0;
  p.splat = 0;
  p.slow = 0;
  p.insured = !w.arcade && w.meta.upgrades.insurance > 0;
  // perks picked on this run
  if (perk(w, "glass_cannon")) p.lives = Math.max(1, p.lives - 1);
  p.bombs = Math.min(5, p.bombs + perk(w, "bomb_bag"));
  if (perk(w, "spare_roll")) p.shield = true;
  p.wind = perk(w, "second_wind") > 0;
  note(w, `gun_${p.family}`);
  p.down = false;
  p.revive = 0;
  p.inv = 1.35;
  p.alive = true;
  p.fireCd = 0.2;
  p.speedUp = 0;
  p.bank = 0;
  p.mx = 0;
  p.my = 0;
  p.muzzle = 0;
  w.score = snap?.score ?? 0;
  if (w.coop) {
    const wing = freshPlayer();
    wing.weapon = w.arcade ? (snap?.weapon2 ?? p.weapon) : kit.weapon;
    // a gift boost still running carries into the next level
    wing.boost = w.wing?.boost ?? 0;
    wing.boostT = w.wing?.boostT ?? 0;
    const ship2 = skinDef(w.meta.skin2);
    wing.bombs = p.bombs;
    // each pilot's lives follow their own ship
    wing.lives = Math.max(1, p.lives - ship.lives + ship2.lives);
    wing.shield = !!ship2.shield || perk(w, "spare_roll") > 0;
    wing.wind = perk(w, "second_wind") > 0;
    wing.inv = 1.35;
    wing.fireCd = 0.2;
    wing.missiles = p.missiles;
    wing.missileCd = 0.55;
    wing.family = kit.family2;
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

/** Where the firing range keeps its ship and its targets, in world pixels from the top. */
export const RANGE_TOP = 96;
export const RANGE_BOTTOM = 420;
const RANGE_SHIP_Y = 372;
const RANGE_SLOTS: { dx: number; y: number; kind: Kind }[] = [
  { dx: -92, y: 236, kind: "dart" },
  { dx: -46, y: 236, kind: "drone" },
  { dx: 0, y: 236, kind: "dart" },
  { dx: 46, y: 236, kind: "drone" },
  { dx: 92, y: 236, kind: "dart" },
  { dx: -69, y: 190, kind: "wedge" },
  { dx: -23, y: 190, kind: "drone" },
  { dx: 23, y: 190, kind: "drone" },
  { dx: 69, y: 190, kind: "wedge" },
  { dx: 0, y: 140, kind: "cruiser" },
];

/** A second world for the shop's firing range. It reads the save once and never writes it. */
export function createRange(): World {
  const w = createWorld(0);
  w.range = true;
  return w;
}

/** Points the range at a gun: which one, at what power, on which ship, against the critters of which room. */
export function aimRange(w: World, family: GunFamily, rank: number, skin: SkinId, level: number) {
  if (!w.range) return;
  // the first level of the room: ordinary waves, and the critters the pilot is about to meet
  const n = Math.floor((clamp(level, 1, LEVELS) - 1) / 10) * 10 + 1;
  w.meta.gun = family;
  w.meta.power = clamp(Math.round(rank), 1, 6) - 1;
  w.meta.skin = skin;
  w.meta.crew = "solo";
  w.meta.upgrades.trigger = 0;
  w.arcade = false;
  w.daily = false;
  w.duel = null;
  w.pinned = null;
  w.coop = false;
  w.wing = null;
  startSortie(w, { level: n, lives: 9, weapon: 1, bombs: 0, shield: false, score: 0, feed: 0, coop: false, missiles: 0, snacks: 0 });
  w.god = true;
  w.spawns = [];
  w.enemies = [];
  w.hazards = [];
  w.pickups = [];
  w.bullets = [];
  w.intro = null;
  w.bossUp = false;
  w.kind = "waves";
  w.banner = "";
  w.bannerT = 0;
  w.cues = [];
  w.rangeT = 0;
  const p = w.player;
  p.x = WORLD_W / 2;
  p.y = RANGE_SHIP_Y;
  p.inv = 0;
  p.shield = false;
  p.missiles = 0;
  p.buddy = 0;
  p.boost = 0;
  p.boostT = 0;
}

/** One step of the firing range: the ship sways and fires, and every target that falls is replaced. */
export function stepRange(w: World, dt: number) {
  if (!w.range || w.mode !== "play") return;
  w.rangeT = (w.rangeT ?? 0) + dt;
  const t = w.rangeT;
  const cx = WORLD_W / 2;
  // keep every slot filled: a fallen target is back a moment later
  for (const slot of RANGE_SLOTS) {
    const x = cx + slot.dx;
    if (w.enemies.some((e) => e.hp > 0 && Math.abs(e.ox - x) < 2 && Math.abs((e.oy ?? 0) - slot.y) < 2)) continue;
    if (w.pops.some((q) => Math.abs(q.x - x) < 30 && q.life > 0)) continue;
    spawnEnemy(w, slot.kind, x, "rank", undefined, RANGE_TOP - 40, 0, undefined, slot.y);
    const e = w.enemies[w.enemies.length - 1];
    if (e) {
      e.oy = slot.y;
      e.y = Math.max(RANGE_TOP - 40, slot.y - 120);
      // the same small targets on every screen, so the window always holds the whole line-up
      e.r /= e.size ?? 1;
      e.size = 1;
    }
  }
  w.formX = 0;
  w.freeze = 0;
  // sway left and right, with a pause in the middle, so a gun that bends shows it
  const phase = t % 6;
  const left = phase > 1.2 && phase < 2.3;
  const right = phase > 3.6 && phase < 4.7;
  const back = Math.abs(w.player.x - cx) > 4 && !left && !right;
  step(w, dt, {
    left: left || (back && w.player.x > cx),
    right: right || (back && w.player.x < cx),
    up: false,
    down: false,
    focus: false,
    fire: true,
    bomb: false,
    pointer: null,
  });
  const p = w.player;
  p.y = RANGE_SHIP_Y;
  p.x = clamp(p.x, cx - 96, cx + 96);
  p.alive = true;
  p.lives = 9;
  for (const e of w.enemies) {
    // the oldest targets drift down toward the ship: put them back on their line
    if (e.t > 12) e.t = 0;
  }
  w.cues.length = 0;
  w.floaters.length = 0;
  w.bannerT = 0;
  w.flash = 0;
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
  w.series = [0, 0];
  w.team = [0, 0];
  w.superTold = false;
  w.meta.crew = crew;
  w.pinned = null;
  w.arcade = false;
  w.daily = false;
  persist(w, w.snap);
  if (crew === "coop") startCoop(w);
  else startSolo(w);
}

/** Remembers whether one or two pilots fly; the menu's CONTINUE and NEW GAME use it. */
export function setCrew(w: World, crew: "solo" | "coop") {
  w.meta.crew = crew;
  persist(w, w.snap);
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

/** Leaves a replayed level and returns to the level map, with the campaign frontier restored. */
export function backToLevels(w: World) {
  if (w.pinned != null) w.meta.level = w.pinned;
  w.pinned = null;
  w.mode = "levels";
  persist(w, w.snap);
}

export function leaveRun(w: World) {
  if (w.arcade && w.purse > 0 && w.mode !== "arcadeover") {
    // quitting an arcade run between stages still pays out what was banked
    w.meta.dollars += Math.round(w.purse);
    w.purse = 0;
  }
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
  // a perk is waiting to be picked: that comes first
  if (!w.arcade && w.meta.perkOffer) return;
  if (w.arcade) {
    // the Daily run stops at stage 30; plain Arcade keeps lapping until you are out of lives
    w.arcadeStage = w.daily ? Math.min(30, w.arcadeStage + 1) : w.arcadeStage + 1;
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
    weapon2: w.wing ? Math.max(w.wing.weapon, kit.weapon) : undefined,
    family2: w.wing?.family,
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
  w.kind = levelKind(n);
  w.stormEnd = 0;
  w.intro = null;
  const planned = planLevel(n, WORLD_W, WORLD_H, (w.seed || n * 997) + n * 13);
  w.hazards = planHazards(n, WORLD_W, WORLD_H);
  if (isBossLevel(n)) {
    const line = BOSS_LINES[Math.min(9, Math.floor((n - 1) / 10))];
    // the boss gets a name card instead of a banner, and holds its fire until the card is gone
    w.banner = "";
    w.bannerT = 0;
    w.intro = { t: 2.6, max: 2.6, tag: `${ch.name.toUpperCase()} · BOSS`, title: line ? line[0] : ch.boss.toUpperCase(), sub: line?.[1] ?? "" };
    w.bossUp = true;
    w.cues.push("boss");
    w.cues.push("card");
    spawnEnemy(w, "boss", WORLD_W / 2, "boss", undefined, -48);
    const boss = w.enemies[w.enemies.length - 1];
    if (boss) boss.fire = 2.9;
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
  w.bannerT = planned.bonus || w.kind !== "waves" ? 2.4 : 1.25;
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
    line: s.line,
    entry: s.entry,
  }));
  grant(list, n);
  w.spawns = list;
  if (w.kind === "storm") w.stormEnd = list.reduce((m, sp) => Math.max(m, sp.at), 0) + 4.5;
  // a pipe run counts its pipes: every one burst at the valve is one "shot down"
  if (w.kind === "pipes") w.born = w.hazards.reduce((m, h) => m + (h.kind === "pipe" ? 1 : 0), 0);
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

const TRICKS = new Set(["moth", "gnat", "hermit", "mother", "honey", "ghost", "forge", "spark", "watcher", "splash"]);

function spawnEnemy(
  w: World,
  kind: Kind,
  x: number,
  motion: Motion,
  drop?: PickupKind,
  y = -28,
  vx = 0,
  spin?: number,
  oy?: number,
  value = 0,
  role = "",
  line = Number.NaN,
  entry = 0,
) {
  const level = Math.max(1, w.level);
  const ch = Math.min(9, Math.floor((level - 1) / 10));
  // a critter with a trick is never the one-hit small fry
  if (kind === "dart" && TRICKS.has(role)) kind = "drone";
  const body = enemyBody(kind, level);
  const size = sizeMul(WORLD_W);
  let hp = body.hp;
  let r = body.r * size;
  // a lid or a broom is tougher than the small fry it shields, and hides behind a plate
  if (role === "wall") hp = Math.ceil(hp * 1.5);
  // the shell already makes it slow to kill; keep it from becoming a sponge
  if (role === "hermit") hp = Math.max(4, Math.ceil(hp * 0.6));
  // two guns on the field: critters take a third more, bosses half as much again
  if (w.coop) hp = Math.ceil(hp * (kind === "boss" ? 1.5 : 1.35));
  if (kind !== "boss") hp = Math.ceil(hp * tuning(w).hp);
  else hp = Math.round(hp * (1 + (tuning(w).hp - 1) * 0.6));
  if (role === "chip" || role === "rain" || role === "spore") hp = 1;
  if (role === "forge") {
    /* plate is the armor */
  }
  let score = body.score;
  let vy = role === "rain" ? 180 : motion === "conga" ? 120 : body.vy;
  if (role === "storm" || role === "stormbig") {
    // storm poop: the big ones are slow and tough and burst into three
    const d = Math.min(1, (level - 1) / 99);
    const big = role === "stormbig";
    if (big) hp = Math.ceil((4 + level / 8) * (w.coop ? 1.35 : 1) * tuning(w).hp);
    r = (big ? 27 : 15) * size;
    vy = (150 + 110 * d) * (big ? 0.62 : 0.9 + w.rng() * 0.22) * tuning(w).speed;
  }
  if (role === "mini") {
    // the room's heavy at nearly twice the size, with a fifth of a boss's health
    hp = Math.round(enemyBody("boss", level).hp * 0.2 * (w.coop ? 1.35 : 1) * tuning(w).hp);
    r = body.r * size * 1.75;
    score = body.score * 5;
  }
  const fire = motion === "boss" ? 1.1 : role === "mini" ? 2.3 : 0;
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
    look: kind === "boss" ? ch : lookFor(ch, kind, role, line, w.born),
    role,
    warn: 0,
    plate: role === "forge" ? 12 : role === "wall" ? 4 : 0,
    hide: role === "hermit" ? 1.2 : 0,
    size,
  });
  if (entry > 0 && oy !== undefined && oy > 0) {
    // Fly in along a curve instead of dropping from the top: the critter is placed at
    // its slot and carries an offset that shrinks to nothing over the fly-in.
    const e = w.enemies[w.enemies.length - 1];
    const W = WORLD_W;
    const H = WORLD_H;
    const leftSide = x < W / 2;
    // start point and the point the curve bends toward, in world coordinates
    let sx = 0;
    let sy = 0;
    let bx = 0;
    let by = 0;
    const kind2 = entry === 5 ? (leftSide ? 1 : 2) : entry === 6 ? (leftSide ? 2 : 1) : entry;
    if (kind2 === 1) [sx, sy, bx, by] = [-60, H * 0.42, W * 0.3, -H * 0.05];
    else if (kind2 === 2) [sx, sy, bx, by] = [W + 60, H * 0.42, W * 0.7, -H * 0.05];
    else if (kind2 === 3) [sx, sy, bx, by] = [W * 0.15, -60, W * 0.95, H * 0.46];
    else if (kind2 === 4) [sx, sy, bx, by] = [W * 0.85, -60, W * 0.05, H * 0.46];
    else [sx, sy, bx, by] = [W / 2, -60, x, H * 0.34];
    e.y = oy;
    e.path = { hx: x, hy: oy, dx: sx - x, dy: sy - oy, cx: bx - x, cy: by - oy, u: 0, dur: 1.55 };
    e.x = sx;
    e.y = sy;
  }
  w.born += 1;
  if (role === "mini") {
    const e = w.enemies[w.enemies.length - 1];
    // slow enough that a shot fired from the bottom of the screen still finds it
    e.vx = -clamp(WORLD_W * 0.05, 34, 60);
    w.intro = { t: 1.8, max: 1.8, tag: "MINI-BOSS", title: `BIG ${lookName(e.look).toUpperCase()}`, sub: MINI_LINES[ch] ?? "" };
    w.cues.push("boss");
    w.cues.push("card");
  }
  const id = role || kind;
  if (!w.meta.seen.includes(id)) w.meta.seen.push(id);
}

const MUCK = ["#6a4424", "#7a5230", "#5a3a1e", "#84582c"];

/** Leaves a mess on the sky. */
function splat(w: World, x: number, y: number, r: number, color?: string) {
  if (w.splats.length > 26) w.splats.shift();
  const life = w.reduce ? 0.45 : 0.9;
  w.splats.push({ x, y, r, life, max: life, seed: Math.floor(w.rng() * 1000), color: color ?? MUCK[Math.floor(w.rng() * MUCK.length)] });
}

/** The dying critter's picture, kept for a moment so the kill can be seen. */
function pop(w: World, e: Enemy) {
  if (w.pops.length > 24) w.pops.shift();
  const life = e.kind === "boss" ? 0.55 : e.role === "mini" ? 0.4 : e.kind === "cruiser" ? 0.3 : 0.2;
  w.pops.push({ x: e.x, y: e.y, look: e.look, kind: e.kind, ch: e.ch, role: e.role, size: e.size ?? 1, life, max: life, spin: e.spin, hurt: e.mark >= 2 });
}

/** Two pilots: kills fill each one's Super Flush charge. */
function addTeam(w: World, who: number, amount: number) {
  if (!w.wing || w.duel || w.arcade || (who !== 0 && who !== 1)) return;
  w.team[who] = Math.min(100, w.team[who] + amount);
  if (!w.superTold && w.team[0] >= 100 && w.team[1] >= 100) {
    w.superTold = true;
    w.banner = "SUPER FLUSH READY – BOTH PRESS BOMB";
    w.bannerT = 2.2;
    w.cues.push("ready");
  }
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
  if (show) float(w, x, y - 8, String(gained), gained >= 200);
  if ((prev < 10 && w.chain >= 10) || (prev < 20 && w.chain >= 20) || (prev < 30 && w.chain >= 30)) {
    float(w, x, y - 26, `x${multiplierOf(w).toFixed(1)}`, true);
  }
}

function bank(w: World, amount: number, x: number, y: number, show: boolean) {
  if (w.range) return;
  const cart = Math.max(shipOf(w, w.player).cash ?? 1, w.wing ? (shipOf(w, w.wing).cash ?? 1) : 1);
  const n = Math.max(1, Math.round(amount * cart * tuning(w).pay * (w.arcade ? 0.5 : salvageMul(w.meta.upgrades.salvage))));
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
  addTrauma(w, e.role === "mini" ? 0.8 : trauma);
  if (e.kind === "boss") w.hitstop = 0.12;
  else if (e.role === "mini") w.hitstop = 0.09;
  else if (e.kind === "cruiser") w.hitstop = 0.05;
  else if (e.kind === "drone") w.hitstop = 0.026;
  const poop = e.role === "storm" || e.role === "stormbig";
  pop(w, e);
  splat(w, e.x, e.y, e.r * (e.kind === "boss" ? 3 : big ? 2.2 : poop ? 1.9 : 1.5), poop ? undefined : w.rng() < 0.5 ? undefined : pal.flame);
  if (e.kind === "boss") {
    w.cues.push("big");
    w.cues.push("flush");
  } else if (big) w.cues.push("fart");
  else w.cues.push(poop ? "splat" : "kill");
  if (e.by === 0 || e.by === 1) {
    w.tally[e.by] += 1;
    addTeam(w, e.by, e.kind === "cruiser" ? 10 : e.kind === "boss" ? 0 : 2.5);
  }
  addScore(w, e.score, e.x, e.y, big);
  if (e.kind === "cruiser") {
    float(w, e.x, e.y - 22, lookName(e.look).toUpperCase(), true);
    if (w.rng() < 0.25) float(w, e.x, e.y - 40, LAST_WORDS[Math.floor(w.rng() * LAST_WORDS.length)] ?? "WORTH IT");
  }
  if (e.role !== "chip" && e.role !== "spore" && e.role !== "rain" && !poop) note(w, "kills");
  if (!poop && e.kind !== "boss") dexLog(w, e);
  const zone = perk(w, "splash_zone");
  if (zone > 0 && !big && e.role !== "mini" && e.role !== "chip" && e.role !== "spore" && e.role !== "rain" && !poop) {
    // perk Splash Zone: small fry burst and hurt whatever is next to them
    const reach = 58 + e.r;
    let wet = false;
    for (const o of w.enemies) {
      if (o === e || o.hp <= 0 || hermitHidden(o)) continue;
      if (Math.hypot(o.x - e.x, o.y - e.y) > reach + o.r * 0.4) continue;
      o.hp -= Math.max(1, e.max * 0.45 * zone) * (o.kind === "boss" || o.role === "mini" ? 0.5 : 1);
      o.by = e.by;
      o.flash = Math.max(o.flash, 0.1);
      wet = true;
    }
    if (wet) ring(w, e.x, e.y, "#9fd8ff", 0.2, reach * 0.5, 1.6);
  }
  if (e.kind === "boss") {
    // whatever it had marked dies with it
    w.hazards = w.hazards.filter((h) => h.kind !== "strike" && h.kind !== "sweep");
    if (!w.arcade) {
      note(w, `boss${e.ch}`);
      dexCheck(w, e.ch);
      if (w.bombsUsed === 0) note(w, "bossNoBomb");
      if (e.ch === 9 && (w.meta.loop ?? 0) > 0) note(w, "loopKing");
    }
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
  chargeBomb(w, e.kind === "cruiser" ? 5 : 0.35);
  if (!w.duck && w.rng() < 0.03) {
    w.duck = true;
    dropPickup(w, "D", e.x, e.y, 0);
  }
  if (e.role === "bonus" && w.rng() < 0.45) dropPickup(w, "F", e.x, e.y, 5 + Math.floor(w.level * 0.25));
  if (e.role === "stormbig") {
    for (let i = -1; i <= 1; i++) spawnEnemy(w, "dart", e.x + i * 14, "fall", undefined, e.y, i * 70, i, e.y, 0, "storm");
  }
  if (e.role === "mini") {
    note(w, "minis");
    miniLoot(w, e);
    return;
  }
  if (e.role === "splash") {
    // Auto-Flush: goes out with a splash, a low fan of slow shots straight down
    for (let i = -2; i <= 2; i++) pushHostile(w, e.x, e.y, Math.PI / 2 + i * 0.3, 150, 5, 0);
  }
  if (e.role === "gnat" || e.role === "mother") {
    const bits = e.role === "mother" ? 4 : 3;
    for (let i = 0; i < bits; i++) {
      spawnEnemy(w, "dart", e.x, "rain", undefined, e.y, (i - 1) * 40, i, e.y, 0, e.role === "mother" ? "spore" : "chip");
    }
  }
  if (w.range) return;
  if (e.drop) {
    dropPickup(w, e.drop, e.x, e.y, e.dropValue);
  } else {
    const base = e.kind === "cruiser" ? 0.28 : e.kind === "wedge" ? 0.16 : e.kind === "drone" ? 0.13 : 0.11;
    // late formations are three times the size, so each enemy drops less often
    const thin = (1 - 0.5 * Math.min(1, (w.level - 1) / 99)) * (poop ? 0.35 : 1);
    const chance = Math.min(0.55, base * thin * luckMul(w.arcade ? 0 : w.meta.upgrades.luck) * (1 + 0.3 * perk(w, "lucky_seat")));
    // never more than a few gifts in the air: the screen belongs to the poop
    if (w.rng() < chance && w.pickups.length < 3) {
      const roll = w.rng();
      const kind: PickupKind =
        roll < 0.33 ? "W" : roll < 0.5 ? "M" : roll < 0.63 ? "S" : roll < 0.74 ? "B" : roll < 0.79 ? "G" : roll < 0.84 ? "Y" : roll < 0.89 ? "C" : roll < 0.91 ? "T" : roll < 0.925 ? "L" : "$";
      dropPickup(w, kind, e.x, e.y, kind === "$" ? 5 + Math.floor(w.level * 0.3) : 0);
    }
  }
}

/** A mini-boss pays out like a small boss: a gun gift, a shield and a handful of coins. */
function miniLoot(w: World, e: Enemy) {
  const base = 10 + Math.round(w.level * 0.5);
  const items: { kind: PickupKind; value: number }[] = [
    { kind: "$", value: base },
    { kind: "W", value: 0 },
    { kind: "$", value: base + 6 },
    { kind: "S", value: 0 },
    { kind: "$", value: base + 12 },
  ];
  items.forEach((item, i) => {
    const a = Math.PI * (0.1 + (0.8 * i) / (items.length - 1));
    w.pickups.push({ kind: item.kind, value: item.value, x: e.x, y: e.y + 6, vx: Math.cos(a) * 46, vy: 44 + (i % 3) * 9, rest: 0 });
  });
  float(w, e.x, e.y - 40, "LOOT", true);
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

/**
 * Every kill charges the next bomb; a full charge (100) hands one over. This
 * replaced the snack pickups, which buried the screen in small falling things.
 */
function chargeBomb(w: World, amount: number) {
  const boost = w.arcade ? 1 : w.meta.upgrades.pockets >= 2 ? 1.5 : w.meta.upgrades.pockets === 1 ? 1.25 : 1;
  const tuned = Math.max(shipOf(w, w.player).charge ?? 1, w.wing ? (shipOf(w, w.wing).charge ?? 1) : 1);
  w.snacks += amount * boost * tuned;
  while (w.snacks >= 100) {
    w.snacks -= 100;
    const p = w.player.alive ? w.player : (w.wing ?? w.player);
    if (w.player.bombs >= 5) {
      w.score += 2000;
      float(w, p.x, p.y - 28, "+2,000", true);
    } else {
      w.player.bombs += 1;
      if (w.wing) w.wing.bombs = w.player.bombs;
      float(w, p.x, p.y - 28, "BOMB READY +1", true);
      cheer(w, p.x, p.y, "#e07a3d");
      w.cues.push("pickup");
    }
  }
}

function takePickup(w: World, kind: PickupKind, value: number, who: Player = w.player) {
  const p = who;
  if (kind === "W") {
    if (w.arcade) {
      // no shop in the arcade: there a gift is a power step you keep until you are hit
      if (p.weapon < 6) {
        p.weapon += 1;
        w.cues.push("pickup");
        float(w, p.x, p.y - 28, gunName(p.weapon, p.family), true);
      } else {
        p.feed = 6.5;
        w.cues.push("drive");
        float(w, p.x, p.y - 28, "AFTERBURNER", true);
      }
    } else {
      // campaign: power is bought in the shop. A gift lends one step more for a while,
      // two gifts lend two; past that, or at full power, it lights the afterburner.
      const had = p.boostT > 0 ? p.boost : 0;
      const room = gunRank(p) < 6 && had < BOOST_MAX;
      if (room) {
        p.boost = had + 1;
        w.cues.push("pickup");
        float(w, p.x, p.y - 28, `POWER +${p.boost} – ${gunName(Math.min(6, p.weapon + p.boost), p.family)}`, true);
      } else {
        p.feed = 6.5;
        w.cues.push("drive");
        float(w, p.x, p.y - 28, "AFTERBURNER", true);
      }
      p.boostT = BOOST_TIME + 10 * perk(w, "long_ribbon");
    }
    cheer(w, p.x, p.y, familyColor(p.family));
  } else if (kind === "S") {
    p.shield = true;
    if (perk(w, "shared_bubble") && w.wing) {
      w.player.shield = true;
      w.wing.shield = true;
    }
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "SHIELD BUBBLE");
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
    const which = (((value || 0) % 3) + 3) % 3;
    const load = [3, 2, 2][which] + (shipOf(w, p).ammo ?? 0);
    // a crate of a different kind replaces what is loaded; the same kind tops it up
    p.missiles = Math.min(9, (p.sec === which ? p.missiles : 0) + load);
    p.sec = which;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, `${["PLUNGER MISSILES", "BATH BOMBS", "PAPER ROLLS"][which]} ×${load}`, true);
    cheer(w, p.x, p.y, "#e07a3d");
  } else if (kind === "L") {
    if (p.lives < 9) p.lives += 1;
    else w.score += 5000;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "EXTRA LIFE", true);
    cheer(w, p.x, p.y, "#f4e7cf");
  } else if (kind === "G") {
    p.magnet = 14;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "MAGNET", true);
    cheer(w, p.x, p.y, "#e9463f");
  } else if (kind === "F") {
    // bonus-round snacks: nothing but cash, and the only place food falls
    bank(w, value || 6, p.x, p.y, true);
  } else if (kind === "C") {
    p.rush = 9;
    w.cues.push("drive");
    float(w, p.x, p.y - 28, "COFFEE – FIRE RATE UP", true);
    cheer(w, p.x, p.y, "#c9a24a");
  } else if (kind === "T") {
    p.star = 6;
    p.inv = Math.max(p.inv, 6);
    w.cues.push("shield");
    float(w, p.x, p.y - 28, "STAR – NOTHING CAN TOUCH YOU", true);
    cheer(w, p.x, p.y, "#f4f1ea");
  } else if (kind === "Y") {
    p.buddy = 18;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "BRUSH BUDDY", true);
    cheer(w, p.x, p.y, "#4fd6e8");
  } else if (kind === "D") {
    w.freeze = w.bossUp ? 1.5 : 3;
    w.cues.push("pickup");
    float(w, p.x, p.y - 28, "RUBBER DUCK – EVERYONE STOPS TO LOOK", true);
    note(w, "ducks");
  } else {
    w.chain = Math.min(40, w.chain + 8);
    w.chainT = 2.1;
    w.cues.push("drive");
    float(w, p.x, p.y - 28, "CHAIN", true);
    cheer(w, p.x, p.y, "#e7eaee");
  }
}

function dropPickup(w: World, kind: PickupKind, x: number, y: number, value = 0) {
  if (w.range) return;
  const dir = Math.sign(w.player.x - x) || (w.rng() < 0.5 ? -1 : 1);
  // A gift box is a power boost for whatever gun you fly; it never swaps the gun.
  // An ammo crate is one of the three second weapons.
  let hue: number | undefined;
  if (kind === "M" || kind === "F") hue = Math.floor(w.rng() * 3);
  // food keeps its cash value; for gifts and crates the value says which one it is
  w.pickups.push({ kind, x, y, vx: dir * (12 + w.rng() * 16), vy: 70 + w.rng() * 40, value: kind === "F" ? value : (hue ?? value), rest: 0, hue });
}

function stepPickups(w: World, dt: number) {
  const crew = living(w);
  const baseMagnet = 1 + (w.meta.upgrades.magnet || 0) + 2 * perk(w, "sticky_fingers");
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
    const magnet = baseMagnet + (who.magnet > 0 ? 5 : 0) + (shipOf(w, who).magnet ?? 0);
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
  if (p.insured) {
    // Insurance: the first hit of the level is on the house
    p.insured = false;
    p.inv = 1.2;
    burst(w, p.x, p.y, "#f4e7cf", 12, 150, false);
    ring(w, p.x, p.y, "#f4e7cf", 0.28, 8, 1.5);
    addTrauma(w, 0.3);
    float(w, p.x, p.y - 30, "INSURED – NO LIFE LOST", true);
    w.bullets = w.bullets.filter((b) => b.friendly);
    w.cues.push("shield");
    return;
  }
  if (p.wind && p.lives <= 1) {
    // perk Second Wind: once a level, the last life holds
    p.wind = false;
    p.inv = 1.6;
    burst(w, p.x, p.y, "#ffd0d0", 14, 170, false);
    ring(w, p.x, p.y, "#ff8f8f", 0.32, 10, 2);
    addTrauma(w, 0.4);
    float(w, p.x, p.y - 30, "SECOND WIND", true);
    w.bullets = w.bullets.filter((b) => b.friendly);
    w.cues.push("shield");
    return;
  }
  p.lives -= 1;
  if (perk(w, "loan_shark") && w.meta.dollars > 0) {
    const fee = Math.min(50, w.meta.dollars);
    w.meta.dollars -= fee;
    float(w, p.x, p.y - 62, `LOAN SHARK -$${fee}`);
  }
  p.inv = 1.85;
  w.chain = 0;
  w.perfect = false;
  if (w.rng() < 0.3) {
    p.splat = 2;
    float(w, p.x, p.y - 24, "SPLAT");
  }
  if (w.arcade) {
    if (p.weapon > 1) {
      p.weapon -= 1;
      p.feed = 0;
      float(w, p.x, p.y - 46, gunName(p.weapon, p.family));
    }
  } else {
    // a hit knocks off the gift boost; the power bought in the shop stays
    if (p.boostT > 0 && p.boost > 0) float(w, p.x, p.y - 46, "BOOST LOST");
    p.boost = 0;
    p.boostT = 0;
    p.feed = 0;
  }
  w.flash = 0.22;
  addTrauma(w, 0.66);
  burst(w, p.x, p.y, "#e07a3d", 18, 200, true);
  w.bullets = w.bullets.filter((b) => b.friendly);
  w.cues.push("hurt");
  if (p.lives <= 0) {
    p.alive = false;
    p.speedUp = 0;
    // with a partner still flying, this pilot is only down: fly over the wreck to bring them back
    p.down = living(w).length > 0;
    p.revive = 0;
    if (p.down) {
      float(w, p.x, p.y - 40, p === w.wing ? "WING DOWN" : "PILOT DOWN", true);
      w.banner = "FLY OVER THE WRECK TO REVIVE";
      w.bannerT = 1.6;
    }
  }
  if (living(w).length === 0) {
    w.player.down = false;
    if (w.wing) w.wing.down = false;
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
      // all lives lost: the run's perks go with them
      w.meta.perks = [];
      w.meta.perkOffer = null;
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
  const family = p.family || "bubble";
  const rank = gunRank(p);
  const size = rank <= 2 ? 0 : rank <= 4 ? 1 : 2;
  const pack = volley(family, rank, focus);
  const ship = shipOf(w, p);
  const hot = (1 + 0.08 * perk(w, "hot_sauce")) * (perk(w, "glass_cannon") ? 1.25 : 1);
  const kick = (feed ? 1.18 : 1) * (w.link ? (perk(w, "buddy_bond") ? 1.4 : 1.25) : 1) * ship.dmg * hot;
  const owner = p === w.wing ? 1 : 0;
  // in a duel the top pilot faces down
  const up = w.duel && p === w.wing ? -1 : 1;
  const vid = Math.round(w.time * 1000) * 2 + owner;
  for (const s of pack.shots) {
    if (w.bullets.length > 260) break;
    w.bullets.push({
      x: p.x + s.ox,
      y: p.y + up * (-18 + (s.oy ?? 0)),
      vx: s.vx,
      vy: s.vy * up,
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
      owner,
      chain: s.chain,
      rank: size,
      bounces: s.bounces,
      soak: s.soak,
      seed: (w.time * 60 + w.bullets.length) | 0,
      volley: vid,
    });
    if (s.style === STYLE.bidet) {
      // the hose: every drop leaves with some of the ship's own sideways speed, so the jet bends and whips
      w.bullets[w.bullets.length - 1].vx += p.mx * 0.38;
    }
  }
  if (p.buddy > 0 && w.bullets.length < 260) {
    // the Brush Buddy circles the ship and adds a shot of its own to every volley
    const a = w.time * 3.1;
    w.bullets.push({
      x: p.x + Math.cos(a) * 34,
      y: p.y + Math.sin(a) * 14 - 6,
      vx: 0,
      vy: -700 * up,
      r: 2.4,
      friendly: true,
      dmg: 4 * pack.cd * kick,
      life: 1.2,
      homing: false,
      grazed: false,
      hot: false,
      tint: 0,
      style: STYLE.buddy,
      pierce: 0,
      splash: 0,
      owner,
      rank: 0,
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
      vy: -640 * up,
      r: 1.6,
      friendly: true,
      dmg: 0.35 * kick,
      life: 1.2,
      homing: false,
      grazed: false,
      hot: feed,
      tint: 0,
      style: STYLE[family],
      pierce: family === "paste" ? 1 : 0,
      splash: 0,
      owner,
      rank: 0,
      seed: i,
      volley: -vid - i - 1,
    });
  }
  p.muzzle = 0.05;
  const trig = 1 - (w.arcade ? 0 : w.meta.upgrades.trigger * 0.1);
  const quick = (1 / (1 + 0.06 * perk(w, "espresso"))) * (perk(w, "sugar_rush") ? 1 / 1.18 : 1);
  p.fireCd = Math.max(0.045, pack.cd * trig * ship.rate * (feed ? 0.7 : 1) * (p.rush > 0 ? 0.68 : 1) * quick);
}

/** The second weapon: whatever the last ammo crate was, one shot per press while ammo lasts. */
function tryMissile(w: World, p: Player, fire: boolean, dt: number) {
  p.missileCd = Math.max(0, p.missileCd - dt);
  if (!fire || !p.alive || p.missiles <= 0 || p.missileCd > 0) return;
  if (w.bullets.length > 200) return;
  // nothing to shoot at: keep the ammo
  if (!w.enemies.some((e) => e.hp > 0 && e.y > 0)) return;
  p.missiles -= 1;
  const owner = p === w.wing ? 1 : 0;
  const base = { friendly: true, grazed: false, hot: true, tint: 0, owner, rank: 1 } as const;
  if (p.sec === 1) {
    // Bath Bomb: lobbed ahead, bursts into foam on the first thing it meets or where it lands
    p.missileCd = 0.9;
    w.bullets.push({ ...base, x: p.x, y: p.y - 14, vx: 0, vy: -430, r: 7, dmg: 7, life: 0.85, homing: false, style: STYLE.bathBomb, pierce: 0, splash: 0 });
  } else if (p.sec === 2) {
    // Paper Roll: flies up to the nearest line of critters, then unrolls both ways along it
    p.missileCd = 0.9;
    w.bullets.push({ ...base, x: p.x, y: p.y - 14, vx: 0, vy: -560, r: 8, dmg: 4, life: 1.6, homing: false, style: STYLE.paperRoll, pierce: 0, splash: 0 });
  } else {
    p.missileCd = 0.46;
    const side = p.missiles % 2 === 0 ? 1 : -1;
    w.bullets.push({ ...base, x: p.x + side * 12, y: p.y - 6, vx: side * 70, vy: -240, r: 3.6, dmg: 3.4, life: 2.6, homing: true, style: STYLE.plunger, pierce: 0, splash: 18 });
  }
  w.cues.push("missile");
}

function puff(w: World, x: number, y: number, style: number, size: number, life = 0.16) {
  if (w.reduce && life < 0.2) return;
  if (w.puffs.length > 36) w.puffs.shift();
  w.puffs.push({ x, y, life, max: life, style, size });
}

const WEAK_NAMES = ["VALVE", "LID", "HANDLE", "PLUG"];
/** Where a boss's weak points sit, in boss radii from its middle: low on the rim, where shots from below reach first. */
const WEAK_SPOTS: [number, number][] = [
  [-0.72, 0.52],
  [0.72, 0.52],
  [0, 0.9],
  [-0.4, 0.8],
];

/** A boss shows its weak points one at a time: three in a fight, four on the Toilet King. */
function stepWeak(w: World, e: Enemy, dt: number) {
  if (w.intro || w.range) return;
  if (e.weakLeft === undefined) {
    e.weakLeft = w.level >= LEVELS ? 4 : 3;
    e.weakWait = 6;
  }
  if (e.weak) {
    e.weak.age += dt;
    return;
  }
  if ((e.weakLeft ?? 0) <= 0) return;
  e.weakWait = (e.weakWait ?? 0) - dt;
  if ((e.weakWait ?? 0) > 0) return;
  const total = w.level >= LEVELS ? 4 : 3;
  const i = total - (e.weakLeft ?? 0);
  const spot = WEAK_SPOTS[i % WEAK_SPOTS.length];
  const hp = Math.max(10, e.max * 0.04);
  e.weak = { dx: spot[0] * e.r, dy: spot[1] * e.r, r: Math.max(16, e.r * 0.31), hp, max: hp, name: WEAK_NAMES[i % WEAK_NAMES.length], age: 0 };
  w.cues.push("ready");
}

/** A shot on the weak point hurts the boss like any other, and wears the weak point down as well. */
function hitWeak(w: World, e: Enemy, b: Bullet) {
  const weak = e.weak;
  if (!weak) return;
  const dmg = b.style === STYLE.mist ? b.dmg * mistPower(b.life) : b.dmg;
  e.hp -= dmg;
  e.by = b.owner ?? 0;
  addTeam(w, e.by, dmg * 0.05);
  weak.hp -= dmg;
  e.flash = Math.max(e.flash, 0.06);
  ring(w, e.x + weak.dx, e.y + weak.dy, "#ffe14a", 0.14, 5, 1.4);
  const left = b.pierce ?? 0;
  if (left > 0) {
    b.pierce = left - 1;
    (b.hit ??= []).push(e);
  } else b.life = 0;
  w.cues.push("hit");
  if (weak.hp > 0) return;
  // blown: the boss takes a lump of extra damage, chokes for a few seconds, and everything it had in the air fizzles
  const x = e.x + weak.dx;
  const y = e.y + weak.dy;
  e.weak = null;
  e.weakLeft = (e.weakLeft ?? 1) - 1;
  e.weakWait = 7;
  e.hp -= e.max * 0.07;
  e.fire = Math.max(e.fire, 2.8);
  e.flash = 0.3;
  w.hazards = w.hazards.filter((h) => h.kind !== "strike" && h.kind !== "sweep");
  for (const h of w.bullets) {
    if (h.friendly || h.life <= 0) continue;
    h.life = 0;
    puff(w, h.x, h.y, STYLE.bathBomb, 18, 0.22);
  }
  burst(w, x, y, "#ffe14a", 16, 230, true);
  burst(w, x, y, "#f7fbff", 10, 200, false);
  ring(w, x, y, "#ffe14a", 0.4, 12, 2.6);
  ring(w, e.x, e.y, "#f4fbff", 0.5, e.r, 2);
  addTrauma(w, 0.5);
  w.hitstop = 0.07;
  float(w, x, y - 26, `${weak.name} BLOWN!`, true);
  w.banner = "IT CHOKES – ITS SHOTS FIZZLE";
  w.bannerT = 1.3;
  w.cues.push("valve");
  w.cues.push("big");
  if (!w.arcade) note(w, "weak");
}

/** What the six newer guns' shots do on their way: curl, bounce, swell, soak. */
function stepSpecialShot(w: World, b: Bullet, dt: number) {
  if (b.squash) b.squash = Math.max(0, b.squash - dt);
  if (b.style === STYLE.streamer) {
    // curls after the nearest critter, as fast as paper can turn
    const target = nearestEnemy(w, b.x, b.y);
    const sp = Math.min(600, (Math.hypot(b.vx, b.vy) || 1) + 260 * dt);
    let a = Math.atan2(b.vy, b.vx);
    if (target && target.y > -10) {
      let diff = Math.atan2(target.y - b.y, target.x - b.x) - a;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      a += clamp(diff, -5.2 * dt, 5.2 * dt);
    }
    b.vx = Math.cos(a) * sp;
    b.vy = Math.sin(a) * sp;
    return;
  }
  if (b.style === STYLE.dryer) {
    // hot air: it spreads as it goes
    b.r += 24 * dt;
    return;
  }
  if (b.style === STYLE.duck) {
    if ((b.age ?? 0) < 1) b.r += 14 * dt;
    return;
  }
  if (b.style === STYLE.sling || b.style === STYLE.sponge) {
    if ((b.bounces ?? 0) > 0) {
      const m = b.r + 2;
      if ((b.x < m && b.vx < 0) || (b.x > WORLD_W - m && b.vx > 0)) {
        b.vx *= -1;
        b.bounces = (b.bounces ?? 0) - 1;
        b.squash = 0.14;
        b.hit = undefined;
      } else if (b.y < m + 4 && b.vy < 0) {
        b.vy *= -1;
        b.bounces = (b.bounces ?? 0) - 1;
        b.squash = 0.14;
        b.hit = undefined;
      }
    }
    if (b.style === STYLE.sponge && (b.soak ?? 0) > 0) {
      // a sponge soaks up the enemy shots it touches: each one makes it fatter and its burst wider
      for (const h of w.bullets) {
        if (h.friendly || h.life <= 0 || h.shape === 16) continue;
        if (Math.hypot(h.x - b.x, h.y - b.y) < b.r + h.r + 3) {
          h.life = 0;
          b.soak = (b.soak ?? 0) - 1;
          b.soaked = (b.soaked ?? 0) + 1;
          b.r += 2.6;
          b.dmg *= 1.2;
          b.splash = (b.splash ?? 0) + 7;
          puff(w, h.x, h.y, STYLE.sponge, 20, 0.2);
          w.cues.push("plink");
          if ((b.soak ?? 0) <= 0) break;
        }
      }
    }
  }
}

/** Everything inside the circle takes the hit. Bosses and heavies feel a bath bomb, small fry are gone. */
function foamBurst(w: World, x: number, y: number, radius: number, dmg: number, owner: number, style: number) {
  for (const e of w.enemies) {
    if (e.hp <= 0 || hermitHidden(e)) continue;
    if (Math.hypot(e.x - x, e.y - y) < radius + e.r * 0.5) {
      e.hp -= dmg;
      e.by = owner;
      e.flash = Math.max(e.flash, 0.12);
    }
  }
  // the foam also wipes the poop it touches
  for (const b of w.bullets) {
    if (!b.friendly && b.life > 0 && Math.hypot(b.x - x, b.y - y) < radius * 0.8) b.life = 0;
  }
  puff(w, x, y, style, radius * 2.1, 0.34);
  ring(w, x, y, "#c9b8ff", 0.3, radius * 0.4, 3);
  addTrauma(w, 0.3);
  w.cues.push("big");
}

/** A paper roll that reached its line: two ribbons run out along it, one each way. */
function unroll(w: World, b: Bullet) {
  b.life = 0;
  for (const dir of [-1, 1]) {
    if (w.bullets.length > 280) break;
    w.bullets.push({
      x: b.x,
      y: b.y,
      vx: dir * 760,
      vy: 0,
      r: 15,
      friendly: true,
      dmg: b.dmg,
      life: 1.4,
      homing: false,
      grazed: false,
      hot: true,
      tint: 0,
      style: STYLE.ribbon,
      pierce: 99,
      splash: 0,
      owner: b.owner,
      rank: 1,
    });
  }
  puff(w, b.x, b.y, STYLE.paperRoll, 46, 0.2);
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
    // which of the kind's drawings this shot wears, fixed for its life
    tint: Math.abs(Math.floor(x * 7 + y * 13 + w.bullets.length * 3)),
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
  budget.speed *= tuning(w).speed;
  const roll = w.rng();
  // the Security Camera watches you: it always aims, and its shots are quicker
  const watching = e.role === "watcher";
  const aimed = watching || roll < aimedShare(w.level);
  const angle = aimed ? aim : down;
  // the Salt and Pepper Twins only ever throw sparks, two at a time
  const shape = e.role === "spark" ? 12 : poopShape(e.ch, w.level, w.rng());
  const seenName = ["swirl", "pellets", "swirl", "swirl", "swirl", "frozen", "pebble", "comet", "honeyblob", "slime", "ghostpoop", "chili", "zap", "unicorn", "gold", "diamond", "fart"][shape] ?? "swirl";
  if (!w.meta.seen.includes(seenName)) w.meta.seen.push(seenName);
  const n = Math.max(e.role === "spark" ? 2 : 1, volleySize(w.level, w.rng(), w.rng()));
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
    pushHostile(w, e.x, e.y + 10, angle + spread, budget.speed * (watching ? 1.2 : 1), 6, shape);
  }
  if (!w.meta.seen.includes("swirl")) w.meta.seen.push("swirl");
}

function budgetShots(w: World, dt: number) {
  if (w.range) return;
  const rules = fireBudget(w.level, WORLD_W);
  const crowd = (w.coop ? 1.25 : 1) * tuning(w).heat;
  w.budget += rules.rate * crowd * dt;
  if (w.budget < 1 || hostileCount(w) >= rules.cap * crowd) return;
  const crew = living(w);
  if (!crew.length) return;
  const who = crew[0];
  const pool = w.enemies.filter((e) => {
    if (e.hp <= 0 || e.kind === "boss" || e.warn > 0 || e.fire > 0) return false;
    // nobody shoots while still looping in to their place
    if (e.path) return false;
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
  // every fourth volley is the boss's own attack, announced by name the first time
  e.sig = (e.sig ?? 0) + 1;
  if (e.sig % 4 === 0 && e.dash === undefined) {
    const own = bossSignature(e.ch, e.mark, e.sig / 4 - 1, who.x, WORLD_W);
    cmds.push({ op: "banner", text: own.name }, ...own.cmds);
    w.cues.push("boss");
  }
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
    else if (cmd.op === "lane") {
      const half = cmd.w / 2 + 6;
      const wait = cmd.wait * tuning(w).warn;
      w.hazards.push({ kind: "strike", x: clamp(who.x + cmd.dx, half, WORLD_W - half), y: WORLD_H / 2, w: cmd.w, h: WORLD_H, hp: 1, vx: 0, vy: 0, t: wait, phase: wait });
    } else if (cmd.op === "band") {
      const y = clamp(who.y + cmd.dy, laneTop() + cmd.h / 2, WORLD_H - 36 - cmd.h / 2 + 30);
      const wait = cmd.wait * tuning(w).warn;
      w.hazards.push({ kind: "sweep", x: WORLD_W / 2, y, w: WORLD_W, h: cmd.h, hp: 1, vx: 0, vy: 0, t: wait, phase: wait });
    } else if (cmd.op === "drop") pushHostile(w, cmd.x, -8, Math.PI / 2, cmd.speed, 5, cmd.shape, true);
    else if (cmd.op === "dive" && special && e.dash === undefined) {
      e.dash = 0;
      e.dashX = clamp(who.x, edgeOf("boss"), WORLD_W - edgeOf("boss"));
    }
  }
}

/** A mini-boss takes turns: a fan at the pilot, a spray across the screen, a few friends. Below half health it gets angry. */
function runMini(w: World, e: Enemy) {
  const who = nearestPilot(w, e.x, e.y);
  const aim = Math.atan2(who.y - e.y, who.x - e.x);
  const speed = fireBudget(w.level, WORLD_W).speed * tuning(w).speed;
  const angry = e.hp < e.max * 0.5;
  if (angry && e.mark === 0) {
    e.mark = 1;
    e.vx *= 1.3;
    e.flash = 0.3;
    w.banner = "NOW IT'S ANGRY";
    w.bannerT = 1;
    addTrauma(w, 0.3);
    w.cues.push("boss");
  }
  e.sig = (e.sig ?? 0) + 1;
  const turn = e.sig % 3;
  const shape = poopShape(e.ch, w.level, w.rng());
  const whole = shape === 5 || shape === 9;
  const crowd = w.enemies.reduce((n, o) => n + (o.hp > 0 ? 1 : 0), 0);
  // a narrow screen gets a thinner spray
  const fit = Math.max(0.6, Math.min(1, WORLD_W / 700));
  if (turn === 2) {
    const n = Math.max(4, Math.round((angry ? 9 : 7) * fit));
    for (let i = 0; i < n; i++) pushHostile(w, e.x, e.y + e.r * 0.4, Math.PI * (0.12 + (0.76 * i) / (n - 1)), speed * 0.85, 6, shape, whole);
  } else if (turn === 0 && crowd < 7 && e.hide < 2) {
    // it calls for help twice in a fight, no more: the fight is with the big one
    e.hide += 1;
    // one on each side, so the way to the big one stays open
    for (const i of [-1, 1]) {
      spawnEnemy(w, "dart", clamp(e.x + i * (e.r + 44), 40, WORLD_W - 40), "sine", undefined, e.y + 10, 0, undefined, Math.min(WORLD_H * 0.46, e.y + e.r * 0.6), 0, "", 0);
    }
  } else {
    const n = angry ? 5 : 3;
    for (let i = 0; i < n; i++) pushHostile(w, e.x, e.y + e.r * 0.6, aim + (i - (n - 1) / 2) * 0.2, speed * 1.1, 6, shape, whole);
  }
  e.fire = (angry ? 1.6 : 2.1) / Math.sqrt(tuning(w).heat);
}

function inGap(h: VHazard, x: number, slack: number) {
  return Math.abs(x - h.x) < h.w / 2 - slack || (h.x2 !== undefined && Math.abs(x - h.x2) < h.w / 2 - slack);
}

/** A pipe breaks open: at the valve (the pilot who shot it gets the credit), or from a bomb (owner -1). */
function burstPipe(w: World, h: VHazard, owner: number) {
  if (h.kind !== "pipe") return;
  h.kind = "dead";
  const pal = chapterOf(Math.max(1, w.level));
  for (let x = 20; x < WORLD_W; x += 54) {
    if (inGap(h, x, 0)) continue;
    burst(w, x, h.y, x % 108 < 54 ? pal.edge : "#8a8f96", 3, 210, true);
  }
  splat(w, h.phase, h.y, 46);
  splat(w, clamp(h.phase + (w.rng() - 0.5) * 220, 30, WORLD_W - 30), h.y + 10, 30);
  ring(w, h.phase, h.y, "#f4fbff", 0.3, 16, 2);
  addTrauma(w, 0.45);
  w.hitstop = Math.max(w.hitstop, 0.03);
  w.cues.push("valve");
  if (owner >= 0) {
    w.slain += 1;
    if (owner === 0 || owner === 1) {
      w.tally[owner] += 1;
      addTeam(w, owner, 6);
    }
    bank(w, 8 + Math.round(w.level * 0.3), h.phase, h.y, true);
    float(w, h.phase, h.y - 34, "PIPE BURST", true);
    // the level's gun gift is behind the first valve
    if (w.slain === 1) dropPickup(w, "W", h.phase, h.y + 20);
  }
}

function stepPipe(w: World, h: VHazard, dt: number) {
  const half = h.h / 2;
  const edge = h.w / 2 + 14;
  if (h.vx !== 0 && (h.x < edge || h.x > WORLD_W - edge)) {
    h.vx *= -1;
    h.x = clamp(h.x, edge, WORLD_W - edge);
  }
  // shots stop at the pipe; the valve takes the ones meant for it
  for (const b of w.bullets) {
    if (b.life <= 0 || Math.abs(b.y - h.y) > half + b.r) continue;
    if (inGap(h, b.x, 0)) continue;
    b.life = 0;
    if (!b.friendly) continue;
    if (h.hp > 0 && Math.abs(b.x - h.phase) < 26 + b.r) {
      h.hp -= b.style === STYLE.mist ? b.dmg * mistPower(b.life) : b.dmg;
      h.t = 0.12;
      w.cues.push("hit");
      if (h.hp <= 0) {
        burstPipe(w, h, b.owner ?? 0);
        return;
      }
    } else if (w.parts.length < 160) burst(w, b.x, h.y + half, "#f7fbff", 2, 110, false);
  }
  const crew = living(w);
  for (const p of crew) {
    if (Math.abs(p.y - h.y) < half + 9 && !inGap(h, p.x, 9) && p.inv <= 0) {
      h.hit = true;
      hurtPlayer(w, p);
      // long enough for the pipe to go by, whatever it cost
      p.inv = Math.max(p.inv, 0.8);
    }
  }
  if (!h.done && crew.length && crew.every((p) => h.y - half > p.y + 12)) {
    h.done = true;
    if (!h.hit) {
      const who = crew[0];
      bank(w, 3 + Math.round(w.level * 0.12), who.x, who.y - 4, true);
      float(w, who.x, who.y - 40, "THREADED", true);
      note(w, "threads");
    }
  }
  // later rooms: the joints drip
  const d = Math.min(1, (w.level - 1) / 99);
  if (w.level > 20 && h.y > 10 && h.y < WORLD_H * 0.45 && w.freeze <= 0 && w.rng() < dt * (0.2 + 0.6 * d)) {
    for (let tries = 0; tries < 4; tries++) {
      const x = 24 + w.rng() * (WORLD_W - 48);
      if (inGap(h, x, -12)) continue;
      pushHostile(w, x, h.y + half + 6, Math.PI / 2, h.vy + 70 + 60 * d, 5, poopShape(Math.floor((w.level - 1) / 10), w.level, w.rng()), true);
      break;
    }
  }
  if (h.y - half > WORLD_H + 24) h.kind = "dead";
}

function cashBullets(w: World) {
  for (const b of w.bullets) {
    if (b.friendly || b.life <= 0) continue;
    b.life = 0;
    w.score += 5;
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
  let miniDied = false;
  for (const e of w.enemies) {
    if (e.gone) continue;
    if (e.hp <= 0) {
      if (e.kind === "boss") bossDied = true;
      if (e.role === "mini") miniDied = true;
      killEnemy(w, e);
      continue;
    }
    next.push(e);
  }
  w.enemies = next;
  if (miniDied && !w.enemies.some((e) => e.role === "mini")) {
    // the bodyguards do not stay to argue
    for (const e of w.enemies) {
      const pal = chapterOf(Math.max(1, e.ch * 10 + 1));
      burst(w, e.x, e.y, pal.edge, 8, 160, true);
      pop(w, e);
      w.slain += 1;
    }
    w.enemies = [];
    w.spawns = [];
    w.bullets = w.bullets.filter((b) => b.friendly);
  }
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

/** The bomb button. With two pilots and both charges full it calls the Super Flush instead. */
function detonate(w: World, who?: Player) {
  const owner = who && who.alive ? who : w.player.alive ? w.player : w.wing;
  if (!owner || !owner.alive || w.mode !== "play" || w.duel) return;
  if (w.wing && w.team[0] >= 100 && w.team[1] >= 100 && w.player.alive && w.wing.alive) {
    const me = owner === w.wing ? 1 : 0;
    if (w.superWait) {
      if (w.superWait.who !== me) superFlush(w);
      return;
    }
    // the first press waits a moment for the partner, safe while it waits;
    // if the partner does not press, it is an ordinary bomb
    w.superWait = { who: me, t: 0.8 };
    owner.inv = Math.max(owner.inv, 1);
    float(w, owner.x, owner.y - 40, "PARTNER – PRESS BOMB!", true);
    ring(w, owner.x, owner.y, "#7eb6d6", 0.5, 14, 2.4);
    w.cues.push("ready");
    return;
  }
  blast(w, owner);
}

/** Both pilots pressed together: the whole screen goes down the drain. Costs no bombs. */
function superFlush(w: World) {
  const a = w.player;
  const b = w.wing;
  if (!b) return;
  w.team = [0, 0];
  w.superWait = null;
  w.superTold = false;
  w.superT = 1.5;
  w.flash = 0.4;
  w.hitstop = 0.08;
  addTrauma(w, 1);
  cashBullets(w);
  for (const e of w.enemies) {
    if (e.kind === "boss") {
      if (!w.intro) e.hp -= e.max * 0.15;
    } else if (e.role === "mini") e.hp -= e.max * 0.5;
    else e.hp = 0;
    e.flash = 0.2;
  }
  for (const h of w.hazards) if (h.kind === "pipe" && h.y > -30 && h.y < WORLD_H) burstPipe(w, h, -1);
  for (const p of [a, b]) {
    p.inv = Math.max(p.inv, 3);
    p.feed = Math.max(p.feed, 6);
    ring(w, p.x, p.y, "#7eb6d6", 0.6, 14, 3);
  }
  w.banner = "SUPER FLUSH!";
  w.bannerT = 1.4;
  w.cues.push("flush");
  w.cues.push("big");
  note(w, "supers");
  reap(w);
}

function blast(w: World, owner: Player) {
  if (!owner.alive || w.player.bombs <= 0 || w.mode !== "play") return;
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
    } else if (e.role === "mini") e.hp -= e.max * 0.3;
    else e.hp = 0;
    e.flash = 0.1;
  }
  for (const h of w.hazards) if (h.kind === "pipe" && h.y > -30 && h.y < WORLD_H) burstPipe(w, h, -1);
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
  if (w.toasts.length) {
    w.toasts[0].life -= dt;
    if (w.toasts[0].life <= 0) w.toasts.shift();
  }
  for (const p of w.puffs) p.life -= dt;
  w.puffs = w.puffs.filter((p) => p.life > 0);
  for (const p of w.pops) p.life -= dt;
  w.pops = w.pops.filter((p) => p.life > 0);
  for (const sp of w.splats) sp.life -= dt;
  w.splats = w.splats.filter((sp) => sp.life > 0);
  w.superT = Math.max(0, w.superT - dt);
  for (const a of w.arcs) a.life -= dt;
  w.arcs = w.arcs.filter((a) => a.life > 0);
  for (const f of w.floaters) {
    f.life -= dt;
    f.y -= 32 * dt;
  }
  w.floaters = w.floaters.filter((f) => f.life > 0);
  for (const e of w.enemies) e.flash = Math.max(0, e.flash - dt);
}

function moveEnemy(w: World, e: Enemy, dt: number) {
  const path = e.path;
  if (!path) {
    holdPlace(w, e, dt);
    if (e.lean) e.lean *= Math.max(0, 1 - 8 * dt);
    return;
  }
  const wasX = e.x;
  // still flying in: move the slot as usual, then lay the shrinking offset on top
  e.x = path.hx;
  e.y = path.hy;
  holdPlace(w, e, dt);
  path.hx = e.x;
  path.hy = e.y;
  path.u += dt / path.dur;
  if (path.u >= 1 || e.motion === "dive") {
    e.path = undefined;
    return;
  }
  const u = path.u * path.u * (3 - 2 * path.u);
  const a = (1 - u) * (1 - u);
  const b = 2 * u * (1 - u);
  e.x += a * path.dx + b * path.cx;
  e.y += a * path.dy + b * path.cy;
  e.lean = clamp((e.x - wasX) / Math.max(dt, 1e-4) / 520, -0.6, 0.6);
}

function holdPlace(w: World, e: Enemy, dt: number) {
  e.t += dt;
  // The last one or two critters of a level do not get to sit at the top of the screen
  // out of reach: they come down for the pilot, again and again, until somebody wins.
  if (
    !w.range &&
    w.spawns.length === 0 &&
    w.enemies.length <= 2 &&
    e.t > 6 &&
    !e.path &&
    e.kind !== "boss" &&
    e.kind !== "cruiser" &&
    e.role !== "bonus" &&
    (e.motion === "rank" || e.motion === "sine" || e.motion === "swoop" || e.motion === "spiral" || e.motion === "zigzag")
  ) {
    e.motion = "dive";
    e.warn = 0.55;
    e.flash = 0.55;
    e.ox = clamp(e.x, edgeOf(e.kind), WORLD_W - edgeOf(e.kind));
  }
  if (e.motion === "fall") {
    e.y += e.vy * dt;
    e.x += e.vx * dt;
    if (e.role === "stormbig") e.x += Math.sin(e.t * 1.3 + e.spin) * 22 * dt;
    if (e.y > WORLD_H + 50 || e.x < -60 || e.x > WORLD_W + 60) e.gone = true;
    return;
  }
  if (e.motion === "boss") {
    // low enough that the big sprites clear the health bar at the top of the screen
    // (on a phone the bar sits lower, under the score, so the boss does too)
    const nest = (WORLD_W < 560 ? 160 : 110) + 42 * (e.size ?? 1);
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
    e.y += e.y < nest ? (w.intro ? 110 : 52) * dt : 0;
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
    // The last one or two stragglers do not get to run back and forth for ever:
    // they come down for the pilot, where they can be shot.
    if (w.spawns.length === 0 && w.enemies.length <= 2 && e.t > 5 && e.y >= goal - 4) {
      e.motion = "dive";
      e.warn = 0.55;
      e.flash = 0.55;
      e.ox = clamp(e.x, edgeOf(e.kind), WORLD_W - edgeOf(e.kind));
    }
    return;
  }
  if (e.motion === "hold") {
    const nest = Math.min(e.oy || WORLD_H * 0.16, cap);
    if (e.y < nest) e.y += 64 * dt;
    else e.y = nest + Math.sin(e.t * 1.1) * 6;
    if (Math.abs(e.vx) < 20) e.vx = e.ox < WORLD_W / 2 ? 70 : -70;
    e.x += e.vx * dt;
    // a mini-boss is wide: it turns round before it hangs off the screen
    const m = e.role === "mini" ? Math.min(WORLD_W * 0.42, e.r + 26) : edgeOf(e.kind);
    if ((e.x < m && e.vx < 0) || (e.x > WORLD_W - m && e.vx > 0)) e.vx *= -1;
    e.x = clamp(e.x, m, WORLD_W - m);
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
  if (e.role === "moth" && e.y > goal - 30) {
    // the moth cannot hold still: it loops around its place in the line
    const a = e.t * 2.2 + e.spin;
    e.x += Math.cos(a) * 38;
    e.y += Math.cos(a + Math.PI / 2) * 130 * dt;
  }
  if ((e.motion === "rank" || e.motion === "swoop") && e.kind !== "boss" && e.role !== "bonus") {
    const d = Math.max(0, (w.level - 4) / 96);
    const chance = w.level < 4 || w.range ? 0 : 0.1 + 0.25 * d;
    if (w.rng() < chance * dt * 0.15) {
      const divers = w.enemies.reduce((n, o) => n + (o.motion === "dive" ? 1 : 0), 0);
      if (divers < 1 + Math.floor(w.level / 25) && e.y > 30 && !e.path) {
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
    } else if (h.kind === "pipe") {
      stepPipe(w, h, dt);
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
    } else if (h.kind === "strike" || h.kind === "sweep") {
      // a boss's marked column or strip: it strikes for a quarter of a second, then it is gone
      if (h.t < 0 && h.t > -STRIKE_TIME) {
        for (const p of living(w)) {
          if (p.inv > 0) continue;
          const inside = h.kind === "strike" ? Math.abs(p.x - h.x) < h.w / 2 + 4 : Math.abs(p.y - h.y) < h.h / 2 + 4;
          if (inside) hurtPlayer(w, p);
        }
        if (h.hp > 0) {
          h.hp = 0;
          addTrauma(w, 0.35);
          w.cues.push("big");
        }
      } else if (h.t <= -STRIKE_TIME) h.kind = "dead";
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
    if (b.friendly && b.style === STYLE.soap) {
      for (const h of w.hazards) if (h.kind === "cloud" && Math.hypot(b.x - h.x, b.y - h.y) < 50) h.phase = 3;
    }
  }
}

export const DASH_WARN = 0.9;
/** How long a boss's marked column or strip stays deadly once it strikes. */
export const STRIKE_TIME = 0.25;

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

/** Top flying speed. The same on every screen, a little quicker where there is more sky to cross. */
export function cruiseSpeed() {
  return clamp(WORLD_W * 0.36, 330, 430);
}

type Fly = {
  left: boolean;
  right: boolean;
  up: boolean;
  down: boolean;
  focus: boolean;
  fire: boolean;
  alt: boolean;
  pointer: { x: number; y: number } | null;
  stick: { x: number; y: number } | null;
  drag: { dx: number; dy: number } | null;
};

function drivePilot(w: World, p: Player, fly: Fly, dt: number) {
  const { focus, fire, pointer } = fly;
  if (!p.alive) {
    p.speedUp = 0;
    p.mx = 0;
    p.my = 0;
    p.bank += (0 - p.bank) * (1 - Math.exp(-8 * dt));
    return;
  }
  let ax = (fly.right ? 1 : 0) - (fly.left ? 1 : 0);
  let ay = (fly.down ? 1 : 0) - (fly.up ? 1 : 0);
  const keyMag = Math.hypot(ax, ay);
  if (keyMag > 0) {
    ax /= keyMag;
    ay /= keyMag;
  } else if (fly.stick) {
    // the stick is analog: a small push is a slow, careful slide
    const sm = Math.hypot(fly.stick.x, fly.stick.y);
    if (sm > 0.18) {
      const gain = Math.min(1, (sm - 0.18) / 0.72) / sm;
      ax = fly.stick.x * gain;
      ay = fly.stick.y * gain;
    }
  }
  const keying = ax !== 0 || ay !== 0;
  const ship = shipOf(w, p);
  if (ship.buddy) p.buddy = Math.max(p.buddy, 9);
  const speed = cruiseSpeed() * ship.speed * (focus ? 0.45 : 1) * (p.slow > 0 ? 0.6 : 1);
  let bankTarget = ax * 0.36;
  if (!keying && fly.drag) {
    // touch: the ship moves exactly as far as the finger did
    p.x += fly.drag.dx;
    p.y += fly.drag.dy;
    p.mx = 0;
    p.my = 0;
    p.speedUp = fly.drag.dy < -0.5 ? Math.min(speed, -fly.drag.dy / Math.max(dt, 1e-4)) : 0;
    bankTarget = clamp(fly.drag.dx / 9, -1, 1) * 0.36;
  } else if (!keying && pointer) {
    const dx = pointer.x - p.x;
    const dy = pointer.y - p.y;
    const dist = Math.hypot(dx, dy) || 1;
    const spd = (focus ? Math.max(200, WORLD_W * 0.2) : Math.max(520, WORLD_W * 0.72)) * dt;
    const stepLen = Math.min(dist, spd);
    p.x += (dx / dist) * stepLen;
    p.y += (dy / dist) * stepLen;
    p.mx = 0;
    p.my = 0;
    p.speedUp = dy < -1 ? Math.min(speed, Math.abs(dy) / Math.max(dt, 1e-4)) : 0;
    bankTarget = clamp(dx / 70, -1, 1) * 0.36;
  } else {
    // Keys and stick: the ship picks up speed over a few frames instead of jumping to
    // full speed, so a tap is a small step, and it stops almost at once when you let go.
    const pick = 1 - Math.exp(-dt / 0.05);
    const drop = 1 - Math.exp(-dt / 0.028);
    const tx = ax * speed;
    const ty = ay * speed;
    p.mx += (tx - p.mx) * (Math.abs(tx) > Math.abs(p.mx) && tx * p.mx >= 0 ? pick : drop);
    p.my += (ty - p.my) * (Math.abs(ty) > Math.abs(p.my) && ty * p.my >= 0 ? pick : drop);
    if (Math.abs(p.mx) < 0.5 && tx === 0) p.mx = 0;
    if (Math.abs(p.my) < 0.5 && ty === 0) p.my = 0;
    p.x += p.mx * dt;
    p.y += p.my * dt;
    p.speedUp = Math.max(0, -p.my);
  }
  p.x = clamp(p.x, 22, WORLD_W - 22);
  if (w.duel) p.y = p === w.wing ? clamp(p.y, 40, WORLD_H * 0.47) : clamp(p.y, WORLD_H * 0.53, WORLD_H - 36);
  else p.y = clamp(p.y, laneTop(), WORLD_H - 36);
  p.bank += (bankTarget - p.bank) * (1 - Math.exp(-12 * dt));
  p.fireCd -= dt;
  p.buddy = Math.max(0, p.buddy - dt);
  p.magnet = Math.max(0, p.magnet - dt);
  p.rush = Math.max(0, p.rush - dt);
  if (p.boostT > 0) {
    p.boostT = Math.max(0, p.boostT - dt);
    if (p.boostT <= 0) p.boost = 0;
  }
  p.star = Math.max(0, p.star - dt);
  if (fire && p.fireCd <= 0) firePlayer(w, p, focus);
  tryMissile(w, p, fly.alt, dt);
}

export const REVIVE_TIME = 1.5;
export const REVIVE_REACH = 64;
export const LINK_REACH = 120;

/** Two-pilot rules: reviving a downed partner, and the bonus for flying wing to wing. */
function teamwork(w: World, dt: number) {
  const a = w.player;
  const b = w.wing;
  if (!b) return;
  for (const [fallen, friend] of [
    [a, b],
    [b, a],
  ] as const) {
    if (!fallen.down) continue;
    if (!friend.alive) continue;
    const near = Math.hypot(fallen.x - friend.x, fallen.y - friend.y) < REVIVE_REACH;
    fallen.revive = near ? (fallen.revive ?? 0) + dt : Math.max(0, (fallen.revive ?? 0) - dt * 0.6);
    if ((fallen.revive ?? 0) >= REVIVE_TIME * (perk(w, "quick_rescue") ? 0.5 : 1)) {
      note(w, "revives");
      note(w, friend === w.wing ? "rescue2" : "rescue1");
      fallen.down = false;
      fallen.alive = true;
      fallen.lives = 1;
      fallen.inv = 2.5;
      fallen.revive = 0;
      fallen.fireCd = 0.2;
      float(w, fallen.x, fallen.y - 36, "BACK IN THE AIR", true);
      cheer(w, fallen.x, fallen.y, "#7eb6d6");
      w.cues.push("drive");
    }
  }
  const linked = a.alive && b.alive && Math.hypot(a.x - b.x, a.y - b.y) < LINK_REACH;
  w.linkCd = Math.max(0, w.linkCd - dt);
  if (linked && !w.link && w.linkCd <= 0) {
    float(w, (a.x + b.x) / 2, Math.min(a.y, b.y) - 40, "WING LINK +25%", true);
    w.linkCd = 6;
  }
  w.link = linked;
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
  if (w.duel) {
    stepDuel(w, dt, input);
    return;
  }
  if (w.intro) {
    w.intro.t -= dt;
    if (w.intro.t <= 0) w.intro = null;
  }
  if (w.superWait) {
    w.superWait.t -= dt;
    if (w.superWait.t <= 0) {
      // the partner did not answer: an ordinary bomb, if there is one
      const who = w.superWait.who === 1 && w.wing ? w.wing : w.player;
      w.superWait = null;
      blast(w, who.alive ? who : w.player.alive ? w.player : (w.wing ?? w.player));
    }
  }

  drivePilot(
    w,
    w.player,
    {
      left: input.left,
      right: input.right,
      up: input.up,
      down: input.down,
      focus: input.focus,
      fire: input.fire,
      // no second button pressed anywhere (touch, bots): the second weapon fires with the first
      alt: input.alt ?? input.fire,
      pointer: input.pointer,
      stick: input.stick ?? null,
      drag: input.drag ?? null,
    },
    dt,
  );
  if (w.wing) {
    drivePilot(
      w,
      w.wing,
      {
        left: !!input.wingLeft,
        right: !!input.wingRight,
        up: !!input.wingUp,
        down: !!input.wingDown,
        focus: !!input.wingFocus,
        fire: !!input.wingFire,
        alt: input.wingAlt ?? !!input.wingFire,
        pointer: null,
        stick: input.wingStick ?? null,
        drag: null,
      },
      dt,
    );
  }

  // Both pilots hitting bomb in the very same frame is exactly what the Super Flush asks
  // for, so both presses count then; otherwise one frame never spends two bombs.
  const charged = !!w.wing && w.wing.alive && w.player.alive && w.team[0] >= 100 && w.team[1] >= 100;
  if (input.bomb) detonate(w, w.player);
  if (input.wingBomb && w.wing && (charged || !input.bomb)) detonate(w, w.wing);
  if (w.wing) teamwork(w, dt);
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
          spawnEnemy(w, s.kind, s.x, s.motion, s.drop, -28, s.vx ?? 0, s.spin, s.oy, s.value ?? 0, s.role ?? "", s.line, s.entry ?? 0);
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
    const big = e.kind === "boss" || e.role === "mini";
    // Squeaky Duck: what a ring touched moves and shoots at half speed for a moment
    // (a boss only loses a fifth: it is too big to be impressed)
    const wasDt = dt;
    if ((e.slow ?? 0) > 0) {
      e.slow = Math.max(0, (e.slow ?? 0) - dt);
      dt *= big ? 0.8 : 0.5;
    }
    moveEnemy(w, e, dt);
    if ((e.push ?? 0) > 1 && !big) {
      // Hair Dryer: blown back up the screen, then it finds its way down again
      if (!e.path && e.y > 14) e.y = Math.max(14, e.y - (e.push ?? 0) * wasDt);
      e.push = (e.push ?? 0) * Math.max(0, 1 - 5 * wasDt);
    }
    if (e.kind === "boss") {
      stepWeak(w, e, dt);
      e.fire -= dt;
      if (e.fire <= 0 && w.freeze <= 0 && !w.intro) {
        runBoss(w, e);
        e.fire = Math.max(0.7, 1.5 - e.mark * 0.2);
      }
    } else if (e.role === "mini") {
      e.fire -= dt;
      if (e.fire <= 0 && w.freeze <= 0 && !w.intro && e.y > 30) runMini(w, e);
    } else {
      if (e.fire > 0) e.fire = Math.max(0, e.fire - dt);
      if (e.warn > 0) {
        e.warn -= dt;
        if (e.warn <= 0) releaseShot(w, e);
      }
    }
    dt = wasDt;
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
    if (b.friendly && b.life > 0) {
      if (b.style === STYLE.bathBomb && b.life <= dt * 1.5) {
        b.life = 0;
        foamBurst(w, b.x, b.y, 96, b.dmg, b.owner ?? 0, STYLE.bathBomb);
        continue;
      }
      if (b.style === STYLE.paperRoll && (b.y < WORLD_H * 0.12 || b.life <= dt * 1.5)) {
        unroll(w, b);
        continue;
      }
    }
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
    if (b.friendly && b.life > 0 && b.style !== undefined && b.style >= 20) stepSpecialShot(w, b, dt);
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
    if (w.bossUp && !w.intro && b.style !== STYLE.bathBomb && b.style !== STYLE.paperRoll) {
      // a boss's weak point is hit before its body: it sits on the rim, toward the pilot
      for (const e of w.enemies) {
        const weak = e.weak;
        if (!weak || e.hp <= 0 || (b.hit && b.hit.includes(e))) continue;
        if (Math.hypot(b.x - e.x - weak.dx, b.y - e.y - weak.dy) < weak.r + b.r) {
          hitWeak(w, e, b);
          break;
        }
      }
      if (b.life <= 0) continue;
    }
    for (const e of w.enemies) {
      if (e.hp <= 0) continue;
      if (b.hit && b.hit.includes(e)) continue;
      if (Math.hypot(b.x - e.x, b.y - e.y) < e.r + b.r) {
        if (w.intro && (e.kind === "boss" || e.role === "mini")) {
          // still making its entrance: nothing sticks until the name card is gone
          b.life = 0;
          sparkHit(w, e, b.x, b.y);
          break;
        }
        if (b.style === STYLE.bathBomb) {
          b.life = 0;
          foamBurst(w, b.x, b.y, 96, b.dmg, b.owner ?? 0, STYLE.bathBomb);
          break;
        }
        if (b.style === STYLE.paperRoll) {
          b.y = e.y;
          unroll(w, b);
          break;
        }
        if ((e.role === "forge" || e.role === "wall") && e.plate > 0 && (b.pierce ?? 0) <= 0 && b.y > e.y) {
          // a plate in front: it soaks up a few shots from below, then falls off.
          // Shots that pierce, splash or jump go around it.
          e.plate -= 1;
          b.life = 0;
          sparkHit(w, e, b.x, b.y);
          if (e.plate <= 0) float(w, e.x, e.y - 16, e.role === "wall" ? "LID OFF" : "PLATE OFF");
          break;
        }
        if (hermitHidden(e)) {
          b.life = 0;
          sparkHit(w, e, b.x, b.y);
          break;
        }
        if (e.role === "ghost" && Math.sin(e.t * 2.4) < 0) continue;
        if (e.role !== "honey" && e.kind !== "boss" && e.role !== "mini" && w.enemies.some((h) => h.role === "honey" && h.hp > 0 && Math.hypot(h.x - e.x, h.y - e.y) < HONEY_RING * (h.size ?? 1))) {
          // shielded: the shot slips through, so the turret behind can still be reached
          if (e.flash <= 0) {
            ring(w, e.x, e.y, "#e2b84a", 0.2, e.r, 1.4);
            e.flash = 0.25;
          }
          continue;
        }
        if (b.style === STYLE.dryer) {
          // hot air shoves it back; of one breath small fry feel one puff, the big ones up to three
          e.push = Math.max(e.push ?? 0, 170 * Math.max(0.35, b.life / DRYER_LIFE));
          if (e.airId !== b.volley) {
            e.airId = b.volley;
            e.airN = 0;
          }
          e.airN = (e.airN ?? 0) + 1;
          if ((e.airN ?? 0) > (e.kind === "boss" || e.kind === "cruiser" || e.role === "mini" ? 3 : 1)) {
            (b.hit ??= []).push(e);
            continue;
          }
        } else if (b.style === STYLE.duck) e.slow = Math.max(e.slow ?? 0, 1.2);
        e.hp -= b.style === STYLE.mist ? b.dmg * mistPower(b.life) : b.dmg;
        e.by = b.owner ?? 0;
        // no kills to count in a boss fight: there the hits charge the Super Flush
        if (e.kind === "boss") addTeam(w, e.by, b.dmg * 0.05);
        sparkHit(w, e, b.x, b.y);
        if ((b.splash ?? 0) > 0) {
          for (const other of w.enemies) {
            if (other === e || other.hp <= 0) continue;
            if (Math.hypot(b.x - other.x, b.y - other.y) < (b.splash ?? 0) + other.r * 0.45) {
              other.hp -= b.dmg * 0.4;
              other.by = b.owner ?? 0;
            }
          }
          ring(w, b.x, b.y, b.style === STYLE.soap ? "#ffd9a0" : b.style === STYLE.sponge ? "#fff3b8" : "#e07a3d", 0.18, b.style === STYLE.sponge ? (b.splash ?? 8) * 0.5 : 8, 1.2);
        }
        if ((b.chain ?? 0) > 0) {
          // Zap Brush: the bolt jumps on to the nearest critters, a little weaker each time
          let from = e;
          let dmg = b.dmg * 0.6;
          const done: Enemy[] = [e];
          for (let j = 0; j < (b.chain ?? 0); j++) {
            let next: Enemy | null = null;
            let best = 150 * 150;
            for (const o of w.enemies) {
              if (o.hp <= 0 || done.includes(o) || hermitHidden(o)) continue;
              if (o.role === "ghost" && Math.sin(o.t * 2.4) < 0) continue;
              const d = (o.x - from.x) ** 2 + (o.y - from.y) ** 2;
              if (d < best) {
                best = d;
                next = o;
              }
            }
            if (!next) break;
            next.hp -= dmg;
            next.by = b.owner ?? 0;
            next.flash = Math.max(next.flash, 0.1);
            if (w.arcs.length > 24) w.arcs.shift();
            w.arcs.push({ x1: from.x, y1: from.y, x2: next.x, y2: next.y, life: 0.12 });
            done.push(next);
            from = next;
            dmg *= 0.75;
          }
        }
        if (b.style !== undefined && ((b.style >= 10 && b.style <= 15) || b.style >= 20)) {
          const sizes = [20, 28, 36];
          const size = b.style === STYLE.sponge ? 34 + (b.soaked ?? 0) * 12 : (sizes[b.rank ?? 0] ?? 24);
          puff(w, b.x, e.kind === "boss" ? b.y : e.y + e.r * 0.3, b.style, size, b.style >= 20 ? 0.22 : 0.16);
        }
        const left = b.pierce ?? 0;
        if (left > 0) {
          b.pierce = left - 1;
          (b.hit ??= []).push(e);
          if (b.style === STYLE.sling) {
            // a rubber ball does not go through: it kicks off sideways and keeps climbing
            b.vx = b.vx === 0 ? (b.x < e.x ? -260 : 260) : -b.vx;
            b.squash = 0.14;
          }
        } else b.life = 0;
        if (e.kind === "boss" || e.kind === "cruiser") w.cues.push("hit");
        break;
      }
    }
  }

  for (const ship of living(w)) {
    if (ship.inv > 0) continue;
    const hitR = (ship === w.player && input.focus ? 4.5 : ship === w.wing && input.wingFocus ? 4.5 : 7) * shipOf(w, ship).hit;
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
          if (e.kind !== "boss" && e.role !== "mini") e.hp = 0;
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

  if (!w.range && !w.bossUp && w.spawns.length === 0 && w.enemies.length === 0 && w.level > 0 && !w.hazards.some((h) => h.kind === "pipe")) {
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
  if (w.perfect && !w.arcade) note(w, "perfect");
  if (w.arcade && !w.daily) note(w, "arcade", w.arcadeStage, true);
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
    if (w.arcade) {
      if (w.player.weapon < 6) w.player.weapon += 1;
      else w.player.feed = 6.5;
    } else w.meta.dollars += 50;
  } else if (!boss && slot === 5) {
    w.banner = `${w.slain}/${w.born}`;
  }
  const bonus = clearCash(w.level, w.perfect, noBomb, w.arcade ? 0 : w.meta.upgrades.salvage, w.replay);
  if (w.arcade) w.purse += Math.round(bonus * 0.5);
  else w.meta.dollars += bonus;
  w.clearCash = w.arcade ? Math.round(bonus * 0.5) : bonus;
  if (w.perfect) w.score += 400;
  // set pieces are not about shooting everything: no bombs is enough for their third star
  const counted = w.kind === "waves" || w.kind === "bonus" || w.kind === "boss";
  const earned = starsOf(w.perfect, noBomb, counted ? w.slain : 1, counted ? Math.max(1, w.born) : 1, fast, boss);
  if (w.kind === "storm" && w.perfect && !w.arcade) note(w, "stormClean");
  if (w.wing && !w.arcade) {
    if (w.tally[0] > w.tally[1]) {
      w.series[0] += 1;
      note(w, "lvlWin1");
    } else if (w.tally[1] > w.tally[0]) {
      w.series[1] += 1;
      note(w, "lvlWin2");
    }
  }
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
    if (w.daily && (w.arcadeStage >= 30 || w.level >= LEVELS)) {
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
    if (w.meta.autoAdvance) {
      w.mode = "bridge";
      w.bridgeT = 1.4;
    } else w.mode = "clear";
    return;
  }
  if (w.pinned != null) {
    if (w.meta.autoAdvance) {
      w.mode = "bridge";
      w.bridgeT = 2.5;
    } else w.mode = "clear";
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
    // a mini-boss or a boss down: three perks on the table before the next level
    const perky = chapterEnd || w.kind === "mini";
    if (perky) offerPerks(w);
    if (perky || !w.meta.autoAdvance) w.mode = "clear";
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
      weapon2: w.wing ? Math.max(w.wing.weapon, kit.weapon) : undefined,
      family2: w.wing?.family,
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
  startSortie(w, { level: spec.level, lives: 3, weapon: 1, bombs: 2, shield: false, score: 0, feed: 0, coop: false, missiles: 0, family: "bubble", snacks: w.snacks });
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


export const DUEL_HP = 100;
export const DUEL_WINS = 3;
/** A round that is still going after this many seconds hits twice as hard; after twice as long, four times. */
export const DUEL_SUDDEN = 40;
/** The strongest a gun gets in a duel: rounds should be won by flying, not by the luckiest gift. */
const DUEL_RANK = 4;

/** Two pilots, one screen, against each other. Nothing here touches the campaign or the save. */
export function startDuel(w: World) {
  resetField(w);
  w.arcade = false;
  w.daily = false;
  w.pinned = null;
  w.coop = true;
  w.kind = "waves";
  w.hazards = [];
  w.score = 0;
  // a room for the backdrop; the campaign's own level is put back when the duel ends
  w.level = 1 + 10 * Math.floor(Math.random() * 10);
  w.wave = w.level;
  w.rng = mulberry32((Math.random() * 1e9) | 0);
  w.player = freshPlayer();
  w.wing = freshPlayer();
  w.duel = { hp: [DUEL_HP, DUEL_HP], wins: [0, 0], round: 0, state: "ready", wait: 0, giftT: 3, last: -1, taunt: "", clock: 0 };
  duelRound(w);
  w.mode = "play";
}

/** Leaves the duel and puts the campaign back exactly as it was. */
export function endDuel(w: World) {
  w.duel = null;
  w.wing = null;
  resetField(w);
  w.player = freshPlayer();
  w.coop = Boolean(w.snap?.coop);
  w.level = clamp(w.meta.level, 1, LEVELS);
  w.wave = w.level;
  w.score = 0;
  w.mode = "menu";
  persist(w, w.snap);
}

function duelRound(w: World) {
  const d = w.duel;
  const b = w.wing;
  if (!d || !b) return;
  const a = w.player;
  d.round += 1;
  d.hp = [DUEL_HP, DUEL_HP];
  d.state = "ready";
  d.wait = 1.8;
  d.giftT = 2.5;
  d.clock = 0;
  w.bullets = [];
  w.pickups = [];
  [a, b].forEach((p, i) => {
    Object.assign(p, freshPlayer());
    p.weapon = 2;
    p.family = "bubble";
    // whoever lost the last round starts this one behind a shield
    p.shield = d.last >= 0 && d.last !== i;
    p.inv = 0;
    p.fireCd = 0.3;
    p.x = WORLD_W / 2;
    p.y = i === 0 ? WORLD_H - 110 : 110;
  });
  w.banner = `ROUND ${d.round}`;
  w.bannerT = 1.5;
  w.cues.push("wave");
}

function duelGift(w: World, pk: Pickup, i: number) {
  const d = w.duel;
  const b = w.wing;
  if (!d || !b) return;
  const p = i === 0 ? w.player : b;
  const foe = i === 0 ? b : w.player;
  const say = (text: string) => float(w, p.x, p.y + (i === 0 ? -30 : 34), text, true);
  if (pk.kind === "W") {
    const family = DUEL_GUNS[(((pk.value || 0) % DUEL_GUNS.length) + DUEL_GUNS.length) % DUEL_GUNS.length] ?? "bubble";
    if (family !== p.family) p.family = family;
    else if (p.weapon < DUEL_RANK) p.weapon += 1;
    else p.feed = 5;
    say(gunName(p.weapon, p.family));
    cheer(w, p.x, p.y, familyColor(family));
    w.cues.push("pickup");
  } else if (pk.kind === "S") {
    p.shield = true;
    say("SHIELD BUBBLE");
    cheer(w, p.x, p.y, "#7eb6d6");
    w.cues.push("pickup");
  } else if (pk.kind === "L") {
    d.hp[i] = Math.min(DUEL_HP, d.hp[i] + 25);
    say("PATCHED UP +25");
    cheer(w, p.x, p.y, "#f4e7cf");
    w.cues.push("pickup");
  } else if (pk.kind === "C") {
    p.rush = 7;
    say("COFFEE – FIRE RATE UP");
    cheer(w, p.x, p.y, "#c9a24a");
    w.cues.push("drive");
  } else if (pk.kind === "T") {
    p.star = 3;
    p.inv = Math.max(p.inv, 3);
    say("STAR – CAN'T TOUCH THIS");
    cheer(w, p.x, p.y, "#f4f1ea");
    w.cues.push("shield");
  } else {
    // air freshener: wipes the other pilot's shots off the screen and stings them
    w.bullets = w.bullets.filter((sh) => (sh.owner ?? 0) === i);
    say("AIR FRESHENER");
    ring(w, p.x, p.y, "#e7eaee", 0.48, 12, 2);
    w.flash = 0.2;
    addTrauma(w, 0.5);
    w.cues.push("bomb");
    if (foe.alive && foe.inv <= 0) {
      if (foe.shield) foe.shield = false;
      else {
        d.hp[1 - i] = Math.max(0, d.hp[1 - i] - 15);
        if (d.hp[1 - i] <= 0) duelKo(w, 1 - i);
      }
    }
  }
}

function duelKo(w: World, loser: number) {
  const d = w.duel;
  const b = w.wing;
  if (!d || !b || d.state !== "fight") return;
  const winner = 1 - loser;
  const p = loser === 0 ? w.player : b;
  d.wins[winner] += 1;
  d.last = winner;
  d.state = "ko";
  d.wait = 2.2;
  p.alive = false;
  burst(w, p.x, p.y, loser === 0 ? "#ff6b4a" : "#35d0c0", 22, 240, true);
  burst(w, p.x, p.y, "#f7fbff", 12, 220, false);
  ring(w, p.x, p.y, "#f4fbff", 0.42, 14, 2.4);
  splat(w, p.x, p.y, 54);
  addTrauma(w, 0.85);
  w.hitstop = 0.1;
  w.flash = 0.25;
  w.cues.push("fart");
  w.bullets = [];
  w.pickups = [];
  const final = d.wins[winner] >= DUEL_WINS;
  if (final) d.taunt = DUEL_TAUNTS[Math.floor(w.rng() * DUEL_TAUNTS.length)] ?? DUEL_TAUNTS[0];
  w.banner = final ? `PILOT ${winner + 1} WINS THE DUEL` : `PILOT ${winner + 1} TAKES ROUND ${d.round}`;
  w.bannerT = 2.1;
}

function stepDuel(w: World, dt: number, input: InputState) {
  const d = w.duel;
  const p2 = w.wing;
  if (!d || !p2) return;
  const p1 = w.player;
  const live = d.state === "fight";
  drivePilot(
    w,
    p1,
    { left: input.left, right: input.right, up: input.up, down: input.down, focus: input.focus, fire: live && input.fire, alt: false, pointer: null, stick: input.stick ?? null, drag: null },
    dt,
  );
  drivePilot(
    w,
    p2,
    {
      left: !!input.wingLeft,
      right: !!input.wingRight,
      up: !!input.wingUp,
      down: !!input.wingDown,
      focus: !!input.wingFocus,
      fire: live && !!input.wingFire,
      alt: false,
      pointer: null,
      stick: input.wingStick ?? null,
      drag: null,
    },
    dt,
  );
  if (d.state === "ready") {
    d.wait -= dt;
    if (d.wait <= 0) {
      d.state = "fight";
      w.banner = "FLUSH!";
      w.bannerT = 0.7;
      w.cues.push("boss");
    }
  } else if (d.state === "ko") {
    d.wait -= dt;
    if (d.wait <= 0) {
      if (Math.max(d.wins[0], d.wins[1]) >= DUEL_WINS) {
        w.mode = "duelover";
        w.bullets = [];
        // the record between the two pilots is kept for good; the mop is worn until the page is closed
        const won = d.wins[0] > d.wins[1] ? 0 : 1;
        w.cleaner = 1 - won;
        note(w, won === 0 ? "duelWin1" : "duelWin2");
        note(w, "duels");
        persist(w, w.snap);
        return;
      }
      duelRound(w);
    }
  }

  // gifts drift along the middle line: flying up for one means flying up to the other pilot
  if (live) {
    const was = d.clock;
    d.clock += dt;
    if (was < DUEL_SUDDEN && d.clock >= DUEL_SUDDEN) {
      w.banner = "SUDDEN DEATH – DOUBLE DAMAGE";
      w.bannerT = 1.6;
      w.cues.push("boss");
    }
    d.giftT -= dt;
    if (d.giftT <= 0 && w.pickups.length < 2) {
      d.giftT = 5 + w.rng() * 3;
      const roll = w.rng();
      // in sudden death nothing that drags the round out falls any more: guns, coffee and fresheners only
      const sudden = d.clock >= DUEL_SUDDEN;
      const kind: PickupKind = roll < 0.4 ? "W" : roll < 0.55 ? (sudden ? "W" : "S") : roll < 0.68 ? (sudden ? "B" : "L") : roll < 0.82 ? "C" : roll < 0.93 ? "B" : sudden ? "C" : "T";
      const fromLeft = w.rng() < 0.5;
      const hue = kind === "W" ? Math.floor(w.rng() * DUEL_GUNS.length) : undefined;
      w.pickups.push({ kind, x: fromLeft ? -30 : WORLD_W + 30, y: WORLD_H / 2, vx: (fromLeft ? 1 : -1) * (60 + w.rng() * 40), vy: 0, value: hue ?? 0, rest: w.rng() * 6, hue, age: 0 });
    }
  }
  const kept: Pickup[] = [];
  for (const pk of w.pickups) {
    pk.age = (pk.age ?? 0) + dt;
    pk.x += pk.vx * dt;
    pk.y = WORLD_H / 2 + Math.sin(pk.age * 2.2 + pk.rest) * 24;
    if (pk.x < -50 || pk.x > WORLD_W + 50) continue;
    let taken = false;
    if (live) {
      for (const [p, i] of [
        [p1, 0],
        [p2, 1],
      ] as const) {
        if (p.alive && Math.hypot(p.x - pk.x, p.y - pk.y) < 38) {
          duelGift(w, pk, i);
          taken = true;
          break;
        }
      }
    }
    if (!taken) kept.push(pk);
  }
  // a gift can end the round (the freshener stings), and the round clears the field
  if (d.state !== "ko") w.pickups = kept;

  for (const sh of w.bullets) {
    sh.age = (sh.age ?? 0) + dt;
    sh.x += sh.vx * dt;
    sh.y += sh.vy * dt;
    sh.life -= dt;
  }
  if (d.state === "fight") {
    for (const sh of w.bullets) {
      if (sh.life <= 0 || sh.grazed) continue;
      const t = (sh.owner ?? 0) === 0 ? 1 : 0;
      const p = t === 0 ? p1 : p2;
      if (!p.alive) continue;
      if (Math.hypot(sh.x - p.x, sh.y - p.y) > 15 + sh.r * 0.7) continue;
      // one shot, one hit, even for the ones that fly on through
      sh.grazed = true;
      if ((sh.pierce ?? 0) <= 0) sh.life = 0;
      if (p.inv > 0) continue;
      if (p.shield) {
        p.shield = false;
        p.inv = 0.35;
        burst(w, p.x, p.y, "#f4f1ea", 12, 150, false);
        ring(w, p.x, p.y, "#f4f1ea", 0.28, 8, 1.5);
        w.cues.push("shield");
        continue;
      }
      const press = d.clock >= DUEL_SUDDEN * 2 ? 4 : d.clock >= DUEL_SUDDEN ? 2 : 1;
      const dmg = (sh.style === STYLE.mist ? sh.dmg * mistPower(sh.life) : sh.dmg) * press;
      d.hp[t] = Math.max(0, d.hp[t] - dmg);
      p.splat = 0.12;
      burst(w, sh.x, sh.y, t === 0 ? "#ff6b4a" : "#35d0c0", 3, 150, false);
      if (sh.style !== undefined && sh.style >= 10 && sh.style <= 15) puff(w, sh.x, sh.y, sh.style, 22);
      addTrauma(w, 0.04);
      w.cues.push("hit");
      if (d.hp[t] <= 0) {
        duelKo(w, t);
        break;
      }
    }
  }
  w.bullets = w.bullets.filter((sh) => sh.life > 0 && sh.x > -30 && sh.x < WORLD_W + 30 && sh.y > -50 && sh.y < WORLD_H + 50);
}
