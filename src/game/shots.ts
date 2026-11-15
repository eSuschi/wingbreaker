/**
 * Hostile shots ("the poop"). Every kind is its own hand-inked sprite with its own
 * silhouette and colour, drawn with a thin light outline so the dark brown ones
 * still read on a dark sky. No rings, no frames.
 *
 * The plain brown kind has nine drawings; each shot keeps the one it was born with,
 * so a volley looks like a handful of different things instead of one stamp.
 */

type Look = {
  /** files under /art/p, without extension */
  art: string[];
  /** longest side in world pixels */
  size: number;
  /** the sprite turns along its flight; the value is the direction the drawing points at */
  heading?: number;
  alpha?: number;
  sparkle?: string;
};

const BROWN = ["classic_swirl", "bent_log", "split_log", "horseshoe", "side_corkscrew", "flat_splat", "pellet_stack", "cracked_ring", "rolled_ribbon"];

const LOOKS: Record<number, Look> = {
  0: { art: BROWN, size: 27 },
  1: { art: ["rabbit_pellets"], size: 22 },
  2: { art: ["side_corkscrew", "bent_log"], size: 26 },
  3: { art: ["grumpy_stinker"], size: 30 },
  4: { art: ["flat_splat", "rolled_ribbon"], size: 27 },
  5: { art: ["frozen_turd"], size: 28 },
  6: { art: ["pebble_poop"], size: 29 },
  7: { art: ["comet_log"], size: 30, heading: -0.55 },
  8: { art: ["honey_blob"], size: 30 },
  9: { art: ["slime_log"], size: 30 },
  10: { art: ["ghost_poop"], size: 28, alpha: 0.9 },
  11: { art: ["chili_bomb"], size: 30 },
  12: { art: ["zap_turd"], size: 28 },
  13: { art: ["unicorn_swirl", "disco_poop"], size: 28, sparkle: "#ffffff" },
  14: { art: ["golden_nugget"], size: 29, sparkle: "#fff3b0" },
  15: { art: ["diamond_dump"], size: 28, sparkle: "#ffffff" },
  16: { art: ["fart_cloud"], size: 36, alpha: 0.85 },
};

const EDGE = 4;
const sources = new Map<string, HTMLImageElement>();
const built = new Map<string, HTMLCanvasElement | null>();

function source(path: string) {
  let img = sources.get(path);
  if (!img) {
    img = new Image();
    img.src = path;
    sources.set(path, img);
  }
  return img.complete && img.naturalWidth > 2 ? img : null;
}

function build(art: string): HTMLCanvasElement | null {
  const img = source(`/art/p/${art}.webp`);
  if (!img) return null;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  // light outline: the silhouette, stamped around the sprite, filled cream
  const out = document.createElement("canvas");
  out.width = w + EDGE * 2;
  out.height = h + EDGE * 2;
  const o = out.getContext("2d");
  if (!o) return null;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    o.drawImage(img, EDGE + Math.cos(a) * EDGE, EDGE + Math.sin(a) * EDGE);
  }
  o.globalCompositeOperation = "source-in";
  o.fillStyle = "#fff1d6";
  o.fillRect(0, 0, out.width, out.height);
  o.globalCompositeOperation = "source-over";
  o.drawImage(img, EDGE, EDGE);
  return out;
}

function sprite(art: string) {
  let c = built.get(art);
  if (c === undefined || c === null) {
    c = build(art);
    if (c) built.set(art, c);
  }
  return c ?? null;
}

function twinkle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x, y - r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.quadraticCurveTo(x, y, x, y + r);
  ctx.quadraticCurveTo(x, y, x - r, y);
  ctx.quadraticCurveTo(x, y, x, y - r);
  ctx.fill();
}

export function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string) {
  twinkle(ctx, x, y, r, color);
}

/**
 * Draws one hostile shot centred on the current origin. `pick` is the shot's own number,
 * fixed for its whole life, and chooses its drawing. Returns false until the art has loaded.
 */
export function drawHostileShot(
  ctx: CanvasRenderingContext2D,
  shape: number,
  x: number,
  y: number,
  vx: number,
  vy: number,
  time: number,
  small: boolean,
  pick = 0,
) {
  const look = LOOKS[shape] ?? LOOKS[0];
  const img = sprite(look.art[Math.abs(Math.floor(pick)) % look.art.length]);
  if (!img) return false;
  const k = (look.size * (small ? 0.84 : 1)) / Math.max(img.width, img.height);
  const w = img.width * k;
  const h = img.height * k;
  if (look.heading !== undefined) ctx.rotate(Math.atan2(vy, vx) - look.heading);
  else ctx.rotate(Math.sin(y * 0.07 + x * 0.04 + pick) * 0.3);
  if (look.alpha) ctx.globalAlpha = look.alpha;
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  ctx.globalAlpha = 1;
  if (look.sparkle) {
    const t = time * 5 + x * 0.1;
    twinkle(ctx, Math.cos(t) * h * 0.45, -h * 0.3 + Math.sin(t * 1.3) * 3, 3.2 + Math.sin(t * 2) * 1.2, look.sparkle);
    twinkle(ctx, -Math.cos(t * 0.8) * h * 0.4, h * 0.15, 2.2, look.sparkle);
  }
  return true;
}
