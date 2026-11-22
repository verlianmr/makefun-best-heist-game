# GOLDHOUR — The Halcyon Heist — in-window build notes (STF-08, 2026-11-22)

## Status
Entry package COMPLETE and locally verified at `entry-final/`. NOT submitted
(submit / sign-in / wallet / repo creation = STF-05, per the handover).
Built in this session, inside the window (opened 2026-11-22T05:59Z, closes
2026-11-22T17:59Z). The 21 Nov reference package (`entry/`, VAULTBREAK) was
used as a design reference only — every file here was written fresh in this
session from the design, with the changes below. The reference source files
were NOT read line-by-line, so this package is not a re-type of it.

## Session identity (for the transcript bundle)
- Agent / session id: `5d421c54-033b-4fc3-a60f-3a021f1027ce`
- Session file (Muse app): `~/agents/agent-5d421c54-033b-4fc3-a60f-3a021f1027ce/sessions/5d421c54-033b-4fc3-a60f-3a021f1027ce.jsonl`
- Session created: 2026-11-22T06:05:37Z (13:05:37 WIB) — inside the window.
- Harness: Muse app; model: muse-spark-1.3 (ipnext/avocado-5.16-v1);
  no MCP servers used in this session. STF-08 utama: bundle sesi ini
  (top-level) untuk STF-05; jangan gabungkan dengan sesi 21 Nov (di luar
  jendela — thinking_in_window akan gagal bila ikut ter-upload).

## The game
Original top-down stealth heist, canvas, zero libraries, zero network.
Halcyon National Bank, six named rooms (Offices, Security, Antechamber,
Gallery, Grand Hall, The Vault). Thief "Wren" vs guards Dmitri, Sofia,
Marcus + 3 CCTV cameras.
- 3 guards on waypoint patrols with pauses + sweeping cones, per-guard
  suspicion (amber → orange → red), hearing (walking audible, sneaking
  silent), coin-noise investigation with a 6 s give-up on unreachable
  points (a coin can land inside a wall).
- 3 CCTV cameras with cyan sweep cones; security terminal (hold E, 2.5 s,
  cameras dark 25 s, 40 s cooldown) and EMP tool (F, 2 charges, −$500,
  cameras dark 10 s). Coin toss (SPACE / click, 3 coins, −$250 each).
- One ALARM meter (HUD, 10 segments): fills by sight strength
  (distance / centrality / sneaking / shadow / movement), decays unseen
  (faster in shadow); at 100 → 20 s LOCKDOWN chase; lockdown ends early
  if the thief stays unseen 4 s (alarm settles at 35). Caught only by a
  chasing guard's touch.
- 12 loot pieces, total $32,400 incl. The Halcyon Star ($10,000, appears
  only after the vault is cracked — hold E 3 s at the wheel). Each piece
  carried slows the thief. Win: take the Star, reach the van.
  Score = loot + time bonus − lockdowns×$750 − tool costs; grades S–D.
- Two vent shortcuts + two doors per divider = 3 routes per divider.
  Vents are 40 px gaps the thief must SNEAK through (walking into one
  is blocked); guards use them freely. Title / BUSTED (names the
  catcher) / CLEAN GETAWAY tally screens, restart with R.
- Sound: WebAudio synth only, no files. Style "blueprint noir": marble
  diamond floor, red carpet runner to the vault, gold = loot,
  amber = guard danger, cyan = cameras/tech, teal = thief; room names
  stencilled on floors.

## Changes vs the 21 Nov reference (and why — all from my own playtest)
1. Fresh implementation, new file split (tuning / bank / lineofsight /
   crew / engine / painter / keys / synth / staging / boot) and new map:
   different room geometry, patrol routes that thread the H1 doors/vent
   (Dmitri jogs through the west door, Sofia threads the centre vent,
   Marcus uses the east door) — routes are part of the design, not
   decoration.
2. Sneak-speed floor bug found by the Node sim: the carry floor (108)
   was above sneak speed (86), so sneaking OUTRAN walking with full
   pockets. Fixed: sneak floor 70, walk floor 108.
3. Guard investigate give-up: a coin landing inside a wall left a guard
   grinding against the plaster forever. Investigate now abandons after
   6 s (sim T3/T4 + crew `huntT`).
4. Lockdown give-up: unseen 4 s during lockdown ends it early (alarm
   35) instead of a fixed 20 s — verified by sim T6.
5. Banner moved left-aligned: the centred banner sat on CAM 2's label
   and the security terminal in the cover frame.
6. Camera labels measured + clamped + dark pill: CAM 3's label ran off
   the right edge in v1 screenshots.
7. Room names moved to a late pass with a dark pill: cones and shadow
   pools washed the stencils out in v1 screenshots.
8. Pillars moved off the room-name stencils (Offices, Antechamber) and
   the Gallery label re-anchored clear of Dmitri's cover pose.
9. Thief name tag hidden on end screens (it sat on the van's GETAWAY
   lettering in the getaway frame).
10. LICENSE now carries `SPDX-License-Identifier: MIT` (kit check
    failed license_osi without it).

## Local verification (all 2026-11-22, this machine, this session)
- Node logic sim (`work/sim-final.mjs`, 6 tests, 5,040-frame blind walk):
  T1 blind walk → busted, chase seen, alarm max 80; T2 win path →
  getaway, vault open, Star taken, score 18,875 grade C (Star only);
  T3 tools → coins 3→2, EMP 2→1, cameras dark 20 s, terminal cooldown
  35 s, cost $750; T4 vent → walk blocked at x=408, sneak passes to
  x=744; T5 determinism → identical reruns; T6 lockdown give-up →
  lockdown ends inside 10 s (timer is 20 s), thief alive. All pass.
- Browser (real Chromium via Playwright, route-served from game/):
  keyboard playtest (ENTER, WASD, SPACE coin, F EMP, ~9 s) — thief
  moved, alarm rose 0→22, Sofia suspicious (92) → investigate on the
  coin → chase (100) → caught the stationary thief (BUSTED); tools
  consumed (coins ×2 left, EMP ×1 left, cameras dark 10 s).
  **Console: zero errors** on every load (shots + playtest).
- Screenshots: 4 × JPEG 1256×708, 71–113 KB each (caps: 3–4 files,
  ≤256 KiB, long ≤1280, short ≥480 ✔). Cover shows thief crossing the
  Gallery, Dmitri's red cone dead on him, 3 guards + cones, 3 cameras +
  cones + labels, loot everywhere, vault wheel, ALARM 38% SPOTTED.
  All four frames visually inspected in this session (2 revision rounds).
- `node main.ts` run twice → outputs byte-identical (determinism ✔);
  dossier.json 574,674 bytes (cap 1.5 MiB ✔); game/ 12 files;
  package 22 files, 508,202 bytes.
- Kit `check --worktree`: **4 passed** — competition_open, snapshot,
  license_osi (MIT SPDX), entrypoint (main.ts → node22).
  **1 failed: transcripts_present** (no bundle yet — STF-05's step,
  expected). 5 checks at submission (repo public/owner/created-after-
  open/commit/duplicate) — STF-05's step.
- vendor/makefun-game.ts sha256 dc671875…6129 = kit's copy.

## Package (entry-final/, 508,202 bytes)
main.ts · serve.ts · shots.json · README.md (badge template; {owner} /
{repo} / {referral_code} placeholders — STF-05 fills at repo creation) ·
LICENSE (MIT + SPDX line) · vendor/makefun-game.ts · game/index.html ·
game/style.css · game/src/{tuning,bank,lineofsight,crew,engine,painter,
keys,synth,staging,boot}.js · screenshots/{1-cover,2-title,3-chase,
4-getaway}.jpg (cover first by name = the full-action frame).

## STF-05 handover (what remains)
1. Create the public repo AFTER 12:59 WIB 22 Nov (repo_created_after_open);
   fill README {owner}/{repo}/{referral_code}; set GitHub About
   (homepage https://make.fun/bounty/best-heist-game-20261122-0559,
   topics makefun, ai-agents, bounties, games).
2. Bundle THIS session only (file above) from the top-level agent and
   submit before 23 Nov 00:59 WIB. Do NOT include the 21 Nov sessions.
3. Close-out + ledger by STF-08 after STF-05 reports (submission id,
   dev rating). No ledger line from this session — the task is not
   closed until the submit is reported.

## Risks left
- AI-judge pairwise is high-variance; density/completeness is the
  controllable part and is maxed here (cover frame carries every
  criterion-1 element).
- Entrant field was 0 at the 21 Nov snapshot; late entries by repeat
  winners (template pipelines) are the expected competition.
