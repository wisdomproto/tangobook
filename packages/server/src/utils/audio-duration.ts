import fs from 'fs';
import path from 'path';
import os from 'os';
import { promisify } from 'util';
import { execFile } from 'child_process';

const execFileAsync = promisify(execFile);

const FETCH_TIMEOUT_MS = 15_000;
const FFMPEG_TIMEOUT_MS = 15_000;

async function fetchWithTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** Get audio duration in seconds from a URL using ffmpeg (most reliable). */
export async function getAudioDuration(audioUrl: string): Promise<number> {
  const res = await fetchWithTimeout(audioUrl, FETCH_TIMEOUT_MS).catch((err) => {
    const msg = err instanceof Error ? err.message : String(err);
    throw new Error(`오디오 다운로드 실패 (${msg}): ${audioUrl}`);
  });
  if (!res.ok) throw new Error(`Failed to fetch audio: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());

  const tmpFile = path.join(os.tmpdir(), `tts-probe-${Date.now()}.wav`);
  try {
    fs.writeFileSync(tmpFile, buffer);
    const ffmpegPath = (await import('ffmpeg-static')).default!;
    const { stderr } = await execFileAsync(ffmpegPath, ['-i', tmpFile, '-f', 'null', '-'], {
      timeout: FFMPEG_TIMEOUT_MS,
    }).catch((err: { stderr?: string }) => ({ stderr: err.stderr ?? '', stdout: '' }));

    // Parse "Duration: HH:MM:SS.ss" from ffmpeg output
    const match = stderr.match(/Duration:\s*(\d+):(\d+):(\d+)\.(\d+)/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const seconds = parseInt(match[3]);
      const centiseconds = parseInt(match[4]);
      return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
    }

    // Fallback: WAV header parsing
    if (buffer.length > 44 && buffer.toString('ascii', 0, 4) === 'RIFF') {
      const byteRate = buffer.readUInt32LE(28);
      const dataSize = buffer.length - 44;
      if (byteRate > 0) return dataSize / byteRate;
    }

    throw new Error('Could not determine audio duration');
  } finally {
    if (fs.existsSync(tmpFile)) fs.unlinkSync(tmpFile);
  }
}
