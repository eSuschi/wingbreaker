#!/usr/bin/env python3
"""Knock out a magenta backdrop and crop to the creature."""
import sys
from pathlib import Path

import numpy as np
from PIL import Image


def knock(src: Path, dest: Path, pad: int = 8) -> None:
    im = Image.open(src).convert("RGBA")
    arr = np.array(im)
    rgb = arr[:, :, :3].astype(np.int16)
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    h, w = r.shape
    corners = np.stack([
        rgb[0, 0], rgb[0, w - 1], rgb[h - 1, 0], rgb[h - 1, w - 1]
    ]).astype(np.int16)
    ref = np.median(corners, axis=0)
    dist = np.sqrt((rgb[:, :, 0] - ref[0]) ** 2 + (rgb[:, :, 1] - ref[1]) ** 2 + (rgb[:, :, 2] - ref[2]) ** 2)
    # jpeg magenta drifts toward red; stay close to the sampled backdrop
    key = dist < 78
    vis = np.zeros((h, w), dtype=bool)
    stack = []
    for x in range(w):
        stack.append((0, x))
        stack.append((h - 1, x))
    for y in range(h):
        stack.append((y, 0))
        stack.append((y, w - 1))
    while stack:
        y, x = stack.pop()
        if y < 0 or x < 0 or y >= h or x >= w or vis[y, x] or not key[y, x]:
            continue
        vis[y, x] = True
        stack.append((y - 1, x))
        stack.append((y + 1, x))
        stack.append((y, x - 1))
        stack.append((y, x + 1))
    alpha = arr[:, :, 3]
    alpha[vis] = 0
    ys, xs = np.where(alpha > 16)
    if len(ys) == 0:
        raise SystemExit(f"empty sprite: {src}")
    y0, y1 = max(0, int(ys.min()) - pad), min(h, int(ys.max()) + 1 + pad)
    x0, x1 = max(0, int(xs.min()) - pad), min(w, int(xs.max()) + 1 + pad)
    crop = arr[y0:y1, x0:x1]
    rgb_c = crop[:, :, :3].astype(np.int16)
    a = crop[:, :, 3]
    spill = (a > 0) & (rgb_c[:, :, 0] > 150) & (rgb_c[:, :, 2] > 80) & (rgb_c[:, :, 1] < 90) & (rgb_c[:, :, 0] > rgb_c[:, :, 1] + 40)
    rgb_c[:, :, 0] = np.where(spill, np.minimum(rgb_c[:, :, 0], rgb_c[:, :, 1] + 30), rgb_c[:, :, 0])
    rgb_c[:, :, 2] = np.where(spill, np.minimum(rgb_c[:, :, 2], rgb_c[:, :, 1] + 40), rgb_c[:, :, 2])
    crop[:, :, :3] = rgb_c.astype(np.uint8)
    dest.parent.mkdir(parents=True, exist_ok=True)
    Image.fromarray(crop).save(dest)


if __name__ == "__main__":
    knock(Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3]) if len(sys.argv) > 3 else 10)
