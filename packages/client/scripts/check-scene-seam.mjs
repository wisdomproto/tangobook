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
// 🔴 **둘째 그물 — 「말하는 쪽에 말하는 입이 없다」**(2026-09-07). 이음매 검수 열두 묶음 중 **여섯 시리즈**가
//    따로 같은 신고를 했고(mei 10쪽 · coco 19 · bruno 21 · dingding 9 · nono 7 · dodo 4), 첫째 그물은
//    **한 쪽도 못 찍었다** — 지문의 인물만 보기 때문이다. 이 그물은 반대로 **대사가 있는 쪽에서 SCENE
//    인물 칸에 말하는 표시가 하나도 없는 쪽**을 센다. bruno 검수자가 「세는 그물을 하나 더 만든다면
//    그것이 수확이 가장 크다」고 짚어 준 그물이다.
//    ⚠️ 후보다 — 「입을 앙 다문다」가 곧 그 쪽의 뜻인 자리가 있다(bruno 32 p2 · mei 16 p8).
//
//   node packages/client/scripts/check-scene-seam.mjs [시리즈] [--both] [--speak]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseBooks, loadScenes } from './_series-parse.mjs';
import { SERIES } from './_series-config.mjs';

const DOCS = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', 'docs', 'changjak-books');
const only = process.argv[2]?.startsWith('--') ? null : process.argv[2];
const BOTH = process.argv.includes('--both');
const SPEAK = process.argv.includes('--speak');
// 말하는 표시 — 입/부리를 벌리거나, 말하는 동사가 인물 칸에 있으면 화자가 그려진 것으로 본다.
// 🔴 **「입」이 있다고 말하는 것이 아니다**(2026-09-07, lulu 26~50). 「입이 꾹 다물렸다」·「입꼬리가
// 올라갔다」·「입이 옆으로 삐죽」은 **말 신호가 아니라 그 반대**다. 그래서 **벌어진 입만** 센다.
const SAYS = /(?:입|부리|입가|입술)[^.,]{0,12}(?:벌어|벌리|열리|열린|크게 열|헤벌)|말한다|말하는|외친다|외치|묻는다|물어본|소곤|속삭|노래(?:한다|해|를 부)|중얼|읊|턱이 벌/;

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
      // 🔴 **부재·부정·회상 문장은 빼야 한다**(2026-09-07, mina 26~50 검수). 「엄마는 장에 **갔어요**」·
      //    「엄마가 **안 보여요**」·「엄마를 **부르지 않고**」·「엄마가 늘 하던 말이 **생각났어요**」는
      //    조사를 달고 있지만 **그 쪽에 없는 것이 오히려 그 쪽의 뜻**이다. 후보 여섯 중 다섯이 이것이었다.
      const ABSENT = /없|안 보|못 보|안 오|못 오|갔어요|떠났|생각났|않고|않았/;
      const acts = (t, a) => t.split(/(?<=[.!?])\s+/).some((sent) =>
        new RegExp(`${a}(?:가|이|은|는|도|를|을|에게|한테|와|과|랑|야|아)(?![가-힣])`).test(sent) && !ABSENT.test(sent));
      const inProse = cast.filter((c) => c.aliases.some((a) => /[가-힣]/.test(a) && acts(narration(pg.ko), a)));
      const inScene = (c) => c.aliases.some((a) => who.includes(a));
      const gone = inProse.filter((c) => !inScene(c));
      if (gone.length) { lines.push(`  ${id} p${pg.n} 🔴 본문에 선 인물이 그림에 없다 — ${gone.map((c) => c.name).join('·')}`); missing += 1; }
      if (SPEAK) {
        // 지문이 아니라 **따옴표 안**이 있어야 대사 쪽이다.
        if (/"[^"]+"|[“][^”]+[”]/.test(pg.ko) && who && !SAYS.test(who)) {
          lines.push(`  ${id} p${pg.n} 🗣 대사가 있는데 인물 칸에 말하는 표시가 없다`);
          extra += 1;
        }
      }
      if (BOTH) {
        const added = cast.filter((c) => inScene(c) && !inProse.includes(c) && !pg.ko.includes(c.name));
        if (added.length) { lines.push(`  ${id} p${pg.n} ⚠️ 그림에만 있는 인물 — ${added.map((c) => c.name).join('·')}`); extra += 1; }
      }
    }
  }
  if (lines.length) console.log(`=== ${key} (${lines.length}) ===\n${lines.slice(0, 40).join('\n')}${lines.length > 40 ? `\n  … 외 ${lines.length - 40}` : ''}`);
}
console.log(`\n${pages}쪽 · 본문에 선 인물이 그림에 없는 쪽 ${missing}${BOTH ? ` · 그림에만 있는 인물 ${extra}` : ''}`);
