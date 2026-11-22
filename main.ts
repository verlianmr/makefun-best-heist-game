// GOLDHOUR — main.ts
// The entrypoint: copies game/ and screenshots/ into the output directory
// and writes /output/dossier.json with buildDossier from the kit's
// vendor/makefun-game.ts. Node 22 standard library only, no network.
// Runs twice in the grader and must write the same bytes both times:
// the dossier is built from file contents alone, so it does.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const root = dirname(fileURLToPath(import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Never remove `out` itself: in the grader it is a Docker bind-mount and
// rmdir on the mount point fails EBUSY. Just ensure it exists.
mkdirSync(out, { recursive: true });
mkdirSync(join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(root, 'game'), join(out, 'game'), { recursive: true });
cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The gate's caps, from the competition's RULES.txt: text 160 KiB,
// at most 4 screenshots of 256 KiB, game/ at most 993 files / 48 MiB,
// paths at most 1000 bytes.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 48 * 1024 * 1024,
  game_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
