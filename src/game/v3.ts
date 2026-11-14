export type GunFamily = "pulse" | "neutron" | "lance";
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
};

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

export function enemyBody(kind: VKind, level: number) {
  const { lv } = diff(level);
  const tip = Math.floor(lv / 34);
  if (kind === "dart") return { hp: 1 + Math.floor(lv / 34), r: 11, score: 70 + lv, vy: 90, cash: 1 + tip };
  if (kind === "drone") return { hp: 2 + Math.floor(lv / 22), r: 12, score: 110 + lv * 2, vy: 84, cash: 1 + tip };
  if (kind === "wedge") return { hp: 2 + Math.floor(lv / 15), r: 13, score: 130 + lv * 2, vy: 72, cash: 2 + tip };
  if (kind === "cruiser") return { hp: 7 + Math.floor(lv / 6), r: 16, score: 260 + lv * 3, vy: 48, cash: 5 + tip };
  // Tuned so a typical gun for that point in the campaign clears a boss in
  // roughly 40 s (level 10) to 90 s (level 100) of steady fire.
  const hp = Math.round(400 + lv * 9 + lv * lv * 0.12);
  return { hp, r: 34, score: 4000 + lv * 40, vy: 46, cash: 30 + lv };
}

/**
 * Shared fire budget for the whole formation: `rate` volleys a second, never
 * more than `cap` hostile shots on screen, each shooter resting cdMin..cdMax.
 */
export function fireBudget(level: number, width = 700) {
  const { d, lv } = diff(level);
  // A wide screen spreads the same shots over far more sky, so the budget
  // follows the width: a phone gets fewer shots than a desktop for the same
  // pressure on the pilot.
  const wide = Math.max(0.75, Math.min(1.55, width / 700));
  // the first five levels ease in, from about two thirds of the normal fire
  const ease = lv >= 5 ? 1 : 0.55 + 0.09 * lv;
  const cap = Math.round((8 + 52 * Math.pow(d, 0.85)) * wide * ease);
  const rate = (1.2 + 4.8 * Math.pow(d, 0.9)) * wide * ease;
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
  if (role === "bonus" || role === "chip" || role === "rain" || role === "spore") return false;
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
  return 45 + 55 * d;
}

export function arcadeStage(stage: number) {
  const s = Math.max(1, Math.min(30, stage));
  const c = Math.ceil(s / 3);
  const slot = ((s - 1) % 3) + 1;
  if (slot === 3) return { level: c * 10, boss: true, hpMul: 0.7 };
  if (slot === 1) return { level: 10 * (c - 1) + 2, boss: false, hpMul: 1 };
  return { level: 10 * (c - 1) + 7, boss: false, hpMul: 1 };
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

const DENSITY = [0.85, 0.9, 0.95, 1, 1, 1.05, 1.1, 1.15, 1.3];

function pushGrid(out: VSpawn[], at: number, n: number, kind: VKind, role: string, W: number, H: number, motion: string, base: number) {
  const cols = Math.max(4, Math.min(10, Math.round(W / (72 * sizeMul(W)))));
  const rows = Math.ceil(n / cols);
  let i = 0;
  for (let r = 0; r < rows; r++) {
    const count = Math.min(cols, n - i);
    const span = W * 0.8;
    const x0 = (W - span) / 2;
    for (let c = 0; c < count; c++) {
      const x = count === 1 ? W / 2 : x0 + (span * c) / (count - 1);
      out.push({ at: at + r * 0.35, kind, x, motion, role, oy: base + H * r * 0.062, spin: i });
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
    return { spawns: out, bonus: true, banner: "BONUS ROUND – NOBODY SHOOTS. PROBABLY." };
  }
  const f = DENSITY[k - 1] ?? 1;
  const total = Math.max(12, Math.round((24 + 36 * d) * f));
  const forms = ["grid", "vwing", "ring", "conga", "swoop", "rain", "pincer", "escort", "wall"];
  const waves = k >= 9 ? 4 : k >= 6 ? 3 : 2;
  const out: VSpawn[] = [];
  let left = total;
  for (let wave = 0; wave < waves; wave++) {
    const n = wave === waves - 1 ? left : Math.max(4, Math.round(total / waves));
    left -= n;
    const form = forms[Math.floor(rng() * (ch === 0 && k < 4 ? 4 : forms.length))] ?? "grid";
    const at = wave * 2.1;
    const special = chapterRole(ch, k, wave);
    // The first wave settles lowest and later waves stack above it, so the
    // formations fill the upper half of the screen instead of one thin strip.
    const base = H * (0.09 + 0.085 * (waves - 1 - wave));
    if (form === "grid" || form === "wall") {
      pushGrid(out, at, n, wave === 0 ? "dart" : "wedge", form === "wall" && wave === 0 ? "wall" : special, W, H, "rank", base);
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
        });
      }
    } else if (form === "ring") {
      const c = Math.min(n, 14);
      for (let i = 0; i < c; i++) {
        const a = (i / c) * Math.PI * 2;
        out.push({
          at,
          kind: "drone",
          x: W / 2 + Math.cos(a) * Math.min(W * 0.28, 160),
          motion: "spiral",
          role: special,
          oy: base + H * 0.07 + Math.sin(a) * H * 0.065,
          spin: a,
        });
      }
    } else if (form === "conga" || form === "rain") {
      for (let i = 0; i < n; i++) {
        out.push({
          at: at + i * 0.12,
          kind: "dart",
          x: W * (0.15 + rng() * 0.7),
          motion: form === "rain" ? "rain" : "conga",
          role: form === "rain" ? "rain" : special,
          oy: -20,
          spin: i,
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
          role: special,
          oy: base + H * (i % 3) * 0.06,
          vx: left ? 140 : -140,
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
        });
      }
    } else {
      for (let i = 0; i < n; i++) {
        out.push({
          at: at + (i % 6) * 0.12,
          kind: i % 4 === 0 ? "wedge" : "dart",
          x: 40 + (i / Math.max(1, n - 1)) * (W - 80),
          motion: "swoop",
          role: special,
          oy: base + H * (i % 3) * 0.07,
          spin: i,
        });
      }
    }
  }
  if (ch >= 2 && k >= 6) {
    out.push({ at: 1.2, kind: "cruiser", x: W * 0.3, motion: "hold", role: "hermit", oy: H * 0.18 });
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

function chapterRole(ch: number, k: number, wave: number) {
  if (wave !== 0) return "";
  if (ch === 1 && k <= 3) return "gnat";
  if (ch === 2 && k === 1) return "hermit";
  if (ch === 3) return "moth";
  if (ch === 4 && k !== 5) return "honey";
  if (ch === 5) return "mother";
  if (ch === 6) return "ghost";
  if (ch === 7) return "forge";
  if (ch === 8) return "spark";
  if (ch === 9) return "watcher";
  return "";
}

export function planHazards(level: number, W: number, H: number): VHazard[] {
  const { ch, k } = diff(level);
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
 * One volley for a gun family at a rank. Every rank raises damage on a single
 * target in the same steps for all three families (about 8, 12, 16, 20, 25 and
 * 30 a second); the families differ in what else they do:
 * PULSE adds angled side shots that sweep a wide area, NEUTRON's slow balls
 * splash 40% onto neighbours, LANCE's narrow beams pierce through a column.
 */
export function volley(family: GunFamily, rank: number, focus: boolean): { shots: Shot[]; cd: number } {
  const r = Math.max(1, Math.min(6, Math.round(rank)));
  const i = r - 1;
  const tight = focus ? 0.4 : 1;
  const shots: Shot[] = [];
  const add = (s: Partial<Shot> & { ox: number; vx: number; vy: number }) => {
    shots.push({
      ox: s.ox,
      oy: s.oy,
      vx: s.vx,
      vy: s.vy,
      r: s.r ?? 2.2,
      dmg: s.dmg ?? 1,
      style: s.style ?? 0,
      pierce: s.pierce ?? 0,
      splash: s.splash ?? 0,
      life: s.life ?? 1.3,
    });
  };
  if (family === "neutron") {
    const balls = [1, 1, 2, 2, 3, 3][i];
    const dmg = [1.6, 2.4, 1.6, 2, 1.65, 2][i];
    const splash = [26, 28, 30, 32, 36, 40][i];
    for (let b = 0; b < balls; b++) {
      const ox = (b - (balls - 1) / 2) * 9;
      add({ ox, vx: ox * 0.8, vy: -620, r: 5.2, dmg, style: 2, splash, life: 1.4 });
    }
    return { shots, cd: 0.2 };
  }
  if (family === "lance") {
    const beams = [1, 1, 2, 2, 2, 3][i];
    const dmg = [1, 1.5, 1, 1.25, 1.55, 1.25][i];
    const pierce = [2, 2, 3, 3, 4, 5][i];
    for (let b = 0; b < beams; b++) {
      const ox = (b - (beams - 1) / 2) * 7;
      add({ ox, vx: 0, vy: -1100, r: 3.1, dmg, style: 3, pierce, life: 0.85 });
    }
    return { shots, cd: 0.125 };
  }
  if (r === 1) add({ ox: 0, vx: 0, vy: -780, dmg: 1, style: 0 });
  else {
    const core = [0, 0.75, 1, 1.25, 1.55, 1.85][i];
    add({ ox: -7, vx: 0, vy: -780, dmg: core, style: 0 });
    add({ ox: 7, vx: 0, vy: -780, dmg: core, style: 0 });
    const side = [0, 0, 0.5, 0.5, 0.55, 0.6][i];
    const angles = r >= 5 ? [0.15, 0.32] : r >= 3 ? [0.17] : [];
    for (const a0 of angles) {
      const a = a0 * tight;
      for (const dir of [-1, 1]) {
        add({ ox: dir * 12, vx: Math.sin(a) * 700 * dir, vy: -Math.cos(a) * 700, dmg: side, style: 1, r: 2 });
      }
    }
  }
  return { shots, cd: 0.125 };
}

/** Orbiting pods: one from rank 4, two at rank 6 (matches what is drawn). */
export function podCount(rank: number) {
  return rank >= 6 ? 2 : rank >= 4 ? 1 : 0;
}

export const FAMILIES: GunFamily[] = ["pulse", "neutron", "lance"];

export function familyColor(f: GunFamily) {
  if (f === "neutron") return "#9ed24a";
  if (f === "lance") return "#e07a3d";
  return "#7eb6d6";
}

export function familyName(f: GunFamily, rank: number, hot: boolean) {
  return `${f.toUpperCase()} ${rank}${hot ? " HOT" : ""}`;
}

export const DEATH = [
  "Struck by something brown. History will not be kind.",
  "The poop won this round.",
  "Your ship has been returned to sender.",
  "Insurance does not cover this.",
  "Somewhere, a moon pug is laughing.",
  "That was a learning experience. Mostly for them.",
  "You flew bravely. Then you flew into that.",
  "The hangar crew has seen worse. Not much worse.",
  "Even the jellyfish felt bad about it.",
  "Next time, consider dodging.",
  "Your flight recorder just says \"oh no\".",
  "The critters are writing a song about this.",
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
  "Tip: The gift box changes color while it falls. Wait for yours.",
  "Tip: 100 snacks make a bomb. Science is weird.",
  "Tip: Fart clouds don't hurt. They just push. Like your aunt.",
  "Tip: Not using bombs pays extra. Being brave has a price tag.",
  "Tip: LANCE goes through armor. Forge Bots hate that.",
  "Tip: NEUTRON breaks up healing clouds. Clouds hate that.",
  "Tip: Press F to toggle auto fire. Respect is optional.",
  "Tip: The rubber duck stops time. Nobody knows why. Don't ask.",
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

export const BOMB_LINES = ["FRESH!", "LAVENDER STRIKE", "SPRING MEADOW", "PINE FOREST", "OCEAN BREEZE", "NEW CAR SMELL"];

export const BOSS_LINES = [
  ["COMET REGENT", "Rules the nebula. Has never paid rent."],
  ["ION ADMIRAL", "Twelve medals. All for attendance."],
  ["DUNE MAW", "Mostly mouth. Some regrets."],
  ["MOON EYE", "It has seen things. Now it sees you."],
  ["OCHRE WHALE", "Swallowed a fleet once. Still peckish."],
  ["NIMBUS QUEEN", "Royal, fluffy, and deeply unpleasant."],
  ["BONE COMET", "Died years ago. Refused to stop."],
  ["FORGE SQUID", "Six arms. Six guns. Zero chill."],
  ["THUNDER JELLY", "Shocking. Every single time."],
  ["ECLIPSE IDOL", "The Black Watch's final answer. It's a weird answer."],
];

export const CREDITS = [
  "No critters were harmed. Several were exploded.",
  "The poop was 100% vector-based and locally sourced.",
  "Special thanks to the moon pug for filing so many complaints.",
  "The Black Watch is broken. The toilet remains.",
  "Thanks for playing. Please wash your hands.",
  "IT WAS A TOILET THE WHOLE TIME.",
];

export const GUIDE: { id: string; name: string; line: string }[] = [
  { id: "dart", name: "Dart", line: "One hit. Zero dignity." },
  { id: "wedge", name: "Wedge", line: "Flies in a mood." },
  { id: "drone", name: "Drone", line: "Small, loud, employed." },
  { id: "cruiser", name: "Cruiser", line: "Has a name. Had a pension." },
  { id: "gnat", name: "Glass Gnat", line: "Dies into three smaller regrets." },
  { id: "hermit", name: "Rock Hermit", line: "Only rude when it comes outside." },
  { id: "moth", name: "Orbit Moth", line: "Dating a gravity well." },
  { id: "honey", name: "Honey Turret", line: "Makes friends immortal. Rude friends." },
  { id: "mother", name: "Spore Mother", line: "Her kids are slow and numerous." },
  { id: "ghost", name: "Phase Ghost", line: "You can only hit the part that showed up." },
  { id: "forge", name: "Forge Bot", line: "The plate is the personality." },
  { id: "spark", name: "Spark Twin", line: "Kill one. The lightning files for divorce." },
  { id: "watcher", name: "Watcher", line: "Copies your gun. Badly. On purpose." },
  { id: "boss", name: "Boss", line: "Three moods. All of them aimed." },
  { id: "swirl", name: "Classic Swirl", line: "The house brown." },
  { id: "frozen", name: "Frozen Turd", line: "Cold, then three ice cubes." },
  { id: "pebble", name: "Pebble Poop", line: "Bounces once. That's the joke." },
  { id: "honeyblob", name: "Honey Blob", line: "Slow. Sticky. Has a bee." },
  { id: "slime", name: "Slime Log", line: "Becomes two. Never a good sign." },
  { id: "ghostpoop", name: "Ghost Poop", line: "See-through. Still counts." },
  { id: "chili", name: "Chili Bomb", line: "Fast and personally offended." },
  { id: "zap", name: "Zap Turd", line: "Cannot fly in a straight line." },
  { id: "gold", name: "Golden Nugget", line: "Graze it for cash. Don't kiss it." },
  { id: "fart", name: "Fart Cloud", line: "Does not hurt. Does shove." },
];

export type BossCmd =
  | { op: "shot"; a: number; speed: number; r: number; shape: number }
  | { op: "summon"; kind: VKind; x: number; role: string }
  | { op: "banner"; text: string }
  | { op: "clear" }
  | { op: "dive" };

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
      cmds.push({ op: "banner", text: "HE'S JUST A COMET NOW" });
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
    if (phase >= 2) cmds.push({ op: "banner", text: "SAND" });
    return cmds;
  }
  if (ch === 3) {
    cmds.push({ op: "shot", a: aim, speed: 90 + phase * 20, r: 6, shape: 7 });
    if (phase >= 1) ring(7, 0.25, 100, 7);
    return cmds;
  }
  if (ch === 4) {
    ring(6, 0.35, 80, 8);
    if (phase >= 1) cmds.push({ op: "banner", text: "INHALE" });
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
    if (phase >= 1) cmds.push({ op: "banner", text: "BEHIND YOU" });
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
    if (phase >= 2) cmds.push({ op: "banner", text: "GET IN THE BLUE" });
    return cmds;
  }
  if (phase === 0) {
    cmds.push({ op: "shot", a: aim, speed: 150, r: 5, shape: 0 });
    cmds.push({ op: "banner", text: "REGENT'S CHARGE" });
  } else if (phase === 1) {
    cmds.push({ op: "shot", a: aim, speed: 100, r: 6, shape: 9 });
    ring(8, 0.24, 120, 9);
  } else if (phase === 2) {
    ring(10, 0.22, 130, 10);
    cmds.push({ op: "shot", a: aim, speed: 160, r: 5, shape: 11 });
  } else {
    cmds.push({ op: "banner", text: "ECLIPSE" });
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
