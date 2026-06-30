#!/usr/bin/env node
/**
 * 유료화 게이팅 — 책별 isAccessibleForFree 일괄 마킹 (멱등).
 *
 * 규칙:
 *   - 무료 3권(+ __L2/__L4 형제): isAccessibleForFree = true
 *       신데렐라 1772107608499 · 인어공주 1772181399388 · 백설공주 1778555233699
 *   - 그 외 "공개(isPublic) 책": isAccessibleForFree = false  (유료 잠금)
 *   - 비공개(isPublic !== true) 책: 건드리지 않음 (스킵)
 *   - 이미 원하는 값이면 재저장 안 함 (멱등)
 *
 * 사용: node packages/server/scripts/mark-free-books.mjs --dry   (변경 미리보기)
 *       node packages/server/scripts/mark-free-books.mjs         (적용)
 */
const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const dry = process.argv.includes('--dry') || process.argv.includes('--dry-run');

const FREE_BASE_IDS = ['1772107608499', '1772181399388', '1778555233699'];
const isFree = (id) => FREE_BASE_IDS.some((b) => id === b || id.startsWith(b + '__'));

async function main() {
  const listRes = await fetch(`${BASE}/api/storybooks`);
  if (!listRes.ok) throw new Error(`GET list ${listRes.status}`);
  const books = (await listRes.json()).data;
  console.log(`전체 ${books.length}권 (${dry ? 'DRY' : 'APPLY'})\n`);

  const plan = []; // { id, title, target }
  let skipPrivate = 0;
  for (const b of books) {
    if (isFree(b.id)) {
      plan.push({ id: b.id, title: b.title, target: true });
    } else if (b.isPublic === true) {
      plan.push({ id: b.id, title: b.title, target: false });
    } else {
      skipPrivate++; // 비공개 — 건드리지 않음
    }
  }

  const freeCount = plan.filter((p) => p.target).length;
  const lockCount = plan.filter((p) => !p.target).length;
  console.log(`무료 대상: ${freeCount} · 잠금 대상: ${lockCount} · 비공개 스킵: ${skipPrivate}\n`);
  console.log('무료 책:');
  plan.filter((p) => p.target).forEach((p) => console.log(`  FREE  ${p.id}  ${p.title}`));

  let changed = 0;
  let unchanged = 0;
  let fail = 0;
  for (const p of plan) {
    try {
      const r = await fetch(`${BASE}/api/storybooks/${encodeURIComponent(p.id)}`);
      if (!r.ok) throw new Error(`GET ${r.status}`);
      const book = (await r.json()).data;
      const current = book.isAccessibleForFree;
      // 무료 = true(또는 미지정) / 잠금 = false. 원하는 값과 같으면 스킵.
      const desired = p.target;
      const effectiveCurrent = current !== false; // 미지정/true = 무료취급
      if (effectiveCurrent === desired) {
        unchanged++;
        continue;
      }
      book.isAccessibleForFree = desired;
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
      console.log(`  ${desired ? 'FREE ' : 'LOCK '} ${p.id}  ${p.title}`);
      changed++;
    } catch (e) {
      console.error(`  FAIL ${p.id}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n=== 변경 ${changed} · 그대로 ${unchanged} · 실패 ${fail} (${dry ? 'DRY — 미적용' : 'APPLIED'}) ===`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
