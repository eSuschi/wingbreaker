export const LEVELS = 100;
export const SAVE_KEY = "wingbreaker.save.v2";
const LEGACY_BEST = "wingbreaker.best.v1";

export type SkinId = "steel" | "ember" | "navy" | "graphite" | "bone";
export type UpgradeId = "hull" | "magazine" | "capacitor" | "magnet" | "salvage" | "trigger" | "wings" | "luck";

export type Upgrades = Record<UpgradeId, number>;

export type Campaign = {
  dollars: number;
  level: number;
  best: number;
  cleared: boolean;
  skin: SkinId;
  owned: SkinId[];
  upgrades: Upgrades;
  mute: boolean;
  shake: boolean;
};

export type RunSnap = {
  level: number;
  lives: number;
  weapon: number;
  bombs: number;
  shield: boolean;
  score: number;
  feed: number;
  coop?: boolean;
};

export type SaveFile = {
  v: 2;
  campaign: Campaign;
  run: RunSnap | null;
};

export type Chapter = {
  name: string;
  boss: string;
  hull: string;
  edge: string;
  accent: string;
  flame: string;
  sky: string;
};

export const CHAPTERS: Chapter[] = [
  { name: "Rust Nebula", boss: "Comet Regent", hull: "#3a2a24", edge: "#c4a090", accent: "#c44536", flame: "#e07a3d", sky: "#140c10" },
  { name: "Glass Drift", boss: "Ion Admiral", hull: "#243038", edge: "#9eb0b8", accent: "#7eb6d6", flame: "#6a8ea3", sky: "#0c1418" },
  { name: "Dust Ring", boss: "Dune Maw", hull: "#3a3428", edge: "#cbbfa6", accent: "#c4a574", flame: "#c4a36a", sky: "#16130e" },
  { name: "Blue Dwarf", boss: "Moon Eye", hull: "#1c2433", edge: "#8ea0b8", accent: "#8eb4d8", flame: "#4d6d88", sky: "#0a1020" },
  { name: "Amber Belt", boss: "Ochre Whale", hull: "#3a3420", edge: "#d2c08a", accent: "#d2a84a", flame: "#c4923a", sky: "#141208" },
  { name: "Spore Halo", boss: "Nimbus Queen", hull: "#2a3328", edge: "#a8b4a4", accent: "#8aa384", flame: "#6e8a62", sky: "#0e140f" },
  { name: "Pale Rift", boss: "Bone Comet", hull: "#d9d3c8", edge: "#6e675f", accent: "#c44536", flame: "#efeae2", sky: "#121418" },
  { name: "Copper Sun", boss: "Forge Squid", hull: "#3a2c24", edge: "#d09a72", accent: "#e07a3d", flame: "#a85a32", sky: "#140e0c" },
  { name: "Storm Belt", boss: "Thunder Jelly", hull: "#2a3138", edge: "#b7c0c8", accent: "#9aa8b5", flame: "#6e7c88", sky: "#0c1016" },
  { name: "Black Watch", boss: "Eclipse Idol", hull: "#16181c", edge: "#8e99a3", accent: "#e07a3d", flame: "#c44536", sky: "#07080c" },
];

export type SkinDef = {
  id: SkinId;
  name: string;
  price: number;
  hull: string;
  edge: string;
  canopy: string;
  hot: string;
};

export const SKINS: SkinDef[] = [
  { id: "steel", name: "Steel", price: 0, hull: "#c9d0d7", edge: "#66727c", canopy: "#8ec4dc", hot: "#e7edf2" },
  { id: "ember", name: "Ember", price: 640, hull: "#c46a3a", edge: "#7a3b22", canopy: "#f0c08a", hot: "#f4d2b0" },
  { id: "navy", name: "Navy", price: 640, hull: "#8fb4cc", edge: "#1e3a52", canopy: "#d5e6f2", hot: "#e7f2f8" },
  { id: "graphite", name: "Graphite", price: 480, hull: "#9aa1a8", edge: "#2a2e33", canopy: "#e07a3d", hot: "#d5dbe2" },
  { id: "bone", name: "Bone", price: 980, hull: "#e6e1d6", edge: "#8a8175", canopy: "#c44536", hot: "#f4f1ea" },
];

export const UPGRADE_LIST: { id: UpgradeId; name: string; blurb: string; max: number; prices: number[] }[] = [
  { id: "wings", name: "Wingtips", blurb: "Hangar gun starts one rank higher.", max: 2, prices: [420, 980] },
  { id: "capacitor", name: "Capacitor", blurb: "Start each level at gun 2, on top of wingtips.", max: 1, prices: [480] },
  { id: "trigger", name: "Hair trigger", blurb: "Your gun cycles faster.", max: 2, prices: [220, 520] },
  { id: "luck", name: "Greasy palm", blurb: "Enemies drop more junk.", max: 2, prices: [180, 440] },
  { id: "magnet", name: "Magnet", blurb: "Gifts drift toward your ship.", max: 2, prices: [160, 400] },
  { id: "salvage", name: "Scrap", blurb: "+15% cash per rank.", max: 3, prices: [160, 380, 720] },
  { id: "magazine", name: "Locker", blurb: "+1 bomb at the start of a level.", max: 2, prices: [300, 680] },
  { id: "hull", name: "Hull", blurb: "+1 life at the start of a level.", max: 2, prices: [400, 920] },
];

export const QUIPS = [
  "The moon pug filed a complaint. It will not be read.",
  "You caught the gift. The gift is now emotionally attached.",
  "That jellyfish had a briefcase and a pension.",
  "Clean sky. The barnacles will mention you in the minutes.",
  "A black hole lost a sock and you made it worse.",
  "The comet whale is disappointed, which is the real damage.",
  "They shot first. It was still rude.",
  "Accounting has entered the airspace.",
  "Two ships, one bad decision. Classic.",
  "The oyster knew what it did.",
  "You lived. The goldfish will write a report.",
  "Afterburner is just panic with a budget.",
  "Nobody told the pigeon this was a boss fight.",
  "They brought snacks. You brought math.",
  "A high score is a personality. Unfortunately.",
  "The snail's shell is a problem for someone else now.",
  "You can dodge. They brought a lifestyle.",
  "The cow had a ring and no follow-up questions.",
  "That was not a strategy. That was a panic with good timing.",
  "They will not put this on the brochure.",
];

export const FAUNA = [
  "Briefcase Jelly",
  "Moon Pug",
  "Lantern Squid",
  "Comet Moth",
  "Planet Oyster",
  "Vacuum Eel",
  "Moon Crab",
  "Nebula Toad",
  "Asteroid Potato",
  "Plasma Goldfish",
  "Ring Worm",
  "Ion Jelly",
  "Meteor Mole",
  "Pulsar Owl",
  "Dust Bunny",
  "Gravity Snail",
  "Star Barnacle",
  "Eclipse Bat",
  "Quasar Shrimp",
  "Frost Mite",
  "Flare Parrot",
  "Galaxy Angler",
  "Magma Tick",
  "Aurora Manta",
  "Binary Moons",
  "Dish Hermit",
  "Warp Pigeon",
  "Gem Urchin",
  "Storm Mustache",
  "Pocket Hole",
  "Star Puffer",
  "Beacon Beetle",
  "Star Cow",
  "Clock Slug",
  "Buoy Leech",
  "Probe Egg",
];

export function quipFor(level: number) {
  return QUIPS[Math.abs(level * 7 + 3) % QUIPS.length];
}

export function freshCampaign(): Campaign {
  return {
    dollars: 0,
    level: 1,
    best: 0,
    cleared: false,
    skin: "steel",
    owned: ["steel"],
    upgrades: { hull: 0, magazine: 0, capacitor: 0, magnet: 0, salvage: 0, trigger: 0, wings: 0, luck: 0 },
    mute: false,
    shake: true,
  };
}

export function chapterIndex(level: number) {
  return Math.min(CHAPTERS.length - 1, Math.max(0, Math.floor((level - 1) / 10)));
}

export function chapterOf(level: number) {
  return CHAPTERS[chapterIndex(level)];
}

export function isBossLevel(level: number) {
  return level > 0 && level % 10 === 0;
}

export function bulletScale(level: number) {
  return Math.min(2.1, 1 + Math.max(0, level - 1) * 0.0111);
}

export function cadenceScale(level: number) {
  return Math.max(0.55, 1 - Math.max(0, level - 1) * 0.00455);
}

export function bossHp(level: number) {
  const ch = level / 10;
  return Math.round(420 + level * 18 + ch * ch * 28);
}

export function salvageMul(rank: number) {
  return 1 + rank * 0.15;
}

export function skinDef(id: SkinId) {
  return SKINS.find((s) => s.id === id) ?? SKINS[0];
}

function clampInt(n: unknown, a: number, b: number, d: number) {
  const v = Number(n);
  if (!Number.isFinite(v)) return d;
  return Math.max(a, Math.min(b, Math.round(v)));
}

function sanitize(raw: Partial<Campaign> | null | undefined, legacyBest: number): Campaign {
  const base = freshCampaign();
  if (!raw || typeof raw !== "object") {
    base.best = legacyBest;
    return base;
  }
  const owned = Array.isArray(raw.owned)
    ? raw.owned.filter((id): id is SkinId => SKINS.some((s) => s.id === id))
    : [];
  if (!owned.includes("steel")) owned.unshift("steel");
  const skin = owned.includes(raw.skin as SkinId) ? (raw.skin as SkinId) : "steel";
  const up = raw.upgrades ?? base.upgrades;
  return {
    dollars: clampInt(raw.dollars, 0, 9_999_999, 0),
    level: clampInt(raw.level, 1, LEVELS, 1),
    best: Math.max(clampInt(raw.best, 0, 99_999_999, 0), legacyBest),
    cleared: Boolean(raw.cleared),
    skin,
    owned,
    upgrades: {
      hull: clampInt(up.hull, 0, 2, 0),
      magazine: clampInt(up.magazine, 0, 2, 0),
      capacitor: clampInt(up.capacitor, 0, 1, 0),
      magnet: clampInt(up.magnet, 0, 2, 0),
      salvage: clampInt(up.salvage, 0, 3, 0),
      trigger: clampInt(up.trigger, 0, 2, 0),
      wings: clampInt(up.wings, 0, 2, 0),
      luck: clampInt(up.luck, 0, 2, 0),
    },
    mute: Boolean(raw.mute),
    shake: raw.shake !== false,
  };
}

function sanitizeRun(raw: RunSnap | null | undefined): RunSnap | null {
  if (!raw || typeof raw !== "object") return null;
  return {
    level: clampInt(raw.level, 1, LEVELS, 1),
    lives: clampInt(raw.lives, 1, 8, 3),
    weapon: clampInt(raw.weapon, 1, 6, 1),
    bombs: clampInt(raw.bombs, 0, 5, 2),
    shield: Boolean(raw.shield),
    score: clampInt(raw.score, 0, 99_999_999, 0),
    feed: Math.max(0, Math.min(12, Number(raw.feed) || 0)),
    coop: Boolean(raw.coop),
  };
}

export function loadFile(): SaveFile {
  const empty = (): SaveFile => ({ v: 2, campaign: freshCampaign(), run: null });
  try {
    if (typeof localStorage === "undefined") return empty();
    const legacy = Number(localStorage.getItem(LEGACY_BEST) || 0) || 0;
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      const campaign = freshCampaign();
      campaign.best = legacy;
      return { v: 2, campaign, run: null };
    }
    const parsed = JSON.parse(raw) as Partial<SaveFile>;
    return {
      v: 2,
      campaign: sanitize(parsed.campaign, legacy),
      run: sanitizeRun(parsed.run),
    };
  } catch {
    return empty();
  }
}

export function writeFile(campaign: Campaign, run: RunSnap | null) {
  try {
    if (typeof localStorage === "undefined") return;
    const file: SaveFile = { v: 2, campaign, run };
    localStorage.setItem(SAVE_KEY, JSON.stringify(file));
    localStorage.setItem(LEGACY_BEST, String(campaign.best));
  } catch {
    /* private mode */
  }
}

export function buyUpgrade(c: Campaign, id: UpgradeId): "ok" | "max" | "poor" {
  const def = UPGRADE_LIST.find((u) => u.id === id);
  if (!def) return "max";
  const rank = c.upgrades[id];
  if (rank >= def.max) return "max";
  const price = def.prices[rank] ?? def.prices[def.prices.length - 1];
  if (c.dollars < price) return "poor";
  c.dollars -= price;
  c.upgrades[id] = rank + 1;
  return "ok";
}

export function buySkin(c: Campaign, id: SkinId): "ok" | "owned" | "poor" {
  if (c.owned.includes(id)) return "owned";
  const def = skinDef(id);
  if (c.dollars < def.price) return "poor";
  c.dollars -= def.price;
  c.owned.push(id);
  c.skin = id;
  return "ok";
}

export function equipSkin(c: Campaign, id: SkinId) {
  if (!c.owned.includes(id)) return false;
  c.skin = id;
  return true;
}

export function luckMul(rank: number) {
  return 1 + rank * 0.4;
}

export function loadoutOf(c: Campaign) {
  const wings = Math.min(2, c.upgrades.wings);
  const cap = c.upgrades.capacitor > 0 ? 1 : 0;
  return {
    lives: 3 + c.upgrades.hull,
    bombs: 2 + c.upgrades.magazine,
    weapon: Math.min(5, 1 + cap + wings),
  };
}
