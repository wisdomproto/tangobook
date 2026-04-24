// CC0 runner SFX synthesizer for Hori Run arcade game.
// Output: packages/client/public/sounds/runner/{jump,land,hurt,gameover}.mp3
//
// Run from repo root: `node scripts/synthesize-runner-sfx.mjs`

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
const OUT_DIR = resolve(REPO_ROOT, 'packages', 'client', 'public', 'sounds', 'runner');
const TMP_DIR = resolve(REPO_ROOT, '.sfx-tmp');
mkdirSync(OUT_DIR, { recursive: true });
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

function env(t, dur, attackMs = 5, decayShape = 3) {
  const attackS = attackMs / 1000;
  if (t < attackS) return t / attackS;
  const rel = (t - attackS) / (dur - attackS);
  return Math.max(0, Math.pow(1 - rel, decayShape));
}

function sine(freq, t) {
  return Math.sin(2 * Math.PI * freq * t);
}

function bell(freq, t) {
  return 0.85 * sine(freq, t) + 0.15 * sine(freq * 2, t);
}

// White noise generator for thud/impact textures
function noise() {
  return Math.random() * 2 - 1;
}

// jump.mp3 — rising boing ~0.18s, 400Hz → 900Hz
function synthJump() {
  const totalS = 0.18;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    // Frequency sweep upward
    const progress = t / totalS;
    const freq = 400 + 500 * Math.pow(progress, 0.5);
    out[i] = bell(freq, t) * env(t, totalS, 4, 2.5) * 0.35;
  }
  return makeWav(out);
}

// land.mp3 — soft thud ~0.1s, 120Hz + tiny noise burst
function synthLand() {
  const totalS = 0.1;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const tone = sine(120, t) * 0.7 + sine(90, t) * 0.3;
    const thud = noise() * 0.15;
    out[i] = (tone + thud) * env(t, totalS, 2, 3.5) * 0.5;
  }
  return makeWav(out);
}

// hurt.mp3 — comic "ouch" ~0.35s, descending dissonant tones with slight noise
function synthHurt() {
  const totalS = 0.35;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  const notes = [
    { f: 523.25, start: 0.0, dur: 0.1 },   // C5
    { f: 440.0, start: 0.07, dur: 0.12 },  // A4
    { f: 329.63, start: 0.15, dur: 0.25 }, // E4
  ];
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += bell(n.f, t) * env(t, n.dur, 5, 2.5) * 0.32;
    }
  }
  // Tiny impact noise burst at start
  const burstN = Math.floor(0.02 * SR);
  for (let i = 0; i < burstN; i++) {
    const t = i / SR;
    out[i] += noise() * env(t, 0.02, 0, 4) * 0.4;
  }
  return makeWav(out);
}

// gameover.mp3 — sad descending chord ~1.0s
function synthGameover() {
  const totalS = 1.0;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  const notes = [
    { f: 392.0, start: 0.0, dur: 0.35 },   // G4
    { f: 329.63, start: 0.25, dur: 0.4 },  // E4
    { f: 261.63, start: 0.5, dur: 0.5 },   // C4
    { f: 196.0, start: 0.7, dur: 0.3 },    // G3 (bass)
  ];
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += bell(n.f, t) * env(t, n.dur, 15, 2.0) * 0.24;
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
  console.log(`OK ${name}.mp3`);
}

// bgm.mp3 — cheerful seamless loop ~8s at 90bpm, C major arpeggio + soft bass
function synthBgm() {
  const bpm = 90;
  const beat = 60 / bpm; // quarter note duration in seconds
  // 8 bars = 32 beats = ~21s, but let's do 4 bars = ~10.7s for a decent loop length
  // Actually let's do 2 phrases x 4 beats = 8 beats per phrase, 2 phrases = 16 beats
  // 16 beats * (60/90) = ~10.67s
  // Pattern: C-E-G-E | F-A-G-E | D-F-A-F | G-B-D-G (resolves back to C)
  const melody = [
    // Phrase 1: bright C → F
    { f: 523.25, beat: 0 },   { f: 659.25, beat: 1 },
    { f: 783.99, beat: 2 },   { f: 659.25, beat: 3 },
    { f: 698.46, beat: 4 },   { f: 880.0, beat: 5 },
    { f: 783.99, beat: 6 },   { f: 659.25, beat: 7 },
    // Phrase 2: gentle D → G then back to C
    { f: 587.33, beat: 8 },   { f: 698.46, beat: 9 },
    { f: 880.0, beat: 10 },   { f: 698.46, beat: 11 },
    { f: 783.99, beat: 12 },  { f: 987.77, beat: 13 },
    { f: 1174.66, beat: 14 }, { f: 783.99, beat: 15 },
  ];
  const bass = [
    { f: 130.81, beat: 0, dur: 2 },  // C3
    { f: 174.61, beat: 2, dur: 2 },  // F3
    { f: 146.83, beat: 4, dur: 2 },  // D3
    { f: 196.0, beat: 6, dur: 2 },   // G3
    { f: 130.81, beat: 8, dur: 2 },  // C3
    { f: 146.83, beat: 10, dur: 2 }, // D3
    { f: 164.81, beat: 12, dur: 2 }, // E3
    { f: 196.0, beat: 14, dur: 2 },  // G3
  ];
  const noteDur = beat * 0.9;
  const totalS = beat * 16;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);

  for (const n of melody) {
    const startIdx = Math.floor(n.beat * beat * SR);
    const noteN = Math.floor(noteDur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += bell(n.f, t) * env(t, noteDur, 20, 2.0) * 0.14;
    }
  }
  for (const n of bass) {
    const bassDur = n.dur * beat * 0.9;
    const startIdx = Math.floor(n.beat * beat * SR);
    const noteN = Math.floor(bassDur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += sine(n.f, t) * env(t, bassDur, 30, 1.5) * 0.12;
    }
  }
  return makeWav(out);
}

// Simon pad tones — 4 distinct musical notes, ~0.35s each
function synthNote(freq) {
  const totalS = 0.35;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    out[i] = bell(freq, t) * env(t, totalS, 10, 2.0) * 0.35;
  }
  return makeWav(out);
}

// coin.mp3 — short bright "ding" ~0.12s, dual tone C6 + E6
function synthCoin() {
  const totalS = 0.12;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const t = i / SR;
    const tone = bell(1046.5, t) * 0.6 + bell(1318.5, t) * 0.4;
    out[i] = tone * env(t, totalS, 2, 4) * 0.35;
  }
  return makeWav(out);
}

// powerup.mp3 — rising arpeggio ~0.4s for pickups
function synthPowerup() {
  const totalS = 0.4;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  const notes = [
    { f: 523.25, start: 0.0, dur: 0.12 },
    { f: 659.25, start: 0.08, dur: 0.14 },
    { f: 783.99, start: 0.16, dur: 0.16 },
    { f: 1046.5, start: 0.24, dur: 0.18 },
  ];
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += bell(n.f, t) * env(t, n.dur, 4, 2.5) * 0.3;
    }
  }
  return makeWav(out);
}

// milestone.mp3 — bold triumphant chord ~0.7s
function synthMilestone() {
  const totalS = 0.7;
  const N = Math.floor(SR * totalS);
  const out = new Float32Array(N);
  const notes = [
    { f: 523.25, start: 0.0, dur: 0.3 },
    { f: 659.25, start: 0.08, dur: 0.32 },
    { f: 783.99, start: 0.16, dur: 0.4 },
    { f: 1046.5, start: 0.3, dur: 0.45 },
    { f: 1318.51, start: 0.45, dur: 0.25 },
  ];
  for (const n of notes) {
    const startIdx = Math.floor(n.start * SR);
    const noteN = Math.floor(n.dur * SR);
    for (let i = 0; i < noteN && startIdx + i < N; i++) {
      const t = i / SR;
      out[startIdx + i] += bell(n.f, t) * env(t, n.dur, 10, 2.2) * 0.23;
    }
  }
  return makeWav(out);
}

console.log('Synthesizing runner SFX...');
writeWavAndMp3('jump', synthJump());
writeWavAndMp3('land', synthLand());
writeWavAndMp3('hurt', synthHurt());
writeWavAndMp3('gameover', synthGameover());
writeWavAndMp3('bgm', synthBgm());
writeWavAndMp3('note-c4', synthNote(261.63));
writeWavAndMp3('note-e4', synthNote(329.63));
writeWavAndMp3('note-g4', synthNote(392.00));
writeWavAndMp3('note-c5', synthNote(523.25));
writeWavAndMp3('coin', synthCoin());
writeWavAndMp3('powerup', synthPowerup());
writeWavAndMp3('milestone', synthMilestone());
console.log('Done.');
