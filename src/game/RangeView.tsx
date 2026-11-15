import { useEffect, useRef } from "react";
import type { SkinId } from "./meta";
import { drawWorld } from "./render";
import type { GunFamily } from "./v3";
import { RANGE_BOTTOM, RANGE_TOP, WORLD_W, aimRange, createRange, stepRange } from "./world";

type Props = {
  family: GunFamily;
  /** gun power, 1 to 6 */
  rank: number;
  skin: SkinId;
  /** the campaign level, so the targets are the critters of the room the pilot is in */
  level: number;
  className?: string;
};

/**
 * The shop's firing range: the real game, in a small window, with one ship that cannot be
 * hurt and targets that keep coming back. It runs in a world of its own that is never saved,
 * so what it shows is exactly what the gun does in a level, and nothing it does costs anything.
 */
export function RangeView({ family, rank, skin, level, className }: Props) {
  const ref = useRef<HTMLCanvasElement>(null);
  const want = useRef({ family, rank, skin, level });
  want.current = { family, rank, skin, level };

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const world = createRange();
    let aimed = "";
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const w = want.current;
      // a new gun, power, ship or screen size: set the range up again
      const key = `${w.family}|${w.rank}|${w.skin}|${w.level}|${WORLD_W}`;
      if (key !== aimed) {
        aimRange(world, w.family, w.rank, w.skin, w.level);
        aimed = key;
      }
      acc += Math.min(0.1, (now - last) / 1000);
      last = now;
      let steps = 0;
      while (acc >= 1 / 60 && steps < 4) {
        stepRange(world, 1 / 60);
        acc -= 1 / 60;
        steps++;
      }
      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      if (cssW < 2 || cssH < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(cssW * dpr);
      const ph = Math.round(cssH * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      // the window shows the strip of sky between the targets' line and the ship, centred
      const scale = cssH / (RANGE_BOTTOM - RANGE_TOP);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.fillStyle = "#05070b";
      ctx.fillRect(0, 0, pw, ph);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * (cssW / 2 - (WORLD_W / 2) * scale), -dpr * RANGE_TOP * scale);
      drawWorld(ctx, world, false);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={ref} className={className} aria-label="Firing range: the selected gun at work" />;
}
