/**
 * The Poop-Dex: an album of everything in the house. A critter gets its page the first time
 * one is shot down, a boss when it is beaten, a kind of poop when it is first thrown at you.
 * Finishing a room's pages pays cash; so does finishing the lot.
 */
import { ARMIES } from "./army";
import { BOSS_LINES } from "./v3";

export type DexEntry = {
  id: string;
  name: string;
  /** what it is, in two words */
  tag: string;
  line: string;
  /** picture under /art, without the extension */
  art: string;
};

export type DexPage = { title: string; entries: DexEntry[]; boss?: DexEntry };

/** What finishing one room's pages pays, and what finishing every room pays on top. */
export const DEX_ROOM_CASH = 200;
export const DEX_ALL_CASH = 1500;

const LINES: Record<string, string> = {
  toilet_seat_scout: "Always up. Never put down. Dies standing.",
  evil_paper_roll: "Ran out on purpose, at the worst possible moment.",
  drain_plug: "Pull it and everything goes downhill.",
  toilet_brush: "Has seen things. Will not talk about them.",
  double_paper_roll: "Two-ply. Twice the attitude.",
  toilet_bomber: "Carries the payload nobody ordered.",
  p_trap: "The bend under the sink. Holds water and a grudge.",
  plunger_interceptor: "Sticks to its target. Literally.",
  bidet_wedge: "Fancy, French and aimed upward.",
  bathtub_barge: "Slow, heavy and full of somebody's loot.",
  sealed_lid: "Hides behind a lid. Knock it off, or go through it.",
  drain_rotor: "Spins in its spot. Dizzy, still dangerous.",
  soap_fugitive: "Slipped out of a hand in 1998. Still running.",
  sponge_thug: "Absorbs insults. Returns them wet.",
  robe_hook: "Left hanging. Took it personally.",
  shower_head: "Rains on you. On purpose.",
  soap_dispenser: "One pump. Never enough.",
  shower_hose: "Flexible neck, flexible morals.",
  suction_mat: "Was meant to stop people slipping. Changed sides.",
  cracked_mirror: "Seven years of bad luck, in three smaller pieces.",
  dust_bunny: "Lives under things. Multiplies when ignored.",
  feather_duster_fly: "Tickles first. Regrets nothing.",
  clothes_peg_bug: "Pinches. That is the whole plan.",
  spray_bottle_gunner: "Set to mist. Aimed at eyes.",
  dustpan_glider: "Scoops in low. Never gets the last line of dust.",
  vacuum_hog: "Eats everything. Bag is full. Still eating.",
  bucket_hermit: "Only rude when it comes outside.",
  broom_wall: "Stands in the way. Sweeps nothing.",
  fuzzy_slipper: "The left one. The right one was never found.",
  night_light_moth: "Loves the light. Hates you for standing in it.",
  counting_sheep: "Number 4,812. Tired of being counted.",
  alarm_clock_bomber: "Goes off early. Every time.",
  pillow_glider: "The cool side is the dangerous side.",
  chamber_pot_galleon: "Antique. Full. Sailing straight at you.",
  moon_lamp_moth: "Cannot hold still. Circles its spot in the line.",
  snore_cloud: "Somebody's snoring, and it has children.",
  baked_bean: "One of fifty-seven. The angry one.",
  corn_kernel: "Comes out the way it went in.",
  prune_fly: "Works fast. You know what it does.",
  bean_can_cannon: "Musical. Then explosive.",
  hot_dog_dart: "Nobody knows what is in it. It dives anyway.",
  cabbage_blimp: "Full of gas. Mostly its own.",
  honey_jar_turret: "Makes its friends untouchable. Rude friends.",
  angry_onion: "Makes you cry, then splits into smaller reasons to.",
  sewer_rat: "Big city accent. No fear at all.",
  mosquito: "Small, loud and after your blood.",
  slime_tadpole: "Will be a slime frog one day. Not today.",
  pipe_toad: "Sits in a pipe. Spits out of it.",
  cockroach_glider: "Would survive the bomb. Does not survive you.",
  fatberg_tank: "Ten years of wet wipes with a mind of its own.",
  mold_mother: "Her kids are slow and numerous.",
  manhole_lurker: "You can only hit it while the lid is off.",
  safety_razor: "The name is a lie.",
  toothbrush_stinger: "Two minutes, twice a day, straight at you.",
  toothpaste_tube: "Squeezed from the middle. Furious about it.",
  hair_dryer: "Full of hot air and opinions.",
  foil_shaver: "Buzzes. Nicks. Never quite charged.",
  twin_brush: "His and hers. Both aimed at you.",
  sink_ram: "Everything but the kitchen. Just this.",
  towel_wraith: "You can only hit the part that showed up.",
  popcorn_kernel: "The one that never pops. Until now.",
  pepper_shaker_bug: "Makes you sneeze, then makes its move.",
  chili_fly: "Small, red and a mistake to touch.",
  kettle_copter: "Whistles when it is angry. It is always whistling.",
  frying_pan_glider: "Non-stick. Nothing personal sticks either.",
  pressure_cooker_tank: "One loose valve from a very bad day.",
  pot_lid_knight: "The lid is the personality.",
  salt_and_pepper_twins: "Seasoned. Electrified. Always two sparks at once.",
  urinal_cake: "Not a cake. Do not.",
  paper_towel_sheet: "One sheet. The dispenser gave you nothing else.",
  motion_sensor_eye: "Never sees you when you need it to.",
  jet_hand_dryer: "Loud, hot, and you are still wet.",
  wet_floor_sign_glider: "Warned you. Then tripped you.",
  urinal_battleship: "A row of them. Nobody takes the middle one.",
  security_camera: "Always watching. Always aiming. Quicker than the rest.",
  auto_flush_kamikaze: "Goes off while you are still there. Stand back.",
  crowned_golden_fly: "Royal. Still eats what flies eat.",
  porcelain_pawn: "First to go. Knows it. Goes anyway.",
  perfume_atomizer_bug: "Covers the smell. Is the smell.",
  royal_trumpet_toilet: "Announces every arrival. Loudly.",
  scepter_lancer: "By royal appointment, straight through you.",
  golden_bathtub_dreadnought: "Solid gold. Sinks anyway.",
  crystal_chandelier: "Drops its children on the guests.",
  velvet_curtain_ghost: "You can only hit it while the curtain is open.",
};

const title = (id: string) =>
  id
    .replace(/_(intact|damaged)$/, "")
    .split("_")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");

/** One page per room: its critters in the order the army lists them, and its boss. */
export const DEX_ROOMS: DexPage[] = ARMIES.map((a, ch) => {
  const seen = new Set<string>();
  const entries: DexEntry[] = [];
  const add = (id: string, tag: string) => {
    if (seen.has(id)) return;
    seen.add(id);
    entries.push({ id, name: title(id), tag, line: LINES[id] ?? "No comment. It bites.", art: `e/${id}` });
  };
  a.grunts.forEach((id) => add(id, "SMALL FRY"));
  a.shooters.forEach((id) => add(id, "SHOOTER"));
  a.divers.forEach((id) => add(id, "DIVER"));
  a.tanks.forEach((id) => add(id, "HEAVY"));
  Object.values(a.specials).forEach((id) => add(id, "HAS A TRICK"));
  return {
    title: a.room,
    entries,
    boss: { id: `boss${ch}`, name: a.bossName, tag: "BOSS", line: BOSS_LINES[ch]?.[1] ?? "Three moods. All of them aimed.", art: `b/${a.boss}` },
  };
});

/** The poop itself: the id is the name the game logs when that kind is first thrown. */
export const DEX_POOP: DexEntry[] = [
  { id: "swirl", name: "Classic Swirl", tag: "POOP", line: "The house brown. Comes in nine shapes.", art: "p/classic_swirl" },
  { id: "pellets", name: "Rabbit Pellets", tag: "POOP", line: "Small, round, and there are always more.", art: "p/rabbit_pellets" },
  { id: "frozen", name: "Frozen Turd", tag: "POOP", line: "Cold, then three ice cubes.", art: "p/frozen_turd" },
  { id: "pebble", name: "Pebble Poop", tag: "POOP", line: "Bounces once. That's the joke.", art: "p/pebble_poop" },
  { id: "comet", name: "Comet Log", tag: "POOP", line: "Left the atmosphere. Came back angry.", art: "p/comet_log" },
  { id: "honeyblob", name: "Honey Blob", tag: "POOP", line: "Slow. Sticky. Has a bee.", art: "p/honey_blob" },
  { id: "slime", name: "Slime Log", tag: "POOP", line: "Becomes two. Never a good sign.", art: "p/slime_log" },
  { id: "ghostpoop", name: "Ghost Poop", tag: "POOP", line: "See-through. Still counts.", art: "p/ghost_poop" },
  { id: "chili", name: "Chili Bomb", tag: "POOP", line: "Fast and personally offended.", art: "p/chili_bomb" },
  { id: "zap", name: "Zap Turd", tag: "POOP", line: "Cannot fly in a straight line.", art: "p/zap_turd" },
  { id: "unicorn", name: "Unicorn Swirl", tag: "POOP", line: "Pretty on the way down. Still what it is.", art: "p/unicorn_swirl" },
  { id: "gold", name: "Golden Nugget", tag: "POOP", line: "Graze it for cash. Don't kiss it.", art: "p/golden_nugget" },
  { id: "diamond", name: "Diamond Dump", tag: "POOP", line: "Graze it for 500 points. Somebody ate a ring.", art: "p/diamond_dump" },
  { id: "fart", name: "Fart Cloud", tag: "POOP", line: "Does not hurt. Does shove.", art: "p/fart_cloud" },
];

/** Which room's page a critter is on (the first room that lists it). */
const ROOM_OF = new Map<string, number>();
DEX_ROOMS.forEach((page, ch) => {
  for (const e of page.entries) if (!ROOM_OF.has(e.id)) ROOM_OF.set(e.id, ch);
});

export function dexRoomOf(id: string) {
  return ROOM_OF.get(id) ?? -1;
}

export function dexName(id: string) {
  return title(id);
}

type Book = { dex: Record<string, number>; tally: Record<string, number>; seen: string[] };

/** How many of something have been flushed (critters), beaten (bosses) or met (poop: 1 or 0). */
export function dexCount(book: Book, entry: DexEntry) {
  if (entry.tag === "BOSS") return book.tally[entry.id] ?? 0;
  if (entry.tag === "POOP") return book.seen.includes(entry.id) ? 1 : 0;
  return book.dex[entry.id] ?? 0;
}

/** A room's pages are finished when every critter on them has been shot down and the boss beaten. */
export function dexRoomDone(book: Book, ch: number) {
  const page = DEX_ROOMS[ch];
  if (!page) return false;
  return page.entries.every((e) => dexCount(book, e) > 0) && (!page.boss || dexCount(book, page.boss) > 0);
}

export function dexTotals(book: Book) {
  let have = 0;
  let all = 0;
  for (const page of DEX_ROOMS) {
    for (const e of page.boss ? [...page.entries, page.boss] : page.entries) {
      all++;
      if (dexCount(book, e) > 0) have++;
    }
  }
  for (const e of DEX_POOP) {
    all++;
    if (dexCount(book, e) > 0) have++;
  }
  return { have, all };
}
