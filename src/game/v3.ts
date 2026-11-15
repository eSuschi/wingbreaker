import { armyHas, armyRoles } from "./army";

export type GunFamily = "bubble" | "soap" | "paste" | "zap" | "flush" | "mist" | "dryer" | "bidet" | "sling" | "streamer" | "sponge" | "duck";
export type VKind = "dart" | "wedge" | "cruiser" | "drone" | "boss";

export type VSpawn = {
  at: number;
  kind: VKind;
  x: number;
  motion: string;
  role: string;
  oy: number;
  vx?: number;
  spin?: number;
  /** Formation row: everyone in one line wears the same look. */
  line?: number;
  /** How the critter flies in to its place: 0 drops straight down, 1-7 are the curved fly-ins. */
  entry?: number;
};

export type VHazard = {
  kind: string;
  x: number;
  y: number;
  w: number;
  h: number;
  hp: number;
  vx: number;
  vy: number;
  t: number;
  phase: number;
  /** pipe: centre of a second gap on wide screens */
  x2?: number;
  /** pipe: the valve's full health, and whether a pilot touched it or it has gone by */
  max?: number;
  hit?: boolean;
  done?: boolean;
};

/** What a level is: the usual waves, or one of the set pieces every room has. */
export type LevelKind = "waves" | "storm" | "bonus" | "mini" | "pipes" | "boss";

/** Every room: 1-2 waves, 3 poop storm, 4 waves, 5 bonus, 6 mini-boss, 7 waves, 8 pipe run, 9 gauntlet, 10 boss. */
export function levelKind(level: number): LevelKind {
  const { k } = diff(level);
  if (k === 10) return "boss";
  if (k === 5) return "bonus";
  if (k === 3) return "storm";
  if (k === 6) return "mini";
  if (k === 8) return "pipes";
  return "waves";
}

export type Shot = {
  ox: number;
  oy?: number;
  vx: number;
  vy: number;
  r: number;
  dmg: number;
  style: number;
  pierce: number;
  splash: number;
  life: number;
  /** Zap Brush: how many more critters the bolt jumps to after its first hit */
  chain: number;
  /** Rubber Slingshot and Sponge Bomber: bounces off the walls left */
  bounces?: number;
  /** Sponge Bomber: enemy shots it can still soak up */
  soak?: number;
};

const mulberry = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export function diff(level: number) {
  const lv = Math.max(1, Math.min(100, level));
  const d = (lv - 1) / 99;
  const ch = Math.floor((lv - 1) / 10);
  const k = ((lv - 1) % 10) + 1;
  return { lv, d, ch, k };
}

/** Enemies are drawn and hit larger on wide screens, where 26 px critters looked lost. */
export function sizeMul(width: number) {
  return Math.max(1, Math.min(1.5, width / 800));
}

/** A gun gift in the campaign: one power step on top of what the shop sold you, for this long. */
export const BOOST_TIME = 25;
/** Gifts stack this far above the shop power. */
export const BOOST_MAX = 2;

export function enemyBody(kind: VKind, level: number) {
  const { lv } = diff(level);
  const tip = Math.floor(lv / 34);
  // from level 5 on everything has a little more hull, so a formation takes a few seconds
  // to take apart instead of popping the moment it flies in
  const tough = (hp: number) => (lv <= 4 ? hp : Math.ceil(hp * 1.45));
  if (kind === "dart") return { hp: tough(1 + Math.floor(lv / 34)), r: 13, score: 70 + lv, vy: 90, cash: 1 + tip };
  if (kind === "drone") return { hp: tough(2 + Math.floor(lv / 22)), r: 14, score: 110 + lv * 2, vy: 84, cash: 1 + tip };
  if (kind === "wedge") return { hp: tough(2 + Math.floor(lv / 15)), r: 15, score: 130 + lv * 2, vy: 72, cash: 2 + tip };
  if (kind === "cruiser") return { hp: tough(7 + Math.floor(lv / 6)), r: 22, score: 260 + lv * 3, vy: 48, cash: 5 + tip };
  // Tuned so a typical gun for that point in the campaign clears a boss in
  // roughly 30 s (level 10) to 60 s (level 100) of steady fire.
  const hp = Math.round(300 + lv * 6.5 + lv * lv * 0.075);
  return { hp, r: 46, score: 4000 + lv * 40, vy: 46, cash: 30 + lv };
}

/**
 * Shared fire budget for the whole formation: `rate` volleys a second, never
 * more than `cap` hostile shots on screen, each shooter resting cdMin..cdMax.
 */
export function fireBudget(level: number, width = 700) {
  const { d, lv, k } = diff(level);
  // A wide screen spreads the same shots over far more sky, so the budget
  // follows the width: a phone gets fewer shots than a desktop for the same
  // pressure on the pilot.
  const wide = Math.max(0.75, Math.min(1.5, width / 700));
  // the first five levels ease in, from about two thirds of the normal fire;
  // a gauntlet (level 9 of a room) has four waves of bodies in the way already,
  // so each of them shoots a little less
  const ease = (lv >= 5 ? 1 : 0.55 + 0.09 * lv) * (k === 9 ? 0.85 : 1);
  const cap = Math.round((8 + 52 * Math.pow(d, 0.85)) * wide * ease);
  const rate = (1.2 + 4.3 * Math.pow(d, 0.9)) * wide * ease;
  const slow = 2.5 - (2.5 - 0.9) * Math.pow(d, 0.85);
  const fast = 4 - (4 - 1.4) * Math.pow(d, 0.85);
  const speed = 130 + 110 * d;
  return { cap, rate, cdMin: slow, cdMax: Math.max(slow + 0.2, fast), speed };
}

/** Share of shots aimed at the pilot instead of dropped straight down. */
export function aimedShare(level: number) {
  const { d, lv } = diff(level);
  return lv < 4 ? 0 : Math.min(0.6, 0.15 + 0.45 * d);
}

/** How many shots one volley holds: 1 early, up to 3 late, with no sudden steps. */
export function volleySize(level: number, rollA: number, rollB: number) {
  const { lv } = diff(level);
  const second = Math.max(0, Math.min(0.7, (lv - 15) / 50));
  const third = Math.max(0, Math.min(0.5, (lv - 55) / 60));
  return 1 + (rollA < second ? 1 : 0) + (rollB < third ? 1 : 0);
}

export function mayShoot(kind: string, role: string, level: number, id: number) {
  if (role === "bonus" || role === "chip" || role === "rain" || role === "spore" || role === "storm" || role === "stormbig" || role === "mini") return false;
  const { lv } = diff(level);
  // the first levels teach dodging: only some of the formation fires
  if (lv <= 3) return kind === "wedge" || kind === "cruiser" || id % 3 === 0;
  if (lv <= 6) return kind !== "dart" || id % 2 === 0;
  return true;
}

export function clearCash(level: number, perfect: boolean, noBomb: boolean, salvage: number, replay: boolean) {
  let n = (12 + level * 0.8) * (perfect ? 1.5 : 1) * (noBomb ? 1.2 : 1);
  n *= 1 + salvage * 0.15;
  if (replay) n *= 0.5;
  return Math.round(n);
}

/** Radius of a Honey Turret's shield ring, before the screen-size scale. */
export const HONEY_RING = 130;

export function screenCap(width: number) {
  return Math.max(12, Math.min(40, Math.round(width / 32)));
}

export function starsOf(perfect: boolean, noBomb: boolean, killed: number, born: number, fast: boolean, boss: boolean) {
  let n = 1;
  if (perfect) n += 1;
  if (boss ? fast : noBomb && born > 0 && killed / born >= 0.9) n += 1;
  return Math.min(3, n);
}

export function fastKillLimit(level: number) {
  const { d } = diff(level);
  return 34 + 40 * d;
}

/**
 * Arcade plays three stages from every chapter (two levels and the boss). After stage 30
 * it starts over from the first chapter, a lap tougher each time, until you run out of lives.
 */
export function arcadeStage(stage: number) {
  const all = Math.max(1, stage);
  const lap = Math.floor((all - 1) / 30);
  const s = ((all - 1) % 30) + 1;
  const c = Math.ceil(s / 3);
  const slot = ((s - 1) % 3) + 1;
  if (slot === 3) return { level: c * 10, boss: true, hpMul: 0.7, lap };
  if (slot === 1) return { level: 10 * (c - 1) + 2, boss: false, hpMul: 1, lap };
  return { level: 10 * (c - 1) + 7, boss: false, hpMul: 1, lap };
}

export function extraLifeAt(score: number, paid: number) {
  const gates = [50000, 150000, 300000];
  let next = paid;
  let grant = 0;
  for (const g of gates) {
    if (score >= g && next < g) {
      grant += 1;
      next = g;
    }
  }
  if (score >= 300000) {
    const steps = Math.floor((score - 300000) / 300000);
    const covered = Math.floor(Math.max(0, next - 300000) / 300000);
    if (steps > covered) {
      grant += steps - covered;
      next = 300000 + steps * 300000;
    }
  }
  return { grant, paid: next };
}

// level 9 of a chapter is the gauntlet: four waves, a little denser than the rest
const DENSITY = [0.85, 0.9, 0.95, 1, 1, 1.05, 1.1, 1.12, 1.15];

function pushGrid(out: VSpawn[], at: number, n: number, kind: VKind, role: string, W: number, H: number, motion: string, base: number, line: number) {
  const cols = Math.max(4, Math.min(10, Math.round(W / (72 * sizeMul(W)))));
  const rows = Math.ceil(n / cols);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const count = Math.min(cols, n - i);
    const span = W * 0.8;
    const x0 = (W - span) / 2;
    for (let c = 0; c < count; c++) {
      const x = count === 1 ? W / 2 : x0 + (span * c) / (count - 1);
      // a row streams in one critter after another, not all at once
      out.push({ at: at + r * 0.35 + c * 0.05, kind, x, motion, role, oy: base + H * r * 0.074, spin: i, line: line + r });
      i += 1;
    }
  }
}

export function planLevel(level: number, W: number, H: number, seed: number) {
  const { d, ch, k, lv } = diff(level);
  const rng = mulberry(seed || lv * 997);
  if (k === 10) return { spawns: [] as VSpawn[], bonus: false, banner: "" };
  if (k === 5) {
    const out: VSpawn[] = [];
    for (let i = 0; i < 40; i++) {
      const wave = Math.floor(i / 8);
      out.push({
        at: wave * 1.15 + (i % 8) * 0.16,
        kind: i % 5 === 0 ? "wedge" : "dart",
        x: W * (0.12 + ((i * 3) % 8) / 9),
        motion: i % 2 ? "conga" : "swoop",
        role: "bonus",
        oy: -40,
        spin: i,
      });
    }
    return { spawns: out, bonus: true, banner: "BONUS ROUND – NOBODY SHOOTS. CATCH THE SNACKS." };
  }
  const set = levelKind(level);
  if (set === "storm") return { spawns: planStorm(level, W, rng), bonus: false, banner: "POOP STORM – SHOOT IT OR DODGE IT" };
  if (set === "pipes") return { spawns: [] as VSpawn[], bonus: false, banner: "PIPE RUN – FLY THROUGH THE GAPS" };
  const mini = set === "mini";
  const f = DENSITY[k - 1] ?? 1;
  // a mini-boss level is one short wave of its bodyguards, then the big one
  const total = Math.max(12, Math.round((24 + 36 * d) * f * (mini ? 0.45 : 1)));
  const forms = ["grid", "vwing", "ring", "conga", "swoop", "rain", "pincer", "escort", "wall", "diamond", "columns", "chevrons"];
  const waves = mini ? 1 : k >= 9 ? 4 : k >= 6 ? 3 : 2;
  const out: VSpawn[] = [];
  let left = total;
  for (let wave = 0; wave < waves; wave++) {
    const n = wave === waves - 1 ? left : Math.max(4, Math.round(total / waves));
    left -= n;
    const rolled = forms[Math.floor(rng() * (ch === 0 && k < 4 ? 4 : forms.length))] ?? "grid";
    // a room whose army has a lid or a broom shows it for certain on its seventh level,
    // so its page in the Poop-Dex can always be filled
    const form = k === 7 && wave === 0 && armyHas(ch, "wall") ? "wall" : rolled;
    const at = wave * 2.1;
    const first = out.length;
    // which way this wave flies in; the very first levels keep to the gentle ones
    const entry = ch === 0 && k <= 2 ? (wave === 0 ? 0 : 7) : 1 + Math.floor(rng() * 7);
    const special = chapterRole(ch, k, wave);
    // The first wave settles lowest and later waves stack above it, so the
    // formations fill the upper half of the screen instead of one thin strip.
    // on a mini-boss level the bodyguards line up underneath, where the big one will hang
    const base = mini ? H * (W < 560 ? 0.4 : 0.37) : H * (0.09 + 0.085 * (waves - 1 - wave));
    if (form === "grid" || form === "wall") {
      // the first grid is small fry with one trick critter per row; later grids are divers
      const walled = form === "wall" && wave === 0 && armyHas(ch, "wall");
      const before = out.length;
      pushGrid(out, at, n, wave === 0 ? "dart" : "wedge", walled ? "wall" : "", W, H, "rank", base, wave * 2);
      if (walled) {
        // only the front row carries lids; the rows behind it are ordinary small fry
        const front = Math.max(...out.slice(before).map((sp) => sp.line ?? 0));
        for (let i = before; i < out.length; i++) if ((out[i].line ?? 0) !== front) out[i].role = "";
      }
      if (!walled && special) {
        const rowsSeen = new Set<number>();
        for (let i = before; i < out.length; i++) {
          const row = out[i].line ?? 0;
          if (rowsSeen.has(row)) continue;
          rowsSeen.add(row);
          const mid = out.filter((s, j) => j >= before && (s.line ?? 0) === row);
          mid[Math.floor(mid.length / 2)].role = special;
        }
      }
    } else if (form === "diamond" || form === "columns" || form === "chevrons") {
      // shapes built row by row: how many critters each row holds
      const wide = Math.max(3, Math.min(7, Math.round(W / (86 * sizeMul(W)))));
      const rows: number[] = [];
      if (form === "diamond") {
        const widths = wide >= 5 ? [1, 3, 5, 3, 1] : [1, 2, 3, 2, 1];
        for (const c of widths) rows.push(c);
      } else if (form === "columns") {
        const cols = Math.max(2, Math.min(5, wide - 1));
        for (let r = 0; r < Math.max(2, Math.min(5, Math.ceil(n / cols))); r++) rows.push(-cols);
      } else {
        for (const c of [2, 2, 2, 1, 2, 2, 1].slice(0, Math.max(3, Math.min(7, Math.ceil(n / 2))))) rows.push(c);
      }
      const gapX = Math.min(64 * sizeMul(W), (W * 0.8) / wide);
      let i = 0;
      rows.forEach((count, r) => {
        const cnt = Math.abs(count);
        for (let c = 0; c < cnt; c++) {
          let x = W / 2 + (c - (cnt - 1) / 2) * gapX;
          let oy = base + H * r * 0.07;
          if (count < 0) x = W / 2 + (c - (cnt - 1) / 2) * gapX * 1.7; // columns stand apart
          if (form === "chevrons") {
            // two arrowheads flying point-down, one behind the other
            const arm = r % 4;
            const side = c === 0 && cnt === 2 ? -1 : 1;
            x = W / 2 + (cnt === 1 ? 0 : side * (3 - arm) * gapX * 0.6);
            oy = base + H * (0.03 + (r >= 4 ? 0.2 : 0) + arm * 0.05);
          }
          const tip = (form === "diamond" && (r === 0 || r === rows.length - 1)) || (form === "chevrons" && cnt === 1);
          out.push({
            at: at + i * 0.06,
            kind: tip ? "drone" : wave === 0 ? "dart" : i % 4 === 0 ? "wedge" : "dart",
            x,
            motion: "rank",
            role: i === Math.floor(rows.length) && special ? special : "",
            oy,
            spin: i,
            line: wave * 2 + (form === "columns" ? c : r),
          });
          i += 1;
        }
      });
    } else if (form === "vwing") {
      const deep = Math.max(1, Math.floor((n - 1) / 2));
      const stepY = Math.min(H * 0.03, (H * 0.2) / deep);
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1;
        const row = Math.floor(i / 2);
        out.push({
          at: at + row * 0.08,
          kind: i % 6 === 0 ? "drone" : "dart",
          x: W / 2 + side * (28 + row * Math.min(36, W * 0.04)),
          motion: "sine",
          role: i === 0 ? special : "",
          // a real V: the tip flies lowest, the wings trail up and out
          oy: base + (deep - row) * stepY,
          spin: i,
          line: wave,
        });
      }
    } else if (form === "ring") {
      const c = Math.min(n, 14);
      for (let i = 0; i < c; i++) {
        const a = (i / c) * Math.PI * 2;
        out.push({
          at: at + i * 0.07,
          kind: "drone",
          x: W / 2 + Math.cos(a) * Math.min(W * 0.28, 160),
          motion: "spiral",
          role: i % 5 === 0 ? special : "",
          oy: base + H * 0.07 + Math.sin(a) * H * 0.065,
          spin: a,
          line: wave,
        });
      }
    } else if (form === "conga" || form === "rain") {
      for (let i = 0; i < n; i++) {
        out.push({
          at: at + i * 0.12,
          kind: "dart",
          x: W * (0.15 + rng() * 0.7),
          motion: form === "rain" ? "rain" : "conga",
          role: form === "rain" ? "rain" : i % 5 === 2 ? special : "",
          oy: -20,
          spin: i,
          line: wave + 1,
        });
      }
    } else if (form === "pincer") {
      for (let i = 0; i < n; i++) {
        const left = i % 2 === 0;
        out.push({
          at: at + i * 0.14,
          kind: i % 3 === 0 ? "wedge" : "dart",
          x: left ? W * 0.08 : W * 0.92,
          motion: "pincer",
          role: i % 6 === 1 ? special : "",
          oy: base + H * (i % 3) * 0.06,
          vx: left ? 140 : -140,
          line: wave + (left ? 0 : 1),
        });
      }
    } else if (form === "escort") {
      out.push({ at, kind: "cruiser", x: W / 2, motion: "hold", role: special, oy: base + H * 0.07 });
      const guards = Math.max(0, n - 1);
      for (let i = 0; i < guards; i++) {
        const a = (i / Math.max(1, guards)) * Math.PI * 2;
        const ringR = i % 2 ? 84 : 58;
        out.push({
          at,
          kind: "dart",
          x: W / 2 + Math.cos(a) * ringR * 1.5,
          motion: "spiral",
          role: "",
          oy: base + H * 0.07 + Math.sin(a) * ringR * 0.75,
          spin: i,
          line: i % 2,
        });
      }
    } else {
      for (let i = 0; i < n; i++) {
        out.push({
          at: at + (i % 6) * 0.12,
          kind: i % 4 === 0 ? "wedge" : "dart",
          x: 40 + (i / Math.max(1, n - 1)) * (W - 80),
          motion: "swoop",
          role: i % 5 === 2 ? special : "",
          oy: base + H * (i % 3) * 0.07,
          spin: i,
          line: wave + (i % 3),
        });
      }
    }
    // everyone in a wave that holds a place in a formation flies in the same way
    for (let i = first; i < out.length; i++) {
      const m = out[i].motion;
      if (m === "rank" || m === "sine" || m === "swoop" || m === "spiral" || m === "hold") out[i].entry = entry;
    }
  }
  // on a phone the health bar sits lower, under the score, so the big one hangs lower too
  if (mini) out.push({ at: 4, kind: "cruiser", x: W / 2, motion: "hold", role: "mini", oy: H * (W < 560 ? 0.265 : 0.215) });
  if (ch >= 2 && k >= 6 && !mini) {
    // a heavy with loot in the back row; in the Cleaning Closet it hides in a bucket
    out.push({ at: 1.2, kind: "cruiser", x: W * 0.3, motion: "hold", role: armyHas(ch, "hermit") ? "hermit" : "", oy: H * 0.18 });
  }
  // One Honey Turret per level, not a whole wave of them: it shields what is
  // inside its ring, so a crowd of turrets made everything immune at once.
  let turret = false;
  let forges = 0;
  for (const sp of out) {
    if (sp.role === "honey") {
      if (turret) sp.role = "";
      turret = true;
    } else if (sp.role === "forge") {
      // armoured Forge Bots are a few tough targets, not the whole wave
      forges += 1;
      if (forges > 3) sp.role = "";
    }
  }
  return { spawns: out, bonus: false, banner: "" };
}

/**
 * A poop storm: about 36 seconds of falling poop in four kinds of weather that take turns.
 * Everything in it can be shot, so a curtain is a wall to fly around or a wall to blast open.
 */
function planStorm(level: number, W: number, rng: () => number): VSpawn[] {
  const { d } = diff(level);
  const out: VSpawn[] = [];
  const lanes = Math.max(5, Math.min(16, Math.round(W / 78)));
  const laneX = (i: number) => W * 0.06 + (W * 0.88 * i) / (lanes - 1);
  const drop = (at: number, x: number, role = "storm", vx = 0) =>
    out.push({ at, kind: role === "stormbig" ? "wedge" : "dart", x, motion: "fall", role, oy: -30, vx, spin: out.length });
  const gapW = lanes >= 10 ? 3 : 2;
  let gap = Math.floor(rng() * (lanes - gapW + 1));
  let t = 1.2;
  let turn = 0;
  while (t < 36) {
    const kind = turn % 4;
    if (kind === 0) {
      // drizzle: single drops all over
      const n = Math.round(((5 + 9 * d) * lanes) / 8);
      for (let i = 0; i < n; i++) drop(t + rng() * 3.2, laneX(Math.floor(rng() * lanes)) + (rng() - 0.5) * 20);
      t += 3.6;
    } else if (kind === 1) {
      // curtain: a full row with one way through; the next way through is never far off
      const rows = d > 0.45 ? 2 : 1;
      for (let r = 0; r < rows; r++) {
        const reach = Math.max(1, Math.round(lanes * 0.35));
        gap = Math.max(0, Math.min(lanes - gapW, gap + Math.round((rng() * 2 - 1) * reach)));
        for (let i = 0; i < lanes; i++) if (i < gap || i >= gap + gapW) drop(t + r * 1.7, laneX(i));
      }
      t += 2.4 + (rows - 1) * 1.7;
    } else if (kind === 2) {
      // a slanted line that sweeps across
      const dir = rng() < 0.5 ? 1 : -1;
      for (let i = 0; i < lanes; i++) drop(t + i * 0.15, laneX(dir > 0 ? i : lanes - 1 - i));
      t += lanes * 0.15 + 1.5;
    } else {
      // the big ones: slow, tough, and three smaller ones when they pop
      const n = 1 + (d > 0.3 ? 1 : 0) + (d > 0.7 ? 1 : 0);
      for (let i = 0; i < n; i++) drop(t + i * 0.9, W * (0.2 + rng() * 0.6), "stormbig");
      const extra = Math.round((2 + 4 * d) * (lanes / 8));
      for (let i = 0; i < extra; i++) drop(t + 0.4 + rng() * 2.2, laneX(Math.floor(rng() * lanes)));
      t += 3.2;
    }
    turn += 1;
  }
  return out;
}

/**
 * A pipe run: a stack of sewer pipes scrolls down the screen, each with a gap to fly
 * through. Shoot the red valve and the whole pipe bursts instead. The next gap is always
 * within easy reach of the last one.
 */
function planPipes(level: number, W: number): VHazard[] {
  const { d, ch, lv } = diff(level);
  const rng = mulberry(lv * 7919 + 17);
  const out: VHazard[] = [];
  const count = 9 + Math.round(5 * d);
  const vy = 110 + 70 * d;
  const gapW = Math.max(118, Math.min(230, W * 0.3));
  const reach = Math.min(W * 0.42, 320);
  const twin = W > 820;
  const edge = gapW / 2 + 14;
  let x = W / 2;
  for (let i = 0; i < count; i++) {
    x = Math.max(edge, Math.min(W - edge, x + (rng() * 2 - 1) * reach));
    // later rooms: every third gap slides along its pipe, and those have no valve
    const slides = ch >= 3 && i % 3 === 2;
    let x2: number | undefined;
    if (twin) {
      // a second way through on a wide screen, well away from the first
      const other = x < W / 2 ? x + W * (0.34 + rng() * 0.2) : x - W * (0.34 + rng() * 0.2);
      x2 = Math.max(edge, Math.min(W - edge, other));
      if (Math.abs(x2 - x) < gapW * 1.6) x2 = undefined;
    }
    // the valve sits on solid pipe, on the side with the most room
    const left = Math.min(x, x2 ?? x) - gapW / 2;
    const right = W - Math.max(x, x2 ?? x) - gapW / 2;
    let valve = left > right ? left * (0.3 + rng() * 0.4) : W - right * (0.3 + rng() * 0.4);
    if (twin && x2 !== undefined) {
      const lo = Math.min(x, x2) + gapW / 2;
      const hi = Math.max(x, x2) - gapW / 2;
      if (hi - lo > 120) valve = lo + (hi - lo) * (0.35 + rng() * 0.3);
    }
    const hp = slides ? 0 : Math.round(9 + lv * 0.33);
    out.push({ kind: "pipe", x, x2, y: -70 - i * 300, w: gapW, h: 34, hp, max: hp, vx: slides ? (rng() < 0.5 ? -1 : 1) * (36 + 30 * d) : 0, vy, t: 0, phase: valve });
  }
  return out;
}

/**
 * Each room has up to two trick critters. The first shows up from the room's second level
 * (first level in later rooms), the second joins from the fourth, one wave each.
 */
function chapterRole(ch: number, k: number, wave: number) {
  const roles = armyRoles(ch).filter((r) => r !== "wall");
  if (ch === 0 && k < 6) return "";
  if (wave === 0) return k >= 2 || ch >= 3 ? (roles[0] ?? "") : "";
  if (wave === 1) return k >= 4 ? (roles[1] ?? "") : "";
  return k >= 8 ? (roles[0] ?? "") : "";
}

export function planHazards(level: number, W: number, H: number): VHazard[] {
  const { ch, k } = diff(level);
  if (levelKind(level) === "pipes") return planPipes(level, W);
  if (k < 4 || k === 5 || k === 10) return [];
  const out: VHazard[] = [];
  if (ch === 1) {
    out.push({ kind: "pane", x: W * 0.35, y: -40, w: 70, h: 120, hp: 8, vx: 18, vy: 28, t: 0, phase: 0 });
    out.push({ kind: "pane", x: W * 0.62, y: -160, w: 54, h: 90, hp: 8, vx: -14, vy: 24, t: 0, phase: 0 });
  } else if (ch === 2) {
    out.push({ kind: "rocks", x: 0, y: 0, w: W, h: H, hp: 1, vx: 0, vy: 0, t: 1.2, phase: 0 });
  } else if (ch === 3) {
    out.push({ kind: "well", x: W / 2, y: H * 0.34, w: 180, h: 180, hp: 1, vx: 0, vy: 0, t: 0, phase: 0 });
  } else if (ch === 4) {
    out.push({ kind: "goo", x: W * 0.4, y: -30, w: 46, h: 46, hp: 1, vx: 10, vy: 22, t: 0, phase: 0 });
  } else if (ch === 5) {
    out.push({ kind: "cloud", x: W * 0.45, y: H * 0.22, w: 120, h: 70, hp: 1, vx: 16, vy: 8, t: 0, phase: 0 });
  } else if (ch === 6) {
    out.push({ kind: "portal", x: W * 0.28, y: H * 0.28, w: 28, h: 28, hp: 1, vx: 0, vy: 0, t: 0, phase: 0 });
    out.push({ kind: "portal", x: W * 0.72, y: H * 0.42, w: 28, h: 28, hp: 1, vx: 0, vy: 0, t: 0, phase: 1 });
  } else if (ch === 7) {
    out.push({ kind: "flare", x: 0, y: H * 0.38, w: W, h: 54, hp: 1, vx: 0, vy: 0, t: 2.4, phase: 0 });
  } else if (ch === 8) {
    out.push({ kind: "bolt", x: W * 0.33, y: 0, w: 36, h: H, hp: 1, vx: 0, vy: 0, t: 1.6, phase: 0 });
    out.push({ kind: "bolt", x: W * 0.66, y: 0, w: 28, h: H, hp: 1, vx: 0, vy: 0, t: 2.4, phase: 0 });
  } else if (ch === 9) {
    out.push({ kind: "eclipse", x: 0, y: 0, w: W, h: H, hp: 1, vx: 0, vy: 0, t: 8, phase: 0 });
  }
  return out;
}

export function poopShape(chapter: number, level: number, roll: number) {
  const main = [0, 5, 6, 7, 8, 9, 10, 11, 12, 0][Math.max(0, Math.min(9, chapter))] ?? 0;
  if (roll < 0.02) return 14;
  if (roll < 0.03) return 15;
  if (roll < 0.07) return 16;
  if (chapter >= 4 && roll < 0.28) return [0, 5, 6, 7, 8][Math.floor(roll * 40) % 5];
  if (level <= 6) return 0;
  return main;
}

/**
 * How long a puff of Freshener Mist lasts: at 640 px a second that is about 575 px, enough
 * to reach the top row from the bottom of the screen, so nothing is ever out of reach.
 * It thins out on the way: full strength up close, well under half at the far end.
 */
export const MIST_LIFE = 0.9;

/** How much of its punch a puff of mist still has with `life` seconds left. */
export function mistPower(life: number) {
  const left = Math.max(0, Math.min(1, life / MIST_LIFE));
  return 0.4 + 0.6 * left;
}

/** Bullet styles, shared by the logic (what a shot does) and the renderer (what it looks like). */
export const STYLE = { bubble: 10, soap: 11, paste: 12, zap: 13, flush: 14, mist: 15, plunger: 4, bathBomb: 16, paperRoll: 17, ribbon: 18, buddy: 19, dryer: 20, bidet: 21, sling: 22, streamer: 23, sponge: 24, duck: 25 } as const;

/** How long a puff of the Hair Dryer lives: it reaches the formation from the back of the lane, just. */
export const DRYER_LIFE = 0.74;
/** Seconds between two drops of the Bidet Hose: the renderer stretches each drop to the next. */
export const BIDET_CD = 0.049;

/**
 * One volley for a gun family at a power level. Power is shared by all six families and
 * every level raises damage on a single target in the same steps (about 8, 12, 16, 20,
 * 25 and 30 a second). What differs is the shape of the fire, and with more power every
 * family throws more at once:
 *
 * BUBBLE BLASTER  quick bubbles, a fan that widens (1, 2, 4, 4, 6, 6)
 * SOAP CANNON     slow heavy bars that burst and splash the neighbours (1, 1, 2, 2, 3, 3)
 * TOOTHPASTE LASER thin fast streaks that go straight through a column (1, 1, 2, 2, 2, 3)
 * ZAP BRUSH       bolts that jump on to nearby critters (jumps 1, 1, 2, 2, 3, 3)
 * FLUSH WAVE      wide slow crescents that wash through everything (1, 1, 2, 2, 3, 3)
 * FRESHENER MIST  a short cone, half as strong again as the rest, but only up close
 * HAIR DRYER      a wide cone of hot air that blows through the front rows and shoves them back
 * BIDET HOSE      an unbroken jet that bends when the ship moves (1, 1, 2, 2, 3, 3 jets)
 * RUBBER SLINGSHOT balls that bounce off the walls, the ceiling and the critters
 * PAPER STREAMER  ribbons that curl after the nearest critter, a little weaker for never missing
 * SPONGE BOMBER   big slow sponges that soak up enemy shots and burst wider for each one
 * SQUEAKY DUCK    rings of sound through three or four critters, and what they touch slows down
 */
export function volley(family: GunFamily, rank: number, focus: boolean): { shots: Shot[]; cd: number } {
  const r = Math.max(1, Math.min(6, Math.round(rank)));
  const i = r - 1;
  const tight = focus ? 0.4 : 1;
  const shots: Shot[] = [];
  const add = (s: Partial<Shot> & { ox: number; vx: number; vy: number }) => {
    shots.push({
      ox: s.ox,
      oy: s.oy ?? -12,
      vx: s.vx,
      vy: s.vy,
      r: s.r ?? 2.2,
      dmg: s.dmg ?? 1,
      style: s.style ?? STYLE.bubble,
      pierce: s.pierce ?? 0,
      splash: s.splash ?? 0,
      life: s.life ?? 1.3,
      chain: s.chain ?? 0,
    });
  };
  // damage one target takes in a second at each power level, the same for every family
  const dps = [8, 12, 16, 20, 25, 30][i];
  if (family === "soap") {
    const bars = [1, 1, 2, 2, 3, 3][i];
    const cd = 0.2;
    const splash = [26, 28, 30, 32, 36, 40][i];
    for (let b = 0; b < bars; b++) {
      const ox = (b - (bars - 1) / 2) * 11;
      add({ ox, vx: ox * 0.8, vy: -620, r: 5.2 + i * 0.3, dmg: (dps * cd) / bars, style: STYLE.soap, splash, life: 1.4 });
    }
    return { shots, cd };
  }
  if (family === "paste") {
    const beams = [1, 1, 2, 2, 2, 3][i];
    const cd = 0.125;
    const pierce = [2, 2, 3, 3, 4, 5][i];
    for (let b = 0; b < beams; b++) {
      const ox = (b - (beams - 1) / 2) * 8;
      add({ ox, vx: 0, vy: -1100, r: 3.1, dmg: (dps * cd) / beams, style: STYLE.paste, pierce, life: 0.85 });
    }
    return { shots, cd };
  }
  if (family === "zap") {
    const bolts = [1, 1, 1, 2, 2, 2][i];
    const cd = 0.16;
    const chain = [1, 1, 2, 2, 3, 3][i];
    for (let b = 0; b < bolts; b++) {
      const ox = (b - (bolts - 1) / 2) * 12;
      // a little under par on the first target: the jumps make up for it, and more
      add({ ox, vx: 0, vy: -940, r: 3.4, dmg: (dps * cd * 0.88) / bolts, style: STYLE.zap, chain, life: 1 });
    }
    return { shots, cd };
  }
  if (family === "flush") {
    const waves = [1, 1, 2, 2, 3, 3][i];
    const cd = 0.3;
    const wide = [13, 15, 15, 17, 17, 19][i];
    for (let b = 0; b < waves; b++) {
      const ox = (b - (waves - 1) / 2) * 22;
      add({ ox, vx: ox * 1.2 * tight, vy: -540, r: wide, dmg: (dps * cd * 0.9) / waves, style: STYLE.flush, pierce: 99, life: 1.5 });
    }
    return { shots, cd };
  }
  if (family === "mist") {
    const puffs = [2, 2, 3, 3, 4, 5][i];
    const cd = 0.11;
    for (let b = 0; b < puffs; b++) {
      const a = (b - (puffs - 1) / 2) * 0.14 * (focus ? 0.5 : 1);
      // Fading: from the back of the lane it only tickles (well under the other guns).
      // Fly up close and it hits half as hard again as any of them.
      add({ ox: Math.sin(a) * 10, vx: Math.sin(a) * 640, vy: -Math.cos(a) * 640, r: 7 + i * 0.6, dmg: (dps * cd * 1.5) / puffs, style: STYLE.mist, life: MIST_LIFE });
    }
    return { shots, cd };
  }
  if (family === "dryer") {
    const puffs = [3, 3, 4, 4, 5, 5][i];
    const cd = 0.15;
    const half = ([0.2, 0.22, 0.26, 0.28, 0.32, 0.34][i]) * (focus ? 0.55 : 1);
    for (let b = 0; b < puffs; b++) {
      const a = -half + (2 * half * b) / (puffs - 1);
      // A puff blows through the first critter into the one behind it (two behind from power 4),
      // then it is spent. Small fry take one puff of each breath and no more; a heavy, a
      // mini-boss or a boss is big enough to catch three, which is about par. The cone gets
      // wider and denser with power, so each puff carries a little less.
      add({ ox: Math.sin(a) * 8, vx: Math.sin(a) * 700, vy: -Math.cos(a) * 700, r: 9 + i * 0.7, dmg: dps * cd * [0.35, 0.35, 0.31, 0.31, 0.28, 0.28][i], style: STYLE.dryer, pierce: [1, 1, 1, 2, 2, 2][i], life: DRYER_LIFE });
    }
    return { shots, cd };
  }
  if (family === "bidet") {
    const jets = [1, 1, 2, 2, 3, 3][i];
    const cd = BIDET_CD;
    for (let b = 0; b < jets; b++) {
      const k = b - (jets - 1) / 2;
      add({ ox: k * 9, vx: k * 46 * tight, vy: -960, r: 3 + (jets === 1 ? i * 0.5 : 0), dmg: (dps * cd) / jets, style: STYLE.bidet, life: 0.8 });
    }
    return { shots, cd };
  }
  if (family === "sling") {
    const pairs = [0, 0, 1, 1, 2, 2][i];
    const cd = [0.24, 0.2, 0.24, 0.2, 0.24, 0.21][i];
    const bounces = [2, 2, 3, 3, 3, 4][i];
    const total = dps * cd;
    // one ball straight up the middle, which kicks off sideways from the first thing it hits;
    // from power 3, pairs out to the sides that come back off the walls
    add({ ox: 0, vx: 0, vy: -680, r: 5.6 + i * 0.25, dmg: total * [0.98, 0.98, 0.8, 0.8, 0.72, 0.72][i], style: STYLE.sling, life: 2.4, bounces, pierce: 1 });
    for (let b = 0; b < pairs; b++) {
      const a = (0.3 + b * 0.3) * tight;
      for (const dir of [-1, 1]) {
        add({ ox: dir * 8, vx: Math.sin(a) * 640 * dir, vy: -Math.cos(a) * 640, r: 5 + i * 0.2, dmg: total * (pairs === 1 ? 0.2 : 0.14), style: STYLE.sling, life: 2.4, bounces, pierce: 1 });
      }
    }
    return { shots, cd };
  }
  if (family === "streamer") {
    const strips = [1, 1, 2, 2, 3, 3][i];
    const cd = 0.2;
    for (let b = 0; b < strips; b++) {
      const k = b - (strips - 1) / 2;
      const a = (strips === 1 ? 0 : k * 0.55) * (focus ? 0.5 : 1);
      // it finds its own way and wastes nothing, so the ribbons carry six tenths of the punch
      add({ ox: k * 10, vx: Math.sin(a) * 380, vy: -Math.cos(a) * 380, r: 4.4, dmg: (dps * cd * 0.6) / strips, style: STYLE.streamer, life: 1.9 });
    }
    return { shots, cd };
  }
  if (family === "sponge") {
    const sponges = [1, 1, 1, 2, 2, 2][i];
    const cd = 0.46;
    const soak = [1, 1, 2, 2, 3, 3][i];
    const splash = [34, 36, 38, 40, 42, 46][i];
    for (let b = 0; b < sponges; b++) {
      const k = b - (sponges - 1) / 2;
      add({ ox: k * 20, vx: k * 70 * tight, vy: -430, r: 10 + i * 0.5, dmg: (dps * cd * 1.1) / sponges, style: STYLE.sponge, life: 2.3, splash, bounces: 2, soak });
    }
    return { shots, cd };
  }
  if (family === "duck") {
    const rings = [1, 1, 1, 2, 2, 2][i];
    const cd = [0.34, 0.3, 0.3, 0.34, 0.32, 0.3][i];
    for (let b = 0; b < rings; b++) {
      const k = b - (rings - 1) / 2;
      // two rings fly side by side, far enough apart that small fry meet one of them
      add({ ox: k * 46, vx: k * 40 * tight, vy: -430, r: 9 + i * 0.5, dmg: (dps * cd * 0.7) / rings, style: STYLE.duck, pierce: [2, 2, 2, 3, 3, 3][i], life: 1.7 });
    }
    return { shots, cd };
  }
  // BUBBLE BLASTER
  const cd = 0.125;
  if (r === 1) add({ ox: 0, vx: 0, vy: -780, dmg: dps * cd, r: 3 });
  else {
    // From power 3 a quarter of the punch moves into the angled bubbles: less on one small
    // target than the other guns, more across a crowd, about par on something boss-sized.
    const side = [0, 0, 0.3, 0.4, 0.27, 0.3][i];
    const core = ((r >= 3 ? [0, 0, 12, 15, 18, 22][i] : dps) * cd) / 2;
    add({ ox: -7, vx: 0, vy: -780, dmg: core, r: 3 + i * 0.25 });
    add({ ox: 7, vx: 0, vy: -780, dmg: core, r: 3 + i * 0.25 });
    const angles = r >= 5 ? [0.15, 0.32] : r >= 3 ? [0.17] : [];
    for (const a0 of angles) {
      const a = a0 * tight;
      for (const dir of [-1, 1]) {
        add({ ox: dir * 12, vx: Math.sin(a) * 700 * dir, vy: -Math.cos(a) * 700, dmg: side, r: 2.6 });
      }
    }
  }
  return { shots, cd };
}

/** Orbiting pods: one from rank 4, two at rank 6 (matches what is drawn). */
export function podCount(rank: number) {
  return rank >= 6 ? 2 : rank >= 4 ? 1 : 0;
}

export const FAMILIES: GunFamily[] = ["bubble", "soap", "paste", "zap", "flush", "mist", "dryer", "bidet", "sling", "streamer", "sponge", "duck"];

/** The six guns a duel deals in: its gifts swap between these, as they always did. */
export const DUEL_GUNS: GunFamily[] = ["bubble", "soap", "paste", "zap", "flush", "mist"];

const FAMILY_INFO: Record<GunFamily, { name: string; color: string; blurb: string }> = {
  bubble: { name: "BUBBLE BLASTER", color: "#4fd6e8", blurb: "Quick bubbles in a widening fan." },
  soap: { name: "SOAP CANNON", color: "#f28c1c", blurb: "Heavy bars that burst and splash." },
  paste: { name: "TOOTHPASTE LASER", color: "#e9463f", blurb: "Thin streaks straight through a column." },
  zap: { name: "ZAP BRUSH", color: "#f5d21c", blurb: "Bolts that jump from critter to critter." },
  flush: { name: "FLUSH WAVE", color: "#3f7fe0", blurb: "Wide waves that wash through everything." },
  mist: { name: "FRESHENER MIST", color: "#7fd38a", blurb: "Weak from afar, half as strong again up close." },
  dryer: { name: "HAIR DRYER", color: "#ff5fa2", blurb: "A wide blast of hot air that shoves the front rows back." },
  bidet: { name: "BIDET HOSE", color: "#a9dcff", blurb: "One unbroken jet. Swing the ship and it whips." },
  sling: { name: "RUBBER SLINGSHOT", color: "#a8e04a", blurb: "Balls that bounce off walls, ceiling and critters." },
  streamer: { name: "PAPER STREAMER", color: "#b48cff", blurb: "Ribbons that curl after the nearest critter." },
  sponge: { name: "SPONGE BOMBER", color: "#e9b872", blurb: "Slow sponges that soak up enemy shots, then burst." },
  duck: { name: "SQUEAKY DUCK", color: "#ffd84a", blurb: "Rings of squeak that slow down whatever they pass." },
};

export function familyColor(f: GunFamily) {
  return (FAMILY_INFO[f] ?? FAMILY_INFO.bubble).color;
}

export function familyBlurb(f: GunFamily) {
  return (FAMILY_INFO[f] ?? FAMILY_INFO.bubble).blurb;
}

/** The gun's name without a power number, for the shop. */
export function familyTitle(f: GunFamily) {
  return (FAMILY_INFO[f] ?? FAMILY_INFO.bubble).name;
}

export function familyName(f: GunFamily, rank: number, hot: boolean) {
  return `${(FAMILY_INFO[f] ?? FAMILY_INFO.bubble).name} ${rank}${hot ? " HOT" : ""}`;
}

/** Reads a gun family out of a save file, including the three names used before the Toilet Empire. */
export function familyFrom(raw: unknown): GunFamily | undefined {
  if (raw === "pulse") return "bubble";
  if (raw === "neutron") return "soap";
  if (raw === "lance") return "paste";
  return FAMILIES.includes(raw as GunFamily) ? (raw as GunFamily) : undefined;
}

export const DEATH = [
  "Struck by something brown. History will not be kind.",
  "The poop won this round.",
  "Your ship has been returned to sender.",
  "Insurance does not cover this.",
  "Somewhere, a toilet brush is laughing.",
  "That was a learning experience. Mostly for them.",
  "You flew bravely. Then you flew into that.",
  "The hangar crew has seen worse. Not much worse.",
  "Even the bath sponge felt bad about it.",
  "Next time, consider dodging.",
  "Your flight recorder just says \"oh no\".",
  "The plungers are writing a song about this.",
  "Technically, you were hit by lunch.",
  "Mission status: extremely splattered.",
  "They'll name a crater after you. A small one.",
  "The toaster skin would not have saved you either.",
  "Space is big. You still found the poop.",
  "Ground control would like a word.",
  "Brave, bold, and slightly smelly.",
  "Your mother would have dodged that.",
];

export const TIPS = [
  "Tip: Shift shows your real hitbox. You're smaller than you look.",
  "Tip: Grazing a golden nugget pays. Getting hit by one does not.",
  "Tip: Gun power is bought in the shop and it is yours for good. A gift box adds one step for 25 seconds.",
  "Tip: Anything in a soap bubble is a gift. Anything with a red-orange outline wants you dead.",
  "Tip: A hit knocks off the gift boost, never the power you paid for.",
  "Tip: Twelve guns in the shop. Each pilot picks their own.",
  "Tip: A boss shows a yellow dotted ring now and then. Shoot it out: the boss chokes and its shots fizzle.",
  "Tip: Every mini-boss and every boss leaves you a perk: one of three. They last until you lose every life.",
  "Tip: The Poop-Dex pays $200 for every room whose pages you fill.",
  "Tip: Every kill charges your next bomb. Watch the bar by the bomb boxes.",
  "Tip: Fart clouds don't hurt. They just push. Like your aunt.",
  "Tip: Not using bombs pays extra. Being brave has a price tag.",
  "Tip: TOOTHPASTE LASER goes through lids and armor. Pot Lid Knights hate that.",
  "Tip: SOAP CANNON breaks up healing clouds. Clouds hate that.",
  "Tip: FRESHENER MIST fades with distance. Get close, then regret it.",
  "Tip: Press F to toggle auto fire. Respect is optional.",
  "Tip: The rubber duck stops time. Nobody knows why. Don't ask.",
  "Tip: In a pipe run, shoot the red valve and the whole pipe bursts. Or just fly through the gap like a normal person.",
  "Tip: Everything in a poop storm can be shot. A wall of it is only a wall until you make a hole.",
  "Tip: A mini-boss calls its friends twice. After that it is on its own, and it knows it.",
  "Tip: Two pilots, two full Super Flush bars, two bomb buttons at once. The screen goes down the drain.",
  "Tip: In a duel the loser of a round starts the next one behind a shield. It is called mercy.",
];

export const LAST_WORDS = [
  "TELL MY OYSTER…",
  "I WAS TWO DAYS FROM RETIREMENT",
  "WORTH IT",
  "NOT THE BRIEFCASE!",
  "I REGRET NOTHING. MOSTLY.",
  "AVENGE ME. OR DON'T.",
  "THIS WAS A RENTAL",
  "MY SNACKS…",
];

/** What the pilot who shot fewer gets called on the end-of-level card. */
export const LOSER_TITLES = [
  "MORAL SUPPORT",
  "PROFESSIONAL BYSTANDER",
  "HELD THE TOWEL",
  "WAS ALSO THERE",
  "SEAT WARMER",
  "CHIEF OF WATCHING",
  "BROUGHT SNACKS",
  "DECORATIVE WINGMAN",
  "FLEW IN CIRCLES, NICELY",
  "SAVING AMMO FOR LATER",
  "TOURIST",
  "EMOTIONAL DAMAGE ONLY",
];

export const WINNER_TITLES = ["TOP PLUNGER", "FLUSH MASTER", "KING OF THE BOWL", "CHIEF UNCLOGGER", "THE REAL PILOT", "MVP (MOST VIOLENT PLUNGER)"];

export const DUEL_TAUNTS = [
  "Loser cleans the bathroom.",
  "Somebody is doing the dishes tonight.",
  "That is going in the family chat.",
  "Rematch? The loser always says rematch.",
  "Winner picks the snacks.",
  "Flushed, fair and square.",
];

/** One line under a mini-boss's name card: the room's heavy, only bigger. */
export const MINI_LINES = [
  "Somebody left the tap running. On purpose.",
  "It will not let go. It has never let go.",
  "Eats socks. Wants seconds.",
  "Full, and looking for somewhere to tip.",
  "Mostly gas. All of it yours now.",
  "Everything you ever flushed, back as one.",
  "Clogged, angry, and coming at you tap first.",
  "The little valve on top is whistling. Bad sign.",
  "Please aim. It certainly will.",
  "Solid gold. Still a bathtub.",
];

export const BOMB_LINES = ["FRESH!", "LAVENDER STRIKE", "SPRING MEADOW", "PINE FOREST", "OCEAN BREEZE", "NEW CAR SMELL"];

export const BOSS_LINES = [
  ["ARMORED CISTERN", "Forty litres of grudge. Do not jiggle the handle."],
  ["TWIN CISTERN", "Two tanks, one pressure gauge, zero patience."],
  ["ROBO-VACUUM OVERLORD", "It mapped your whole flat. Then it got ideas."],
  ["UNDER-THE-BED MONSTER", "You were right to check. Every single night."],
  ["FRIDGE TITAN", "Something in the back has been there since March."],
  ["DRAIN HYDRA", "Cut off one pipe and the plumber bills you for two."],
  ["MEDICINE CABINET MIMIC", "Take two shots and call nobody in the morning."],
  ["KITCHEN SQUID", "Eight arms. Eight pans. Zero Michelin stars."],
  ["JANITOR MECH", "Wet floor. Wetter consequences."],
  ["THE TOILET KING", "Long may he flush."],
];

export const CREDITS = [
  "No bathrooms were harmed. Several were exploded.",
  "The poop was 100% vector-based and locally sourced.",
  "Special thanks to the plumber, who saw everything and said nothing.",
  "The Toilet Empire has fallen. Somebody still has to clean up.",
  "Thanks for playing. Please wash your hands.",
  "IT WAS A TOILET THE WHOLE TIME.",
];

export const GUIDE: { id: string; name: string; line: string; art: string }[] = [
  { id: "dart", name: "Small Fry", line: "One hit. Zero dignity. They come in lines.", art: "e/toilet_seat_scout" },
  { id: "wedge", name: "Diver", line: "Flies in a mood, then flies at you.", art: "e/plunger_interceptor" },
  { id: "drone", name: "Shooter", line: "The ones that actually throw the stuff.", art: "e/toilet_bomber" },
  { id: "cruiser", name: "Heavy", line: "Has a name. Had a pension. Full of loot.", art: "e/bathtub_barge" },
  { id: "wall", name: "Sealed Lid", line: "Hides behind a lid. Knock it off first, or go through it.", art: "e/sealed_lid" },
  { id: "gnat", name: "Cracked Mirror", line: "Seven years of bad luck, in three smaller pieces.", art: "e/cracked_mirror" },
  { id: "hermit", name: "Bucket Hermit", line: "Only rude when it comes outside.", art: "e/bucket_hermit" },
  { id: "moth", name: "Lamp Moth", line: "Cannot hold still. Circles its spot in the line.", art: "e/moon_lamp_moth" },
  { id: "honey", name: "Honey Jar Turret", line: "Makes its friends untouchable. Rude friends.", art: "e/honey_jar_turret" },
  { id: "mother", name: "Mold Mother", line: "Her kids are slow and numerous.", art: "e/mold_mother" },
  { id: "ghost", name: "Towel Wraith", line: "You can only hit the part that showed up.", art: "e/towel_wraith" },
  { id: "forge", name: "Pot Lid Knight", line: "The lid is the personality.", art: "e/pot_lid_knight" },
  { id: "spark", name: "Salt & Pepper Twins", line: "Seasoned. Electrified. Always two sparks at once.", art: "e/salt_and_pepper_twins" },
  { id: "watcher", name: "Security Camera", line: "Always watching. Always aiming. Quicker than the rest.", art: "e/security_camera" },
  { id: "splash", name: "Auto-Flush", line: "Goes out with a splash. Stand back.", art: "e/auto_flush_kamikaze" },
  { id: "boss", name: "Boss", line: "Three moods. All of them aimed.", art: "b/armored_cistern" },
  { id: "swirl", name: "Classic Swirl", line: "The house brown. Comes in nine shapes.", art: "p/classic_swirl" },
  { id: "frozen", name: "Frozen Turd", line: "Cold, then three ice cubes.", art: "p/frozen_turd" },
  { id: "pebble", name: "Pebble Poop", line: "Bounces once. That's the joke.", art: "p/pebble_poop" },
  { id: "honeyblob", name: "Honey Blob", line: "Slow. Sticky. Has a bee.", art: "p/honey_blob" },
  { id: "slime", name: "Slime Log", line: "Becomes two. Never a good sign.", art: "p/slime_log" },
  { id: "ghostpoop", name: "Ghost Poop", line: "See-through. Still counts.", art: "p/ghost_poop" },
  { id: "chili", name: "Chili Bomb", line: "Fast and personally offended.", art: "p/chili_bomb" },
  { id: "zap", name: "Zap Turd", line: "Cannot fly in a straight line.", art: "p/zap_turd" },
  { id: "gold", name: "Golden Nugget", line: "Graze it for cash. Don't kiss it.", art: "p/golden_nugget" },
  { id: "fart", name: "Fart Cloud", line: "Does not hurt. Does shove.", art: "p/fart_cloud" },
];

export type BossCmd =
  | { op: "shot"; a: number; speed: number; r: number; shape: number }
  | { op: "summon"; kind: VKind; x: number; role: string }
  | { op: "banner"; text: string }
  | { op: "clear" }
  | { op: "dive" }
  /** a column that is marked for `wait` seconds and then strikes; dx is measured from the pilot */
  | { op: "lane"; dx: number; w: number; wait: number }
  /** the same lying down: a strip across the screen; dy is measured from the pilot */
  | { op: "band"; dy: number; h: number; wait: number }
  /** a shot dropped in from the top edge at x */
  | { op: "drop"; x: number; speed: number; shape: number };

/**
 * Every boss has one attack of its own, on top of its ordinary fire. It is always
 * announced: a marked column or strip that strikes a moment later, or a pattern with a
 * gap to fly through. `n` counts how many times the boss has used it so far.
 */
export function bossSignature(ch: number, phase: number, n: number, pilotX: number, width: number): { name: string; cmds: BossCmd[] } {
  const cmds: BossCmd[] = [];
  const side = n % 2 ? 1 : -1;
  // on a narrow screen the columns and the gaps between them shrink with it
  const fit = Math.max(0.7, Math.min(1, width / 620));
  const lane = (dx: number, wait = 0.9, w = 70) => cmds.push({ op: "lane", dx: dx * fit, w: w * fit, wait: wait + 0.15 });
  const band = (dy: number, wait = 1, h = 64) => cmds.push({ op: "band", dy, h, wait });
  // a cheap repeatable shuffle, so the same fight plays the same way twice
  const pick = (i: number) => {
    const v = Math.sin((n + 1) * 12.9898 + i * 78.233) * 43758.5453;
    return v - Math.floor(v);
  };
  if (ch === 0) {
    lane(0);
    if (phase >= 1) lane(side * 115, 1.15);
    if (phase >= 2) lane(-side * 115, 1.4);
    return { name: "FLUSH!", cmds };
  }
  if (ch === 1) {
    lane(-88, 0.9, 80);
    lane(88, 0.9, 80);
    // the middle goes last, and late enough to step out of it once the sides have struck
    if (phase >= 1) lane(0, 1.9, 80);
    return { name: "DOUBLE FLUSH", cmds };
  }
  if (ch === 2) {
    // a curtain of dust with one gap, a little to the side of where you are
    const gap = Math.max(70, Math.min(width - 70, pilotX + side * 120));
    for (let x = 22; x < width; x += 44) if (Math.abs(x - gap) > 62) cmds.push({ op: "drop", x, speed: 150 + phase * 20, shape: 6 });
    return { name: "DUST STORM", cmds };
  }
  if (ch === 3) {
    // a hand walks its fingers across the screen toward you: run the other way
    lane(-side * 150, 0.9);
    lane(-side * 75, 1.2);
    lane(0, 1.5);
    if (phase >= 2) lane(side * 75, 1.8);
    return { name: "GRABBY HANDS", cmds };
  }
  if (ch === 4) {
    const cubes = 6 + phase * 2;
    for (let i = 0; i < cubes; i++) cmds.push({ op: "drop", x: i === 0 ? pilotX : 20 + pick(i) * (width - 40), speed: 150 + pick(i + 9) * 60, shape: 5 });
    return { name: "ICE CUBES", cmds };
  }
  if (ch === 5) {
    // three heads, three arms of slime that turn a little further every time
    for (let head = 0; head < 3; head++) {
      for (let j = 0; j < 4 + phase; j++) {
        const a = n * 0.55 + (head * Math.PI * 2) / 3 + j * 0.13;
        if (Math.sin(a) > -0.25) cmds.push({ op: "shot", a, speed: 105 + j * 22, r: 5, shape: 9 });
      }
    }
    return { name: "THREE HEADS", cmds };
  }
  if (ch === 6) {
    band(0);
    if (phase >= 1) band(side * 92, 1.45);
    return { name: "TAKE YOUR MEDICINE", cmds };
  }
  if (ch === 7) {
    lane((pick(1) - 0.5) * 260, 0.9);
    lane((pick(2) - 0.5) * 260, 1.2);
    if (phase >= 1) lane(0, 1.5);
    return { name: "PAN TOSS", cmds };
  }
  if (ch === 8) {
    band(n % 2 ? -70 : 70, 1, 84);
    if (phase >= 2) band(n % 2 ? 70 : -70, 1.6, 84);
    return { name: "WET FLOOR", cmds };
  }
  lane(0);
  // on a narrow screen one column is plenty: two would leave nowhere to go
  if (phase >= 1 && width >= 500) lane(side * 120, 1.25);
  if (phase >= 3) band(side * 60, 1.9);
  if (phase >= 3) for (let i = 0; i < 10; i++) cmds.push({ op: "shot", a: n * 0.4 + (i / 10) * Math.PI * 2, speed: 130, r: 5, shape: 14 });
  return { name: "ROYAL FLUSH", cmds };
}

export function bossScript(ch: number, phase: number, t: number, aim: number, width: number): BossCmd[] {
  const cmds: BossCmd[] = [];
  const ring = (n: number, gap: number, speed: number, shape: number) => {
    for (let i = 0; i < n; i++) {
      const a = -Math.PI * 0.15 + (i / (n - 1)) * Math.PI * 1.3;
      if (Math.abs(a - Math.PI / 2) < gap) continue;
      cmds.push({ op: "shot", a, speed, r: 5, shape });
    }
  };
  if (ch === 0) {
    if (phase === 0) {
      cmds.push({ op: "shot", a: aim, speed: 120, r: 5, shape: 0 });
      cmds.push({ op: "shot", a: aim - 0.18, speed: 120, r: 5, shape: 0 });
      cmds.push({ op: "shot", a: aim + 0.18, speed: 120, r: 5, shape: 0 });
      if (Math.floor(t) % 3 === 0) ring(8, 0.22, 100, 0);
    } else if (phase === 1) {
      cmds.push({ op: "summon", kind: "dart", x: width * 0.3, role: "" });
      ring(10, 0.28, 110, 0);
    } else {
      cmds.push({ op: "banner", text: "THE TANK IS CRACKING" });
      cmds.push({ op: "dive" });
      ring(8, 0.34, 130, 0);
    }
    return cmds;
  }
  if (ch === 1) {
    cmds.push({ op: "shot", a: aim, speed: 140, r: 4.2, shape: 5 });
    if (phase >= 1) cmds.push({ op: "shot", a: Math.PI / 2 + Math.sin(t) * 0.4, speed: 160, r: 6, shape: 5 });
    if (phase >= 2) cmds.push({ op: "summon", kind: "dart", x: width * 0.2, role: "" });
    return cmds;
  }
  if (ch === 2) {
    ring(phase === 0 ? 5 : 8, 0.3, 100 + phase * 15, 6);
    if (phase >= 1) cmds.push({ op: "summon", kind: "wedge", x: width * 0.5, role: "hermit" });
    if (phase >= 2) cmds.push({ op: "banner", text: "BAG FULL" });
    return cmds;
  }
  if (ch === 3) {
    cmds.push({ op: "shot", a: aim, speed: 90 + phase * 20, r: 6, shape: 7 });
    if (phase >= 1) ring(7, 0.25, 100, 7);
    return cmds;
  }
  if (ch === 4) {
    ring(6, 0.35, 80, 8);
    if (phase >= 1) cmds.push({ op: "banner", text: "DOOR AJAR" });
    if (phase >= 2) cmds.push({ op: "summon", kind: "drone", x: width * 0.4, role: "honey" });
    return cmds;
  }
  if (ch === 5) {
    if (phase === 0) cmds.push({ op: "summon", kind: "drone", x: width * 0.35, role: "pod" });
    ring(8, 0.2, 110, 9);
    if (phase >= 2) {
      cmds.push({ op: "summon", kind: "drone", x: width * 0.25, role: "mother" });
      cmds.push({ op: "summon", kind: "drone", x: width * 0.75, role: "mother" });
    }
    return cmds;
  }
  if (ch === 6) {
    ring(8, 0.26, 120, 10);
    if (phase >= 1) cmds.push({ op: "banner", text: "SIDE EFFECTS MAY INCLUDE THIS" });
    return cmds;
  }
  if (ch === 7) {
    cmds.push({ op: "shot", a: aim - 0.3, speed: 150, r: 5, shape: 11 });
    cmds.push({ op: "shot", a: aim + 0.3, speed: 150, r: 5, shape: 11 });
    if (phase >= 2) ring(6, 0.3, 140, 11);
    return cmds;
  }
  if (ch === 8) {
    cmds.push({ op: "summon", kind: "drone", x: width * 0.3, role: "spark" });
    cmds.push({ op: "summon", kind: "drone", x: width * 0.7, role: "spark" });
    ring(6, 0.32, 130, 12);
    if (phase >= 2) cmds.push({ op: "banner", text: "CAUTION" });
    return cmds;
  }
  if (phase === 0) {
    cmds.push({ op: "shot", a: aim, speed: 150, r: 5, shape: 0 });
    cmds.push({ op: "banner", text: "KNEEL" });
  } else if (phase === 1) {
    cmds.push({ op: "shot", a: aim, speed: 100, r: 6, shape: 9 });
    ring(8, 0.24, 120, 9);
  } else if (phase === 2) {
    ring(10, 0.22, 130, 10);
    cmds.push({ op: "shot", a: aim, speed: 160, r: 5, shape: 11 });
  } else {
    cmds.push({ op: "banner", text: "LONG MAY HE FLUSH" });
    ring(12, 0.18, 140, 0);
  }
  return cmds;
}

export function bossPhases(ch: number) {
  return ch === 9 ? 4 : 3;
}

export function phaseIndex(ch: number, ratio: number) {
  const n = bossPhases(ch);
  if (n === 4) {
    if (ratio < 0.15) return 3;
    if (ratio < 0.4) return 2;
    if (ratio < 0.7) return 1;
    return 0;
  }
  if (ratio < 0.33) return 2;
  if (ratio < 0.66) return 1;
  return 0;
}

export function daySeed(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return { key: `${y}-${m}-${d}`, seed: Number(`${y}${m}${d}`) };
}
