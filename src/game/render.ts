import { CHAPTERS, chapterOf, skinDef } from "./meta";
import { drawBossCreature, drawCritter, drawLoot } from "./critters";
import { WORLD_H, WORLD_W, type Enemy, type World } from "./world";

const STEEL = "#d5dbe2";
const STEEL_DIM = "#8e99a3";
const EMBER = "#e07a3d";
const COLD = "#7eb6d6";
const DANGER = "#c44536";

export function drawWorld(ctx: CanvasRenderingContext2D, w: World, focus: boolean) {
  const s = w.reduce ? 0 : w.trauma * w.trauma;
  ctx.save();
  ctx.translate(WORLD_W / 2, WORLD_H / 2);
  ctx.rotate(Math.sin(w.time * 91) * 0.012 * s);
  ctx.translate(-WORLD_W / 2, -WORLD_H / 2);
  ctx.translate(Math.sin(w.time * 71) * 9 * s, Math.cos(w.time * 63) * 7 * s);

  drawBackdrop(ctx, w);

  for (const pk of w.pickups) drawPickup(ctx, pk.kind, pk.x, pk.y, w.time);
  for (const e of w.enemies) drawEnemy(ctx, e, w.time, w.player.x, w.player.y);

  for (const b of w.bullets) {
    if (b.friendly) drawBullet(ctx, b.x, b.y, b.vx, b.vy, b.r, true, b.homing, b.hot, 0);
  }

  const showShip =
    w.mode === "play" || w.mode === "pause" || w.mode === "clear" || w.mode === "over" || w.mode === "victory";
  if (w.player.alive && showShip) drawPlayer(ctx, w, focus);

  for (const b of w.bullets) {
    if (!b.friendly) drawBullet(ctx, b.x, b.y, b.vx, b.vy, b.r, false, false, false, b.tint);
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

  ctx.font = "600 14px Barlow Condensed, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const f of w.floaters) {
    const k = Math.max(0, f.life / 0.8);
    ctx.globalAlpha = Math.min(1, k * 1.5);
    ctx.fillStyle = f.ember ? EMBER : STEEL;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
  ctx.textBaseline = "alphabetic";

  if (w.bannerT > 0 && (w.mode === "play" || w.mode === "pause")) {
    ctx.globalAlpha = Math.min(1, w.bannerT * 1.8);
    ctx.fillStyle = STEEL;
    ctx.font = `600 ${WORLD_W < 560 ? 18 : 28}px Barlow Condensed, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(w.banner, WORLD_W / 2, WORLD_W < 560 ? 78 : 92);
    ctx.globalAlpha = 1;
  }

  if (w.flash > 0) {
    ctx.fillStyle = `rgba(224, 122, 61, ${Math.min(0.28, w.flash * 0.7)})`;
    ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  }

  ctx.restore();

  if (w.mode === "play" || w.mode === "pause" || w.mode === "clear" || w.mode === "over" || w.mode === "victory") drawHud(ctx, w);
}

let hangarImg: HTMLImageElement | null = null;

function paintHangar(ctx: CanvasRenderingContext2D) {
  if (typeof Image === "undefined") return false;
  if (!hangarImg) {
    hangarImg = new Image();
    hangarImg.onload = () => {
      hangarImg && (hangarImg.dataset.ready = "1");
    };
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
  ctx.filter = "brightness(1.55) contrast(1.08)";
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

function drawBackdrop(ctx: CanvasRenderingContext2D, w: World) {
  const hangar = w.mode === "menu" || w.mode === "shop" || w.mode === "options" || w.mode === "standby";
  if (hangar && paintHangar(ctx)) return;

  const ch = chapterOf(Math.max(1, w.level || 1));
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
  for (let i = 0; i < w.player.lives; i++) {
    ctx.save();
    ctx.translate(52 + i * 16, 74);
    ctx.scale(0.32, 0.32);
    ctx.fillStyle = skin.hull;
    ctx.strokeStyle = skin.edge;
    ctx.lineWidth = 1.25;
    wingPath(ctx);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  const bw = 168;
  const bx = (WORLD_W - bw) / 2;
  const by = WORLD_H - 26;
  const seg = bw / 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i < w.player.weapon ? (w.player.feed > 0 ? EMBER : COLD) : "#1a2128";
    ctx.fillRect(bx + i * seg + 1, by, seg - 3, 3);
  }

  for (let i = 0; i < 5; i++) {
    const x = WORLD_W - 22 - (4 - i) * 11;
    ctx.strokeStyle = STEEL_DIM;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, by - 1, 7, 5);
    if (i < w.player.bombs) {
      ctx.fillStyle = EMBER;
      ctx.fillRect(x + 1, by, 5, 3);
    }
  }
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

function drawPlayer(ctx: CanvasRenderingContext2D, w: World, focus: boolean) {
  const p = w.player;
  const blink = p.inv > 0 && Math.sin(w.time * 38) > 0;
  if (!blink) {
    ctx.save();
    ctx.translate(p.x, p.y + p.muzzle * 36);
    ctx.rotate(p.bank);
    const feed = p.feed > 0;
    const flick = 0.45 + (Math.sin(w.time * 46) * 0.5 + 0.5) * 0.7;
    ctx.fillStyle = feed ? `rgba(224,122,61,${0.4 + flick * 0.45})` : `rgba(126,182,214,${0.28 + flick * 0.5})`;
    flame(ctx, -7, 12, flick * 7);
    flame(ctx, 7, 12, flick * 7);
    if (p.weapon >= 3) {
      flame(ctx, -15, 13, flick * 4);
      flame(ctx, 15, 13, flick * 4);
    }

    const skin = skinDef(w.meta.skin);
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

    ctx.strokeStyle = "rgba(36, 44, 52, 0.45)";
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(0, 8);
    ctx.moveTo(-8, 6);
    ctx.lineTo(-16, 10);
    ctx.moveTo(8, 6);
    ctx.lineTo(16, 10);
    ctx.stroke();

    ctx.fillStyle = skin.canopy;
    ctx.beginPath();
    ctx.moveTo(0, -16);
    ctx.lineTo(3.1, -4);
    ctx.lineTo(-3.1, -4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#1b232b";
    ctx.beginPath();
    ctx.moveTo(0, -11);
    ctx.lineTo(1.6, -5);
    ctx.lineTo(-1.6, -5);
    ctx.closePath();
    ctx.fill();

    if (p.weapon >= 2) {
      ctx.fillStyle = "#9aa4ae";
      ctx.fillRect(-13, 1, 3, 8);
      ctx.fillRect(10, 1, 3, 8);
    }
    if (p.weapon >= 4) {
      ctx.fillStyle = "#f2f5f7";
      ctx.fillRect(-1.4, -30, 2.8, 8);
    }
    if (p.weapon >= 5) {
      ctx.fillStyle = feed ? EMBER : DANGER;
      ctx.fillRect(-19, 5, 2.4, 8);
      ctx.fillRect(16.6, 5, 2.4, 8);
    }
    if (p.weapon >= 6) {
      ctx.strokeStyle = feed ? "rgba(224,122,61,0.9)" : "rgba(126,182,214,0.75)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(-6, 2);
      ctx.lineTo(-18, 11);
      ctx.moveTo(6, 2);
      ctx.lineTo(18, 11);
      ctx.stroke();
    }

    if (p.muzzle > 0) {
      ctx.globalAlpha = Math.min(1, p.muzzle / 0.045);
      ctx.fillStyle = "#f4fbff";
      ctx.beginPath();
      ctx.moveTo(0, -32);
      ctx.lineTo(4.5, -20);
      ctx.lineTo(-4.5, -20);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    if (p.shield) {
      ctx.strokeStyle = `rgba(126, 182, 214, ${0.45 + Math.sin(w.time * 5) * 0.2})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(0, 2, 26, 0, Math.PI * 2);
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
  const pal = CHAPTERS[e.ch] ?? CHAPTERS[0];
  if (e.kind === "boss") {
    drawBossCreature(ctx, e.ch, time, e.flash > 0);
    bar(ctx, 78, -58, e.hp / e.max, pal.accent);
    if (e.mark === 0 && e.fire < 0.28 && e.fire > 0 && e.y < py) {
      const a = Math.atan2(py - e.y, px - e.x);
      ctx.strokeStyle = pal.accent;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 16, Math.sin(a) * 16);
      ctx.lineTo(Math.cos(a) * 42, Math.sin(a) * 42);
      ctx.stroke();
    }
  } else {
    drawCritter(ctx, e.look, e.kind, time, e.spin, e.flash > 0);
    if (e.kind === "cruiser") bar(ctx, 34, 26, e.hp / e.max, pal.accent);
  }
  ctx.restore();
}

function bar(ctx: CanvasRenderingContext2D, w: number, y: number, ratio: number, color: string) {
  ctx.fillStyle = "#12171c";
  ctx.fillRect(-w / 2, y, w, 3);
  ctx.fillStyle = color;
  ctx.fillRect(-w / 2, y, w * Math.max(0, ratio), 3);
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
) {
  ctx.save();
  ctx.translate(x, y);
  if (friendly) {
    ctx.rotate(Math.atan2(vy, vx));
    if (homing) {
      ctx.fillStyle = hot ? "#ffd0a8" : EMBER;
      ctx.beginPath();
      ctx.moveTo(7, 0);
      ctx.lineTo(-6, 3.4);
      ctx.lineTo(-2.5, 0);
      ctx.lineTo(-6, -3.4);
      ctx.closePath();
      ctx.fill();
    } else {
      const len = r > 3 ? 20 : 15;
      ctx.fillStyle = hot ? EMBER : COLD;
      ctx.fillRect(-len, -r * 0.85, len, r * 1.7);
      ctx.fillStyle = "#f4fbff";
      ctx.fillRect(-len * 0.35, -r * 0.35, len * 0.28, r * 0.7);
    }
  } else {
    const pal = CHAPTERS[tint] ?? CHAPTERS[0];
    ctx.fillStyle = pal.accent;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(0, 0, r + 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f3e7e2";
    ctx.beginPath();
    ctx.arc(0, 0, Math.max(1, r * 0.38), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawPickup(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  drawLoot(ctx, kind, time, x);
  ctx.restore();
}

