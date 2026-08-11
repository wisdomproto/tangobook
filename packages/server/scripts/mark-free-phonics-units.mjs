#!/usr/bin/env node
/**
 * 파닉스 **맛보기 단원** 마킹 — 무료로 열어 둘 단원에 `isAccessibleForFree: true` (멱등).
 *
 * 동화책이 무료 11권으로 "일부 공개"를 하듯 파닉스도 몇 단원을 열어 둔다. 판정 기준은 동화책과
 * 똑같은 `isAccessibleForFree` 라, 무료 단원을 늘리고 싶으면 아래 목록만 고치면 된다(코드 무변경).
 *
 * 🔴 `mark-free-books.mjs` 를 쓰지 않는 이유 — 그 스크립트는 무료 목록에 **없는 공개 책을 전부
 *    false 로 되돌린다**. 무료 3권만 하드코딩돼 있어서 지금 돌리면 나머지 무료 책들이 잠긴다.
 *    그래서 여기서는 **지정한 단원만 true 로 올리고 다른 책은 절대 건드리지 않는다.**
 *
 * 사용: node packages/server/scripts/mark-free-phonics-units.mjs --dry
 *       node packages/server/scripts/mark-free-phonics-units.mjs
 */
const BASE = process.env.SERVER_URL || 'http://localhost:3500';
const dry = process.argv.includes('--dry') || process.argv.includes('--dry-run');

/** 맛보기로 열어 두는 단원. 한글=모음·ㄱ / 영어=알파벳 첫 단원·짧은 모음 a 첫 단원. */
const FREE_UNIT_IDS = ['kr-h1-u01', 'kr-h1-u02', 'en-b1-u01', 'en-b2-u01'];

async function main() {
  const res = await fetch(`${BASE}/api/storybooks`);
  if (!res.ok) throw new Error(`GET list ${res.status}`);
  const books = (await res.json()).data;

  const targets = FREE_UNIT_IDS.map((id) => books.find((b) => b.id === id) ?? { id, missing: true });
  const missing = targets.filter((t) => t.missing);
  if (missing.length) {
    throw new Error(`목록에 없는 단원: ${missing.map((m) => m.id).join(', ')}`);
  }

  let changed = 0;
  for (const t of targets) {
    const already = t.isAccessibleForFree === true;
    console.log(
      `${already ? '   skip' : dry ? '   DRY ' : ' APPLY'}  ${t.id}  ${t.title ?? ''}${already ? '  (이미 무료)' : ''}`
    );
    if (already || dry) continue;

    const full = await (await fetch(`${BASE}/api/storybooks/${t.id}`)).json();
    const saved = await fetch(`${BASE}/api/storybooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storybook: { ...full.data, isAccessibleForFree: true } }),
    });
    if (!saved.ok) throw new Error(`save ${t.id} → ${saved.status}`);
    changed++;
  }
  console.log(`\n${dry ? '(dry) ' : ''}변경 ${changed} / 대상 ${targets.length}`);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
