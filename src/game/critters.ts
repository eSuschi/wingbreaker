import type { Kind } from "./world";

function eye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, hot: string, blink: boolean) {
  ctx.fillStyle = "#f4f1ea";
  ctx.beginPath();
  ctx.ellipse(x, y, r, blink ? r * 0.16 : r, 0, 0, Math.PI * 2);
  ctx.fill();
  if (blink) return;
  ctx.fillStyle = "#1c140f";
  ctx.beginPath();
  ctx.arc(x, y + r * 0.08, r * 0.46, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot;
  ctx.beginPath();
  ctx.arc(x + r * 0.18, y - r * 0.08, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function ink(ctx: CanvasRenderingContext2D, color: string) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.35;
  ctx.lineJoin = "round";
  ctx.stroke();
}

export function drawCritter(
  ctx: CanvasRenderingContext2D,
  look: number,
  kind: Kind,
  time: number,
  spin: number,
  flash: boolean,
) {
  const sc = kind === "cruiser" ? 1.72 : kind === "wedge" ? 1.32 : kind === "drone" ? 0.96 : 1.14;
  const flap = Math.sin(time * 6 + spin);
  const blink = Math.sin(time * 1.7 + spin) > 0.94;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(0, 18, 11, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.scale(sc, sc);
  if (flash) ctx.globalAlpha = 0.55;
  switch (look % 10) {
    case 0:
      beetle(ctx, flap, blink);
      break;
    case 1:
      squid(ctx, flap, blink);
      break;
    case 2:
      crab(ctx, flap, blink);
      break;
    case 3:
      moth(ctx, flap, blink);
      break;
    case 4:
      toad(ctx, flap, blink);
      break;
    case 5:
      gecko(ctx, flap, blink);
      break;
    case 6:
      skull(ctx, flap, blink);
      break;
    case 7:
      tick(ctx, flap, blink);
      break;
    case 8:
      manta(ctx, flap, blink);
      break;
    default:
      jelly(ctx, flap, blink);
  }
  ctx.restore();
}

function beetle(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#4a2418";
  ctx.beginPath();
  ctx.ellipse(-11, 1, 6, 9, -0.4, 0, Math.PI * 2);
  ctx.ellipse(11, 1, 6, 9, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#8a4630";
  ctx.beginPath();
  ctx.ellipse(0, 1, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#2a140e");
  ctx.strokeStyle = "#3a2016";
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(0, 13);
  ctx.stroke();
  ctx.fillStyle = "#e7c07a";
  ctx.beginPath();
  ctx.moveTo(-3, -12);
  ctx.lineTo(0, -18);
  ctx.lineTo(3, -12);
  ctx.fill();
  ctx.strokeStyle = "#2a140e";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(-4, -8);
  ctx.quadraticCurveTo(-10, -16 - flap * 2, -6, -20);
  ctx.moveTo(4, -8);
  ctx.quadraticCurveTo(10, -16 + flap * 2, 6, -20);
  ctx.stroke();
  ctx.fillStyle = "#e07a3d";
  ctx.beginPath();
  ctx.moveTo(-5, 11);
  ctx.lineTo(-11, 17 + flap * 2);
  ctx.lineTo(-1, 13);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(5, 11);
  ctx.lineTo(11, 17 - flap * 2);
  ctx.lineTo(1, 13);
  ctx.fill();
  eye(ctx, -4.6, 2, 3.1, "#e07a3d", blink);
  eye(ctx, 4.6, 2, 3.1, "#e07a3d", blink);
  ctx.strokeStyle = "#2a140e";
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(0, 8, 3.2, 0.15, Math.PI - 0.15);
  ctx.stroke();
}

function squid(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.strokeStyle = "#8eb4c8";
  ctx.lineWidth = 2;
  for (let i = -1; i <= 2; i++) {
    ctx.beginPath();
    ctx.moveTo(-6 + i * 4, 6);
    ctx.quadraticCurveTo(-8 + i * 5, 14, -4 + i * 3 + flap * 3, 20);
    ctx.stroke();
  }
  ctx.fillStyle = "#d5e4ea";
  ctx.beginPath();
  ctx.ellipse(0, -1, 11, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#243840");
  ctx.fillStyle = "#f2b8c0";
  ctx.beginPath();
  ctx.ellipse(0, 4, 5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  eye(ctx, 0, -1, 4.2, "#7eb6d6", blink);
  ctx.fillStyle = "#243840";
  ctx.fillRect(-7, -12, 3, 4);
  ctx.fillRect(4, -12, 3, 4);
}

function crab(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#c4553a";
  ctx.beginPath();
  ctx.ellipse(-16, 2 + flap * 2, 5, 4, -0.4, 0, Math.PI * 2);
  ctx.ellipse(16, 2 - flap * 2, 5, 4, 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7c07a";
  ctx.beginPath();
  ctx.ellipse(0, 1, 14, 10, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#5a3a22");
  ctx.strokeStyle = "#5a3a22";
  ctx.beginPath();
  ctx.moveTo(-6, -8);
  ctx.lineTo(-8, -14);
  ctx.moveTo(6, -8);
  ctx.lineTo(8, -14);
  ctx.stroke();
  eye(ctx, -8, -14, 2.2, "#c44536", blink);
  eye(ctx, 8, -14, 2.2, "#c44536", blink);
  ctx.strokeStyle = "#5a3a22";
  ctx.beginPath();
  ctx.arc(0, 4, 4, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function moth(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#3d4d86";
  ctx.beginPath();
  ctx.ellipse(-12, -2, 10, 7 + flap * 2, -0.5, 0, Math.PI * 2);
  ctx.ellipse(12, -2, 10, 7 - flap * 2, 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#d8d2c4";
  ctx.beginPath();
  ctx.ellipse(0, 2, 5, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#1c2030");
  ctx.strokeStyle = "#1c2030";
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.quadraticCurveTo(-8, -16, -4, -18);
  ctx.moveTo(2, -8);
  ctx.quadraticCurveTo(8, -16, 4, -18);
  ctx.stroke();
  eye(ctx, -3.2, 0, 2.6, "#f0d78a", blink);
  eye(ctx, 3.2, 0, 2.6, "#f0d78a", blink);
}

function toad(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#7a8a3a";
  ctx.beginPath();
  ctx.ellipse(0, 2, 14, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#2c3314");
  ctx.fillStyle = "#1c220c";
  ctx.beginPath();
  ctx.ellipse(0, 8, 7, 3 + flap, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e07a3d";
  ctx.fillRect(-1.2, 6, 2.4, 6);
  eye(ctx, -7, -2, 3.1, "#e0b15a", blink);
  eye(ctx, 7, -2, 3.1, "#e0b15a", blink);
}

function gecko(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#6e8f62";
  ctx.beginPath();
  ctx.ellipse(0, 1, 8, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#24321e");
  ctx.fillStyle = "#b7c9a4";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.ellipse(-9, -6 + i * 6, 4, 2.2, -0.6, 0, Math.PI * 2);
    ctx.ellipse(9, -6 + i * 6, 4, 2.2, 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = "#c44536";
  ctx.beginPath();
  ctx.moveTo(0, 8);
  ctx.quadraticCurveTo(4 + flap * 4, 14, 0, 16);
  ctx.stroke();
  eye(ctx, -3, -4, 2.3, "#8aa384", blink);
  eye(ctx, 3, -4, 2.3, "#8aa384", blink);
}

function skull(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#e6e1d6";
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.lineTo(-14, -2 + flap * 4);
  ctx.lineTo(-4, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, 4);
  ctx.lineTo(14, -2 - flap * 4);
  ctx.lineTo(4, 0);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -1, 11, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#4a453e");
  ctx.fillStyle = "#1a120e";
  ctx.beginPath();
  ctx.ellipse(-4, -1, 2.4, blink ? 0.4 : 2.6, 0, 0, Math.PI * 2);
  ctx.ellipse(4, -1, 2.4, blink ? 0.4 : 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-3, 6);
  ctx.lineTo(0, 10);
  ctx.lineTo(3, 6);
  ctx.fill();
}

function tick(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.strokeStyle = "#a86a42";
  ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(-8, -2 + i * 4);
    ctx.lineTo(-14, 0 + i * 4 + flap);
    ctx.moveTo(8, -2 + i * 4);
    ctx.lineTo(14, 0 + i * 4 - flap);
    ctx.stroke();
  }
  ctx.fillStyle = "#d08958";
  ctx.beginPath();
  ctx.ellipse(0, 0, 10, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#4a2c1c");
  ctx.fillStyle = "#f2e2c8";
  ctx.beginPath();
  ctx.ellipse(0, 2, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#4a2c1c";
  ctx.beginPath();
  ctx.moveTo(0, 10);
  ctx.lineTo(-2, 16);
  ctx.lineTo(2, 16);
  ctx.fill();
  eye(ctx, -3.5, -2, 2.2, "#e07a3d", blink);
  eye(ctx, 3.5, -2, 2.2, "#e07a3d", blink);
}

function manta(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#5e6e7c";
  ctx.beginPath();
  ctx.moveTo(0, 12);
  ctx.quadraticCurveTo(-22, 4, -18, -8 + flap * 3);
  ctx.quadraticCurveTo(-8, -2, 0, -6);
  ctx.quadraticCurveTo(8, -2, 18, -8 - flap * 3);
  ctx.quadraticCurveTo(22, 4, 0, 12);
  ctx.fill();
  ink(ctx, "#1c242c");
  ctx.fillStyle = "#d5dde4";
  ctx.beginPath();
  ctx.ellipse(0, 2, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  eye(ctx, -3, 0, 1.8, "#9aa8b5", blink);
  eye(ctx, 3, 0, 1.8, "#9aa8b5", blink);
  ctx.strokeStyle = "#1c242c";
  ctx.beginPath();
  ctx.arc(0, 5, 2.2, 0.2, Math.PI - 0.2);
  ctx.stroke();
}

function jelly(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.strokeStyle = "#c44536";
  ctx.lineWidth = 2;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 4, 6);
    ctx.quadraticCurveTo(i * 6, 14, i * 3 + flap * 2, 18);
    ctx.stroke();
  }
  ctx.fillStyle = "rgba(22,24,28,0.92)";
  ctx.beginPath();
  ctx.ellipse(0, -2, 12, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#8e99a3");
  ctx.fillStyle = "#e07a3d";
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  eye(ctx, -4, -4, 2, "#e07a3d", blink);
  eye(ctx, 4, -4, 2, "#e07a3d", blink);
}

export function drawBossCreature(ctx: CanvasRenderingContext2D, which: number, time: number, hurt: boolean) {
  const flap = Math.sin(time * 4);
  const blink = Math.sin(time * 1.4) > 0.96;
  ctx.save();
  ctx.scale(1.7, 1.7);
  if (hurt) ctx.globalAlpha = 0.6;
  if (which % 3 === 1) whale(ctx, flap, blink);
  else if (which % 3 === 2) eyeTyrant(ctx, flap, blink);
  else kingBeetle(ctx, flap, blink);
  ctx.restore();
}

function kingBeetle(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  beetle(ctx, flap, blink);
  ctx.fillStyle = "#e7c07a";
  ctx.beginPath();
  ctx.moveTo(-4, -14);
  ctx.lineTo(0, -22);
  ctx.lineTo(4, -14);
  ctx.fill();
  ink(ctx, "#2a140e");
}

function whale(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  ctx.fillStyle = "#8aa0ae";
  ctx.beginPath();
  ctx.ellipse(0, 0, 16, 18, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, "#1c2830");
  ctx.fillStyle = "#d5e6ee";
  ctx.beginPath();
  ctx.ellipse(0, 6, 8, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1c2830";
  ctx.beginPath();
  ctx.ellipse(0, 10, 5, 2.4 + flap * 0.4, 0, 0, Math.PI * 2);
  ctx.fill();
  eye(ctx, -6, -2, 3.4, "#7eb6d6", blink);
  eye(ctx, 6, -2, 3.4, "#7eb6d6", blink);
  ctx.fillStyle = "#5e7684";
  ctx.beginPath();
  ctx.ellipse(-14, 2, 5, 3, -0.8, 0, Math.PI * 2);
  ctx.ellipse(14, 2, 5, 3, 0.8, 0, Math.PI * 2);
  ctx.fill();
}

function eyeTyrant(ctx: CanvasRenderingContext2D, flap: number, blink: boolean) {
  jelly(ctx, flap, blink);
  ctx.fillStyle = "#f4f1ea";
  ctx.beginPath();
  ctx.arc(0, 1, 6.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#1a120e";
  ctx.beginPath();
  ctx.arc(0, 1, 3.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e07a3d";
  ctx.beginPath();
  ctx.arc(0.8, 0.4, 1.1, 0, Math.PI * 2);
  ctx.fill();
}

export function drawLoot(ctx: CanvasRenderingContext2D, kind: string, time: number, spin: number) {
  const bob = Math.sin(time * 4 + spin) * 2;
  ctx.save();
  ctx.translate(0, bob);
  ctx.scale(1.28, 1.28);
  if (kind === "$") coin(ctx, time);
  else if (kind === "S") shield(ctx, time);
  else if (kind === "B") bomb(ctx);
  else if (kind === "M") chain(ctx, time);
  else gun(ctx);
  ctx.restore();
}

function gun(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#c5ced6";
  ctx.fillRect(-7, -3, 14, 8);
  ctx.fillStyle = "#243038";
  ctx.fillRect(-6, -8, 3, 6);
  ctx.fillRect(-1.5, -11, 3, 9);
  ctx.fillRect(3, -8, 3, 6);
  ctx.fillStyle = "#e07a3d";
  ctx.fillRect(-5.2, -9, 1.4, 2);
  ctx.fillRect(-0.7, -12, 1.4, 2);
  ctx.fillRect(3.8, -9, 1.4, 2);
}

function shield(ctx: CanvasRenderingContext2D, time: number) {
  ctx.strokeStyle = "#7eb6d6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -12);
  ctx.lineTo(9, -4);
  ctx.lineTo(7, 6);
  ctx.lineTo(0, 12);
  ctx.lineTo(-7, 6);
  ctx.lineTo(-9, -4);
  ctx.closePath();
  ctx.stroke();
  ctx.fillStyle = `rgba(126,182,214,${0.18 + Math.sin(time * 5) * 0.08})`;
  ctx.fill();
  ctx.fillStyle = "#f4fbff";
  ctx.fillRect(-1, -6, 2, 8);
}

function bomb(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = "#c44536";
  ctx.beginPath();
  ctx.ellipse(0, 2, 7, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#e7eaee";
  ctx.fillRect(-4, -1, 8, 2);
  ctx.fillStyle = "#8e99a3";
  ctx.fillRect(-1.2, -8, 2.4, 6);
  ctx.fillStyle = "#e07a3d";
  ctx.beginPath();
  ctx.arc(0, -9, 1.6, 0, Math.PI * 2);
  ctx.fill();
}

function chain(ctx: CanvasRenderingContext2D, time: number) {
  ctx.strokeStyle = "#e7c07a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(-3, 0, 4, 6, time, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(3, 0, 4, 6, -time, 0, Math.PI * 2);
  ctx.stroke();
}

function coin(ctx: CanvasRenderingContext2D, time: number) {
  const sx = 0.55 + Math.abs(Math.sin(time * 3)) * 0.45;
  ctx.save();
  ctx.scale(sx, 1);
  ctx.fillStyle = "#e0b15a";
  ctx.beginPath();
  ctx.arc(0, 0, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#8a6230";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, 0, 5.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}
