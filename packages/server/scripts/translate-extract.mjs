#!/usr/bin/env node
/**
 * 동화책의 번역 대상(제목/페이지/단어/부모가이드)을 책별 JSON 으로 dump. 언어 무관.
 * target 칸(t / titleT / q_t / a_t)은 빈 문자열 — Claude 가 채운 뒤 translate-apply.mjs 로 R2 주입.
 * Gemini 등 외부 API 미사용 (번역은 Claude 가 채움).
 *
 * 사용:
 *   node scripts/translate-extract.mjs --lang=vi                  # 공개 세계명작
 *   node scripts/translate-extract.mjs --lang=ja --all            # 비공개 포함
 *   node scripts/translate-extract.mjs --lang=vi --category=공룡 친구들
 *   node scripts/translate-extract.mjs --lang=vi --category=all   # 전 카테고리
 *   node scripts/translate-extract.mjs --lang=vi --id=178...      # 단권
 *   node scripts/translate-extract.mjs --lang=vi --force          # 기존 파일 덮어쓰기
 *
 * 출력: scripts/_data/translations/<lang>/<id>.json
 */
import fs from 'node:fs';
import path from 'node:path';
import {
  listStorybookKeys,
  getStorybook,
  VARIANT_RE,
  HANGUL_RE,
  parseArgs,
  langDir,
} from './translation-core.mjs';

const args = parseArgs(process.argv.slice(2));
const LANG = args.lang;
if (!LANG) {
  console.error('필수: --lang=<code> (예: vi, ja, zh). SUPPORTED_LANGUAGES 참고.');
  process.exit(1);
}
const CATEGORY = args.category ?? '세계 명작';
const ALL_CATEGORIES = CATEGORY === 'all';
const INCLUDE_PRIVATE = args.flags.has('all');
const FORCE = args.flags.has('force');
const ONLY_ID = args.id ?? null;

function buildExtract(sb) {
  const pages = (sb.pages ?? []).map((p) => ({
    n: p.pageNumber,
    ko: p.text ?? '',
    en: p.translations?.en?.text ?? '',
    t: '',
  }));

  const koList = sb.key_objects ?? sb.keyObjects ?? [];
  const keyObjects = koList.map((k, i) => {
    const korean = k.korean || (k.name && HANGUL_RE.test(k.name) ? k.name : '') || '';
    return { i, korean, en: k.nameEn || k.nameTranslations?.en || '', t: '' };
  });

  let parentGuide = null;
  const pg = sb.parentGuide;
  if (pg && (pg.overview || pg.lessons?.length || pg.readingTips?.length || pg.faq?.length)) {
    parentGuide = {
      overview: { ko: pg.overview ?? '', t: '' },
      lessons: (pg.lessons ?? []).map((l) => ({ ko: l, t: '' })),
      readingTips: (pg.readingTips ?? []).map((tip) => ({ ko: tip, t: '' })),
      faq: (pg.faq ?? []).map((f) => ({ q_ko: f.q, a_ko: f.a, q_t: '', a_t: '' })),
    };
  }

  return { id: sb.id, lang: LANG, title: sb.title, titleT: '', pages, keyObjects, parentGuide };
}

async function main() {
  const outDir = langDir(LANG);
  fs.mkdirSync(outDir, { recursive: true });

  let books;
  if (ONLY_ID) {
    books = [await getStorybook(ONLY_ID)];
  } else {
    console.log('R2 storybook 키 목록 가져오는 중...');
    const keys = await listStorybookKeys();
    console.log(`총 ${keys.length} 키. 필터링 (category=${ALL_CATEGORIES ? '전체' : CATEGORY})...`);
    books = [];
    let i = 0;
    const concurrency = 12;
    async function worker() {
      while (i < keys.length) {
        const key = keys[i++];
        try {
          const sb = await getStorybook(key.replace(/^storybook-|\.json$/g, ''));
          if (!sb.id || VARIANT_RE.test(sb.id)) continue;
          if (sb.type === 'phonics') continue; // 파닉스(영어 알파벳/CVC 학습물)는 번역 대상 아님
          if (!ALL_CATEGORIES && sb.category !== CATEGORY) continue;
          if (sb.category === 'backup') continue;
          if (!INCLUDE_PRIVATE && !sb.isPublic) continue;
          books.push(sb);
        } catch (e) {
          console.warn(`skip ${key}: ${e.message}`);
        }
      }
    }
    await Promise.all(Array.from({ length: concurrency }, worker));
  }

  books.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko'));

  let written = 0;
  let skipped = 0;
  for (const sb of books) {
    const outPath = path.join(outDir, `${sb.id}.json`);
    if (fs.existsSync(outPath) && !FORCE) {
      skipped++;
      console.log(`  ⏭️  ${sb.title} (이미 있음 — 보존)`);
      continue;
    }
    const ex = buildExtract(sb);
    fs.writeFileSync(outPath, JSON.stringify(ex, null, 2));
    written++;
    const pgNote = ex.parentGuide ? '' : ' ⚠️ parentGuide 없음';
    console.log(`  ✏️  ${sb.title} — ${ex.pages.length}p / ${ex.keyObjects.length}단어${pgNote}`);
  }

  console.log(`\n[${LANG}] 대상 ${books.length}권 | 생성 ${written} | 보존 ${skipped}`);
  console.log(`출력: ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
