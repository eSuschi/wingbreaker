import type { Kind } from "./world";

type Pen = CanvasRenderingContext2D;

function eye(ctx: Pen, x: number, y: number, r: number, hot: string, blink: boolean) {
  ctx.fillStyle = "#f4f1ea";
  ctx.beginPath();
  ctx.ellipse(x, y, r, blink ? r * 0.18 : r, 0, 0, Math.PI * 2);
  ctx.fill();
  if (blink) return;
  ctx.fillStyle = "#1c140f";
  ctx.beginPath();
  ctx.arc(x, y + r * 0.08, r * 0.48, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = hot;
  ctx.beginPath();
  ctx.arc(x + r * 0.16, y - r * 0.1, r * 0.16, 0, Math.PI * 2);
  ctx.fill();
}

function ink(ctx: Pen, color: string) {
  ctx.save();
  ctx.strokeStyle = "rgba(244,241,234,0.9)";
  ctx.lineWidth = 2.2;
  ctx.lineJoin = "round";
  ctx.stroke();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.15;
  ctx.stroke();
  ctx.restore();
}

function blob(ctx: Pen, x: number, y: number, rx: number, ry: number, fill: string, line = "#1c140f") {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ink(ctx, line);
}

function tri(ctx: Pen, pts: number[], fill: string, line = "#1c140f") {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]);
  ctx.closePath();
  ctx.fill();
  ink(ctx, line);
}

type Draw = (ctx: Pen, flap: number, blink: boolean) => void;

const CREW: Draw[] = [
  (c, f, b) => {
    blob(c, -7, 1, 4.5, 6, "#e07a3d");
    blob(c, 7, 1, 4.5, 6, "#e07a3d");
    blob(c, 0, 1, 7, 8, "#f0c198");
    tri(c, [-2, -6, 0, -13, 2, -6], "#e7c07a");
    eye(c, -2.4, 0, 2, "#e07a3d", b);
    eye(c, 2.4, 0, 2, "#e07a3d", b);
    c.strokeStyle = "#e7c07a";
    c.beginPath();
    c.moveTo(0, 8);
    c.lineTo(f * 3, 14);
    c.stroke();
  },
  (c, f, b) => {
    blob(c, 0, -2, 7, 6, "#d5e8f0");
    for (let i = -1; i <= 1; i++) {
      c.strokeStyle = "#7eb6d6";
      c.lineWidth = 1.6;
      c.beginPath();
      c.moveTo(i * 4, 3);
      c.quadraticCurveTo(i * 6, 9, i * 3 + f * 2, 14);
      c.stroke();
    }
    eye(c, 0, -2, 3.1, "#7eb6d6", b);
  },
  (c, f, b) => {
    blob(c, -9, 1 + f, 3.2, 2.4, "#c9d0d7");
    blob(c, 9, 1 - f, 3.2, 2.4, "#c9d0d7");
    blob(c, 0, 1, 8, 5, "#e7eaee");
    eye(c, -2, 0, 1.7, "#7eb6d6", b);
    eye(c, 2, 0, 1.7, "#7eb6d6", b);
  },
  (c, f, b) => {
    tri(c, [-16, 2, -2, -2, -2, 8], "#b46ec8");
    tri(c, [16, 2, 2, -2, 2, 8], "#b46ec8");
    blob(c, 0, 0, 5, 6, "#f0d0ea");
    eye(c, 0, -1, 2.4, "#e07a3d", b);
  },
  (c, f, b) => {
    blob(c, -5, 2, 3, 2.4, "#6e5b48");
    blob(c, 5, -1, 2.4, 2, "#6e5b48");
    blob(c, 0, 1, 7, 6, "#a08a70");
    eye(c, 0, -1, 2.8, "#e07a3d", b);
  },
  (c, f, b) => {
    blob(c, 0, 2, 6, 4, "#9aa4ae");
    c.strokeStyle = "#d5dbe2";
    c.lineWidth = 1.4;
    c.beginPath();
    c.arc(0, -6, 4.2, 0.2, Math.PI - 0.2);
    c.stroke();
    eye(c, -2, 1, 1.5, "#7eb6d6", b);
    eye(c, 2, 1, 1.5, "#7eb6d6", b);
  },
  (c, f, b) => {
    blob(c, 0, 0, 7, 7, "#efeae2", "#6e675f");
    c.fillStyle = "#1c140f";
    c.beginPath();
    c.ellipse(-2.4, -1, 1.6, 2.1, 0, 0, Math.PI * 2);
    c.ellipse(2.4, -1, 1.6, 2.1, 0, 0, Math.PI * 2);
    c.fill();
    c.fillRect(-2, 3, 4, 1.2);
  },
  (c, f, b) => {
    c.fillStyle = "#c4a574";
    c.fillRect(-6, -5, 12, 10);
    ink(c, "#3a2c18");
    c.fillStyle = "#e07a3d";
    c.fillRect(-1, -9, 2, 4);
    eye(c, -2.2, 0, 1.5, "#e07a3d", b);
    eye(c, 2.2, 0, 1.5, "#e07a3d", b);
  },
  (c, f, b) => {
    tri(c, [-18, 2, -2, -4, 0, 6], "#6a8ea3");
    tri(c, [18, 2, 2, -4, 0, 6], "#6a8ea3");
    blob(c, 0, 0, 5, 4, "#d5e6ee");
    eye(c, 0, -1, 2, "#1c2830", b);
  },
  (c, f, b) => {
    blob(c, 0, 2, 7, 8, "rgba(240,192,138,0.9)");
    blob(c, 0, -4, 4, 3, "#f4e7cf");
    eye(c, 0, -4, 1.8, "#e07a3d", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 7, 6, "#8fd18a");
    eye(c, -3, -1, 1.6, "#1c140f", b);
    eye(c, 3, -1, 1.6, "#1c140f", b);
    eye(c, 0, 2, 1.5, "#e07a3d", b);
  },
  (c, f, b) => {
    c.strokeStyle = "#e7c07a";
    c.lineWidth = 1.6;
    c.beginPath();
    c.ellipse(0, 0, 11, 4.2, 0.2, 0, Math.PI * 2);
    c.stroke();
    blob(c, 0, 0, 6, 6, "#c45a3a");
    eye(c, -1.6, -1, 1.5, "#f4f1ea", b);
    eye(c, 1.8, -1, 1.5, "#f4f1ea", b);
  },
  (c, f, b) => {
    blob(c, 0, -1, 11, 3.2, "#c9d0d7");
    blob(c, 0, 1, 5, 2, "#8e99a3");
    c.fillStyle = "#e07a3d";
    c.beginPath();
    c.ellipse(0, 5 + f, 1.4, 2.2, 0, 0, Math.PI * 2);
    c.fill();
    eye(c, -3, -1, 1.3, "#7eb6d6", b);
    eye(c, 3, -1, 1.2, "#7eb6d6", b);
  },
  (c, f, b) => {
    tri(c, [8, 2, -2, -3, -2, 6], "#9ad7e0");
    blob(c, -2, 0, 5, 4, "#d5f2f4");
    eye(c, -2, -1, 1.8, "#1c2830", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 8, 7, "#d2c08a");
    c.strokeStyle = "#8a6230";
    c.lineWidth = 1.3;
    c.beginPath();
    c.arc(4, -2, 2.4, 0.4, 1.6);
    c.stroke();
    eye(c, -1, -1, 1.8, "#1c140f", b);
  },
  (c, f, b) => {
    blob(c, 0, 2, 6, 5, "#a85a32");
    tri(c, [-2, -2, 0, -12, 2, -2], "#e7eaee");
    eye(c, -2, 1, 1.4, "#f4f1ea", b);
    eye(c, 2, 1, 1.4, "#f4f1ea", b);
  },
  (c, f, b) => {
    c.fillStyle = "#e7c07a";
    c.fillRect(-7, -3, 14, 7);
    ink(c, "#3a2c18");
    c.fillStyle = "#c44536";
    c.fillRect(4, -6, 3, 3);
    c.fillStyle = "#2a3138";
    c.fillRect(-7, -6, 3, 3);
    eye(c, 0, 0, 1.6, "#1c140f", b);
  },
  (c, f, b) => {
    blob(c, 0, 2, 5, 5.5, "#b7c0c8");
    c.strokeStyle = "#d5dbe2";
    c.lineWidth = 1.3;
    c.beginPath();
    c.arc(-5, -4, 3.2, 0.4, Math.PI);
    c.arc(5, -4, 3.2, 0, Math.PI - 0.4);
    c.stroke();
    eye(c, -1.6, 0, 1.6, "#e07a3d", b);
    eye(c, 1.6, 0, 1.6, "#e07a3d", b);
  },
  (c, f, b) => {
    blob(c, 0, -2, 3.2, 3, "#c44536");
    c.strokeStyle = "#e07a3d";
    c.lineWidth = 1.5;
    for (let i = -2; i <= 2; i++) {
      c.beginPath();
      c.moveTo(0, 0);
      c.quadraticCurveTo(i * 3, 6, i * 2 + f, 13);
      c.stroke();
    }
    eye(c, 0, -2, 1.5, "#f4f1ea", b);
  },
  (c, f, b) => {
    blob(c, 0, 2, 5, 6, "#c44536");
    blob(c, -4, -2, 2, 3, "#e07a3d");
    blob(c, 4, -1, 2, 3.2, "#e07a3d");
    eye(c, 0, 0, 1.7, "#f4f1ea", b);
  },
  (c, f, b) => {
    blob(c, 0, 2, 6, 5, "#243038");
    c.strokeStyle = "#7eb6d6";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -2);
    c.lineTo(f * 2, -12);
    c.stroke();
    blob(c, f * 2, -13, 1.6, 1.6, "#e07a3d");
    eye(c, -2, 1, 1.3, "#7eb6d6", b);
  },
  (c, f, b) => {
    c.fillStyle = "#f4f1ea";
    c.fillRect(-6, -6, 12, 12);
    ink(c, "#6e675f");
    c.fillStyle = "#1c140f";
    for (const [x, y] of [[-3, -3], [3, -3], [0, 0], [-3, 3], [3, 3]] as const) {
      c.beginPath();
      c.arc(x, y, 0.7, 0, Math.PI * 2);
      c.fill();
    }
    eye(c, 0, -1, 1.2, "#e07a3d", b);
  },
  (c, f, b) => {
    c.strokeStyle = "#8a7ab0";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(-1, 0, 6, 0.4, 5.4);
    c.stroke();
    blob(c, 4, 2, 3.4, 3, "#cbb6ea");
    eye(c, 4, 1, 1.4, "#1c140f", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 4, 7, "#efeae2", "#8a8175");
    tri(c, [-3, -4, 0, -10, 3, -4], "#efeae2", "#8a8175");
    eye(c, 0, 0, 1.5, "#7eb6d6", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 6, 4.5, "#c46a3a");
    c.strokeStyle = "#e7c07a";
    c.lineWidth = 1.6;
    c.beginPath();
    c.moveTo(5, -1);
    c.quadraticCurveTo(11, -4, 12, 1);
    c.stroke();
    c.beginPath();
    c.arc(-2, -4, 1.5, Math.PI, 0);
    c.stroke();
    eye(c, -1, 0, 1.4, "#1c140f", b);
  },
  (c, f, b) => {
    c.fillStyle = "#e0c15a";
    c.beginPath();
    c.ellipse(0, 1, 4, 10, 0.4, 0, Math.PI * 2);
    c.fill();
    ink(c, "#6e5a20");
    eye(c, 1, -2, 1.5, "#1c140f", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 6.5, 6, "#3a4450");
    c.strokeStyle = "#d5dbe2";
    c.lineWidth = 1.6;
    c.beginPath();
    c.arc(-4, -3, 3, 0.6, Math.PI + 0.4);
    c.arc(4, -3, 3, -0.4, Math.PI - 0.6);
    c.stroke();
    eye(c, -1.6, 0, 1.4, "#e07a3d", b);
    eye(c, 1.6, 0, 1.4, "#e07a3d", b);
  },
  (c, f, b) => {
    tri(c, [0, -8, 12, 4, -10, 5], "#d5dbe2", "#66727c");
    eye(c, 1, -1, 1.3, "#7eb6d6", b);
  },
  (c, f, b) => {
    c.fillStyle = "#8e99a3";
    c.beginPath();
    c.moveTo(-3, -6);
    c.lineTo(4, -4);
    c.lineTo(5, 6);
    c.lineTo(-4, 7);
    c.closePath();
    c.fill();
    ink(c, "#2a3138");
    c.fillStyle = "#e07a3d";
    c.beginPath();
    c.moveTo(0, 6);
    c.lineTo(f, 12);
    c.lineTo(-2, 6);
    c.fill();
    eye(c, 0, -1, 1.3, "#7eb6d6", b);
  },
  (c, f, b) => {
    blob(c, 0, 0, 7, 7, "#e7c07a");
    c.fillStyle = "#07090c";
    c.beginPath();
    c.arc(0, 0, 2.4, 0, Math.PI * 2);
    c.fill();
    eye(c, -3, -2, 1.2, "#1c140f", b);
    eye(c, 3.2, -1.6, 1.2, "#1c140f", b);
  },
  (c, f, b) => {
    blob(c, 0, 0, 8, 7, "#e0b15a");
    c.fillStyle = "#8a6230";
    for (const [x, y] of [[-2, -1], [3, 1], [0, 3]] as const) {
      c.beginPath();
      c.arc(x, y, 1.1, 0, Math.PI * 2);
      c.fill();
    }
    eye(c, -2, -3, 1.3, "#1c140f", b);
    eye(c, 2, -2.6, 1.3, "#1c140f", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 4.5, 6, "#f4e7cf", "#8a8175");
    c.strokeStyle = "#e07a3d";
    c.lineWidth = 1.2;
    c.beginPath();
    c.moveTo(0, -4);
    c.lineTo(0, 3);
    c.stroke();
    eye(c, -1.6, 0, 1.2, "#e07a3d", b);
  },
  (c, f, b) => {
    c.strokeStyle = "#c5ced6";
    c.lineWidth = 1.8;
    c.beginPath();
    c.ellipse(-3, 0, 3, 5, 0.5, 0, Math.PI * 2);
    c.stroke();
    c.beginPath();
    c.ellipse(3, 1, 3, 5, -0.4, 0, Math.PI * 2);
    c.stroke();
    eye(c, 0, -1, 1.2, "#7eb6d6", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 6, 5.5, "#1c2433");
    blob(c, 0, 0, 3.2, 3.2, "#7eb6d6");
    c.fillStyle = "#07090c";
    c.beginPath();
    c.arc(0.3, 0.2, 1.3, 0, Math.PI * 2);
    c.fill();
  },
  (c, f, b) => {
    blob(c, 0, 1, 5, 7, "#c46a3a");
    c.strokeStyle = "#f4e7cf";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(-4, -2);
    c.lineTo(4, 0);
    c.moveTo(-4, 3);
    c.lineTo(4, 4);
    c.stroke();
    eye(c, 0, -2, 1.5, "#f4f1ea", b);
  },
  (c, f, b) => {
    blob(c, 0, 1, 5, 5, "#8aa384");
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      blob(c, Math.cos(a) * 7, Math.sin(a) * 6, 1.5, 1.5, "#c9d8b8", "#2a3328");
    }
    eye(c, 0, 0, 1.8, "#e07a3d", b);
  },
];

const BOSSES: Draw[] = [
  (c, f, b) => {
    CREW[0](c, f, b);
    tri(c, [-4, -8, 0, -18, 4, -8], "#e7c07a");
    blob(c, 0, 10, 2, 3, "#e07a3d");
  },
  (c, f, b) => {
    blob(c, 0, 0, 16, 10, "#8aa0ae");
    blob(c, 0, 3, 7, 4, "#d5e6ee");
    eye(c, -4, -2, 2.2, "#7eb6d6", b);
    eye(c, 4, -2, 2.2, "#7eb6d6", b);
    c.strokeStyle = "#d5e6ee";
    c.beginPath();
    c.moveTo(-14, 2);
    c.quadraticCurveTo(-22, 8 + f * 3, -16, 12);
    c.moveTo(14, 2);
    c.quadraticCurveTo(22, 8 - f * 3, 16, 12);
    c.stroke();
  },
  (c, f, b) => {
    blob(c, 0, 0, 12, 12, "#1c2433");
    blob(c, 0, 0, 6, 6, "#f4f1ea");
    c.fillStyle = "#1a120e";
    c.beginPath();
    c.arc(0, 0, 2.6, 0, Math.PI * 2);
    c.fill();
    c.strokeStyle = "#e7c07a";
    c.lineWidth = 1.5;
    c.beginPath();
    c.ellipse(0, 0, 16, 5, 0.15, 0, Math.PI * 2);
    c.stroke();
  },
  (c, f, b) => {
    blob(c, 0, -2, 18, 5, "#c9d0d7");
    blob(c, 0, 2, 8, 3.2, "#66727c");
    for (let i = -2; i <= 2; i++) eye(c, i * 4, -2, 1.3, "#e07a3d", b);
    blob(c, f * 2, 8, 2.2, 3, "#e07a3d");
  },
  (c, f, b) => {
    blob(c, 0, 0, 8, 8, "#9ad7e0");
    for (let i = 0; i < 5; i++) {
      const a = -2.4 + i * 0.7;
      c.strokeStyle = "#d5f2f4";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(Math.cos(a) * 6, Math.sin(a) * 6);
      c.lineTo(Math.cos(a) * 16, Math.sin(a) * 14 + f);
      c.stroke();
    }
    eye(c, -2, -1, 1.8, "#1c2830", b);
    eye(c, 2, -1, 1.8, "#1c2830", b);
  },
  (c, f, b) => {
    blob(c, 0, 0, 11, 12, "#efeae2", "#6e675f");
    c.fillStyle = "#1c140f";
    c.beginPath();
    c.ellipse(-3.5, -2, 2.4, 3, 0, 0, Math.PI * 2);
    c.ellipse(3.5, -2, 2.4, 3, 0, 0, Math.PI * 2);
    c.fill();
    tri(c, [-2, 4, 0, 8, 2, 4], "#c44536");
  },
  (c, f, b) => {
    blob(c, 0, 0, 9, 10, "#c46a3a");
    for (let i = -2; i <= 2; i++) {
      c.strokeStyle = "#e7c07a";
      c.lineWidth = 1.8;
      c.beginPath();
      c.moveTo(i * 3, 6);
      c.quadraticCurveTo(i * 5, 12, i * 2 + f, 18);
      c.stroke();
    }
    eye(c, -2.4, -2, 2, "#1c140f", b);
    eye(c, 2.4, -2, 2, "#1c140f", b);
  },
  (c, f, b) => {
    blob(c, 0, 2, 12, 10, "#9aa8b5");
    blob(c, 0, -6, 4, 4, "#d5dbe2");
    c.strokeStyle = "#e7eaee";
    c.lineWidth = 1.4;
    c.beginPath();
    c.moveTo(0, -10);
    c.lineTo(f * 3, -18);
    c.stroke();
    eye(c, 0, -6, 2, "#e07a3d", b);
  },
  (c, f, b) => {
    c.fillStyle = "#16181c";
    c.fillRect(-6, -16, 12, 28);
    ink(c, "#8e99a3");
    c.strokeStyle = "#e07a3d";
    c.lineWidth = 2;
    c.beginPath();
    c.arc(0, -2, 8 + f, 0.8, Math.PI - 0.2);
    c.stroke();
    eye(c, 0, -2, 2.4, "#e07a3d", b);
  },
  (c, f, b) => {
    blob(c, 0, 0, 14, 14, "#2a2418");
    c.fillStyle = "#07090c";
    c.beginPath();
    c.arc(0, 0, 5, 0, Math.PI * 2);
    c.fill();
    eye(c, -6, -5, 1.6, "#e7c07a", b);
    eye(c, 6, -4, 1.6, "#e7c07a", b);
    eye(c, 0, 7, 1.4, "#e07a3d", b);
  },
];

export function drawCritter(ctx: Pen, look: number, kind: Kind, time: number, spin: number, flash: boolean) {
  const sc = kind === "cruiser" ? 1.05 : kind === "wedge" ? 0.86 : kind === "drone" ? 0.7 : 0.78;
  const flap = Math.sin(time * 6 + spin);
  const blink = Math.sin(time * 1.7 + spin) > 0.94;
  ctx.save();
  ctx.scale(sc, sc);
  if (flash) ctx.globalAlpha = 0.55;
  CREW[((look % CREW.length) + CREW.length) % CREW.length](ctx, flap, blink);
  ctx.restore();
}

export function drawBossCreature(ctx: Pen, which: number, time: number, hurt: boolean) {
  const flap = Math.sin(time * 4);
  const blink = Math.sin(time * 1.4) > 0.96;
  ctx.save();
  ctx.scale(1.15, 1.15);
  if (hurt) ctx.globalAlpha = 0.62;
  BOSSES[((which % BOSSES.length) + BOSSES.length) % BOSSES.length](ctx, flap, blink);
  ctx.restore();
}

export function drawLoot(ctx: Pen, kind: string, time: number, spin: number) {
  const bob = Math.sin(time * 4 + spin) * 2;
  ctx.save();
  ctx.translate(0, bob);
  ctx.fillStyle = "rgba(7,9,12,0.78)";
  ctx.beginPath();
  ctx.arc(0, 2, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(231,234,238,0.7)";
  ctx.lineWidth = 1.35;
  ctx.stroke();
  ctx.scale(1.25, 1.25);
  if (kind === "$") coin(ctx, time);
  else if (kind === "S") shield(ctx, time);
  else if (kind === "B") bomb(ctx);
  else if (kind === "M") chain(ctx, time);
  else gun(ctx);
  ctx.restore();
}

function gun(ctx: Pen) {
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

function shield(ctx: Pen, time: number) {
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

function bomb(ctx: Pen) {
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

function chain(ctx: Pen, time: number) {
  ctx.save();
  ctx.rotate(-0.7);
  ctx.fillStyle = "#e07a3d";
  ctx.globalAlpha = 0.55 + Math.sin(time * 14) * 0.45;
  ctx.beginPath();
  ctx.moveTo(-2, 5);
  ctx.lineTo(2.4, 11);
  ctx.lineTo(-2.4, 11);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = "#e7edf2";
  ctx.beginPath();
  ctx.moveTo(0, -11);
  ctx.lineTo(3.4, 5);
  ctx.lineTo(-3.4, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = "#c44536";
  ctx.fillRect(-2.6, 1.5, 5.2, 2);
  ctx.restore();
}

function coin(ctx: Pen, time: number) {
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
