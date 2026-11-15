/**
 * The six shop guns that came after the first six: what their shots look like in the air
 * and where they land. Everything here is painted in code. The parts that never change
 * (a rubber ball, a sponge, a puff of hot air) are painted once on a small canvas and
 * stamped from then on; what moves (a ribbon's wave, a ring's echo, the drips) is drawn live.
 */
import { BIDET_CD, DRYER_LIFE, STYLE } from "./v3";

type ShotLike = {
  vx: number;
  vy: number;
  r: number;
  life: number;
  age?: number;
  seed?: number;
  soaked?: number;
  squash?: number;
  hot?: boolean;
};

const INK = "#3a281e";
const stamps = new Map<string, HTMLCanvasElement | null>();

/** A picture painted once, `size` world pixels square, kept at three times that for sharp edges. */
function stamp(key: string, size: number, paint: (g: CanvasRenderingContext2D) => void) {
  let c = stamps.get(key);
  if (c === undefined) {
    c = null;
    if (typeof document !== "undefined") {
      const el = document.createElement("canvas");
      el.width = size * 3;
      el.height = size * 3;
      const g = el.getContext("2d");
      if (g) {
        g.scale(3, 3);
        g.translate(size / 2, size / 2);
        paint(g);
        c = el;
      }
    }
    stamps.set(key, c);
  }
  return c;
}

/** A rounded box, without leaning on roundRect (older phones do not have it). */
function box(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}

const BALLS = ["#ff5fa2", "#a8e04a", "#4fd6e8", "#ffb347"];
const RIBBONS = ["#c9a6ff", "#8fe3c0", "#ffb3c7", "#ffe08a"];

function ball(i: number) {
  const color = BALLS[i % BALLS.length];
  return stamp(`ball${i % BALLS.length}`, 36, (g) => {
    const shade = g.createRadialGradient(-4, -5, 2, 0, 0, 15);
    shade.addColorStop(0, "#ffffff");
    shade.addColorStop(0.28, color);
    shade.addColorStop(1, "#00000055");
    g.fillStyle = color;
    g.beginPath();
    g.arc(0, 0, 14, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = shade;
    g.fill();
    // the seam every rubber ball has
    g.strokeStyle = "rgba(255,255,255,0.75)";
    g.lineWidth = 2.2;
    g.beginPath();
    g.arc(0, 18, 21, Math.PI * 1.22, Math.PI * 1.78);
    g.stroke();
    g.strokeStyle = INK;
    g.lineWidth = 2;
    g.beginPath();
    g.arc(0, 0, 14, 0, Math.PI * 2);
    g.stroke();
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.beginPath();
    g.ellipse(-5, -6.5, 3.2, 2, -0.6, 0, Math.PI * 2);
    g.fill();
  });
}

function spongeStamp(dirty: boolean) {
  return stamp(dirty ? "sponge_dirty" : "sponge", 48, (g) => {
    const body = g.createLinearGradient(0, -14, 0, 14);
    body.addColorStop(0, dirty ? "#b98445" : "#ffe27a");
    body.addColorStop(1, dirty ? "#7d5326" : "#e6a93a");
    g.fillStyle = body;
    g.strokeStyle = INK;
    g.lineWidth = 2;
    box(g, -18, -13, 36, 26, 7);
    g.fill();
    g.stroke();
    g.fillStyle = dirty ? "#5c3b18" : "#c98f2a";
    for (const [x, y, rx, ry] of [
      [-11, -6, 2.6, 2.1],
      [-3, 1, 3.2, 2.6],
      [7, -6, 2.3, 1.9],
      [12, 5, 2.7, 2.2],
      [-11, 6, 2, 1.7],
      [3, 8, 1.7, 1.4],
      [-2, -8, 1.5, 1.2],
    ]) {
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = dirty ? "rgba(255,230,190,0.35)" : "rgba(255,255,255,0.8)";
    g.lineWidth = 2;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-12, -9.5);
    g.lineTo(8, -9.5);
    g.stroke();
  });
}

function hotAir() {
  return stamp("hot_air", 64, (g) => {
    const glow = g.createRadialGradient(0, 0, 2, 0, 0, 30);
    glow.addColorStop(0, "rgba(255,240,200,0.95)");
    glow.addColorStop(0.42, "rgba(255,140,90,0.62)");
    glow.addColorStop(1, "rgba(255,95,130,0)");
    g.fillStyle = glow;
    g.beginPath();
    g.arc(0, 0, 30, 0, Math.PI * 2);
    g.fill();
    g.lineCap = "round";
    g.strokeStyle = "rgba(255,248,232,0.85)";
    g.lineWidth = 2.6;
    g.beginPath();
    g.arc(-2, 1, 9, 0.2, 2.9);
    g.stroke();
    g.lineWidth = 2;
    g.strokeStyle = "rgba(255,226,196,0.7)";
    g.beginPath();
    g.arc(3, -2, 17, 3.5, 5.7);
    g.stroke();
    g.beginPath();
    g.arc(-1, 3, 23, 0.6, 1.9);
    g.stroke();
  });
}

function waterDrop() {
  // one stretch of the jet: a bar with no ends, bright down the middle, soft at the sides,
  // so that one stretch laid over the next reads as a single stream
  return stamp("water", 32, (g) => {
    const halo = g.createLinearGradient(-8, 0, 8, 0);
    halo.addColorStop(0, "rgba(120,200,255,0)");
    halo.addColorStop(0.5, "rgba(120,200,255,0.45)");
    halo.addColorStop(1, "rgba(120,200,255,0)");
    g.fillStyle = halo;
    g.fillRect(-8, -16, 16, 32);
    const across = g.createLinearGradient(-4.5, 0, 4.5, 0);
    across.addColorStop(0, "#2f8fe0");
    across.addColorStop(0.5, "#f4fcff");
    across.addColorStop(1, "#2f8fe0");
    g.fillStyle = across;
    g.fillRect(-4.5, -16, 9, 32);
    g.fillStyle = "rgba(14,60,130,0.55)";
    g.fillRect(-5.2, -16, 0.9, 32);
    g.fillRect(4.3, -16, 0.9, 32);
  });
}

/**
 * Draws one shot of the six newer guns, centred on the current origin.
 * Returns false for any other style, or before a canvas exists.
 */
export function drawSpecialShot(ctx: CanvasRenderingContext2D, style: number, b: ShotLike, time: number) {
  const seed = b.seed ?? 0;
  const age = b.age ?? 0;
  const speed = Math.hypot(b.vx, b.vy) || 1;
  const heading = Math.atan2(b.vy, b.vx) + Math.PI / 2;
  const small = b.r < 2.4;

  if (style === STYLE.dryer) {
    const img = hotAir();
    if (!img) return false;
    const left = Math.max(0, Math.min(1, b.life / DRYER_LIFE));
    const size = Math.max(14, b.r * 2.9);
    ctx.globalAlpha = Math.min(1, 0.25 + left * 1.1);
    ctx.rotate(time * 5 + seed * 1.7);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    ctx.globalAlpha = 1;
    return true;
  }

  if (style === STYLE.bidet) {
    const img = waterDrop();
    if (!img) return false;
    // each drop is a little longer than the gap to the next, so the jet has no breaks,
    // and short enough that it does not poke out the far side of what it hits
    const len = Math.max(20, speed * BIDET_CD * 1.25) * (small ? 0.5 : 1);
    const wide = Math.max(9, b.r * 5.2) * (small ? 0.7 : 1) * (1 + Math.sin(time * 26 + seed * 2.1) * 0.1);
    ctx.rotate(heading);
    // the stamp is 16 wide by 32 long around its middle; the jet's own width is the middle 9 of that
    ctx.drawImage(img, 24, 0, 48, 96, -wide / 2, -len * 0.5, wide, len);
    if (seed % 3 === 0 && !small) {
      // spray: a few loose drops shaken off the side of the jet
      const side = (seed % 2 ? 1 : -1) * (wide * 0.3 + 2.5 + Math.sin(time * 18 + seed) * 2);
      ctx.fillStyle = "rgba(226,246,255,0.95)";
      ctx.beginPath();
      ctx.arc(side, Math.sin(seed) * 8, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }

  if (style === STYLE.sling) {
    const img = ball(seed);
    if (!img) return false;
    const color = BALLS[seed % BALLS.length];
    // two fading echoes behind it
    for (const [back, alpha, k] of [[0.03, 0.2, 0.7], [0.015, 0.36, 0.86]] as const) {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(-b.vx * back, -b.vy * back, b.r * 1.15 * k, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const size = b.r * 3.3 * (small ? 0.8 : 1);
    const k = Math.max(0, Math.min(1, (b.squash ?? 0) / 0.14));
    ctx.rotate(heading);
    // squashed flat where it has just bounced, stretched a little while it flies
    ctx.scale(1 + k * 0.5, 1.08 - k * 0.42);
    ctx.rotate(age * 11 + seed);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    return true;
  }

  if (style === STYLE.streamer) {
    const color = RIBBONS[seed % RIBBONS.length];
    const dx = -b.vx / speed;
    const dy = -b.vy / speed;
    const nx = -dy;
    const ny = dx;
    const links = Math.max(2, Math.min(small ? 6 : 11, Math.floor(2 + age * 34)));
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    for (let i = 1; i <= links; i++) {
      const along = i * 5.4;
      const off = Math.sin(i * 0.95 - time * 15 + seed) * (0.8 + i * 0.62);
      ctx.lineTo(dx * along + nx * off, dy * along + ny * off);
    }
    ctx.strokeStyle = "rgba(44,30,70,0.6)";
    ctx.lineWidth = small ? 4.6 : 6.6;
    ctx.stroke();
    ctx.strokeStyle = color;
    ctx.lineWidth = small ? 3 : 4.4;
    ctx.stroke();
    // the stripe down the middle of the paper
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 1.1;
    ctx.stroke();
    // the rolled-up end that leads the way
    ctx.fillStyle = "#fffaf0";
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 0, small ? 2.6 : 3.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(0, 0, small ? 1 : 1.5, 0, Math.PI * 2);
    ctx.fill();
    return true;
  }

  if (style === STYLE.sponge) {
    const img = spongeStamp(false);
    if (!img) return false;
    const soaked = b.soaked ?? 0;
    const size = b.r * 3.4;
    // drips falling off it
    ctx.fillStyle = soaked > 0 ? "rgba(150,104,56,0.9)" : "rgba(170,225,255,0.95)";
    for (let i = 0; i < 2; i++) {
      const t = (time * 1.9 + seed * 0.37 + i * 0.5) % 1;
      ctx.globalAlpha = 1 - t;
      ctx.beginPath();
      ctx.ellipse((i ? 1 : -1) * b.r * 0.55, b.r * 0.9 + t * 16, 1.7, 2.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    const wob = Math.sin(time * 11 + seed) * 0.09 + Math.max(0, (b.squash ?? 0) / 0.14) * 0.3;
    ctx.rotate(Math.sin(age * 2.6 + seed) * 0.4);
    ctx.scale(1 + wob, 1 - wob);
    ctx.drawImage(img, -size / 2, -size / 2, size, size);
    if (soaked > 0) {
      // every shot it has soaked up turns it browner
      const dirty = spongeStamp(true);
      if (dirty) {
        ctx.globalAlpha = Math.min(0.9, soaked * 0.34);
        ctx.drawImage(dirty, -size / 2, -size / 2, size, size);
        ctx.globalAlpha = 1;
      }
    }
    return true;
  }

  if (style === STYLE.duck) {
    ctx.rotate(heading);
    ctx.lineCap = "round";
    const beat = Math.sin(time * 20 + seed) * 0.9;
    const span = 1.2;
    const top = -Math.PI / 2;
    const fade = Math.min(1, b.life * 2.2);
    ctx.globalAlpha = 0.16 * fade;
    ctx.strokeStyle = "#ffd84a";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, b.r, 0, Math.PI * 2);
    ctx.stroke();
    // the squeak itself, and two echoes following it
    for (const [k, alpha, width] of [[0.4, 0.4, 1.8], [0.7, 0.65, 2.5], [1, 1, 3.6]] as const) {
      const rad = Math.max(2, b.r * k + beat * k);
      ctx.globalAlpha = alpha * fade;
      ctx.strokeStyle = "rgba(96,62,0,0.65)";
      ctx.lineWidth = width + 2;
      ctx.beginPath();
      ctx.arc(0, 0, rad, top - span, top + span);
      ctx.stroke();
      ctx.strokeStyle = k === 1 ? "#ffe066" : "#ffb52e";
      ctx.lineWidth = width;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    return true;
  }
  return false;
}

/** The mark one of these shots leaves where it lands. `left` runs from 1 to 0 over the puff's life. */
export function drawSpecialPuff(ctx: CanvasRenderingContext2D, style: number, size: number, left: number, x: number) {
  const out = 1 - left;
  if (style === STYLE.dryer) {
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(255,196,140,0.9)";
    ctx.lineWidth = 2.4;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i - 1) * 0.7;
      const d = size * (0.2 + out * 0.5);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, size * 0.16, a - 1.1, a + 1.1);
      ctx.stroke();
    }
    return true;
  }
  if (style === STYLE.bidet) {
    ctx.fillStyle = "rgba(244,252,255,0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.16 * left, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(120,200,255,0.95)";
    for (let i = 0; i < 7; i++) {
      const a = i * 0.9 + x * 0.05;
      const d = size * (0.18 + out * 0.5) * (0.7 + (i % 3) * 0.2);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d - out * 3, size * 0.07, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }
  if (style === STYLE.sling) {
    ctx.lineCap = "round";
    ctx.lineWidth = 2.6;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + x * 0.03;
      ctx.strokeStyle = BALLS[i % BALLS.length];
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * size * (0.18 + out * 0.2), Math.sin(a) * size * (0.18 + out * 0.2));
      ctx.lineTo(Math.cos(a) * size * (0.34 + out * 0.3), Math.sin(a) * size * (0.34 + out * 0.3));
      ctx.stroke();
    }
    return true;
  }
  if (style === STYLE.streamer) {
    for (let i = 0; i < 7; i++) {
      const a = i * 2.3 + x * 0.04;
      const d = size * (0.12 + out * 0.55) * (0.6 + (i % 3) * 0.25);
      ctx.save();
      ctx.translate(Math.cos(a) * d, Math.sin(a) * d + out * out * 8);
      ctx.rotate(a + out * 5);
      ctx.fillStyle = RIBBONS[i % RIBBONS.length];
      ctx.fillRect(-2.6, -1.4, 5.2, 2.8);
      ctx.restore();
    }
    return true;
  }
  if (style === STYLE.sponge) {
    for (let i = 0; i < 10; i++) {
      const a = i * 2.4 + x * 0.01;
      const d = size * (0.14 + out * 0.34) * (0.55 + (i % 3) * 0.28);
      const r = size * (0.1 + (i % 4) * 0.03) * (0.7 + out * 0.5);
      ctx.fillStyle = i % 3 === 0 ? "rgba(150,215,255,0.9)" : i % 2 ? "rgba(255,246,214,0.9)" : "rgba(255,255,255,0.92)";
      ctx.beginPath();
      ctx.arc(Math.cos(a) * d, Math.sin(a) * d, r, 0, Math.PI * 2);
      ctx.fill();
    }
    return true;
  }
  if (style === STYLE.duck) {
    ctx.strokeStyle = "#ffe066";
    ctx.lineWidth = 2.4;
    for (const k of [0.25, 0.42]) {
      ctx.beginPath();
      ctx.arc(0, 0, size * (k + out * 0.3), 0, Math.PI * 2);
      ctx.stroke();
    }
    return true;
  }
  return false;
}
