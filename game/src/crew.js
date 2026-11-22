// GOLDHOUR — crew.js
// The people and machines watching the bank: three patrolling guards with
// suspicion, hearing and a chase, and three sweeping CCTV cameras.
// Guards never touch the DOM; the engine owns the alarm and the score.

import { T } from './tuning.js';
import {
  angleDiff, circleHitsAnyRect, coneStrength, dist, moveCircle,
} from './lineofsight.js';

function turnToward(angle, target, maxStep) {
  const d = angleDiff(target, angle);
  if (Math.abs(d) <= maxStep) return target;
  return angle + Math.sign(d) * maxStep;
}

export function makeGuard(def, rng) {
  const [sx, sy] = def.waypoints[0];
  return {
    name: def.name,
    color: def.color,
    waypoints: def.waypoints,
    wp: 1,
    x: sx,
    y: sy,
    angle: 0,
    state: 'patrol', // patrol | suspicious | investigate | chase | return
    suspicion: 0,
    pauseT: 0,
    pauseBase: 0,
    sweepT: rng() * 6,
    target: null, // {x, y} for investigate
    lookT: 0,
    huntT: 0, // gives up on an unreachable investigate point (coin in a wall)
    loseT: 0,
    lastSeen: { x: sx, y: sy },
    searchT: 0,
  };
}

export function makeCamera(def, index) {
  return {
    id: def.id,
    name: def.name,
    x: def.x,
    y: def.y,
    base: def.base,
    sweep: def.sweep,
    phase: index * 2.1,
    angle: def.base,
    sees: 0, // sight strength on the thief this frame, 0 when blind
  };
}

// A noise at (x, y) — a tossed coin, a loud step — pulls a guard off route.
export function alertGuard(g, x, y) {
  if (g.state === 'chase') return;
  g.state = 'investigate';
  g.target = { x, y };
  g.lookT = 0;
  g.huntT = 0;
  g.suspicion = Math.max(g.suspicion, 45);
  g.loseT = 0;
}

function pickSearchPoint(g, env) {
  for (let i = 0; i < 12; i++) {
    const a = env.rng() * Math.PI * 2;
    const r = 60 + env.rng() * 120;
    const x = env.lastKnown.x + Math.cos(a) * r;
    const y = env.lastKnown.y + Math.sin(a) * r;
    if (x < 30 || x > 1250 || y < 80 || y > 690) continue;
    if (circleHitsAnyRect(x, y, T.GUARD_R + 4, env.walls)) continue;
    return { x, y };
  }
  return { x: env.lastKnown.x, y: env.lastKnown.y };
}

export function updateGuard(g, dt, env) {
  // env: { thief, walls, rng, time, lockdown, lastKnown }
  const th = env.thief;
  const moving = th.moving && !th.sneaking;

  // --- Sight ---------------------------------------------------------------
  let strength = coneStrength(
    g.x, g.y, g.angle, T.SEE_RANGE, T.SEE_HALF_ANGLE, th.x, th.y, env.walls,
  );
  if (strength > 0) {
    if (th.sneaking) strength *= T.SNEAK_VIS;
    if (th.inShadow) strength *= T.SHADOW_VIS;
    if (moving) strength *= T.MOVING_VIS;
  }
  g.sees = strength; // exposed for the alarm meter and the HUD

  if (strength > 0) {
    g.suspicion = Math.min(100, g.suspicion + T.SUSPICION_UP * strength * dt);
    g.lastSeen = { x: th.x, y: th.y };
    env.lastKnown.x = th.x;
    env.lastKnown.y = th.y;
    g.loseT = 0;
    if (g.suspicion >= T.CHASE_AT && g.state !== 'chase') {
      g.state = 'chase';
      g.chaseKick = true; // engine turns this into the alarm kick + sting
    } else if (g.suspicion >= T.SUSPICIOUS_AT && g.state === 'patrol') {
      g.state = 'suspicious';
    }
    if (g.state === 'suspicious') {
      g.angle = turnToward(g.angle, Math.atan2(th.y - g.y, th.x - g.x), 7 * dt);
    }
  } else {
    g.suspicion = Math.max(0, g.suspicion - T.SUSPICION_DOWN * dt);
    g.loseT += dt;
    if (g.state === 'suspicious' && g.suspicion < T.SUSPICIOUS_AT) {
      g.state = 'patrol';
    }
    if (g.state === 'chase' && g.loseT > T.CHASE_LOST_SIGHT) {
      g.state = 'investigate';
      g.target = { ...g.lastSeen };
      g.lookT = 0;
      g.huntT = 0;
    }
  }

  // --- Hearing -------------------------------------------------------------
  // Walking is audible; sneaking is not. A heard step makes a patrolling
  // guard stop and stare toward the noise.
  if (moving && g.state === 'patrol') {
    const d = dist(g.x, g.y, th.x, th.y);
    if (d < T.HEAR_WALK) {
      g.state = 'suspicious';
      g.suspicion = Math.max(g.suspicion, 40);
      g.angle = turnToward(g.angle, Math.atan2(th.y - g.y, th.x - g.x), 7 * dt);
    }
  }

  // --- Movement ------------------------------------------------------------
  const stepToward = (tx, ty, speed) => {
    const d = dist(g.x, g.y, tx, ty);
    if (d < 8) return true;
    const vx = ((tx - g.x) / d) * speed * dt;
    const vy = ((ty - g.y) / d) * speed * dt;
    moveCircle(g, vx, vy, T.GUARD_R, env.walls);
    g.angle = turnToward(g.angle, Math.atan2(ty - g.y, tx - g.x), 6 * dt);
    return dist(g.x, g.y, tx, ty) < 8;
  };

  if (g.state === 'patrol') {
    if (g.pauseT > 0) {
      // Pause at the waypoint and sweep the cone: the readable moment
      // the player is meant to wait out or slip behind.
      g.pauseT -= dt;
      g.sweepT += dt;
      // Sweep around the direction of the NEXT leg, not the waypoint just
      // reached (the guard is standing on it, so that vector is noise).
      const next = g.waypoints[(g.wp + 1) % g.waypoints.length];
      const faceNext = Math.atan2(next[1] - g.y, next[0] - g.x);
      g.angle = faceNext + Math.sin(g.sweepT * 1.6) * 0.9;
      if (g.pauseT <= 0) g.wp = (g.wp + 1) % g.waypoints.length;
    } else {
      const wp = g.waypoints[g.wp];
      if (stepToward(wp[0], wp[1], T.PATROL_SPEED)) {
        g.pauseT = 1.2 + env.rng() * 0.8;
        g.pauseBase = Math.atan2(wp[1] - g.y, wp[0] - g.x);
      }
    }
  } else if (g.state === 'suspicious') {
    // Frozen, staring at the last seen (or heard) spot.
  } else if (g.state === 'chase') {
    // Run at the thief while seen; at the last known spot during lockdown.
    const tx = strength > 0 ? th.x : env.lastKnown.x;
    const ty = strength > 0 ? th.y : env.lastKnown.y;
    if (dist(g.x, g.y, tx, ty) > 10) {
      stepToward(tx, ty, T.CHASE_SPEED);
    }
    if (env.lockdown && strength === 0 && dist(g.x, g.y, tx, ty) <= 12) {
      // Reached the last known spot and found nothing: search nearby.
      g.state = 'investigate';
      g.target = pickSearchPoint(g, env);
      g.lookT = 0;
      g.huntT = 0;
    }
  } else if (g.state === 'investigate') {
    if (g.target) {
      // A coin can land inside a wall: give up after 6 s rather than
      // grinding against the plaster forever.
      g.huntT += dt;
      if (stepToward(g.target.x, g.target.y, T.INVESTIGATE_SPEED) || g.huntT > 6) {
        g.target = null;
        g.lookT = 2;
        g.huntT = 0;
      }
    } else if (g.lookT > 0) {
      g.lookT -= dt;
      g.angle += dt * 2.2; // look around before giving up
      if (g.lookT <= 0) {
        if (env.lockdown) {
          g.state = 'investigate';
          g.target = pickSearchPoint(g, env);
          g.huntT = 0;
        } else {
          g.state = 'return';
        }
      }
    }
  } else if (g.state === 'return') {
    // Walk back to the nearest waypoint, then resume the patrol.
    let best = 0;
    let bestD = Infinity;
    g.waypoints.forEach((wp, i) => {
      const d = dist(g.x, g.y, wp[0], wp[1]);
      if (d < bestD) { bestD = d; best = i; }
    });
    const wp = g.waypoints[best];
    if (stepToward(wp[0], wp[1], T.PATROL_SPEED)) {
      g.wp = (best + 1) % g.waypoints.length;
      g.state = 'patrol';
      g.pauseT = 0.6;
    }
  }
}

export function updateCamera(cam, t, dt, thief, walls, dark) {
  cam.angle = cam.base + Math.sin(t * T.CAM_SWEEP_SPEED + cam.phase) * cam.sweep;
  if (dark > 0) {
    cam.sees = 0;
    return;
  }
  let strength = coneStrength(
    cam.x, cam.y, cam.angle, T.CAM_RANGE, T.CAM_HALF_ANGLE,
    thief.x, thief.y, walls,
  );
  if (strength > 0) {
    if (thief.sneaking) strength *= T.SNEAK_VIS;
    if (thief.inShadow) strength *= T.SHADOW_VIS;
    if (thief.moving && !thief.sneaking) strength *= T.MOVING_VIS;
  }
  cam.sees = strength;
}
