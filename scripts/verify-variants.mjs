// book-v2 R2 무결성 검증.
//
// 1. /api/admin/book-v2/list-bids — books/{bid}/manifest.json 에 등록된 모든 bid
// 2. 각 bid에 대해 /verify 호출 → BookVerifyResult
// 3. 종합 리포트 출력 + verify-report.json 저장

import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const API = 'http://localhost:3500/api/admin/book-v2';
const REPORT_PATH = resolve('verify-report.json');
const CONCURRENCY = 5;

async function jsonPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`); }
  if (!res.ok || json.success === false) throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 300)}`);
  return json.data;
}

async function mapWithConcurrency(items, fn, n) {
  const out = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try { out[i] = await fn(items[i], i); } catch (e) { out[i] = { __error: e.message, bid: items[i] }; }
        done++;
        process.stdout.write(`\r  ${done}/${items.length}    `);
      }
    }),
  );
  process.stdout.write('\n');
  return out;
}

async function main() {
  console.log('1) v2 manifest list...');
  const list = await jsonPost('/list-bids');
  console.log(`   ${list.count} books\n`);

  console.log('2) verify each...');
  const t0 = Date.now();
  const results = await mapWithConcurrency(list.bids, (bid) => jsonPost('/verify', { bid }), CONCURRENCY);
  const dur = Date.now() - t0;
  console.log(`   ${(dur / 1000).toFixed(1)}s\n`);

  const counts = { pass: 0, warn: 0, fail: 0 };
  let totalMissing = 0;
  const missByCategory = {
    textSlices: 0, characters: 0, covers: 0,
    pageImages: 0, audio: 0, keyObjImages: 0, vocabImages: 0,
  };
  const failed = [];
  const sampleWarnings = [];

  for (const r of results) {
    if (r?.__error) { counts.fail++; failed.push({ bid: r.bid, error: r.__error }); continue; }
    counts[r.status]++;
    const m = (r.missingTextSlices.length + r.missingCharacters.length + r.missingCovers.length +
      r.missingPageImages.length + r.missingAudio.length + r.missingKeyObjImages.length + r.missingVocabImages.length);
    totalMissing += m;
    missByCategory.textSlices += r.missingTextSlices.length;
    missByCategory.characters += r.missingCharacters.length;
    missByCategory.covers += r.missingCovers.length;
    missByCategory.pageImages += r.missingPageImages.length;
    missByCategory.audio += r.missingAudio.length;
    missByCategory.keyObjImages += r.missingKeyObjImages.length;
    missByCategory.vocabImages += r.missingVocabImages.length;
    if (r.status === 'fail') failed.push({ bid: r.bid, ...r });
    if (m > 0 && sampleWarnings.length < 5) sampleWarnings.push(r);
  }

  console.log('━━ 결과 ━━');
  console.log(`PASS: ${counts.pass}  WARN: ${counts.warn}  FAIL: ${counts.fail}\n`);
  console.log(`총 missing items: ${totalMissing}`);
  console.log('  by category:');
  for (const [k, v] of Object.entries(missByCategory)) console.log(`    ${k.padEnd(15)} ${v}`);

  if (failed.length) {
    console.log('\nFAIL 책:');
    for (const f of failed.slice(0, 10)) {
      console.log(`  ${f.bid} ${f.error ?? f.notes?.join('; ') ?? ''}`);
    }
  }
  if (sampleWarnings.length) {
    console.log('\nWARN 샘플 (앞 5권):');
    for (const w of sampleWarnings) {
      const lines = [];
      if (w.missingTextSlices.length) lines.push(`  textSlices: ${w.missingTextSlices.length}`);
      if (w.missingCharacters.length) lines.push(`  characters: ${w.missingCharacters.length}`);
      if (w.missingCovers.length) lines.push(`  covers: ${w.missingCovers.length}`);
      if (w.missingPageImages.length) lines.push(`  pageImages: ${w.missingPageImages.length} (sample: ${w.missingPageImages.slice(0, 2).join(', ')})`);
      if (w.missingAudio.length) lines.push(`  audio: ${w.missingAudio.length}`);
      if (w.missingKeyObjImages.length) lines.push(`  keyObjImages: ${w.missingKeyObjImages.length}`);
      if (w.missingVocabImages.length) lines.push(`  vocabImages: ${w.missingVocabImages.length}`);
      console.log(`${w.bid}:\n${lines.join('\n')}`);
    }
  }

  await writeFile(REPORT_PATH, JSON.stringify({ counts, missByCategory, results }, null, 2), 'utf-8');
  console.log(`\n✅ 상세 리포트: ${REPORT_PATH}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
