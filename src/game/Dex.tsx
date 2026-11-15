import { useState } from "react";
import { DEX_ALL_CASH, DEX_POOP, DEX_ROOMS, DEX_ROOM_CASH, dexCount, dexRoomDone, dexTotals, type DexEntry } from "./album";

type Props = {
  dex: Record<string, number>;
  tally: Record<string, number>;
  seen: string[];
  /** the room the campaign is in, so the album opens on the page being filled */
  room: number;
  onBack: () => void;
};

/** The album: one page per room and one for the poop itself. */
export function Dex({ dex, tally, seen, room, onBack }: Props) {
  const book = { dex, tally, seen };
  const [page, setPage] = useState(Math.max(0, Math.min(DEX_ROOMS.length - 1, room)));
  const [pick, setPick] = useState<string | null>(null);
  const poop = page >= DEX_ROOMS.length;
  const room_ = poop ? null : DEX_ROOMS[page];
  const entries: DexEntry[] = poop ? DEX_POOP : room_ ? [...room_.entries, ...(room_.boss ? [room_.boss] : [])] : [];
  const totals = dexTotals(book);
  const chosen = entries.find((e) => e.id === pick) ?? null;
  const count = chosen ? dexCount(book, chosen) : 0;
  const haveOf = (list: DexEntry[]) => list.filter((e) => dexCount(book, e) > 0).length;
  const done = !poop && dexRoomDone(book, page);

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg/90">
      <header className="mx-auto w-full max-w-[860px] px-5 pt-4">
        <p className="font-display text-xs tracking-[0.28em] text-muted">THE ALBUM</p>
        <h2 className="font-display text-3xl leading-none tracking-wide">POOP-DEX</h2>
        <div className="mt-2 flex items-center gap-3">
          <div className="h-1.5 flex-1 bg-line" aria-hidden="true">
            <div className="h-full bg-ember" style={{ width: `${(totals.have / Math.max(1, totals.all)) * 100}%` }} />
          </div>
          <p className="font-display text-sm tracking-[0.14em] text-ember">
            {totals.have} / {totals.all}
          </p>
        </div>
      </header>

      <nav className="mx-auto flex w-full max-w-[860px] gap-1 overflow-x-auto px-5 pt-3 pb-1" aria-label="Pages">
        {[...DEX_ROOMS.map((r, i) => ({ label: String(i + 1), full: r.title, list: [...r.entries, ...(r.boss ? [r.boss] : [])], i })), { label: "POOP", full: "The poop itself", list: DEX_POOP, i: DEX_ROOMS.length }].map(
          (tab) => {
            const have = haveOf(tab.list);
            const full = have === tab.list.length;
            return (
              <button
                key={tab.label}
                type="button"
                aria-pressed={page === tab.i}
                aria-label={`${tab.full}: ${have} of ${tab.list.length}`}
                className={`flex h-12 min-w-[46px] shrink-0 flex-col items-center justify-center border px-2 font-display ${
                  page === tab.i ? "border-ember bg-ember/15 text-ember" : full ? "border-[#d9a441]/70 bg-bg/70 text-[#d9a441]" : "border-line bg-bg/70 text-muted hover:text-ink"
                }`}
                onClick={() => {
                  setPage(tab.i);
                  setPick(null);
                }}
              >
                <span className="text-base leading-none tracking-[0.08em]">{tab.label}</span>
                <span className="mt-1 text-[10px] leading-none">
                  {have}/{tab.list.length}
                </span>
              </button>
            );
          },
        )}
      </nav>

      <div className="mx-auto min-h-0 w-full max-w-[860px] flex-1 overflow-y-auto px-5 py-3">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <p className="font-display text-lg tracking-[0.12em] text-ink">{poop ? "THE POOP ITSELF" : `${page + 1}. ${room_?.title.toUpperCase()}`}</p>
          <p className={`shrink-0 text-right text-xs ${done ? "text-[#d9a441]" : "text-muted"}`}>
            {poop ? "Logged when it is first thrown at you" : done ? `Page complete · $${DEX_ROOM_CASH} paid` : `Fill the page: $${DEX_ROOM_CASH}`}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-5">
          {entries.map((e) => {
            const n = dexCount(book, e);
            const known = n > 0;
            const on = pick === e.id;
            return (
              <button
                key={e.id}
                type="button"
                aria-pressed={on}
                className={`flex min-h-[104px] flex-col items-center justify-between border bg-bg/70 px-1.5 py-2 text-center ${
                  on ? "border-ember" : e.tag === "BOSS" ? "border-[#d9a441]/50 hover:border-[#d9a441]" : "border-line hover:border-ink/50"
                }`}
                onClick={() => setPick(e.id)}
              >
                <img src={`/art/${e.art}.webp`} alt="" loading="lazy" className={`h-12 w-12 object-contain ${known ? "" : "opacity-45 brightness-0 invert-[0.25]"}`} />
                <span className={`mt-1 line-clamp-2 font-display text-[11px] leading-tight tracking-[0.06em] ${known ? "text-ink" : "text-muted"}`}>
                  {known ? e.name.toUpperCase() : "???"}
                </span>
                <span className="font-display text-[10px] leading-none tracking-[0.1em] text-ember">
                  {!known ? "" : e.tag === "POOP" ? "MET" : e.tag === "BOSS" ? `BEATEN ×${n}` : `×${n}`}
                </span>
              </button>
            );
          })}
        </div>
        {!poop && (
          <p className="mt-3 text-xs leading-snug text-muted">
            A critter gets its page the first time you shoot one down, a boss when you beat it. Every finished room pays ${DEX_ROOM_CASH}; the whole album pays $
            {DEX_ALL_CASH} more.
          </p>
        )}
      </div>

      <div className="mx-auto w-full max-w-[860px] px-5">
        <div className="flex min-h-[92px] items-center gap-4 border border-line bg-bg/80 px-4 py-3">
          {chosen && <img src={`/art/${chosen.art}.webp`} alt="" className={`h-16 w-16 shrink-0 object-contain ${count > 0 ? "" : "opacity-45 brightness-0 invert-[0.25]"}`} />}
          <div className="min-w-0">
            {chosen && count > 0 ? (
              <>
                <p className="font-display text-base leading-tight tracking-[0.1em] text-ink">
                  {chosen.name.toUpperCase()} <span className="text-xs tracking-[0.16em] text-muted">· {chosen.tag}</span>
                </p>
                <p className="text-sm italic leading-snug text-cold">{chosen.line}</p>
                <p className="mt-0.5 font-display text-xs tracking-[0.14em] text-ember">
                  {chosen.tag === "POOP" ? "IT HAS BEEN THROWN AT YOU" : chosen.tag === "BOSS" ? `BEATEN ${count} TIME${count === 1 ? "" : "S"}` : `FLUSHED ${count.toLocaleString("en-US")} TIME${count === 1 ? "" : "S"}`}
                </p>
              </>
            ) : (
              <p className="text-sm italic text-cold">{chosen ? "Not logged yet. Go and get shot at by it." : "Tap a page to read it."}</p>
            )}
          </div>
        </div>
      </div>

      <footer className="mx-auto w-full max-w-[860px] px-5 pb-4 pt-2">
        <button
          type="button"
          className="flex h-12 w-full items-center justify-between border border-line bg-bg/80 px-4 text-left font-display text-lg tracking-[0.14em] text-ink hover:border-ember"
          onClick={onBack}
        >
          <span>BACK</span>
        </button>
      </footer>
    </div>
  );
}
