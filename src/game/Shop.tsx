import { useState } from "react";
import { GUN_PRICE, POWER_PRICES, SKINS, UPGRADE_LIST, type SkinId, type UpgradeId } from "./meta";
import { RangeView } from "./RangeView";
import { FAMILIES, familyBlurb, familyColor, familyTitle, type GunFamily } from "./v3";

/** The crate each gun comes in. */
const GIFT_ART: Record<GunFamily, string> = {
  bubble: "bubble_blaster",
  soap: "soap_cannon",
  paste: "toothpaste_laser",
  zap: "zap_brush",
  flush: "flush_wave",
  mist: "freshener_mist",
  dryer: "hair_dryer",
  bidet: "bidet_hose",
  sling: "rubber_slingshot",
  streamer: "paper_streamer",
  sponge: "sponge_bomber",
  duck: "squeaky_duck",
};

/** The picture each piece of gear wears, all from the pickup art the pilot already knows. */
const UPGRADE_ART: Record<UpgradeId, string> = {
  trigger: "coffee",
  luck: "golden_toilet_seat",
  magnet: "magnet",
  salvage: "gold_coin",
  magazine: "air_freshener",
  salvo: "plunger_missile_pickup",
  hull: "winged_heart",
  insurance: "toilet_paper",
  pockets: "bath_bomb_pickup",
};

/** What a step of power buys, in a few words, by the power it takes you to. */
const POWER_NOTES = [
  "Where everybody starts.",
  "Half as strong again. The first step is the biggest.",
  "Twice the punch you started with, and more of it in the air.",
  "A support pod joins in. Most guns throw a wider volley.",
  "Three times the starting punch.",
  "Full power: two pods, the widest volley, nothing left to buy.",
];

type Tab = "power" | "guns" | "ships" | "gear";

export type ShopProps = {
  dollars: number;
  /** steps of power bought: 0 to 5 */
  power: number;
  upgrades: Record<UpgradeId, number>;
  gun: GunFamily;
  gun2: GunFamily;
  guns: GunFamily[];
  skin: SkinId;
  skin2: SkinId;
  owned: SkinId[];
  level: number;
  seat: 0 | 1;
  setSeat: (seat: 0 | 1) => void;
  onPower: () => void;
  onGun: (family: GunFamily, seat: 0 | 1) => void;
  onUpgrade: (id: UpgradeId) => void;
  onSkin: (id: SkinId, owned: boolean, seat: 0 | 1) => void;
  onBack: () => void;
};

const label = "font-display text-xs tracking-[0.24em] text-muted";
const cta =
  "flex h-13 min-h-[52px] w-full items-center justify-between border border-ember bg-ember/15 px-4 font-display text-lg tracking-[0.14em] text-ember hover:bg-ember/25 disabled:cursor-default disabled:border-line disabled:bg-bg/70 disabled:text-muted";

function Seats({ seat, setSeat }: { seat: 0 | 1; setSeat: (seat: 0 | 1) => void }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {([0, 1] as const).map((n) => (
        <button
          key={n}
          type="button"
          aria-pressed={seat === n}
          className={`flex h-10 items-center justify-center gap-2 border font-display text-sm tracking-[0.16em] ${
            seat === n ? "border-ember bg-ember/15 text-ember" : "border-line bg-bg/70 text-muted hover:text-ink"
          }`}
          onClick={() => setSeat(n)}
        >
          <span className="inline-block h-2.5 w-2.5" style={{ background: n === 0 ? "#ff6b4a" : "#35d0c0" }} />
          {n === 0 ? "PILOT 1" : "PILOT 2"}
        </button>
      ))}
    </div>
  );
}

export function Shop(props: ShopProps) {
  const { dollars, power, upgrades, gun, gun2, guns, skin, skin2, owned, level, seat, setSeat } = props;
  const [tab, setTab] = useState<Tab>("power");
  /** the gun on the range while browsing; nothing is bought by looking */
  const [gunPick, setGunPick] = useState<GunFamily | null>(null);
  /** the power on the range while browsing */
  const [powerPick, setPowerPick] = useState<number | null>(null);

  const have = Math.max(1, Math.min(6, 1 + power));
  const flown = seat === 0 ? gun : gun2;
  const shown: GunFamily = tab === "guns" ? (gunPick ?? flown) : flown;
  const shownPower = tab === "power" ? (powerPick ?? have) : have;
  const shownOwned = shown === "bubble" || guns.includes(shown);
  const nextPrice = have < 6 ? POWER_PRICES[have - 1] : 0;
  const tabs: [Tab, string][] = [
    ["power", "POWER"],
    ["guns", "GUNS"],
    ["ships", "SHIPS"],
    ["gear", "GEAR"],
  ];

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg/90">
      <header className="mx-auto w-full max-w-[1000px] px-5 pt-4">
        <p className="font-display text-xs tracking-[0.28em] text-muted">HANGAR</p>
        <h2 className="font-display text-3xl leading-none tracking-wide">SHOP</h2>
      </header>

      <nav className="mx-auto grid w-full max-w-[1000px] grid-cols-4 gap-1.5 px-5 pt-3" aria-label="Shop sections">
        {tabs.map(([id, name]) => (
          <button
            key={id}
            type="button"
            aria-pressed={tab === id}
            className={`h-11 border font-display text-sm tracking-[0.16em] sm:text-base ${
              tab === id ? "border-ember bg-ember/15 text-ember" : "border-line bg-bg/70 text-muted hover:border-ink/50 hover:text-ink"
            }`}
            onClick={() => setTab(id)}
          >
            {name}
          </button>
        ))}
      </nav>

      <div className="mx-auto min-h-0 w-full max-w-[1000px] flex-1 overflow-y-auto px-5 pb-3 pt-3">
        {(tab === "power" || tab === "guns") && (
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] md:gap-5">
            {/* the range stays in view while the list scrolls under it, so tapping a gun always shows it firing */}
            <div className="sticky top-0 z-10 -mx-1 self-start bg-bg px-1 pb-2 md:mx-0 md:px-0 md:pb-0">
              <div className="relative h-[176px] overflow-hidden border border-line bg-black sm:h-[240px] md:h-[min(56vh,460px)]">
                <RangeView family={shown} rank={shownPower} skin={seat === 0 ? skin : skin2} level={level} className="absolute inset-0 h-full w-full" />
                <p className="pointer-events-none absolute left-2 top-2 bg-bg/70 px-2 py-0.5 font-display text-[11px] tracking-[0.2em] text-muted">FIRING RANGE</p>
                <p className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center justify-between gap-2 font-display text-sm tracking-[0.12em]">
                  <span className="truncate bg-bg/70 px-2 py-0.5" style={{ color: familyColor(shown) }}>
                    {familyTitle(shown)}
                  </span>
                  <span className="shrink-0 bg-bg/70 px-2 py-0.5 text-ink">POWER {shownPower}</span>
                </p>
              </div>
              {tab === "guns" && (
                <div className="mt-2 flex flex-col gap-2">
                  <p className="flex items-center gap-2 text-sm leading-snug text-muted">
                    <img src={`/art/k/${GIFT_ART[shown]}_gift.webp`} alt="" className="h-8 w-8 shrink-0 object-contain" />
                    <span>{familyBlurb(shown)}</span>
                  </p>
                  <button
                    type="button"
                    className={cta}
                    disabled={shown === flown || (!shownOwned && dollars < GUN_PRICE)}
                    onClick={() => props.onGun(shown, seat)}
                  >
                    <span>{shown === flown ? `PILOT ${seat + 1} FLIES IT` : shownOwned ? `EQUIP FOR PILOT ${seat + 1}` : "BUY AND EQUIP"}</span>
                    <span className="text-base">
                      {shown === flown ? "" : shownOwned ? "OWNED" : dollars < GUN_PRICE ? `$${GUN_PRICE} · $${GUN_PRICE - dollars} SHORT` : `$${GUN_PRICE}`}
                    </span>
                  </button>
                </div>
              )}
            </div>

            {tab === "power" && (
              <section className="flex flex-col gap-3" aria-label="Gun power">
                <div>
                  <p className={label}>GUN POWER</p>
                  <p className="mt-1 text-sm leading-snug text-muted">Bought once and yours for good. It works with every gun, for both pilots.</p>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {[1, 2, 3, 4, 5, 6].map((n) => {
                    const mine = n <= have;
                    const next = n === have + 1;
                    const on = shownPower === n;
                    return (
                      <button
                        key={n}
                        type="button"
                        aria-pressed={on}
                        aria-label={`Show power ${n} on the firing range`}
                        className={`flex h-[62px] flex-col items-center justify-center border font-display ${
                          mine ? "border-ember/70 bg-ember/20 text-ink" : next ? "border-ember/70 bg-bg/70 text-ember" : "border-line bg-bg/70 text-muted"
                        } ${on ? "outline outline-2 outline-offset-1 outline-ink" : ""}`}
                        onClick={() => setPowerPick(n)}
                      >
                        <span className="text-2xl leading-none">{n}</span>
                        <span className="mt-1 text-[10px] tracking-[0.1em]">{mine ? "YOURS" : `$${POWER_PRICES[n - 2]}`}</span>
                      </button>
                    );
                  })}
                </div>
                <p className="min-h-[2.6em] text-sm leading-snug text-ink">
                  <span className="font-display tracking-[0.12em] text-ember">POWER {shownPower}. </span>
                  {POWER_NOTES[shownPower - 1]}
                </p>
                <button
                  type="button"
                  className={cta}
                  disabled={have >= 6 || dollars < nextPrice}
                  onClick={() => {
                    props.onPower();
                    setPowerPick(null);
                  }}
                >
                  <span>{have >= 6 ? "FULL POWER" : `BUY POWER ${have + 1}`}</span>
                  <span className="text-base">{have >= 6 ? "MAX" : dollars < nextPrice ? `$${nextPrice} · $${nextPrice - dollars} SHORT` : `$${nextPrice}`}</span>
                </button>
                <ul className="flex flex-col gap-1 text-xs leading-snug text-muted">
                  <li>Tap a number to see that power on the range before you pay.</li>
                  <li>A gift box in a level lends one step more for 25 seconds. Two boxes lend two.</li>
                  <li>Getting hit knocks off the gift, never the power you bought.</li>
                </ul>
              </section>
            )}

            {tab === "guns" && (
              <section className="flex flex-col gap-3" aria-label="Guns">
                <Seats seat={seat} setSeat={setSeat} />
                <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                  {FAMILIES.map((family) => {
                    const mine = family === "bubble" || guns.includes(family);
                    const on = shown === family;
                    return (
                      <button
                        key={family}
                        type="button"
                        aria-pressed={on}
                        className={`flex min-h-[58px] items-center gap-2 border bg-bg/70 px-2 py-1.5 text-left ${
                          on ? "border-ember" : "border-line hover:border-ink/50"
                        }`}
                        onClick={() => setGunPick(family)}
                      >
                        <img src={`/art/k/${GIFT_ART[family]}_gift.webp`} alt="" className={`h-9 w-9 shrink-0 object-contain ${mine ? "" : "opacity-60"}`} />
                        <span className="min-w-0 flex-1">
                          <span className={`block font-display text-[13px] leading-tight tracking-[0.08em] ${mine ? "text-ink" : "text-muted"}`}>
                            {familyTitle(family)}
                          </span>
                          <span className="mt-0.5 flex items-center gap-1 font-display text-[11px] leading-none tracking-[0.1em]">
                            {family === gun && <span className="px-1 py-0.5 text-bg" style={{ background: "#ff6b4a" }}>P1</span>}
                            {family === gun2 && <span className="px-1 py-0.5 text-bg" style={{ background: "#35d0c0" }}>P2</span>}
                            {family !== gun && family !== gun2 && <span className={mine ? "text-muted" : "text-ember"}>{mine ? "OWNED" : `$${GUN_PRICE}`}</span>}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs leading-snug text-muted">A gun is bought once and either pilot can fly it. Nothing in a level swaps it: the gun you pick here is the gun you keep.</p>
              </section>
            )}
          </div>
        )}

        {tab === "ships" && (
          <section className="mx-auto flex max-w-[560px] flex-col gap-3" aria-label="Ships">
            <div>
              <p className={label}>SHIPS</p>
              <p className="mt-1 text-sm leading-snug text-muted">Every ship flies differently. Pick one for each pilot.</p>
            </div>
            <Seats seat={seat} setSeat={setSeat} />
            <div className="grid grid-cols-1 gap-2">
              {SKINS.map((ship) => {
                const mine = owned.includes(ship.id);
                const worn = (seat === 0 ? skin : skin2) === ship.id;
                const other = (seat === 0 ? skin2 : skin) === ship.id;
                const locked = !mine && ship.price <= 0;
                return (
                  <button
                    key={ship.id}
                    type="button"
                    className={`flex min-h-[76px] items-center gap-3 border bg-bg/70 px-3 py-2 text-left backdrop-blur-sm disabled:opacity-50 ${
                      worn ? "border-ember" : "border-line hover:border-ink/50"
                    }`}
                    disabled={locked || (!mine && dollars < ship.price)}
                    onClick={() => props.onSkin(ship.id, mine, seat)}
                  >
                    <img src={`/art/s/${ship.art}.webp`} alt="" className="h-14 w-14 shrink-0 object-contain" />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate font-display text-base tracking-[0.1em]">{ship.name.toUpperCase()}</span>
                        <span className="shrink-0 font-display text-sm text-ember">
                          {worn ? "FLYING" : mine ? "FLY" : locked ? `${ship.stars}★` : `$${ship.price}`}
                        </span>
                      </span>
                      <span className="block text-xs leading-snug text-muted">{ship.trait}</span>
                      {other && <span className="block text-[11px] leading-snug text-cold">{seat === 0 ? "Pilot 2" : "Pilot 1"} flies this one</span>}
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {tab === "gear" && (
          <section className="mx-auto flex max-w-[560px] flex-col gap-2" aria-label="Gear">
            <div className="mb-1">
              <p className={label}>GEAR</p>
              <p className="mt-1 text-sm leading-snug text-muted">Fitted from the next level on. Cash stays when you die.</p>
            </div>
            {UPGRADE_LIST.map((item) => {
              const rank = upgrades[item.id];
              const maxed = rank >= item.max;
              const price = item.prices[Math.min(rank, item.prices.length - 1)];
              return (
                <button
                  key={item.id}
                  type="button"
                  className="flex min-h-[68px] w-full items-center justify-between gap-3 border border-line bg-bg/80 px-4 py-2 text-left font-display text-lg tracking-[0.14em] text-ink hover:border-ember disabled:cursor-default disabled:opacity-40"
                  disabled={maxed || dollars < price}
                  onClick={() => props.onUpgrade(item.id)}
                >
                  <span className="flex min-w-0 items-center gap-3">
                    <img src={`/art/k/${UPGRADE_ART[item.id]}.webp`} alt="" className="h-9 w-9 shrink-0 object-contain" />
                    <span className="min-w-0">
                      <span className="block leading-tight">{item.name}</span>
                      <span className="block text-xs leading-snug tracking-normal text-muted">{item.blurb}</span>
                      <span className="mt-1 flex gap-1" aria-hidden="true">
                        {Array.from({ length: item.max }, (_, i) => (
                          <span key={i} className={`h-1.5 w-5 ${i < rank ? "bg-ember" : "bg-line"}`} />
                        ))}
                      </span>
                    </span>
                  </span>
                  <span className="shrink-0 text-sm text-ember">{maxed ? "MAX" : `$${price}`}</span>
                </button>
              );
            })}
          </section>
        )}
      </div>

      <footer className="mx-auto w-full max-w-[1000px] px-5 pb-4 pt-2">
        <button
          type="button"
          className="flex h-12 w-full items-center justify-between border border-line bg-bg/80 px-4 text-left font-display text-lg tracking-[0.14em] text-ink hover:border-ember"
          onClick={props.onBack}
        >
          <span>BACK</span>
        </button>
      </footer>
    </div>
  );
}
