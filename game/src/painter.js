// GOLDHOUR — painter.js
// Everything the eye sees: the blueprint-noir bank, the cones, the HUD and
// the title / busted / getaway screens. Canvas 2D only, no images, no fonts
// from the network. Safe cover is dark blue, danger is amber, cameras are
// cyan, loot is gold, the thief is teal: readable at a glance.

import { T } from './tuning.js';
import { scoreBreakdown } from './engine.js';

const INK = '#0d1526';
const FLOOR_A = '#101c33';
const FLOOR_B = '#0e1830';
const WALL_FILL = '#1a2a49';
const WALL_EDGE = '#8fa8d8';
const GOLD = '#f5c542';
const AMBER = '#f5a623';
const ORANGE = '#ff7a3c';
const RED = '#ff3b4e';
const CYAN = '#35d0d0';
const TEAL = '#2fd4c4';
const PALE = '#dfe8ff';

function fmtMoney(n) {
  return '$' + n.toLocaleString('en-US');
}

function fmtTime(seconds) {
  const s = Math.floor(seconds);
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

function conePath(ctx, x, y, angle, range, half) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
}

function fillCone(ctx, x, y, angle, range, half, rgb, alpha) {
  const g = ctx.createRadialGradient(x, y, 10, x, y, range);
  g.addColorStop(0, `rgba(${rgb},${alpha})`);
  g.addColorStop(0.7, `rgba(${rgb},${alpha * 0.55})`);
  g.addColorStop(1, `rgba(${rgb},0)`);
  conePath(ctx, x, y, angle, range, half);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.strokeStyle = `rgba(${rgb},${Math.min(0.5, alpha + 0.15)})`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawFloor(ctx, state) {
  const { bank } = state;
  ctx.fillStyle = INK;
  ctx.fillRect(0, T.HUD_H, T.W, T.H - T.HUD_H);
  // Marble diamond grid.
  ctx.strokeStyle = 'rgba(70,100,160,0.16)';
  ctx.lineWidth = 1;
  const step = 44;
  for (let x = -T.H; x < T.W + T.H; x += step) {
    ctx.beginPath(); ctx.moveTo(x, T.HUD_H); ctx.lineTo(x + (T.H - T.HUD_H), T.H); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x, T.H); ctx.lineTo(x + (T.H - T.HUD_H), T.HUD_H); ctx.stroke();
  }
  // Room tints. Names are stencilled in a late pass (drawRoomNames) so the
  // cones and shadow pools cannot wash them out.
  for (const room of bank.rooms) {
    ctx.fillStyle = room.name === 'THE VAULT' ? 'rgba(245,197,66,0.05)' : 'rgba(120,160,230,0.03)';
    ctx.fillRect(room.x, room.y, room.w, room.h);
  }
  // Red carpet runner to the vault.
  ctx.fillStyle = 'rgba(122,31,43,0.85)';
  for (const c of bank.carpet) ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = 'rgba(220,170,90,0.5)';
  ctx.lineWidth = 1;
  for (const c of bank.carpet) ctx.strokeRect(c.x, c.y, c.w, c.h);
}

function drawStreet(ctx, state) {
  const { bank } = state;
  // Asphalt strip below the bank, the getaway van parked in it.
  ctx.fillStyle = '#161a22';
  ctx.fillRect(0, 654, T.W, 66);
  ctx.fillStyle = '#232936';
  ctx.fillRect(0, 654, T.W, 4);
  ctx.strokeStyle = 'rgba(240,200,90,0.55)';
  ctx.lineWidth = 2;
  ctx.setLineDash([18, 14]);
  ctx.beginPath(); ctx.moveTo(0, 688); ctx.lineTo(T.W, 688); ctx.stroke();
  ctx.setLineDash([]);
  const v = bank.van;
  ctx.fillStyle = '#e8ecf4';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.fillStyle = '#2fd4c4';
  ctx.fillRect(v.x, v.y, 18, v.h);
  ctx.fillStyle = '#161a22';
  ctx.fillRect(v.x + 62, v.y + 6, 20, 14);
  ctx.fillStyle = '#161a22';
  ctx.font = '700 11px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('GETAWAY', v.x + v.w / 2 - 4, v.y + v.h - 10);
  ctx.fillStyle = '#000';
  ctx.beginPath(); ctx.arc(v.x + 20, v.y + v.h, 7, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(v.x + v.w - 20, v.y + v.h, 7, 0, Math.PI * 2); ctx.fill();
}

function drawShadows(ctx, state) {
  for (const s of state.bank.shadows) {
    ctx.fillStyle = 'rgba(3,7,16,0.55)';
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.rx, s.ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(90,120,190,0.25)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawDecor(ctx, state) {
  for (const d of state.bank.decor) {
    if (d.kind === 'rug') {
      ctx.fillStyle = 'rgba(90,40,60,0.5)';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = 'rgba(220,170,90,0.4)';
      ctx.strokeRect(d.x + 4, d.y + 4, d.w - 8, d.h - 8);
    } else if (d.kind === 'bench') {
      ctx.fillStyle = '#3a2c1c';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = '#6b4f2a';
      ctx.fillRect(d.x, d.y, d.w, 4);
    } else if (d.kind === 'desk') {
      ctx.fillStyle = '#2a2118';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = 'rgba(200,170,120,0.5)';
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    } else if (d.kind === 'plant') {
      ctx.fillStyle = '#1d4d2b';
      ctx.beginPath(); ctx.arc(d.x + 10, d.y + 10, 11, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2f7a44';
      ctx.beginPath(); ctx.arc(d.x + 10, d.y + 10, 6, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'crate') {
      ctx.fillStyle = '#4a3a22';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.strokeStyle = 'rgba(220,190,130,0.6)';
      ctx.beginPath();
      ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + d.w, d.y + d.h);
      ctx.moveTo(d.x + d.w, d.y); ctx.lineTo(d.x, d.y + d.h);
      ctx.stroke();
    } else if (d.kind === 'painting') {
      ctx.fillStyle = '#7a5c1e';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.fillStyle = '#c98a2e';
      ctx.fillRect(d.x + 5, d.y + 5, d.w - 10, d.h - 10);
      ctx.fillStyle = '#3d6a8a';
      ctx.beginPath(); ctx.arc(d.x + d.w / 2, d.y + d.h / 2, 9, 0, Math.PI * 2); ctx.fill();
    } else if (d.kind === 'monitors') {
      ctx.fillStyle = '#0a0f1c';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = i % 2 ? '#123a4a' : '#1a2f4a';
        ctx.fillRect(d.x + 4 + i * 32, d.y + 4, 26, 18);
      }
    }
  }
}

function drawVents(ctx, state) {
  for (const v of state.bank.vents) {
    ctx.fillStyle = '#0a0f1c';
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = 'rgba(160,180,220,0.7)';
    ctx.lineWidth = 1;
    if (v.vertical) {
      for (let y = v.y + 5; y < v.y + v.h; y += 8) {
        ctx.beginPath(); ctx.moveTo(v.x + 2, y); ctx.lineTo(v.x + v.w - 2, y); ctx.stroke();
      }
    } else {
      for (let x = v.x + 5; x < v.x + v.w; x += 8) {
        ctx.beginPath(); ctx.moveTo(x, v.y + 2); ctx.lineTo(x, v.y + v.h - 2); ctx.stroke();
      }
    }
  }
}

function drawWalls(ctx, state) {
  for (const w of state.bank.walls) {
    ctx.fillStyle = WALL_FILL;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = WALL_EDGE;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(w.x + 0.75, w.y + 0.75, w.w - 1.5, w.h - 1.5);
  }
  // Brass thresholds at the door gaps.
  ctx.fillStyle = 'rgba(220,180,90,0.8)';
  const doors = [
    { x: 424, y: 150, w: 12, h: 60 }, { x: 424, y: 490, w: 12, h: 60 },
    { x: 844, y: 150, w: 12, h: 60 }, { x: 844, y: 490, w: 12, h: 60 },
    { x: 180, y: 374, w: 60, h: 12 }, { x: 1000, y: 374, w: 60, h: 12 },
    { x: 600, y: 640, w: 80, h: 14 },
  ];
  for (const d of doors) ctx.fillRect(d.x, d.y, d.w, d.h);
}

function drawLoot(ctx, state) {
  for (const piece of state.loot) {
    if (piece.taken) continue;
    if (piece.vault && !state.vaultOpen) continue;
    const pulse = 1 + Math.sin(state.elapsed * 3 + piece.x) * 0.08;
    ctx.save();
    ctx.translate(piece.x, piece.y);
    ctx.rotate(Math.PI / 4);
    const s = (piece.kind === 'star' ? 13 : 9) * pulse;
    ctx.fillStyle = piece.kind === 'star' ? '#fff3b0' : GOLD;
    ctx.fillRect(-s / 2, -s / 2, s, s);
    ctx.strokeStyle = piece.kind === 'star' ? '#ffffff' : '#8a6d1f';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-s / 2, -s / 2, s, s);
    ctx.restore();
    ctx.fillStyle = 'rgba(245,197,66,0.9)';
    ctx.font = '600 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(fmtMoney(piece.value), piece.x, piece.y + 12);
  }
  // The Star's pedestal waits in the vault even before the crack.
  if (!state.vaultOpen) {
    const p = state.bank.loot.find((l) => l.id === 'star');
    ctx.strokeStyle = 'rgba(245,197,66,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(p.x, p.y, 16, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = 'rgba(245,197,66,0.75)';
    ctx.font = '600 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('THE HALCYON STAR', p.x, p.y + 22);
  }
}

function drawVaultAndTerminal(ctx, state) {
  const { bank } = state;
  // Vault wheel on the east wall.
  const w = bank.vaultWheel;
  ctx.fillStyle = '#241a08';
  ctx.beginPath(); ctx.arc(w.x, w.y, T.VAULT_WHEEL_R + 6, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = state.vaultOpen ? '#7dff9a' : GOLD;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(w.x, w.y, T.VAULT_WHEEL_R, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = GOLD;
  ctx.lineWidth = 3;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + (state.vaultOpen ? 0.4 : 0);
    ctx.beginPath();
    ctx.moveTo(w.x, w.y);
    ctx.lineTo(w.x + Math.cos(a) * T.VAULT_WHEEL_R, w.y + Math.sin(a) * T.VAULT_WHEEL_R);
    ctx.stroke();
  }
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(w.x, w.y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(245,197,66,0.9)';
  ctx.font = '700 12px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.vaultOpen ? 'VAULT OPEN' : 'VAULT', w.x - 14, w.y - T.VAULT_WHEEL_R - 14);
  if (state.vaultProgress > 0 && !state.vaultOpen) {
    drawHoldRing(ctx, w.x, w.y - T.VAULT_WHEEL_R - 26, state.vaultProgress);
  }
  // Security terminal on the north wall of the Security room.
  const t = bank.terminal;
  ctx.fillStyle = state.camerasDark > 0 ? '#0f2a22' : '#123a4a';
  ctx.fillRect(t.x - 14, t.y - 8, 28, 16);
  ctx.strokeStyle = CYAN;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(t.x - 14, t.y - 8, 28, 16);
  ctx.fillStyle = CYAN;
  ctx.font = '700 9px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(state.camerasDark > 0 ? 'DARK' : 'CAM', t.x, t.y + 3);
  if (state.terminalProgress > 0) {
    drawHoldRing(ctx, t.x, t.y + 24, state.terminalProgress);
  }
}

function drawHoldRing(ctx, x, y, progress) {
  ctx.strokeStyle = 'rgba(223,232,255,0.35)';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = TEAL;
  ctx.beginPath(); ctx.arc(x, y, 12, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2); ctx.stroke();
}

function drawRoomNames(ctx, state) {
  // After shadows and decor, before cones: the dark pill keeps the name
  // readable, and a cone passing over it only tints it.
  ctx.font = '600 15px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const room of state.bank.rooms) {
    const label = room.name.split('').join(' ');
    const w = ctx.measureText(label).width;
    ctx.fillStyle = 'rgba(4,8,18,0.45)';
    ctx.fillRect(room.cx - w / 2 - 8, room.cy - 12, w + 16, 24);
    ctx.fillStyle = 'rgba(190,208,245,0.6)';
    ctx.fillText(label, room.cx, room.cy);
  }
}

function drawCameras(ctx, state) {
  for (const cam of state.cameras) {
    const dark = state.camerasDark > 0;
    const rgb = dark ? '90,110,140' : '53,208,208';
    fillCone(ctx, cam.x, cam.y, cam.angle, T.CAM_RANGE, T.CAM_HALF_ANGLE, rgb, dark ? 0.05 : 0.30);
    // Camera body.
    ctx.fillStyle = dark ? '#2a3548' : '#0e2a33';
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = dark ? '#5a6a80' : CYAN;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = dark ? '#5a6a80' : CYAN;
    ctx.beginPath(); ctx.arc(cam.x, cam.y, 2.5, 0, Math.PI * 2); ctx.fill();
    // Label, measured and clamped so it can never run off the frame,
    // on a dark pill so it reads over cones and walls alike.
    const text = `${cam.id} · ${cam.name.toUpperCase()}${dark ? ' ✕ DARK' : ''}`;
    ctx.font = '700 11px "Courier New", monospace';
    const tw = ctx.measureText(text).width;
    let lx = Math.max(8, Math.min(T.W - tw - 8, cam.x + 14));
    const ly = Math.max(T.HUD_H + 12, cam.y - 16);
    ctx.fillStyle = 'rgba(4,8,18,0.7)';
    ctx.fillRect(lx - 4, ly - 9, tw + 8, 18);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = dark ? 'rgba(120,140,165,0.95)' : 'rgba(53,208,208,0.95)';
    ctx.fillText(text, lx, ly);
    if (cam.sees > 0) {
      ctx.fillStyle = RED;
      ctx.beginPath(); ctx.arc(cam.x, cam.y - 14, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function drawGuards(ctx, state) {
  for (const g of state.guards) {
    const chasing = g.state === 'chase';
    const suspicious = g.state === 'suspicious' || g.state === 'investigate';
    const rgb = chasing ? '255,59,78' : suspicious ? '255,122,60' : '245,166,35';
    const alpha = chasing ? 0.42 : suspicious ? 0.36 : 0.28;
    fillCone(ctx, g.x, g.y, g.angle, T.SEE_RANGE, T.SEE_HALF_ANGLE, rgb, alpha);
    // Pale ring + body, brighter than the floor so the guard reads at a glance.
    ctx.fillStyle = 'rgba(223,232,255,0.25)';
    ctx.beginPath(); ctx.arc(g.x, g.y, T.GUARD_R + 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = g.color;
    ctx.beginPath(); ctx.arc(g.x, g.y, T.GUARD_R, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#0a0f1c';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Flashlight dot ahead of the guard.
    ctx.fillStyle = '#fff3b0';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.angle) * (T.GUARD_R + 2), g.y + Math.sin(g.angle) * (T.GUARD_R + 2), 3, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion arc above the head.
    if (g.suspicion > 2) {
      const frac = g.suspicion / 100;
      ctx.strokeStyle = chasing ? RED : frac > 0.55 ? ORANGE : AMBER;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.arc(g.x, g.y, T.GUARD_R + 11, -Math.PI / 2, -Math.PI / 2 + frac * Math.PI * 2);
      ctx.stroke();
    }
    // "?" while suspicious, "!" while chasing.
    if (chasing || g.state === 'suspicious') {
      ctx.fillStyle = chasing ? RED : AMBER;
      ctx.font = '700 20px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(chasing ? '!' : '?', g.x, g.y - T.GUARD_R - 14);
    }
    // Name tag.
    ctx.fillStyle = 'rgba(223,232,255,0.85)';
    ctx.font = '600 10px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText(g.name.toUpperCase(), g.x, g.y + T.GUARD_R + 4);
  }
}

function drawThief(ctx, state) {
  const th = state.thief;
  if (th.inShadow) {
    ctx.strokeStyle = 'rgba(120,160,230,0.5)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.arc(th.x, th.y, T.THIEF_R + 6, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.fillStyle = 'rgba(47,212,196,0.25)';
  ctx.beginPath(); ctx.arc(th.x, th.y, T.THIEF_R + 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = TEAL;
  ctx.beginPath(); ctx.arc(th.x, th.y, T.THIEF_R, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#06231f';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Direction tick.
  ctx.strokeStyle = '#06231f';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(th.x, th.y);
  ctx.lineTo(th.x + Math.cos(th.angle) * (T.THIEF_R + 4), th.y + Math.sin(th.angle) * (T.THIEF_R + 4));
  ctx.stroke();
  ctx.fillStyle = 'rgba(223,232,255,0.9)';
  ctx.font = '700 10px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  // No name tag on the end screens: on the getaway frame it would sit on
  // the van's own GETAWAY lettering.
  if (state.mode === 'playing' || state.mode === 'paused' || state.mode === 'title') {
    ctx.fillText(th.sneaking ? 'WREN · SNEAKING' : 'WREN', th.x, th.y + T.THIEF_R + 4);
  }
}

function drawCoinFx(ctx, state) {
  if (!state.coinFx) return;
  const c = state.coinFx;
  ctx.fillStyle = GOLD;
  ctx.beginPath(); ctx.arc(c.x, c.y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = `rgba(245,197,66,${Math.max(0, c.t)})`;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(c.x, c.y, (1.2 - c.t) * 60 + 8, 0, Math.PI * 2); ctx.stroke();
}

function alarmStatus(state) {
  if (state.lockdown > 0) return { word: 'LOCKDOWN', color: RED };
  if (state.guards.some((g) => g.sees > 0)) return { word: 'SPOTTED', color: RED };
  if (state.cameras.some((c) => c.sees > 0)) return { word: 'ON CAMERA', color: ORANGE };
  if (state.alarm > 55) return { word: 'HOT', color: ORANGE };
  if (state.alarm > 20) return { word: 'WARM', color: AMBER };
  return { word: 'CALM', color: '#7dff9a' };
}

function drawHud(ctx, state) {
  ctx.fillStyle = '#070d1a';
  ctx.fillRect(0, 0, T.W, T.HUD_H);
  ctx.strokeStyle = 'rgba(143,168,216,0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, T.HUD_H - 0.5); ctx.lineTo(T.W, T.HUD_H - 0.5); ctx.stroke();

  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.fillStyle = PALE;
  ctx.font = '700 16px "Courier New", monospace';
  ctx.fillText('GOLDHOUR', 16, 18);
  ctx.fillStyle = 'rgba(180,200,240,0.75)';
  ctx.font = '11px "Courier New", monospace';
  ctx.fillText('HALCYON NATIONAL BANK — ONE NIGHT, ONE VAULT', 16, 40);

  // Alarm meter: ten segments, centre.
  const st = alarmStatus(state);
  const mx = 470;
  const my = 28;
  ctx.fillStyle = 'rgba(180,200,240,0.8)';
  ctx.font = '700 12px "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.fillText('ALARM', mx, my - 12);
  for (let i = 0; i < 10; i++) {
    const filled = state.alarm > i * 10;
    ctx.fillStyle = filled ? st.color : 'rgba(120,140,180,0.25)';
    ctx.fillRect(mx + 62 + i * 17, my - 20, 14, 16);
  }
  ctx.fillStyle = st.color;
  ctx.font = '700 14px "Courier New", monospace';
  ctx.fillText(`${Math.floor(state.alarm)}% ${st.word}`, mx + 62 + 10 * 17 + 8, my - 11);

  // Right cluster: loot, time, tools.
  ctx.textAlign = 'right';
  ctx.fillStyle = GOLD;
  ctx.font = '700 15px "Courier New", monospace';
  ctx.fillText(`${fmtMoney(state.lootValue)} / ${fmtMoney(state.bank.lootTotal)}`, T.W - 16, 18);
  ctx.fillStyle = PALE;
  ctx.font = '12px "Courier New", monospace';
  if (state.starTaken) {
    ctx.fillStyle = '#fff3b0';
    ctx.font = '700 12px "Courier New", monospace';
    ctx.fillText('★ STAR SECURED — GET TO THE VAN', T.W - 16, 40);
  } else {
    const tools = `◉ ${state.coins} coins   ⚡ ${state.emp} EMP   ${fmtTime(state.elapsed)}`;
    ctx.fillText(tools, T.W - 16, 40);
  }
}

function drawBanner(ctx, state) {
  if (!state.message) return;
  // Left-aligned, clear of the centre: the old centred banner sat on top
  // of CAM 2's label and the security terminal in the cover frame.
  ctx.font = '700 17px "Courier New", monospace';
  const w = ctx.measureText(state.message).width + 36;
  const x = 16;
  const y = T.HUD_H + 10;
  ctx.fillStyle = 'rgba(7,13,26,0.88)';
  ctx.fillRect(x, y, w, 30);
  ctx.strokeStyle = state.lockdown > 0 ? RED : 'rgba(143,168,216,0.7)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, 30);
  ctx.fillStyle = state.lockdown > 0 ? RED : PALE;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(state.message, x + 18, y + 15);
}

function drawPrompt(ctx, state) {
  if (state.mode !== 'playing') return;
  const { bank, thief } = state;
  let text = null;
  let px = 0;
  let py = 0;
  if (Math.hypot(thief.x - bank.terminal.x, thief.y - bank.terminal.y) < 52) {
    text = state.terminalCooldown > 0
      ? `TERMINAL RECHARGING ${Math.ceil(state.terminalCooldown)}s`
      : 'HOLD E — KILL CAMERAS 25s';
    px = bank.terminal.x;
    py = bank.terminal.y + 40;
  } else if (Math.hypot(thief.x - bank.vaultWheel.x, thief.y - bank.vaultWheel.y) < 52) {
    text = state.vaultOpen ? 'VAULT OPEN — TAKE THE STAR' : 'HOLD E — CRACK THE VAULT (3s)';
    px = bank.vaultWheel.x - 40;
    py = bank.vaultWheel.y + 44;
  }
  if (!text) return;
  ctx.font = '700 13px "Courier New", monospace';
  ctx.fillStyle = 'rgba(7,13,26,0.85)';
  const w = ctx.measureText(text).width + 20;
  ctx.fillRect(px - w / 2, py - 11, w, 22);
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 1;
  ctx.strokeRect(px - w / 2, py - 11, w, 22);
  ctx.fillStyle = TEAL;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, px, py);
}

function overlay(ctx, rgba) {
  ctx.fillStyle = rgba;
  ctx.fillRect(0, 0, T.W, T.H);
}

function drawTitle(ctx, state) {
  overlay(ctx, 'rgba(4,8,18,0.72)');
  ctx.textAlign = 'center';
  ctx.fillStyle = GOLD;
  ctx.font = '700 64px "Courier New", monospace';
  ctx.fillText('GOLDHOUR', T.W / 2, 210);
  ctx.fillStyle = PALE;
  ctx.font = '600 20px "Courier New", monospace';
  ctx.fillText('THE HALCYON HEIST', T.W / 2, 252);
  ctx.fillStyle = 'rgba(180,200,240,0.85)';
  ctx.font = '15px "Courier New", monospace';
  ctx.fillText('One night. Twelve prizes. One very good vault.', T.W / 2, 292);
  ctx.fillText('Crack the vault, take the Halcyon Star ($10,000), reach the van.', T.W / 2, 318);
  const lines = [
    'WASD / ARROWS — move          SHIFT — sneak (slow, silent, harder to see)',
    'HOLD E — crack vault · kill cameras at the terminal',
    'SPACE — toss a coin (−$250, pulls guards)      F — EMP (−$500, cameras dark 10s)',
    'M — mute      P — pause',
  ];
  ctx.font = '14px "Courier New", monospace';
  lines.forEach((line, i) => ctx.fillText(line, T.W / 2, 372 + i * 26));
  ctx.fillStyle = TEAL;
  ctx.font = '700 20px "Courier New", monospace';
  const blink = Math.floor(state.elapsed * 2) % 2 === 0;
  if (blink) ctx.fillText('— PRESS ENTER TO BEGIN —', T.W / 2, 512);
}

function drawPaused(ctx) {
  overlay(ctx, 'rgba(4,8,18,0.6)');
  ctx.textAlign = 'center';
  ctx.fillStyle = PALE;
  ctx.font = '700 40px "Courier New", monospace';
  ctx.fillText('PAUSED', T.W / 2, T.H / 2 - 10);
  ctx.font = '15px "Courier New", monospace';
  ctx.fillText('P to resume · R to restart the night', T.W / 2, T.H / 2 + 30);
}

function drawBusted(ctx, state) {
  overlay(ctx, 'rgba(40,4,10,0.78)');
  ctx.textAlign = 'center';
  ctx.fillStyle = RED;
  ctx.font = '700 64px "Courier New", monospace';
  ctx.fillText('BUSTED', T.W / 2, 240);
  ctx.fillStyle = PALE;
  ctx.font = '600 22px "Courier New", monospace';
  ctx.fillText(`Caught by ${state.caughtBy || 'a guard'} — the chase always ends the same way.`, T.W / 2, 292);
  ctx.font = '16px "Courier New", monospace';
  ctx.fillStyle = 'rgba(180,200,240,0.85)';
  ctx.fillText(`Loot grabbed ${fmtMoney(state.lootValue)} · survived ${fmtTime(state.elapsed)} · lockdowns ${state.alarms}`, T.W / 2, 340);
  ctx.fillStyle = TEAL;
  ctx.font = '700 20px "Courier New", monospace';
  ctx.fillText('— PRESS R TO RUN IT BACK —', T.W / 2, 410);
}

function drawGetaway(ctx, state) {
  overlay(ctx, 'rgba(4,18,10,0.78)');
  const tally = scoreBreakdown(state);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#7dff9a';
  ctx.font = '700 56px "Courier New", monospace';
  ctx.fillText('CLEAN GETAWAY', T.W / 2, 190);
  ctx.fillStyle = PALE;
  ctx.font = '600 20px "Courier New", monospace';
  ctx.fillText('The Halcyon Star is out the door and the van is already moving.', T.W / 2, 232);
  const rows = [
    ['Loot', fmtMoney(state.lootValue)],
    ['Time bonus', `+${fmtMoney(tally.timeBonus)}`],
    ['Lockdowns', `−${fmtMoney(tally.alarmFines)}`],
    ['Tools', `−${fmtMoney(state.toolCost)}`],
    ['TOTAL', fmtMoney(tally.total)],
  ];
  ctx.font = '16px "Courier New", monospace';
  rows.forEach(([label, value], i) => {
    const y = 292 + i * 32;
    ctx.textAlign = 'right';
    ctx.fillStyle = label === 'TOTAL' ? GOLD : 'rgba(223,232,255,0.9)';
    ctx.font = label === 'TOTAL' ? '700 18px "Courier New", monospace' : '16px "Courier New", monospace';
    ctx.fillText(label, T.W / 2 - 20, y);
    ctx.textAlign = 'left';
    ctx.fillText(value, T.W / 2 + 20, y);
  });
  ctx.fillStyle = GOLD;
  ctx.font = '700 44px "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`GRADE ${tally.grade}`, T.W / 2, 500);
  ctx.fillStyle = TEAL;
  ctx.font = '700 18px "Courier New", monospace';
  ctx.fillText('— PRESS R TO RUN IT BACK —', T.W / 2, 548);
}

export function drawGame(ctx, state) {
  drawFloor(ctx, state);
  drawStreet(ctx, state);
  drawShadows(ctx, state);
  drawDecor(ctx, state);
  drawRoomNames(ctx, state);
  drawVents(ctx, state);
  drawWalls(ctx, state);
  drawLoot(ctx, state);
  drawVaultAndTerminal(ctx, state);
  drawCameras(ctx, state);
  drawGuards(ctx, state);
  drawThief(ctx, state);
  drawCoinFx(ctx, state);
  if (state.empFlash > 0) {
    ctx.fillStyle = `rgba(255,255,255,${state.empFlash * 0.5})`;
    ctx.fillRect(0, T.HUD_H, T.W, T.H - T.HUD_H);
  }
  drawHud(ctx, state);
  drawBanner(ctx, state);
  drawPrompt(ctx, state);
  if (state.mode === 'title') drawTitle(ctx, state);
  if (state.mode === 'paused') drawPaused(ctx);
  if (state.mode === 'busted') drawBusted(ctx, state);
  if (state.mode === 'getaway') drawGetaway(ctx, state);
}
