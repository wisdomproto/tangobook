// Clean UI tap synthesizer — replaces the near-silent original tap.mp3
// (boosting it +58dB amplified noise; synthesis gives a clean CC0 sound).
// Soft woodblock "뽁": short pitch-drop sine burst, fast decay, ~70ms.
//
// Run from repo root: `node scripts/synthesize-ui-tap.mjs`

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const candidates = [
  resolve(
    REPO_ROOT,
    'node_modules/.pnpm/ffmpeg-static@5.3.0/node_modules/ffmpeg-static/ffmpeg.exe'
  ),
  resolve(
    REPO_ROOT,
    'node_modules/.pnpm/@remotion+compositor-win32-x64-msvc@4.0.440/node_modules/@remotion/compositor-win32-x64-msvc/ffmpeg.exe'
  ),
];
const ffmpegPath = candidates.find((p) => existsSync(p));
if (!ffmpegPath) throw new Error('ffmpeg not found');

const OUT = resolve(REPO_ROOT, 'packages/client/public/sounds/ui/tap.mp3');
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

// tap — 70ms soft "뽁": 950→700Hz pitch drop, 2ms attack, exponential decay.
const DUR = 0.07;
const N = Math.floor(SR * DUR);
const out = new Float32Array(N);
for (let i = 0; i < N; i++) {
  const t = i / SR;
  const rel = t / DUR;
  // pitch drop for the "pop" feel
  const f = 950 - 250 * rel;
  // phase integral of linear chirp: 2π(950t − 125t²/DUR·t) — approximate with cumulative form
  const phase = 2 * Math.PI * (950 * t - (125 * t * t) / DUR);
  // envelope: 2ms attack, cubic decay
  const attackS = 0.002;
  const envV = t < attackS ? t / attackS : Math.pow(1 - (t - attackS) / (DUR - attackS), 3);
  // fundamental + soft 2nd harmonic for a woody body
  const sVal = 0.9 * Math.sin(phase) + 0.1 * Math.sin(2 * phase);
  out[i] = 0.28 * envV * sVal; // ≈ -11dB peak — 은은하지만 들림
}

const wavPath = resolve(TMP_DIR, 'ui-tap.wav');
writeFileSync(wavPath, makeWav(out));

const res = spawnSync(
  ffmpegPath,
  ['-y', '-i', wavPath, '-c:a', 'libmp3lame', '-q:a', 4, OUT],
  { stdio: 'inherit' }
);
if (res.status !== 0) throw new Error('ffmpeg encode failed');
console.log('✓ tap.mp3 synthesized →', OUT);
