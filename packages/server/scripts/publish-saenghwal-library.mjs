// 생활동화 45권을 라이브러리에 공개 + 언어별 표지 채우기.
//   - isPublic=true, 막힌 publicByStyleLang 해제
//   - 표지: 기존 ko/en 유지 + vi/zh/th 는 en 표지로 대체(en 없으면 ko). 표지 아예 없는 책은 page1 삽화 사용.
//   - primaryCoverByLang: top-level + styleAssets[activeStyle] 양쪽 세팅(toSummary 가 둘 다 읽음).
//
// 사용:
//   node packages/server/scripts/publish-saenghwal-library.mjs            # dry-run
//   node packages/server/scripts/publish-saenghwal-library.mjs --apply
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP = Object.fromEntries(
  Object.entries(JSON.parse(fs.readFileSync(path.join(__dirname, 'saenghwal-book-map.json'), 'utf-8')))
    .filter(([k]) => !k.startsWith('_'))
);
const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');

async function main() {
  let pubCnt = 0, coverFilled = 0, usedPage1 = [], noBase = [];
  for (const bookId of Object.values(MAP)) {
    const sb = await getStorybook(bookId);
    if (!sb) { console.log(`✖ ${bookId}: 없음`); continue; }
    const style = sb.artStyle || sb.defaultStyle || 'animation';

    // 기존 표지 소스 병합
    const top = sb.primaryCoverByLang || {};
    const saPCBL = sb.styleAssets?.[style]?.primaryCoverByLang || {};
    const merged = { ...saPCBL, ...top };
    const koCover = merged.ko || sb.coverImage || sb.styleAssets?.[style]?.coverImage;
    const enCover = merged.en;
    const fallback = enCover || koCover; // 다른 언어용: en 우선, 없으면 ko

    let final;
    if (!koCover && !enCover) {
      const base = sb.pages?.find((p) => p.illustrationUrl)?.illustrationUrl;
      if (!base) { noBase.push(sb.title); }
      else {
        final = { ko: base, en: base, vi: base, zh: base, th: base };
        if (!sb.coverImage) sb.coverImage = base;
        usedPage1.push(sb.title);
      }
    } else {
      final = {
        ko: koCover || fallback,
        en: enCover || koCover,
        vi: fallback,
        zh: fallback,
        th: fallback,
      };
      if (!sb.coverImage) sb.coverImage = koCover || enCover;
    }

    if (final) {
      final = Object.fromEntries(Object.entries(final).filter(([, v]) => v));
      sb.primaryCoverByLang = { ...merged, ...final };
      if (sb.styleAssets?.[style]) {
        sb.styleAssets[style].primaryCoverByLang = {
          ...(sb.styleAssets[style].primaryCoverByLang || {}),
          ...final,
        };
      }
      coverFilled++;
    }

    // 공개 + 차단 해제
    sb.isPublic = true;
    if (sb.publicByStyleLang) delete sb.publicByStyleLang;
    pubCnt++;

    const langs = Object.keys(sb.primaryCoverByLang || {}).join(',');
    console.log(`${sb.title} — 공개 · 표지[${langs}]`);
    if (APPLY) { sb.updatedAt = new Date().toISOString(); await putStorybook(bookId, sb); }
  }
  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — 공개 ${pubCnt}권 · 표지세팅 ${coverFilled}권`);
  if (usedPage1.length) console.log(`page1 삽화를 표지로 쓴 책(${usedPage1.length}): ${usedPage1.join(', ')}`);
  if (noBase.length) console.log(`⚠️ 표지 소스 전무(${noBase.length}): ${noBase.join(', ')}`);
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
