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
let totBare = 0;
for (const key of fs.readdirSync(DOCS).filter((k) => !only || k === only)) {
  const sf = path.join(DOCS, key, '_scenes.json');
  if (!fs.existsSync(sf)) continue;
  const scenes = JSON.parse(fs.readFileSync(sf, 'utf8'));

  // 쪽마다 `장소·시간` 라벨 뒤의 `[Token]` 하나
  const used = new Map();                  // 토큰 → {pages, books:Set}
  // 🔴 **토큰이 아예 없는 쪽도 센다**(2026-09-04). 검사기가 *찍힌* 토큰만 대조하니, 한 권에 토큰이
  //    하나도 없으면 그 권은 조용히 「미매칭 0」으로 통과한다 — moya 다섯 권 50쪽 · dari 열 권
  //    100쪽이 그 상태였다. 「같은 …」으로 앞 쪽을 물려받는 쪽은 정상이므로 뺀다.
  const bare = [];
  for (const [vol, pages] of Object.entries(scenes))
    for (const [p, text] of Object.entries(pages)) {
      // 🔴 대괄호 안을 **글자 종류로 거르지 않는다**(2026-09-04). 예전 정규식은 `[A-Za-z0-9/]` 만 받아
      //    `[Home/마당]`·`[Alley · 자국]`·`[NoodleBoat/뱃바닥]` 처럼 한글이 섞인 토큰을 **아예 못 읽고
      //    건너뛰었고**, 안 세었으니 「미매칭 0」으로 통과했다 — 없는 것보다 나쁜 통과다
      //    (실측 2026-09-04: bung 21쪽 · nono 57쪽 · twins 26쪽 · pongi 4 · dingding 3).
      //    상태 꼬리(` · 젖음`)는 자리가 아니라 그 자리의 상태라 시트 이름에서 뗀다.
      const raw = (text.match(/<b>장소·시간<\/b>[^\[<]*\[([^\]]+)\]/) ?? [])[1];
      const m = raw?.split('·')[0].trim();
      if (!m) {
        // 🔴 대괄호 앞에 이모지가 붙어 못 읽던 쪽이 있었다(kota 22 p1 `🔴 [Kitchen]`) — 위 정규식이
        //    이제 그 사이를 건너뛴다. 그래도 없으면 되짚는 쪽인지 보고, 아니면 진짜로 안 붙은 것이다.
        const label = (text.match(/<b>장소·시간<\/b>([^<]*)/) ?? [])[1] ?? '';
        if (!/^\s*(같은|그|저|바로)\s/.test(label)) bare.push(`${vol} ${p}`);
        continue;
      }
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
  const bareBooks = new Set(bare.map((x) => x.split(' ')[0]));
  const bareNote = bare.length ? `  🔴 토큰 없는 쪽 ${bare.length}(${bareBooks.size}권: ${[...bareBooks].sort().join(',')})` : '';
  totBare += bare.length;
  console.log(`${key.padEnd(10)} 토큰 ${String(used.size).padStart(2)} · 시트 없음 ${String(missing.length).padStart(2)}${line ? '  ' + line : ''}${bareNote}`);
}
console.log(`\n자리 시트 없는 토큰 합계 ${totMissing}`);
