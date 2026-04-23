// 한글/영어 파닉스 커리큘럼의 각 unit을 하나의 phonics Storybook으로 만들어 R2에 저장.
// 이미지/TTS/스토리 등 AI 생성 영역은 비워두고, 기획 데이터(unit, phonemes, patterns, sampleWords)만 채움.
// 서버(localhost:3500)가 돌고 있어야 실행 가능. 저작도구(HomePage)/라이브러리에서 자동으로 목록에 나타남.
//
// 실행:
//   node scripts/seed-phonics-books.mjs          # 이미 있는 unit은 skip
//   node scripts/seed-phonics-books.mjs --force  # 기존 덮어쓰기

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

function randomUuid() {
  return crypto.randomUUID();
}

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 200)}`);
  }
  return json.data;
}

/** unit + curriculum → phonics Storybook JSON (AI 생성 영역은 빈 값) */
function buildPhonicsStorybook(unit, curriculum, language) {
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
    // phonicsLesson (blending/wordFamilies) 는 저작도구에서 AI로 채움 — 빈 쉘
    phonicsLesson: {
      title: unit.title,
      blending: [],
      wordFamilies: [],
    },
    // 타겟 단어 리스트 → flashcards 뼈대 (이미지/TTS 없음)
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

async function main() {
  const force = process.argv.includes('--force');
  console.log(`모드: ${force ? 'FORCE (덮어쓰기)' : 'SAFE (기존 skip)'}`);

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
  console.log(`총 파닉스 unit 후보: ${candidates.length}개 (한글 + 영어)\n`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < candidates.length; i++) {
    const { unit, curr, language } = candidates[i];
    const exists = existingIds.has(unit.id);
    const prefix = `[${String(i + 1).padStart(2, '0')}/${candidates.length}] ${unit.id} (${language})`;

    if (exists && !force) {
      console.log(`${prefix} — skip (이미 있음)`);
      skipped++;
      continue;
    }

    try {
      const sb = buildPhonicsStorybook(unit, curr, language);
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: sb }),
      });
      if (exists) {
        console.log(`${prefix} — updated`);
        updated++;
      } else {
        console.log(`${prefix} — created`);
        created++;
      }
    } catch (err) {
      console.error(`${prefix} — FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n━━ 완료 ━━`);
  console.log(`created: ${created}`);
  console.log(`updated: ${updated}`);
  console.log(`skipped: ${skipped}`);
  console.log(`failed:  ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('스크립트 실행 오류:', e);
  process.exit(1);
});
