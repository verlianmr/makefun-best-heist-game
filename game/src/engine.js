// GOLDHOUR — engine.js
// The game itself: state machine, the one alarm meter, tools, the vault,
// lockdown, scoring. Pure logic — no DOM, no canvas — so the same file
// runs headless in Node for the logic simulation.

import { T, mulberry32 } from './tuning.js';
import { buildBank } from './bank.js';
import {
  alertGuard, makeCamera, makeGuard, updateCamera, updateGuard,
} from './crew.js';
import { clamp, dist, inShadow, moveCircle } from './lineofsight.js';

export function newGame(seed = 20261122) {
  const bank = buildBank();
  const state = {
    mode: 'title', // title | playing | paused | busted | getaway
    seed,
    bank,
    rng: mulberry32(seed),
    thief: {
      x: bank.spawn.x, y: bank.spawn.y, angle: bank.spawn.angle,
      moving: false, sneaking: false, inShadow: false,
    },
    guards: bank.guards.map((d) => makeGuard(d, mulberry32(seed + d.name.length))),
    cameras: bank.cameras.map((d, i) => makeCamera(d, i)),
    loot: bank.loot.map((l) => ({ ...l, taken: false })),
    alarm: 0,
    lockdown: 0,
    lockdownUnseen: 0,
    alarms: 0,
    coins: T.COINS,
    emp: T.EMP_CHARGES,
    camerasDark: 0,
    terminalCooldown: 0,
    terminalProgress: 0,
    vaultProgress: 0,
    vaultOpen: false,
    starTaken: false,
    lootValue: 0,
    toolCost: 0,
    elapsed: 0,
    caughtBy: null,
    score: 0,
    grade: '',
    coinFx: null,
    empFlash: 0,
    message: '',
    messageT: 0,
    lastKnown: { x: bank.spawn.x, y: bank.spawn.y },
    events: [], // drained by boot each frame: sound + banner triggers
    seenNow: false,
  };
  return state;
}

export function startRun(state) {
  const fresh = newGame(state.seed);
  // Keep the same object identity (boot holds a reference to it).
  for (const key of Object.keys(fresh)) state[key] = fresh[key];
  state.mode = 'playing';
  state.message = 'Get in. Crack the vault. Get out.';
  state.messageT = 3;
}

export function scoreBreakdown(state) {
  const timeBonus = Math.max(0, T.PAR_SECONDS - Math.floor(state.elapsed)) * T.TIME_BONUS_RATE;
  const alarmFines = state.alarms * T.ALARM_FINE;
  const total = state.lootValue + timeBonus - alarmFines - state.toolCost;
  const grade = total >= T.GRADE_S ? 'S'
    : total >= T.GRADE_A ? 'A'
    : total >= T.GRADE_B ? 'B'
    : total >= T.GRADE_C ? 'C' : 'D';
  return { timeBonus, alarmFines, total, grade };
}

function say(state, text, seconds = 2.5) {
  state.message = text;
  state.messageT = seconds;
}

function thiefSpeed(state) {
  const carried = state.loot.filter((l) => l.taken).length;
  const base = state.thief.sneaking ? T.SNEAK_SPEED : T.WALK_SPEED;
  // The carry floor must stay below sneak speed, or sneaking would
  // outrun walking once the pockets fill.
  const floor = state.thief.sneaking ? 70 : T.CARRY_MIN;
  return Math.max(floor, base - carried * T.CARRY_PENALTY);
}

// input: { up, down, left, right, sneak, interact, coin, emp, pause }
// coin / emp / pause are edge flags: boot sets them for exactly one frame.
export function updateGame(state, input, dt) {
  if (state.mode === 'title' || state.mode === 'busted' || state.mode === 'getaway') {
    return;
  }
  if (input.pause) {
    state.mode = state.mode === 'paused' ? 'playing' : 'paused';
    return;
  }
  if (state.mode === 'paused') return;

  state.elapsed += dt;
  const th = state.thief;
  const bank = state.bank;

  // --- Thief movement ------------------------------------------------------
  let mx = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  let my = (input.down ? 1 : 0) - (input.up ? 1 : 0);
  th.sneaking = !!input.sneak;
  th.moving = mx !== 0 || my !== 0;
  if (th.moving) {
    const len = Math.hypot(mx, my);
    mx /= len;
    my /= len;
    const speed = thiefSpeed(state);
    // Vents are solid to the thief unless sneaking: the crawl-through rule.
    const solids = th.sneaking ? bank.walls : bank.walls.concat(bank.vents);
    moveCircle(th, mx * speed * dt, my * speed * dt, T.THIEF_R, solids);
    th.x = clamp(th.x, 14 + T.THIEF_R, 1266 - T.THIEF_R);
    th.y = clamp(th.y, 70 + T.THIEF_R, 720 - T.THIEF_R);
    th.angle = Math.atan2(my, mx);
  }
  th.inShadow = inShadow(th.x, th.y, bank.shadows);

  // --- Loot ----------------------------------------------------------------
  for (const piece of state.loot) {
    if (piece.taken) continue;
    if (piece.vault && !state.vaultOpen) continue; // the Star waits for the crack
    if (dist(th.x, th.y, piece.x, piece.y) < 26) {
      piece.taken = true;
      state.lootValue += piece.value;
      state.events.push('pickup');
      if (piece.id === 'star') {
        state.starTaken = true;
        say(state, 'THE HALCYON STAR IS YOURS — GET TO THE VAN', 3.5);
      }
    }
  }

  // --- Tools ---------------------------------------------------------------
  if (input.coin) {
    if (state.coins > 0) {
      state.coins -= 1;
      state.toolCost += T.COIN_COST;
      const cx = clamp(th.x + Math.cos(th.angle) * T.COIN_THROW, 30, 1250);
      const cy = clamp(th.y + Math.sin(th.angle) * T.COIN_THROW, 80, 700);
      state.coinFx = { x: cx, y: cy, t: 1.2 };
      for (const g of state.guards) {
        if (dist(g.x, g.y, cx, cy) < T.HEAR_COIN) alertGuard(g, cx, cy);
      }
      state.events.push('coin');
    } else {
      say(state, 'No coins left', 1.5);
    }
  }
  if (input.emp) {
    if (state.emp > 0) {
      state.emp -= 1;
      state.toolCost += T.EMP_COST;
      state.camerasDark = T.EMP_DARK_SECONDS;
      state.empFlash = 0.5;
      state.events.push('emp');
      say(state, 'EMP burst — cameras dark 10 s (−$500)', 2.5);
    } else {
      say(state, 'EMP spent', 1.5);
    }
  }

  // --- Hold-to-use: terminal and vault wheel -------------------------------
  const nearTerminal = dist(th.x, th.y, bank.terminal.x, bank.terminal.y) < 52;
  const nearWheel = dist(th.x, th.y, bank.vaultWheel.x, bank.vaultWheel.y) < 52;
  if (input.interact && nearTerminal && state.terminalCooldown <= 0) {
    state.terminalProgress += dt / T.TERMINAL_HOLD;
    if (state.terminalProgress >= 1) {
      state.terminalProgress = 0;
      state.camerasDark = T.TERMINAL_DARK_SECONDS;
      state.terminalCooldown = T.TERMINAL_COOLDOWN;
      state.events.push('terminal');
      say(state, 'Cameras dark 25 s — move now', 2.5);
    }
  } else {
    state.terminalProgress = Math.max(0, state.terminalProgress - dt * 2);
  }
  if (input.interact && nearWheel && !state.vaultOpen) {
    state.vaultProgress += dt / T.VAULT_HOLD;
    if (state.vaultProgress >= 1) {
      state.vaultOpen = true;
      state.events.push('vault');
      say(state, 'VAULT CRACKED — take the Star', 3);
    }
  } else {
    state.vaultProgress = Math.max(0, state.vaultProgress - dt * 2);
  }

  if (state.terminalCooldown > 0) state.terminalCooldown -= dt;
  if (state.camerasDark > 0) state.camerasDark -= dt;
  if (state.coinFx) {
    state.coinFx.t -= dt;
    if (state.coinFx.t <= 0) state.coinFx = null;
  }
  if (state.empFlash > 0) state.empFlash -= dt;
  if (state.messageT > 0) {
    state.messageT -= dt;
    if (state.messageT <= 0) state.message = '';
  }

  // --- Guards ---------------------------------------------------------------
  const env = {
    thief: th,
    walls: bank.walls,
    rng: state.rng,
    time: state.elapsed,
    lockdown: state.lockdown > 0,
    lastKnown: state.lastKnown,
  };
  for (const g of state.guards) {
    updateGuard(g, dt, env);
    if (g.chaseKick) {
      g.chaseKick = false;
      state.alarm = Math.min(100, state.alarm + T.ALARM_CHASE_KICK);
      state.events.push('chase');
      say(state, `SPOTTED — ${g.name} is coming for you`, 2);
    }
  }

  // Caught only by a chasing guard's touch: a patrol bump is not a bust.
  for (const g of state.guards) {
    if (g.state === 'chase' && dist(g.x, g.y, th.x, th.y) < T.CATCH_DIST) {
      state.mode = 'busted';
      state.caughtBy = g.name;
      state.events.push('caught');
      return;
    }
  }

  // --- Cameras --------------------------------------------------------------
  let cameraAlarm = 0;
  for (const cam of state.cameras) {
    updateCamera(cam, state.elapsed, dt, th, bank.walls, state.camerasDark);
    cameraAlarm += cam.sees * T.ALARM_CAMERA_RATE * dt;
  }

  // --- The one alarm meter --------------------------------------------------
  let guardAlarm = 0;
  let anyoneSees = false;
  for (const g of state.guards) {
    guardAlarm += g.sees * T.ALARM_GUARD_RATE * dt;
    if (g.sees > 0) anyoneSees = true;
  }
  for (const cam of state.cameras) {
    if (cam.sees > 0) anyoneSees = true;
  }
  state.seenNow = anyoneSees;
  state.alarm += guardAlarm + cameraAlarm;
  if (!anyoneSees) {
    state.alarm -= (th.inShadow ? T.ALARM_DECAY_SHADOW : T.ALARM_DECAY) * dt;
  }
  state.alarm = clamp(state.alarm, 0, 100);

  // --- Lockdown --------------------------------------------------------------
  if (state.lockdown > 0) {
    state.lockdown -= dt;
    state.alarm = Math.max(T.LOCKDOWN_END_ALARM, state.alarm - 3.25 * dt);
    if (anyoneSees) {
      state.lockdownUnseen = 0;
    } else {
      state.lockdownUnseen += dt;
      if (state.lockdownUnseen >= T.LOCKDOWN_GIVE_UP) {
        endLockdown(state);
        say(state, 'Lockdown lifted — they lost you', 2.5);
      }
    }
    if (state.lockdown <= 0) endLockdown(state);
  } else if (state.alarm >= 100) {
    state.lockdown = T.LOCKDOWN_SECONDS;
    state.lockdownUnseen = 0;
    state.alarms += 1;
    state.lastKnown = { x: th.x, y: th.y };
    for (const g of state.guards) {
      if (g.state !== 'chase') {
        g.state = 'chase';
        g.loseT = 0;
      }
    }
    state.events.push('lockdown');
    say(state, 'LOCKDOWN — every guard is hunting you', 3);
  }

  // --- Getaway ----------------------------------------------------------------
  if (state.starTaken
    && th.x > bank.vanZone.x && th.x < bank.vanZone.x + bank.vanZone.w
    && th.y > bank.vanZone.y && th.y < bank.vanZone.y + bank.vanZone.h) {
    const tally = scoreBreakdown(state);
    state.score = tally.total;
    state.grade = tally.grade;
    state.mode = 'getaway';
    state.events.push('win');
  }
}

function endLockdown(state) {
  state.lockdown = 0;
  state.lockdownUnseen = 0;
  state.alarm = T.LOCKDOWN_END_ALARM;
  for (const g of state.guards) {
    if (g.state === 'chase') {
      g.state = 'investigate';
      g.target = { ...state.lastKnown };
      g.lookT = 0;
      g.huntT = 0;
    }
  }
}
