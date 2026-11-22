// GOLDHOUR — staging.js
// Posed scenes for the entry's screenshots: the same game, frozen one frame
// into a moment that shows it at its best. Staging only moves pieces the
// engine already owns — no separate render path, so a screenshot is always
// a real render of the game's own code.

import { scoreBreakdown } from './engine.js';

function placeGuard(state, name, x, y, angle, mode, suspicion = 0, sees = 0) {
  const g = state.guards.find((gg) => gg.name === name);
  if (!g) return;
  g.x = x;
  g.y = y;
  g.angle = angle;
  g.state = mode;
  g.suspicion = suspicion;
  g.sees = sees;
  g.pauseT = 0;
}

function placeCamera(state, id, angle, sees = 0) {
  const c = state.cameras.find((cc) => cc.id === id);
  if (!c) return;
  c.angle = angle;
  c.sees = sees;
}

// The cover: the thief crossing the Gallery, Dmitri's cone dead on him at
// 38% alarm with a live SPOTTED moment, all three cameras sweeping, loot
// everywhere, the vault wheel waiting at the east wall.
function cover(state) {
  state.mode = 'playing';
  state.elapsed = 171; // HUD clock 02:51
  state.thief.x = 300;
  state.thief.y = 470;
  state.thief.angle = 0; // heading east, into the Gallery
  state.thief.moving = true;
  state.alarm = 38;
  state.message = 'SPOTTED — Dmitri is coming for you';
  state.messageT = 99;
  // Dmitri (170, 540) has a clear line to the thief: the pillar at
  // (210..236, 470..496) sits above the sight line.
  placeGuard(state, 'Dmitri', 170, 540, Math.atan2(470 - 540, 300 - 170), 'chase', 100, 0.8);
  placeGuard(state, 'Sofia', 700, 500, Math.PI, 'patrol', 12, 0);
  // Marcus stands clear of the ANTECHAMBER stencil in the cover frame.
  placeGuard(state, 'Marcus', 1010, 165, Math.PI / 2, 'patrol', 0, 0);
  placeCamera(state, 'CAM 1', -0.3, 0.35);
  placeCamera(state, 'CAM 2', Math.PI / 2 + 0.4, 0);
  placeCamera(state, 'CAM 3', (3 * Math.PI) / 4 - 0.3, 0);
}

// The title screen over a live bank: guards mid-patrol behind the text.
function title(state) {
  state.mode = 'title';
  placeGuard(state, 'Dmitri', 120, 420, -Math.PI / 2, 'patrol', 0, 0);
  placeGuard(state, 'Sofia', 617, 300, Math.PI / 2, 'patrol', 0, 0);
  placeGuard(state, 'Marcus', 1030, 400, Math.PI / 2, 'patrol', 0, 0);
  placeCamera(state, 'CAM 1', -0.5, 0);
  placeCamera(state, 'CAM 2', Math.PI / 2, 0);
  placeCamera(state, 'CAM 3', (3 * Math.PI) / 4, 0);
}

// Mid-lockdown: the alarm at 100, two guards in full chase, the third
// converging, the thief running for the south door.
function chase(state) {
  state.mode = 'playing';
  state.elapsed = 208;
  state.thief.x = 640;
  state.thief.y = 520;
  state.thief.angle = Math.PI / 2; // running south, for the van
  state.thief.moving = true;
  state.alarm = 100;
  state.lockdown = 12;
  state.alarms = 1;
  state.message = 'LOCKDOWN — every guard is hunting you';
  state.messageT = 99;
  placeGuard(state, 'Dmitri', 560, 470, Math.atan2(520 - 470, 640 - 560), 'chase', 100, 0.9);
  placeGuard(state, 'Sofia', 700, 440, Math.atan2(520 - 440, 640 - 700), 'chase', 100, 0.7);
  placeGuard(state, 'Marcus', 900, 500, Math.atan2(520 - 500, 640 - 900), 'investigate', 60, 0);
  state.guards.find((g) => g.name === 'Marcus').target = { x: 640, y: 520 };
  placeCamera(state, 'CAM 1', 0.2, 0);
  placeCamera(state, 'CAM 2', Math.PI / 2 - 0.5, 0.5);
  placeCamera(state, 'CAM 3', (3 * Math.PI) / 4 + 0.2, 0);
}

// The payoff: every prize taken, the Star secured, the tally on screen.
function getaway(state) {
  for (const piece of state.loot) piece.taken = true;
  state.vaultOpen = true;
  state.starTaken = true;
  state.lootValue = state.bank.lootTotal;
  state.elapsed = 163;
  state.alarms = 1;
  state.toolCost = 1000;
  state.thief.x = 640;
  state.thief.y = 682;
  state.thief.angle = Math.PI / 2;
  const tally = scoreBreakdown(state);
  state.score = tally.total;
  state.grade = tally.grade;
  state.mode = 'getaway';
}

export const SCENES = ['cover', 'title', 'chase', 'getaway'];

export function applyScene(state, name) {
  if (name === 'cover') cover(state);
  else if (name === 'title') title(state);
  else if (name === 'chase') chase(state);
  else if (name === 'getaway') getaway(state);
  else return false;
  state.frozen = true; // render only: the frame must not advance
  return true;
}
