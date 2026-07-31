/**
 * 창작동화 — 앵커 원본 참조 그림을 배정 파일에 합친다
 *
 *   node packages/client/scripts/merge-changjak-anchor-refs.mjs <조각.json> [<조각.json> ...]
 *
 * 🔴 왜. `changjak-anchor-refs.json` 은 처음 10권만 갖고 있었고, 뒤에 붙인 31권은 프롬프트 안에
 *    앵커가 멀쩡히 있는데도 화면에 「앵커 미확정」으로 떴다. 배지가 프롬프트가 아니라 이 파일을
 *    보기 때문이다. 조각을 손으로 합치면 또 한 번 이런 어긋남이 생기므로 스크립트로 둔다.
 *
 * 🔴 공유 슬러그(a05↔g02 · d04↔h02 · e01↔g08)는 **짝의 원본을 물려받는다**. 같은 공정을 반대
 *    방향으로 쓰는 짝이라 원본 그림이 같아야 맞다 — 따로 고르면 화면에서 둘이 남남처럼 보인다.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const TARGET = resolve(here, '../public/changjak-anchor-refs.json');
const PROMPTS = resolve(here, '../../../docs/art-direction');

const db = JSON.parse(readFileSync(TARGET, 'utf8'));
let added = 0;
for (const f of process.argv.slice(2)) {
  for (const [id, entry] of Object.entries(JSON.parse(readFileSync(f, 'utf8')))) {
    if (!entry?.slug || !entry.refs?.length) {
      console.log(`  skip ${id} — slug 나 refs 가 비었다`);
      continue;
    }
    db[id] = entry;
    added++;
  }
}

// 프롬프트 파일에서 id→슬러그를 읽어, 짝이 이미 배정된 공유 슬러그를 물려준다
const slugOf = {};
for (const f of readdirSync(PROMPTS).filter((f) => /^changjak-[a-h]\d+-prompts\.md$/.test(f))) {
  const m = readFileSync(join(PROMPTS, f), 'utf8').match(/STYLE ANCHOR\s*[-–—]\s*(changjak-[a-z0-9-]+)/);
  if (m) slugOf[f.replace('changjak-', '').replace('-prompts.md', '')] = m[1];
}
let inherited = 0;
for (const [id, slug] of Object.entries(slugOf)) {
  if (db[id]) continue;
  const twin = Object.entries(db).find(([, v]) => v.slug === slug);
  if (!twin) continue;
  db[id] = { ...twin[1] };
  inherited++;
  console.log(`  ${id} ← ${twin[0]} (공유 슬러그 ${slug})`);
}

writeFileSync(TARGET, JSON.stringify(db, null, 2) + '\n');

const missing = Object.keys(slugOf).filter((id) => !db[id]);
console.log(`\n조각에서 ${added}개 · 공유 슬러그로 ${inherited}개 → 총 ${Object.keys(db).length}/${Object.keys(slugOf).length}권`);
if (missing.length) console.log(`🔴 아직 없음: ${missing.join(' ')}`);
