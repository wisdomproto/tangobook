#!/usr/bin/env node
/**
 * parent-guide-map.json 의 콘텐츠를 R2 storybook 의 parentGuide 에 머지.
 *
 * Input: packages/server/scripts/_data/parent-guide-map.json
 *   {
 *     "<bookId>": {
 *       "overview"?: string,
 *       "lessons"?: string[],
 *       "readingTips"?: string[],
 *       "faq"?: { q: string; a: string }[]
 *     }
 *   }
 *
 * 동작: GET → parentGuide 머지 (overview/lessons/readingTips 는 비어있지 않은 새 값만 덮어씀,
 *   faq 는 항상 새로 설정) → POST save.
 *
 * 사용: node packages/server/scripts/apply-parent-guide-map.mjs
 *       node packages/server/scripts/apply-parent-guide-map.mjs --dry  (변경 확인만)
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INPUT = path.join(__dirname, '_data', 'parent-guide-map.json');
const dry = process.argv.includes('--dry');

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`입력 없음: ${INPUT}`);
    process.exit(1);
  }
  const map = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  const ids = Object.keys(map);
  console.log(`적용 대상: ${ids.length} 권 (${dry ? 'DRY' : 'APPLY'})`);

  let ok = 0;
  let fail = 0;
  for (const id of ids) {
    const patch = map[id];
    try {
      const r = await fetch(`${BASE}/api/storybooks/${encodeURIComponent(id)}`);
      if (!r.ok) throw new Error(`GET ${r.status}`);
      const book = (await r.json()).data;
      const prev = book.parentGuide || { overview: '', lessons: [], readingTips: [] };
      const merged = {
        overview: typeof patch.overview === 'string' && patch.overview.trim() ? patch.overview.trim() : prev.overview || '',
        lessons: Array.isArray(patch.lessons) && patch.lessons.length ? patch.lessons : (prev.lessons || []),
        readingTips: Array.isArray(patch.readingTips) && patch.readingTips.length ? patch.readingTips : (prev.readingTips || []),
      };
      if (Array.isArray(patch.faq) && patch.faq.length) merged.faq = patch.faq;
      else if (Array.isArray(prev.faq)) merged.faq = prev.faq;

      book.parentGuide = merged;

      console.log(`[${id}] ${book.title}`);
      console.log(`  overview: ${merged.overview.slice(0, 60)}${merged.overview.length > 60 ? '…' : ''}`);
      console.log(`  lessons: ${merged.lessons.length} · tips: ${merged.readingTips.length} · faq: ${merged.faq?.length ?? 0}`);

      if (!dry) {
        const sr = await fetch(`${BASE}/api/storybooks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storybook: book }),
        });
        if (!sr.ok) {
          const j = await sr.json().catch(() => ({}));
          throw new Error(`POST ${sr.status}: ${j.error || j.message}`);
        }
      }
      ok++;
    } catch (e) {
      console.error(`  FAIL: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n=== ${ok} OK · ${fail} FAIL ===`);
}

main().catch((e) => { console.error(e); process.exit(1); });
