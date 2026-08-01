/**
 * 창작동화 — 앵커 41개를 한 장으로
 *
 *   node packages/client/scripts/build-changjak-anchors.mjs
 *   → docs/art-direction/_ANCHORS.md
 *
 * 🔴 왜. art-director 한 명이 4권 쓰려고 **26만 자**를 읽고 있었다 —
 *    verified-references 136,332 + 본보기 프롬프트 2개 65,612 + 공유 앵커 원본 29,328 + 배정표 18,201.
 *    작가 쪽은 `_DIGEST.md` 로 62,406 → 7,949 자로 줄여 놨는데 여기만 그대로였다.
 *
 * 🔴 형제 권과 겹치는지 보는 데 필요한 건 **클러스터·공정 한 줄·팔레트·관통 줄**뿐이다.
 *    실제로 갈림 판정이 걸린 자리도 전부 그 넷이었다(C9 다섯, C2 넷, C8 둘, 공유 앵커 셋).
 *    겹치는 줄을 찾았을 때만 그 권의 prompts.md 를 연다.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(here, '../../../docs/art-direction');

const strip = (s) => s.replace(/\*\*/g, '').replace(/🔴/g, '').replace(/`/g, '').replace(/\s+/g, ' ').trim();

// 🔴 클러스터는 프롬프트 파일에서 읽으면 안 된다 — 그 안엔 형제 권을 비교하는 표가 있어서
//    첫 등장이 남의 클러스터다(h08=C6 인데 C2 로, c08=C9 인데 C4 로 읽혔다).
//    배정표가 41권 전부의 배정을 갖고 있으니 거기서 읽는다.
// 🔴 배정표는 여러 장이다(-04 -08 -08b -16 -16b -31). 한 장만 읽으면 나머지 배치의 권이 전부 '?' 로 남는다.
const assign = readdirSync(DIR)
  .filter((f) => /^changjak-assign-.*\.md$/.test(f))
  .map((f) => readFileSync(join(DIR, f), 'utf8'))
  .join('\n');
const CLUSTER = {};
for (const m of assign.matchAll(/\|\s*\*{0,2}([a-h]\d+)\*{0,2}[^|]*\|[^|]*\|?\s*\*\*(C(?:10|[1-9]))\*\*/g)) {
  CLUSTER[m[1]] = m[2];
}
// 표 모양이 두 가지(§0 기존 10권 · §1 신규 31권)라 못 잡은 것은 한 줄에서 다시 찾는다
for (const line of assign.split('\n')) {
  const id = (line.match(/^\|\s*\*{0,2}([a-h]\d+)\b/) || [])[1];
  const c = (line.match(/\*\*(C(?:10|[1-9]))\*\*/) || [])[1];
  if (id && c && !CLUSTER[id]) CLUSTER[id] = c;
}

const rows = readdirSync(DIR)
  .filter((f) => /^changjak-[a-h]\d+-prompts\.md$/.test(f))
  .sort()
  .map((f) => {
    const t = readFileSync(join(DIR, f), 'utf8');
    const id = f.replace('changjak-', '').replace('-prompts.md', '');
    // 앵커 슬러그 — 파일 어디에 있든 첫 등장
    const slug = (t.match(/changjak-[a-z0-9-]+(?=`|\s|$)/g) || []).find((s) => !/prompts/.test(s)) || '';
    const cluster = CLUSTER[id] || '?';
    // 공정 = 「한 줄」 항목
    const line = strip(((t.match(/^\*\*한 줄\*\*[:：]?\s*(.+)$/m) || [])[1] || '').slice(0, 150));
    // 팔레트 hex — 앵커 코드펜스 안에서
    const hex = [...new Set(t.match(/#[0-9A-F]{6}/g) || [])].slice(0, 4).join(' ');
    // 관통 줄 = 컷 블록의 대문자 라벨(3개 이하로 쓰기로 한 것)
    const rails = [...new Set((t.match(/^[A-Z][A-Z-]{2,11}:/gm) || []).map((s) => s.replace(':', '')))]
      .filter((s) => !['CAMERA', 'SUBJECT', 'SETTING', 'FINISH', 'TONE', 'NOT', 'MEDIUM', 'PALETTE', 'CANVAS', 'STYLE'].includes(s))
      .slice(0, 4)
      .join('·');
    return { id, slug, cluster, line, hex, rails };
  });

const byCluster = {};
rows.forEach((r) => (byCluster[r.cluster] = (byCluster[r.cluster] || []).concat(r.id)));

const out = `# 창작동화 — 앵커 ${rows.length}개 (겹침 확인용 한 장)

🔴 **자동 생성** — \`node packages/client/scripts/build-changjak-anchors.mjs\`. 직접 고치지 마라.

새 권의 앵커를 쓰기 전에 **같은 클러스터 줄만** 보면 된다. 공정·팔레트·관통 줄이 겹치지 않으면 다른 그림체다.
겹치는 줄을 찾았을 때만 그 권의 \`changjak-<id>-prompts.md\` 를 열어라.

## 클러스터별

${Object.keys(byCluster).sort().map((c) => `- **${c}** (${byCluster[c].length}) — ${byCluster[c].join(' · ')}`).join('\n')}

## 앵커 표

| id | 클러스터 | 슬러그 | 공정 한 줄 | 팔레트 | 관통 줄 |
|---|---|---|---|---|---|
${rows.map((r) => `| ${r.id} | ${r.cluster} | \`${r.slug}\` | ${r.line} | ${r.hex} | ${r.rails} |`).join('\n')}

🔴 **공유 앵커는 슬러그가 같다.** 그 짝은 「공정이 같고 방향이 반대」여야 하고, 갈리는 것은 **방향 한 줄과 팔레트**다.
`;

writeFileSync(join(DIR, '_ANCHORS.md'), out);
console.log(`_ANCHORS.md — ${rows.length}개 · ${out.length}자`);
