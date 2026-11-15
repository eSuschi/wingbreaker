import { type GunFamily, familyFrom, familyName } from "./v3";

export const LEVELS = 100;
export const SAVE_V2 = "wingbreaker.save.v2";
export const SAVE_KEY = "wingbreaker.save.v3";
const LEGACY_BEST = "wingbreaker.best.v1";

export type SkinId =
  | "steel"
  | "bone"
  | "ember"
  | "navy"
  | "graphite"
  | "twin"
  | "crescent"
  | "olive"
  | "duck"
  | "toaster"
  | "cart"
  | "tub"
  | "toilet"
  | "throne";
export type UpgradeId = "hull" | "magazine" | "magnet" | "salvage" | "trigger" | "luck" | "salvo" | "insurance" | "pockets";

export type Upgrades = Record<UpgradeId, number>;

export type Campaign = {
  dollars: number;
  level: number;
  best: number;
  cleared: boolean;
  skin: SkinId;
  /** the wingman's ship, when two fly */
  skin2: SkinId;
  owned: SkinId[];
  upgrades: Upgrades;
  /** gun power bought in the shop: 0 to 5 steps on top of power 1, for whichever gun is flown */
  power: number;
  mute: boolean;
  shake: boolean;
  /** true: the next level starts by itself. Off by default: the player presses NEXT. */
  autoAdvance: boolean;
  /** 0 easy, 1 normal, 2 hard */
  difficulty: number;
  /** how many times the campaign has been finished and started over as New Game+ */
  loop: number;
  /** achievements earned so far */
  feats: string[];
  /** lifetime counters the achievements are measured against */
  tally: Record<string, number>;
  /** the Poop-Dex: how many of each critter have been shot down, by sprite name */
  dex: Record<string, number>;
  /** perks picked on this run, one entry per pick; emptied when all lives are lost */
  perks: string[];
  /** the three perks on offer after a mini-boss or a boss, until one is picked */
  perkOffer: string[] | null;
  autoFire: boolean | null;
  crew: "solo" | "coop";
  music: number;
  sfx: number;
  gun: GunFamily;
  /** the wingman's gun, when two fly: any gun that is owned */
  gun2: GunFamily;
  guns: GunFamily[];
  stars: number[];
  seen: string[];
  snacks: number;
  ranks: Rank[];
  dailyDay: string;
  dailyScore: number;
};

export type Rank = { name: string; score: number; stage: number; date: string; skin: string; daily?: boolean };

export type RunSnap = {
  level: number;
  lives: number;
  weapon: number;
  bombs: number;
  shield: boolean;
  score: number;
  feed: number;
  coop?: boolean;
  missiles?: number;
  family?: GunFamily;
  snacks?: number;
  /** the wingman's gun, when two pilots fly */
  weapon2?: number;
  family2?: GunFamily;
};

export type SaveFile = {
  v: 3;
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
  { name: "Old Bathroom", boss: "Armored Cistern", hull: "#3a2a24", edge: "#c4a090", accent: "#c44536", flame: "#e07a3d", sky: "#140c10" },
  { name: "Showers & Spa", boss: "Twin Cistern", hull: "#243038", edge: "#9eb0b8", accent: "#7eb6d6", flame: "#6a8ea3", sky: "#0c1418" },
  { name: "Cleaning Closet", boss: "Robo-Vacuum Overlord", hull: "#3a3428", edge: "#cbbfa6", accent: "#c4a574", flame: "#c4a36a", sky: "#16130e" },
  { name: "Night Trip", boss: "Under-the-Bed Monster", hull: "#1c2433", edge: "#8ea0b8", accent: "#8eb4d8", flame: "#4d6d88", sky: "#0a1020" },
  { name: "The Pantry", boss: "Fridge Titan", hull: "#3a3420", edge: "#d2c08a", accent: "#d2a84a", flame: "#c4923a", sky: "#141208" },
  { name: "The Sewer", boss: "Drain Hydra", hull: "#2a3328", edge: "#a8b4a4", accent: "#8aa384", flame: "#6e8a62", sky: "#0e140f" },
  { name: "Bathroom Cabinet", boss: "Medicine Cabinet Mimic", hull: "#d9d3c8", edge: "#6e675f", accent: "#c44536", flame: "#efeae2", sky: "#121418" },
  { name: "Hot Kitchen", boss: "Kitchen Squid", hull: "#3a2c24", edge: "#d09a72", accent: "#e07a3d", flame: "#a85a32", sky: "#140e0c" },
  { name: "Public Restroom", boss: "Janitor Mech", hull: "#2a3138", edge: "#b7c0c8", accent: "#9aa8b5", flame: "#6e7c88", sky: "#0c1016" },
  { name: "Throne Room", boss: "The Toilet King", hull: "#16181c", edge: "#8e99a3", accent: "#e07a3d", flame: "#c44536", sky: "#07080c" },
];

/**
 * A ship in the hangar. Every ship flies differently; the numbers are multipliers on the
 * standard ship unless they say otherwise.
 */
export type SkinDef = {
  id: SkinId;
  name: string;
  /** file under /art/s */
  art: string;
  /** 0 with no `stars`: free from the start. 0 with `stars`: a reward, not for sale. */
  price: number;
  stars?: number;
  /** what makes this ship different, in one line */
  trait: string;
  speed: number;
  /** hitbox size */
  hit: number;
  /** time between volleys: lower fires faster */
  rate: number;
  dmg: number;
  /** lives and bombs added to (or taken from) the kit */
  lives: number;
  bombs: number;
  /** starts every level with a shield */
  shield?: boolean;
  /** pulls gifts in from far away */
  magnet?: number;
  /** kills charge the next bomb faster */
  charge?: number;
  /** ammo crates hold more */
  ammo?: number;
  /** everything earned is worth more */
  cash?: number;
  /** flies with a Brush Buddy from the start */
  buddy?: boolean;
  /** fallback colours while the picture loads */
  hull: string;
  edge: string;
  canopy: string;
  hot: string;
};

const PLAIN = { speed: 1, hit: 1, rate: 1, dmg: 1, lives: 0, bombs: 0 };

export const SKINS: SkinDef[] = [
  { ...PLAIN, id: "steel", name: "Silver Needle", art: "ship_09_silver_needle", price: 0, trait: "The standard issue. No surprises, no excuses.", hull: "#c9d0d7", edge: "#66727c", canopy: "#8ec4dc", hot: "#e7edf2" },
  { ...PLAIN, id: "bone", name: "Ivory Petrol", art: "ship_14_ivory_petrol", price: 0, trait: "Starts every level with a shield. A touch slower.", speed: 0.94, shield: true, hull: "#e6e1d6", edge: "#2f5a63", canopy: "#c9a24a", hot: "#f4f1ea" },
  { ...PLAIN, id: "ember", name: "Burgundy Interceptor", art: "ship_13_burgundy_interceptor", price: 640, trait: "Fast, and hits 10% harder. One life less.", speed: 1.2, dmg: 1.1, lives: -1, hull: "#8a2f3d", edge: "#4a1820", canopy: "#f0c08a", hot: "#f4d2b0" },
  { ...PLAIN, id: "navy", name: "Indigo Trident", art: "ship_15_indigo_trident", price: 640, trait: "Three barrels: fires 15% faster.", speed: 0.96, rate: 0.85, hull: "#3d4274", edge: "#1e2140", canopy: "#d5e6f2", hot: "#e7f2f8" },
  { ...PLAIN, id: "graphite", name: "Titanium Delta", art: "ship_10_titanium_delta", price: 0, stars: 30, trait: "Hard to hit: its hitbox is a quarter smaller.", speed: 1.05, hit: 0.75, hull: "#9aa1a8", edge: "#2a2e33", canopy: "#e07a3d", hot: "#d5dbe2" },
  { ...PLAIN, id: "twin", name: "Twin Boom", art: "ship_11_silver_twin_boom", price: 1200, trait: "Built like a bridge: one extra life. A bit slow.", speed: 0.9, lives: 1, hull: "#aeb6be", edge: "#4a525a", canopy: "#c9a24a", hot: "#e7edf2" },
  { ...PLAIN, id: "crescent", name: "Ice Crescent", art: "ship_12_ice_crescent", price: 1500, trait: "Pulls gifts in from far away. One extra bomb.", bombs: 1, magnet: 4, hull: "#a9c4d8", edge: "#3a5468", canopy: "#c9a24a", hot: "#eaf4fb" },
  { ...PLAIN, id: "olive", name: "Olive Crescent", art: "ship_16_olive_crescent", price: 1500, trait: "Kills charge the next bomb half as fast again.", charge: 1.5, hull: "#8a8a5c", edge: "#3e3e28", canopy: "#c9a24a", hot: "#e6e1d6" },
  { ...PLAIN, id: "duck", name: "Rubber Duck", art: "rubber_duck", price: 1800, trait: "Quick on the water. Ammo crates hold one more.", speed: 1.1, ammo: 1, hull: "#f2d24a", edge: "#c49214", canopy: "#fff3a8", hot: "#fff7c8" },
  { ...PLAIN, id: "toaster", name: "Toaster", art: "toaster", price: 2400, trait: "Hot shots: 15% more damage. Handles like a toaster.", speed: 0.88, dmg: 1.15, hull: "#d9dde2", edge: "#5c656e", canopy: "#e07a3d", hot: "#f4e7c2" },
  { ...PLAIN, id: "cart", name: "Shopping Cart", art: "shopping_cart", price: 2800, trait: "Everything you earn is worth a quarter more.", cash: 1.25, hull: "#b9c0c6", edge: "#5c656e", canopy: "#c44536", hot: "#f4f1ea" },
  { ...PLAIN, id: "tub", name: "Bathtub", art: "bathtub", price: 3200, trait: "Two extra lives. Big, slow and proud of it.", speed: 0.82, hit: 1.15, lives: 2, hull: "#e7eef2", edge: "#7d8b96", canopy: "#9ed0ea", hot: "#f7fbff" },
  { ...PLAIN, id: "toilet", name: "Flying Toilet", art: "flying_toilet", price: 4500, trait: "Never flies alone: comes with its own Brush Buddy.", buddy: true, hull: "#f4f7f8", edge: "#8a9298", canopy: "#7eb6d6", hot: "#fff" },
  { ...PLAIN, id: "throne", name: "Golden Throne", art: "golden_throne", price: 0, stars: 250, trait: "Royal: quicker, fires faster, hits harder.", speed: 1.05, rate: 0.9, dmg: 1.1, hull: "#e2b84a", edge: "#8a6420", canopy: "#fff1b8", hot: "#ffe38a" },
];

/** What the two retired gun upgrades cost, for the refund. */
const OLD_GUN_UPGRADES = { wings: [420, 980], capacitor: 480 };

export const UPGRADE_LIST: { id: UpgradeId; name: string; blurb: string; max: number; prices: number[] }[] = [
  { id: "trigger", name: "Hair trigger", blurb: "Your gun cycles faster.", max: 2, prices: [220, 520] },
  { id: "luck", name: "Greasy palm", blurb: "Enemies drop more junk.", max: 2, prices: [180, 440] },
  { id: "magnet", name: "Magnet", blurb: "Gifts drift toward your ship.", max: 2, prices: [160, 400] },
  { id: "salvage", name: "Scrap", blurb: "+15% cash per rank.", max: 3, prices: [160, 380, 720] },
  { id: "magazine", name: "Locker", blurb: "+1 bomb at the start of a level.", max: 2, prices: [300, 680] },
  { id: "salvo", name: "Salvo", blurb: "Start each level with homing missiles.", max: 2, prices: [260, 640] },
  { id: "hull", name: "Hull", blurb: "+1 life at the start of a level.", max: 2, prices: [400, 920] },
  { id: "insurance", name: "Insurance", blurb: "The first hit each level costs no life.", max: 1, prices: [1200] },
  { id: "pockets", name: "Quick Charge", blurb: "Kills charge your next bomb faster.", max: 2, prices: [500, 1100] },
];

export const QUIPS = [
  "The Toilet Empire filed a complaint. It will not be read.",
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
  "Nobody told the sponge this was a boss fight.",
  "They brought snacks. You brought math.",
  "A high score is a personality. Unfortunately.",
  "The snail's shell is a problem for someone else now.",
  "You can dodge. They brought a lifestyle.",
  "The cow had a ring and no follow-up questions.",
  "That was not a strategy. That was a panic with good timing.",
  "They will not put this on the brochure.",
  "Somebody call a janitor. A big one.",
  "The sky is clean. Your conscience is your business.",
  "Every plunger out there just updated its will.",
  "You did it. The poop did not.",
  "Accounting confirms: that was a lot of explosions.",
  "A space goat watched the whole thing. Unimpressed.",
  "That formation had a five-year plan. It lasted forty seconds.",
  "The briefcase jellies are calling an emergency meeting.",
  "You've been rated five stars by absolutely no one.",
  "Clean shooting. Questionable flying. We'll take it.",
  "The galaxy thanks you. Quietly. Through clenched teeth.",
  "Somewhere, a toilet seat glints with pride.",
  "Your guns are warm. Your snacks are warmer.",
  "The plumbers' union has filed a formal complaint.",
  "That was almost elegant. Almost.",
  "Nobody told the cows the war was on.",
  "You've cleared the sector. The smell remains.",
  "Excellent. Now do it again, but sideways.",
  "The insurance company has stopped answering.",
  "Somewhere a moon crab is rethinking its life.",
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
  "Ring Snail",
  "Comet Pup",
  "Prism Shrimp",
  "Helmet Mole",
  "Aurora Penguin",
  "Void Hippo",
  "Flare Seahorse",
  "Twin Lizard",
  "Spore Squid",
  "Gear Moth",
  "Crater Toad",
  "Dish Eel",
  "Nova Beetle",
  "Comet Chick",
  "Orbit Otter",
  "Magnet Ray",
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
    skin2: "bone",
    owned: ["steel"],
    upgrades: { hull: 0, magazine: 0, magnet: 0, salvage: 0, trigger: 0, luck: 0, salvo: 0, insurance: 0, pockets: 0 },
    power: 0,
    mute: false,
    shake: true,
    autoAdvance: false,
    difficulty: 1,
    loop: 0,
    feats: [],
    tally: {},
    dex: {},
    perks: [],
    perkOffer: null,
    autoFire: null,
    crew: "solo",
    music: 55,
    sfx: 80,
    gun: "bubble",
    gun2: "bubble",
    guns: ["bubble"],
    stars: Array(LEVELS + 1).fill(0),
    seen: [],
    snacks: 0,
    ranks: [],
    dailyDay: "",
    dailyScore: 0,
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
  // the two free ships are everybody's
  if (!owned.includes("bone")) owned.unshift("bone");
  if (!owned.includes("steel")) owned.unshift("steel");
  const skin = owned.includes(raw.skin as SkinId) ? (raw.skin as SkinId) : "steel";
  const skin2 = owned.includes(raw.skin2 as SkinId) ? (raw.skin2 as SkinId) : skin === "bone" ? "steel" : "bone";
  const up = raw.upgrades ?? base.upgrades;
  // Wingtips and the Capacitor are gone: gun power is one ladder in the shop now.
  // Whoever bought them gets every dollar back, once, the first time the save is read.
  const old = up as Record<string, unknown>;
  const refund = OLD_GUN_UPGRADES.wings.slice(0, clampInt(old.wings, 0, 2, 0)).reduce((a, b) => a + b, 0) + (clampInt(old.capacitor, 0, 1, 0) > 0 ? OLD_GUN_UPGRADES.capacitor : 0);
  const guns: GunFamily[] = [];
  for (const g of Array.isArray(raw.guns) ? raw.guns : []) {
    const f = familyFrom(g);
    if (f && !guns.includes(f)) guns.push(f);
  }
  if (!guns.includes("bubble")) guns.unshift("bubble");
  const gun = familyFrom(raw.gun);
  const gun2 = familyFrom(raw.gun2);
  return {
    dollars: clampInt(clampInt(raw.dollars, 0, 9_999_999, 0) + refund, 0, 9_999_999, 0),
    level: clampInt(raw.level, 1, LEVELS, 1),
    best: Math.max(clampInt(raw.best, 0, 99_999_999, 0), legacyBest),
    cleared: Boolean(raw.cleared),
    skin,
    skin2,
    owned,
    upgrades: {
      hull: clampInt(up.hull, 0, 2, 0),
      magazine: clampInt(up.magazine, 0, 2, 0),
      magnet: clampInt(up.magnet, 0, 2, 0),
      salvage: clampInt(up.salvage, 0, 3, 0),
      trigger: clampInt(up.trigger, 0, 2, 0),
      luck: clampInt(up.luck, 0, 2, 0),
      salvo: clampInt(up.salvo, 0, 2, 0),
      insurance: clampInt(up.insurance, 0, 1, 0),
      pockets: clampInt(up.pockets, 0, 2, 0),
    },
    power: clampInt(raw.power, 0, POWER_PRICES.length, 0),
    mute: Boolean(raw.mute),
    shake: raw.shake !== false,
    autoAdvance: raw.autoAdvance === true,
    difficulty: clampInt(raw.difficulty, 0, 2, 1),
    loop: clampInt(raw.loop, 0, 99, 0),
    feats: Array.isArray(raw.feats) ? raw.feats.filter((f): f is string => typeof f === "string").slice(0, 100) : [],
    tally: (() => {
      const out: Record<string, number> = {};
      if (raw.tally && typeof raw.tally === "object") {
        for (const [k, v] of Object.entries(raw.tally)) if (typeof v === "number" && Number.isFinite(v)) out[k.slice(0, 24)] = Math.max(0, Math.floor(v));
      }
      return out;
    })(),
    dex: (() => {
      const out: Record<string, number> = {};
      if (raw.dex && typeof raw.dex === "object") {
        for (const [k, v] of Object.entries(raw.dex).slice(0, 200)) if (typeof v === "number" && Number.isFinite(v) && /^[a-z_]{2,40}$/.test(k)) out[k] = Math.max(0, Math.min(9_999_999, Math.floor(v)));
      }
      return out;
    })(),
    perks: Array.isArray(raw.perks) ? raw.perks.filter((x): x is string => typeof x === "string" && /^[a-z_]{2,24}$/.test(x)).slice(0, 40) : [],
    perkOffer: Array.isArray(raw.perkOffer) && raw.perkOffer.length > 0 ? raw.perkOffer.filter((x): x is string => typeof x === "string" && /^[a-z_]{2,24}$/.test(x)).slice(0, 3) : null,
    autoFire: typeof raw.autoFire === "boolean" ? raw.autoFire : null,
    crew: raw.crew === "coop" ? "coop" : "solo",
    music: clampInt(raw.music, 0, 100, 55),
    sfx: clampInt(raw.sfx, 0, 100, 80),
    gun: gun && guns.includes(gun) ? gun : "bubble",
    gun2: gun2 && guns.includes(gun2) ? gun2 : gun && guns.includes(gun) ? gun : "bubble",
    guns,
    stars: sanitizeStars(raw.stars),
    seen: Array.isArray(raw.seen) ? raw.seen.filter((s) => typeof s === "string").slice(0, 80) : [],
    snacks: clampInt(raw.snacks, 0, 100000, 0),
    ranks: Array.isArray(raw.ranks) ? raw.ranks.slice(0, 10).filter((r) => r && typeof r.score === "number") : [],
    dailyDay: typeof raw.dailyDay === "string" ? raw.dailyDay : "",
    dailyScore: clampInt(raw.dailyScore, 0, 99_999_999, 0),
  };
}

function sanitizeStars(raw: unknown) {
  const out = Array(LEVELS + 1).fill(0);
  if (!Array.isArray(raw)) return out;
  for (let i = 0; i < out.length; i++) out[i] = clampInt(raw[i], 0, 3, 0);
  return out;
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
    missiles: clampInt(raw.missiles, 0, 9, 0),
    family: familyFrom(raw.family) ?? "bubble",
    snacks: clampInt(raw.snacks, 0, 100000, 0),
    weapon2: raw.weapon2 == null ? undefined : clampInt(raw.weapon2, 1, 6, 1),
    family2: familyFrom(raw.family2),
  };
}

export function loadFile(): SaveFile {
  const empty = (): SaveFile => ({ v: 3, campaign: freshCampaign(), run: null });
  try {
    if (typeof localStorage === "undefined") return empty();
    const legacy = Number(localStorage.getItem(LEGACY_BEST) || 0) || 0;
    const current = localStorage.getItem(SAVE_KEY);
    const backup = localStorage.getItem(SAVE_V2);
    const raw = current || backup;
    if (!raw) {
      const campaign = freshCampaign();
      campaign.best = legacy;
      return { v: 3, campaign, run: null };
    }
    const parsed = JSON.parse(raw) as Partial<SaveFile>;
    const file: SaveFile = {
      v: 3,
      campaign: sanitize(parsed.campaign, legacy),
      run: sanitizeRun(parsed.run),
    };
    if (!current && backup) writeFile(file.campaign, file.run);
    return file;
  } catch {
    return empty();
  }
}

export function writeFile(campaign: Campaign, run: RunSnap | null) {
  try {
    if (typeof localStorage === "undefined") return;
    const file: SaveFile = { v: 3, campaign, run };
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

export function buySkin(c: Campaign, id: SkinId, seat: 0 | 1 = 0): "ok" | "owned" | "poor" {
  if (c.owned.includes(id)) return "owned";
  const def = skinDef(id);
  if (def.price <= 0) return "poor";
  if (c.dollars < def.price) return "poor";
  c.dollars -= def.price;
  c.owned.push(id);
  equipSkin(c, id, seat);
  return "ok";
}

/** Puts a pilot in a ship. Both pilots can fly the same model if they like. */
export function equipSkin(c: Campaign, id: SkinId, seat: 0 | 1 = 0) {
  if (!c.owned.includes(id)) return false;
  if (seat === 1) c.skin2 = id;
  else c.skin = id;
  return true;
}

export function luckMul(rank: number) {
  return 1 + rank * 0.4;
}

export function loadoutOf(c: Campaign) {
  const ship = skinDef(c.skin);
  return {
    // easy mode flies with one life more
    lives: Math.max(1, 3 + c.upgrades.hull + ship.lives + (c.difficulty === 0 ? 1 : 0)),
    bombs: 2 + c.upgrades.magazine + ship.bombs,
    weapon: Math.max(1, Math.min(6, 1 + (c.power || 0))),
    missiles: Math.min(6, (c.upgrades.salvo || 0) * 2),
    family: c.gun,
    family2: c.gun2 ?? c.gun,
  };
}

export function starTotal(c: Campaign) {
  return c.stars.reduce((a, b) => a + b, 0);
}

export function grantStars(c: Campaign) {
  const n = starTotal(c);
  for (const ship of SKINS) {
    if (!ship.stars || c.owned.includes(ship.id)) continue;
    if (n >= ship.stars || (ship.id === "throne" && c.cleared)) c.owned.push(ship.id);
  }
}

/** What it costs to own a gun other than the Bubble Blaster. Bought once, flown by either pilot. */
export const GUN_PRICE = 600;

/**
 * Gun power, step by step: what it costs to go from power 1 to 2, 2 to 3 and so on.
 * Priced against what the campaign pays out, so a pilot who puts about half the cash into
 * power flies power 2 from level 4, 3 from 12, 4 from 25, 5 from the mid-forties and 6 from
 * the high sixties; one who buys nothing else is a dozen levels ahead of that.
 */
export const POWER_PRICES = [300, 700, 1400, 2600, 4500];

export function buyPower(c: Campaign): "ok" | "max" | "poor" {
  const have = c.power || 0;
  if (have >= POWER_PRICES.length) return "max";
  const price = POWER_PRICES[have];
  if (c.dollars < price) return "poor";
  c.dollars -= price;
  c.power = have + 1;
  return "ok";
}

/** Buys the gun if it is not owned yet, and puts it on that pilot's ship. */
export function buyGun(c: Campaign, family: GunFamily, seat: 0 | 1 = 0): "ok" | "poor" {
  if (family !== "bubble" && !c.guns.includes(family)) {
    if (c.dollars < GUN_PRICE) return "poor";
    c.dollars -= GUN_PRICE;
    c.guns.push(family);
  }
  if (seat === 1) c.gun2 = family;
  else c.gun = family;
  return "ok";
}

export function equipGun(c: Campaign, family: GunFamily, seat: 0 | 1 = 0) {
  if (family !== "bubble" && !c.guns.includes(family)) return false;
  if (seat === 1) c.gun2 = family;
  else c.gun = family;
  return true;
}

export function gunName(level: number, family: GunFamily = "bubble") {
  return familyName(family, Math.max(1, Math.min(6, Math.round(level) || 1)), false);
}

export const DIFFICULTY = [
  { name: "EASY", blurb: "Less poop, slower poop, one more life. Pays 20% less." },
  { name: "NORMAL", blurb: "The game as it was meant." },
  { name: "HARD", blurb: "More poop, faster, tougher critters, shorter warnings. Pays 25% more." },
];

/** An achievement: what it is called, what earns it and what it pays. */
export type Feat = { id: string; name: string; blurb: string; cash: number; done: (c: Campaign) => boolean };

const count = (c: Campaign, key: string) => c.tally[key] ?? 0;

export const FEATS: Feat[] = [
  { id: "first_flush", name: "First Flush", blurb: "Beat the Armored Cistern.", cash: 150, done: (c) => count(c, "boss0") > 0 },
  { id: "plumber", name: "Apprentice Plumber", blurb: "Shoot down 500 of them.", cash: 200, done: (c) => count(c, "kills") >= 500 },
  { id: "exterminator", name: "Master Plumber", blurb: "Shoot down 5,000 of them.", cash: 800, done: (c) => count(c, "kills") >= 5000 },
  { id: "clean_hands", name: "Clean Hands", blurb: "Finish 10 levels without being hit.", cash: 300, done: (c) => count(c, "perfect") >= 10 },
  { id: "spotless", name: "Spotless", blurb: "Finish 50 levels without being hit.", cash: 1000, done: (c) => count(c, "perfect") >= 50 },
  { id: "dry_run", name: "Dry Run", blurb: "Beat a boss without using a bomb.", cash: 250, done: (c) => count(c, "bossNoBomb") > 0 },
  { id: "arsenal", name: "Full Cabinet", blurb: "Fly with six different guns at least once.", cash: 300, done: (c) => Object.keys(c.tally).filter((k) => k.startsWith("gun_") && count(c, k) > 0).length >= 6 },
  { id: "quack", name: "Quack", blurb: "Catch 10 rubber ducks.", cash: 200, done: (c) => count(c, "ducks") >= 10 },
  { id: "wingman", name: "Never Leave a Wingman", blurb: "Pick your partner back up 5 times.", cash: 300, done: (c) => count(c, "revives") >= 5 },
  { id: "fleet", name: "Fleet Admiral", blurb: "Own six ships.", cash: 500, done: (c) => c.owned.length >= 6 },
  { id: "halfway", name: "Halfway Down the Pipe", blurb: "Beat the Fridge Titan.", cash: 500, done: (c) => count(c, "boss4") > 0 },
  { id: "arcade10", name: "Ten in a Row", blurb: "Reach stage 10 in Arcade.", cash: 300, done: (c) => count(c, "arcade") >= 10 },
  { id: "arcade30", name: "Full Lap", blurb: "Reach stage 30 in Arcade.", cash: 1000, done: (c) => count(c, "arcade") >= 30 },
  { id: "royal_flush", name: "Royal Flush", blurb: "Beat the Toilet King.", cash: 1500, done: (c) => count(c, "boss9") > 0 },
  { id: "umbrella", name: "Umbrella Not Included", blurb: "Get through a poop storm without being hit.", cash: 250, done: (c) => count(c, "stormClean") > 0 },
  { id: "big_game", name: "Big Game Hunter", blurb: "Beat 10 mini-bosses.", cash: 400, done: (c) => count(c, "minis") >= 10 },
  { id: "threader", name: "Thread the Needle", blurb: "Fly through 25 pipe gaps without a scratch.", cash: 300, done: (c) => count(c, "threads") >= 25 },
  { id: "double_flush", name: "Double Flush", blurb: "Fire the Super Flush with a partner 3 times.", cash: 300, done: (c) => count(c, "supers") >= 3 },
  { id: "duelist", name: "Loser Cleans the Bathroom", blurb: "Finish a duel.", cash: 200, done: (c) => count(c, "duels") > 0 },
  { id: "again", name: "Again, But Worse", blurb: "Beat the Toilet King in New Game+.", cash: 3000, done: (c) => count(c, "loopKing") > 0 },
];

/** Hands out every achievement that has just been earned and returns them. */
export function claimFeats(c: Campaign): Feat[] {
  const fresh: Feat[] = [];
  for (const f of FEATS) {
    if (c.feats.includes(f.id) || !f.done(c)) continue;
    c.feats.push(f.id);
    c.dollars += f.cash;
    fresh.push(f);
  }
  return fresh;
}
