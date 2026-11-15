import { PERKS, perkCount, perkDef, type Perk } from "./perks";

const TONE: Record<Perk["kind"], { edge: string; text: string; label: string }> = {
  good: { edge: "border-line hover:border-ember", text: "text-ember", label: "PERK" },
  cursed: { edge: "border-[#a33a5e] hover:border-[#ff5f8f]", text: "text-[#ff5f8f]", label: "CURSED" },
  duo: { edge: "border-[#2a8f86] hover:border-[#35d0c0]", text: "text-[#35d0c0]", label: "TWO PILOTS" },
};

type PickProps = {
  offer: string[];
  owned: string[];
  dollars: number;
  rerollCost: number;
  onPick: (id: string) => void;
  onReroll: () => void;
};

/** One of three, after a mini-boss or a boss. There is no way past it but to pick. */
export function PerkPick({ offer, owned, dollars, rerollCost, onPick, onReroll }: PickProps) {
  const cards = offer.map((id) => perkDef(id)).filter((p): p is Perk => !!p);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center overflow-y-auto bg-bg/85 backdrop-blur-[2px]">
      <div className="menu-rise my-6 flex w-[min(94vw,760px)] flex-col gap-3 px-4">
        <div className="text-center">
          <p className="font-display text-xs tracking-[0.32em] text-muted">IT IS DOWN. TAKE SOMETHING.</p>
          <h2 className="font-display text-4xl leading-none tracking-wide">PICK A PERK</h2>
          <p className="mt-1 text-sm text-muted">Yours until you lose every life. Then the run starts clean.</p>
        </div>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {cards.map((p, i) => {
            const tone = TONE[p.kind];
            const have = perkCount(owned, p.id);
            return (
              <button
                key={p.id}
                type="button"
                className={`flex items-center gap-3 border bg-bg/80 px-3 py-3 text-left sm:min-h-[210px] sm:flex-col sm:items-center sm:justify-start sm:px-4 sm:py-4 sm:text-center ${tone.edge}`}
                onClick={() => onPick(p.id)}
              >
                <img src={`/art/k/${p.art}.webp`} alt="" className="h-14 w-14 shrink-0 object-contain sm:h-16 sm:w-16" />
                <span className="min-w-0 flex-1 sm:flex-none">
                  <span className={`block font-display text-[11px] tracking-[0.24em] ${tone.text}`}>
                    {tone.label}
                    {p.max > 1 ? ` · ${have + 1} OF ${p.max}` : ""}
                  </span>
                  <span className="block font-display text-xl leading-tight tracking-[0.08em] text-ink">{p.name.toUpperCase()}</span>
                  <span className="mt-1 block text-sm leading-snug text-muted">{p.blurb}</span>
                </span>
                <span className="hidden font-display text-xs tracking-[0.2em] text-muted sm:mt-auto sm:block">PRESS {i + 1}</span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          className="mx-auto flex h-11 w-full max-w-[360px] items-center justify-between border border-line bg-bg/80 px-4 font-display text-sm tracking-[0.16em] text-ink hover:border-ember disabled:cursor-default disabled:opacity-40"
          disabled={dollars < rerollCost}
          onClick={onReroll}
        >
          <span>THREE OTHERS</span>
          <span className="text-ember">${rerollCost}</span>
        </button>
        {owned.length > 0 && (
          <div className="flex flex-col items-center gap-1">
            <p className="font-display text-[11px] tracking-[0.24em] text-muted">YOU HAVE</p>
            <PerkRow owned={owned} />
          </div>
        )}
      </div>
    </div>
  );
}

/** The perks held on this run, as a row of small pictures with a count where one is stacked. */
export function PerkRow({ owned, className = "" }: { owned: string[]; className?: string }) {
  const held = PERKS.filter((p) => perkCount(owned, p.id) > 0);
  if (!held.length) return null;
  return (
    <div className={`flex flex-wrap items-center justify-center gap-1.5 ${className}`}>
      {held.map((p) => {
        const n = perkCount(owned, p.id);
        return (
          <span
            key={p.id}
            title={`${p.name}: ${p.blurb}`}
            className={`relative flex h-9 w-9 items-center justify-center border bg-bg/70 ${p.kind === "cursed" ? "border-[#a33a5e]" : p.kind === "duo" ? "border-[#2a8f86]" : "border-line"}`}
          >
            <img src={`/art/k/${p.art}.webp`} alt={p.name} className="h-7 w-7 object-contain" />
            {n > 1 && <span className="absolute -bottom-1 -right-1 bg-ember px-1 font-display text-[10px] leading-tight text-bg">×{n}</span>}
          </span>
        );
      })}
    </div>
  );
}
