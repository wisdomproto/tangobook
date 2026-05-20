#!/usr/bin/env node
/**
 * 기존 R2 책들 마이그 — top-level keyObjectImages 의 keypoints 가 styleAssets[artStyle].keyObjectImages
 * 에 sync 안 된 책들을 일괄 sync.
 *
 * 점잇기 게임 데이터 어댑터(`derive-storybook-unit.ts`)는 styleAssets[style].keyObjectImages 에서
 * keypoints 를 읽으므로, switchStyleAssets snapshot 없이 저장된 책들은 게임에서 keypoints 못 찾음.
 *
 * 룰:
 *   - 책에 styleAssets 가 있고 artStyle 키도 있으면 → styleAssets[artStyle].keyObjectImages =
 *     top-level keyObjectImages (deep copy).
 *   - styleAssets 없거나 키 없으면 skip (top-level only book).
 *
 * 실행: node packages/server/scripts/sync-keypoints-to-styleassets.mjs
 * 추가 옵션: --dry (변경 안 함, 영향받을 책만 출력)
 */
import 'dotenv/config';

const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const DRY = process.argv.includes('--dry');

async function getJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const j = await res.json();
  return j.data ?? j;
}

async function postJSON(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`${res.status} ${url} ${t.slice(0, 200)}`);
  }
  return res.json();
}

function hasKeypointsDiff(topImgs, styleImgs) {
  if (!Array.isArray(topImgs)) return false;
  const topWithKeypoints = topImgs.filter((i) => i?.keypoints?.length);
  if (topWithKeypoints.length === 0) return false;
  for (const t of topWithKeypoints) {
    const s = (styleImgs ?? []).find((x) => x?.objectName === t.objectName);
    if (!s) return true;
    const sLen = s.keypoints?.length ?? 0;
    if (sLen !== t.keypoints.length) return true;
  }
  return false;
}

async function main() {
  console.log(`[sync-keypoints] mode=${DRY ? 'DRY' : 'APPLY'}  ${BASE}`);
  const list = await getJSON(`${BASE}/api/storybooks`);
  console.log(`총 ${list.length} 책 스캔...\n`);

  let scanned = 0;
  let needSync = 0;
  let synced = 0;
  let failed = 0;

  for (const summary of list) {
    scanned++;
    try {
      const book = await getJSON(`${BASE}/api/storybooks/${summary.id}`);
      const topImgs = book.keyObjectImages ?? [];
      const currentStyle = book.artStyle;
      if (!currentStyle || !book.styleAssets) continue;
      const styleImgs = book.styleAssets[currentStyle]?.keyObjectImages ?? [];

      if (!hasKeypointsDiff(topImgs, styleImgs)) continue;
      needSync++;

      const previewObjs = topImgs.filter((i) => i.keypoints?.length).map((i) => i.objectName);
      console.log(`  - ${book.title} (${currentStyle}): ${previewObjs.join(', ')}`);

      if (DRY) continue;

      // styleAssets[currentStyle].keyObjectImages = deep copy of top-level
      if (!book.styleAssets[currentStyle]) book.styleAssets[currentStyle] = {};
      book.styleAssets[currentStyle].keyObjectImages = topImgs.map((o) => ({ ...o }));
      await postJSON(`${BASE}/api/storybooks`, { storybook: book });
      synced++;
    } catch (e) {
      failed++;
      console.error(`  ✗ ${summary.title}: ${e.message}`);
    }
    if (scanned % 30 === 0) console.log(`  scan ${scanned}/${list.length}`);
  }

  console.log(`\n=== 결과 ===`);
  console.log(`스캔: ${scanned}`);
  console.log(`sync 필요: ${needSync}`);
  if (!DRY) console.log(`sync 완료: ${synced}`);
  console.log(`실패: ${failed}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
