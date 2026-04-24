// 한글/영어 파닉스 커리큘럼의 각 unit을 하나의 phonics Storybook으로 만들어 R2에 저장.
//
// 기본 모드 (AI): POST /api/phonics/generate 를 호출하여 Gemini가 캐릭터/페이지/플래시카드/
// 챈트/워크시트/퀴즈/phonicsLesson 등 텍스트 콘텐츠를 모두 채운다. 이미지·TTS 자산은
// 저작도구에서 수동으로 생성.
//
// 스켈레톤 모드 (--skeleton): 기존처럼 텍스트 콘텐츠 없이 기획 정보(unit, phonemes,
// patterns, sampleWords)만 채운 빈 껍데기를 POST /api/storybooks 로 저장.
//
// 서버(localhost:3500)가 돌고 있어야 실행 가능. 저작도구(HomePage)/라이브러리에서 자동으로 목록에 나타남.
//
// 실행:
//   node scripts/seed-phonics-books.mjs                       # AI 기본, 이미 있는 unit은 skip
//   node scripts/seed-phonics-books.mjs --force               # AI 덮어쓰기
//   node scripts/seed-phonics-books.mjs --concurrency 5       # 동시성 조절 (기본 3)
//   node scripts/seed-phonics-books.mjs --only ko-book1-u1-giyeok,en-book1-u1-aa
//   node scripts/seed-phonics-books.mjs --skeleton            # 빈 껍데기 모드
//   node scripts/seed-phonics-books.mjs --skeleton --force    # 빈 껍데기 덮어쓰기

import {
  KOREAN_PHONICS_CURRICULUM,
  ENGLISH_PHONICS_CURRICULUM,
} from '../packages/shared/dist/index.js';

const API = 'http://localhost:3500/api';

const BOOK_TYPE_MAP = {
  book1: 'letter-sounds',
  book2: 'short-vowels',
  book3: 'long-vowels',
  book4: 'blends-digraphs',
  book5: 'vowel-teams-r-controlled',
};

function parseFlag(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const FORCE = process.argv.includes('--force');
const SKELETON = process.argv.includes('--skeleton');
const CONCURRENCY = Math.max(1, Number(parseFlag('--concurrency', 3)) || 3);
const MODEL = parseFlag('--model', '').trim(); // e.g. gemini-2.5-flash-lite, gemini-2.5-pro
const ONLY = (parseFlag('--only', '') || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

function randomUuid() {
  return crypto.randomUUID();
}

async function apiJson(path, init, timeoutMs = 120_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let res;
  try {
    res = await fetch(`${API}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 300)}`);
  }
  return json.data;
}

/** 스켈레톤 모드용 — unit + curriculum → phonics Storybook JSON (AI 생성 영역은 빈 값) */
function buildPhonicsSkeleton(unit, curriculum, language) {
  const isKorean = language === 'korean';
  const now = new Date().toISOString();
  const bookType = isKorean ? undefined : BOOK_TYPE_MAP[curriculum.level];

  return {
    id: unit.id,
    title: `${curriculum.name} · ${unit.title}`,
    type: 'phonics',
    targetAge: '4-5',
    artStyle: 'watercolor',
    category: isKorean ? '한글 파닉스' : '영어 파닉스',
    folder: isKorean ? '한글 파닉스' : '영어 파닉스',
    isPublic: false,
    createdAt: now,
    characters: [],
    pages: [],
    educational_content: {
      vocabulary: [],
      quiz: [],
      learning_objectives: [
        `${unit.title} 학습`,
        `${unit.phonemes.join(', ')} 음가 익히기`,
      ],
      moral_lesson: '',
    },
    phonicsConfig: {
      language,
      level: curriculum.level,
      targetUnit: unit.title,
      targetPhonemes: [...unit.phonemes],
      targetWords: [...unit.sampleWords],
      targetPatterns: [...unit.patterns],
      ...(bookType ? { bookType } : {}),
    },
    phonicsLesson: {
      title: unit.title,
      blending: [],
      wordFamilies: [],
    },
    flashcards: unit.sampleWords.map((w) => ({
      id: randomUuid(),
      word: w,
      localWord: isKorean ? w : '',
      phonemes: [...unit.phonemes],
      phonicPattern: unit.patterns[0] ?? '',
      sentence: '',
    })),
  };
}

/** AI 모드용 — /api/phonics/generate 호출 페이로드 */
function buildGenerateRequest(unit, curriculum, language) {
  const isKorean = language === 'korean';
  return {
    title: `${curriculum.name} · ${unit.title}`,
    targetAge: '4-5',
    artStyle: 'watercolor',
    language,
    level: curriculum.level,
    unitId: unit.id,
    // 커리큘럼 디폴트(KOREAN_UNIT_STORY_DEFAULTS / ENGLISH_UNIT_STORY_DEFAULTS)에
    // 있는 캐릭터를 사용하기 위해 storyTheme은 일부러 비움.
    // id/folder/category/isPublic 를 넘겨 저작도구에서 skeleton 모드와 동일하게 그룹핑.
    id: unit.id,
    folder: isKorean ? '한글 파닉스' : '영어 파닉스',
    category: isKorean ? '한글 파닉스' : '영어 파닉스',
    isPublic: false,
    ...(MODEL ? { model: MODEL } : {}),
  };
}

async function runWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function next() {
    while (true) {
      const idx = cursor++;
      if (idx >= items.length) return;
      try {
        results[idx] = { status: 'ok', data: await worker(items[idx], idx) };
      } catch (err) {
        results[idx] = { status: 'error', error: err };
      }
    }
  }
  const poolSize = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: poolSize }, next));
  return results;
}

async function main() {
  console.log(
    `모드: ${SKELETON ? 'SKELETON' : 'AI'} · ${FORCE ? 'FORCE (덮어쓰기)' : 'SAFE (기존 skip)'} · 동시성 ${CONCURRENCY}`,
  );
  if (ONLY.length) console.log(`--only: ${ONLY.join(', ')}`);

  // 1. 기존 storybook id 파악
  const existing = await apiJson('/storybooks');
  const existingIds = new Set(existing.map((s) => s.id));
  console.log(`기존 storybook ${existing.length}개 로드됨.`);

  // 2. 생성 후보 수집
  const candidates = [];
  for (const curr of KOREAN_PHONICS_CURRICULUM) {
    for (const unit of curr.units) {
      candidates.push({ unit, curr, language: 'korean' });
    }
  }
  for (const curr of ENGLISH_PHONICS_CURRICULUM) {
    for (const unit of curr.units) {
      candidates.push({ unit, curr, language: 'english' });
    }
  }
  const filtered = ONLY.length
    ? candidates.filter((c) => ONLY.includes(c.unit.id))
    : candidates;
  console.log(`파닉스 unit 후보: ${filtered.length}개 (한글 + 영어)\n`);

  const work = [];
  const skipped = [];
  for (let i = 0; i < filtered.length; i++) {
    const cand = filtered[i];
    const exists = existingIds.has(cand.unit.id);
    if (exists && !FORCE) {
      skipped.push(cand.unit.id);
      continue;
    }
    work.push({ ...cand, index: i, exists });
  }
  console.log(`skip: ${skipped.length}개 / 작업: ${work.length}개`);

  let created = 0;
  let updated = 0;
  let failed = 0;
  const failures = [];

  const startedAt = Date.now();
  const total = work.length;
  let done = 0;

  const results = await runWithConcurrency(work, SKELETON ? CONCURRENCY : CONCURRENCY, async (item) => {
    const { unit, curr, language, exists } = item;
    const label = `${unit.id} (${language})`;
    const t0 = Date.now();

    if (SKELETON) {
      const sb = buildPhonicsSkeleton(unit, curr, language);
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: sb }),
      });
    } else {
      const body = buildGenerateRequest(unit, curr, language);
      await apiJson('/phonics/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }, 180_000); // Gemini 호출은 길어질 수 있음
    }

    const secs = ((Date.now() - t0) / 1000).toFixed(1);
    done++;
    const verb = exists ? 'updated' : 'created';
    console.log(`[${String(done).padStart(3)}/${total}] ${label} — ${verb} (${secs}s)`);
    return verb;
  });

  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    const item = work[i];
    if (!r) continue;
    if (r.status === 'ok') {
      if (r.data === 'updated') updated++;
      else created++;
    } else {
      failed++;
      const msg = r.error?.message ?? String(r.error);
      failures.push({ id: item.unit.id, language: item.language, message: msg });
      console.error(`❌ ${item.unit.id} (${item.language}) — FAILED: ${msg}`);
    }
  }

  const wallSecs = ((Date.now() - startedAt) / 1000).toFixed(1);
  console.log(`\n━━ 완료 (${wallSecs}s) ━━`);
  console.log(`created: ${created}`);
  console.log(`updated: ${updated}`);
  console.log(`skipped: ${skipped.length}`);
  console.log(`failed:  ${failed}`);

  if (failures.length) {
    console.log('\n실패 목록 (다시 돌리려면 --only 로 전달):');
    console.log('  --only ' + failures.map((f) => f.id).join(','));
  }
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('스크립트 실행 오류:', e);
  process.exit(1);
});
