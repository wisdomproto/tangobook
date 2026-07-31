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

// 🔴 **첫 장은 슬러그마다 달라야 한다.** 화면에 뜨는 건 `refs[0]` 한 장뿐이라, 두 권이 같은 그림을
//    첫 장으로 가지면 **그리는 사람이 두 책을 같은 그림체로 그린다**(그 사람은 글보다 그림을 먼저 본다).
//    담당 넷이 병렬로 고르니 같은 그림을 동시에 집는 건 막을 수 없다 — 실제로 한 배치에서
//    `rolfe-dyslexia` 가 네 권, `virardi-instant` 가 네 권에 걸렸다. 후보를 셋씩 갖고 있으므로
//    **안 쓰인 후보로 민다**. 정확도를 조금 잃지만, 같은 그림 두 장은 아무것도 안 알려 준다.
//    ⚠️ 공유 슬러그(짝)는 **같은 그림을 써야 맞으므로** 슬러그 단위로 본다.
const claimed = new Map(); // refId → slug
const bumped = [];
for (const [id, e] of Object.entries(db)) {
  if (!e.refs?.length) continue;
  const owner = claimed.get(e.refs[0].id);
  if (!owner || owner === e.slug) {
    claimed.set(e.refs[0].id, e.slug);
    continue;
  }
  const alt = e.refs.findIndex((r, i) => i > 0 && !claimed.has(r.id));
  if (alt < 0) {
    bumped.push(`🔴 ${id}(${e.slug}) — 후보 셋이 전부 남에게 잡혔다. 첫 장이 ${owner} 와 겹친 채로 둔다`);
    continue;
  }
  const [pick] = e.refs.splice(alt, 1);
  e.refs.unshift(pick);
  claimed.set(pick.id, e.slug);
  bumped.push(`  ${id} 첫 장 → ${pick.id} (원래 것이 ${owner} 와 겹침)`);
}
if (bumped.length) console.log('\n첫 장 중복 정리\n' + bumped.join('\n'));

writeFileSync(TARGET, JSON.stringify(db, null, 2) + '\n');

const missing = Object.keys(slugOf).filter((id) => !db[id]);
console.log(`\n조각에서 ${added}개 · 공유 슬러그로 ${inherited}개 → 총 ${Object.keys(db).length}/${Object.keys(slugOf).length}권`);
if (missing.length) console.log(`🔴 아직 없음: ${missing.join(' ')}`);
