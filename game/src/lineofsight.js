// GOLDHOUR — lineofsight.js
// The geometry every stealth decision rests on: circle-vs-wall movement,
// segment-vs-wall line of sight, and the cone test guards and cameras share.

export function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

export function dist(ax, ay, bx, by) {
  return Math.hypot(ax - bx, ay - by);
}

// Smallest absolute difference between two angles, in (-PI, PI].
export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d <= -Math.PI) d += 2 * Math.PI;
  return d;
}

// Does the circle (cx, cy, r) overlap rect?
export function circleHitsRect(cx, cy, r, rect) {
  const nx = clamp(cx, rect.x, rect.x + rect.w);
  const ny = clamp(cy, rect.y, rect.y + rect.h);
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function circleHitsAnyRect(cx, cy, r, rects) {
  for (const rect of rects) {
    if (circleHitsRect(cx, cy, r, rect)) return true;
  }
  return false;
}

// Move a circle by (dx, dy) with axis-separated wall sliding: try x, undo
// the part that collides, then y. This is what keeps the thief from
// sticking on wall corners.
export function moveCircle(e, dx, dy, r, rects) {
  e.x += dx;
  if (circleHitsAnyRect(e.x, e.y, r, rects)) e.x -= dx;
  e.y += dy;
  if (circleHitsAnyRect(e.x, e.y, r, rects)) e.y -= dy;
}

// Slab test: does segment (x1,y1)-(x2,y2) cross rect?
export function segmentHitsRect(x1, y1, x2, y2, rect) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  // X slab.
  if (Math.abs(dx) < 1e-9) {
    if (x1 < rect.x || x1 > rect.x + rect.w) return false;
  } else {
    let t1 = (rect.x - x1) / dx;
    let t2 = (rect.x + rect.w - x1) / dx;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  // Y slab.
  if (Math.abs(dy) < 1e-9) {
    if (y1 < rect.y || y1 > rect.y + rect.h) return false;
  } else {
    let t1 = (rect.y - y1) / dy;
    let t2 = (rect.y + rect.h - y1) / dy;
    if (t1 > t2) { const t = t1; t1 = t2; t2 = t; }
    tmin = Math.max(tmin, t1);
    tmax = Math.min(tmax, t2);
    if (tmin > tmax) return false;
  }
  return true;
}

// Line of sight: true when no wall stands between the two points.
export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const w of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, w)) return false;
  }
  return true;
}

// Is target (tx, ty) inside the vision cone of an observer at (ox, oy)
// facing `angle`, with the given range and half-angle — and visible?
// Returns 0 when unseen, otherwise a sight strength in (0, 1]: 1 up close
// dead-centre, fading with distance and toward the cone's rim.
export function coneStrength(ox, oy, angle, range, halfAngle, tx, ty, walls) {
  const d = dist(ox, oy, tx, ty);
  if (d > range) return 0;
  const toTarget = Math.atan2(ty - oy, tx - ox);
  const off = Math.abs(angleDiff(toTarget, angle));
  if (off > halfAngle) return 0;
  if (!hasLineOfSight(ox, oy, tx, ty, walls)) return 0;
  const near = 1 - 0.75 * (d / range); // 1.0 close, 0.25 at max range
  const centre = 1 - 0.65 * (off / halfAngle); // 1.0 centre, 0.35 at rim
  return near * centre;
}

// Is point (x, y) inside one of the bank's shadow pools?
export function inShadow(x, y, shadows) {
  for (const s of shadows) {
    const dx = (x - s.x) / s.rx;
    const dy = (y - s.y) / s.ry;
    if (dx * dx + dy * dy <= 1) return true;
  }
  return false;
}
