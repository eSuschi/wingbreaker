import { useEffect, useRef, useState } from "react";
import { DollarSign } from "lucide-react";
import { Sfx } from "./audio";
import { Music } from "./music";
import { chapterOf, CHAPTERS, quipFor, SKINS, UPGRADE_LIST, starTotal, type SkinId, type UpgradeId } from "./meta";
import { CREDITS, GUIDE, TIPS, daySeed, type GunFamily } from "./v3";
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
  setCoarsePointer,
  setMuted,
  setReduceMotion,
  setShake,
  skipBridge,
  startArcade,
  setMusic,
  setSfx,
  purchaseGun,
  step,
  fitWorld,
  newMission,
  purchaseSkin,
  purchaseUpgrade,
  wearSkin,
  practiceLevel,
  stampRank,
  leaveRun,
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
  owned: SkinId[];
  upgrades: Record<UpgradeId, number>;
  cleared: boolean;
  lockShake: boolean;
  quip: string;
  autoFire: boolean;
  autoNext: boolean;
  stars: number;
  music: number;
  sfx: number;
  deathLine: string;
  starLine: string;
  seen: string[];
  starsGrid: number[];
  ranks: { name: string; score: number; stage: number; date: string }[];
  gun: GunFamily;
  guns: GunFamily[];
  arcadeStage: number;
  dailyPlayed: boolean;
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
    owned: world.meta.owned.slice(),
    upgrades: { ...world.meta.upgrades },
    cleared: world.meta.cleared,
    lockShake: world.lockShake,
    quip: quipFor(world.level),
    autoFire: world.meta.autoFire === true,
    autoNext: world.meta.autoNext !== false,
    stars: starTotal(world.meta),
    music: world.meta.music,
    sfx: world.meta.sfx,
    deathLine: world.deathLine,
    starLine: world.starShow,
    seen: world.meta.seen.slice(),
    starsGrid: world.meta.stars.slice(),
    ranks: world.meta.ranks.map((r) => ({ name: r.name, score: r.score, stage: r.stage, date: r.date })),
    gun: world.meta.gun,
    guns: world.meta.guns.slice(),
    arcadeStage: world.arcadeStage,
    dailyPlayed: world.meta.dailyDay === daySeed().key && world.meta.dailyScore > 0,
  };
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
    chapter: "Rust Nebula",
    nextChapter: "Rust Nebula",
    hasSave: false,
    skin: "steel",
    owned: ["steel"],
    upgrades: { hull: 0, magazine: 0, capacitor: 0, magnet: 0, salvage: 0, trigger: 0, wings: 0, luck: 0, salvo: 0, insurance: 0, pockets: 0 },
    cleared: false,
    lockShake: false,
    quip: quipFor(1),
    autoFire: false,
    autoNext: true,
    stars: 0,
    music: 55,
    sfx: 80,
    deathLine: "",
    starLine: "",
    seen: [],
    starsGrid: [],
    ranks: [],
    gun: "pulse",
    guns: ["pulse"],
    arcadeStage: 0,
    dailyPlayed: false,
  });
  const [touch, setTouch] = useState(false);
  const [notice, setNotice] = useState("");
  const [armReset, setArmReset] = useState(false);
  const [pick, setPick] = useState(false);
  const [binds, setBinds] = useState<Binds>(() => loadBinds());
  const [capture, setCapture] = useState<Action | null>(null);
  const [guideId, setGuideId] = useState("dart");
  const [initials, setInitials] = useState("AAA");
  const [tip, setTip] = useState(TIPS[0]);
  const touchFireRef = useRef(false);
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
      const keying = left || right || up || down;
      const keyFire = hit("p1Fire") || (!world.coop && keys.has("ControlRight"));
      const auto = world.meta.autoFire === true && world.mode === "play";
      return {
        left,
        right,
        up,
        down,
        focus,
        fire: mouseFire || touchFireRef.current || keyFire || auto,
        bomb: edge,
        pointer: pointer.on && !keying && world.mode === "play" && world.player.alive ? { x: pointer.x, y: pointer.y - 78 } : null,
        wingLeft: world.coop && hit("p2Left"),
        wingRight: world.coop && hit("p2Right"),
        wingUp: world.coop && hit("p2Up"),
        wingDown: world.coop && hit("p2Down"),
        wingFocus: world.coop && hit("p2Focus"),
        wingFire: (world.coop && hit("p2Fire")) || (auto && world.coop),
        wingBomb: wingEdge,
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
        setKeys: (codes) => {
          override = codes.length ? codes : null;
          if (!codes.length) held.clear();
          bombLatch = false;
        },
      };
    }

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
        sfx.unlock();
        const ctx = sfx.context();
        if (ctx) music.attach(ctx);
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
        if (world.mode === "menu") {
          setPick(false);
          chooseCrew(world, world.meta.crew === "coop" ? "coop" : "solo");
        } else if (world.mode === "clear") nextLevel(world);
        else if (world.mode === "over") retryLevel(world);
        else if (world.mode === "pause") world.mode = "play";
        else if (world.mode === "victory") world.mode = "menu";
        sfx.drone(world.mode === "play");
        sync();
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
      mouseFire = !pointer.touch && e.button === 0;
      canvas.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const pt = toWorld(e.clientX, e.clientY);
      if (e.pointerType === "touch") {
        if (!pointer.on) return;
        pointer.x = pt.x;
        pointer.y = pt.y;
        return;
      }
      mouseFire = (e.buttons & 1) === 1;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === "touch") pointer.on = false;
      mouseFire = false;
    };
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
    let raf = 0;
    const fixed = 1 / 60;

    const frame = (now: number) => {
      const delta = Math.min(0.05, (now - last) / 1000);
      last = now;
      acc += delta;
      let steps = 0;
      while (acc >= fixed && steps < 5) {
        const input = readInput();
        const shotBefore = world.player.fireCd;
        step(world, fixed, input);
        if (world.mode === "play" && world.player.alive && world.player.fireCd > shotBefore) shotGate = 1;
        acc -= fixed;
        steps += 1;
      }
      if (shotGate === 1) {
        sfx.shot(world.player.weapon, world.player.feed > 0, world.player.x / WORLD_W * 2 - 1);
        shotGate = 0;
      }
      let killed = false;
      let big = false;
      plinkN = 0;
      for (const cue of world.cues) {
        if (cue === "kill") killed = true;
        else if (cue === "big") big = true;
        else if (cue === "hit") sfx.armor();
        else if (cue === "graze") sfx.graze();
        else if (cue === "pickup") sfx.pickup();
        else if (cue === "hurt") sfx.hurt();
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
        else if (cue === "hurt") music.duck();
      }
      world.cues.length = 0;
      if (big) sfx.kill(true);
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
        if (world.mode === "pause" && lastMode === "play") {
          saveNow(world);
          setNotice("SAVED");
          window.setTimeout(() => setNotice(""), 1000);
        }
        if (world.mode !== lastMode) sfx.drone(world.mode === "play");
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
          <div className="mx-auto flex w-[min(92vw,420px)] flex-col gap-2 px-5 pt-16 pb-16">
            <p className="font-display text-sm tracking-[0.42em] text-muted">VERTICAL SORTIE</p>
            <h1 className="font-display pr-16 text-5xl font-semibold tracking-wide text-ink sm:text-6xl">WINGBREAKER</h1>
            <div className="my-3 h-px w-16 bg-ember" />
            <p className="text-sm text-muted">
              Level {String(ui.mission).padStart(3, "0")} · {ui.nextChapter}
              {ui.cleared ? " · watch broken" : ""}
            </p>
            {ui.best > 0 && <p className="font-display text-lg text-cold">BEST {String(ui.best).padStart(6, "0")}</p>}
            <p className="font-display text-sm tracking-[0.18em] text-ember">{ui.stars} ★</p>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                className={row}
                onClick={() => setPick(true)}
              >
                <span>{ui.hasSave ? "CONTINUE" : "CAMPAIGN"}</span>
                <span className="text-sm text-muted">
                  {String(ui.mission).padStart(3, "0")} · {ui.nextChapter}
                </span>
              </button>
              <button type="button" className="self-start text-xs tracking-[0.16em] text-muted underline" onClick={() => setPick(true)}>
                change
              </button>
              <button type="button" className={row} onClick={() => act((w) => openMode(w, "levels"))}>
                <span>LEVELS</span>
                <span className="text-sm text-muted">STARS</span>
              </button>
              <button type="button" className={row} onClick={() => act((w) => startArcade(w, false))}>
                <span>ARCADE</span>
                <span className="text-sm text-muted">30 STAGES</span>
              </button>
              <button type="button" className={row} onClick={() => act((w) => startArcade(w, true))}>
                <span>DAILY SORTIE</span>
                <span className="text-sm text-muted">{ui.dailyPlayed ? "TRAINING" : "ONE OFFICIAL"}</span>
              </button>
              <button type="button" className={row} onClick={() => act((w) => openMode(w, "ranks"))}>
                <span>RANKS</span>
              </button>
              <button type="button" className={row} onClick={() => act((w) => openMode(w, "shop"))}>
                <span>SHOP</span>
              </button>
              <button type="button" className={row} onClick={() => { setArmReset(false); setCapture(null); act((w) => openMode(w, "options")); }}>
                <span>OPTIONS</span>
              </button>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-muted">{tip}</p>
            <p className="text-xs leading-relaxed text-muted">
              {touch ? "Drag to move. AUTO fires unless you turn it off." : "Move · click or Z to shoot · Shift focus · Space bomb · P pause · F auto fire"}
            </p>
          </div>
        </div>
      )}

      {pick && ui.mode === "menu" && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-bg/70">
          <div className="flex w-[min(92vw,420px)] flex-col gap-2 px-5">
            <p className="font-display text-sm tracking-[0.28em] text-muted">SORTIE</p>
            <h2 className="font-display text-4xl tracking-wide">WHO IS FLYING</h2>
            <p className="text-sm text-muted">One keyboard. Two chairs if you are brave.</p>
            <button type="button" className={row} onClick={() => act((w) => { setPick(false); chooseCrew(w, "solo"); })}>
              <span>SOLO</span>
              <span className="text-sm text-muted">WASD</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => { setPick(false); chooseCrew(w, "coop"); })}>
              <span>TWO PILOTS</span>
              <span className="text-sm text-muted">ARROWS</span>
            </button>
            <p className="text-xs leading-relaxed text-muted">
              Pilot shoots with Z, bombs with Space. Wingman shoots with K, bombs with L. Change any of that in Options.
            </p>
            <button type="button" className={`${row} mt-1`} onClick={() => setPick(false)}>
              <span>BACK</span>
            </button>
          </div>
        </div>
      )}

      {ui.mode === "shop" && (
        <div className="absolute inset-0 z-20 overflow-y-auto bg-bg/80">
          <div className="mx-auto flex w-[min(92vw,480px)] flex-col gap-3 px-5 py-16">
            <p className="font-display text-sm tracking-[0.28em] text-muted">HANGAR</p>
            <h2 className="font-display text-4xl tracking-wide">SHOP</h2>
            <p className="text-sm text-muted">Upgrades come in next level. Cash stays when you die.</p>
            {UPGRADE_LIST.map((item) => {
              const rank = ui.upgrades[item.id];
              const maxed = rank >= item.max;
              const price = item.prices[Math.min(rank, item.prices.length - 1)];
              return (
                <button
                  key={item.id}
                  type="button"
                  className={row}
                  disabled={maxed || ui.dollars < price}
                  onClick={() => act((w) => purchaseUpgrade(w, item.id))}
                >
                  <span>
                    <span className="block">{item.name}</span>
                    <span className="block text-xs tracking-normal text-muted">{item.blurb}</span>
                  </span>
                  <span className="text-sm text-ember">{maxed ? "MAX" : `$${price}`}</span>
                </button>
              );
            })}
            <p className="mt-3 font-display text-sm tracking-[0.22em] text-muted">STARTING GUN</p>
            {(["pulse", "neutron", "lance"] as GunFamily[]).map((family) => {
              const owned = family === "pulse" || ui.guns.includes(family);
              const worn = ui.gun === family;
              return (
                <button
                  key={family}
                  type="button"
                  className={row}
                  disabled={!owned && ui.dollars < 600}
                  onClick={() => act((w) => purchaseGun(w, family))}
                >
                  <span>{family.toUpperCase()}</span>
                  <span className="text-sm text-ember">{worn ? "EQUIPPED" : owned ? "EQUIP" : "$600"}</span>
                </button>
              );
            })}
            <p className="mt-3 font-display text-sm tracking-[0.22em] text-muted">SKINS</p>
            <p className="text-xs text-muted">Each skin is a different hull, not a paint job.</p>
            <div className="grid grid-cols-2 gap-2">
              {SKINS.map((skin) => {
                const owned = ui.owned.includes(skin.id);
                const worn = ui.skin === skin.id;
                return (
                  <button
                    key={skin.id}
                    type="button"
                    className={`${row} h-14 ${worn ? "border-ember" : ""}`}
                    disabled={!owned && ui.dollars < skin.price}
                    onClick={() => act((w) => (owned ? wearSkin(w, skin.id) : purchaseSkin(w, skin.id)))}
                  >
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-3 w-3 border border-line" style={{ background: skin.hull }} />
                      {skin.name}
                    </span>
                    <span className="text-sm text-ember">{worn ? "WORN" : owned ? "WEAR" : `$${skin.price}`}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" className={`${row} mt-2`} onClick={() => act((w) => closeOverlay(w))}>
              <span>BACK</span>
            </button>
          </div>
        </div>
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
            <button type="button" className={row} onClick={() => act((w) => setAutoNext(w, !w.meta.autoNext))}>
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
            <p className="text-xs text-muted">A new run clears the level and the score. Cash, skins, and upgrades stay.</p>
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
            <p className="text-center font-display text-2xl text-muted">{String(ui.score).padStart(6, "0")}</p>
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
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg/55">
          <div className="flex w-[min(92vw,380px)] flex-col gap-2 px-5">
            <p className="font-display text-sm tracking-[0.28em] text-muted">LEVEL {String(ui.level).padStart(3, "0")}</p>
            <h2 className="font-display text-4xl tracking-wide">
              {ui.level % 10 === 0 ? "CHAPTER CLEAR" : ui.perfect ? "CLEAN" : "BREACH"}
            </h2>
            <p className="text-sm text-muted">{ui.chapter}</p>
            <p className="text-sm italic text-cold">{ui.quip}</p>
            <p className="font-display text-2xl text-ember">+${ui.clearCash.toLocaleString("en-US")} {ui.starLine}</p>
            <p className="text-sm text-muted">Next: {String(ui.mission).padStart(3, "0")} · {ui.nextChapter}</p>
            <button type="button" className={row} onClick={() => act((w) => nextLevel(w))}>
              <span>{ui.level % 10 === 0 ? "NEXT CHAPTER" : "NEXT"}</span>
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
            <h2 className="font-display text-4xl tracking-wide">WATCH BROKEN</h2>
            <p className="font-display text-3xl">{String(ui.score).padStart(6, "0")}</p>
            <p className="text-sm text-muted">The black watch does not come back. The hangar stays.</p>
            <div className="max-h-40 space-y-1 overflow-hidden text-xs italic text-cold">
              {CREDITS.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
            <button type="button" className={row} onClick={() => act((w) => openMode(w, "menu"))}>
              <span>MENU</span>
            </button>
            <button type="button" className={row} onClick={() => act((w) => newMission(w))}>
              <span>NEW RUN</span>
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
                    <span>{known ? entry.name : "???"}</span>
                  </button>
                );
              })}
            </div>
            <p className="text-sm italic text-cold">{GUIDE.find((g) => g.id === guideId && ui.seen.includes(g.id))?.line ?? "Not logged yet."}</p>
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
