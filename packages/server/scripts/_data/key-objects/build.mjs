import fs from 'node:fs';
import { has } from './lib-match.mjs';
import { SENSES2, OVERRIDE2 } from './senses2.mjs';
import { LIFE } from './picks-life.mjs';
import { JEONRAE } from './picks-jeonrae.mjs';
import { CHANGJAK } from './picks-changjak.mjs';

const first = JSON.parse(fs.readFileSync('hori-changjak-key-objects.json', 'utf8'));  // 1차(파닉스 매칭분)
const units = JSON.parse(fs.readFileSync('kr-phonics-words.json', 'utf8'));
const unitOf = {};
for (const u of units) for (const w of u.words) unitOf[w] = u.id;
const phonicsWords = new Set(Object.keys(unitOf));

const t3 = JSON.parse(fs.readFileSync('texts3.json', 'utf8'));                       // 생활 43 + 전래 40
const { hori, changjak } = JSON.parse(fs.readFileSync('texts.json', 'utf8'));
const cj = changjak.map((b) => ({ ...b, category: '창작동화', existing: [] }));
const byId = new Map([...t3, ...cj, ...hori.map((b) => ({ ...b, existing: [] }))].map((b) => [b.id, b]));

const sensesOf = (w) => {
  const v = SENSES2[w] ?? first.senses[w];
  if (!v) throw new Error(`뜻 없음: ${w}`);
  return typeof v === 'string' ? [{ id: w, gloss: v, phonics: phonicsWords.has(w) }] : v;
};

const out = [];
const seen = new Set();
const add = (bookId, word, source) => {
  const b = byId.get(bookId);
  const key = `${bookId}|${word}`;
  if (seen.has(key)) return;
  const pages = b.pages.filter((p) => has(p.text, word)).map((p) => p.n);
  if (!pages.length) return;
  const list = sensesOf(word);
  const senseId = OVERRIDE2[key] ?? first.entries.find((e) => e.bookId === bookId && e.word === word)?.senseId ?? list[0].id;
  const sense = list.find((s) => s.id === senseId) ?? list[0];
  seen.add(key);
  out.push({
    line: b.category ?? '창작동화', bookId, title: b.title, word,
    senseId: sense.id, description: sense.gloss, pages,
    phonicsUnit: sense.phonics && phonicsWords.has(word) ? unitOf[word] : null,
    source,
  });
};

// 1) 이미 R2 에 들어 있는 핵심단어 (생활 55 + 전래 200)
for (const b of t3)
  for (const k of b.existing) {
    const w = (k.w ?? '').trim();
    if (!w) continue;
    seen.add(`${b.id}|${w}`);
    out.push({
      line: b.category, bookId: b.id, title: b.title, word: w,
      senseId: w, description: k.d || '', pages: k.pages ?? [],
      phonicsUnit: phonicsWords.has(w) ? unitOf[w] : null, source: 'existing',
    });
  }
// 2) 1차 추출(호리 유치원·세상 탐험은 이번 범위 밖이지만 결과는 보존)
for (const e of first.entries) { if (byId.has(e.bookId)) { seen.add(`${e.bookId}|${e.word}`); out.push({ ...e, line: e.category ?? e.line, source: 'pass1' }); } }
// 3) 이번 추출
for (const [id, ws] of Object.entries(LIFE)) for (const w of ws) add(id, w, 'new');
for (const [id, ws] of Object.entries(JEONRAE)) for (const w of ws) add(id, w, 'new');
for (const [id, ws] of Object.entries(CHANGJAK)) for (const w of ws) add(id, w, 'new');

// ── 권당 4~8 로 맞춘다. 8 초과분은 R2 에 이미 있는 것은 두고, 새로 뽑은 것 중
//    등장 쪽이 가장 적은 낱말부터 덜어낸다(그 책이 덜 다루는 것). ──
const grouped = {};
for (const e of out) (grouped[e.bookId] ??= []).push(e);
const trimmed = [];
for (const es of Object.values(grouped)) {
  if (es.length <= 8) { trimmed.push(...es); continue; }
  const keep = es.filter((e) => e.source === 'existing');
  const rest = es.filter((e) => e.source !== 'existing')
    .sort((a, b) => (b.phonicsUnit ? 1 : 0) - (a.phonicsUnit ? 1 : 0) || b.pages.length - a.pages.length);
  trimmed.push(...keep, ...rest.slice(0, Math.max(0, 8 - keep.length)));
}
out.length = 0;
out.push(...trimmed);

// ── 집계 ──
const per = {};
for (const e of out) (per[e.bookId] ??= []).push(e);
const stat = {};
for (const [id, es] of Object.entries(per)) {
  const line = es[0].line;
  (stat[line] ??= { 책: 0, 핵심단어: 0, 파닉스매칭: 0, n: [] });
  stat[line].책++; stat[line].핵심단어 += es.length;
  stat[line].파닉스매칭 += es.filter((e) => e.phonicsUnit).length;
  stat[line].n.push(es.length);
}
console.table(Object.fromEntries(Object.entries(stat).map(([k, v]) => [k, {
  책: v.책, 핵심단어: v.핵심단어, 권당: +(v.핵심단어 / v.책).toFixed(1),
  최소: Math.min(...v.n), 최대: Math.max(...v.n), 파닉스매칭: v.파닉스매칭,
}])));

const covered = new Set(out.filter((e) => e.phonicsUnit).map((e) => e.word));
const existingBooks = JSON.parse(fs.readFileSync('match-ko.json', 'utf8'));
const before = new Set(existingBooks.rows.filter((r) => r.exactBooks > 0).map((r) => r.word));
const all = new Set(Object.keys(unitOf));
const added = [...covered].filter((w) => !before.has(w));
console.log(`\n파닉스 고유 ${all.size}단어`);
console.log(`  기존 매칭 ${before.size} + 새로 ${added.length} = ${new Set([...before, ...covered]).size}`);
console.log(`  새로: ${added.sort().join(' ')}`);

fs.writeFileSync('final-key-objects.json', JSON.stringify({
  note: '생활동화·전래동화·창작동화 핵심단어 (+1차에서 뽑은 호리 유치원·세상 탐험). senseId 로 동음이의어를 가르고, 파닉스와 뜻이 같을 때만 phonicsUnit 을 채운다.',
  senses: { ...first.senses, ...SENSES2 }, entries: out,
}, null, 1));
