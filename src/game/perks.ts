/**
 * Perks: after every mini-boss and every boss of the campaign the pilot picks one of three.
 * They last until all lives are lost, then the run starts clean again.
 * Some stack; cursed ones give more and take something; a few only make sense with two pilots.
 */
export type PerkKind = "good" | "cursed" | "duo";

export type Perk = {
  id: string;
  name: string;
  blurb: string;
  kind: PerkKind;
  /** how many times it can be taken */
  max: number;
  /** picture under /art/k, without the extension */
  art: string;
};

export const PERKS: Perk[] = [
  { id: "hot_sauce", name: "Hot Sauce", blurb: "Your gun hits 8% harder.", kind: "good", max: 3, art: "pizza" },
  { id: "espresso", name: "Double Espresso", blurb: "Your gun fires 6% faster.", kind: "good", max: 3, art: "coffee" },
  { id: "deep_pockets", name: "Deep Pockets", blurb: "Everything you shoot and catch pays 20% more.", kind: "good", max: 3, art: "gold_coin" },
  { id: "long_ribbon", name: "Long Ribbon", blurb: "A gift box boosts your gun 10 seconds longer.", kind: "good", max: 2, art: "gift_orange" },
  { id: "sticky_fingers", name: "Sticky Fingers", blurb: "Gifts fly to you from much further away.", kind: "good", max: 2, art: "magnet" },
  { id: "spare_roll", name: "Spare Roll", blurb: "You start every level inside a shield bubble.", kind: "good", max: 1, art: "shield_bubble" },
  { id: "bomb_bag", name: "Bomb Bag", blurb: "One more bomb at the start of every level.", kind: "good", max: 2, art: "air_freshener" },
  { id: "second_wind", name: "Second Wind", blurb: "Once a level, the hit that would take your last life does not.", kind: "good", max: 1, art: "winged_heart" },
  { id: "splash_zone", name: "Splash Zone", blurb: "Small fry burst when they die and hurt whatever is next to them.", kind: "good", max: 2, art: "bath_bomb_pickup" },
  { id: "lucky_seat", name: "Lucky Seat", blurb: "They drop gifts 30% more often.", kind: "good", max: 2, art: "golden_toilet_seat" },
  { id: "glass_cannon", name: "Glass Cannon", blurb: "Your gun hits 25% harder. You fly every level with one life less.", kind: "cursed", max: 1, art: "silver_star" },
  { id: "sugar_rush", name: "Sugar Rush", blurb: "Your gun fires 18% faster. Everything aimed at you flies 12% faster.", kind: "cursed", max: 1, art: "donut" },
  { id: "loan_shark", name: "Loan Shark", blurb: "Everything pays 50% more. Every hit you take costs you $50.", kind: "cursed", max: 1, art: "rubber_duck" },
  { id: "shared_bubble", name: "Shared Bubble", blurb: "A shield bubble caught by one pilot covers both.", kind: "duo", max: 1, art: "toilet_paper" },
  { id: "buddy_bond", name: "Buddy Bond", blurb: "Flying wing to wing is worth +40% damage instead of +25%.", kind: "duo", max: 1, art: "brush_buddy" },
  { id: "quick_rescue", name: "Quick Rescue", blurb: "Picking your partner back up takes half the time.", kind: "duo", max: 1, art: "extra_life" },
];

const BY_ID = new Map(PERKS.map((p) => [p.id, p]));

export function perkDef(id: string) {
  return BY_ID.get(id);
}

/** How many times a perk has been taken. */
export function perkCount(owned: string[], id: string) {
  let n = 0;
  for (const p of owned) if (p === id) n++;
  return n;
}

/** What rolling the offer again costs: more every time, within one offer. */
export function rerollPrice(rolls: number) {
  return 100 + rolls * 100;
}

/**
 * Three perks to choose from: never one that is already full, duo perks only with two pilots,
 * at most one cursed. `rng` returns 0..1. `skip` are the ones just shown, left out when there is enough else.
 */
export function rollPerks(owned: string[], duo: boolean, rng: () => number, skip: string[] = []): string[] {
  const open = PERKS.filter((p) => perkCount(owned, p.id) < p.max && (duo || p.kind !== "duo"));
  const fresh = open.filter((p) => !skip.includes(p.id));
  const pool = fresh.length >= 3 ? fresh : open;
  const out: Perk[] = [];
  const bag = pool.slice();
  while (out.length < 3 && bag.length) {
    const i = Math.floor(rng() * bag.length) % bag.length;
    const pick = bag.splice(i, 1)[0];
    if (pick.kind === "cursed" && out.some((p) => p.kind === "cursed")) continue;
    out.push(pick);
  }
  return out.map((p) => p.id);
}
