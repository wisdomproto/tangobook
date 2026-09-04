#!/usr/bin/env node
/**
 * 독서 레벨 감사 — 선언된 `readingLevel` 과 **본문 실측**을 나란히 놓는다.
 *
 * 왜 스크립트인가: 🔴 목록 API(`/api/storybooks`)에는 `readingLevel` 이 **없다**
 * (`StorybookSummary` 미포함). 목록에서 세면 무조건 0 이 나온다 — 실제로 그렇게 틀린 적이 있다.
 * 책을 하나씩 열어야 하고, 맨손으로 매번 세면 그때그때 다른 걸 세게 되므로 여기 고정한다.
 *
 * 레벨 기준 (`packages/shared/src/types/storybook.ts` ReadingLevel):
 *   L1 씨앗 3~4세 · 1문장/쪽 · 총 ≤50낱말 · 반복 구문
 *   L2 새싹 4~6세 · 1~4문장/쪽 · 총 80~350낱말
 *   L3 나무 6~7세 · 3~5문장/쪽 · 총 400~700낱말
 *
 * 낱말 = 한국어 **어절**(공백 분리). 문장 = 종결부호 개수(쪽당 최소 1).
 *
 * 사용:
 *   node packages/server/scripts/audit-reading-levels.mjs
 *   node packages/server/scripts/audit-reading-levels.mjs --api=http://localhost:3500
 *   node packages/server/scripts/audit-reading-levels.mjs --public-only
 *   node packages/server/scripts/audit-reading-levels.mjs --json=out.json
 */

const args = process.argv.slice(2);
const argOf = (name, dflt) => {
  const eq = args.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : dflt;
};
const API = argOf('api', 'https://www.tangobook.co.kr').replace(/\/$/, '');
const PUBLIC_ONLY = args.includes('--public-only');
const JSON_OUT = argOf('json', null);
const CONCURRENCY = Number(argOf('concurrency', 12));

// 🔴 판정 규칙은 여기 없다 — build-content-status.mjs 와 **같은 사본**을 쓴다.
import { classify, measure } from './_reading-level.mjs';

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        try {
          out[k] = await fn(items[k]);
        } catch {
          out[k] = null;
        }
      }
    })
  );
  return out;
}

const median = (a) => {
  if (!a.length) return 0;
  const s = [...a].sort((x, y) => x - y);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
};
const pad = (v, n) => String(v).padStart(n);
const padR = (v, n) => String(v) + ' '.repeat(Math.max(0, n - [...String(v)].reduce((w, c) => w + (c.charCodeAt(0) > 0x2e80 ? 2 : 1), 0)));

(async () => {
  const list = await fetch(`${API}/api/storybooks`).then((r) => r.json());
  let books = (list.data || list).filter((b) => (b.type || 'storybook') !== 'phonics');
  if (PUBLIC_ONLY) books = books.filter((b) => b.isPublic);
  console.log(`대상 ${books.length}권 (${PUBLIC_ONLY ? '공개만' : '비공개 포함'}) — ${API}\n`);

  let done = 0;
  const full = await pool(books, CONCURRENCY, async (b) => {
    const d = await fetch(`${API}/api/storybooks/${b.id}`).then((r) => r.json());
    const sb = d.data || d;
    if (++done % 100 === 0) process.stderr.write(`  ...${done}/${books.length}\n`);
    if (!sb || !sb.id) return null;
    const m = measure(sb);
    return {
      id: sb.id,
      title: sb.title || '',
      category: sb.category || '(없음)',
      isPublic: !!sb.isPublic,
      declared: sb.readingLevel || null,
      actual: classify(m.words, m.sentPerPage),
      ...m,
    };
  });

  const rows = full.filter(Boolean);
  const byCat = {};
  for (const r of rows) (byCat[r.category] = byCat[r.category] || []).push(r);

  const LV = ['L1', 'L2', 'L3'];
  console.log('카테고리별 — 선언된 readingLevel / 본문 실측\n');
  console.log(
    `${padR('카테고리', 22)}${pad('권', 5)} │ ${pad('선언 L1', 7)}${pad('L2', 5)}${pad('L3', 5)}${pad('없음', 6)} │ ${pad('실측 L1', 7)}${pad('L2', 5)}${pad('L3', 5)} │ ${pad('낱말중앙', 9)}${pad('쪽', 4)}`
  );
  console.log('─'.repeat(104));

  const cats = Object.entries(byCat).sort((a, b) => b[1].length - a[1].length);
  for (const [cat, rs] of cats) {
    const dc = (l) => rs.filter((r) => r.declared === l).length;
    const ac = (l) => rs.filter((r) => r.actual === l).length;
    console.log(
      `${padR(cat, 22)}${pad(rs.length, 5)} │ ${pad(dc('L1'), 7)}${pad(dc('L2'), 5)}${pad(dc('L3'), 5)}${pad(rs.filter((r) => !r.declared).length, 6)} │ ${pad(ac('L1'), 7)}${pad(ac('L2'), 5)}${pad(ac('L3'), 5)} │ ${pad(median(rs.map((r) => r.words)), 9)}${pad(median(rs.map((r) => r.textPages)), 4)}`
    );
  }

  const tot = (f) => rows.filter(f).length;
  console.log('─'.repeat(104));
  console.log(
    `${padR('합계', 22)}${pad(rows.length, 5)} │ ${pad(tot((r) => r.declared === 'L1'), 7)}${pad(tot((r) => r.declared === 'L2'), 5)}${pad(tot((r) => r.declared === 'L3'), 5)}${pad(tot((r) => !r.declared), 6)} │ ${pad(tot((r) => r.actual === 'L1'), 7)}${pad(tot((r) => r.actual === 'L2'), 5)}${pad(tot((r) => r.actual === 'L3'), 5)} │ ${pad(median(rows.map((r) => r.words)), 9)}${pad(median(rows.map((r) => r.textPages)), 4)}`
  );

  const mismatch = rows.filter((r) => r.declared && r.actual && r.declared !== r.actual);
  console.log(`\n선언 ≠ 실측: ${mismatch.length}권 / 선언 있는 ${tot((r) => !!r.declared)}권`);
  for (const l of LV) {
    const n = mismatch.filter((r) => r.declared === l).length;
    if (n) console.log(`  선언 ${l} 인데 실측 다름: ${n}권`);
  }

  if (JSON_OUT) {
    const fs = await import('node:fs');
    fs.writeFileSync(JSON_OUT, JSON.stringify(rows, null, 2));
    console.log(`\n권별 상세 → ${JSON_OUT}`);
  }
})();
