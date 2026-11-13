import { CHAPTERS, chapterIndex, chapterOf, gunName, skinDef, type SkinDef } from "./meta";
import { drawBossCreature, drawCritter, drawLoot } from "./critters";
import { podOffsets, WORLD_H, WORLD_W, type Enemy, type Player, type World } from "./world";

const WING_SKIN: SkinDef = {
  id: "navy",
  name: "Wing",
  price: 0,
  hull: "#d7c4a1",
  edge: "#6a5438",
  canopy: "#e07a3d",
  hot: "#f4e7cf",
};

const plates: (HTMLImageElement | null)[] = Array.from({ length: 10 }, () => null);
const faces: (HTMLImageElement | null)[] = Array.from({ length: 36 }, () => null);
const bosses: (HTMLImageElement | null)[] = Array.from({ length: 10 }, () => null);
const poops: (HTMLImageElement | null)[] = Array.from({ length: 5 }, () => null);
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

function faceOf(look: number) {
  if (typeof Image === "undefined") return null;
  const i = ((look % 36) + 36) % 36;
  if (!faces[i]) {
    const img = new Image();
    img.src = `/critters/${i}.png`;
    faces[i] = img;
  }
  return ready(faces[i]) ? faces[i] : null;
}

function bossOf(chapter: number) {
  if (typeof Image === "undefined") return null;
  const i = ((chapter % 10) + 10) % 10;
  if (!bosses[i]) {
    const img = new Image();
    img.src = `/bosses/${i}.png`;
    bosses[i] = img;
  }
  return ready(bosses[i]) ? bosses[i] : null;
}

function hullOf(id: string) {
  if (typeof Image === "undefined") return null;
  let img = hulls.get(id);
  if (!img) {
    img = new Image();
    img.src = `/ships/${id}.png`;
    hulls.set(id, img);
  }
  return ready(img) ? img : null;
}

function poopOf(shape: number) {
  if (typeof Image === "undefined") return null;
  const i = shape === 1 ? 1 : shape === 2 ? 2 : shape === 3 ? 3 : shape === 4 ? 4 : 0;
  if (!poops[i]) {
    const img = new Image();
    img.src = `/shots/poop-${i}.png`;
    poops[i] = img;
  }
  return ready(poops[i]) ? poops[i] : null;
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
  ctx.translate(Math.sin(w.time * 71) * 9 * s, Math.cos(w.time * 63) * 7 * s);

  drawBackdrop(ctx, w);

  for (const pk of w.pickups) drawPickup(ctx, pk.kind, pk.x, pk.y, w.time);
  for (const e of w.enemies) drawEnemy(ctx, e, w.time, w.player.x, w.player.y);

  for (const b of w.bullets) {
    if (b.friendly) drawBullet(ctx, b.x, b.y, b.vx, b.vy, b.r, true, b.homing, b.hot, 0, 0, b.style ?? 0);
  }

  const showShip =
    w.mode === "play" || w.mode === "pause" || w.mode === "clear" || w.mode === "over" || w.mode === "victory";
  if (showShip && w.player.alive) drawPlayer(ctx, w, w.player, focus, skinDef(w.meta.skin), w.meta.skin);
  if (showShip && w.wing?.alive) drawPlayer(ctx, w, w.wing, false, WING_SKIN, "wing");

  for (const b of w.bullets) {
    if (!b.friendly) drawBullet(ctx, b.x, b.y, b.vx, b.vy, b.r, false, false, false, b.tint, b.shape ?? 0);
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
  if (w.player.missiles > 0) {
    ctx.fillStyle = EMBER;
    ctx.font = "600 13px Barlow Condensed, sans-serif";
    ctx.fillText(`MSL ${w.player.missiles}`, 16, 96);
  }
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
  ctx.textAlign = "center";
  ctx.fillStyle = w.player.feed > 0 ? EMBER : STEEL_DIM;
  ctx.font = "600 13px Barlow Condensed, sans-serif";
  ctx.fillText(w.player.feed > 0 ? `${gunName(w.player.weapon)} HOT` : gunName(w.player.weapon), WORLD_W / 2, by - (w.wing ? 16 : 8));
  ctx.textAlign = "left";
  const seg = bw / 6;
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i < w.player.weapon ? (w.player.feed > 0 ? EMBER : COLD) : "#1a2128";
    ctx.fillRect(bx + i * seg + 1, by, seg - 3, 3);
  }

  if (w.wing) {
    const y2 = by - 8;
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = i < w.wing.weapon ? (w.wing.feed > 0 ? EMBER : "#d7c4a1") : "#1a2128";
      ctx.fillRect(bx + i * seg + 1, y2, seg - 3, 2);
    }
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

function drawPlayer(ctx: CanvasRenderingContext2D, w: World, p: Player, focus: boolean, skin: SkinDef, spriteId: string) {
  const blink = p.inv > 0 && Math.sin(w.time * 38) > 0;
  if (!blink) {
    ctx.save();
    ctx.translate(p.x, p.y + p.muzzle * 36);
    ctx.rotate(p.bank);
    const feed = p.feed > 0;
    const flick = 0.45 + (Math.sin(w.time * 46) * 0.5 + 0.5) * 0.7;
    ctx.fillStyle = feed ? `rgba(224,122,61,${0.4 + flick * 0.45})` : `rgba(126,182,214,${0.28 + flick * 0.5})`;
    flame(ctx, -7, 16, flick * 7);
    flame(ctx, 7, 16, flick * 7);
    if (p.weapon >= 3) {
      flame(ctx, -16, 16, flick * 4);
      flame(ctx, 16, 16, flick * 4);
    }

    const img = hullOf(spriteId);
    if (img) {
      ctx.shadowColor = spriteId === "graphite" ? "rgba(232,238,244,0.7)" : "rgba(0,0,0,0.55)";
      ctx.shadowBlur = spriteId === "graphite" ? 10 : 8;
      blitSprite(ctx, img, spriteId === "wing" ? 40 : 52, 0);
      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";
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
    }

    for (const pod of podOffsets(w.time, p.weapon)) {
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
      const flash = p.weapon >= 6 ? "#fff4ea" : p.weapon === 5 ? "#e7ffb0" : p.weapon === 4 ? "#ffd7a8" : "#f4fbff";
      ctx.fillStyle = flash;
      ctx.beginPath();
      ctx.moveTo(0, -34);
      ctx.lineTo(5, -18);
      ctx.lineTo(-5, -18);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;
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
  const pal = CHAPTERS[e.ch] ?? CHAPTERS[0];
  const bob = Math.sin(time * 3.2 + e.spin) * 1.6;
  if (e.kind === "boss") {
    const face = bossOf(e.ch);
    if (face) blitSprite(ctx, face, 96, bob);
    else drawBossCreature(ctx, e.ch, time, e.flash > 0);
    bar(ctx, 54, -56, e.hp / e.max, pal.accent);
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
    const face = faceOf(e.look);
    const h = e.kind === "cruiser" ? 40 : e.kind === "wedge" ? 32 : e.kind === "drone" ? 28 : 26;
    if (face) blitSprite(ctx, face, h, bob);
    else drawCritter(ctx, e.look, e.kind, time, e.spin, e.flash > 0);
    if (e.kind === "cruiser") bar(ctx, 22, h * 0.42, e.hp / e.max, pal.accent);
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
  shape = 0,
  style = 0,
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
    if (shape === 2) ctx.rotate(Math.atan2(vy, vx));
    else ctx.rotate(Math.sin(y * 0.09 + x * 0.04) * 0.45);
    drawPoop(ctx, shape, Math.max(5.5, r * 1.7), tint);
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
  const img = poopOf(shape);
  const tall = shape === 2 ? 16 : shape === 3 ? 34 : 26;
  if (img) {
    blitFree(ctx, img, tall);
    return;
  }
  ctx.fillStyle = shape === 4 ? "#6d8f3c" : "#8a5a32";
  ctx.beginPath();
  ctx.ellipse(0, s * 0.42, s * 0.85, s * 0.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -s * 0.05, s * 0.62, s * 0.46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -s * 0.48, s * 0.32, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#f4fbff";
  ctx.beginPath();
  ctx.arc(-s * 0.16, -s * 0.58, s * 0.08, 0, Math.PI * 2);
  ctx.arc(s * 0.16, -s * 0.58, s * 0.08, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a140c";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, -s * 0.38, s * 0.12, 0.2, Math.PI - 0.2);
  ctx.stroke();
  void tint;
}

function drawPickup(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, time: number) {
  ctx.save();
  ctx.translate(x, y);
  const pulse = 0.55 + Math.sin(time * 6) * 0.28;
  ctx.strokeStyle = `rgba(255,244,220,${pulse})`;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, 18 + Math.sin(time * 5) * 2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "rgba(224,122,61,0.55)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, 13, 0, Math.PI * 2);
  ctx.stroke();
  drawLoot(ctx, kind, time, x);
  ctx.restore();
}

