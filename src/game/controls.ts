export type Action =
  | "p1Left"
  | "p1Right"
  | "p1Up"
  | "p1Down"
  | "p1Fire"
  | "p1Bomb"
  | "p1Focus"
  | "p2Left"
  | "p2Right"
  | "p2Up"
  | "p2Down"
  | "p2Fire"
  | "p2Bomb"
  | "p2Focus";

export const ACTIONS: { id: Action; label: string; group: "Pilot" | "Wing" }[] = [
  { id: "p1Left", label: "Move left", group: "Pilot" },
  { id: "p1Right", label: "Move right", group: "Pilot" },
  { id: "p1Up", label: "Move up", group: "Pilot" },
  { id: "p1Down", label: "Move down", group: "Pilot" },
  { id: "p1Fire", label: "Fire", group: "Pilot" },
  { id: "p1Bomb", label: "Bomb", group: "Pilot" },
  { id: "p1Focus", label: "Focus", group: "Pilot" },
  { id: "p2Left", label: "Move left", group: "Wing" },
  { id: "p2Right", label: "Move right", group: "Wing" },
  { id: "p2Up", label: "Move up", group: "Wing" },
  { id: "p2Down", label: "Move down", group: "Wing" },
  { id: "p2Fire", label: "Fire", group: "Wing" },
  { id: "p2Bomb", label: "Bomb", group: "Wing" },
  { id: "p2Focus", label: "Focus", group: "Wing" },
];

export type Binds = Record<Action, string[]>;

export const DEFAULT_BINDS: Binds = {
  p1Left: ["KeyA"],
  p1Right: ["KeyD"],
  p1Up: ["KeyW"],
  p1Down: ["KeyS"],
  p1Fire: ["KeyZ", "KeyJ", "ControlLeft"],
  p1Bomb: ["Space", "KeyX"],
  p1Focus: ["ShiftLeft"],
  p2Left: ["ArrowLeft"],
  p2Right: ["ArrowRight"],
  p2Up: ["ArrowUp"],
  p2Down: ["ArrowDown"],
  p2Fire: ["KeyK"],
  p2Bomb: ["KeyL"],
  p2Focus: ["ShiftRight"],
};

const KEY = "wingbreaker.binds.v1";

export function loadBinds(): Binds {
  const out: Binds = { ...DEFAULT_BINDS, p1Fire: [...DEFAULT_BINDS.p1Fire], p1Bomb: [...DEFAULT_BINDS.p1Bomb] };
  try {
    if (typeof localStorage === "undefined") return out;
    const raw = localStorage.getItem(KEY);
    if (!raw) return out;
    const parsed = JSON.parse(raw) as Partial<Binds>;
    for (const row of ACTIONS) {
      const v = parsed[row.id];
      if (Array.isArray(v) && v.length && v.every((x) => typeof x === "string")) out[row.id] = v.slice(0, 3);
    }
  } catch {
    /* keep defaults */
  }
  return out;
}

export function saveBinds(binds: Binds) {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(binds));
  } catch {
    /* private mode */
  }
}

export function codeLabel(code: string) {
  if (code.startsWith("Key")) return code.slice(3);
  if (code.startsWith("Digit")) return code.slice(5);
  const names: Record<string, string> = {
    Space: "Space",
    ArrowLeft: "Left",
    ArrowRight: "Right",
    ArrowUp: "Up",
    ArrowDown: "Down",
    ShiftLeft: "Shift",
    ShiftRight: "R-Shift",
    ControlLeft: "Ctrl",
    ControlRight: "R-Ctrl",
    Enter: "Enter",
    Backspace: "Back",
    Tab: "Tab",
  };
  return names[code] ?? code.replace(/^(Key|Digit)/, "");
}
