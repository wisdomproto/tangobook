import {
  uploadBufferToR2,
  downloadFromR2,
  deleteFromR2,
  deleteManyFromR2,
  listR2Objects,
  objectExists,
  r2PublicUrl,
} from '../providers/r2.provider.js';
import { AppError } from '../middleware/error.middleware.js';
import { sanitizeFilename } from '../utils/r2-key.js';
import type { PhonicsAudioCategory, PhonicsAudioItem } from '@tangobook/shared';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);

const LIBRARY_PREFIX = 'phonics-library';

// === list cache (in-memory, 5분 TTL) ===
// R2 listObjects 가 1600+ 객체라 매 호출 5초+. 음원 변경은 드물어 stale 5분 허용.
type ListResult = {
  mod_phonics: PhonicsAudioItem[];
  mod_english: PhonicsAudioItem[];
  mod_korean: PhonicsAudioItem[];
};
const LIST_CACHE_TTL_MS = 5 * 60 * 1000;
let listCache: ListResult | null = null;
let listCacheAt = 0;
function invalidateListCache(): void {
  listCache = null;
  listCacheAt = 0;
}

/** 서버 기동 시 호출 — 첫 사용자 요청 전에 phonics list 캐시를 채움 (R2 listObjects 7초 → 캐시 hit 즉시). */
export function prewarmPhonicsLibraryCache(): void {
  if (listCache) return;
  void PhonicsLibraryService.list().catch((err) => {
    console.warn('[phonics-library] prewarm failed:', (err as Error).message);
  });
}

function buildLibraryKey(category: PhonicsAudioCategory, sound: string): string {
  return `${LIBRARY_PREFIX}/${category}/${sound}.mp3`;
}

function parseKey(key: string): { category: PhonicsAudioCategory; sound: string } | null {
  const match = key.match(/^phonics-library\/(mod_phonics|mod_english|mod_korean)\/(.+)\.mp3$/);
  if (!match) return null;
  return { category: match[1] as PhonicsAudioCategory, sound: match[2] };
}

/** 깨진 Latin-1 인코딩 → UTF-8 복원 (업로드 인코딩 버그 하위 호환) */
function tryDecodeGarbled(name: string): string {
  if (/[\x80-\xff]/.test(name)) {
    try {
      const decoded = Buffer.from(name, 'latin1').toString('utf8');
      if (/[\uAC00-\uD7A3\u3131-\u3163]/.test(decoded)) return decoded;
    } catch {
      // 복원 실패 시 원본 반환
    }
  }
  return name;
}

/** 텍스트를 토큰과 공백 구간으로 파싱. 공백 1개 = 0.3초 */
/**
 * 텍스트 → 토큰 + gap 분해.
 *   - 영어 단어: 그대로 한 토큰 ('milk' → ['milk'])
 *   - 한글 단어: 음절 단위 분해 ('하프' → ['하', '프'], 음절 사이 gap=0)
 *   - 단어 사이 공백: gap = 공백 길이 × 0.3초
 *
 * gaps.length = tokens.length - 1 (tokens 사이마다 gap 1개).
 */
const HANGUL_SYLLABLE_RE = /[가-힣]/;

function parseText(text: string): { tokens: string[]; gaps: number[] } {
  const parts = text.split(/( +)/);
  const tokens: string[] = [];
  const gaps: number[] = [];
  let pendingWordGap = 0; // 다음 단어 첫 토큰 추가 시 적용할 단어-간 gap

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 0) {
      // 단어 단위 (비어있지 않은 경우만)
      const word = parts[i];
      if (!word) continue;
      // 한글 단어는 음절 단위 분해
      const subTokens = HANGUL_SYLLABLE_RE.test(word) ? [...word] : [word];
      for (let j = 0; j < subTokens.length; j++) {
        if (tokens.length > 0) {
          // 토큰 사이 gap — 첫 음절은 직전 단어와의 word gap, 나머지는 0 (음절 사이)
          gaps.push(j === 0 ? pendingWordGap : 0);
        }
        tokens.push(subTokens[j]);
      }
      pendingWordGap = 0;
    } else {
      // 공백 구간 → 다음 단어 첫 토큰 시 word gap 으로 적용
      pendingWordGap = parts[i].length * 0.3;
    }
  }

  return { tokens, gaps };
}

/** R2에서 음원 다운로드: 언어별 우선순위 적용 */
async function downloadSound(token: string, language?: string): Promise<Buffer | null> {
  // 한글: mod_korean 우선 → mod_phonics 폴백
  // 영어(기본): mod_phonics 우선 → mod_english 폴백
  const priorities: PhonicsAudioCategory[] =
    language === 'korean' ? ['mod_korean', 'mod_phonics'] : ['mod_phonics', 'mod_english'];

  for (const cat of priorities) {
    // 정상 키 시도
    try {
      return await downloadFromR2(buildLibraryKey(cat, token));
    } catch {
      // 깨진(Latin-1) 키로 재시도 (하위 호환)
      if (/[\uAC00-\uD7A3\u3131-\u3163]/.test(token)) {
        try {
          const garbled = Buffer.from(token, 'utf8').toString('latin1');
          return await downloadFromR2(buildLibraryKey(cat, garbled));
        } catch {
          // 다음 카테고리 시도
        }
      }
    }
  }
  return null;
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
    if (!['mod_phonics', 'mod_english', 'mod_korean'].includes(category)) {
      throw new AppError(400, '유효하지 않은 카테고리입니다.');
    }

    const results: PhonicsAudioItem[] = [];

    for (const file of files) {
      // multer(busboy)가 파일명을 Latin-1로 디코딩하므로 한글 등 UTF-8 파일명을 복원
      const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      const ext = originalName.split('.').pop()?.toLowerCase();
      if (ext !== 'mp3') continue;

      const sound = originalName.replace(/\.mp3$/i, '');
      if (!sound) continue;

      const key = buildLibraryKey(category, sound);
      const url = await uploadBufferToR2(file.buffer, key, 'audio/mpeg');

      results.push({ sound, url, category });
    }

    if (results.length > 0) invalidateListCache();
    return results;
  },

  async list(): Promise<{
    mod_phonics: PhonicsAudioItem[];
    mod_english: PhonicsAudioItem[];
    mod_korean: PhonicsAudioItem[];
  }> {
    // === In-memory cache (5분 TTL) ===
    // R2 listObjects 가 1600+ 객체 fetch 해서 매번 5초 걸림. 클라 spinner 가 길어짐.
    // 음원 추가/삭제는 phonics 페이지 (드물 작업) — 5분 stale 허용.
    const now = Date.now();
    if (listCache && now - listCacheAt < LIST_CACHE_TTL_MS) {
      return listCache;
    }

    const objects = await listR2Objects(LIBRARY_PREFIX);

    const result: {
      mod_phonics: PhonicsAudioItem[];
      mod_english: PhonicsAudioItem[];
      mod_korean: PhonicsAudioItem[];
    } = {
      mod_phonics: [],
      mod_english: [],
      mod_korean: [],
    };
    const seen: Record<PhonicsAudioCategory, Set<string>> = {
      mod_phonics: new Set(),
      mod_english: new Set(),
      mod_korean: new Set(),
    };

    for (const obj of objects) {
      if (!obj.Key) continue;
      const parsed = parseKey(obj.Key);
      if (!parsed) continue;

      // 깨진 Latin-1 이름 복원
      const decoded = tryDecodeGarbled(parsed.sound);
      if (seen[parsed.category].has(decoded)) continue;
      seen[parsed.category].add(decoded);

      result[parsed.category].push({
        sound: decoded,
        url: `${r2PublicUrl}/${obj.Key}`,
        category: parsed.category,
      });
    }

    // 알파벳 순 정렬
    result.mod_phonics.sort((a, b) => a.sound.localeCompare(b.sound));
    result.mod_english.sort((a, b) => a.sound.localeCompare(b.sound));
    result.mod_korean.sort((a, b) => a.sound.localeCompare(b.sound));

    listCache = result;
    listCacheAt = now;
    return result;
  },

  async remove(category: PhonicsAudioCategory, sound: string): Promise<void> {
    if (!['mod_phonics', 'mod_english', 'mod_korean'].includes(category)) {
      throw new AppError(400, '유효하지 않은 카테고리입니다.');
    }
    // 정상 키 삭제
    await deleteFromR2(buildLibraryKey(category, sound));
    // 깨진(Latin-1) 키도 삭제 (하위 호환)
    if (/[\uAC00-\uD7A3\u3131-\u3163]/.test(sound)) {
      const garbled = Buffer.from(sound, 'utf8').toString('latin1');
      await deleteFromR2(buildLibraryKey(category, garbled)).catch(() => {});
    }
    invalidateListCache();
  },

  async removeAll(category: PhonicsAudioCategory): Promise<{ deleted: number }> {
    if (!['mod_phonics', 'mod_english', 'mod_korean'].includes(category)) {
      throw new AppError(400, '유효하지 않은 카테고리입니다.');
    }
    const prefix = `${LIBRARY_PREFIX}/${category}/`;
    const objects = await listR2Objects(prefix);
    const keys = objects.filter((o) => o.Key).map((o) => o.Key!);
    if (keys.length > 0) {
      await deleteManyFromR2(keys);
    }
    invalidateListCache();
    return { deleted: keys.length };
  },

  async concat(
    text: string,
    storybookId: string,
    identifier: string,
    language?: string
  ): Promise<{ audioUrl: string }> {
    const trimmed = text.trim();
    if (!trimmed) throw new AppError(400, '텍스트가 비어있습니다.');

    const { tokens, gaps } = parseText(trimmed);
    if (tokens.length === 0) throw new AppError(400, '유효한 토큰이 없습니다.');

    // 단일 토큰 / 연결 구분 (캐시 key 결정에도 사용)
    const willBeSingle = tokens.length === 1 && gaps.length === 0;
    const ext = willBeSingle ? 'mp3' : 'wav';
    const mimeType = willBeSingle ? 'audio/mpeg' : 'audio/wav';

    // === Deterministic 캐시 key — 같은 (storybookId, identifier, language) 호출은 같은 R2 객체 ===
    // 이전엔 buildR2Key 가 Date.now() 추가해서 매 호출마다 새 R2 PUT (캐시 X) → 매번 ffmpeg + R2 i/o.
    // 이제 fixed key + HEAD 체크로 캐시. 첫 호출만 처리, 이후엔 즉시 URL 반환.
    const langPart = language ? sanitizeFilename(language, 12) : 'auto';
    const idPart = sanitizeFilename(identifier || 'default', 60);
    const sbPart = sanitizeFilename(storybookId || 'default', 30);
    const cacheKey = `tts-cache/${langPart}/${sbPart}-${idPart}.${ext}`;

    const cached = await objectExists(cacheKey);
    if (cached) {
      return { audioUrl: `${r2PublicUrl}/${cacheKey}` };
    }

    // 각 토큰의 음원 다운로드 (언어별 우선순위 적용)
    const missingTokens: string[] = [];
    const audioBuffers: Buffer[] = [];

    for (const token of tokens) {
      const buffer = await downloadSound(token, language);
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
    const audioUrl = await uploadBufferToR2(outputBuffer, cacheKey, mimeType);

    return { audioUrl };
  },
};
