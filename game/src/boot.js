// GOLDHOUR — boot.js
// Wires the game together: canvas, input, sound, the frame loop, and the
// ?scene= staging hook the screenshots use. The loop is the only place
// time advances; the engine owns everything else.

import { T } from './tuning.js';
import { newGame, startRun, updateGame } from './engine.js';
import { drawGame } from './painter.js';
import { attachKeyboard, attachMouse, makeInput } from './keys.js';
import { makeSynth } from './synth.js';
import { applyScene } from './staging.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const state = newGame();
const input = makeInput();
const synth = makeSynth();

// ?scene=cover|title|chase|getaway freezes one posed frame for screenshots.
const scene = new URLSearchParams(window.location.search).get('scene');
if (scene) applyScene(state, scene);

attachKeyboard(input, {
  onStart() {
    if (state.mode === 'title') {
      startRun(state);
      synth.play('terminal');
    }
  },
  onRestart() {
    if (state.mode === 'busted' || state.mode === 'getaway') startRun(state);
  },
  onToggleMute() {
    synth.toggleMute();
  },
});

attachMouse(input, canvas, (x, y) => {
  // A click aims the thief, then tosses the coin that way.
  state.thief.angle = Math.atan2(y - state.thief.y, x - state.thief.x);
});

// Sound for every event the engine queued this frame.
function drainEvents() {
  for (const event of state.events) {
    if (event === 'pickup') synth.play('pickup');
    else if (event === 'coin') synth.play('coin');
    else if (event === 'emp') synth.play('emp');
    else if (event === 'terminal') synth.play('terminal');
    else if (event === 'vault') synth.play('vault');
    else if (event === 'chase') synth.play('chase');
    else if (event === 'lockdown') synth.play('lockdown');
    else if (event === 'caught') synth.play('caught');
    else if (event === 'win') synth.play('win');
  }
  state.events.length = 0;
}

let last = performance.now();
let stepT = 0;

function frame(now) {
  const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
  last = now;
  if (state.mode === 'playing' && !state.frozen) {
    updateGame(state, input, dt);
    drainEvents();
    // Footsteps: audible to the player, and the rhythm the guards hear.
    if (state.thief.moving) {
      stepT -= dt;
      if (stepT <= 0) {
        synth.play('step', state.thief.sneaking);
        stepT = state.thief.sneaking ? 0.55 : 0.38;
      }
    }
  }
  // Edge-triggered keys live for exactly one frame.
  input.coin = false;
  input.emp = false;
  input.pause = false;
  drawGame(ctx, state);
  requestAnimationFrame(frame);
}

// Read-only hook for the local playtest: state, never control.
window.__halcyon = { state, version: 'goldhour-1.0' };

requestAnimationFrame(frame);
