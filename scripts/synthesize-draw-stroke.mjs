// Draw/paint stroke synthesizer — soft brushy "쓱" for coloring/tracing games.
// Short (~80ms), muffled filtered noise + faint low body, low peak (repeats while drawing).
// Placeholder CC0 sound; replace public/sounds/ui/draw.mp3 with a nicer one anytime.
//
// Run from repo root: `node scripts/synthesize-draw-stroke.mjs`

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const candidates = [
  resolve(REPO_ROOT, 'node_modules/.pnpm/ffmpeg-static@5.3.0/node_modules/ffmpeg-static/ffmpeg.exe'),
  resolve(
    REPO_ROOT,
    'node_modules/.pnpm/@remotion+compositor-win32-x64-msvc@4.0.440/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
  ),
];
const ffmpegPath = candidates.find((p) => existsSync(p));
if (!ffmpegPath) throw new Error('ffmpeg not found');

const OUT = resolve(REPO_ROOT, 'packages/client/public/sounds/ui/draw.mp3');
const TMP_DIR = resolve(REPO_ROOT, '.sfx-tmp');
mkdirSync(TMP_DIR, { recursive: true });

const SR = 44100;

function makeWav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

// 80ms soft brush: muffled noise (one-pole low-pass) + faint 180Hz body.
const DUR = 0.08;
const N = Math.floor(SR * DUR);
const out = new Float32Array(N);
let lp = 0;
const a = 0.14; // low-pass coefficient — smaller = more muffled/soft
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const rel = t / DUR;
  // muffled noise (crayon/brush texture)
  const noise = Math.random() * 2 - 1;
  lp = lp + a * (noise - lp);
  // faint low body for warmth
  const body = 0.25 * Math.sin(2 * Math.PI * 180 * t);
  // envelope: 6ms attack, smooth cubic decay
  const attackS = 0.006;
  const envV = t < attackS ? t / attackS : Math.pow(1 - (t - attackS) / (DUR - attackS), 2);
  out[i] = 0.16 * envV * (lp * 1.6 + body); // ~-16dB peak — soft, repeats while drawing
}

const wavPath = resolve(TMP_DIR, 'draw-stroke.wav');
writeFileSync(wavPath, makeWav(out));

const res = spawnSync(ffmpegPath, ['-y', '-i', wavPath, '-c:a', 'libmp3lame', '-q:a', 5, OUT], {
  stdio: 'inherit',
});
if (res.status !== 0) throw new Error('ffmpeg encode failed');
console.log('✓ draw.mp3 synthesized →', OUT);
