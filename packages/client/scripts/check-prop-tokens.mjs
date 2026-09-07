// 사물 시트가 **컷에 붙는가** — 시트 이름이 SCENE 어디에도 없으면 시트는 없는 것과 같다.
//
// 🔴 왜: 이 라인의 출발점이 사용자의 한 마디였다 — 「퐁이 08 은 의자가 중요한 사물인데 앵커로
//    미리 안 만들어 놔서 디자인이 계속 다르다」. 그래서 사물 시트 558장을 썼다. 그런데 이음매
//    검수(2026-09-07)가 퐁이에서 나머지 절반을 짚었다 — **시트 24장의 이름이 500쪽 SCENE 에
//    한 번도 없다.** 자리 토큰(`[PongiHouse]`)은 대괄호로 꼬박꼬박 찍히는데 사물만 없다.
//    쪽별로 프롬프트를 뽑는 라인이라 **시트를 만드는 것과 컷에 붙는 것은 다른 일**이고,
//    🔴 **부르지 않으면 없는 것과 같다.**
//
//   node packages/client/scripts/check-prop-tokens.mjs [시리즈]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const only = process.argv[2];
let totSheets = 0, totUnused = 0;

for (const f of fs.readdirSync(path.join(ROOT, 'docs', 'art-direction')).filter((x) => x.endsWith('-stages.md'))) {
  const key = f.replace('-stages.md', '');
  if (only && key !== only) continue;
  const sf = path.join(ROOT, 'docs', 'changjak-books', key, '_scenes.json');
  if (!fs.existsSync(sf)) continue;
  const scenes = fs.readFileSync(sf, 'utf8');
  const md = fs.readFileSync(path.join(ROOT, 'docs', 'art-direction', f), 'utf8');

  // 사물 시트 제목 = `### §2.N Name — …` (자리 시트는 §1 이라 안 센다)
  const names = [...md.matchAll(/^#{2,4} *§?2\.\d+\s+([A-Za-z][A-Za-z0-9]*)/gm)].map((m) => m[1]);
  if (!names.length) continue;
  const unused = [...new Set(names)].filter((n) => !new RegExp(`\b${n}\b`).test(scenes));
  totSheets += new Set(names).size;
  totUnused += unused.length;
  const pct = Math.round((unused.length / new Set(names).size) * 100);
  console.log(`${key.padEnd(10)} 사물 시트 ${String(new Set(names).size).padStart(2)} · SCENE 이 한 번도 안 부르는 것 ${String(unused.length).padStart(2)} (${pct}%)${unused.length ? '  ' + unused.slice(0, 12).join(' ') + (unused.length > 12 ? ` 외 ${unused.length - 12}` : '') : ''}`);
}
console.log(`\n사물 시트 ${totSheets} · 그중 SCENE 이 안 부르는 것 ${totUnused} (${Math.round((totUnused / totSheets) * 100)}%)`);
