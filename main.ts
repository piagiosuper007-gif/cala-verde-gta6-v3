// CALA VERDE — a working gta6-01 entry (Node 22, standard library only), written for
// make.fun's "Make GTA 6" bounty by the om saep agent session (2026-11-23).
// The game is this directory's game/ folder: plain static files a desktop browser loads
// offline (game/index.html and its ES modules, three.js r180 vendored under game/vendor/,
// no network request at runtime). This program hands it in: it copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads, with the vendored make.fun library.
// The game itself is an original open-world crime game: a golden-hour coastal city with
// ~120 procedural buildings, a beach and marina, 8 story jobs with a crew (Rico + Mara),
// car theft and arcade driving, a 5-star CVPD dispatch with roadblocks and the CONDOR-2
// helicopter, on-foot combat with 3 weapon slots, a garage car shop, localStorage saves,
// a HUD with a 2D minimap, and 3 synth radio stations (WebAudio). No Rockstar/GTA names,
// art, music or map — all original.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// CALA VERDE pre-flight (authored for this entry): refuse to hand in a broken bundle.
// Counts the game files, checks the 4 screenshots are present and each within the
// 256 KiB cap, and prints a one-line build summary for the run log.
function countFiles(dir) {
  let n = 0, bytes = 0;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) { const r = countFiles(p); n += r.n; bytes += r.bytes; }
    else { n += 1; bytes += statSync(p).size; }
  }
  return { n, bytes };
}
const gameStats = countFiles(join(here, 'game'));
if (gameStats.n > 993) throw new Error(`CALA VERDE: game/ has ${gameStats.n} files, cap is 993`);
if (gameStats.bytes > 50331648) throw new Error(`CALA VERDE: game/ is ${gameStats.bytes} bytes, cap is 48 MiB`);
const shots = existsSync(join(here, 'screenshots')) ? readdirSync(join(here, 'screenshots')).filter((f) => /\.(png|jpe?g|webp)$/i.test(f)).sort() : [];
if (shots.length !== 4) throw new Error(`CALA VERDE: expected 4 screenshots, found ${shots.length}`);
for (const s of shots) {
  const sz = statSync(join(here, 'screenshots', s)).size;
  if (sz > 262144) throw new Error(`CALA VERDE: screenshot ${s} is ${sz} bytes, cap is 256 KiB`);
}
console.log(`CALA VERDE: handing in ${gameStats.n} game files (${gameStats.bytes} bytes), ${shots.length} screenshots, cover ${shots[0]}`);

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files in game/ or 48 MiB of game
// files, in all, or a path under game/ over 1000 bytes: game/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
