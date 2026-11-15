// Who fights in which room. Each chapter has its own army; nothing here touches the DOM,
// so the headless test bots can use it too.

export type ArmyKind = "dart" | "drone" | "wedge" | "cruiser" | "boss";

export type Army = {
  /** The room this chapter is fought in. */
  room: string;
  /** Small fry that fly in lines: one look per line. */
  grunts: string[];
  /** The ones that throw poop. */
  shooters: string[];
  /** The ones that dive at the pilot. */
  divers: string[];
  /** Big, slow, full of loot. */
  tanks: string[];
  /** Critters with a trick: behaviour role -> sprite. */
  specials: Record<string, string>;
  boss: string;
  /** Battle-damaged boss art for the last phase, when the pack has one. */
  bossHurt?: string;
  bossName: string;
};

export const ARMIES: Army[] = [
  {
    room: "Old Bathroom",
    grunts: ["toilet_seat_scout", "evil_paper_roll", "drain_plug", "toilet_brush", "double_paper_roll"],
    shooters: ["toilet_bomber", "p_trap"],
    divers: ["plunger_interceptor", "bidet_wedge"],
    tanks: ["bathtub_barge"],
    specials: { wall: "sealed_lid", moth: "drain_rotor" },
    boss: "armored_cistern",
    bossName: "Armored Cistern",
  },
  {
    room: "Showers & Spa",
    grunts: ["soap_fugitive", "sponge_thug", "robe_hook"],
    shooters: ["shower_head", "soap_dispenser"],
    divers: ["shower_hose"],
    tanks: ["suction_mat"],
    specials: { gnat: "cracked_mirror" },
    boss: "twin_cistern",
    bossName: "Twin Cistern",
  },
  {
    room: "Cleaning Closet",
    grunts: ["dust_bunny", "feather_duster_fly", "clothes_peg_bug"],
    shooters: ["spray_bottle_gunner"],
    divers: ["dustpan_glider"],
    tanks: ["vacuum_hog"],
    specials: { hermit: "bucket_hermit", wall: "broom_wall" },
    boss: "robo_vacuum_overlord_intact",
    bossHurt: "robo_vacuum_overlord_damaged",
    bossName: "Robo-Vacuum Overlord",
  },
  {
    room: "Night Trip",
    grunts: ["fuzzy_slipper", "night_light_moth", "counting_sheep"],
    shooters: ["alarm_clock_bomber"],
    divers: ["pillow_glider"],
    tanks: ["chamber_pot_galleon"],
    specials: { moth: "moon_lamp_moth", mother: "snore_cloud" },
    boss: "under_the_bed_monster_intact",
    bossHurt: "under_the_bed_monster_damaged",
    bossName: "Under-the-Bed Monster",
  },
  {
    room: "The Pantry",
    grunts: ["baked_bean", "corn_kernel", "prune_fly"],
    shooters: ["bean_can_cannon"],
    divers: ["hot_dog_dart"],
    tanks: ["cabbage_blimp"],
    specials: { honey: "honey_jar_turret", gnat: "angry_onion" },
    boss: "fridge_titan_intact",
    bossHurt: "fridge_titan_damaged",
    bossName: "Fridge Titan",
  },
  {
    room: "The Sewer",
    grunts: ["sewer_rat", "mosquito", "slime_tadpole"],
    shooters: ["pipe_toad"],
    divers: ["cockroach_glider"],
    tanks: ["fatberg_tank"],
    specials: { mother: "mold_mother", ghost: "manhole_lurker" },
    boss: "drain_hydra",
    bossName: "Drain Hydra",
  },
  {
    room: "Bathroom Cabinet",
    grunts: ["safety_razor", "toothbrush_stinger", "toothpaste_tube"],
    shooters: ["hair_dryer", "foil_shaver"],
    divers: ["twin_brush"],
    tanks: ["sink_ram"],
    specials: { ghost: "towel_wraith" },
    boss: "medicine_cabinet_mimic_intact",
    bossHurt: "medicine_cabinet_mimic_damaged",
    bossName: "Medicine Cabinet Mimic",
  },
  {
    room: "Hot Kitchen",
    grunts: ["popcorn_kernel", "pepper_shaker_bug", "chili_fly"],
    shooters: ["kettle_copter"],
    divers: ["frying_pan_glider"],
    tanks: ["pressure_cooker_tank"],
    specials: { forge: "pot_lid_knight", spark: "salt_and_pepper_twins" },
    boss: "kitchen_squid_intact",
    bossHurt: "kitchen_squid_damaged",
    bossName: "Kitchen Squid",
  },
  {
    room: "Public Restroom",
    grunts: ["urinal_cake", "paper_towel_sheet", "motion_sensor_eye"],
    shooters: ["jet_hand_dryer"],
    divers: ["wet_floor_sign_glider"],
    tanks: ["urinal_battleship"],
    specials: { watcher: "security_camera", splash: "auto_flush_kamikaze" },
    boss: "janitor_mech_intact",
    bossHurt: "janitor_mech_damaged",
    bossName: "Janitor Mech",
  },
  {
    room: "Throne Room",
    grunts: ["crowned_golden_fly", "porcelain_pawn", "perfume_atomizer_bug"],
    shooters: ["royal_trumpet_toilet"],
    divers: ["scepter_lancer"],
    tanks: ["golden_bathtub_dreadnought"],
    specials: { mother: "crystal_chandelier", ghost: "velvet_curtain_ghost" },
    boss: "toilet_king_intact",
    bossHurt: "toilet_king_damaged",
    bossName: "The Toilet King",
  },
];

/** A boss can call in a trick critter its own room does not have: borrow the look from the room that does. */
const BORROWED: Record<string, string> = {
  wall: "broom_wall",
  moth: "moon_lamp_moth",
  gnat: "cracked_mirror",
  hermit: "bucket_hermit",
  mother: "mold_mother",
  honey: "honey_jar_turret",
  ghost: "towel_wraith",
  forge: "pot_lid_knight",
  spark: "salt_and_pepper_twins",
  watcher: "security_camera",
  splash: "auto_flush_kamikaze",
};

/** Every enemy sprite, in a fixed order: an enemy's `look` is an index into this list. */
export const LOOKS: string[] = (() => {
  const seen = new Set<string>();
  const out: string[] = [];
  const add = (id: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    out.push(id);
  };
  for (const a of ARMIES) {
    [...a.grunts, ...a.shooters, ...a.divers, ...a.tanks, ...Object.values(a.specials)].forEach(add);
  }
  Object.values(BORROWED).forEach(add);
  return out;
})();

const INDEX = new Map(LOOKS.map((id, i) => [id, i]));

function armyOf(ch: number) {
  return ARMIES[((ch % ARMIES.length) + ARMIES.length) % ARMIES.length];
}

/** The two trick roles a chapter's own waves use (first wave, second wave). */
export function armyRoles(ch: number): string[] {
  return Object.keys(armyOf(ch).specials);
}

export function armyHas(ch: number, role: string) {
  return role in armyOf(ch).specials;
}

/**
 * Picks the sprite for a new enemy. `line` is the formation row it flies in, so a whole
 * line shares one look; `n` only breaks ties for enemies that have no line.
 */
export function lookFor(ch: number, kind: ArmyKind, role: string, line: number, n: number): number {
  const a = armyOf(ch);
  const special = a.specials[role] ?? BORROWED[role];
  let id: string;
  if (special) id = special;
  else {
    const pool = kind === "cruiser" ? a.tanks : kind === "wedge" ? a.divers : kind === "drone" ? a.shooters : a.grunts;
    const pick = Number.isFinite(line) ? line : n;
    id = pool[((Math.floor(pick) % pool.length) + pool.length) % pool.length];
  }
  return INDEX.get(id) ?? 0;
}

export function lookId(look: number) {
  return LOOKS[((look % LOOKS.length) + LOOKS.length) % LOOKS.length];
}

/** "toilet_seat_scout" -> "Toilet Seat Scout" */
export function lookName(look: number) {
  return lookId(look)
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export function bossArt(ch: number, hurt: boolean) {
  const a = armyOf(ch);
  return hurt && a.bossHurt ? a.bossHurt : a.boss;
}
