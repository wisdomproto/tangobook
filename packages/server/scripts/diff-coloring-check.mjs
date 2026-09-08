#!/usr/bin/env node
/**
 * 지난번 검사와 이번 검사를 나란히 놓는다 — **무엇이 고쳐졌고 무엇이 새로 생겼나**.
 *
 * 🔴 딱지만 비교하면 「고쳤는데 딱지가 그대로」와 「안 고쳤다」가 구분이 안 된다.
 *    도안 **파일 크기**(`bytes`)로 실제로 다시 붙였는지를 먼저 가른다.
 *
 * 사용: node packages/server/scripts/diff-coloring-check.mjs <이전 coloring-check.json> [이전 flags.json]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..', '..', '..');
const [prevPath, prevFlagsPath] = process.argv.slice(2);

const prev = new Map(JSON.parse(fs.readFileSync(prevPath, 'utf8')).map((m) => [m.key, m]));
const now = JSON.parse(fs.readFileSync(path.join(ROOT, 'coloring-check.json'), 'utf8'));
const nowFlags = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'coloring-plan-flags.json'), 'utf8')
);
const prevFlags = prevFlagsPath ? JSON.parse(fs.readFileSync(prevFlagsPath, 'utf8')) : {};

const nowKeys = new Set(now.map((m) => m.key));
const label = (m) => `${m.key} ${m.word} (${m.group}/${m.section})`;

const repasted = [];
for (const m of now) {
  const p = prev.get(m.key);
  if (p && p.bytes !== m.bytes) repasted.push(m);
}
const gone = [...prev.keys()].filter((k) => !nowKeys.has(k));
const brandNew = now.filter((m) => !prev.has(m.key));

const fixed = [], stillBad = [], regressed = [], changedKind = [];
for (const m of now) {
  const was = prevFlags[m.key], is = nowFlags[m.key];
  if (was && !is) fixed.push(m);
  else if (!was && is) regressed.push(m);
  else if (was && is && was.why !== is.why) changedKind.push({ m, was, is });
  else if (was && is) stillBad.push(m);
}

const count = (v, lvl) => v.filter((m) => (nowFlags[m.key] ?? prevFlags[m.key] ?? {}).level === lvl).length;
console.log(`도안 ${now.length}장 (지난번 ${prev.size}장)`);
console.log(`  다시 붙인 것        ${repasted.length}장`);
console.log(`  지운 것             ${gone.length}장${gone.length ? ' — ' + gone.map((k) => `${k} ${prev.get(k).word}`).join(', ') : ''}`);
if (brandNew.length) console.log(`  처음 보는 것        ${brandNew.length}장`);
console.log('');
console.log(`딱지 ${Object.keys(prevFlags).length} → ${Object.keys(nowFlags).length}`);
console.log(`  ✅ 없어진 딱지      ${fixed.length}장 (다시 뽑을 것 ${count(fixed, 'bad')} · 살펴볼 것 ${count(fixed, 'warn')} · 색 ${count(fixed, 'color')})`);
console.log(`  🔁 흠이 바뀐 것     ${changedKind.length}장`);
console.log(`  ⏸ 그대로           ${stillBad.length}장`);
console.log(`  🔴 새로 생긴 딱지   ${regressed.length}장 (다시 뽑을 것 ${count(regressed, 'bad')} · 살펴볼 것 ${count(regressed, 'warn')} · 색 ${count(regressed, 'color')})`);

const show = (title, rows, fmt) => {
  if (!rows.length) return;
  console.log(`\n── ${title} ──`);
  for (const r of rows.slice(0, 60)) console.log('  ' + fmt(r));
  if (rows.length > 60) console.log(`  … 그리고 ${rows.length - 60}장`);
};
show('새로 생긴 딱지', regressed.filter((m) => nowFlags[m.key].level !== 'color'),
  (m) => `${label(m)} — ${nowFlags[m.key].why}`);
show('흠이 바뀐 것', changedKind.filter((c) => c.is.level !== 'color' || c.was.level !== 'color'),
  (c) => `${label(c.m)}\n      전: ${c.was.why}\n      후: ${c.is.why}`);
show('다시 붙였는데 딱지가 남은 것', repasted.filter((m) => nowFlags[m.key] && nowFlags[m.key].level !== 'color'),
  (m) => `${label(m)} — ${nowFlags[m.key].why}`);
show('안 고친 것 (다시 뽑을 것)', stillBad.filter((m) => nowFlags[m.key].level === 'bad' && !repasted.includes(m)),
  (m) => `${label(m)} — ${nowFlags[m.key].why}`);
