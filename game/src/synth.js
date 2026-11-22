// GOLDHOUR — synth.js
// All sound is synthesized with WebAudio: no audio files, no network.
// One tiny helper (tone) plus a named sound per game event.

export function makeSynth() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type = 'sine', gain = 0.12, slideTo = null, delay = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(gain, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(g);
    g.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.05);
  }

  function noiseBurst(dur, gain = 0.08, delay = 0) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime + delay;
    const len = Math.floor(ac.sampleRate * dur);
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ac.createBufferSource();
    src.buffer = buf;
    const g = ac.createGain();
    g.gain.value = gain;
    src.connect(g);
    g.connect(ac.destination);
    src.start(t0);
  }

  const sounds = {
    pickup() { tone(880, 0.09, 'sine', 0.1); tone(1318, 0.12, 'sine', 0.08, null, 0.07); },
    coin() { tone(1568, 0.07, 'triangle', 0.1); tone(2093, 0.1, 'triangle', 0.08, null, 0.06); },
    emp() { tone(220, 0.35, 'sawtooth', 0.1, 55); noiseBurst(0.2, 0.06); },
    terminal() { tone(523, 0.08, 'square', 0.06); tone(784, 0.08, 'square', 0.06, null, 0.09); tone(1046, 0.14, 'square', 0.06, null, 0.18); },
    vault() {
      tone(392, 0.07, 'square', 0.07);
      tone(392, 0.07, 'square', 0.07, null, 0.12);
      tone(523, 0.07, 'square', 0.07, null, 0.24);
      tone(784, 0.18, 'square', 0.08, null, 0.36);
    },
    chase() { tone(196, 0.22, 'sawtooth', 0.12, 147); tone(147, 0.22, 'sawtooth', 0.12, 110, 0.2); },
    lockdown() {
      for (let i = 0; i < 3; i++) {
        tone(440, 0.16, 'square', 0.1, null, i * 0.22);
        tone(349, 0.16, 'square', 0.1, null, i * 0.22 + 0.11);
      }
    },
    caught() { tone(220, 0.5, 'sawtooth', 0.14, 55); tone(110, 0.7, 'sawtooth', 0.12, 40, 0.15); },
    win() {
      const notes = [523, 659, 784, 1046, 1318];
      notes.forEach((n, i) => tone(n, 0.22, 'triangle', 0.1, null, i * 0.11));
    },
    step(sneaking) {
      if (sneaking) noiseBurst(0.03, 0.015);
      else noiseBurst(0.04, 0.035);
    },
  };

  return {
    play(name, arg) {
      if (sounds[name]) sounds[name](arg);
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() { return muted; },
  };
}
