// GOLDHOUR — tuning.js
// Every number that decides how the heist feels. One table, so a playtest
// fix is a one-line change here and nowhere else.

export const T = {
  // Canvas and frame.
  W: 1280,
  H: 720,
  HUD_H: 56,

  // The thief.
  THIEF_R: 13,
  WALK_SPEED: 168,
  SNEAK_SPEED: 86,
  // Each loot piece carried costs this much speed (floor at CARRY_MIN).
  CARRY_PENALTY: 6,
  CARRY_MIN: 108,
  // Vent gaps are 40 px wide; the thief must sneak to slip through one.
  VENT_WIDTH: 40,

  // Guards.
  GUARD_R: 14,
  PATROL_SPEED: 62,
  INVESTIGATE_SPEED: 96,
  CHASE_SPEED: 149,
  CATCH_DIST: 27,
  // Vision cone.
  SEE_RANGE: 235,
  SEE_HALF_ANGLE: 0.58, // ~33 degrees
  // How fast a guard's suspicion (0..100) moves.
  SUSPICION_UP: 58,
  SUSPICION_DOWN: 18,
  SUSPICIOUS_AT: 55, // stops and stares, "?"
  CHASE_AT: 100, // runs at the thief, "!"
  // Sight strength multipliers.
  SNEAK_VIS: 0.55,
  SHADOW_VIS: 0.5,
  MOVING_VIS: 1.15,
  EDGE_VIS: 0.35, // thief at the rim of a cone
  // Hearing: walking is audible this far, sneaking is silent.
  HEAR_WALK: 150,
  HEAR_COIN: 175,

  // The one alarm meter (0..100). Guards and cameras feed it; it decays
  // whenever nobody can see the thief.
  ALARM_GUARD_RATE: 26,
  ALARM_CAMERA_RATE: 18,
  ALARM_DECAY: 9,
  ALARM_DECAY_SHADOW: 14,
  ALARM_CHASE_KICK: 30, // instant jump when a guard commits to chase
  LOCKDOWN_SECONDS: 20,
  LOCKDOWN_END_ALARM: 35,
  LOCKDOWN_GIVE_UP: 4, // unseen this long during lockdown ends it early
  CHASE_LOST_SIGHT: 3.5, // chase degrades to investigate after this
  ALARM_FINE: 750, // dollars per lockdown on the final tally

  // Cameras.
  CAM_RANGE: 265,
  CAM_HALF_ANGLE: 0.5,
  CAM_SWEEP_SPEED: 0.55,

  // Tools. Every tool costs money: the score is the judge of the plan.
  COINS: 3,
  COIN_COST: 250,
  COIN_THROW: 95,
  EMP_CHARGES: 2,
  EMP_COST: 500,
  EMP_DARK_SECONDS: 10,
  TERMINAL_HOLD: 2.5,
  TERMINAL_DARK_SECONDS: 25,
  TERMINAL_COOLDOWN: 40,

  // The vault.
  VAULT_HOLD: 3,
  VAULT_WHEEL_R: 30,

  // Scoring.
  TIME_BONUS_RATE: 25, // dollars per second under the par time
  PAR_SECONDS: 360,
  GRADE_S: 34000,
  GRADE_A: 28000,
  GRADE_B: 20000,
  GRADE_C: 12000,
};

// Deterministic RNG (mulberry32) so a screenshot staged twice is the same
// frame, and a Node logic sim replays exactly.
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
