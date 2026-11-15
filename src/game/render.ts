import { bossArt, lookId, lookName } from "./army";
import { CHAPTERS, chapterIndex, chapterOf, gunName, skinDef, type SkinDef } from "./meta";
import { BOOST_TIME, BOSS_LINES, HONEY_RING, MIST_LIFE, STYLE, bossPhases, familyColor, type VHazard } from "./v3";
import { drawBossCreature, drawCritter, drawLoot } from "./critters";
import { drawSpecialPuff, drawSpecialShot } from "./guns";
import { drawHostileShot, drawStar } from "./shots";
import {
  DASH_WARN,
  DUEL_HP,
  DUEL_WINS,
  LINK_REACH,
  REVIVE_TIME,
  STRIKE_TIME,
  hermitHidden,
  podOffsets,
  gunRank,
  WORLD_H,
  WORLD_W,
  type Bullet,
  type Enemy,
  type Player,
  type Pop,
  type Splat,
  type World,
} from "./world";

/** Team colours when two fly, so nobody has to ask which ship is theirs. */
const TEAM = ["#ff6b4a", "#35d0c0"];

const plates: (HTMLImageElement | null)[] = Array.from({ length: 10 }, () => null);
const artCache = new Map<string, HTMLImageElement>();
const whiteCache = new Map<string, HTMLCanvasElement>();
const hulls = new Map<string, HTMLImageElement>();

function ready(img: HTMLImageElement | null) {
  return !!img && img.complete && img.naturalWidth > 2;
}

function chapterPlate(index: number) {
  if (typeof Image === "undefined") return null;
  const i = ((index % 10) + 10) % 10;
  if (!plates[i]) {
    const img = new Image();
    img.src = `/bg/${i}.jpg`;
    plates[i] = img;
  }
  return ready(plates[i]) ? plates[i] : null;
}

/** Any picture under /art, loaded on first use. Returns null until it is ready. */
export function art(path: string) {
  if (typeof Image === "undefined") return null;
  let img = artCache.get(path);
  if (!img) {
    img = new Image();
    img.src = `/art/${path}.webp`;
    artCache.set(path, img);
  }
  return ready(img) ? img : null;
}

/** The same picture as a flat white shape, flashed over a critter when it is hit. */
function whiteOf(path: string, img: HTMLImageElement) {
  let c = whiteCache.get(path);
  if (!c) {
    c = document.createElement("canvas");
    c.width = img.naturalWidth;
    c.height = img.naturalHeight;
    const g = c.getContext("2d");
    if (g) {
      g.drawImage(img, 0, 0);
      g.globalCompositeOperation = "source-in";
      g.fillStyle = "#ffffff";
      g.fillRect(0, 0, c.width, c.height);
    }
    whiteCache.set(path, c);
  }
  return c;
}

/**
 * Draws a sprite centred on the origin so that it covers about `size` x `size` world pixels,
 * whatever its proportions: a long thin plunger and a squat sponge read as the same weight.
 */
function blitMass(ctx: CanvasRenderingContext2D, path: string, img: HTMLImageElement, size: number, flash: number) {
  const k = size / Math.sqrt(img.naturalWidth * img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  if (flash > 0) {
    const keep = ctx.globalAlpha;
    ctx.globalAlpha = keep * Math.min(0.75, flash * 6);
    ctx.drawImage(whiteOf(path, img), -w / 2, -h / 2, w, h);
    ctx.globalAlpha = keep;
  }
}

function hullPath(id: string) {
  return `s/${skinDef(id as SkinDef["id"]).art}`;
}

function hullOf(id: string) {
  return art(hullPath(id));
}

/** A tiny ship for the lives row. */
function drawLifeIcon(ctx: CanvasRenderingContext2D, id: string, x: number, y: number, def: SkinDef) {
  const img = hullOf(id);
  ctx.save();
  ctx.translate(x, y);
  if (img) blitMass(ctx, hullPath(id), img, 13, 0);
  else {
    ctx.scale(0.32, 0.32);
    ctx.fillStyle = def.hull;
    ctx.strokeStyle = def.edge;
    ctx.lineWidth = 1.25;
    wingPath(ctx);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function blitSprite(ctx: CanvasRenderingContext2D, img: HTMLImageElement, height: number, bob: number) {
  const aspect = img.width / Math.max(1, img.height);
  const h = height;
  const w = h * Math.min(1.35, Math.max(0.72, aspect));
  ctx.drawImage(img, -w / 2, -h / 2 + bob, w, h);
}

function blitFree(ctx: CanvasRenderingContext2D, img: HTMLImageElement, height: number) {
  const aspect = img.width / Math.max(1, img.height);
  const h = height;
  const w = h * aspect;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
}

function cover(ctx: CanvasRenderingContext2D, img: HTMLImageElement) {
  const ir = img.width / img.height;
  const cr = WORLD_W / WORLD_H;
  let dw = WORLD_W;
  let dh = WORLD_H;
  let dx = 0;
  let dy = 0;
  if (cr > ir) {
    dh = WORLD_W / ir;
    dy = (WORLD_H - dh) / 2;
  } else {
    dw = WORLD_H * ir;
    dx = (WORLD_W - dw) / 2;
  }
  ctx.drawImage(img, dx, dy, dw, dh);
}
const STEEL = "#d5dbe2";
const STEEL_DIM = "#8e99a3";
const EMBER = "#e07a3d";
const COLD = "#7eb6d6";

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, focus: boolean) {
  const s = w.reduce ? 0 : w.trauma * w.trauma;
  ctx.save();
  ctx.translate(WORLD_W / 2, WORLD_H / 2);
  ctx.rotate(Math.sin(w.time * 91) * 0.012 * s);
  ctx.translate(-WORLD_W / 2, -WORLD_H / 2);
  ctx.translate(Math.sin(w.time * 71) * 11 * s, Math.cos(w.time * 63) * 9 * s);

  drawBackdrop(ctx, w);
  if (w.duel) drawDuelField(ctx, w);

  for (const sp of w.splats) drawSplat(ctx, sp);
  for (const h of w.hazards) drawHazard(ctx, h, w.time, w.level);
  if (w.hazards.some((h) => h.kind === "eclipse" && h.phase > 0)) {
    // the eclipse darkens the sky only; shots, pickups and ships stay lit on top
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  }
  // a gun gift with no gun on it (the campaign's) is the plain power box
  for (const pk of w.pickups) drawPickup(ctx, pk.kind, pk.x, pk.y, w.time, pk.hue ?? (pk.kind === "W" ? -1 : 0));
  for (const e of w.enemies) drawEnemy(ctx, e, w.time, w.player.x, w.player.y);
  for (const p of w.pops) drawPop(ctx, p);
  for (const e of w.enemies) if (e.weak && e.hp > 0 && !w.intro) drawWeak(ctx, e, w.time);

  for (const b of w.bullets) {
    if (b.friendly) drawShot(ctx, b, w.time, w.duel ? TEAM[b.owner === 1 ? 1 : 0] : undefined);
  }
  drawPuffs(ctx, w);

  const showShip =
    w.mode === "play" || w.mode === "pause" || w.mode === "bridge" || w.mode === "clear" || w.mode === "over" || w.mode === "victory" || w.mode === "duelover";
  if (showShip && w.wing && w.link) drawLink(ctx, w.player, w.wing, w.time);
  if (showShip && w.player.alive) drawPlayer(ctx, w, w.player, focus, skinDef(w.meta.skin), w.meta.skin);
  if (showShip && w.wing?.alive) drawPlayer(ctx, w, w.wing, false, skinDef(w.meta.skin2), w.meta.skin2);
  // whoever lost the last duel flies with the mop on, in a duel and in the campaign alike
  if (showShip && w.wing && w.cleaner != null && !w.range) {
    const who = w.cleaner === 1 ? w.wing : w.player;
    if (who.alive) drawMop(ctx, who, w.time, !!w.duel && who === w.wing);
  }
  if (showShip && w.player.down) drawWreck(ctx, w.player, w.meta.skin, w.time);
  if (showShip && w.wing?.down) drawWreck(ctx, w.wing, w.meta.skin2, w.time);

  // the name card goes under the poop: whatever can hurt you is never hidden behind it
  if (w.intro && (w.mode === "play" || w.mode === "pause")) drawIntro(ctx, w);

  for (const b of w.bullets) {
    if (!b.friendly) drawBullet(ctx, b.x, b.y, b.vx, b.vy, b.r, false, false, false, b.tint, b.shape ?? 0, 0, w.time);
  }

  for (const p of w.parts) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, p.life / p.max);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
    ctx.restore();
  }

  for (const a of w.arcs) drawArc(ctx, a.x1, a.y1, a.x2, a.y2, a.life / 0.12, w.time);

  for (const r of w.rings) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, r.life / r.max) * 0.85;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = r.width;
    ctx.beginPath();
    ctx.arc(r.x, r.y, Math.max(1, r.r), 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  ctx.font = "600 16px Barlow Condensed, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of w.floaters) {
    const k = Math.max(0, f.life / 1.25);
    ctx.globalAlpha = Math.min(1, k * 1.6);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(8,10,14,0.88)";
    ctx.strokeText(f.text, f.x, f.y);
    ctx.fillStyle = f.ember ? "#ffb07a" : "#f4fbff";
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";

  if (w.superT > 0) drawWhirl(ctx, w);

  if (w.bannerT > 0 && (w.mode === "play" || w.mode === "pause")) {
    ctx.globalAlpha = Math.min(1, w.bannerT * 1.8);
    ctx.textAlign = "center";
    // a long banner on a narrow screen shrinks to fit instead of running off both edges
    let size = w.duel ? (WORLD_W < 560 ? 26 : 44) : WORLD_W < 560 ? 18 : 28;
    ctx.font = `600 ${size}px Barlow Condensed, sans-serif`;
    const wide = ctx.measureText(w.banner).width;
    if (wide > WORLD_W * 0.94) {
      size = Math.max(11, Math.floor((size * WORLD_W * 0.94) / wide));
      ctx.font = `600 ${size}px Barlow Condensed, sans-serif`;
    }
    const by = w.duel ? WORLD_H / 2 + size * 0.35 : WORLD_W < 560 ? 78 : 92;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(8,10,14,0.8)";
    ctx.strokeText(w.banner, WORLD_W / 2, by);
    ctx.fillStyle = STEEL;
    ctx.fillText(w.banner, WORLD_W / 2, by);
    ctx.globalAlpha = 1;
  }

  if (w.freeze > 0) {
    ctx.fillStyle = "rgba(120, 90, 40, 0.18)";
    ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  }
  if (w.flash > 0) {
    ctx.fillStyle = `rgba(224, 122, 61, ${Math.min(0.28, w.flash * 0.7)})`;
    ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  }

  ctx.restore();

  if (w.duel) {
    if (w.mode === "play" || w.mode === "pause" || w.mode === "duelover") drawDuelHud(ctx, w);
  } else if (!w.range && (w.mode === "play" || w.mode === "pause" || w.mode === "bridge" || w.mode === "clear" || w.mode === "over" || w.mode === "victory")) drawHud(ctx, w);
}

/**
 * A boss's weak point: a yellow dotted ring that turns, with a bright middle.
 * Gifts wear a soap bubble and enemy shots a red-orange outline; nothing else in the game is dotted yellow.
 */
function drawWeak(ctx: CanvasRenderingContext2D, e: Enemy, time: number) {
  const weak = e.weak;
  if (!weak) return;
  const x = e.x + weak.dx;
  const y = e.y + weak.dy;
  const beat = 1 + Math.sin(time * 7) * 0.08;
  const grow = Math.min(1, weak.age * 4);
  const r = weak.r * beat * grow;
  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, 1, 0, 0, r * 1.5);
  glow.addColorStop(0, "rgba(255,225,74,0.55)");
  glow.addColorStop(1, "rgba(255,225,74,0)");
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(time * 1.6);
  ctx.setLineDash([5, 4.5]);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "rgba(20,14,4,0.85)";
  ctx.beginPath();
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = "#ffe14a";
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.rotate(-time * 1.6);
  // what is left of it: the middle shrinks as it is shot
  const left = Math.max(0, weak.hp / weak.max);
  ctx.fillStyle = "rgba(20,14,4,0.85)";
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5 + 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffe14a";
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(2, r * 0.5 * (0.35 + 0.65 * left)), 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fffbe0";
  ctx.beginPath();
  ctx.arc(-r * 0.12, -r * 0.12, Math.max(1, r * 0.14), 0, Math.PI * 2);
  ctx.fill();
  if (weak.age < 2.4) {
    ctx.globalAlpha = Math.min(1, (2.4 - weak.age) * 2);
    ctx.font = "700 12px Barlow Condensed, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(8,10,14,0.9)";
    ctx.strokeText(`SHOOT THE ${weak.name}`, 0, r + 15);
    ctx.fillStyle = "#ffe14a";
    ctx.fillText(`SHOOT THE ${weak.name}`, 0, r + 15);
  }
  ctx.restore();
}

/** The loser's hat: a mop head sat on the ship, strands swaying, and what it makes them, in writing. */
function drawMop(ctx: CanvasRenderingContext2D, p: Player, time: number, flip: boolean) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.bank);
  if (flip) ctx.rotate(Math.PI);
  ctx.scale(1.3, 1.3);
  // the handle, sticking out behind one shoulder
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3a281e";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(2, -12);
  ctx.lineTo(19, -30);
  ctx.stroke();
  ctx.strokeStyle = "#c08a4e";
  ctx.lineWidth = 3;
  ctx.stroke();
  // the strands
  for (let i = 0; i < 9; i++) {
    const k = i / 8 - 0.5;
    const sway = Math.sin(time * 5 + i * 1.3) * 2.2;
    ctx.beginPath();
    ctx.moveTo(k * 10, -12);
    ctx.quadraticCurveTo(k * 22 + sway, -4, k * 30 + sway * 1.6, 6 + Math.abs(k) * -5);
    ctx.strokeStyle = "#3a281e";
    ctx.lineWidth = 4.6;
    ctx.stroke();
    ctx.strokeStyle = i % 2 ? "#efe6d0" : "#d9cdb0";
    ctx.lineWidth = 2.8;
    ctx.stroke();
  }
  // the clamp that holds them
  ctx.fillStyle = "#3f7fe0";
  ctx.strokeStyle = "#3a281e";
  ctx.lineWidth = 1.4;
  ctx.fillRect(-8, -16, 16, 6);
  ctx.strokeRect(-8, -16, 16, 6);
  ctx.restore();
  ctx.save();
  ctx.font = "700 11px Barlow Condensed, sans-serif";
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(8,10,14,0.85)";
  const y = p.y + (flip ? -44 : 56);
  ctx.strokeText("POOP CLEANER", p.x, y);
  ctx.fillStyle = "#d9a441";
  ctx.fillText("POOP CLEANER", p.x, y);
  ctx.restore();
}

/** A pseudo-random number in 0..1 that is always the same for the same pair. */
function hash(n: number, seed: number) {
  const x = Math.sin(n * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

/** The mess where something died: it spreads fast, sits a moment and fades. */
function drawSplat(ctx: CanvasRenderingContext2D, sp: Splat) {
  const u = 1 - sp.life / sp.max;
  const grow = 1 - Math.pow(1 - Math.min(1, u / 0.16), 3);
  const alpha = u < 0.45 ? 0.82 : 0.82 * (1 - (u - 0.45) / 0.55);
  const r = sp.r * (0.3 + 0.7 * grow);
  ctx.save();
  ctx.translate(sp.x, sp.y);
  ctx.globalAlpha = Math.max(0, alpha);
  const blob = () => {
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.56, 0, Math.PI * 2);
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + hash(i, sp.seed) * 0.8;
      const dist = r * (0.42 + hash(i + 9, sp.seed) * 0.5);
      const rr = r * (0.15 + hash(i + 17, sp.seed) * 0.2);
      ctx.moveTo(Math.cos(a) * dist + rr, Math.sin(a) * dist);
      ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, rr, 0, Math.PI * 2);
    }
    // drops that keep flying after the splash has landed
    for (let i = 0; i < 5; i++) {
      const a = hash(i + 31, sp.seed) * Math.PI * 2;
      const dist = r * (0.9 + u * 1.5 * (0.5 + hash(i + 41, sp.seed)));
      const rr = Math.max(1.2, r * 0.07 * (1 - u * 0.5));
      ctx.moveTo(Math.cos(a) * dist + rr, Math.sin(a) * dist);
      ctx.arc(Math.cos(a) * dist, Math.sin(a) * dist, rr, 0, Math.PI * 2);
    }
  };
  blob();
  ctx.strokeStyle = "rgba(20,12,8,0.7)";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = sp.color;
  ctx.fill();
  ctx.fillStyle = "rgba(255,240,210,0.22)";
  ctx.beginPath();
  ctx.ellipse(-r * 0.18, -r * 0.2, r * 0.2, r * 0.11, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

/** The critter that has just died: its own picture, swelling and going white. */
function drawPop(ctx: CanvasRenderingContext2D, p: Pop) {
  if (p.role === "storm" || p.role === "stormbig") return;
  const u = Math.max(0, p.life / p.max);
  const path = p.kind === "boss" ? `b/${bossArt(p.ch, p.hurt)}` : `e/${lookId(p.look)}`;
  const img = art(path);
  if (!img) return;
  const base = p.kind === "boss" ? 150 : (p.kind === "cruiser" ? 58 : p.kind === "wedge" ? 38 : p.kind === "drone" ? 37 : 32) * (p.role === "mini" ? 1.75 : 1);
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((1 - u) * (hash(1, p.spin) - 0.5) * 0.9);
  ctx.globalAlpha = u;
  blitMass(ctx, path, img, base * p.size * (1 + (1 - u) * 0.5), 0.05 + (1 - u) * 0.1);
  ctx.restore();
}

/** The Super Flush: the whole screen goes round and down. */
function drawWhirl(ctx: CanvasRenderingContext2D, w: World) {
  const u = Math.min(1, w.superT / 1.5);
  const cx = WORLD_W / 2;
  const cy = WORLD_H / 2;
  const reach = Math.hypot(WORLD_W, WORLD_H) / 2;
  ctx.save();
  ctx.fillStyle = `rgba(63,127,224,${0.22 * u})`;
  ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  ctx.translate(cx, cy);
  ctx.lineCap = "round";
  for (let i = 0; i < 9; i++) {
    const turn = w.time * 7 + (i / 9) * Math.PI * 2;
    ctx.strokeStyle = i % 2 ? `rgba(244,251,255,${0.5 * u})` : `rgba(126,182,214,${0.6 * u})`;
    ctx.lineWidth = i % 2 ? 4 : 9;
    ctx.beginPath();
    for (let k = 0; k <= 26; k++) {
      const t = k / 26;
      const rad = reach * (0.04 + t * (0.25 + 0.75 * u));
      const a = turn + t * 4.2;
      const x = Math.cos(a) * rad;
      const y = Math.sin(a) * rad * 0.8;
      if (k === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

/** The name card of a boss or a mini-boss that has just flown in. */
function drawIntro(ctx: CanvasRenderingContext2D, w: World) {
  const it = w.intro;
  if (!it) return;
  const narrow = WORLD_W < 560;
  const inn = Math.min(1, (it.max - it.t) / 0.22);
  const out = Math.min(1, it.t / 0.3);
  const a = Math.min(inn, out);
  const ease = 1 - Math.pow(1 - inn, 3);
  const cy = WORLD_H * 0.52;
  const bandH = (narrow ? 112 : 150) * (0.6 + 0.4 * ease);
  ctx.save();
  ctx.globalAlpha = a * 0.84;
  ctx.fillStyle = "#07090c";
  ctx.fillRect(0, cy - bandH / 2, WORLD_W, bandH);
  ctx.globalAlpha = a;
  ctx.fillStyle = EMBER;
  ctx.fillRect(0, cy - bandH / 2, WORLD_W * ease, 3);
  ctx.fillRect(WORLD_W * (1 - ease), cy + bandH / 2 - 3, WORLD_W * ease, 3);
  const slide = (1 - ease) * -70;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = EMBER;
  ctx.font = `600 ${narrow ? 12 : 15}px Barlow Condensed, sans-serif`;
  ctx.fillText(it.tag.split("").join("\u200a"), WORLD_W / 2 + slide, cy - (narrow ? 34 : 46));
  let size = narrow ? 34 : 60;
  ctx.font = `700 ${size}px Barlow Condensed, sans-serif`;
  const wide = ctx.measureText(it.title).width;
  if (wide > WORLD_W * 0.9) {
    size = Math.floor((size * WORLD_W * 0.9) / wide);
    ctx.font = `700 ${size}px Barlow Condensed, sans-serif`;
  }
  ctx.fillStyle = "#f4f1ea";
  ctx.fillText(it.title, WORLD_W / 2 - slide, cy - (narrow ? 4 : 4));
  if (it.sub) {
    let sub = narrow ? 13 : 19;
    ctx.font = `italic 500 ${sub}px Barlow, sans-serif`;
    const sw = ctx.measureText(it.sub).width;
    if (sw > WORLD_W * 0.92) {
      sub = Math.max(9, Math.floor((sub * WORLD_W * 0.92) / sw));
      ctx.font = `italic 500 ${sub}px Barlow, sans-serif`;
    }
    ctx.fillStyle = COLD;
    ctx.fillText(it.sub, WORLD_W / 2 + slide * 0.5, cy + (narrow ? 30 : 42));
  }
  ctx.restore();
}

/** A duel: each pilot keeps to a half, and the gifts ride the line between them. */
function drawDuelField(ctx: CanvasRenderingContext2D, w: World) {
  ctx.save();
  ctx.fillStyle = "rgba(53,208,192,0.05)";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H / 2);
  ctx.fillStyle = "rgba(255,107,74,0.05)";
  ctx.fillRect(0, WORLD_H / 2, WORLD_W, WORLD_H / 2);
  ctx.strokeStyle = "rgba(244,241,234,0.28)";
  ctx.lineWidth = 2;
  ctx.setLineDash([14, 12]);
  ctx.lineDashOffset = -w.time * 18;
  ctx.beginPath();
  ctx.moveTo(0, WORLD_H / 2);
  ctx.lineTo(WORLD_W, WORLD_H / 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();
}

function drawDuelHud(ctx: CanvasRenderingContext2D, w: World) {
  const d = w.duel;
  if (!d) return;
  const width = Math.min(260, WORLD_W * 0.42);
  ctx.save();
  ctx.textBaseline = "alphabetic";
  for (const i of [0, 1]) {
    const y = i === 0 ? WORLD_H - 30 : 20;
    const x = 16;
    const ratio = Math.max(0, d.hp[i] / DUEL_HP);
    ctx.fillStyle = "rgba(8,10,14,0.8)";
    ctx.fillRect(x - 2, y - 2, width + 4, 14);
    ctx.fillStyle = "#1c2128";
    ctx.fillRect(x, y, width, 10);
    ctx.fillStyle = TEAM[i];
    ctx.fillRect(x, y, width * ratio, 10);
    ctx.fillStyle = "rgba(255,255,255,0.3)";
    ctx.fillRect(x, y, width * ratio, 3);
    ctx.font = "600 14px Barlow Condensed, sans-serif";
    ctx.textAlign = "left";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(8,10,14,0.85)";
    const label = `PILOT ${i + 1}`;
    const ly = i === 0 ? y - 8 : y + 28;
    ctx.strokeText(label, x, ly);
    ctx.fillStyle = TEAM[i];
    ctx.fillText(label, x, ly);
    // rounds won: three lights each
    for (let k = 0; k < DUEL_WINS; k++) {
      const cx = x + 70 + k * 16;
      ctx.beginPath();
      ctx.arc(cx, ly - 5, 5, 0, Math.PI * 2);
      ctx.fillStyle = k < d.wins[i] ? "#f2d24a" : "rgba(8,10,14,0.8)";
      ctx.fill();
      ctx.strokeStyle = "#f2d24a";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    const p = i === 0 ? w.player : w.wing;
    if (p) {
      ctx.textAlign = "left";
      ctx.font = "600 13px Barlow Condensed, sans-serif";
      ctx.fillStyle = STEEL_DIM;
      ctx.fillText(gunName(p.weapon, p.family), x + 70 + DUEL_WINS * 16 + 8, ly);
    }
  }
  ctx.restore();
}

let hangarImg: HTMLImageElement | null = null;

function paintHangar(ctx: CanvasRenderingContext2D) {
  if (typeof Image === "undefined") return false;
  if (!hangarImg) {
    hangarImg = new Image();
    hangarImg.onload = () => {
      if (hangarImg) hangarImg.dataset.ready = "1";
    };
    hangarImg.src = "/bg/menu.jpg";
    hangarImg.onerror = () => {
      if (!hangarImg || hangarImg.dataset.fallback === "1") return;
      hangarImg.dataset.fallback = "1";
      hangarImg.src = "/menu-bg.jpg";
      hangarImg.onerror = () => {
        fetch("/menu-bg.b64")
          .then((r) => (r.ok ? r.text() : ""))
          .then((b64) => {
            if (!hangarImg || !b64.trim()) return;
            hangarImg.src = `data:image/jpeg;base64,${b64.trim()}`;
          })
          .catch(() => {});
      };
    };
  }
  if (!hangarImg.complete || hangarImg.naturalWidth < 2) return false;
  const ir = hangarImg.width / hangarImg.height;
  const cr = WORLD_W / WORLD_H;
  let dw = WORLD_W;
  let dh = WORLD_H;
  let dx = 0;
  let dy = 0;
  if (cr > ir) {
    dh = WORLD_W / ir;
    dy = (WORLD_H - dh) / 2;
  } else {
    dw = WORLD_H * ir;
    dx = (WORLD_W - dw) / 2;
  }
  ctx.fillStyle = "#07090c";
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.filter = "brightness(1.12) contrast(1.05)";
  ctx.drawImage(hangarImg, dx, dy, dw, dh);
  ctx.filter = "none";
  const veil = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  veil.addColorStop(0, "rgba(7,9,12,0.08)");
  veil.addColorStop(0.45, "rgba(7,9,12,0.16)");
  veil.addColorStop(1, "rgba(7,9,12,0.55)");
  ctx.fillStyle = veil;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  return true;
}

/**
 * Each room has something drifting through it in front of the backdrop: rust flakes, soap
 * bubbles, dust, embers, rain. Nothing here is stored; every speck is worked out from its
 * number and the clock, so it costs almost nothing and never needs cleaning up.
 */
function drawWeather(ctx: CanvasRenderingContext2D, ch: number, time: number) {
  const n = WORLD_W < 560 ? 16 : 34;
  const rnd = (i: number, k: number) => {
    const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453;
    return v - Math.floor(v);
  };
  // per room: colour, fall speed (negative rises), sideways drift, size, shape
  const kinds: [string, number, number, number, "flake" | "bubble" | "dot" | "spark" | "streak"][] = [
    ["#c9713a", 26, 8, 3, "flake"],
    ["#bfeaff", -34, 10, 6, "bubble"],
    ["#d9c7a0", 8, 26, 2.2, "dot"],
    ["#fff6c8", 2, 0, 1.6, "spark"],
    ["#f2c04a", 18, 12, 2.4, "dot"],
    ["#9be06a", -22, 14, 2.6, "dot"],
    ["#e8e2d6", 10, 6, 1.8, "dot"],
    ["#ff9a3c", -70, 20, 2.2, "spark"],
    ["#bcd8ff", 520, -120, 14, "streak"],
    ["#ffe08a", 6, 0, 1.8, "spark"],
  ];
  const [color, fall, drift, size, shape] = kinds[((ch % 10) + 10) % 10];
  ctx.save();
  for (let i = 0; i < n; i++) {
    const depth = 0.45 + rnd(i, 1) * 0.55;
    const span = WORLD_H + 40;
    const y0 = rnd(i, 2) * span + time * fall * depth;
    const y = ((y0 % span) + span) % span - 20;
    const x0 = rnd(i, 3) * WORLD_W + Math.sin(time * 0.6 + i) * drift + (shape === "streak" ? time * drift * depth : 0);
    const x = ((x0 % WORLD_W) + WORLD_W) % WORLD_W;
    const s = size * depth;
    ctx.globalAlpha = (shape === "spark" ? 0.25 + 0.5 * Math.abs(Math.sin(time * (1.5 + rnd(i, 4) * 2) + i)) : 0.3) * depth;
    ctx.fillStyle = color;
    if (shape === "bubble") {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillRect(x - s * 0.45, y - s * 0.5, s * 0.3, s * 0.3);
    } else if (shape === "flake") {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(time * (0.6 + rnd(i, 5)) + i);
      ctx.fillRect(-s, -s * 0.5, s * 2, s);
      ctx.restore();
    } else if (shape === "streak") {
      ctx.fillRect(x, y, 1.2, s);
    } else if (shape === "spark") {
      ctx.fillRect(x - s * 0.5, y - s * 0.5, s, s);
      ctx.fillRect(x - s * 1.6, y - 0.4, s * 3.2, 0.8);
      ctx.fillRect(x - 0.4, y - s * 1.6, 0.8, s * 3.2);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  if (ch === 8) {
    // the storm outside the public restroom: a flicker of lightning every few seconds
    const beat = (time % 6.5) / 6.5;
    if (beat > 0.96) {
      ctx.globalAlpha = 0.1 * Math.abs(Math.sin(time * 60));
      ctx.fillStyle = "#dfeaff";
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    }
  }
  ctx.restore();
}

function drawBackdrop(ctx: CanvasRenderingContext2D, w: World) {
  const hangar = w.mode === "menu" || w.mode === "shop" || w.mode === "options" || w.mode === "standby";
  if (hangar && paintHangar(ctx)) return;

  const ch = chapterOf(Math.max(1, w.level || 1));
  const idx = chapterIndex(Math.max(1, w.level || 1));
  const photo = chapterPlate(idx);
  if (photo) {
    cover(ctx, photo);
    ctx.fillStyle = "rgba(4,6,12,0.14)";
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    if (!w.reduce) drawWeather(ctx, idx, w.time);
    return;
  }

  const g = ctx.createLinearGradient(0, 0, 0, WORLD_H);
  g.addColorStop(0, "#05070a");
  g.addColorStop(0.42, ch.sky);
  g.addColorStop(1, "#10161c");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.fillStyle = ch.accent;
  ctx.globalAlpha = 0.05;
  ctx.beginPath();
  ctx.ellipse(WORLD_W * 0.22, WORLD_H * 0.28, WORLD_W * 0.16, WORLD_H * 0.08, -0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.04;
  ctx.beginPath();
  ctx.ellipse(WORLD_W * 0.72, WORLD_H * 0.62, WORLD_W * 0.18, WORLD_H * 0.09, 0.25, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.save();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = "#66717c";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(WORLD_W * 0.8, WORLD_H * 0.06, Math.min(WORLD_W, WORLD_H) * 0.22, 0.35, Math.PI - 0.15);
  ctx.stroke();
  ctx.restore();

  for (const s of w.stars) {
    ctx.globalAlpha = 0.28 + s.z * 0.38;
    ctx.fillStyle = s.z > 1.25 ? "#f3f5f7" : "#8b97a3";
    ctx.fillRect(s.x, s.y, s.s, s.s);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx: CanvasRenderingContext2D, w: World) {
  const skin = skinDef(w.meta.skin);
  ctx.textAlign = "left";
  ctx.fillStyle = STEEL;
  ctx.font = "600 28px Barlow Condensed, sans-serif";
  ctx.fillText(String(w.score).padStart(6, "0"), 16, 40);
  const mult = 1 + Math.min(w.chain, 30) * 0.12;
  if (mult > 1.05) {
    ctx.fillStyle = EMBER;
    ctx.font = "600 16px Barlow Condensed, sans-serif";
    ctx.fillText(`x${mult.toFixed(1)}`, 16, 58);
  }

  ctx.fillStyle = STEEL_DIM;
  ctx.font = "600 14px Barlow Condensed, sans-serif";
  ctx.fillText(String(w.level).padStart(3, "0"), 16, 78);
  drawAmmo(ctx, w.player, 16, w.wing ? 104 : 88);
  if (w.wing) drawAmmo(ctx, w.wing, 92, 104);
  if (w.wing) {
    const skin2 = skinDef(w.meta.skin2);
    ctx.fillStyle = TEAM[1];
    ctx.fillRect(42, 84, 3, 12);
    ctx.fillStyle = TEAM[0];
    ctx.fillRect(42, 68, 3, 12);
    for (let i = 0; i < w.wing.lives; i++) drawLifeIcon(ctx, w.meta.skin2, 54 + i * 16, 90, skin2);
  }
  const boss = w.enemies.find((e) => (e.kind === "boss" || e.role === "mini") && e.hp > 0);
  if (boss) drawBossBar(ctx, boss);
  else if (w.mode === "play" || w.mode === "pause") {
    const narrow = WORLD_W < 560;
    const y = narrow ? 116 : 34;
    if (w.kind === "storm" && w.stormEnd > 0) {
      const left = Math.max(0, w.stormEnd - w.spawnClock);
      if (left > 0) topBar(ctx, `POOP STORM · ${Math.ceil(left)}`, 1 - left / w.stormEnd, y, "#8a5a2c");
    } else if (w.kind === "pipes") {
      const left = w.hazards.reduce((n, h) => n + (h.kind === "pipe" ? 1 : 0), 0);
      if (left > 0 && w.born > 0) topBar(ctx, `PIPE RUN · ${left} TO GO`, 1 - left / w.born, y, "#6f9a84");
    }
  }
  if (w.wing && !w.arcade) drawTeam(ctx, w);
  const toast = w.toasts[0];
  if (toast) {
    // an achievement: a small plaque that drops in under the top edge and leaves again
    const show = Math.min(1, toast.life * 3, (3.2 - toast.life) * 5);
    ctx.save();
    ctx.globalAlpha = Math.max(0, show);
    ctx.font = "600 15px Barlow Condensed, sans-serif";
    const label = `ACHIEVEMENT  ${toast.text}`;
    const tw = ctx.measureText(label).width + 28;
    const tx = (WORLD_W - tw) / 2;
    const ty = (boss ? 58 : 14) - (1 - show) * 12;
    ctx.fillStyle = "rgba(10,13,18,0.9)";
    ctx.fillRect(tx, ty, tw, 26);
    ctx.strokeStyle = EMBER;
    ctx.lineWidth = 1;
    ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, 25);
    ctx.fillStyle = "#f4e7cf";
    ctx.textAlign = "center";
    ctx.fillText(label, WORLD_W / 2, ty + 18);
    ctx.restore();
  }
  for (let i = 0; i < w.player.lives; i++) drawLifeIcon(ctx, w.meta.skin, 54 + i * 16, 74, skin);

  const bw = 168;
  const bx = (WORLD_W - bw) / 2;
  const by = WORLD_H - 26;
  ctx.textAlign = "center";
  ctx.fillStyle = w.player.feed > 0 ? EMBER : STEEL_DIM;
  ctx.font = "600 13px Barlow Condensed, sans-serif";
  ctx.fillText(gunName(gunRank(w.player), w.player.family), WORLD_W / 2, by - (w.wing ? 16 : 8));
  ctx.textAlign = "left";
  const seg = bw / 6;
  const gunColor = familyColor(w.player.family);
  // power bought in the shop in the gun's colour; a gift boost on top of it in gold, and it blinks out
  const powerBar = (p: Player, y: number, h: number, color: string) => {
    const rank = gunRank(p);
    const ending = p.boostT > 0 && p.boostT < 5 && Math.sin(w.time * 14) > 0;
    for (let i = 0; i < 6; i++) {
      const lent = i >= p.weapon && i < rank;
      ctx.fillStyle = i < rank ? (p.feed > 0 ? EMBER : lent ? (ending ? "#7a6420" : "#ffd84a") : color) : "#1a2128";
      ctx.fillRect(bx + i * seg + 1, y, seg - 3, h);
    }
    if (p.boostT > 0 && rank > p.weapon) {
      // how long the gift still lasts: a thin line under the lent steps
      const x0 = bx + p.weapon * seg + 1;
      const full = (rank - p.weapon) * seg - 3;
      ctx.fillStyle = "#ffd84a";
      ctx.fillRect(x0, y + h + 1, full * Math.min(1, p.boostT / BOOST_TIME), 1);
    }
  };
  powerBar(w.player, by, 3, gunColor);
  const lift = w.touch ? 78 : 0;
  // bomb charge: fills with every kill, a full bar hands over a bomb
  const chargeW = 53;
  const chargeX = WORLD_W - 16 - chargeW;
  ctx.fillStyle = "#1a2128";
  ctx.fillRect(chargeX, by - 9 - lift, chargeW, 3);
  ctx.fillStyle = EMBER;
  ctx.fillRect(chargeX, by - 9 - lift, chargeW * Math.min(1, w.snacks / 100), 3);

  if (w.wing) {
    powerBar(w.wing, by - 8, 2, "#d7c4a1");
  }

  for (let i = 0; i < 5; i++) {
    const x = WORLD_W - 22 - (4 - i) * 11;
    ctx.strokeStyle = STEEL_DIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, by - 1 - lift, 7, 5);
    if (i < w.player.bombs) {
      ctx.fillStyle = EMBER;
      ctx.fillRect(x + 1, by - lift, 5, 3);
    }
  }
  if (w.dev) {
    ctx.fillStyle = "#f4fbff";
    ctx.font = "600 12px Barlow Condensed, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`EN ${w.enemies.length} B ${w.bullets.length} SN ${Math.floor(w.snacks)}`, 16, WORLD_H - 48);
  }
}

/** A thin progress bar with a label, where the boss bar goes. */
function topBar(ctx: CanvasRenderingContext2D, label: string, ratio: number, y: number, color: string) {
  const narrow = WORLD_W < 560;
  const width = Math.min(420, WORLD_W * (narrow ? 0.62 : 0.4));
  const x = (WORLD_W - width) / 2;
  ctx.save();
  ctx.font = `600 ${narrow ? 12 : 14}px Barlow Condensed, sans-serif`;
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(8,10,14,0.85)";
  ctx.strokeText(label, WORLD_W / 2, y - 7);
  ctx.fillStyle = STEEL;
  ctx.fillText(label, WORLD_W / 2, y - 7);
  ctx.fillStyle = "rgba(8,10,14,0.8)";
  ctx.fillRect(x - 2, y - 2, width + 4, 9);
  ctx.fillStyle = "#1c2128";
  ctx.fillRect(x, y, width, 5);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), 5);
  ctx.restore();
}

/** Two pilots: each one's Super Flush charge, and the call to fire it when both are full. */
function drawTeam(ctx: CanvasRenderingContext2D, w: World) {
  const x = 16;
  const width = 84;
  const ready = w.team[0] >= 100 && w.team[1] >= 100;
  ctx.save();
  ctx.font = "600 11px Barlow Condensed, sans-serif";
  ctx.textAlign = "left";
  ctx.fillStyle = STEEL_DIM;
  ctx.fillText("SUPER FLUSH", x, WORLD_H - 46);
  for (const i of [0, 1]) {
    const y = WORLD_H - 40 + i * 8;
    const full = w.team[i] >= 100;
    ctx.fillStyle = "#1a2128";
    ctx.fillRect(x, y, width, 5);
    ctx.fillStyle = TEAM[i];
    ctx.globalAlpha = full ? 0.75 + 0.25 * Math.sin(w.time * 9) : 0.9;
    ctx.fillRect(x, y, (width * Math.min(100, w.team[i])) / 100, 5);
    ctx.globalAlpha = 1;
  }
  if (ready && (w.mode === "play" || w.mode === "pause")) {
    const pulse = 0.65 + 0.35 * Math.sin(w.time * 8);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(8,10,14,0.85)";
    ctx.globalAlpha = pulse;
    ctx.fillStyle = "#9fd8ff";
    if (w.superWait) {
      // one pilot has called it: shout at the other, in the middle of the screen
      ctx.font = `700 ${WORLD_W < 700 ? 20 : 30}px Barlow Condensed, sans-serif`;
      ctx.textAlign = "center";
      ctx.strokeText("PARTNER – PRESS BOMB NOW!", WORLD_W / 2, WORLD_H * 0.44);
      ctx.fillText("PARTNER – PRESS BOMB NOW!", WORLD_W / 2, WORLD_H * 0.44);
    } else {
      // charged and waiting: a quiet reminder beside the two bars, out of the way of the ships
      ctx.font = "700 14px Barlow Condensed, sans-serif";
      ctx.textAlign = "left";
      ctx.strokeText("READY · BOTH PRESS BOMB", x + width + 10, WORLD_H - 30);
      ctx.fillText("READY · BOTH PRESS BOMB", x + width + 10, WORLD_H - 30);
    }
  }
  ctx.restore();
}

/** Two pilots flying wing to wing: a live wire between the ships while the damage bonus holds. */
function drawLink(ctx: CanvasRenderingContext2D, a: Player, b: Player, time: number) {
  const span = Math.hypot(a.x - b.x, a.y - b.y);
  const fade = Math.max(0.25, 1 - span / LINK_REACH);
  ctx.save();
  ctx.lineCap = "round";
  for (const [width, color] of [
    [7, `rgba(126,182,214,${0.22 * fade + 0.1})`],
    [2, `rgba(244,251,255,${0.6 * fade + 0.25})`],
  ] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    const steps = 6;
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const jitter = Math.sin(time * 30 + i * 2.1) * 4;
      ctx.lineTo(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t + jitter);
    }
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

/** A downed pilot: the drifting wreck, a call for help and the revive dial filling as the partner hovers. */
function drawWreck(ctx: CanvasRenderingContext2D, p: Player, spriteId: string, time: number) {
  ctx.save();
  ctx.translate(p.x, p.y);
  const img = hullOf(spriteId);
  ctx.save();
  ctx.rotate(0.5 + Math.sin(time * 1.3) * 0.08);
  ctx.globalAlpha = 0.4;
  if (img) blitMass(ctx, hullPath(spriteId), img, 44, 0);
  else {
    ctx.fillStyle = "#8e99a3";
    wingPath(ctx);
    ctx.fill();
  }
  ctx.restore();
  ctx.fillStyle = `rgba(60,60,66,${0.35 + Math.sin(time * 3) * 0.1})`;
  for (let i = 0; i < 3; i++) {
    const rise = (time * 22 + i * 14) % 42;
    ctx.beginPath();
    ctx.arc(Math.sin(time * 2 + i) * 6, -10 - rise, 5 + rise * 0.18, 0, Math.PI * 2);
    ctx.fill();
  }
  const fill = Math.min(1, (p.revive ?? 0) / REVIVE_TIME);
  ctx.lineWidth = 4;
  ctx.strokeStyle = "rgba(244,251,255,0.25)";
  ctx.beginPath();
  ctx.arc(0, 0, 34, 0, Math.PI * 2);
  ctx.stroke();
  if (fill > 0) {
    ctx.strokeStyle = EMBER;
    ctx.beginPath();
    ctx.arc(0, 0, 34, -Math.PI / 2, -Math.PI / 2 + fill * Math.PI * 2);
    ctx.stroke();
  }
  if (Math.sin(time * 7) > -0.3) {
    ctx.font = "700 14px Barlow Condensed, sans-serif";
    ctx.textAlign = "center";
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(8,10,14,0.9)";
    ctx.strokeText("HELP!", 0, -44);
    ctx.fillStyle = "#ffb07a";
    ctx.fillText("HELP!", 0, -44);
  }
  ctx.restore();
}

/** The boss's name and health across the top of the screen, with a notch at each phase change. */
function drawBossBar(ctx: CanvasRenderingContext2D, boss: Enemy) {
  const narrow = WORLD_W < 560;
  const width = Math.min(520, WORLD_W * (narrow ? 0.7 : 0.5));
  const x = (WORLD_W - width) / 2;
  const y = narrow ? 116 : 34;
  const pal = CHAPTERS[boss.ch] ?? CHAPTERS[0];
  const ratio = Math.max(0, boss.hp / boss.max);
  const mini = boss.kind !== "boss";
  const name = mini ? `BIG ${lookName(boss.look).toUpperCase()}` : (BOSS_LINES[boss.ch]?.[0] ?? "BOSS");
  ctx.save();
  ctx.font = `600 ${narrow ? 12 : 14}px Barlow Condensed, sans-serif`;
  ctx.textAlign = "center";
  ctx.lineWidth = 3;
  ctx.strokeStyle = "rgba(8,10,14,0.85)";
  ctx.strokeText(name, WORLD_W / 2, y - 7);
  ctx.fillStyle = STEEL;
  ctx.fillText(name, WORLD_W / 2, y - 7);
  ctx.fillStyle = "rgba(8,10,14,0.8)";
  ctx.fillRect(x - 2, y - 2, width + 4, 11);
  ctx.fillStyle = "#2a1410";
  ctx.fillRect(x, y, width, 7);
  ctx.fillStyle = pal.accent;
  ctx.fillRect(x, y, width * ratio, 7);
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillRect(x, y, width * ratio, 2);
  ctx.fillStyle = "rgba(8,10,14,0.95)";
  for (const mark of mini ? [0.5] : bossPhases(boss.ch) === 4 ? [0.7, 0.4, 0.15] : [0.66, 0.33]) ctx.fillRect(x + width * mark - 1, y - 2, 2, 11);
  ctx.restore();
}

function wingPath(ctx: CanvasRenderingContext2D) {
  ctx.beginPath();
  ctx.moveTo(0, -24);
  ctx.lineTo(5, -6);
  ctx.lineTo(20, 12);
  ctx.lineTo(7, 7);
  ctx.lineTo(3, 16);
  ctx.lineTo(0, 11);
  ctx.lineTo(-3, 16);
  ctx.lineTo(-7, 7);
  ctx.lineTo(-20, 12);
  ctx.lineTo(-5, -6);
  ctx.closePath();
}

function flame(ctx: CanvasRenderingContext2D, x: number, y: number, len: number) {
  ctx.beginPath();
  ctx.moveTo(x - 3, y);
  ctx.lineTo(x, y + 8 + len);
  ctx.lineTo(x + 3, y);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer(ctx: CanvasRenderingContext2D, w: World, p: Player, focus: boolean, skin: SkinDef, spriteId: string) {
  // hurt and briefly safe: the ship blinks. Under a Star it glows instead.
  const blink = p.inv > 0 && p.star <= 0 && Math.sin(w.time * 38) > 0;
  const flip = !!w.duel && p === w.wing;
  if (!blink) {
    ctx.save();
    ctx.translate(p.x, p.y + (flip ? -1 : 1) * p.muzzle * 36);
    ctx.rotate(p.bank);
    if (flip) ctx.rotate(Math.PI);
    if (w.wing && !w.duel && !w.arcade && w.team[p === w.wing ? 1 : 0] >= 100) {
      // charged for the Super Flush
      ctx.strokeStyle = `rgba(159,216,255,${0.45 + 0.3 * Math.sin(w.time * 9)})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, 37 + Math.sin(w.time * 6) * 2, 0, Math.PI * 2);
      ctx.stroke();
    }
    const feed = p.feed > 0;
    const flick = 0.45 + (Math.sin(w.time * 46) * 0.5 + 0.5) * 0.7;
    ctx.fillStyle = feed ? `rgba(224,122,61,${0.4 + flick * 0.45})` : `rgba(126,182,214,${0.28 + flick * 0.5})`;
    const img = hullOf(spriteId);
    // the exhaust sits at the tail of whatever is being flown, a bathtub or a needle
    const tail = img ? (img.naturalHeight * (46 / Math.sqrt(img.naturalWidth * img.naturalHeight))) / 2 - 7 : 16;
    flame(ctx, -6, tail, flick * 7);
    flame(ctx, 6, tail, flick * 7);
    if (gunRank(p) >= 3) {
      flame(ctx, -14, tail - 3, flick * 4);
      flame(ctx, 14, tail - 3, flick * 4);
    }

    if (w.wing) {
      // two pilots: a team-coloured marker under each ship
      const team = TEAM[p === w.wing ? 1 : 0];
      ctx.fillStyle = team;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.moveTo(0, 33);
      ctx.lineTo(6, 41);
      ctx.lineTo(-6, 41);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }
    if (img) {
      blitMass(ctx, hullPath(spriteId), img, 46 * (skin.hit > 1 ? 1.12 : skin.hit < 1 ? 0.9 : 1), 0);
    } else {
      ctx.fillStyle = skin.hull;
      ctx.strokeStyle = skin.edge;
      ctx.lineWidth = 1;
      wingPath(ctx);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = skin.hot;
      ctx.beginPath();
      ctx.moveTo(0, -26);
      ctx.lineTo(4.5, -8);
      ctx.lineTo(3.2, 12);
      ctx.lineTo(0, 16);
      ctx.lineTo(-3.2, 12);
      ctx.lineTo(-4.5, -8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = skin.edge;
      ctx.stroke();

      ctx.fillStyle = skin.canopy;
      ctx.beginPath();
      ctx.moveTo(0, -16);
      ctx.lineTo(3.1, -4);
      ctx.lineTo(-3.1, -4);
      ctx.closePath();
      ctx.fill();
      if (spriteId === "duck") {
        ctx.fillStyle = "#e07a3d";
        ctx.beginPath();
        ctx.moveTo(0, -2);
        ctx.lineTo(10, 1);
        ctx.lineTo(0, 4);
        ctx.fill();
      } else if (spriteId === "toaster") {
        ctx.fillStyle = "#5c656e";
        ctx.fillRect(-8, -6, 16, 10);
        ctx.fillStyle = "#f4e7c2";
        ctx.fillRect(-3, -12, 6, 6);
      } else if (spriteId === "tub") {
        ctx.strokeStyle = skin.edge;
        ctx.strokeRect(-12, -2, 24, 10);
        ctx.beginPath();
        ctx.arc(8, -6, 4, Math.PI, 0);
        ctx.stroke();
      } else if (spriteId === "toilet" || spriteId === "throne") {
        ctx.strokeStyle = spriteId === "throne" ? "#e2b84a" : skin.edge;
        ctx.strokeRect(-8, -2, 16, 8);
        ctx.beginPath();
        ctx.ellipse(0, -4, 5, 3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    if (p.buddy > 0 && (p.buddy > 3 || Math.floor(w.time * 8) % 2 === 0)) {
      const a = w.time * 3.1;
      const img = art("k/brush_buddy");
      ctx.save();
      ctx.translate(Math.cos(a) * 34, Math.sin(a) * 14 - 6);
      if (img) blitLong(ctx, img, 22);
      ctx.restore();
    }
    if (p.star > 0) {
      const glow = ctx.createRadialGradient(0, 0, 6, 0, 0, 44);
      glow.addColorStop(0, "rgba(255,255,255,0.0)");
      glow.addColorStop(0.7, `rgba(255,244,200,${0.3 + 0.15 * Math.sin(w.time * 12)})`);
      glow.addColorStop(1, "rgba(255,244,200,0)");
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(0, 0, 44, 0, Math.PI * 2);
      ctx.fill();
    }
    if (p.rush > 0) {
      ctx.fillStyle = "rgba(201,162,74,0.8)";
      for (let i = 0; i < 3; i++) {
        const a = w.time * 7 + i * 2.1;
        ctx.fillRect(Math.cos(a) * 20 - 1, -30 - ((w.time * 60 + i * 9) % 14), 2, 5);
      }
    }
    if (p.magnet > 0) {
      ctx.strokeStyle = `rgba(233,70,63,${0.25 + 0.2 * Math.sin(w.time * 6)})`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 6]);
      ctx.lineDashOffset = w.time * 40;
      ctx.beginPath();
      ctx.arc(0, 0, 46 + Math.sin(w.time * 3) * 4, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    for (const pod of podOffsets(w.time, gunRank(p))) {
      ctx.save();
      ctx.translate(pod.x, pod.y);
      ctx.fillStyle = feed ? "#ffb07a" : "#d5e8f4";
      ctx.beginPath();
      ctx.arc(0, 0, 4.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = feed ? EMBER : COLD;
      ctx.beginPath();
      ctx.arc(0, 0, 2.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    if (p.muzzle > 0) {
      ctx.globalAlpha = Math.min(1, p.muzzle / 0.05);
      const rank = gunRank(p);
      const flash = rank >= 6 ? "#fff4ea" : rank === 5 ? "#e7ffb0" : rank === 4 ? "#ffd7a8" : "#f4fbff";
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(5, -18);
      ctx.lineTo(-5, -18);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (p.splat > 0) {
      ctx.fillStyle = "rgba(92, 52, 28, 0.85)";
      ctx.beginPath();
      ctx.arc(-7, 4, 3.2, 0, Math.PI * 2);
      ctx.arc(6, 7, 2.2, 0, Math.PI * 2);
      ctx.arc(1, -2, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }

    if (p.shield) {
      ctx.strokeStyle = `rgba(126, 182, 214, ${0.45 + Math.sin(w.time * 5) * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 2, 28, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  if (focus || w.touch || w.mode === "menu" || w.mode === "shop") {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.fillStyle = focus ? EMBER : "rgba(224,122,61,0.9)";
    ctx.beginPath();
    ctx.moveTo(0, -3.2);
    ctx.lineTo(2.1, 0);
    ctx.lineTo(0, 3.2);
    ctx.lineTo(-2.1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

function hull(ctx: CanvasRenderingContext2D, flash: boolean, fill: string, edge: string) {
  ctx.fillStyle = flash ? "#e7eaee" : fill;
  ctx.strokeStyle = flash ? "#ffffff" : edge;
  ctx.lineWidth = 1.35;
}

function poly(ctx: CanvasRenderingContext2D, pts: number[]) {
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
}

function drawEnemy(ctx: CanvasRenderingContext2D, e: Enemy, time: number, px: number, py: number) {
  ctx.save();
  ctx.translate(e.x, e.y);
  const k = e.size ?? 1;
  if (e.motion === "dive" && e.warn > 0) {
    // about to dive at the pilot: a red ring closes in on the critter
    const left = Math.min(1, e.warn / 0.55);
    ctx.strokeStyle = `rgba(255,70,90,${0.9 - left * 0.4})`;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, e.r * (1.2 + left * 1.4), 0, Math.PI * 2);
    ctx.stroke();
  }
  if (e.warn > 0) ctx.scale(1.15, 1.15);
  const pal = CHAPTERS[e.ch] ?? CHAPTERS[0];
  const bob = Math.sin(time * 3.2 + e.spin) * 1.6;
  if (e.kind === "boss") {
    const facePath = `b/${bossArt(e.ch, e.mark >= 2)}`;
    const face = art(facePath);
    // keep the wounded picture warm so the switch at the last phase never blinks
    art(`b/${bossArt(e.ch, true)}`);
    if (face) {
      ctx.save();
      ctx.translate(0, bob);
      ctx.rotate(Math.sin(time * 0.9 + e.spin) * 0.035);
      // a wounded boss shudders
      if (e.mark >= 2) ctx.translate(Math.sin(time * 47) * 1.2, Math.cos(time * 39) * 0.8);
      const hit = Math.min(1, e.flash * 5);
      ctx.scale(1 + hit * 0.03, 1 - hit * 0.03);
      // a boss is under fire all the time: a full white flash would wash it out
      blitMass(ctx, facePath, face, 150 * k, e.flash * 0.3);
      ctx.restore();
    } else {
      ctx.save();
      ctx.scale(k, k);
      drawBossCreature(ctx, e.ch, time, e.flash > 0);
      ctx.restore();
    }
    if (e.dash !== undefined && e.dash < DASH_WARN) {
      // charge warning: a pulsing lane from the boss down to where it will dive
      const dx = (e.dashX ?? e.x) - e.x;
      ctx.save();
      ctx.globalAlpha = 0.25 + 0.25 * Math.abs(Math.sin(time * 18));
      ctx.strokeStyle = pal.accent;
      ctx.lineWidth = 26;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(0, 30);
      ctx.lineTo(dx, WORLD_H * 0.72 - e.y);
      ctx.stroke();
      ctx.restore();
    }
    if (e.mark === 0 && e.fire < 0.28 && e.fire > 0 && e.y < py) {
      const a = Math.atan2(py - e.y, px - e.x);
      ctx.strokeStyle = pal.accent;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
      ctx.stroke();
    }
  } else if (e.role === "storm" || e.role === "stormbig") {
    // storm poop: the same drawings as the shots, big enough to shoot at
    const big = e.role === "stormbig";
    const hit = Math.min(1, e.flash * 6);
    const sc = (big ? 3 : 1.75) * k * (1 + hit * 0.14);
    ctx.save();
    if (big) ctx.rotate(Math.sin(time * 1.7 + e.spin) * 0.22);
    ctx.scale(sc, sc);
    if (hit > 0) ctx.filter = "brightness(1.7)";
    if (!drawHostileShot(ctx, big ? 3 : 0, e.x, e.y, 0, 1, time, false, Math.abs(Math.floor(e.spin * 13 + e.ox)))) {
      ctx.fillStyle = "#6a4424";
      ctx.beginPath();
      ctx.arc(0, 0, 11, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  } else {
    const facePath = `e/${lookId(e.look)}`;
    const face = art(facePath);
    const mini = e.role === "mini";
    const h = (e.kind === "cruiser" ? 58 : e.kind === "wedge" ? 38 : e.kind === "drone" ? 37 : 32) * k * (mini ? 1.75 : 1);
    // an angry mini-boss cannot keep still
    if (mini && e.mark >= 1) ctx.translate(Math.sin(time * 43) * 1.6, Math.cos(time * 37) * 1.1);
    if (e.role === "honey") {
      // Honey Turret: everything inside the amber ring is immune until it dies
      const ringR = HONEY_RING * k;
      ctx.fillStyle = "rgba(226,184,74,0.07)";
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(226,184,74,${0.45 + Math.sin(time * 4) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -time * 30;
      ctx.beginPath();
      ctx.arc(0, 0, ringR, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = "#e2b84a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(0, 0, h * 0.75, 0, Math.PI * 2);
      ctx.stroke();
    }
    const shell = hermitHidden(e);
    // a ghost that has faded out cannot be hit, and looks it
    const faded = e.role === "ghost" && Math.sin(e.t * 2.4) < 0;
    if (shell) ctx.globalAlpha = 0.55;
    else if (faded) ctx.globalAlpha = 0.28;
    if (face) {
      ctx.save();
      ctx.translate(0, bob);
      // everyone leans into their own drift a little, divers point where they dive
      const lean = (e.motion === "dive" && e.warn <= 0 ? 0 : Math.sin(time * 2.1 + e.spin * 1.7) * 0.07) + (e.lean ?? 0);
      ctx.rotate(lean);
      const hit = Math.min(1, e.flash * 6);
      const breathe = 1 + Math.sin(time * 4.3 + e.spin) * 0.025;
      ctx.scale((1 + hit * 0.12) * breathe, (1 - hit * 0.1) / breathe);
      blitMass(ctx, facePath, face, h, shell ? 0 : e.flash);
      ctx.restore();
    } else {
      ctx.save();
      ctx.scale(k, k);
      drawCritter(ctx, e.look, e.kind, time, e.spin, e.flash > 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (shell) {
      // tucked in: shots ping off the lid until it peeks out again
      ctx.strokeStyle = `rgba(190,200,210,${0.55 + Math.sin(time * 9) * 0.2})`;
      ctx.lineWidth = 2.5;
      ctx.setLineDash([7, 5]);
      ctx.beginPath();
      ctx.arc(0, bob, h * 0.62, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    if ((e.role === "forge" || e.role === "wall") && e.plate > 0) {
      // the lid it hides behind: shots from below stop here until it breaks
      ctx.strokeStyle = "rgba(214,188,150,0.9)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, bob, h * 0.66, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    if (e.kind === "cruiser" && !mini) bar(ctx, 30, h * 0.5, e.hp / e.max, pal.accent);
  }
  ctx.restore();
}

function bar(ctx: CanvasRenderingContext2D, w: number, y: number, ratio: number, color: string) {
  ctx.fillStyle = "#12171c";
  ctx.fillRect(-w / 2, y, w, 3);
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, y, w * Math.max(0, ratio), 3);
}

const SHOT_ART: Record<number, string> = {
  [STYLE.bubble]: "bubble_blaster",
  [STYLE.soap]: "soap_cannon",
  [STYLE.paste]: "toothpaste_laser",
  [STYLE.zap]: "zap_brush",
  [STYLE.flush]: "flush_wave",
  [STYLE.mist]: "freshener_mist",
};
const SHOT_TINT: Record<number, string> = {
  [STYLE.bubble]: "#4fd6e8",
  [STYLE.soap]: "#f28c1c",
  [STYLE.paste]: "#e9463f",
  [STYLE.zap]: "#f5d21c",
  [STYLE.flush]: "#3f7fe0",
  [STYLE.mist]: "#7fd38a",
};
/** longest side of each gun's shot at small / medium / large, in world pixels */
const SHOT_SIZE: Record<number, [number, number, number]> = {
  [STYLE.bubble]: [13, 17, 22],
  [STYLE.soap]: [21, 27, 33],
  [STYLE.paste]: [27, 33, 41],
  [STYLE.zap]: [23, 29, 37],
  [STYLE.flush]: [34, 40, 46],
  [STYLE.mist]: [18, 23, 29],
};
const SIZE_NAME = ["small", "medium", "large"];

/** Draws a sprite centred on the origin with its longest side `size` world pixels long. */
function blitLong(ctx: CanvasRenderingContext2D, img: HTMLImageElement, size: number) {
  const k = size / Math.max(img.naturalWidth, img.naturalHeight);
  const w = img.naturalWidth * k;
  const h = img.naturalHeight * k;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
}

/** One of the pilots' own shots. In a duel each shot glows in its pilot's colour, so nobody dodges their own. */
function drawShot(ctx: CanvasRenderingContext2D, b: Bullet, time: number, team?: string) {
  const style = b.style ?? STYLE.bubble;
  const rank = Math.max(0, Math.min(2, b.rank ?? 0));
  ctx.save();
  ctx.translate(b.x, b.y);
  if (team) {
    const halo = b.r * 2 + 8;
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = team;
    ctx.beginPath();
    ctx.arc(0, 0, halo, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.strokeStyle = team;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const heading = Math.atan2(b.vy, b.vx) + Math.PI / 2;
  const family = SHOT_ART[style];
  if (family) {
    const img = art(`g/${family}_projectile_${SIZE_NAME[rank]}`);
    let size = SHOT_SIZE[style][rank];
    // support shots (pods) are the same gun, half the size
    if (b.r < 2) size *= 0.62;
    if (style === STYLE.flush) size = Math.max(size, b.r * 2.5);
    if (style === STYLE.mist) {
      // the mist swells and thins as it runs out of reach
      const left = Math.max(0, Math.min(1, b.life / MIST_LIFE));
      size *= 1.9 - left * 0.9;
      ctx.globalAlpha = 0.35 + left * 0.65;
    }
    if (style === STYLE.bubble) ctx.rotate(Math.sin(time * 9 + b.x * 0.3) * 0.2);
    else if (style === STYLE.zap) ctx.rotate(heading + Math.sin(time * 40 + b.y) * 0.18);
    else ctx.rotate(heading);
    if (img) {
      if (b.hot) {
        ctx.shadowColor = "#ffb07a";
        ctx.shadowBlur = 6;
      }
      blitLong(ctx, img, size);
    } else {
      ctx.fillStyle = SHOT_TINT[style];
      ctx.beginPath();
      ctx.ellipse(0, 0, size * 0.25, size * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (style >= 20 && drawSpecialShot(ctx, style, b, time)) {
    // one of the six newer guns: painted in guns.ts
  } else if (style === STYLE.plunger || b.homing) {
    ctx.rotate(heading);
    const img = art("g/plunger_missile_projectile");
    if (img) blitLong(ctx, img, 30);
    else drawMissile(ctx, b.hot);
  } else if (style === STYLE.bathBomb) {
    ctx.rotate(heading + Math.sin(time * 14) * 0.15);
    const img = art("g/bath_bomb_projectile");
    if (img) blitLong(ctx, img, 34);
    else drawNeutron(ctx, 7, true);
  } else if (style === STYLE.paperRoll || style === STYLE.ribbon) {
    const img = art("g/paper_roll_projectile");
    if (style === STYLE.ribbon) {
      // the strip of paper it leaves behind, back toward where it started
      const dir = Math.sign(b.vx) || 1;
      const len = Math.min(170, (b.age ?? 0) * 760);
      ctx.fillStyle = "rgba(240,228,200,0.92)";
      ctx.fillRect(dir > 0 ? -len : 0, -4, len, 8);
      ctx.fillStyle = "rgba(120,100,70,0.35)";
      for (let x = 14; x < len; x += 18) ctx.fillRect(dir > 0 ? -x : x, -4, 1.2, 8);
    } else ctx.rotate(time * 9);
    if (img) blitLong(ctx, img, 34);
    else drawNeutron(ctx, 7, false);
  } else if (style === STYLE.buddy) {
    ctx.fillStyle = "rgba(79,214,232,0.35)";
    ctx.beginPath();
    ctx.ellipse(0, 3, 3.6, 9, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d8fbff";
    ctx.beginPath();
    ctx.ellipse(0, 0, 2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.rotate(heading);
    drawPulse(ctx, b.r, b.hot);
  }
  ctx.restore();
}

/** The splash a shot leaves where it lands. */
function drawPuffs(ctx: CanvasRenderingContext2D, w: World) {
  for (const p of w.puffs) {
    const left = Math.max(0, p.life / p.max);
    const grow = 0.65 + (1 - left) * 0.6;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalAlpha = Math.min(1, left * 1.6);
    const family = SHOT_ART[p.style];
    const img = family ? art(`g/${family}_impact`) : null;
    if (img) blitLong(ctx, img, p.size * grow);
    else if (p.style >= 20 && drawSpecialPuff(ctx, p.style, p.size, left, p.x)) {
      // painted in guns.ts
    } else if (p.style === STYLE.bathBomb) {
      // foam: a cluster of bubbles blowing outward
      for (let i = 0; i < 9; i++) {
        const a = i * 2.4 + p.x * 0.01;
        const d = p.size * 0.26 * grow * (0.55 + (i % 3) * 0.28);
        const r = p.size * (0.13 + (i % 4) * 0.035) * grow;
        ctx.fillStyle = i % 2 ? "rgba(226,214,255,0.85)" : "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.strokeStyle = "#f0e4c8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 0.4 * grow, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }
}

/** A lightning jump: a jagged bright line that redraws itself every frame. */
function drawArc(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number, left: number, time: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const len = Math.hypot(dx, dy) || 1;
  const nx = -dy / len;
  const ny = dx / len;
  const steps = Math.max(3, Math.round(len / 16));
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, left));
  ctx.lineJoin = "round";
  for (const [width, color] of [[5, "rgba(245,210,28,0.45)"], [2, "#fffbe0"]] as const) {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    for (let i = 1; i < steps; i++) {
      const t = i / steps;
      const off = Math.sin(i * 12.9898 + Math.floor(time * 60) * 78.233) * 7;
      ctx.lineTo(x1 + dx * t + nx * off, y1 + dy * t + ny * off);
    }
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Second-weapon ammo: the crate's picture and how many shots are left. */
function drawAmmo(ctx: CanvasRenderingContext2D, p: Player, x: number, y: number) {
  if (p.missiles <= 0) return;
  const path = `k/${AMMO[p.sec] ?? AMMO[0]}_pickup`;
  const icon = art(path);
  ctx.save();
  ctx.translate(x + 9, y);
  if (icon) blitLong(ctx, icon, 18);
  ctx.fillStyle = EMBER;
  ctx.font = "600 14px Barlow Condensed, sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(`×${p.missiles}`, 13, 5);
  ctx.restore();
}

function drawBullet(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  vx: number,
  vy: number,
  r: number,
  friendly: boolean,
  homing: boolean,
  hot: boolean,
  tint: number,
  shape = 0,
  style = 0,
  time = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  if (friendly) {
    ctx.rotate(Math.atan2(vy, vx) + Math.PI / 2);
    if (style === 4 || homing) drawMissile(ctx, hot);
    else if (style === 3) drawLance(ctx, hot);
    else if (style === 2) drawNeutron(ctx, r, hot);
    else if (style === 1) drawFan(ctx, hot);
    else drawPulse(ctx, r, hot);
  } else {
    const small = WORLD_W < 560;
    if (!drawHostileShot(ctx, shape, x, y, vx, vy, time, small, tint)) {
      // art still loading: plain painted fallback
      if (small) ctx.scale(0.8, 0.8);
      ctx.rotate(Math.sin(y * 0.09 + x * 0.04) * 0.45);
      drawPoop(ctx, shape, Math.max(5.5, r * 1.7), tint);
    }
  }
  ctx.restore();
}

function drawPulse(ctx: CanvasRenderingContext2D, r: number, hot: boolean) {
  const len = 16;
  const w = Math.max(2.4, r * 1.15);
  ctx.fillStyle = hot ? "rgba(224,122,61,0.35)" : "rgba(126,182,214,0.35)";
  ctx.beginPath();
  ctx.ellipse(0, 2, w * 1.5, len * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot ? EMBER : COLD;
  ctx.beginPath();
  ctx.moveTo(0, -len);
  ctx.lineTo(w, 4);
  ctx.lineTo(0, 8);
  ctx.lineTo(-w, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#f7fbff";
  ctx.beginPath();
  ctx.moveTo(0, -len + 3);
  ctx.lineTo(w * 0.35, 0);
  ctx.lineTo(0, 3);
  ctx.lineTo(-w * 0.35, 0);
  ctx.closePath();
  ctx.fill();
}

function drawFan(ctx: CanvasRenderingContext2D, hot: boolean) {
  ctx.fillStyle = hot ? "rgba(255,210,160,0.4)" : "rgba(224,164,90,0.38)";
  ctx.beginPath();
  ctx.ellipse(0, 2, 3.4, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot ? "#ffd7a8" : "#e7a85a";
  ctx.beginPath();
  ctx.moveTo(0, -9);
  ctx.lineTo(3.4, 2);
  ctx.lineTo(0, 6);
  ctx.lineTo(-3.4, 2);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#fff6e8";
  ctx.fillRect(-0.7, -6, 1.4, 6);
}

function drawNeutron(ctx: CanvasRenderingContext2D, r: number, hot: boolean) {
  const rad = Math.max(6.5, r * 1.35);
  ctx.fillStyle = hot ? "rgba(224,180,70,0.28)" : "rgba(150,210,80,0.28)";
  ctx.beginPath();
  ctx.arc(0, 0, rad * 1.55, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot ? "#d2e07a" : "#9ed24a";
  ctx.beginPath();
  ctx.arc(0, 0, rad, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,240,0.8)";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 0, rad * 0.62, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "#f4ffe4";
  ctx.beginPath();
  ctx.arc(-rad * 0.2, -rad * 0.22, rad * 0.28, 0, Math.PI * 2);
  ctx.fill();
}

function drawLance(ctx: CanvasRenderingContext2D, hot: boolean) {
  ctx.fillStyle = hot ? "rgba(255,180,120,0.35)" : "rgba(255,244,230,0.28)";
  ctx.fillRect(-3.2, -18, 6.4, 34);
  ctx.fillStyle = hot ? "#ffb07a" : "#fff1e4";
  ctx.fillRect(-1.5, -22, 3, 40);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(-0.55, -20, 1.1, 34);
}

function drawMissile(ctx: CanvasRenderingContext2D, hot: boolean) {
  ctx.fillStyle = hot ? "rgba(224,122,61,0.85)" : "#e07a3d";
  ctx.beginPath();
  ctx.moveTo(0, 7);
  ctx.lineTo(2.2, 12);
  ctx.lineTo(-2.2, 12);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#e7edf2";
  ctx.beginPath();
  ctx.moveTo(0, -10);
  ctx.lineTo(3.1, 4);
  ctx.lineTo(-3.1, 4);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c44536";
  ctx.fillRect(-2.4, 1, 4.8, 2.2);
}

function drawPoop(ctx: CanvasRenderingContext2D, shape: number, s: number, tint: number) {
  const fill =
    shape === 5 ? "#b7e4f2" :
    shape === 6 ? "#c4a574" :
    shape === 7 ? "#e7c07a" :
    shape === 8 ? "#e2b84a" :
    shape === 9 ? "#8fce6a" :
    shape === 10 ? "rgba(244,251,255,0.85)" :
    shape === 11 ? "#c44536" :
    shape === 12 ? "#f2d24a" :
    shape === 13 ? "#d07ad4" :
    shape === 14 ? "#e2b84a" :
    shape === 15 ? "#d5f4ff" :
    shape === 16 ? "rgba(150,190,90,0.55)" :
    shape === 4 ? "#6d8f3c" : "#8a5a32";
  ctx.fillStyle = fill;
  ctx.strokeStyle = "#2a140c";
  ctx.lineWidth = 1.4;
  if (shape === 16) {
    ctx.beginPath();
    ctx.ellipse(0, 0, s * 0.9, s * 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#1c140f";
    ctx.font = "700 8px Barlow Condensed, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("pfft", 0, 3);
    void tint;
    return;
  }
  if (shape === 15) {
    ctx.beginPath();
    ctx.moveTo(0, -s);
    ctx.lineTo(s * 0.7, 0);
    ctx.lineTo(0, s);
    ctx.lineTo(-s * 0.7, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    return;
  }
  if (shape === 1) {
    for (const x of [-s * 0.55, 0, s * 0.55]) {
      ctx.beginPath();
      ctx.arc(x, 0, s * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    return;
  }
  ctx.beginPath();
  ctx.ellipse(0, s * 0.42, s * (shape === 7 || shape === 11 ? 0.45 : 0.85), s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.05, s * 0.62, s * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (shape !== 7) {
    ctx.beginPath();
    ctx.arc(0, -s * 0.48, s * 0.32, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  if (shape === 14) {
    ctx.fillStyle = "#fff1b8";
    ctx.beginPath();
    ctx.moveTo(0, -s * 1.05);
    ctx.lineTo(s * 0.22, -s * 0.7);
    ctx.lineTo(-s * 0.22, -s * 0.7);
    ctx.fill();
  }
  ctx.fillStyle = "#f4fbff";
  ctx.beginPath();
  ctx.arc(-s * 0.16, -s * 0.58, s * 0.08, 0, Math.PI * 2);
  ctx.arc(s * 0.16, -s * 0.58, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  void tint;
}

const GIFTS = ["bubble_blaster", "soap_cannon", "toothpaste_laser", "zap_brush", "flush_wave", "freshener_mist"];
const AMMO = ["plunger_missile", "bath_bomb", "paper_roll"];

/** The picture a pickup wears. A gift box shows the gun family inside, an ammo crate its kind. */
function pickupArt(kind: string, hue: number) {
  if (kind === "W") return hue < 0 ? "k/gift_orange" : `k/${GIFTS[((hue % GIFTS.length) + GIFTS.length) % GIFTS.length]}_gift`;
  if (kind === "M") return `k/${AMMO[((hue % AMMO.length) + AMMO.length) % AMMO.length]}_pickup`;
  if (kind === "S") return "k/shield_bubble";
  if (kind === "B") return "k/air_freshener";
  if (kind === "D") return "k/rubber_duck";
  if (kind === "$") return "k/gold_coin";
  if (kind === "L") return "k/extra_life";
  if (kind === "G") return "k/magnet";
  if (kind === "Y") return "k/brush_buddy";
  if (kind === "F") return `k/${["pizza", "fries", "chicken_drumstick"][((hue % 3) + 3) % 3]}`;
  if (kind === "C") return "k/coffee";
  if (kind === "T") return "k/silver_star";
  return "";
}

function drawPickup(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, time: number, hue = 0) {
  ctx.save();
  ctx.translate(x, y);
  const small = WORLD_W < 560;
  const gift = hue < 0 ? "#ffb347" : hue === 1 ? "#9ed24a" : hue === 2 ? "#e07a3d" : "#7eb6d6";
  const tone = kind === "W" ? gift : kind === "S" ? "#bfe3f5" : kind === "B" ? "#9ed24a" : kind === "D" ? "#f2d24a" : kind === "M" ? "#ff8f6b" : "#e2b84a";
  const power = kind !== "$" && kind !== "F";
  if (power) {
    // Power-ups glow: a soft pool of light in their colour and two orbiting
    // sparkles. Nothing hostile ever glows, so the two cannot be confused.
    const reach = (small ? 21 : 25) + Math.sin(time * 5 + x) * 2;
    const glow = ctx.createRadialGradient(0, 0, 3, 0, 0, reach);
    glow.addColorStop(0, tone + "aa");
    glow.addColorStop(0.55, tone + "40");
    glow.addColorStop(1, tone + "00");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(0, 0, reach, 0, Math.PI * 2);
    ctx.fill();
    const a = time * 2.4 + x * 0.05;
    drawStar(ctx, Math.cos(a) * reach * 0.78, Math.sin(a) * reach * 0.78, 3.4, "#ffffff");
    drawStar(ctx, Math.cos(a + 2.6) * reach * 0.7, Math.sin(a + 2.6) * reach * 0.7, 2.4, tone);
  }
  // Every gift floats in a soap bubble. Enemy shots have a hot red-orange outline and
  // never a bubble, so "inside a bubble" always means "pick it up".
  {
    ctx.translate(Math.sin(time * 2.1 + x * 0.05) * 3, 0);
    const k = small ? 0.9 : 1;
    const rad = (power ? 23 : kind === "$" ? 14 : 16.5) * k;
    const body = ctx.createRadialGradient(-rad * 0.32, -rad * 0.38, rad * 0.08, 0, 0, rad);
    body.addColorStop(0, "rgba(255,255,255,0.5)");
    body.addColorStop(0.6, "rgba(210,238,255,0.12)");
    body.addColorStop(1, "rgba(150,215,255,0.34)");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(0, 0, rad, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.92)";
    ctx.lineWidth = power ? 2.2 : 1.6;
    ctx.stroke();
    if (power) {
      // a slow ring of the gift's own colour breathes outwards from the bubble
      const t = (time * 0.9 + x * 0.01) % 1;
      ctx.strokeStyle = tone + Math.round((1 - t) * 150).toString(16).padStart(2, "0");
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, rad + 2 + t * 10, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(255,255,255,0.95)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, rad * 0.74, Math.PI * 1.08, Math.PI * 1.42);
    ctx.stroke();
  }
  const iconPath = pickupArt(kind, hue);
  const icon = iconPath ? art(iconPath) : null;
  if (iconPath && icon) {
    ctx.translate(0, Math.sin(time * 4 + x) * 1.6);
    if (power) ctx.rotate(Math.sin(time * 2.2 + x) * 0.14);
    else if (kind === "$") ctx.scale(0.55 + Math.abs(Math.sin(time * 3 + x)) * 0.45, 1);
    else ctx.rotate(Math.sin(time * 3 + x) * 0.25);
    const size = (power ? 31 : kind === "F" ? 27 : 21) * (small ? 0.88 : 1);
    blitMass(ctx, iconPath, icon, size, 0);
    ctx.restore();
    return;
  }
  const z = (small ? 1.05 : 1.3) * (power ? 1 : 0.9);
  ctx.scale(z, z);
  ctx.translate(0, Math.sin(time * 4 + x) * 1.4);
  if (power) ctx.rotate(Math.sin(time * 2.2 + x) * 0.14);
  // dark backing so the object keeps its shape against a bright sky
  ctx.shadowColor = "rgba(0,0,0,0.75)";
  ctx.shadowBlur = 5;
  if (kind === "W") {
    // gift box in the colour of the gun family it holds
    ctx.fillStyle = gift;
    ctx.fillRect(-8, -4, 16, 12);
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    ctx.fillRect(-8, -4, 16, 3);
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(-1.6, -4, 3.2, 12);
    ctx.fillRect(-8, -0.5, 16, 2.4);
    ctx.beginPath();
    ctx.ellipse(-3.4, -6.4, 3.4, 2.2, -0.5, 0, Math.PI * 2);
    ctx.ellipse(3.4, -6.4, 3.4, 2.2, 0.5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === "$") {
    const squash = 0.55 + Math.abs(Math.sin(time * 3 + x)) * 0.45;
    ctx.scale(squash, 1);
    ctx.fillStyle = "#e2b84a";
    ctx.beginPath();
    ctx.arc(0, 0, 8.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#8a6230";
    ctx.lineWidth = 1.4;
    ctx.stroke();
    ctx.fillStyle = "#8a6230";
    ctx.font = "700 11px Barlow Condensed, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("$", 0, 0.5);
    ctx.textBaseline = "alphabetic";
  } else if (kind === "S") {
    // toilet paper roll
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(-7, -5, 14, 11);
    ctx.beginPath();
    ctx.ellipse(0, -5, 7, 3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#d9d3c8";
    ctx.beginPath();
    ctx.ellipse(0, 6, 7, 3, 0, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = "#8a8175";
    ctx.beginPath();
    ctx.ellipse(0, -5, 2.6, 1.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(5, -1, 4, 9);
  } else if (kind === "B") {
    // air freshener spray can
    ctx.fillStyle = "#9ed24a";
    ctx.fillRect(-4.5, -3, 9, 12);
    ctx.fillStyle = "#f7f4ee";
    ctx.fillRect(-4.5, 1, 9, 3);
    ctx.fillStyle = "#d5dbe2";
    ctx.fillRect(-3, -6, 6, 3);
    ctx.fillStyle = "#c44536";
    ctx.fillRect(-1.5, -9, 3, 3);
    ctx.fillStyle = "rgba(244,251,255,0.8)";
    for (const [px, py] of [[5, -9], [7.5, -7.5], [7.5, -10.5]] as const) {
      ctx.beginPath();
      ctx.arc(px, py, 0.9, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === "M") {
    // plunger
    ctx.fillStyle = "#e6d3b0";
    ctx.fillRect(-1.2, -10, 2.4, 13);
    ctx.fillStyle = "#c44536";
    ctx.beginPath();
    ctx.moveTo(-7, 8);
    ctx.quadraticCurveTo(-6, 1, 0, 1);
    ctx.quadraticCurveTo(6, 1, 7, 8);
    ctx.closePath();
    ctx.fill();
  } else if (kind === "D") {
    // rubber duck
    ctx.fillStyle = "#f2d24a";
    ctx.beginPath();
    ctx.ellipse(-1, 3, 8, 5.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(4, -4, 4.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#e07a3d";
    ctx.beginPath();
    ctx.moveTo(7.5, -4.5);
    ctx.lineTo(11.5, -3.2);
    ctx.lineTo(7.5, -2);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1a120e";
    ctx.beginPath();
    ctx.arc(5, -5, 0.9, 0, Math.PI * 2);
    ctx.fill();
  } else drawLoot(ctx, kind, time, x);
  ctx.restore();
}

/** One sewer pipe across the screen, with its gaps, the brass collars at the gaps and the valve. */
function drawPipe(ctx: CanvasRenderingContext2D, h: VHazard, time: number, level: number) {
  const half = h.h / 2;
  const top = h.y - half;
  const pal = CHAPTERS[chapterIndex(level)] ?? CHAPTERS[0];
  const gaps = [h.x, ...(h.x2 !== undefined ? [h.x2] : [])].sort((a, b) => a - b);
  // the solid stretches between the gaps
  const runs: [number, number][] = [];
  let from = -20;
  for (const g of gaps) {
    runs.push([from, g - h.w / 2]);
    from = g + h.w / 2;
  }
  runs.push([from, WORLD_W + 20]);
  const body = ctx.createLinearGradient(0, top, 0, top + h.h);
  body.addColorStop(0, "#2f4138");
  body.addColorStop(0.28, "#8fb39c");
  body.addColorStop(0.5, "#5f8571");
  body.addColorStop(1, "#22302a");
  ctx.lineJoin = "round";
  for (const [a, b] of runs) {
    if (b - a < 4) continue;
    ctx.fillStyle = body;
    ctx.strokeStyle = "#120f0d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.rect(a, top, b - a, h.h);
    ctx.fill();
    ctx.stroke();
    // bands and a stain or two, fixed to the pipe
    ctx.fillStyle = "rgba(18,15,13,0.45)";
    for (let x = Math.ceil((a + 30) / 96) * 96; x < b - 24; x += 96) ctx.fillRect(x, top + 1.5, 5, h.h - 3);
    ctx.fillStyle = "rgba(106,68,36,0.7)";
    for (let x = Math.ceil((a + 60) / 170) * 170; x < b - 30; x += 170) {
      ctx.beginPath();
      ctx.ellipse(x, top + h.h, 9, 4 + hash(x, h.w) * 5, 0, 0, Math.PI);
      ctx.fill();
    }
  }
  // brass collars where the pipe is cut, lit in the room's colour when the gap slides
  for (const g of gaps) {
    for (const side of [-1, 1]) {
      const cx = g + side * (h.w / 2);
      ctx.fillStyle = "#c9a24a";
      ctx.strokeStyle = "#120f0d";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.rect(cx - (side < 0 ? 12 : 0), top - 6, 12, h.h + 12);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "rgba(255,244,200,0.55)";
      ctx.fillRect(cx - (side < 0 ? 10 : -2), top - 3, 8, 3);
      if (h.vx !== 0) {
        ctx.fillStyle = pal.accent;
        ctx.globalAlpha = 0.6 + 0.4 * Math.sin(time * 10);
        ctx.fillRect(cx - (side < 0 ? 12 : 0), top + half - 2, 12, 4);
        ctx.globalAlpha = 1;
      }
    }
  }
  if (h.hp > 0) {
    // the valve: a red wheel that shudders when it is hit and shows how much is left
    const hit = h.t > 0;
    ctx.save();
    ctx.translate(h.phase + (hit ? Math.sin(time * 90) * 1.5 : 0), h.y);
    ctx.fillStyle = "#120f0d";
    ctx.beginPath();
    ctx.arc(0, 0, 23, 0, Math.PI * 2);
    ctx.fill();
    ctx.rotate(time * 1.4 + (1 - h.hp / (h.max || h.hp)) * 5);
    ctx.strokeStyle = hit ? "#ffffff" : "#e0433a";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, 0, 16, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 3.5;
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(-Math.cos(a) * 16, -Math.sin(a) * 16);
      ctx.stroke();
    }
    ctx.fillStyle = hit ? "#ffffff" : "#f2d24a";
    ctx.beginPath();
    ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.strokeStyle = "rgba(244,251,255,0.85)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(h.phase, h.y, 27, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0, h.hp / (h.max || h.hp)));
    ctx.stroke();
  }
}

function drawHazard(ctx: CanvasRenderingContext2D, h: VHazard, time: number, level = 1) {
  ctx.save();
  if (h.kind === "pipe") {
    drawPipe(ctx, h, time, level);
  } else if (h.kind === "pane") {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = "#cfe7f2";
    ctx.fillRect(h.x - h.w / 2, h.y - h.h / 2, h.w, h.h);
  } else if (h.kind === "well") {
    ctx.strokeStyle = "rgba(126,182,214,0.5)";
    ctx.beginPath();
    ctx.arc(h.x, h.y, 28 + Math.sin(time * 3) * 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(h.x, h.y, 78, 0, Math.PI * 2);
    ctx.stroke();
  } else if (h.kind === "goo") {
    ctx.fillStyle = "rgba(210,168,74,0.8)";
    ctx.beginPath();
    ctx.ellipse(h.x, h.y, 16, 10, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (h.kind === "cloud") {
    ctx.fillStyle = h.phase > 0 ? "rgba(80,90,80,0.2)" : "rgba(120,180,90,0.35)";
    ctx.beginPath();
    ctx.ellipse(h.x, h.y, h.w / 2, h.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  } else if (h.kind === "portal") {
    ctx.strokeStyle = "#f4fbff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(h.x, h.y, 14, 0, Math.PI * 2);
    ctx.stroke();
  } else if (h.kind === "flare") {
    ctx.globalAlpha = h.t < 0 ? 0.5 : 0.18;
    ctx.fillStyle = "#c44536";
    ctx.fillRect(0, h.y - h.h / 2, h.w, h.h);
  } else if (h.kind === "strike" || h.kind === "sweep") {
    const upright = h.kind === "strike";
    const x0 = upright ? h.x - h.w / 2 : 0;
    const y0 = upright ? 0 : h.y - h.h / 2;
    const ww = upright ? h.w : WORLD_W;
    const hh = upright ? WORLD_H : h.h;
    if (h.t > 0) {
      // marked: it fills up as the strike gets closer, so you can see how long you have
      const due = 1 - Math.min(1, h.t / Math.max(0.1, h.phase));
      ctx.globalAlpha = 0.1 + due * 0.16 + Math.sin(h.t * 30) * 0.03;
      ctx.fillStyle = "#ff5a4a";
      ctx.fillRect(x0, y0, ww, hh);
      ctx.globalAlpha = 0.75;
      ctx.strokeStyle = "#ffd0c8";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 8]);
      ctx.lineDashOffset = -h.t * 60;
      ctx.beginPath();
      if (upright) {
        ctx.moveTo(x0, 0);
        ctx.lineTo(x0, WORLD_H);
        ctx.moveTo(x0 + ww, 0);
        ctx.lineTo(x0 + ww, WORLD_H);
      } else {
        ctx.moveTo(0, y0);
        ctx.lineTo(WORLD_W, y0);
        ctx.moveTo(0, y0 + hh);
        ctx.lineTo(WORLD_W, y0 + hh);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      // the inner bar closes in on the middle of the lane
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#fff0ec";
      if (upright) ctx.fillRect(h.x - (ww * due) / 2, 0, ww * due, WORLD_H);
      else ctx.fillRect(0, h.y - (hh * due) / 2, WORLD_W, hh * due);
    } else {
      const fade = Math.max(0, 1 + h.t / STRIKE_TIME);
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = "#bfe9ff";
      ctx.fillRect(x0, y0, ww, hh);
      ctx.fillStyle = "#ffffff";
      if (upright) ctx.fillRect(h.x - ww * 0.22, 0, ww * 0.44, WORLD_H);
      else ctx.fillRect(0, h.y - hh * 0.22, WORLD_W, hh * 0.44);
    }
  } else if (h.kind === "bolt") {
    ctx.globalAlpha = h.t < 1.2 ? 0.4 : 0.12;
    ctx.fillStyle = "#f2d24a";
    ctx.fillRect(h.x - h.w / 2, 0, h.w, h.h);
  }
  ctx.restore();
}

