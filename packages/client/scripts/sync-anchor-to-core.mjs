// 앵커 SSOT(`docs/art-direction/<key>-anchor.md`) → `public/<key>-core.js` 의 ANCHOR.text 동기화.
//
// 🔴 왜: 컷 프롬프트를 합성하는 것은 .md 가 아니라 core.js 다. 앵커를 고치고 core.js 를 안 고치면
//    **고친 조항이 그림에 한 글자도 안 닿는다.** 2026-09-04 에 pipo·dingding 둘 다 그 상태였다
//    (dingding core.js 는 `ONE WHITE CHANNEL ... ON EVERY PAGE` 를 아직 들고 있었다).
// 🔴 plan.html 은 같은 글을 <pre> 로 한 번 더 들고 있는데 그건 **보여 주기용**이라 안 건드린다 —
//    프롬프트는 core.js 에서만 나온다. 갈라지면 그 <pre> 를 지우고 core.js 를 읽게 하는 게 답이다.
//
//   node packages/client/scripts/sync-anchor-to-core.mjs <key> [...]   (--check = 쓰지 않고 대조만)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const ART = path.join(ROOT, 'docs', 'art-direction');
const PUB = path.join(ROOT, 'packages', 'client', 'public');

const args = process.argv.slice(2);
const check = args.includes('--check');
const keys = args.filter((a) => !a.startsWith('--'));
if (!keys.length) { console.error('사용: sync-anchor-to-core.mjs <key> [...] [--check]'); process.exit(2); }

/** .md 의 ```펜스``` 중 `STYLE ANCHOR -` 로 시작하는 블록 하나. 없거나 둘이면 실패시킨다. */
function anchorBlock(md, slug) {
  // 🔴 .md 가 CRLF 다 — \r 을 안 지우면 블록을 0개로 세고, core.js 에는 \r 이 섞여 들어간다.
  const blocks = [...md.replace(/\r\n/g, '\n').matchAll(/```\n(STYLE ANCHOR -[\s\S]*?)\n```/g)].map((m) => m[1]);
  if (blocks.length === 1) return blocks[0];
  // 🔴 앵커가 여럿인 파일이 있다(2026-09-04: pongi 는 A~D 넷을 들고 A 만 라이브, B·C·D 는 **보류**라
  //    지우지 않는다). 「1개여야 한다」로 던지면 그런 시리즈는 영영 동기화가 안 된다 —
  //    **어느 것이 라이브인지는 core.js 가 이미 slug 로 말하고 있으므로** 그것으로 고른다.
  const hit = blocks.filter((b) => b.startsWith(`STYLE ANCHOR - ${slug}`));
  if (hit.length !== 1) {
    throw new Error(`STYLE ANCHOR 블록 ${blocks.length}개 중 slug "${slug}" 와 맞는 것이 ${hit.length}개다`);
  }
  return hit[0];
}

/** core.js 의 `var ANCHOR = { slug: '…'` — 여러 앵커 중 라이브를 고르는 열쇠. */
function coreSlug(js) {
  const m = js.slice(js.indexOf('var ANCHOR')).match(/slug:\s*'([^']+)'/);
  if (!m) throw new Error('core.js 에서 ANCHOR.slug 를 못 찾았다');
  return m[1];
}

/** core.js 의 `text: "…"` 문자열 리터럴 범위. 이스케이프된 따옴표를 건너뛴다. */
function textLiteral(js) {
  const start = js.indexOf('text: "', js.indexOf('var ANCHOR'));
  if (start < 0) throw new Error('core.js 에서 ANCHOR.text 를 못 찾았다');
  const from = start + 'text: "'.length;
  for (let i = from; i < js.length; i++) {
    if (js[i] === '\\') { i++; continue; }
    if (js[i] === '"') return { from, to: i };
  }
  throw new Error('ANCHOR.text 의 닫는 따옴표를 못 찾았다');
}

let bad = 0;
for (const key of keys) {
  const mdPath = path.join(ART, `${key}-anchor.md`);
  const jsPath = path.join(PUB, `${key}-core.js`);
  const js = fs.readFileSync(jsPath, 'utf8');
  const want = anchorBlock(fs.readFileSync(mdPath, 'utf8'), coreSlug(js));
  const { from, to } = textLiteral(js);
  const have = JSON.parse(`"${js.slice(from, to)}"`);
  if (have === want) { console.log(`${key.padEnd(10)} ✓ 같다`); continue; }
  bad += 1;
  if (check) { console.log(`${key.padEnd(10)} 🔴 갈라졌다 (.md ${want.length}자 · core.js ${have.length}자)`); continue; }
  const lit = JSON.stringify(want).slice(1, -1);
  fs.writeFileSync(jsPath, js.slice(0, from) + lit + js.slice(to), 'utf8');
  console.log(`${key.padEnd(10)} → core.js 갱신 (${have.length} → ${want.length}자)`);
}
process.exit(check && bad ? 1 : 0);
