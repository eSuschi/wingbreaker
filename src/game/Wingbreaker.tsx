import { useEffect, useRef, useState } from "react";
import { DollarSign } from "lucide-react";
import { Sfx } from "./audio";
import { Music } from "./music";
import { chapterOf, CHAPTERS, DIFFICULTY, FEATS, quipFor, starTotal, type SkinId, type UpgradeId } from "./meta";
import { Shop } from "./Shop";
import { CREDITS, GUIDE, LOSER_TITLES, TIPS, WINNER_TITLES, daySeed, type GunFamily } from "./v3";

import { ACTIONS, codeLabel, DEFAULT_BINDS, loadBinds, saveBinds, type Action, type Binds } from "./controls";
import { drawWorld } from "./render";
import {
  WORLD_H,
  WORLD_W,
  VIEW,
  closeOverlay,
  createWorld,
  chooseCrew,
  ensureAutoFire,
  loadBest,
  nextLevel,
  openMode,
  requestBomb,
  retryLevel,
  saveNow,
  setAutoFire,
  setAutoNext,
  setDifficulty,
  newLoop,
  setCoarsePointer,
  setMuted,
  setReduceMotion,
  setShake,
  skipBridge,
  startArcade,
  startDuel,
  setMusic,
  setSfx,
  setCrew,
  purchaseGun,
  purchasePower,
  gunRank,
  step,
  fitWorld,
  newMission,
  purchaseSkin,
  purchaseUpgrade,
  wearSkin,
  practiceLevel,
  stampRank,
  leaveRun,
  backToLevels,
  type InputState,
  type Mode,
  type World,
} from "./world";

type Ui = {
  mode: Mode;
  score: number;
  best: number;
  level: number;
  mission: number;
  dollars: number;
  muted: boolean;
  shake: boolean;
  record: boolean;
  perfect: boolean;
  clearCash: number;
  chapter: string;
  nextChapter: string;
  hasSave: boolean;
  skin: SkinId;
  skin2: SkinId;
  owned: SkinId[];
  upgrades: Record<UpgradeId, number>;
  cleared: boolean;
  lockShake: boolean;
  quip: string;
  autoFire: boolean;
  autoNext: boolean;
  difficulty: number;
  loop: number;
  daily: boolean;
  feats: string[];
  stars: number;
  music: number;
  sfx: number;
  deathLine: string;
  starLine: string;
  seen: string[];
  starsGrid: number[];
  ranks: { name: string; score: number; stage: number; date: string }[];
  gun: GunFamily;
  gun2: GunFamily;
  power: number;
  guns: GunFamily[];
  arcadeStage: number;
  dailyPlayed: boolean;
  coop: boolean;
  tally: [number, number];
  crew: "solo" | "coop";
  noBomb: boolean;
  slain: number;
  born: number;
  arcade: boolean;
  replay: boolean;
  series: [number, number];
  duel: { wins: [number, number]; taunt: string } | null;
};

function readUi(world: World, muted: boolean): Ui {
  const beaten = world.mode === "clear" || world.mode === "victory" ? world.level : world.meta.level;
  return {
    mode: world.mode,
    score: world.score,
    best: Math.max(world.best, world.meta.best),
    level: world.level,
    mission: world.meta.level,
    dollars: world.meta.dollars,
    muted,
    shake: world.meta.shake,
    record: world.record,
    perfect: world.perfect,
    clearCash: world.clearCash,
    chapter: chapterOf(beaten).name,
    nextChapter: chapterOf(world.meta.level).name,
    hasSave: world.snap !== null || world.meta.level > 1,
    skin: world.meta.skin,
    skin2: world.meta.skin2,
    owned: world.meta.owned.slice(),
    upgrades: { ...world.meta.upgrades },
    cleared: world.meta.cleared,
    lockShake: world.lockShake,
    quip: quipFor(world.level),
    autoFire: world.meta.autoFire === true,
    autoNext: world.meta.autoAdvance === true,
    difficulty: world.meta.difficulty ?? 1,
    loop: world.meta.loop ?? 0,
    daily: world.daily,
    feats: world.meta.feats,
    stars: starTotal(world.meta),
    music: world.meta.music,
    sfx: world.meta.sfx,
    deathLine: world.deathLine,
    starLine: world.starShow,
    seen: world.meta.seen.slice(),
    starsGrid: world.meta.stars.slice(),
    ranks: world.meta.ranks.map((r) => ({ name: r.name, score: r.score, stage: r.stage, date: r.date })),
    gun: world.meta.gun,
    gun2: world.meta.gun2 ?? world.meta.gun,
    power: world.meta.power ?? 0,
    guns: world.meta.guns.slice(),
    arcadeStage: world.arcadeStage,
    dailyPlayed: world.meta.dailyDay === daySeed().key && world.meta.dailyScore > 0,
    coop: world.coop && !world.arcade,
    tally: [world.tally[0], world.tally[1]],
    crew: world.meta.crew === "coop" ? "coop" : "solo",
    noBomb: world.bombsUsed === 0,
    slain: world.slain,
    born: world.born,
    arcade: world.arcade,
    replay: world.pinned != null && !world.arcade,
    series: [world.series[0], world.series[1]],
    duel: world.duel ? { wins: [world.duel.wins[0], world.duel.wins[1]], taunt: world.duel.taunt } : null,
  };
}

/** The end-of-level card for two pilots: who shot more, and what the other one gets called. */
function versus(tally: [number, number], level: number) {
  const [a, b] = tally;
  const pick = Math.abs(level * 7 + a * 3 + b);
  if (a === b) return { lead: -1, titles: ["DEAD EVEN", "SHARE THE SOAP"] as [string, string] };
  const win = WINNER_TITLES[pick % WINNER_TITLES.length] ?? "TOP PLUNGER";
  const lose = LOSER_TITLES[pick % LOSER_TITLES.length] ?? "MORAL SUPPORT";
  return { lead: a > b ? 0 : 1, titles: (a > b ? [win, lose] : [lose, win]) as [string, string] };
}

/** One line for the end-of-level bar when two pilots fly: who shot more, and a nudge for the other. */
function crewLine(tally: [number, number]) {
  const [a, b] = tally;
  if (a === b) return `PILOT ${a} · WING ${b} · DEAD EVEN`;
  const lead = a > b ? "PILOT" : "WING";
  const gap = Math.abs(a - b);
  const note = gap >= 12 ? "CARRYING THE TEAM" : gap >= 5 ? "TOP GUN" : "BY A NOSE";
  return `PILOT ${a} · WING ${b} · ${lead} ${note}`;
}

const row =
  "flex h-12 w-full items-center justify-between border border-line bg-bg/80 px-4 text-left font-display text-lg tracking-[0.14em] text-ink hover:border-ember disabled:cursor-default disabled:opacity-40";

type Probe = {
  getYaw: () => number;
  getSpeed: () => number;
  getX: () => number;
  getY: () => number;
  setKeys: (codes: string[]) => void;
  getMode: () => string;
  setGun?: (n: number) => void;
  getGun?: () => number;
  armMissiles?: (n: number) => void;
  setLevel?: (n: number) => void;
  shotReport?: () => { n: number; styles: number[] };
  getWorld?: () => World;
};

declare global {
  interface Window {
    __controlsTest?: Probe;
  }
}

export function Wingbreaker() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const worldRef = useRef<World | null>(null);
  const sfxRef = useRef<Sfx | null>(null);
  const [ui, setUi] = useState<Ui>({
    mode: "menu",
    score: 0,
    best: 0,
    level: 1,
    mission: 1,
    dollars: 0,
    muted: false,
    shake: true,
    record: false,
    perfect: true,
    clearCash: 0,
    chapter: "Old Bathroom",
    nextChapter: "Old Bathroom",
    hasSave: false,
    skin: "steel",
    skin2: "bone",
    owned: ["steel"],
    upgrades: { hull: 0, magazine: 0, magnet: 0, salvage: 0, trigger: 0, luck: 0, salvo: 0, insurance: 0, pockets: 0 },
    cleared: false,
    lockShake: false,
    quip: quipFor(1),
    autoFire: false,
    autoNext: false,
    difficulty: 1,
    loop: 0,
    daily: false,
    feats: [],
    stars: 0,
    music: 55,
    sfx: 80,
    deathLine: "",
    starLine: "",
    seen: [],
    starsGrid: [],
    ranks: [],
    gun: "bubble",
    gun2: "bubble",
    power: 0,
    guns: ["bubble"],
    arcadeStage: 0,
    dailyPlayed: false,
    coop: false,
    tally: [0, 0],
    crew: "solo",
    noBomb: true,
    slain: 0,
    born: 0,
    arcade: false,
    replay: false,
    series: [0, 0],
    duel: null,
  });
  const [touch, setTouch] = useState(false);
  // which pilot the hangar is choosing a ship for
  const [seat, setSeat] = useState<0 | 1>(0);
  const [notice, setNotice] = useState("");
  const [armReset, setArmReset] = useState(false);
  const [pick, setPick] = useState(false);
  const [binds, setBinds] = useState<Binds>(() => loadBinds());
  const [capture, setCapture] = useState<Action | null>(null);
  const [guideId, setGuideId] = useState("dart");
  const [initials, setInitials] = useState("AAA");
  const [tip, setTip] = useState(TIPS[0]);
  const touchFireRef = useRef(false);
  const coarseRef = useRef(false);
  const bindsRef = useRef(binds);
  const captureRef = useRef<Action | null>(null);
  const pickRef = useRef(false);
  const initialsRef = useRef("AAA");
  const letterAt = useRef(0);
  const musicRef = useRef<Music | null>(null);
  bindsRef.current = binds;
  captureRef.current = capture;
  pickRef.current = pick;
  initialsRef.current = initials;

  useEffect(() => {
    setTip(TIPS[Math.floor(Math.random() * TIPS.length)] ?? TIPS[0]);
  }, []);

  useEffect(() => {
    const coarse = window.matchMedia("(pointer: coarse)").matches;
    setTouch(coarse);
    coarseRef.current = coarse;
    setCoarsePointer(coarse);
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const world = createWorld(loadBest());
    worldRef.current = world;
    ensureAutoFire(world, coarse);
    const sfx = new Sfx();
    sfx.muted = world.meta.mute;
    sfx.volume = world.meta.sfx / 100;
    sfxRef.current = sfx;
    const music = new Music();
    music.volume = world.meta.music / 100;
    musicRef.current = music;
    world.lockShake = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    world.reduce = world.lockShake || !world.meta.shake;

    const held = new Set<string>();
    let override: string[] | null = null;
    let bombLatch = false;
    let wingBombLatch = false;
    let mouseFire = false;
    let mouseAlt = false;
    // touch steering: finger travel since the last game step, in world pixels
    const DRAG_GAIN = 1.15;
    let dragX = 0;
    let dragY = 0;
    const takeDrag = () => {
      const d = { dx: dragX, dy: dragY };
      dragX = 0;
      dragY = 0;
      return d;
    };
    const pointer = { on: false, x: 0, y: 0, touch: false };
    const layout = { dpr: 1 };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.max(1, rect.width);
      const cssH = Math.max(1, rect.height);
      fitWorld(world, cssW, cssH);
      layout.dpr = dpr;
      canvas.width = Math.max(1, Math.floor(cssW * dpr));
      canvas.height = Math.max(1, Math.floor(cssH * dpr));
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
    };
    resize();
    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const toWorld = (clientX: number, clientY: number) => {
      const rect = canvas.getBoundingClientRect();
      const view = VIEW || 1;
      return {
        x: (clientX - rect.left) / view,
        y: (clientY - rect.top) / view,
      };
    };

    const effective = () => (override ? new Set(override) : held);

    // Gamepads: one pad flies the pilot when alone and the wingman when two
    // fly (so keyboard + pad works); with two pads each pilot gets one.
    type PadState = { left: boolean; right: boolean; up: boolean; down: boolean; fire: boolean; focus: boolean; bomb: boolean; start: boolean; alt: boolean; ax: number; ay: number };
    const idle: PadState = { left: false, right: false, up: false, down: false, fire: false, focus: false, bomb: false, start: false, alt: false, ax: 0, ay: 0 };
    const padLatch = [
      { bomb: false, start: false, fire: false },
      { bomb: false, start: false, fire: false },
    ];
    let padConfirm = false;
    let padPause = false;
    const readPad = (slot: number): PadState => {
      const all = typeof navigator !== "undefined" && navigator.getGamepads ? Array.from(navigator.getGamepads()) : [];
      const pads = all.filter((g): g is Gamepad => !!g && g.connected);
      const pad = pads[slot];
      if (!pad) return idle;
      const on = (i: number) => !!pad.buttons[i]?.pressed;
      const ax = pad.axes[0] ?? 0;
      const ay = pad.axes[1] ?? 0;
      const latch = padLatch[slot];
      const bombHeld = on(1) || on(2);
      const startHeld = on(9);
      const fireHeld = on(0) || on(7);
      const state: PadState = {
        // the d-pad is digital, the stick is passed on as it is so a light push is a slow slide
        left: on(14),
        right: on(15),
        up: on(12),
        down: on(13),
        ax,
        ay,
        alt: on(3),
        fire: fireHeld,
        focus: on(4) || on(5) || on(6),
        bomb: bombHeld && !latch.bomb,
        start: startHeld && !latch.start,
      };
      if (startHeld && !latch.start) padPause = true;
      if ((fireHeld && !latch.fire) || (startHeld && !latch.start)) padConfirm = true;
      latch.bomb = bombHeld;
      latch.start = startHeld;
      latch.fire = fireHeld;
      return state;
    };
    const padCount = () => (typeof navigator !== "undefined" && navigator.getGamepads ? Array.from(navigator.getGamepads()).filter((g) => !!g && g.connected).length : 0);

    const readInput = (): InputState => {
      const keys = effective();
      const hit = (id: Action) => bindsRef.current[id].some((c) => keys.has(c));
      let left = hit("p1Left");
      let right = hit("p1Right");
      let up = hit("p1Up");
      let down = hit("p1Down");
      if (!world.coop) {
        if (keys.has("ArrowLeft")) left = true;
        if (keys.has("ArrowRight")) right = true;
        if (keys.has("ArrowUp")) up = true;
        if (keys.has("ArrowDown")) down = true;
      }
      const focus = hit("p1Focus") || (!world.coop && keys.has("ShiftRight"));
      const bomb = hit("p1Bomb");
      const edge = bomb && !bombLatch;
      bombLatch = bomb;
      const wingBomb = !!world.coop && hit("p2Bomb");
      const wingEdge = wingBomb && !wingBombLatch;
      wingBombLatch = wingBomb;
      const pads = padCount();
      // alone: pad 1 is the pilot. Two pilots, one pad: the pad is the wingman.
      const pad1 = !world.coop || pads >= 2 ? readPad(0) : idle;
      const pad2 = world.coop ? readPad(pads >= 2 ? 1 : 0) : idle;
      left = left || pad1.left;
      right = right || pad1.right;
      up = up || pad1.up;
      down = down || pad1.down;
      const keying = left || right || up || down;
      const keyFire = hit("p1Fire") || (!world.coop && keys.has("ControlRight")) || pad1.fire;
      const auto = world.meta.autoFire === true && world.mode === "play";
      return {
        left,
        right,
        up,
        down,
        focus: focus || pad1.focus,
        fire: mouseFire || touchFireRef.current || keyFire || auto,
        bomb: edge || pad1.bomb,
        pointer: null,
        drag: pointer.on && !keying && world.mode === "play" && world.player.alive ? takeDrag() : null,
        stick: { x: pad1.ax, y: pad1.ay },
        // desktop has a real second button; on touch it is left out, and the second weapon fires with the first
        alt: coarseRef.current ? undefined : hit("p1Alt") || mouseAlt || pad1.alt,
        wingStick: { x: pad2.ax, y: pad2.ay },
        wingAlt: (world.coop && hit("p2Alt")) || pad2.alt,
        wingLeft: (world.coop && hit("p2Left")) || pad2.left,
        wingRight: (world.coop && hit("p2Right")) || pad2.right,
        wingUp: (world.coop && hit("p2Up")) || pad2.up,
        wingDown: (world.coop && hit("p2Down")) || pad2.down,
        wingFocus: (world.coop && hit("p2Focus")) || pad2.focus,
        wingFire: (world.coop && hit("p2Fire")) || (auto && world.coop) || pad2.fire,
        wingBomb: wingEdge || pad2.bomb,
      };
    };

    const sync = () => setUi(readUi(world, sfx.muted));

    if (import.meta.env.DEV) {
      window.__controlsTest = {
        getYaw: () => 0,
        getSpeed: () => world.player.speedUp,
        getX: () => world.player.x,
        getY: () => world.player.y,
        getMode: () => world.mode,
        setGun: (n: number) => {
          world.player.weapon = Math.max(1, Math.min(6, n));
        },
        getGun: () => world.player.weapon,
        armMissiles: (n: number) => {
          world.player.missiles = n;
          world.player.missileCd = 0;
        },
        setLevel: (n: number) => {
          world.level = n;
        },
        shotReport: () => ({
          n: world.bullets.filter((b) => b.friendly).length,
          styles: world.bullets.filter((b) => b.friendly).map((b) => b.style ?? 0),
        }),
        getWorld: () => world,
        setKeys: (codes) => {
          override = codes.length ? codes : null;
          if (!codes.length) held.clear();
          bombLatch = false;
        },
      };
    }

    // Enter on the keyboard, or A / Start on a gamepad: go on from wherever we are
    const confirm = () => {
      sfx.unlock();
      const ctx = sfx.context();
      if (ctx) music.attach(ctx);
      if (world.mode === "menu") {
        setPick(false);
        chooseCrew(world, world.meta.crew === "coop" ? "coop" : "solo");
      } else if (world.mode === "clear") nextLevel(world);
      else if (world.mode === "bridge") skipBridge(world);
      else if (world.mode === "over") retryLevel(world);
      else if (world.mode === "pause") world.mode = "play";
      else if (world.mode === "victory") world.mode = "menu";
      else if (world.mode === "duelover") startDuel(world);
      else return;
      sfx.drone(world.mode === "play");
      sync();
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (captureRef.current) {
        e.preventDefault();
        if (e.code !== "Escape") {
          const id = captureRef.current;
          const next = { ...bindsRef.current, [id]: [e.code] };
          bindsRef.current = next;
          saveBinds(next);
          setBinds(next);
        }
        captureRef.current = null;
        setCapture(null);
        return;
      }
      if (e.repeat) {
        held.add(e.code);
        return;
      }
      held.add(e.code);
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
      if (e.code === "Enter") {
        if (world.mode === "arcadeover") {
          if (letterAt.current < 2) {
            letterAt.current += 1;
          } else {
            stampRank(world, initialsRef.current);
            leaveRun(world);
          }
          sync();
          return;
        }
        confirm();
      }
      if (world.mode === "bridge" && e.code === "KeyS") {
        openMode(world, "shop");
        sfx.drone(false);
        sync();
        return;
      }
      if (world.mode === "bridge") {
        const fires = new Set([...bindsRef.current.p1Fire, ...bindsRef.current.p2Fire, "KeyZ"]);
        if (fires.has(e.code)) {
          skipBridge(world);
          sfx.drone(true);
          sync();
          return;
        }
      }
      if (world.mode === "arcadeover" && (e.code === "ArrowUp" || e.code === "ArrowDown")) {
        e.preventDefault();
        const chars = initialsRef.current.padEnd(3, "A").slice(0, 3).split("");
        const i = letterAt.current;
        const code = chars[i]?.charCodeAt(0) ?? 65;
        const dir = e.code === "ArrowUp" ? 1 : -1;
        chars[i] = String.fromCharCode((((code - 65 + dir) % 26) + 26) % 26 + 65);
        const next = chars.join("");
        initialsRef.current = next;
        setInitials(next);
        return;
      }
      if (world.mode === "arcadeover" && (e.code === "ArrowRight" || e.code === "ArrowLeft")) {
        letterAt.current = (letterAt.current + (e.code === "ArrowRight" ? 1 : 2)) % 3;
        return;
      }
      if (import.meta.env.DEV && e.code === "F9") {
        world.dev = !world.dev;
        sync();
        return;
      }
      if (import.meta.env.DEV && e.code === "F8") {
        world.god = !world.god;
        setNotice(world.god ? "GOD ON" : "GOD OFF");
        window.setTimeout(() => setNotice(""), 800);
        sync();
        return;
      }
      if (e.code === "KeyF" && world.mode === "play") {
        const on = world.meta.autoFire !== true;
        setAutoFire(world, on);
        setNotice(on ? "AUTO FIRE ON" : "AUTO FIRE OFF");
        window.setTimeout(() => setNotice(""), 1000);
        sync();
      }
      if (e.code === "Escape" && world.mode === "menu") {
        setPick(false);
        sync();
        return;
      }
      if (e.code === "Escape" && world.mode === "duelover") {
        openMode(world, "menu");
        sync();
        return;
      }
      if (e.code === "Escape" || e.code === "KeyP") {
        if (world.mode === "play" && e.code === "KeyP") world.mode = "pause";
        else if (world.mode === "play" && e.code === "Escape") world.mode = "pause";
        else if (world.mode === "pause" && (e.code === "Escape" || e.code === "KeyP")) world.mode = "play";
        else if (world.mode === "shop" || world.mode === "options") closeOverlay(world);
        sfx.drone(world.mode === "play");
        sync();
      }
      if (e.code === "KeyM") {
        sfx.muted = !sfx.muted;
        setMuted(world, sfx.muted);
        sfx.drone(world.mode === "play");
        sync();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => held.delete(e.code);
    const clearHeld = () => held.clear();
    const onVis = () => {
      if (document.hidden) {
        held.clear();
        if (world.mode === "play") world.mode = "pause";
        saveNow(world);
        sync();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", clearHeld);
    document.addEventListener("visibilitychange", onVis);

    const onPointerDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement | null)?.closest("button")) return;
      sfx.unlock();
      if (world.mode === "bridge") {
        skipBridge(world);
        sfx.drone(true);
        sync();
        return;
      }
      const pt = toWorld(e.clientX, e.clientY);
      pointer.x = pt.x;
      pointer.y = pt.y;
      pointer.touch = e.pointerType === "touch";
      pointer.on = pointer.touch;
      dragX = 0;
      dragY = 0;
      mouseFire = !pointer.touch && e.button === 0;
      mouseAlt = !pointer.touch && e.button === 2;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const pt = toWorld(e.clientX, e.clientY);
      if (e.pointerType === "touch") {
        if (!pointer.on) return;
        // the ship moves as far as the finger does, wherever the finger is on the screen
        dragX += (pt.x - pointer.x) * DRAG_GAIN;
        dragY += (pt.y - pointer.y) * DRAG_GAIN;
        pointer.x = pt.x;
        pointer.y = pt.y;
        return;
      }
      mouseFire = (e.buttons & 1) === 1;
      mouseAlt = (e.buttons & 2) === 2;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") pointer.on = false;
      mouseFire = false;
      mouseAlt = false;
    };
    const onContext = (e: Event) => e.preventDefault();
    canvas.addEventListener("contextmenu", onContext);
    const onPointerLeave = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      mouseFire = false;
    };
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    canvas.addEventListener("pointerleave", onPointerLeave);

    let last = performance.now();
    let acc = 0;
    let hudAcc = 0;
    let shotGate = 0;
    let plinkN = 0;
    let lastMode = world.mode;
    let modeSince = performance.now();
    let raf = 0;
    const fixed = 1 / 60;

    const frame = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += delta;
      let steps = 0;
      if (world.mode !== "play") {
        // menus and pause still need the pads read, for A / Start
        readPad(0);
        readPad(1);
      }
      if (padPause && (world.mode === "play" || world.mode === "pause")) {
        world.mode = world.mode === "play" ? "pause" : "play";
        sync();
      } else if (padConfirm && world.mode !== "play" && world.mode !== "pause" && world.mode !== "bridge" && now - modeSince > 700) confirm();
      padPause = false;
      padConfirm = false;
      while (acc >= fixed && steps < 5) {
        const input = readInput();
        const shotBefore = world.player.fireCd;
        step(world, fixed, input);
        if (world.mode === "play" && world.player.alive && world.player.fireCd > shotBefore) shotGate = 1;
        acc -= fixed;
        steps += 1;
      }
      if (shotGate === 1) {
        sfx.shot(gunRank(world.player), world.player.feed > 0, world.player.x / WORLD_W * 2 - 1, world.player.family);
        shotGate = 0;
      }
      let killed = false;
      let big = false;
      let wet = false;
      let rude = false;
      plinkN = 0;
      for (const cue of world.cues) {
        if (cue === "kill") killed = true;
        else if (cue === "big") big = true;
        else if (cue === "splat") wet = true;
        else if (cue === "fart") rude = true;
        else if (cue === "flush") {
          sfx.flush();
          music.duck();
        }
        else if (cue === "valve") sfx.valve();
        else if (cue === "ready") sfx.ready();
        else if (cue === "card") sfx.card();
        else if (cue === "hit") sfx.armor();
        else if (cue === "graze") sfx.graze();
        else if (cue === "pickup") sfx.pickup();
        else if (cue === "hurt") {
          sfx.hurt();
          music.duck();
        }
        else if (cue === "shield") sfx.shield();
        else if (cue === "bomb") {
          sfx.bomb();
          music.duck();
        }
        else if (cue === "wave") sfx.wave();
        else if (cue === "boss") sfx.boss();
        else if (cue === "clean") sfx.clean();
        else if (cue === "drive") sfx.drive();
        else if (cue === "missile") sfx.missile();
        else if (cue === "plink") sfx.plink(plinkN++);
      }
      world.cues.length = 0;
      if (big) sfx.kill(true);
      else if (rude) sfx.fart();
      else if (wet) sfx.splat();
      else if (killed) sfx.kill(false);

      const dpr = layout.dpr || Math.min(window.devicePixelRatio || 1, 2);
      const view = VIEW || 1;
      ctx.setTransform(dpr * view, 0, 0, dpr * view, 0, 0);
      ctx.clearRect(0, 0, WORLD_W, WORLD_H);
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, WORLD_W, WORLD_H);
      ctx.clip();
      const keys = effective();
      drawWorld(ctx, world, keys.has("ShiftLeft") || keys.has("ShiftRight"));
      ctx.restore();

      const audio = sfx.context();
      if (audio) music.attach(audio);
      const muted = world.meta.mute;
      sfx.volume = muted ? 0 : world.meta.sfx / 100;
      music.setVolume(muted ? 0 : world.meta.music / 100);
      const menuish = world.mode === "menu" || world.mode === "shop" || world.mode === "options" || world.mode === "levels" || world.mode === "guide" || world.mode === "ranks";
      const live = world.mode === "play" || world.mode === "bridge" || world.mode === "pause" || world.mode === "clear";
      if (!muted && world.meta.music > 0 && (menuish || live)) music.play(Math.floor((Math.max(1, world.level) - 1) / 10) + 1, world.bossUp && world.mode === "play", menuish);
      else music.stop();
      if (audio) music.tick(audio.currentTime, world.enemies.length, ((world.level - 1) % 10) + 1 === 9);

      hudAcc += delta;
      if (world.mode !== lastMode || hudAcc > 0.15) {
        if (world.mode === "pause" && lastMode === "play" && !world.duel) {
          saveNow(world);
          setNotice("SAVED");
          window.setTimeout(() => setNotice(""), 1000);
        }
        if (world.mode !== lastMode) {
          sfx.drone(world.mode === "play");
          modeSince = now;
        }
        lastMode = world.mode;
        hudAcc = 0;
        sync();
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    sync();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", clearHeld);
      document.removeEventListener("visibilitychange", onVis);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("contextmenu", onContext);
      sfx.drone(false);
      music.stop();
      if (import.meta.env.DEV) delete window.__controlsTest;
    };
  }, []);

  const act = (fn: (world: World) => void) => {
    const world = worldRef.current;
    const sfx = sfxRef.current;
    if (!world || !sfx) return;
    sfx.unlock();
    fn(world);
    sfx.drone(world.mode === "play");
    setUi(readUi(world, sfx.muted));
  };

  const bomb = () => {
    const world = worldRef.current;
    sfxRef.current?.unlock();
    if (world) requestBomb(world);
  };

  const money = ui.dollars.toLocaleString("en-US");

  return (
    <main className="fixed inset-0 select-none overflow-hidden bg-bg text-ink">
      <canvas ref={canvasRef} className="absolute inset-0 z-0 h-full w-full touch-none" aria-label="Wingbreaker playfield" />

      <div className="pointer-events-none absolute top-4 right-4 z-40 flex items-center gap-1.5 font-display text-xl text-ink">
        <DollarSign className="h-5 w-5 text-ember" strokeWidth={2.25} aria-hidden />
        <span>{money}</span>
      </div>
      {notice && (
        <p className="pointer-events-none absolute top-12 right-4 z-40 font-display text-sm tracking-[0.16em] text-ember">{notice}</p>
      )}

      {ui.mode === "menu" && (
        <div className="absolute inset-0 z-20 overflow-y-auto">
          <div className="pointer-events-none absolute inset-y-0 left-0 hidden w-[min(62vw,800px)] bg-gradient-to-r from-bg/90 via-bg/55 to-transparent lg:block" />
          <div className="menu-rise relative mx-auto flex min-h-full w-[min(92vw,440px)] flex-col justify-center gap-3 py-10 lg:mx-0 lg:ml-[7vw]">
            <header>
              <p className="font-display text-xs tracking-[0.5em] text-ember">VERTICAL SORTIE</p>
              <h1 className="logo w-max max-w-none font-display text-[clamp(2.2rem,11vw,2.9rem)] leading-[0.95] font-bold tracking-wide whitespace-nowrap lg:text-7xl">WINGBREAKER</h1>
              <p className="mt-2 text-sm text-muted">Too many critters. Too many guns. A worrying amount of poop.</p>
            </header>

            <p className="flex flex-wrap gap-x-4 gap-y-1 font-display text-sm tracking-[0.16em] text-muted">
              <span>
                LEVEL <span className="text-ink">{String(ui.mission).padStart(3, "0")}</span>/100
                {ui.loop > 0 && <span className="text-ember"> · NEW GAME+{ui.loop > 1 ? ` ${ui.loop}` : ""}</span>}
              </span>
              <span>
                <span className="text-ember">★</span> <span className="text-ink">{ui.stars}</span>
              </span>
              {ui.best > 0 && (
                <span>
                  BEST <span className="text-ink">{ui.best.toLocaleString("en-US")}</span>
                </span>
              )}
              {ui.cleared && <span className="text-ember">WATCH BROKEN</span>}
            </p>

            <div className="flex flex-col gap-2">
              <button
                type="button"
                className="btn-sheen relative flex h-16 w-full items-center justify-between overflow-hidden border border-ember bg-ember px-5 text-left font-display text-2xl font-semibold tracking-[0.16em] text-bg shadow-[0_0_30px_rgba(224,122,61,0.35)] hover:brightness-110"
                onClick={() => act((w) => chooseCrew(w, touch ? "solo" : ui.crew))}
              >
                <span>{ui.hasSave ? "CONTINUE" : "NEW GAME"}</span>
                <span className="text-right text-xs leading-tight font-medium tracking-[0.14em]">
                  <span className="block">LEVEL {String(ui.hasSave ? ui.mission : 1).padStart(3, "0")}</span>
                  <span className="block opacity-80">{(ui.hasSave ? ui.nextChapter : "Old Bathroom").toUpperCase()}</span>
                </span>
              </button>
              {ui.hasSave && (
                <button
                  type="button"
                  className="flex h-14 w-full items-center justify-between border border-ink/40 bg-bg/70 px-5 text-left font-display text-xl tracking-[0.16em] text-ink backdrop-blur-sm hover:border-ember hover:text-ember"
                  onClick={() => setPick(true)}
                >
                  <span>NEW GAME</span>
                  <span className="text-xs tracking-[0.14em] text-muted">FROM LEVEL 001</span>
                </button>
              )}
            </div>

            {!touch && (
              <div>
                <div className="grid grid-cols-2 gap-2">
                  {(["solo", "coop"] as const).map((crew) => (
                    <button
                      key={crew}
                      type="button"
                      aria-pressed={ui.crew === crew}
                      className={`flex h-11 items-center justify-center border font-display text-base tracking-[0.16em] backdrop-blur-sm ${ui.crew === crew ? "border-ember bg-ember/15 text-ember" : "border-line bg-bg/70 text-muted hover:border-ink/50 hover:text-ink"}`}
                      onClick={() => act((w) => setCrew(w, crew))}
                    >
                      {crew === "solo" ? "1 PILOT" : "2 PILOTS"}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-muted">
                  {ui.crew === "coop"
                    ? "Pilot: WASD, Z fires, Space bombs. Wingman: arrows, K fires, L bombs. Or plug in gamepads. Revive a downed partner by flying over the wreck. Fill both Super Flush bars, then both press bomb."
                    : "WASD move · Z or click shoot · C second weapon · Space bomb · Shift slow · P pause. A gamepad works too."}
                </p>
                <button
                  type="button"
                  className="mt-2 flex h-14 w-full items-center justify-between border border-line bg-bg/70 px-4 text-left backdrop-blur-sm hover:border-ember"
                  onClick={() => act((w) => startDuel(w))}
                >
                  <span className="font-display text-lg tracking-[0.14em] text-ink">DUEL</span>
                  <span className="text-right text-xs leading-tight text-muted">
                    <span className="block">Pilot against pilot, first to 3 rounds</span>
                    <span className="block">Bottom: WASD + Z · Top: arrows + K</span>
                  </span>
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["ARCADE", "No continues, no end", () => act((w) => startArcade(w, false))],
                  ["DAILY", ui.dailyPlayed ? "Training run" : "One official run a day", () => act((w) => startArcade(w, true))],
                  ["LEVELS", `${ui.stars} of 300 stars`, () => act((w) => openMode(w, "levels"))],
                  ["SHOP", `$${money} to spend`, () => act((w) => openMode(w, "shop"))],
                  ["RANKS", "Top ten and achievements", () => act((w) => openMode(w, "ranks"))],
                  [
                    "OPTIONS",
                    "Sound, keys, field guide",
                    () => {
                      setArmReset(false);
                      setCapture(null);
                      act((w) => openMode(w, "options"));
                    },
                  ],
                ] as const
              ).map(([title, sub, go]) => (
                <button
                  key={title}
                  type="button"
                  className="flex h-16 flex-col justify-center border border-line bg-bg/70 px-4 text-left backdrop-blur-sm hover:border-ember"
                  onClick={go}
                >
                  <span className="font-display text-lg leading-tight tracking-[0.14em] text-ink">{title}</span>
                  <span className="text-xs leading-tight text-muted">{sub}</span>
                </button>
              ))}
            </div>

            <p className="text-xs leading-relaxed text-muted">{tip}</p>
          </div>
        </div>
      )}

      {pick && ui.mode === "menu" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
          <div className="flex w-[min(92vw,420px)] flex-col gap-2 px-5">
            <p className="font-display text-sm tracking-[0.28em] text-muted">NEW GAME</p>
            <h2 className="font-display text-4xl tracking-wide">START FROM LEVEL 1?</h2>
            <p className="text-sm text-muted">
              You are on level {String(ui.mission).padStart(3, "0")}. A new game goes back to the first level. Your cash, upgrades, ships and stars stay.
            </p>
            <div className="grid grid-cols-3 gap-2">
              {DIFFICULTY.map((d, i) => (
                <button
                  key={d.name}
                  type="button"
                  aria-pressed={ui.difficulty === i}
                  className={`flex h-10 items-center justify-center border font-display text-sm tracking-[0.14em] ${
                    ui.difficulty === i ? "border-ember bg-ember/15 text-ember" : "border-line bg-bg/70 text-muted hover:text-ink"
                  }`}
                  onClick={() => act((w) => setDifficulty(w, i))}
                >
                  {d.name}
                </button>
              ))}
            </div>
            <p className="text-xs text-muted">{DIFFICULTY[ui.difficulty]?.blurb}</p>
            <button
              type="button"
              className="flex h-14 w-full items-center justify-between border border-ember bg-ember px-5 font-display text-xl font-semibold tracking-[0.16em] text-bg hover:brightness-110"
              onClick={() =>
                act((w) => {
                  setPick(false);
                  newMission(w);
                  chooseCrew(w, touch ? "solo" : ui.crew);
                })
              }
            >
              <span>START NEW GAME</span>
            </button>
            <button type="button" className={row} onClick={() => setPick(false)}>
              <span>CANCEL</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "shop" && (
        <Shop
          dollars={ui.dollars}
          power={ui.power}
          upgrades={ui.upgrades}
          gun={ui.gun}
          gun2={ui.gun2}
          guns={ui.guns}
          skin={ui.skin}
          skin2={ui.skin2}
          owned={ui.owned}
          level={ui.level}
          seat={seat}
          setSeat={setSeat}
          onPower={() => act((w) => purchasePower(w))}
          onGun={(family, who) => act((w) => purchaseGun(w, family, who))}
          onUpgrade={(id) => act((w) => purchaseUpgrade(w, id))}
          onSkin={(id, mine, who) => act((w) => (mine ? wearSkin(w, id, who) : purchaseSkin(w, id, who)))}
          onBack={() => act((w) => closeOverlay(w))}
        />
      )}

      {ui.mode === "options" && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-bg/80">
          <div className="mx-auto flex min-h-full w-[min(94vw,640px)] flex-col justify-center gap-2 px-5 py-16">
            <h2 className="mb-2 font-display text-4xl tracking-wide">OPTIONS</h2>
            <button
              type="button"
              className={row}
              onClick={() =>
                act((w) => {
                  const sfx = sfxRef.current;
                  if (!sfx) return;
                  sfx.muted = !sfx.muted;
                  setMuted(w, sfx.muted);
                })
              }
            >
              <span>SOUND</span>
              <span className="text-sm text-muted">{ui.muted ? "OFF" : "ON"}</span>
            </button>
            <button type="button" className={row} disabled={ui.lockShake} onClick={() => act((w) => setShake(w, !w.meta.shake))}>
              <span>SHAKE</span>
              <span className="text-sm text-muted">{ui.lockShake ? "SYSTEM" : ui.shake ? "ON" : "OFF"}</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => setAutoFire(w, w.meta.autoFire !== true))}>
              <span>AUTO FIRE</span>
              <span className="text-sm text-muted">{ui.autoFire ? "ON" : "OFF"}</span>
            </button>
            <button type="button" className={`${row} h-auto min-h-12 py-2`} onClick={() => act((w) => setDifficulty(w, ((w.meta.difficulty ?? 1) + 1) % 3))}>
              <span className="min-w-0">
                <span className="block">DIFFICULTY</span>
                <span className="block text-xs normal-case tracking-normal text-muted">{DIFFICULTY[ui.difficulty]?.blurb}</span>
              </span>
              <span className="shrink-0 text-sm text-ember">{DIFFICULTY[ui.difficulty]?.name}</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => setAutoNext(w, !w.meta.autoAdvance))}>
              <span>AUTO NEXT</span>
              <span className="text-sm text-muted">{ui.autoNext ? "ON" : "OFF"}</span>
            </button>
            <label className={`${row} cursor-pointer`}>
              <span>MUSIC</span>
              <input
                type="range"
                min={0}
                max={100}
                value={ui.music}
                aria-label="Music volume"
                onChange={(e) => act((w) => setMusic(w, Number(e.target.value)))}
              />
            </label>
            <label className={`${row} cursor-pointer`}>
              <span>SFX</span>
              <input
                type="range"
                min={0}
                max={100}
                value={ui.sfx}
                aria-label="Effects volume"
                onChange={(e) => act((w) => setSfx(w, Number(e.target.value)))}
              />
            </label>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "guide"))}>
              <span>FIELD GUIDE</span>
            </button>
            <p className="mt-3 font-display text-sm tracking-[0.22em] text-muted">CONTROLS</p>
            <p className="text-xs text-muted">Click a row, then press the new key. Escape cancels.</p>
            <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
              {ACTIONS.map((rowItem) => (
                <button
                  key={rowItem.id}
                  type="button"
                  className={`${row} h-10 text-sm`}
                  onClick={() => setCapture(rowItem.id)}
                >
                  <span>
                    {rowItem.group === "Pilot" ? "P1" : "P2"} {rowItem.label}
                  </span>
                  <span className="text-ember">{capture === rowItem.id ? "KEY?" : binds[rowItem.id].map(codeLabel).join(" / ")}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              className={row}
              onClick={() => {
                setBinds(DEFAULT_BINDS);
                saveBinds(DEFAULT_BINDS);
                setCapture(null);
              }}
            >
              <span>RESET KEYS</span>
            </button>
            <button
              type="button"
              className={row}
              onClick={() => {
                if (!armReset) {
                  setArmReset(true);
                  return;
                }
                setArmReset(false);
                act((w) => newMission(w));
              }}
            >
              <span>NEW RUN</span>
              <span className="text-sm text-ember">{armReset ? "REALLY" : "LEVEL 1"}</span>
            </button>
            <p className="text-xs text-muted">A new run clears the level and the score. Cash, ships and upgrades stay.</p>
            <button type="button" className={`${row} mt-2`} onClick={() => { setCapture(null); act((w) => closeOverlay(w)); }}>
              <span>BACK</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "pause" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/55">
          <div className="flex w-[min(92vw,320px)] flex-col gap-2 px-5">
            <p className="text-center font-display text-4xl tracking-[0.2em]">PAUSED</p>
            <p className="text-center font-display text-2xl text-muted">
              {ui.duel ? `DUEL · ${ui.duel.wins[0]} : ${ui.duel.wins[1]}` : String(ui.score).padStart(6, "0")}
            </p>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "play"))}>
              <span>RESUME</span>
            </button>
            <button type="button" className={row} onClick={() => { setCapture(null); act((w) => openMode(w, "options")); }}>
              <span>OPTIONS</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "menu"))}>
              <span>MENU</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "bridge" && (
        <div className="absolute inset-x-0 top-16 z-20 flex justify-center px-4">
          <div
            className="w-[min(92vw,420px)] border border-line bg-bg/85 px-4 py-3 text-center"
            onClick={() => act((w) => skipBridge(w))}
          >
            <p className="font-display text-lg tracking-[0.08em]">
              {ui.perfect ? "CLEAN" : "BREACH"} · +${ui.clearCash.toLocaleString("en-US")} · {ui.starLine || "★"}
            </p>
            {ui.coop && <p className="mt-1 font-display text-sm tracking-[0.12em] text-ember">{crewLine(ui.tally)}</p>}
            <p className="mt-1 text-sm italic text-cold">{ui.quip}</p>
            <button
              type="button"
              className={`${row} mt-3 h-10`}
              onClick={(e) => {
                e.stopPropagation();
                act((w) => openMode(w, "shop"));
              }}
            >
              <span>S – SHOP</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "clear" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/60 backdrop-blur-[2px]">
          <div className="menu-rise flex w-[min(92vw,400px)] flex-col gap-2 border border-line bg-bg/85 px-5 py-5">
            <p className="font-display text-xs tracking-[0.32em] text-muted">
              {ui.arcade ? (ui.daily ? `DAILY · STAGE ${ui.arcadeStage}/30` : `ARCADE · STAGE ${ui.arcadeStage}`) : `${ui.chapter.toUpperCase()} · LEVEL ${String(ui.level).padStart(3, "0")}`}
            </p>
            <h2 className="font-display text-4xl leading-none font-semibold tracking-wide">
              {!ui.arcade && ui.level % 10 === 0 ? "CHAPTER CLEAR" : ui.perfect && ui.slain >= ui.born ? "CLEAN SWEEP" : "LEVEL CLEAR"}
            </h2>
            {!ui.arcade && (
              <p className="stars font-display text-4xl leading-none text-ember" aria-label={`${(ui.starLine.match(/★/g) ?? []).length} of 3 stars`}>
                {(ui.starLine || "★☆☆").split("").map((ch, i) => (
                  <span key={i} className={ch === "★" ? "" : "opacity-25"} style={{ animationDelay: `${0.25 + i * 0.18}s` }}>
                    ★
                  </span>
                ))}
              </p>
            )}
            <dl className="mt-1 grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 text-sm">
              <dt className="text-muted">{ui.arcade ? "Banked for the hangar" : ui.replay ? "Cash (replays pay half)" : "Cash"}</dt>
              <dd className="text-right font-display text-lg leading-none text-ember">+${ui.clearCash.toLocaleString("en-US")}</dd>
              <dt className="text-muted">Shot down</dt>
              <dd className="text-right font-display text-lg leading-none">
                {ui.slain}/{ui.born}
              </dd>
              <dt className="text-muted">No hits taken</dt>
              <dd className={`text-right font-display text-lg leading-none ${ui.perfect ? "text-cold" : "text-muted"}`}>{ui.perfect ? "YES" : "NO"}</dd>
              <dt className="text-muted">No bombs used</dt>
              <dd className={`text-right font-display text-lg leading-none ${ui.noBomb ? "text-cold" : "text-muted"}`}>{ui.noBomb ? "YES" : "NO"}</dd>
            </dl>
            {ui.coop &&
              (() => {
                const v = versus(ui.tally, ui.level);
                return (
                  <div className="mt-1 border border-line bg-bg/60 px-3 py-2">
                    <div className="grid grid-cols-2 gap-3">
                      {[0, 1].map((i) => (
                        <div key={i} className={i === 1 ? "text-right" : ""}>
                          <p className="font-display text-xs tracking-[0.2em]" style={{ color: i === 0 ? "#ff6b4a" : "#35d0c0" }}>
                            PILOT {i + 1}
                          </p>
                          <p className="font-display text-4xl leading-none">{ui.tally[i]}</p>
                          <p className={`mt-1 font-display text-sm leading-tight tracking-[0.08em] ${v.lead === i ? "text-ember" : "italic text-muted"}`}>
                            {v.titles[i]}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-center font-display text-xs tracking-[0.2em] text-muted">
                      LEVELS WON · {ui.series[0]} : {ui.series[1]}
                    </p>
                  </div>
                );
              })()}
            <p className="text-sm italic text-cold">{ui.quip}</p>
            <button
              type="button"
              className="btn-sheen relative mt-1 flex h-14 w-full items-center justify-between overflow-hidden border border-ember bg-ember px-5 text-left font-display text-xl font-semibold tracking-[0.16em] text-bg hover:brightness-110"
              onClick={() => act((w) => nextLevel(w))}
            >
              <span>{ui.arcade ? "NEXT STAGE" : ui.level % 10 === 0 ? "NEXT CHAPTER" : "NEXT LEVEL"}</span>
              <span className="text-xs font-medium tracking-[0.14em]">
                {touch ? "" : "ENTER"}
              </span>
            </button>
            <div className="grid grid-cols-2 gap-2">
              {ui.arcade ? (
                <button type="button" className={`${row} col-span-2`} onClick={() => act((w) => leaveRun(w))}>
                  <span>QUIT ARCADE</span>
                </button>
              ) : (
                <>
                  <button type="button" className={row} onClick={() => act((w) => openMode(w, "shop"))}>
                    <span>SHOP</span>
                  </button>
                  <button type="button" className={row} onClick={() => act((w) => (ui.replay ? backToLevels(w) : leaveRun(w)))}>
                    <span>{ui.replay ? "LEVELS" : "MENU"}</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {ui.mode === "duelover" && ui.duel && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/65 backdrop-blur-[2px]">
          <div className="menu-rise flex w-[min(92vw,400px)] flex-col gap-2 border border-line bg-bg/85 px-5 py-5 text-center">
            <p className="font-display text-xs tracking-[0.32em] text-muted">DUEL</p>
            <h2
              className="font-display text-5xl leading-none font-semibold tracking-wide"
              style={{ color: ui.duel.wins[0] > ui.duel.wins[1] ? "#ff6b4a" : "#35d0c0" }}
            >
              PILOT {ui.duel.wins[0] > ui.duel.wins[1] ? 1 : 2} WINS
            </h2>
            <p className="font-display text-4xl leading-none">
              {ui.duel.wins[0]} : {ui.duel.wins[1]}
            </p>
            <p className="text-sm italic text-cold">{ui.duel.taunt}</p>
            <button
              type="button"
              className="btn-sheen relative mt-1 flex h-14 w-full items-center justify-between overflow-hidden border border-ember bg-ember px-5 text-left font-display text-xl font-semibold tracking-[0.16em] text-bg hover:brightness-110"
              onClick={() => act((w) => startDuel(w))}
            >
              <span>REMATCH</span>
              <span className="text-xs font-medium tracking-[0.14em]">ENTER</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "menu"))}>
              <span>MENU</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "over" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/60">
          <div className="flex w-[min(92vw,380px)] flex-col gap-2 px-5">
            <p className="font-display text-sm tracking-[0.28em] text-muted">DOWN</p>
            <p className="font-display text-5xl">{String(ui.score).padStart(6, "0")}</p>
            <p className="text-sm text-muted">Level {String(ui.level).padStart(3, "0")} · {ui.chapter}</p>
            <p className={`font-display text-lg ${ui.record ? "text-ember" : "text-cold"}`}>
              {ui.record ? "NEW BEST" : `BEST ${String(ui.best).padStart(6, "0")}`}
            </p>
            <p className="text-sm italic text-cold">{ui.deathLine}</p>
            <p className="text-xs text-muted">Cash stays. Guns and lives return to the hangar kit.</p>
            <button type="button" className={row} onClick={() => act((w) => retryLevel(w))}>
              <span>AGAIN</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "shop"))}>
              <span>SHOP</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "menu"))}>
              <span>MENU</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "victory" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70">
          <div className="flex w-[min(92vw,420px)] flex-col gap-2 px-5">
            <p className="font-display text-sm tracking-[0.28em] text-muted">LEVEL 100</p>
            <h2 className="font-display text-4xl tracking-wide">THE EMPIRE HAS FALLEN</h2>
            <p className="font-display text-3xl">{String(ui.score).padStart(6, "0")}</p>
            <p className="text-sm text-muted">The Toilet King does not come back. The hangar stays.</p>
            <div className="max-h-40 space-y-1 overflow-hidden text-xs italic text-cold">
              {CREDITS.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "menu"))}>
              <span>MENU</span>
            </button>
            <button
              type="button"
              className="flex h-14 w-full items-center justify-between border border-ember bg-ember px-5 text-left font-display text-xl font-semibold tracking-[0.16em] text-bg hover:brightness-110"
              onClick={() => act((w) => newLoop(w))}
            >
              <span>NEW GAME+</span>
              <span className="text-right text-xs font-medium leading-tight tracking-[0.1em]">
                <span className="block">TOUGHER CRITTERS</span>
                <span className="block">+50% CASH</span>
              </span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => newMission(w))}>
              <span>START OVER</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "levels" && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-bg/85">
          <div className="mx-auto flex w-[min(96vw,720px)] flex-col gap-3 px-4 py-16">
            <p className="font-display text-sm tracking-[0.28em] text-muted">CAMPAIGN</p>
            <h2 className="font-display text-4xl tracking-wide">LEVELS</h2>
            <p className="text-xs text-muted">Replays pay half. The frontier still pays full.</p>
            {CHAPTERS.map((ch, ci) => (
              <div key={ch.name}>
                <p className="mb-1 font-display text-sm tracking-[0.16em] text-muted">{String(ci + 1).padStart(2, "0")} {ch.name.toUpperCase()}</p>
                <div className="grid grid-cols-5 gap-1 sm:grid-cols-10">
                  {Array.from({ length: 10 }, (_, k) => {
                    const n = ci * 10 + k + 1;
                    const stars = ui.starsGrid[n] ?? 0;
                    const open = n <= ui.mission || stars > 0;
                    return (
                      <button
                        key={n}
                        type="button"
                        disabled={!open}
                        className="h-12 border border-line bg-bg/80 font-display text-xs tracking-wide text-ink disabled:opacity-30"
                        onClick={() => act((w) => practiceLevel(w, n))}
                      >
                        <span className="block">{String(n).padStart(2, "0")}</span>
                        <span className="block text-[10px] text-ember">{"★".repeat(stars)}{"☆".repeat(Math.max(0, 3 - stars))}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "menu"))}>
              <span>MENU</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "guide" && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-bg/85">
          <div className="mx-auto flex w-[min(94vw,560px)] flex-col gap-2 px-5 py-16">
            <h2 className="font-display text-4xl tracking-wide">FIELD GUIDE</h2>
            <div className="grid grid-cols-2 gap-1">
              {GUIDE.map((entry) => {
                const known = ui.seen.includes(entry.id);
                return (
                  <button
                    key={entry.id}
                    type="button"
                    className={`${row} h-10 text-sm ${guideId === entry.id ? "border-ember" : ""} ${known ? "" : "opacity-40"}`}
                    onClick={() => known && setGuideId(entry.id)}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <img src={`/art/${entry.art}.webp`} alt="" className={`h-7 w-7 shrink-0 object-contain ${known ? "" : "brightness-0 opacity-60"}`} />
                      <span className="truncate">{known ? entry.name : "???"}</span>
                    </span>
                  </button>
                );
              })}
            </div>
            {(() => {
              const pick = GUIDE.find((g) => g.id === guideId && ui.seen.includes(g.id));
              return (
                <div className="flex min-h-[88px] items-center gap-4 border border-line bg-bg/70 px-4 py-3">
                  {pick && <img src={`/art/${pick.art}.webp`} alt="" className="h-16 w-16 shrink-0 object-contain" />}
                  <p className="text-sm italic text-cold">{pick?.line ?? "Not logged yet. Go and get shot at by it."}</p>
                </div>
              );
            })()}
            <button type="button" className={row} onClick={() => act((w) => { w.mode = "options"; })}>
              <span>BACK</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "ranks" && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-bg/85">
          <div className="mx-auto flex w-[min(92vw,420px)] flex-col gap-2 px-5 py-16">
            <h2 className="font-display text-4xl tracking-wide">RANKS</h2>
            {ui.ranks.length === 0 && <p className="text-sm text-muted">Nobody has crashed the arcade yet.</p>}
            {ui.ranks.map((rank, i) => (
              <p key={`${rank.name}-${rank.score}-${i}`} className="flex justify-between font-display text-lg">
                <span>{i + 1} {rank.name}</span>
                <span className="text-ember">{String(rank.score).padStart(6, "0")} · {rank.stage}</span>
              </p>
            ))}
            <h2 className="mt-4 font-display text-4xl tracking-wide">ACHIEVEMENTS</h2>
            <p className="text-sm text-muted">
              {ui.feats.length} of {FEATS.length} earned. Each one pays cash the moment you earn it.
            </p>
            {FEATS.map((f) => {
              const got = ui.feats.includes(f.id);
              return (
                <div key={f.id} className={`flex items-center justify-between gap-3 border px-3 py-2 ${got ? "border-ember/70 bg-ember/10" : "border-line bg-bg/60"}`}>
                  <span className="min-w-0">
                    <span className={`block font-display text-base tracking-[0.1em] ${got ? "text-ink" : "text-muted"}`}>{f.name.toUpperCase()}</span>
                    <span className="block text-xs text-muted">{f.blurb}</span>
                  </span>
                  <span className={`shrink-0 font-display text-sm ${got ? "text-ember" : "text-muted"}`}>{got ? "DONE" : `$${f.cash}`}</span>
                </div>
              );
            })}
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "menu"))}>
              <span>MENU</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "arcadeover" && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/70">
          <div className="flex w-[min(92vw,420px)] flex-col gap-2 px-5">
            <p className="font-display text-sm tracking-[0.28em] text-muted">ARCADE</p>
            <p className="font-display text-5xl">{String(ui.score).padStart(6, "0")}</p>
            <p className="text-sm text-muted">Stage {ui.arcadeStage}</p>
            <p className="font-display text-xl text-ember">ARCADE PAYOUT +${ui.clearCash.toLocaleString("en-US")}</p>
            <p className="text-xs text-muted">Three letters. Arrows pick a letter. Enter signs the board.</p>
            <input
              value={initials}
              maxLength={3}
              aria-label="Initials"
              onChange={(e) => setInitials(e.target.value.toUpperCase().replace(/[^A-Z]/g, "").slice(0, 3))}
              className="h-12 border border-line bg-bg px-3 font-display text-2xl tracking-[0.4em] text-ink"
            />
            <button
              type="button"
              className={row}
              onClick={() => act((w) => {
                stampRank(w, initials.padEnd(3, "A"));
                leaveRun(w);
              })}
            >
              <span>SIGN</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => startArcade(w, false))}>
              <span>AGAIN</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => leaveRun(w))}>
              <span>MENU</span>
            </button>
          </div>
        </div>
      )}

      {touch && ui.mode === "play" && (
        <button
          type="button"
          aria-label="Pause"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            act((w) => {
              w.mode = "pause";
            });
          }}
          className="absolute top-14 right-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-line bg-bg font-display text-sm text-ink"
          style={{ opacity: 0.6 }}
        >
          II
        </button>
      )}

      {touch && ui.mode === "play" && (
        <button
          type="button"
          aria-label="Auto fire"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            act((w) => setAutoFire(w, w.meta.autoFire !== true));
          }}
          className={`absolute left-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border font-display text-[10px] tracking-wide ${ui.autoFire ? "border-ember bg-ember text-bg" : "border-line bg-bg text-muted"}`}
          style={{ opacity: 0.55, bottom: ui.autoFire ? 32 : 96 }}
        >
          AUTO
        </button>
      )}

      {touch && ui.mode === "play" && !ui.autoFire && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            touchFireRef.current = true;
            sfxRef.current?.unlock();
          }}
          onPointerUp={() => {
            touchFireRef.current = false;
          }}
          onPointerCancel={() => {
            touchFireRef.current = false;
          }}
          className="absolute bottom-8 left-4 z-30 h-14 w-20 border border-line bg-bg/80 font-display text-sm tracking-wide text-ink"
        >
          FIRE
        </button>
      )}

      {touch && ui.mode === "play" && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            bomb();
          }}
          className="absolute right-4 bottom-8 z-30 h-14 w-14 border border-line bg-bg/80 font-display text-sm tracking-wide text-ink"
        >
          BOMB
        </button>
      )}
    </main>
  );
}
