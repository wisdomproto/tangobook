import {
  uploadBufferToR2,
  downloadFromR2,
  deleteFromR2,
  listR2Objects,
  r2PublicUrl,
} from '../providers/r2.provider.js';
import { AppError } from '../middleware/error.middleware.js';
import { buildR2Key } from '../utils/r2-key.js';
import type { PhonicsAudioCategory, PhonicsAudioItem } from '@tangobook/shared';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

const LIBRARY_PREFIX = 'phonics-library';

function buildLibraryKey(category: PhonicsAudioCategory, sound: string): string {
  return `${LIBRARY_PREFIX}/${category}/${sound}.mp3`;
}

function parseKey(key: string): { category: PhonicsAudioCategory; sound: string } | null {
  const match = key.match(/^phonics-library\/(mod_phonics|mod_english)\/(.+)\.mp3$/);
  if (!match) return null;
  return { category: match[1] as PhonicsAudioCategory, sound: match[2] };
}

/** 텍스트를 토큰과 공백 구간으로 파싱. 공백 1개 = 0.3초 */
function parseText(text: string): { tokens: string[]; gaps: number[] } {
  const parts = text.split(/( +)/);
  const tokens: string[] = [];
  const gaps: number[] = [];

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // 토큰 (비어있지 않은 경우만)
      if (parts[i]) tokens.push(parts[i]);
    } else {
      // 공백 구간 → 0.3초/공백
      gaps.push(parts[i].length * 0.3);
    }
  }

  return { tokens, gaps };
}

/** R2에서 음원 다운로드: mod_phonics 우선, mod_english 폴백 */
async function downloadSound(token: string): Promise<Buffer | null> {
  try {
    return await downloadFromR2(buildLibraryKey('mod_phonics', token));
  } catch {
    // mod_phonics에 없으면 mod_english 시도
  }
  try {
    return await downloadFromR2(buildLibraryKey('mod_english', token));
  } catch {
    return null;
  }
}

/** ffmpeg로 MP3 파일들을 무음 포함하여 연결 → WAV 출력 */
async function concatWithFfmpeg(audioBuffers: Buffer[], gaps: number[]): Promise<Buffer> {
  if (!ffmpegPath) throw new AppError(500, 'ffmpeg 바이너리를 찾을 수 없습니다.');

  // 단일 토큰이면 ffmpeg 없이 직접 반환
  if (audioBuffers.length === 1 && gaps.length === 0) {
    return audioBuffers[0];
  }

  const tempDir = await mkdtemp(join(tmpdir(), 'phonics-concat-'));

  try {
    const args: string[] = [];
    const filterParts: string[] = [];
    let inputIdx = 0;

    for (let i = 0; i < audioBuffers.length; i++) {
      // MP3 파일 저장 및 입력 추가
      const mp3Path = join(tempDir, `${i}.mp3`);
      await writeFile(mp3Path, audioBuffers[i]);
      args.push('-i', mp3Path);
      filterParts.push(
        `[${inputIdx}:a]aformat=sample_rates=44100:channel_layouts=mono[a${inputIdx}]`
      );
      inputIdx++;

      // 토큰 사이에 무음 삽입
      if (i < gaps.length && gaps[i] > 0) {
        args.push('-f', 'lavfi', '-t', String(gaps[i]), '-i', 'anullsrc=r=44100:cl=mono');
        filterParts.push(`[${inputIdx}:a]acopy[a${inputIdx}]`);
        inputIdx++;
      }
    }

    const concatInputs = Array.from({ length: inputIdx }, (_, i) => `[a${i}]`).join('');
    const filterComplex =
      filterParts.join(';') + `;${concatInputs}concat=n=${inputIdx}:v=0:a=1[out]`;

    const outputPath = join(tempDir, 'output.wav');
    args.push('-filter_complex', filterComplex, '-map', '[out]', '-y', outputPath);

    await execFileAsync(ffmpegPath, args, { timeout: 30000 });

    return await readFile(outputPath);
  } finally {
    await rm(tempDir, { recursive: true, force: true }).catch(() => {});
  }
}

export const PhonicsLibraryService = {
  async upload(
    files: Express.Multer.File[],
    category: PhonicsAudioCategory
  ): Promise<PhonicsAudioItem[]> {
    if (!['mod_phonics', 'mod_english'].includes(category)) {
      throw new AppError(400, '유효하지 않은 카테고리입니다.');
    }

    const results: PhonicsAudioItem[] = [];

    for (const file of files) {
      const ext = file.originalname.split('.').pop()?.toLowerCase();
      if (ext !== 'mp3') continue;

      const sound = file.originalname.replace(/\.mp3$/i, '');
      if (!sound) continue;

      const key = buildLibraryKey(category, sound);
      const url = await uploadBufferToR2(file.buffer, key, 'audio/mpeg');

      results.push({ sound, url, category });
    }

    return results;
  },

  async list(): Promise<{ mod_phonics: PhonicsAudioItem[]; mod_english: PhonicsAudioItem[] }> {
    const objects = await listR2Objects(LIBRARY_PREFIX);

    const result: { mod_phonics: PhonicsAudioItem[]; mod_english: PhonicsAudioItem[] } = {
      mod_phonics: [],
      mod_english: [],
    };

    for (const obj of objects) {
      if (!obj.Key) continue;
      const parsed = parseKey(obj.Key);
      if (!parsed) continue;

      result[parsed.category].push({
        sound: parsed.sound,
        url: `${r2PublicUrl}/${obj.Key}`,
        category: parsed.category,
      });
    }

    // 알파벳 순 정렬
    result.mod_phonics.sort((a, b) => a.sound.localeCompare(b.sound));
    result.mod_english.sort((a, b) => a.sound.localeCompare(b.sound));

    return result;
  },

  async remove(category: PhonicsAudioCategory, sound: string): Promise<void> {
    if (!['mod_phonics', 'mod_english'].includes(category)) {
      throw new AppError(400, '유효하지 않은 카테고리입니다.');
    }
    const key = buildLibraryKey(category, sound);
    await deleteFromR2(key);
  },

  async concat(
    text: string,
    storybookId: string,
    identifier: string
  ): Promise<{ audioUrl: string }> {
    const trimmed = text.trim();
    if (!trimmed) throw new AppError(400, '텍스트가 비어있습니다.');

    const { tokens, gaps } = parseText(trimmed);
    if (tokens.length === 0) throw new AppError(400, '유효한 토큰이 없습니다.');

    // 각 토큰의 음원 다운로드 (mod_phonics 우선, mod_english 폴백)
    const missingTokens: string[] = [];
    const audioBuffers: Buffer[] = [];

    for (const token of tokens) {
      const buffer = await downloadSound(token);
      if (!buffer) {
        missingTokens.push(token);
      } else {
        audioBuffers.push(buffer);
      }
    }

    if (missingTokens.length > 0) {
      throw new AppError(400, `라이브러리에 없는 음원: ${missingTokens.join(', ')}`);
    }

    // ffmpeg로 연결
    const outputBuffer = await concatWithFfmpeg(audioBuffers, gaps);

    // 단일 토큰(MP3 그대로)일 경우와 연결(WAV) 구분
    const isSingle = audioBuffers.length === 1 && gaps.length === 0;
    const ext = isSingle ? 'mp3' : 'wav';
    const mimeType = isSingle ? 'audio/mpeg' : 'audio/wav';

    const key = buildR2Key({
      storybookId,
      fileType: 'tts',
      identifier,
      extension: ext,
    });
    const audioUrl = await uploadBufferToR2(outputBuffer, key, mimeType);

    return { audioUrl };
  },
};
