// Original TangoBook SFX: deterministic synthesis, no sampled or external audio.
// Run: node scripts/generate-learning-sounds.mjs
import { mkdirSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const dir = fileURLToPath(new URL('../packages/client/public/sounds/learning/', import.meta.url));
mkdirSync(dir, { recursive: true });
const rate = 44100;
const specifications = {
  tap: {
    duration: 0.19,
    notes: [
      [0, 440, 0.17],
      [0.025, 660, 0.1],
    ],
    level: 0.22,
  },
  correct: {
    duration: 0.58,
    notes: [
      [0, 523.25, 0.42],
      [0.11, 659.25, 0.42],
      [0.22, 783.99, 0.32],
    ],
    level: 0.28,
  },
  retry: {
    duration: 0.28,
    notes: [
      [0, 392, 0.23],
      [0.05, 440, 0.18],
    ],
    level: 0.16,
  },
  complete: {
    duration: 1.32,
    notes: [
      [0, 523.25, 0.7],
      [0.16, 659.25, 0.7],
      [0.32, 783.99, 0.8],
      [0.48, 1046.5, 0.82],
    ],
    level: 0.32,
  },
};
for (const [name, { duration, notes, level }] of Object.entries(specifications)) {
  const length = Math.ceil(rate * duration);
  const channels = [new Float64Array(length), new Float64Array(length)];
  let seed = 20261012;
  const noise = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2147483648 - 1;
  };
  let filtered = 0;
  for (let i = 0; i < length; i++) {
    const time = i / rate;
    filtered = 0.88 * filtered + 0.12 * noise();
    // Short breath at the attack, then a rounded wood/marimba tone and quiet stereo echoes.
    const air = filtered * Math.exp(-time * 35) * Math.min(1, time / 0.008) * 0.2;
    for (let side = 0; side < 2; side++) {
      let value = air;
      for (const [index, [start, frequency, tail]] of notes.entries()) {
        for (let echo = 0; echo < 3; echo++) {
          const t = time - start - echo * (side ? 0.079 : 0.061);
          if (t < 0 || t > tail) continue;
          const attack = 1 - Math.exp(-t * 450);
          const release = Math.min(1, (tail - t) / 0.05);
          const env = attack * Math.exp(-t * (name === 'tap' ? 24 : 7)) * release;
          const fundamental = Math.sin(2 * Math.PI * frequency * t);
          const overtone = 0.12 * Math.sin(2 * Math.PI * frequency * 2.003 * t) * Math.exp(-t * 12);
          const warmth = 0.12 * Math.sin(2 * Math.PI * frequency * 0.5 * t);
          const pan = side === index % 2 ? 1 : 0.8;
          value += (fundamental + overtone + warmth) * env * pan * Math.pow(0.1, echo);
        }
      }
      channels[side][i] = value;
    }
  }
  const peak = Math.max(
    ...channels.map((channel) => channel.reduce((max, value) => Math.max(max, Math.abs(value)), 0))
  );
  const pcm = Buffer.alloc(length * 4);
  let squares = 0;
  channels.forEach((channel, side) =>
    channel.forEach((sample, i) => {
      const value = (sample / peak) * level;
      squares += value * value;
      pcm.writeInt16LE(Math.round(value * 32767), i * 4 + side * 2);
    })
  );
  const header = Buffer.alloc(44);
  header.write('RIFF');
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVEfmt ', 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(2, 22);
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 4, 28);
  header.writeUInt16LE(4, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  const destination = `${dir}/${name}.mp3`;
  const encoded = spawnSync(process.env.FFMPEG || 'ffmpeg', [
    '-hide_banner', '-loglevel', 'error', '-f', 'wav', '-i', 'pipe:0',
    '-c:a', 'libmp3lame', '-q:a', '3', '-map_metadata', '-1', '-y', destination,
  ], { input: Buffer.concat([header, pcm]), windowsHide: true });
  if (encoded.error || encoded.status !== 0) throw encoded.error || new Error(encoded.stderr.toString());
  console.log(
    `${name}: ${duration}s, peak ${level.toFixed(2)}, RMS ${Math.sqrt(squares / (length * 2)).toFixed(3)}, ${statSync(destination).size} encoded bytes`
  );
}
