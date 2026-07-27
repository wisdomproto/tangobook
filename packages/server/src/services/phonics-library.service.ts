import {
  uploadBufferToR2,
  uploadJsonToR2,
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
import { neutralizeKoreanFinal } from '@tangobook/shared';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { join } from 'path';
import { createHash } from 'crypto';
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
// 정적 인덱스 — 빌드한 sound→URL 목록을 R2 객체 1개로 저장. 이후 list() 는 이 파일만 GET(빠름)해서
// listObjects(1600+ 객체, ~8s)를 회피. 음원 추가/삭제 시 삭제→다음 list() 가 재생성. (parseKey 는 .mp3
// 만 매칭하므로 이 _index.json 은 목록에 안 섞임.)
const INDEX_KEY = `${LIBRARY_PREFIX}/_index.json`;
let listCache: ListResult | null = null;
let listCacheAt = 0;
function invalidateListCache(): void {
  listCache = null;
  listCacheAt = 0;
  // 정적 인덱스도 무효화 — 다음 list() 가 R2 나열로 재빌드 후 재저장.
  void deleteFromR2(INDEX_KEY).catch(() => {});
}

async function readIndexFromR2(): Promise<ListResult | null> {
  try {
    const buf = await downloadFromR2(INDEX_KEY);
    const parsed = JSON.parse(buf.toString('utf8')) as Partial<ListResult>;
    if (
      Array.isArray(parsed.mod_phonics) &&
      Array.isArray(parsed.mod_english) &&
      Array.isArray(parsed.mod_korean)
    ) {
      return parsed as ListResult;
    }
    return null;
  } catch {
    return null; // 없거나 파싱 실패 → 재빌드 유도
  }
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

/** R2에서 음원 다운로드: 언어별 우선순위 + 한글 7종성 중화 fallback */
async function downloadSound(token: string, language?: string): Promise<Buffer | null> {
  // 한글: mod_korean 우선 → mod_phonics 폴백
  // 영어(기본): mod_phonics 우선 → mod_english 폴백
  const priorities: PhonicsAudioCategory[] =
    language === 'korean' ? ['mod_korean', 'mod_phonics'] : ['mod_phonics', 'mod_english'];

  // 1차: 원본 토큰. 2차: 영어 case-insensitive + 같은 글자 반복 압축 ('Aa' → 'aa' → 'a').
  //      3차: 한글이면 7종성 중화 fallback (예: 꽃 → 꼳).
  // mod_korean 라이브러리에 ㅅ/ㅆ/ㅈ/ㅊ/ㅌ/ㅎ/ㅋ/ㅍ 등 받침 음원이 없으므로 대표 종성으로 변환 재시도.
  const candidates: string[] = [token];
  // 영어 토큰 fallback: 라이브러리는 모두 소문자 (예: 'a', 'apple') 라
  // 알파벳 학습 'Aa' / 'BB' 같은 표기를 lowercase + 글자 압축으로 매칭.
  if (/^[A-Za-z]+$/.test(token)) {
    const lower = token.toLowerCase();
    if (lower !== token && !candidates.includes(lower)) candidates.push(lower);
    // 'Aa' / 'AA' / 'aa' → 'a' (같은 글자로만 구성됐을 때만 압축)
    const uniqueChars = Array.from(new Set(lower));
    if (uniqueChars.length === 1 && uniqueChars[0] !== lower) candidates.push(uniqueChars[0]);
  }
  // 🔴 하이픈·아포스트로피는 떼고도 찾아본다 — 커리큘럼 표기와 라이브러리 표기가 갈리는 자리다.
  //    `yo-yo` 가 라이브러리엔 `yoyo` 로 있어 TTS 생성이 통째로 실패했다. 위 분기는 `^[A-Za-z]+$`
  //    라 하이픈이 든 토큰은 애초에 걸리지도 않았다.
  const stripped = token.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (stripped && stripped !== token && !candidates.includes(stripped)) candidates.push(stripped);
  const neutralized = neutralizeKoreanFinal(token);
  if (neutralized && neutralized !== token) candidates.push(neutralized);

  for (const candidate of candidates) {
    for (const cat of priorities) {
      // 정상 키 시도
      try {
        return await downloadFromR2(buildLibraryKey(cat, candidate));
      } catch {
        // 깨진(Latin-1) 키로 재시도 (하위 호환)
        if (/[가-힣ㄱ-ㅣ]/.test(candidate)) {
          try {
            const garbled = Buffer.from(candidate, 'utf8').toString('latin1');
            return await downloadFromR2(buildLibraryKey(cat, garbled));
          } catch {
            // 다음 후보 / 카테고리 시도
          }
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

    // 🔴 결과는 **mp3** — 예전엔 무압축 wav 라 이어읽기 하나가 300~400KB 였다. 아이가 카드를
    //    처음 누를 때 그걸 받느라 소리가 늦었다. 말소리는 모노 64kbps 면 구분이 안 되면서 10배 작다.
    const outputPath = join(tempDir, 'output.mp3');
    args.push(
      '-filter_complex',
      filterComplex,
      '-map',
      '[out]',
      '-ac',
      '1',
      '-b:a',
      '64k',
      '-y',
      outputPath
    );

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
    const now = Date.now();
    if (listCache && now - listCacheAt < LIST_CACHE_TTL_MS) {
      return listCache;
    }

    // === 정적 인덱스 우선 (R2 객체 1개 GET ~50ms) — listObjects(~8s) 회피 ===
    // 서버 재시작/캐시 만료 후에도 이 파일만 읽으면 됨. 음원 추가/삭제 시 invalidateListCache 가 삭제 → 재빌드.
    const index = await readIndexFromR2();
    if (index) {
      listCache = index;
      listCacheAt = now;
      return index;
    }

    // === 인덱스 없음(최초/무효화 후) → R2 나열로 1회 빌드 후 인덱스 저장 ===
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
    // 정적 인덱스 저장(best-effort) — 다음부터 listObjects 없이 이 파일만 GET.
    void uploadJsonToR2(result, INDEX_KEY).catch(() => {});
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

    // 단일 토큰이면 원본 mp3 를 그대로, 이어읽기도 mp3 로 굽는다 — 어느 쪽이든 mp3 다.
    const ext = 'mp3';
    const mimeType = 'audio/mpeg';

    // === Deterministic 캐시 key — (storybookId, identifier, language, text-hash) 기반 ===
    // 이전엔 (sbId, identifier) 만 키라 텍스트만 바뀌면 옛 음원이 캐시 hit 으로 재사용되는 버그.
    // text 의 short SHA-1 (8자) 을 key 에 포함 → 텍스트 바뀌면 새 R2 객체 PUT, 기존 객체는 orphan 으로 잔존
    // (R2 용량 부담 적음 + 텍스트 되돌리면 옛 캐시 재사용 가능).
    const langPart = language ? sanitizeFilename(language, 12) : 'auto';
    const idPart = sanitizeFilename(identifier || 'default', 60);
    const sbPart = sanitizeFilename(storybookId || 'default', 30);
    const textHash = createHash('sha1').update(trimmed).digest('hex').slice(0, 8);
    const cacheKey = `tts-cache/${langPart}/${sbPart}-${idPart}-${textHash}.${ext}`;

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
      console.warn(
        `[phonics-library.concat] 실패 sb=${storybookId} id=${identifier} lang=${language ?? 'auto'} text="${trimmed}" missing=${JSON.stringify(missingTokens)}`
      );
      throw new AppError(400, `라이브러리에 없는 음원: ${missingTokens.join(', ')}`);
    }

    // ffmpeg로 연결
    const outputBuffer = await concatWithFfmpeg(audioBuffers, gaps);
    const audioUrl = await uploadBufferToR2(outputBuffer, cacheKey, mimeType);

    return { audioUrl };
  },
};
