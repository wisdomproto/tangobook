import sharp from 'sharp';
import { spawn } from 'child_process';
import ffmpegPath from 'ffmpeg-static';

if (!ffmpegPath) {
  throw new Error('ffmpeg-static not available');
}

/**
 * Encode raw PCM (24kHz 16-bit mono) to MP3 (128kbps).
 * Gemini TTS returns PCM; input should NOT be WAV-wrapped.
 */
export async function pcmToMp3(
  pcm: Buffer,
  opts: { sampleRate?: number; channels?: number; bitrate?: string } = {}
): Promise<Buffer> {
  const { sampleRate = 24000, channels = 1, bitrate = '128k' } = opts;
  return runFfmpeg(pcm, [
    '-f',
    's16le',
    '-ar',
    String(sampleRate),
    '-ac',
    String(channels),
    '-i',
    'pipe:0',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    bitrate,
    '-f',
    'mp3',
    'pipe:1',
  ]);
}

/**
 * Decode WAV container and re-encode to MP3.
 * Used for migrating existing WAV files in R2.
 */
export async function wavToMp3(wav: Buffer, bitrate = '128k'): Promise<Buffer> {
  return runFfmpeg(wav, [
    '-i',
    'pipe:0',
    '-codec:a',
    'libmp3lame',
    '-b:a',
    bitrate,
    '-f',
    'mp3',
    'pipe:1',
  ]);
}

/**
 * Convert PNG/JPG buffer to WebP.
 */
export async function imageToWebp(
  input: Buffer,
  opts: { quality?: number; maxWidth?: number } = {}
): Promise<Buffer> {
  const { quality = 85, maxWidth } = opts;
  let img = sharp(input);
  if (maxWidth) img = img.resize({ width: maxWidth, withoutEnlargement: true });
  return img.webp({ quality }).toBuffer();
}

function runFfmpeg(input: Buffer, args: string[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath as string, args);
    const chunks: Buffer[] = [];
    const errChunks: Buffer[] = [];
    proc.stdout.on('data', (c) => chunks.push(c));
    proc.stderr.on('data', (c) => errChunks.push(c));
    proc.on('error', reject);
    proc.on('close', (code) => {
      if (code === 0) resolve(Buffer.concat(chunks));
      else reject(new Error(`ffmpeg exited ${code}: ${Buffer.concat(errChunks).toString()}`));
    });
    proc.stdin.on('error', reject);
    proc.stdin.end(input);
  });
}
