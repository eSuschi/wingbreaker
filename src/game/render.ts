import { CHAPTERS, FAUNA, chapterIndex, chapterOf, gunName, skinDef, type SkinDef } from "./meta";
import { HONEY_RING, familyColor } from "./v3";
import { drawBossCreature, drawCritter, drawLoot } from "./critters";
import { DASH_WARN, hermitHidden, podOffsets, WORLD_H, WORLD_W, type Enemy, type Player, type World } from "./world";

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
const faces: (HTMLImageElement | null)[] = Array.from({ length: FAUNA.length }, () => null);
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
  const n = FAUNA.length;
  const i = ((look % n) + n) % n;
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

  for (const h of w.hazards) drawHazard(ctx, h, w.time);
  if (w.hazards.some((h) => h.kind === "eclipse" && h.phase > 0)) {
    // the eclipse darkens the sky only; shots, pickups and ships stay lit on top
    ctx.fillStyle = "rgba(0,0,0,0.72)";
    ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  }
  for (const pk of w.pickups) drawPickup(ctx, pk.kind, pk.x, pk.y, w.time, pk.hue ?? 0);
  for (const e of w.enemies) drawEnemy(ctx, e, w.time, w.player.x, w.player.y);

  for (const b of w.bullets) {
    if (b.friendly) drawBullet(ctx, b.x, b.y, b.vx, b.vy, b.r, true, b.homing, b.hot, 0, 0, b.style ?? 0);
  }

  const showShip =
    w.mode === "play" || w.mode === "pause" || w.mode === "bridge" || w.mode === "clear" || w.mode === "over" || w.mode === "victory";
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

  if (w.freeze > 0) {
    ctx.fillStyle = "rgba(120, 90, 40, 0.18)";
    ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  }
  if (w.flash > 0) {
    ctx.fillStyle = `rgba(224, 122, 61, ${Math.min(0.28, w.flash * 0.7)})`;
    ctx.fillRect(-20, -20, WORLD_W + 40, WORLD_H + 40);
  }

  ctx.restore();

  if (w.mode === "play" || w.mode === "pause" || w.mode === "bridge" || w.mode === "clear" || w.mode === "over" || w.mode === "victory") drawHud(ctx, w);
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
  ctx.fillText(gunName(w.player.weapon, w.player.family), WORLD_W / 2, by - (w.wing ? 16 : 8));
  ctx.textAlign = "left";
  const seg = bw / 6;
  const gunColor = familyColor(w.player.family);
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = i < w.player.weapon ? (w.player.feed > 0 ? EMBER : gunColor) : "#1a2128";
    ctx.fillRect(bx + i * seg + 1, by, seg - 3, 3);
  }
  ctx.textAlign = "right";
  ctx.fillStyle = EMBER;
  ctx.font = "600 12px Barlow Condensed, sans-serif";
  const lift = w.touch ? 78 : 0;
  ctx.fillText(`SNACK ${Math.floor(w.snacks)}`, WORLD_W - 16, by - 16 - lift);
  ctx.textAlign = "left";

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
    const face = bossOf(e.ch);
    if (face) {
      ctx.shadowColor = "rgba(0,0,0,0.55)";
      ctx.shadowBlur = 14;
      blitSprite(ctx, face, 108 * k, bob);
      ctx.shadowBlur = 0;
    } else {
      ctx.save();
      ctx.scale(k, k);
      drawBossCreature(ctx, e.ch, time, e.flash > 0);
      ctx.restore();
    }
    bar(ctx, 54 * k, -56 * k - 4, e.hp / e.max, pal.accent);
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
  } else {
    const face = faceOf(e.look);
    const h = (e.kind === "cruiser" ? 40 : e.kind === "wedge" ? 32 : e.kind === "drone" ? 28 : 26) * k;
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
    if (shell) ctx.globalAlpha = 0.35;
    if (face) blitSprite(ctx, face, h, bob);
    else {
      ctx.save();
      ctx.scale(k, k);
      drawCritter(ctx, e.look, e.kind, time, e.spin, e.flash > 0);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    if (shell) {
      // Rock Hermit tucked in its shell: shots ping off until it peeks out
      ctx.fillStyle = "#4a4238";
      ctx.strokeStyle = "#a89a86";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, bob, h * 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#6b6052";
      for (const [ox, oy, r] of [[-6, -4, 4], [7, 2, 5], [-2, 8, 3]] as const) {
        ctx.beginPath();
        ctx.arc(ox * k, oy * k + bob, r * k, 0, Math.PI * 2);
        ctx.fill();
      }
    }
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
    // on a phone the shots are drawn smaller so they do not dwarf the critters
    if (WORLD_W < 560) ctx.scale(0.8, 0.8);
    if (shape !== 16) {
      // Anything inside this pink-red halo hurts. The colour is used for
      // nothing else, and the halo is sized past the sprite so a brown shot
      // on a brown sky still reads.
      const body = shape === 2 ? 9 : shape === 3 ? 18 : shape <= 4 ? 14 : Math.max(5.5, r * 1.7) * 1.05;
      const pulse = 0.5 + Math.sin(y * 0.2) * 0.12;
      ctx.fillStyle = `rgba(255,60,95,${pulse * 0.45})`;
      ctx.beginPath();
      ctx.arc(0, 0, body + 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = `rgba(255,120,140,${0.55 + pulse * 0.4})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.arc(0, 0, body + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
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
  const img = shape <= 4 ? poopOf(shape) : null;
  if (img) {
    blitFree(ctx, img, shape === 2 ? 16 : shape === 3 ? 34 : 26);
    return;
  }
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

function drawPickup(ctx: CanvasRenderingContext2D, kind: string, x: number, y: number, time: number, hue = 0) {
  ctx.save();
  ctx.translate(x, y);
  if (kind === "N") {
    // snack: a small glazed donut, no ring, so it never competes with real gifts
    ctx.rotate(Math.sin(time * 3 + x) * 0.3);
    ctx.fillStyle = "#c98a4b";
    ctx.beginPath();
    ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f29bb8";
    ctx.beginPath();
    ctx.arc(0, -0.6, 5.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#1a120e";
    ctx.beginPath();
    ctx.arc(0, 0, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  const small = WORLD_W < 560;
  const ringR = small ? 14 : 17;
  const pulse = 0.55 + Math.sin(time * 6) * 0.28;
  const gift = hue === 1 ? "#9ed24a" : hue === 2 ? "#e07a3d" : "#7eb6d6";
  const tone = kind === "W" ? gift : kind === "$" ? "#e2b84a" : kind === "S" ? "#bfe3f5" : kind === "B" ? "#9ed24a" : kind === "D" ? "#f2d24a" : "#e07a3d";
  ctx.fillStyle = "rgba(7,9,12,0.72)";
  ctx.beginPath();
  ctx.arc(0, 0, ringR, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = kind === "W" ? 1 : 0.55 + pulse * 0.45;
  ctx.strokeStyle = tone;
  ctx.lineWidth = kind === "W" ? 2.4 : 1.8;
  ctx.beginPath();
  ctx.arc(0, 0, ringR + Math.sin(time * 5) * 1.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
  const z = small ? 0.85 : 1;
  ctx.scale(z, z);
  ctx.translate(0, Math.sin(time * 4 + x) * 1.2);
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

function drawHazard(ctx: CanvasRenderingContext2D, h: { kind: string; x: number; y: number; w: number; h: number; t: number; phase: number }, time: number) {
  ctx.save();
  if (h.kind === "pane") {
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
  } else if (h.kind === "bolt") {
    ctx.globalAlpha = h.t < 1.2 ? 0.4 : 0.12;
    ctx.fillStyle = "#f2d24a";
    ctx.fillRect(h.x - h.w / 2, 0, h.w, h.h);
  }
  ctx.restore();
}

