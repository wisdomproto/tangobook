#!/usr/bin/env node
/**
 * 한 카테고리의 책을 라이브러리에 **공개**하고, 카테고리 순서에 끼워 넣는다 (멱등).
 *
 * 🔴 순서는 코드가 아니라 **R2 데이터**(`_index/library-config.json` 의 `categoryOrder`)가 정한다 —
 *    거기 없는 카테고리는 권수 desc 로 맨 뒤로 밀린다. 새 라인을 내면 공개만으로는 부족하고
 *    이 배열에도 넣어야 의도한 자리에 온다(호리 유치원동화·세상 탐험이 그 이유로 뒤로 갔던 전례).
 *
 * 🔴 공개 판정은 `isPublic` 하나가 아니다 — 셀 단위 `publicByStyleLang[style][lang]=false` 가
 *    남아 있으면 그 조합이 학습자 화면에서 계속 숨는다. 같이 푼다.
 *
 * 사용:
 *   node packages/server/scripts/publish-category.mjs --category='호리 세상 탐험'                    # dry-run
 *   node packages/server/scripts/publish-category.mjs --category='호리 세상 탐험' --before='호리 유치원동화' --apply
 *
 * 옵션: `--before=<카테고리>` / `--after=<카테고리>` (둘 다 없으면 순서는 안 건드림)
 */
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const CATEGORY = args.category;
const BEFORE = args.before;
const AFTER = args.after;
const API = process.env.API_BASE || 'http://localhost:3500';

if (!CATEGORY) {
  console.error("--category='카테고리명' 이 필요합니다.");
  process.exit(1);
}
loadEnv();

/** 셀 단위 비공개 플래그를 푼다. 값이 `false` 인 것만 지운다(true 는 그대로 둔다). */
function unblockCells(sb) {
  const map = sb.publicByStyleLang;
  if (!map) return 0;
  let n = 0;
  for (const style of Object.keys(map)) {
    for (const lang of Object.keys(map[style] ?? {})) {
      if (map[style][lang] === false) {
        delete map[style][lang];
        n++;
      }
    }
  }
  return n;
}

async function publishBooks() {
  // 🔴 R2 를 통째로 훑지 않는다 — 목록 API 가 비공개 책까지 돌려주므로 그걸로 대상만 고른다
  //    (전수 스캔은 200권 넘게 받아오고, 빈 json 하나에 통째로 죽는다).
  const res = await fetch(`${API}/api/storybooks`);
  const { data: summaries } = await res.json();
  const ids = summaries.filter((s) => s.category === CATEGORY).map((s) => s.id);
  const hits = [];
  for (const id of ids) {
    const sb = await getStorybook(id);
    if (sb) hits.push(sb);
  }
  hits.sort((a, b) => (a.title ?? '').localeCompare(b.title ?? '', 'ko'));

  let published = 0;
  let unblocked = 0;
  for (const sb of hits) {
    const wasPublic = sb.isPublic === true;
    const cells = unblockCells(sb);
    if (wasPublic && cells === 0) {
      console.log(`  = ${sb.title} (이미 공개)`);
      continue;
    }
    sb.isPublic = true;
    published += wasPublic ? 0 : 1;
    unblocked += cells;
    console.log(`  ✏️ ${sb.title}${cells ? ` (셀 ${cells}개 해제)` : ''}`);
    if (APPLY) {
      sb.updatedAt = new Date().toISOString();
      await putStorybook(sb.id, sb);
    }
  }
  console.log(`\n책 ${hits.length}권 중 ${published}권 공개 전환 · 셀 ${unblocked}개 해제`);
  return hits.length;
}

async function placeInOrder() {
  if (!BEFORE && !AFTER) return;
  const res = await fetch(`${API}/api/library-config`);
  const { data } = await res.json();
  const order = [...(data.categoryOrder ?? [])].filter((c) => c !== CATEGORY);
  const anchor = BEFORE ?? AFTER;
  const at = order.indexOf(anchor);
  if (at < 0) {
    console.log(`⚠️  기준 카테고리 '${anchor}' 가 순서에 없습니다 — 맨 앞에 넣습니다.`);
    order.unshift(CATEGORY);
  } else {
    order.splice(BEFORE ? at : at + 1, 0, CATEGORY);
  }
  console.log(`\n카테고리 순서: ${order.join(' → ')}`);
  if (!APPLY) return;
  // 🔴 다른 필드를 지우지 않도록 통째로 되돌려 보낸다(PUT 이 전체 교체다).
  const put = await fetch(`${API}/api/library-config`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, categoryOrder: order }),
  });
  if (!put.ok) throw new Error(`library-config PUT 실패: ${put.status}`);
  console.log('✅ 순서 저장');
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'} · 카테고리 '${CATEGORY}'\n`);
await publishBooks();
await placeInOrder();
if (!APPLY) console.log('\n(dry-run — 반영하려면 --apply)');
