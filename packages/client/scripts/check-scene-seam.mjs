// 본문 ↔ SCENE 이음매 기계 검사 — 8,500쪽 전수.
//
// 🔴 이음매 검수는 판단이 대부분이라(한 장으로 그려지나 · 네 살이 무엇을 아나) 사람·에이전트 몫이지만,
//    **「본문에 선 인물이 그림에 없다」는 기계가 전수로 잡는다.** 실제로 그 결함이 나온 적이 있다 —
//    메타에 있는 모모가 본문 열 쪽에 한 번도 안 나왔고, 아무도 못 봤다.
// 🔴 **따옴표 안은 「있다」의 증거가 아니다** — 「엄마가 부르셔」의 엄마는 그 쪽에 없다. 지문만 센다.
// ⚠️ 반대 방향(SCENE 에만 있는 인물)은 결함이 아닐 수 있다 — 그림은 글보다 넓다. 후보로만 낸다.
// 🔴 **이름이 나온다 ≠ 그 몸이 그 쪽에 있다**(표본 넷을 눈으로 열어 확인, 2026-09-07). 「라주 **것**이
//    커 보여요」·「미나 **화분**만 말랐어요」는 사물의 임자일 뿐이라 그리면 안 되는 인물이다. 그래서
//    **조사로 거른다** — 이름 뒤에 주격·목적격·여격이 붙은 것만 「이 쪽에 있다」로 센다.
//    ⚠️ 남는 오검출 하나 = 「미나**가** 가리킨 쪽으로」 같은 **관형절**(지난 일이라 그 쪽엔 없다).
//
//   node packages/client/scripts/check-scene-seam.mjs [시리즈] [--both]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBooks, loadScenes } from './_series-parse.mjs';
import { SERIES } from './_series-config.mjs';

const DOCS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'changjak-books');
const only = process.argv[2]?.startsWith('--') ? null : process.argv[2];
const BOTH = process.argv.includes('--both');

const narration = (ko) => ko.replace(/"[^"]*"/g, ' ').replace(/[“][^”]*[”]/g, ' ');
const personLabel = (html) => (String(html).match(/<b>인물<\/b>([\s\S]*?)(?:<br\s*\/?>\s*<b>|$)/) ?? [])[1] ?? '';

let missing = 0, extra = 0, pages = 0;
for (const key of Object.keys(SERIES).filter((k) => !only || k === only)) {
  const dir = path.join(DOCS, key);
  if (!fs.existsSync(dir)) continue;
  const books = parseBooks(dir);
  const scenes = loadScenes(dir);
  const cast = SERIES[key].cast ?? [];
  const lines = [];
  for (const [id, bk] of [...books].sort((a, b) => a[0].localeCompare(b[0]))) {
    for (const pg of bk.pages) {
      const html = scenes[id]?.[`p${pg.n}`];
      if (!html) continue;
      pages += 1;
      const who = personLabel(html);
      const acts = (t, a) => new RegExp(`${a}(?:가|이|은|는|도|를|을|에게|한테|와|과|랑|야|아)(?![가-힣])`).test(t);
      const inProse = cast.filter((c) => c.aliases.some((a) => /[가-힣]/.test(a) && acts(narration(pg.ko), a)));
      const inScene = (c) => c.aliases.some((a) => who.includes(a));
      const gone = inProse.filter((c) => !inScene(c));
      if (gone.length) { lines.push(`  ${id} p${pg.n} 🔴 본문에 선 인물이 그림에 없다 — ${gone.map((c) => c.name).join('·')}`); missing += 1; }
      if (BOTH) {
        const added = cast.filter((c) => inScene(c) && !inProse.includes(c) && !pg.ko.includes(c.name));
        if (added.length) { lines.push(`  ${id} p${pg.n} ⚠️ 그림에만 있는 인물 — ${added.map((c) => c.name).join('·')}`); extra += 1; }
      }
    }
  }
  if (lines.length) console.log(`=== ${key} (${lines.length}) ===\n${lines.slice(0, 40).join('\n')}${lines.length > 40 ? `\n  … 외 ${lines.length - 40}` : ''}`);
}
console.log(`\n${pages}쪽 · 본문에 선 인물이 그림에 없는 쪽 ${missing}${BOTH ? ` · 그림에만 있는 인물 ${extra}` : ''}`);
