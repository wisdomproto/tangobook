// SCENE 이 실제로 찍은 자리 토큰 ↔ 무대 시트(§1)에 있는 토큰을 대조한다.
//
// 🔴 왜: 사물 시트를 쓰던 art-director 열 명 넘게가 **자기 시리즈에 없는 자리 시트**를 신고했다.
//    없는 것보다 나쁜 것도 나왔다 — lulu 11권 마당이 `[Piazza]` 로 찍혀 있어 화가가 광장을 그린다.
// 🔴 파일 전체에서 토큰 문자열을 찾는 방식은 못 쓴다(mina 실측) — 방금 쓴 §2 사물 시트 본문이
//    그 토큰을 언급했다는 이유로 「있음」이 된다. 그래서 **§1 절 안에서만** 찾는다.
//
//   node packages/client/scripts/check-stage-tokens.mjs [시리즈]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const DOCS = path.join(ROOT, 'docs', 'changjak-books');
const ART = path.join(ROOT, 'docs', 'art-direction');

/** stages.md 의 「자리 시트」 절만 잘라 낸다 — 사물 시트 절은 대조 대상이 아니다.
 *  🔴 절 **번호로 자르면 안 된다**(실측: taro 는 §2 가 자리·§3 이 사물, bung 도 §2, bami 는 §1 이
 *  「앵커가 대신한다」). 번호로 자른 첫 판이 taro 주 무대 `TaroYard`(107쪽)를 「없다」고 했다. */
function stageSection(key) {
  const f = path.join(ART, `${key}-stages.md`);
  if (!fs.existsSync(f)) return null;
  const md = fs.readFileSync(f, 'utf8');
  const heads = [...md.matchAll(/^#{2,3} *[^\n]*$/gm)];
  const a = heads.find((h) => h[0].includes('자리 시트'));
  if (!a) return md;                       // 자리 절이 없는 파일은 통째로 본다(있는 것을 놓치지 않게)
  const after = heads.find((h) => h.index > a.index && /사물 시트|신고|경로표/.test(h[0]));
  return md.slice(a.index, after ? after.index : md.length);
}

const only = process.argv[2];
let totMissing = 0;
for (const key of fs.readdirSync(DOCS).filter((k) => !only || k === only)) {
  const sf = path.join(DOCS, key, '_scenes.json');
  if (!fs.existsSync(sf)) continue;
  const scenes = JSON.parse(fs.readFileSync(sf, 'utf8'));

  // 쪽마다 `장소·시간` 라벨 뒤의 `[Token]` 하나
  const used = new Map();                  // 토큰 → {pages, books:Set}
  for (const [vol, pages] of Object.entries(scenes))
    for (const [p, text] of Object.entries(pages)) {
      const m = (text.match(/<b>장소·시간<\/b>\s*\[([A-Za-z][A-Za-z0-9/]*)\]/) ?? [])[1];
      if (!m) continue;
      const r = used.get(m) ?? used.set(m, { pages: 0, books: new Set() }).get(m);
      r.pages += 1; r.books.add(vol);
      void p;
    }

  const sec = stageSection(key);
  if (sec === null) { console.log(`${key.padEnd(10)} 🔴 stages.md 자체가 없다 — 토큰 ${used.size}종`); totMissing += used.size; continue; }
  const missing = [...used].filter(([t]) => !sec.includes(t))
    .sort((a, b) => b[1].pages - a[1].pages);
  totMissing += missing.length;
  const line = missing.map(([t, r]) => `${t}(${r.pages}쪽·${r.books.size}권)`).join(' ');
  console.log(`${key.padEnd(10)} 토큰 ${String(used.size).padStart(2)} · 시트 없음 ${String(missing.length).padStart(2)}${line ? '  ' + line : ''}`);
}
console.log(`\n자리 시트 없는 토큰 합계 ${totMissing}`);
