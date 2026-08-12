#!/usr/bin/env node
/**
 * 비어 있던 `key_objects[].description` 채우기 (명작 + 자연관찰 141권 655개).
 *
 * 설명이 없으면 「글자만 같은 매칭」을 걸러낼 수가 없다 — 눈(眼)/눈(雪), 다리(橋)/다리(脚),
 * 사과(과일)/사과(미안)가 전부 같은 낱말로 보인다. 파닉스 학습단어와 동화책 핵심단어를
 * 뜻으로 잇는 게 목적이라, 뜻이 비어 있으면 그 매칭은 검증 자체가 안 된다.
 *
 * 🔴 설명은 그 책 본문에서 그 낱말이 실제로 쓰인 문장을 보고 썼다(사람이 작성).
 *    데이터는 `_data/key-object-descriptions.json`, 키 = `${bookId}|${key_objects 인덱스}`.
 *
 * 🔴 인덱스로 물리므로 그 사이 key_objects 순서가 바뀌면 엉뚱한 낱말에 붙는다.
 *    그래서 적용 전에 저장해 둔 낱말과 현재 낱말이 같은지 대조하고, 다르면 그 항목을 건너뛴다.
 *
 * 사용: node packages/server/scripts/fill-key-object-descriptions.mjs [--apply] [--limit N]
 *       기본은 dry-run.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.API_ORIGIN ?? 'https://www.tangobook.co.kr';
const APPLY = process.argv.includes('--apply');
const LIMIT = Number((process.argv.find((a) => a.startsWith('--limit=')) ?? '').split('=')[1] || 0);

const data = JSON.parse(fs.readFileSync(path.join(HERE, '_data/key-object-descriptions.json'), 'utf8'));
const byBook = {};
for (const [key, v] of Object.entries(data.descriptions)) {
  const [id, i] = key.split('|');
  (byBook[id] ??= []).push({ i: Number(i), ...v });
}

// 141권을 연달아 부르면 중간에 ECONNRESET 이 난다. 멱등(이미 채워진 건 건너뜀)이라 재시도로 충분.
async function retry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) {
      if (i >= tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 800 * (i + 1)));
    }
  }
}

let books = 0, filled = 0, skipped = 0, mismatched = [];
const ids = Object.keys(byBook).slice(0, LIMIT || undefined);

for (const id of ids) {
  const sb = (await retry(async () => (await fetch(`${BASE}/api/storybooks/${encodeURIComponent(id)}`)).json())).data;
  if (!sb) { console.error(`책 없음: ${id}`); continue; }
  let touched = 0;
  for (const { i, word, description } of byBook[id]) {
    const k = sb.key_objects?.[i];
    if (!k) { skipped++; continue; }
    const now = (k.korean || k.name || '').trim();
    if (now !== word) { mismatched.push(`${sb.title} [${i}] 저장:${word} ≠ 현재:${now}`); continue; }
    if ((k.description ?? '').trim()) { skipped++; continue; } // 그새 채워졌으면 안 건드린다
    k.description = description;
    touched++;
  }
  if (!touched) continue;
  books++; filled += touched;
  if (APPLY) {
    const r = await retry(() => fetch(`${BASE}/api/storybooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storybook: sb }),
    }));
    if (!r.ok) { console.error(`저장 실패 ${sb.title}: ${r.status}`); continue; }
  }
  console.log(`${APPLY ? '✔' : '·'} ${sb.title} +${touched}`);
}

console.log(`\n${APPLY ? '적용' : 'dry-run'}: 책 ${books} · 설명 ${filled}개 · 건너뜀 ${skipped}`);
if (mismatched.length) {
  console.log(`\n🔴 낱말이 달라 건너뜀 ${mismatched.length}건 (key_objects 순서가 바뀐 책):`);
  mismatched.forEach((m) => console.log(`   ${m}`));
}
if (!APPLY) console.log('\n실제로 쓰려면 --apply');
