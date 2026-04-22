// CC0 game SFX synthesizer. Writes short WAV files, then ffmpeg-static encodes to MP3.
// Output: packages/client/public/sounds/game/{correct,incorrect,clear}.mp3
// All sounds are original synthesis (sine + light harmonics) → CC0 by construction.
//
// Run from repo root: `node scripts/synthesize-game-sfx.mjs`
// WAV intermediates are written to `.sfx-tmp/` (gitignored).

import { writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, '..');
const ffmpegPath = resolve(
  REPO_ROOT,
  'node_modules',
  '.pnpm',
  'ffmpeg-static@5.3.0',
  'node_modules',
  'ffmpeg-static',
  'ffmpeg.exe',
);
const OUT_DIR = resolve(REPO_ROOT, 'packages', 'client', 'public', 'sounds', 'game');
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

// Soft attack + exponential decay. Avoids click pops.
function env(t, dur, attackMs = 8, decayShape = 3) {
  const attackS = attackMs / 1000;
  if (t < attackS) return t / attackS;
  const rel = (t - attackS) / (dur - attackS);
  return Math.max(0, Math.pow(1 - rel, decayShape));
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

// Light harmonic richness — fundamental + soft 2nd harmonic
function bell(freq, t) {
  return 0.85 * sine(freq, t) + 0.15 * sine(freq * 2, t);
}

// correct.mp3 — ascending chime C5→E5→G5 (~0.48s)
function synthCorrect() {
  const notes = [
    { f: 523.25, start: 0.0, dur: 0.22 },
    { f: 659.25, start: 0.09, dur: 0.25 },
    { f: 783.99, start: 0.18, dur: 0.3 },
  ];
  const totalS = 0.48;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += bell(n.f, t) * env(t, n.dur, 6, 2.5) * 0.33;
    }
  }
  return makeWav(out);
}

// incorrect.mp3 — gentle two-tone descent G4→D4 (~0.36s)
function synthIncorrect() {
  const notes = [
    { f: 392.0, start: 0.0, dur: 0.15 },
    { f: 293.66, start: 0.12, dur: 0.22 },
  ];
  const totalS = 0.36;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      const wave = 0.9 * sine(n.f, t) + 0.08 * sine(n.f * 3, t);
      out[startIdx + i] += wave * env(t, n.dur, 10, 2.2) * 0.3;
    }
  }
  return makeWav(out);
}

// clear.mp3 — C major arpeggio + high-octave sparkle tail (~0.92s)
function synthClear() {
  const notes = [
    { f: 523.25, start: 0.0, dur: 0.18 },
    { f: 659.25, start: 0.1, dur: 0.18 },
    { f: 783.99, start: 0.2, dur: 0.22 },
    { f: 1046.5, start: 0.3, dur: 0.55 },
  ];
  const sparkles = [
    { f: 1567.98, start: 0.55, dur: 0.1 },
    { f: 2093.0, start: 0.62, dur: 0.1 },
    { f: 2637.02, start: 0.68, dur: 0.14 },
  ];
  const totalS = 0.92;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += bell(n.f, t) * env(t, n.dur, 8, 2.4) * 0.27;
    }
  }
  for (const n of sparkles) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += sine(n.f, t) * env(t, n.dur, 4, 3) * 0.18;
    }
  }
  return makeWav(out);
}

function writeWavAndMp3(name, wavBuf) {
  const wavPath = resolve(TMP_DIR, `${name}.wav`);
  const mp3Path = resolve(OUT_DIR, `${name}.mp3`);
  writeFileSync(wavPath, wavBuf);
  const args = [
    '-y',
    '-i', wavPath,
    '-af', 'loudnorm=I=-16:LRA=7:TP=-1.5',
    '-ac', '1',
    '-ar', '44100',
    '-b:a', '96k',
    mp3Path,
  ];
  const res = spawnSync(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  if (res.status !== 0) {
    console.error(`ffmpeg failed for ${name}:`);
    console.error(res.stderr?.toString());
    process.exit(1);
  }
  console.log(`✓ ${name}.mp3`);
}

console.log('Synthesizing CC0 game SFX...');
writeWavAndMp3('correct', synthCorrect());
writeWavAndMp3('incorrect', synthIncorrect());
writeWavAndMp3('clear', synthClear());
console.log('Done.');
