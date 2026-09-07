#!/usr/bin/env node
/**
 * 색칠 게임이 읽을 목록(`public/coloring/manifest.json`)을 **붙여넣은 도안에서** 만든다.
 *
 * 작업판(`/coloring-plan.html`)에 사람이 붙인 도안은 R2 `comic-assets/coloring-plan/<key>` 에 있다.
 * 여기서는 작업판 목록(`coloring-plan-data.json`)과 붙여넣기 목록을 맞춰 게임 목록을 굽는다.
 *
 * 🔴 **주소는 `/api/r2-proxy` 를 거친다.** R2 공개 호스트(`pub-*.r2.dev` · `assets.tangobook.co.kr`)는
 *    CORS 헤더를 안 준다 — 게임은 도안과 원본 삽화의 **픽셀을 읽어야** 하므로(칸 나누기·정답색),
 *    `crossOrigin="anonymous"` 로 못 받으면 화면이 통째로 안 뜬다. 프록시는 같은 오리진이라 문제없다.
 *
 * 사용:
 *   node packages/server/scripts/build-coloring-manifest.mjs [--origin=https://www.tangobook.co.kr]
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, '..', '..', 'client', 'public', 'coloring', 'manifest.json');
const arg = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? a.slice(n.length + 3) : d;
};
const ORIGIN = arg('origin', 'https://www.tangobook.co.kr');
/**
 * 게임에 안 넣을 도안 — `check-coloring-sheets.mjs` 가 재서 넣는다.
 *
 * 🔴 **칠할 칸이 없는 도안은 카드로 두면 안 된다.** 팔레트가 비어 아이가 아무것도 못 하고
 *    끝나지도 않는다(하늘·강처럼 사물이 아닌 낱말이거나 선이 테두리로 열린 것들).
 */
const SKIP = JSON.parse(fs.readFileSync(path.join(__dirname, '_data', 'coloring-skip.json'), 'utf8'));

/** 공개 URL → R2 키. 호스트가 둘(직접·CDN)이라 경로만 본다. */
const proxy = (url) => `/api/r2-proxy?key=${encodeURIComponent(decodeURIComponent(new URL(url).pathname).slice(1))}`;

/** 낱말 음원을 어느 언어로 만들지 — 파닉스 그룹 id 가 곧 언어다. */
const LANG_BY_GROUP = { 'phonics-en': 'english', 'phonics-zh': 'zh' };

const assets = (await (await fetch(`${ORIGIN}/api/comic-assets/coloring-plan`)).json()).data;
const plan = await (await fetch(`${ORIGIN}/coloring-plan-data.json`)).json();

const sheets = [];
let missing = 0;
let skipped = 0;
for (const g of plan.groups) {
  for (const s of g.sections) {
    for (const it of s.items) {
      const pasted = assets[it.key];
      if (!pasted) {
        missing++;
        continue;
      }
      if (SKIP[it.key]) {
        skipped++;
        continue;
      }
      sheets.push({
        key: it.key,
        group: g.label,
        section: s.label,
        // 음원 캐시 키 — 파닉스는 단원 id, 동화책은 책 id
        unitId: it.unit ?? it.bookId ?? g.id,
        word: it.word,
        language: LANG_BY_GROUP[g.id] ?? 'korean',
        lineartUrl: proxy(pasted),
        // 🔴 정답본은 안 만든다 — 칸 색은 원본 삽화에서 읽는다(도안이 원본을 보고 그린 그림이라 자리가 겹친다).
        originalUrl: proxy(it.imageUrl),
      });
    }
  }
}

fs.writeFileSync(OUT, JSON.stringify(sheets));
const byGroup = {};
for (const s of sheets) byGroup[s.group] = (byGroup[s.group] ?? 0) + 1;
console.log(
  `${sheets.length}장 → ${OUT}` +
    (missing ? ` · 아직 안 붙인 것 ${missing}장` : '') +
    (skipped ? ` · 칠할 칸이 없어 뺀 것 ${skipped}장` : '')
);
for (const [g, n] of Object.entries(byGroup)) console.log(`  ${g.padEnd(16)} ${n}장`);
console.log(`  ${(fs.statSync(OUT).size / 1024).toFixed(0)}KB`);
