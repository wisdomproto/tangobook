/**
 * 창작동화 삽화 프롬프트: 마크다운 → 회차 페이지가 읽는 JS
 *
 *   docs/art-direction/changjak-*-prompts.md  →  public/changjak-prompts.js
 *   node packages/client/scripts/build-changjak-prompts.mjs
 *
 * 🔴 스타일 앵커 / 캐릭터 시트 / 12컷을 **따로** 담는다. 시트를 먼저 굽고 그걸 @image1 로 붙이는
 *    순서를 어기면 인물만 매끈한 CG 로 나온다(art-direction §2.4) — 버튼이 분리돼 있어야 순서가 강제된다.
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const DOCS = resolve(here, '../../../docs/art-direction');
const OUT = resolve(here, '../public/changjak-prompts.js');
const BOOKS = resolve(here, '../../../docs/changjak-books');

const blocks = (text) => [...text.matchAll(/```\n([\s\S]*?)```/g)].map((m) => m[1].trimEnd());

const out = {};
for (const file of readdirSync(DOCS).filter((f) => /^changjak-.*prompts\.md$/.test(f))) {
  // 🔴 CRLF 정규화 — 편집 도구가 줄바꿈을 바꿔 놓으면 코드펜스 정규식(```\n)이 조용히 안 맞는다.
  //    "프롬프트를 하나도 못 찾았다"로 터진 적 있음.
  const md = readFileSync(join(DOCS, file), 'utf8').replace(/\r\n/g, '\n');

  // 책 단위로 자른다: "## A-04 §1." 같은 머리에서 회차 id 를 얻는다
  // 🔴 A 군 전용이었다 — b·c·g … 군 책이 조용히 통째로 빠졌다. 전 주제군(A~H)을 받는다.
  const ids = [...new Set([...md.matchAll(/^##\s+([A-H])-(\d+)\s+§/gm)].map((m) => m[1].toLowerCase() + m[2]))];

  for (const id of ids) {
    const grp = id[0].toUpperCase();
    const num = id.slice(1);
    // 🔴 정규식 lookahead 로 자르지 않는다 — `m` 플래그에서 `$` 가 줄 끝에 걸려 섹션이 첫 줄에서 끊긴다.
    //    h1/h2 경계로 문서를 쪼갠 뒤 머리로 고르는 편이 안 깨진다.
    const sections = md.split(/^(?=#{1,2}\s)/m);
    const slice = (sec) =>
      sections.find((s) => new RegExp(`^##\\s+${grp}-${num}\\s+§${sec}\\.`).test(s)) || '';

    const anchor = blocks(slice(2))[0] || '';
    const sheets = blocks(slice(3));
    const cutsSection = slice(4);
    const cuts = [...cutsSection.matchAll(/^###\s+(p\d+)\s*—\s*(.*?)\n+```\n([\s\S]*?)```/gm)].map(
      (m) => ({ page: m[1], title: m[2].trim(), prompt: m[3].trimEnd() })
    );

    if (!anchor && !sheets.length && !cuts.length) continue;
    out[id] = { anchor, sheets, cuts };
  }
}

const ids = Object.keys(out);
if (!ids.length) throw new Error('프롬프트를 하나도 못 찾았다 — 마크다운 머리 형식이 바뀌었는지 확인할 것');
for (const id of ids) {
  const b = out[id];
  // 🔴 반쪽 데이터를 내보내느니 실패한다 — 12컷이 안 차면 회차 페이지가 조용히 빈 버튼을 단다.
  if (!b.anchor) throw new Error(`${id}: STYLE ANCHOR 없음`);
  if (!b.sheets.length) throw new Error(`${id}: 캐릭터 시트 없음`);
  // 🔴 12 고정이었다 — 쪽수는 8~20 자유라 10·11쪽 책이 통과를 못 했다.
  //    진짜 불변식은 「그 책의 모든 쪽에 컷이 있다」이므로 본문에서 쪽수를 세어 대조한다.
  const src = join(BOOKS, `${id}.md`);
  if (existsSync(src)) {
    const pages = [...readFileSync(src, 'utf8').matchAll(/^##\s+p(\d+)\s*$/gm)].map((x) => 'p' + x[1]);
    const missing = pages.filter((x) => !b.cuts.some((c) => c.page === x));
    const extra = b.cuts.map((c) => c.page).filter((x) => !pages.includes(x));
    if (missing.length || extra.length)
      throw new Error(`${id}: 컷이 본문 쪽과 안 맞는다 — 없는 컷 [${missing}] · 본문에 없는 컷 [${extra}]`);
  } else if (b.cuts.length < 8) {
    throw new Error(`${id}: 컷 ${b.cuts.length}개 — 본문 파일이 없고 8쪽 미만이다`);
  }
}

writeFileSync(
  OUT,
  '/* 자동 생성 — build-changjak-prompts.mjs. 직접 고치지 말 것(원본은 docs/art-direction/*.md). */\n' +
    'window.CJ_PROMPTS = ' +
    JSON.stringify(out, null, 1) +
    ';\n',
  'utf8'
);
console.log(`회차 ${ids.length}개 → ${OUT}`);
for (const id of ids) console.log(`  ${id}: 앵커 1 · 시트 ${out[id].sheets.length} · 컷 ${out[id].cuts.length}`);
