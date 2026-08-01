/**
 * 수상작 99점 — 한 줄짜리 색인
 *
 *   node packages/client/scripts/build-award-index.mjs
 *   → docs/art-direction/_AWARDS.md
 *
 * 🔴 왜. 앵커 원본을 고를 때마다 `award-styles-20y.json` **133,005자를 통째로** 읽고 있었다.
 *    65권을 그렇게 골랐으니 같은 파일을 예순다섯 번 읽은 셈이다. 고르는 데 실제로 쓰는 건
 *    **클러스터·공정·팔레트·마감** 넉 줄뿐이고, 그건 카탈로그에 이미 필드로 들어 있다.
 *
 * 🔴 **이미 어디에 쓰였나**를 같이 적는다. ★ 는 그 권 화면에 실제로 뜨는 `refs[0]` 이라는 뜻이다.
 *    같은 그림을 두 앵커의 첫 장으로 쓰면 라이브러리에서 두 책이 한 그림체로 보인다 —
 *    고르는 사람이 그걸 알려면 「이 그림은 이미 저 권 것」이 눈에 보여야 한다.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, '../../../docs/art-direction');
const REFS = resolve(here, '../public/changjak-anchor-refs.json');

const raw = JSON.parse(readFileSync(join(DIR, 'award-styles-20y.json'), 'utf8'));
const items = Array.isArray(raw) ? raw : raw.items || Object.values(raw)[0];

// 어느 권이 이미 이 그림을 쓰고 있나 (★ = refs[0], 화면에 뜨는 장)
const usedBy = {};
for (const [book, v] of Object.entries(JSON.parse(readFileSync(REFS, 'utf8'))))
  (v.refs || []).forEach((r, i) => ((usedBy[r.id] ||= []).push(book + (i === 0 ? '★' : ''))));

const one = (s = '') => String(s).replace(/\s+/g, ' ').trim();
const byCluster = {};
for (const it of items) ((byCluster[it.cluster || '?'] ||= []).push(it));

const rows = Object.keys(byCluster)
  .sort()
  .map((c) => {
    const list = byCluster[c]
      .map((it) => {
        const u = usedBy[it.id];
        return `| \`${it.id}\` | ${one(it.medium).slice(0, 70)} | ${one(it.palette).slice(0, 44)} | ${one(it.finish).slice(0, 60)} | ${u ? u.join(' ') : '—'} |`;
      })
      .join('\n');
    return `### ${c} (${byCluster[c].length})\n\n| id | 공정 | 팔레트 | 마감 | 쓰인 권 |\n|---|---|---|---|---|\n${list}`;
  })
  .join('\n\n');

const out = `# 수상작 ${items.length}점 — 고르기용 한 장

🔴 **자동 생성** — \`node packages/client/scripts/build-award-index.mjs\`. 직접 고치지 마라.

앵커 원본을 고를 때 **이 표만 본다.** 그 권 배정의 클러스터 절만 읽고, 공정 한 줄이 맞는 후보를
두셋 추린 뒤 **그것들만** \`award-styles-20y.json\` 에서 펼쳐 \`styleSpec\` 을 확인해라.
(전문을 통째로 읽으면 133,005자다. 여기 표는 그 1/10 이다.)

**「쓰인 권」에 ★ 가 붙은 그림은 그 권 화면에 뜨는 장이다.** 🔴 **겹쳐 써도 된다** — 앵커 100~150개로
1000권을 덮는 설계라 한 그림체를 여러 권이 나눠 쓰는 게 정상이고, 이 그림은 책이 아니라 **앵커**를
가리킨다. 겹칠 때 확인할 것은 하나뿐이다 — **두 권의 공정이 실제로 같은가.** 다르면 배정이 틀린 것이다.

🔴 **이 표의 공정·팔레트·마감은 「책 속」 설명이고, 붙는 그림은 「표지」다.** 둘이 어긋나는 항목이
최소 셋 확인됐다 — \`arsenault-marguerite\`(흑연+색판이라 적혀 있으나 표지는 평면 벡터풍) ·
\`sis-wall\`(해칭 회색 단색조라는데 표지는 카키+빨강) · \`alcantara-rio\`(틸+악센트 둘이라는데
표지는 원색 다색에 흰 점 튀김). **표로 후보를 좁히되 첫 장은 반드시 받아서 보고 정한다.**

🔴 **라벨을 믿지 말고 받아서 봐라.** 카탈로그 설명과 **정반대 용도**인 것이 넷 나왔다(§7.29) —
「질감판 겹치기」 대표가 「무늬 0」 앵커에는 반례였다. \`curl -sL\` 로 받아 실제 바이트를 확인하고
눈으로 본 뒤에 첫 장을 정한다(\`-L\` 없으면 302 본문 9바이트가 저장된다).

${rows}
`;

writeFileSync(join(DIR, '_AWARDS.md'), out);
console.log(`_AWARDS.md — ${items.length}점 · ${out.length}자 (원본 ${readFileSync(join(DIR, 'award-styles-20y.json'), 'utf8').length}자)`);
