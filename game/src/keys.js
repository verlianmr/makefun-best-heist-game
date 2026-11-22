// GOLDHOUR — keys.js
// Keyboard and mouse input, reduced to one plain object per frame.
// Edge-triggered actions (coin, EMP, pause) are set for exactly one frame
// by the keydown handler and cleared by boot after the engine consumes them.

export function makeInput() {
  return {
    up: false, down: false, left: false, right: false,
    sneak: false, interact: false,
    coin: false, emp: false, pause: false,
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  ShiftLeft: 'sneak', ShiftRight: 'sneak',
  KeyE: 'interact',
};

export function attachKeyboard(input, hooks) {
  // hooks: { onStart(), onRestart(), onToggleMute() }
  const down = (e) => {
    if (e.repeat) {
      if (KEYMAP[e.code]) e.preventDefault();
      return;
    }
    const mapped = KEYMAP[e.code];
    if (mapped) {
      input[mapped] = true;
      e.preventDefault();
      return;
    }
    if (e.code === 'Space') {
      input.coin = true;
      e.preventDefault();
    } else if (e.code === 'KeyF') {
      input.emp = true;
    } else if (e.code === 'KeyP') {
      input.pause = true;
    } else if (e.code === 'KeyM') {
      hooks.onToggleMute();
    } else if (e.code === 'Enter') {
      hooks.onStart();
    } else if (e.code === 'KeyR') {
      hooks.onRestart();
    }
  };
  const up = (e) => {
    const mapped = KEYMAP[e.code];
    if (mapped) input[mapped] = false;
  };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', () => {
    // Never leave a key stuck down when the window loses focus.
    for (const key of Object.keys(input)) input[key] = false;
  });
}

// Mouse: click the vault wheel or the terminal to walk the thief there is
// out of scope; a click tosses a coin toward the pointer instead.
export function attachMouse(input, canvas, toWorld) {
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 1280;
    const y = ((e.clientY - rect.top) / rect.height) * 720;
    toWorld(x, y);
    input.coin = true;
  });
}
