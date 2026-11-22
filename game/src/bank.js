// GOLDHOUR — bank.js
// The Halcyon National Bank: one floor, six named rooms, three routes across
// every divider (two doors + one vent). Walls are rectangles; a door or a
// vent is simply a gap in a divider wall. Vents are 34 px wide and the thief
// must sneak to slip through one — guards walk them freely.

export function buildBank() {
  const walls = [
    // Outer shell. North wall sits under the HUD band (y 56..70).
    { x: 0, y: 56, w: 1280, h: 14 },
    { x: 0, y: 56, w: 14, h: 664 },
    { x: 1266, y: 56, w: 14, h: 664 },
    // South bank wall, with the getaway door gap at x 600..680.
    { x: 0, y: 640, w: 600, h: 14 },
    { x: 680, y: 640, w: 600, h: 14 },

    // Divider V1 (x 424..436): doors y 150..210 and 490..550, vent 318..358.
    { x: 424, y: 70, w: 12, h: 80 },
    { x: 424, y: 210, w: 12, h: 108 },
    { x: 424, y: 358, w: 12, h: 132 },
    { x: 424, y: 550, w: 12, h: 90 },
    // Divider V2 (x 844..856): same gaps.
    { x: 844, y: 70, w: 12, h: 80 },
    { x: 844, y: 210, w: 12, h: 108 },
    { x: 844, y: 358, w: 12, h: 132 },
    { x: 844, y: 550, w: 12, h: 90 },
    // Divider H1 (y 374..386): doors x 180..240 and 1000..1060, vent 598..638.
    { x: 14, y: 374, w: 166, h: 12 },
    { x: 240, y: 374, w: 358, h: 12 },
    { x: 638, y: 374, w: 362, h: 12 },
    { x: 1060, y: 374, w: 206, h: 12 },

    // Pillars: hard cover that blocks movement and line of sight.
    // (The Offices pillar sits clear of its room's name stencil.)
    { x: 210, y: 470, w: 26, h: 26 },
    { x: 630, y: 510, w: 26, h: 26 },
    { x: 140, y: 250, w: 26, h: 26 },
    { x: 950, y: 250, w: 26, h: 26 },
  ];

  // Vent gaps (open space the thief may only crawl through while sneaking).
  const vents = [
    { x: 424, y: 318, w: 12, h: 40, vertical: true },
    { x: 844, y: 318, w: 12, h: 40, vertical: true },
    { x: 598, y: 374, w: 40, h: 12, vertical: false },
  ];

  const rooms = [
    { name: 'OFFICES', x: 14, y: 70, w: 410, h: 304, cx: 219, cy: 222 },
    { name: 'SECURITY', x: 436, y: 70, w: 408, h: 304, cx: 640, cy: 222 },
    { name: 'ANTECHAMBER', x: 856, y: 70, w: 410, h: 304, cx: 1061, cy: 222 },
    { name: 'GALLERY', x: 14, y: 386, w: 410, h: 254, cx: 250, cy: 560 },
    { name: 'GRAND HALL', x: 436, y: 386, w: 408, h: 254, cx: 640, cy: 546 },
    { name: 'THE VAULT', x: 856, y: 386, w: 410, h: 254, cx: 1061, cy: 546 },
  ];

  // Red carpet runner: south door -> Grand Hall -> vent -> Antechamber
  // -> south door of V2 -> the vault wheel.
  const carpet = [
    { x: 611, y: 120, w: 24, h: 520 },
    { x: 635, y: 523, w: 597, h: 24 },
  ];

  const loot = [
    { id: 'painting', name: 'Sunset Meridian', x: 80, y: 480, value: 2400, kind: 'painting' },
    { id: 'mare', name: 'Bronze Mare', x: 370, y: 600, value: 1800, kind: 'statue' },
    { id: 'vase', name: 'Celadon Vase', x: 90, y: 620, value: 900, kind: 'vase' },
    { id: 'cashbox', name: 'Petty Cash', x: 180, y: 110, value: 1200, kind: 'cash' },
    { id: 'laptop', name: 'Ledger Laptop', x: 360, y: 180, value: 800, kind: 'tech' },
    { id: 'wallsafe', name: 'Wall Safe', x: 120, y: 320, value: 3000, kind: 'safe' },
    { id: 'drive', name: 'Server Drive', x: 600, y: 110, value: 1500, kind: 'tech' },
    { id: 'locker', name: 'Evidence Locker', x: 790, y: 320, value: 2000, kind: 'safe' },
    { id: 'ingot', name: 'Gold Ingot', x: 1000, y: 110, value: 4000, kind: 'gold' },
    { id: 'jewels', name: 'Jewel Case', x: 1200, y: 320, value: 3200, kind: 'gold' },
    { id: 'crystal', name: 'Chandelier Crystal', x: 500, y: 520, value: 1600, kind: 'gem' },
    // The Star only appears on its pedestal once the vault is cracked.
    { id: 'star', name: 'The Halcyon Star', x: 1150, y: 546, value: 10000, kind: 'star', vault: true },
  ];

  // Shadow pools: standing in one halves how well a guard or camera sees you.
  const shadows = [
    { x: 200, y: 560, rx: 70, ry: 46 },
    { x: 300, y: 150, rx: 60, ry: 40 },
    { x: 700, y: 220, rx: 60, ry: 40 },
    { x: 560, y: 560, rx: 80, ry: 50 },
    { x: 1100, y: 220, rx: 60, ry: 40 },
    { x: 1000, y: 600, rx: 60, ry: 40 },
  ];

  const cameras = [
    { id: 'CAM 1', name: 'Gallery', x: 60, y: 400, base: 0, sweep: 0.7 },
    { id: 'CAM 2', name: 'Security', x: 640, y: 76, base: Math.PI / 2, sweep: 0.8 },
    { id: 'CAM 3', name: 'Antechamber', x: 1220, y: 90, base: (3 * Math.PI) / 4, sweep: 0.7 },
  ];

  const guards = [
    {
      name: 'Dmitri', color: '#f5a623',
      // His north-south legs jog through the west door of H1 (x 180..240)
      // at x 210: the wall is solid everywhere else along that line.
      waypoints: [[120, 600], [120, 420], [210, 420], [210, 120], [350, 120], [350, 600]],
    },
    {
      name: 'Sofia', color: '#ff7a59',
      // Her north-south leg threads the centre vent (x 600..634) at x 617.
      waypoints: [[617, 600], [617, 120], [760, 120], [760, 600]],
    },
    {
      name: 'Marcus', color: '#e8b4ff',
      // His north-south leg uses the east door of H1 (x 1000..1060) at x 1030.
      waypoints: [[1150, 120], [1030, 120], [1030, 600], [1150, 600]],
    },
  ];

  // Wall-mounted security terminal (hold E to kill the cameras for 25 s).
  const terminal = { x: 700, y: 100 };
  // The vault wheel on the east wall; hold E 3 s to crack it.
  const vaultWheel = { x: 1232, y: 546 };
  // The getaway van, parked in the street outside the south door.
  const van = { x: 596, y: 664, w: 88, h: 40 };
  const vanZone = { x: 590, y: 658, w: 100, h: 52 };
  const spawn = { x: 640, y: 620, angle: -Math.PI / 2 };

  // Non-colliding set dressing.
  const decor = [
    { kind: 'painting', x: 60, y: 420, w: 70, h: 44 },
    { kind: 'painting', x: 330, y: 400, w: 70, h: 44 },
    { kind: 'bench', x: 150, y: 600, w: 90, h: 18 },
    { kind: 'plant', x: 400, y: 390, w: 20, h: 20 },
    { kind: 'desk', x: 150, y: 150, w: 80, h: 36 },
    { kind: 'desk', x: 280, y: 260, w: 80, h: 36 },
    { kind: 'plant', x: 400, y: 80, w: 20, h: 20 },
    { kind: 'monitors', x: 560, y: 76, w: 160, h: 26 },
    { kind: 'desk', x: 760, y: 150, w: 80, h: 36 },
    { kind: 'crate', x: 470, y: 320, w: 30, h: 30 },
    { kind: 'rug', x: 950, y: 480, w: 140, h: 70 },
    { kind: 'bench', x: 1150, y: 120, w: 90, h: 18 },
    { kind: 'rug', x: 480, y: 420, w: 160, h: 80 },
    { kind: 'bench', x: 700, y: 600, w: 90, h: 18 },
    { kind: 'plant', x: 450, y: 620, w: 20, h: 20 },
    { kind: 'rug', x: 900, y: 500, w: 140, h: 80 },
    { kind: 'crate', x: 880, y: 420, w: 30, h: 30 },
    { kind: 'crate', x: 880, y: 460, w: 30, h: 30 },
  ];

  return {
    walls, vents, rooms, carpet, loot, shadows, cameras, guards,
    terminal, vaultWheel, van, vanZone, spawn,
    decor,
    // Interior bounds the thief may occupy (bank + street strip).
    bounds: { x: 14, y: 70, w: 1252, h: 650 },
    lootTotal: loot.reduce((s, l) => s + l.value, 0),
  };
}
