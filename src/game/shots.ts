/**
 * Hostile shots ("the poop"). Every kind is a character sprite with its own
 * silhouette and colour, drawn with a thin light outline so it reads on any
 * sky. No rings, no frames: those belong to nothing in the game any more.
 *
 * Until purpose-drawn art exists for a kind, it is built at load time from one
 * of the five hand-painted base sprites, recoloured with a `color` blend so the
 * shading and the face survive. Dropping `public/shots/<key>.png` in and adding
 * the key to CUSTOM_ART replaces the recolour with the real drawing.
 */

type Look = {
  key: string;
  /** index of /shots/poop-N.png, or a file name */
  base: number | string;
  tint?: string | "rainbow";
  /** 0..1 extra brightness after tinting, for pale kinds */
  lift?: number;
  /** drawn height in world pixels */
  h: number;
  /** "vel" turns the sprite along its flight, otherwise it wobbles as it falls */
  turn?: "vel";
  alpha?: number;
  sparkle?: string;
};

const LOOKS: Record<number, Look> = {
  0: { key: "swirl", base: 0, h: 27 },
  1: { key: "pellet", base: 1, h: 17 },
  2: { key: "streak", base: 2, h: 13, turn: "vel" },
  3: { key: "grump", base: 3, h: 31 },
  4: { key: "sick", base: 4, h: 27 },
  5: { key: "frozen", base: 0, tint: "#63c3f2", lift: 0.3, h: 27 },
  6: { key: "pebble", base: 3, tint: "#8f9bb0", lift: 0.3, h: 30 },
  7: { key: "comet", base: 2, tint: "#ff9a2e", lift: 0.2, h: 14, turn: "vel" },
  8: { key: "honey", base: 1, tint: "#f2a516", lift: 0.18, h: 30 },
  9: { key: "slime", base: 4, h: 25 },
  10: { key: "ghost", base: 0, tint: "#b9c2ff", lift: 0.55, h: 27, alpha: 0.88 },
  11: { key: "chili", base: 3, tint: "#e2332a", lift: 0.05, h: 30 },
  12: { key: "zap", base: 1, tint: "#f5dd1c", lift: 0.3, h: 25 },
  13: { key: "unicorn", base: 0, tint: "rainbow", lift: 0.3, h: 27, sparkle: "#ffffff" },
  14: { key: "gold", base: 0, tint: "#f0bb1e", lift: 0.38, h: 27, sparkle: "#fff3b0" },
  15: { key: "diamond", base: 1, tint: "#7fe3ff", lift: 0.6, h: 25, sparkle: "#ffffff" },
  16: { key: "fart", base: "squirt", h: 36, alpha: 0.8 },
};

/** Keys that have their own drawing at /shots/<key>.png. */
const CUSTOM_ART: string[] = [];

const SRC = 112;
const EDGE = 5;
const sources = new Map<string, HTMLImageElement>();
const built = new Map<number, HTMLCanvasElement | null>();

function source(path: string) {
  let img = sources.get(path);
  if (!img) {
    img = new Image();
    img.src = path;
    sources.set(path, img);
  }
  return img.complete && img.naturalWidth > 2 ? img : null;
}

function build(shape: number): HTMLCanvasElement | null {
  const look = LOOKS[shape] ?? LOOKS[0];
  const own = CUSTOM_ART.includes(look.key);
  const img = source(own ? `/shots/${look.key}.png` : typeof look.base === "number" ? `/shots/poop-${look.base}.png` : `/shots/${look.base}.png`);
  if (!img) return null;
  const aspect = img.width / img.height;
  const h = SRC;
  const w = Math.round(SRC * aspect);
  const body = document.createElement("canvas");
  body.width = w;
  body.height = h;
  const g = body.getContext("2d");
  if (!g) return null;
  g.drawImage(img, 0, 0, w, h);
  if (!own && look.tint) {
    g.globalCompositeOperation = "color";
    if (look.tint === "rainbow") {
      const band = g.createLinearGradient(0, 0, w, h);
      ["#ff5d8f", "#ffb347", "#f5e663", "#6ddc8b", "#59b8ff", "#b58cff"].forEach((c, i, all) => band.addColorStop(i / (all.length - 1), c));
      g.fillStyle = band;
    } else g.fillStyle = look.tint;
    g.fillRect(0, 0, w, h);
    if (look.lift) {
      g.globalCompositeOperation = "screen";
      g.fillStyle = `rgba(255,255,255,${look.lift})`;
      g.fillRect(0, 0, w, h);
    }
    // the blends painted the whole rectangle: cut it back to the sprite's shape
    g.globalCompositeOperation = "destination-in";
    g.drawImage(img, 0, 0, w, h);
    g.globalCompositeOperation = "source-over";
  }
  // light outline: the silhouette, stamped around the sprite, filled cream
  const out = document.createElement("canvas");
  out.width = w + EDGE * 2;
  out.height = h + EDGE * 2;
  const o = out.getContext("2d");
  if (!o) return body;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    o.drawImage(body, EDGE + Math.cos(a) * EDGE, EDGE + Math.sin(a) * EDGE);
  }
  o.globalCompositeOperation = "source-in";
  o.fillStyle = "#fff1d6";
  o.fillRect(0, 0, out.width, out.height);
  o.globalCompositeOperation = "source-over";
  o.drawImage(body, EDGE, EDGE);
  return out;
}

function sprite(shape: number) {
  let c = built.get(shape);
  if (c === undefined || c === null) {
    c = build(shape);
    if (c) built.set(shape, c);
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

/** Draws one hostile shot centred on the current origin. Returns false until its art has loaded. */
export function drawHostileShot(ctx: CanvasRenderingContext2D, shape: number, x: number, y: number, vx: number, vy: number, time: number, small: boolean) {
  const look = LOOKS[shape] ?? LOOKS[0];
  const img = sprite(shape);
  if (!img) return false;
  const scale = small ? 0.82 : 1;
  const h = look.h * scale * (1 + (EDGE * 2) / SRC);
  const w = h * (img.width / img.height);
  if (look.turn === "vel") ctx.rotate(Math.atan2(vy, vx) + Math.PI);
  else ctx.rotate(Math.sin(y * 0.07 + x * 0.04) * 0.3);
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
