/**
 * 창작동화 — 쓴 책들의 「겹침 방지 요약」한 장
 *
 *   node packages/client/scripts/build-changjak-digest.mjs
 *   → docs/changjak-books/_DIGEST.md
 *
 * 🔴 왜. 작가에게 대조본을 3~5권씩 통째로 읽히고 있었다(권당 15,000~34,000자).
 *    그런데 작가가 대조에서 실제로 쓰는 건 **무대·후렴·착지 세 줄**뿐이다 —
 *    d09·a10 이 서로를 못 봐 둘 다 「눈 위 자국」으로 착지한 그 사고를 막는 데
 *    필요한 정보가 딱 그것이다. 본문·SCENE 을 읽힐 이유가 없다.
 *
 * 🔴 형식(frontmatter 키·`## pN`·`### SCENE`)은 이 파일이 아니라 `_FORMAT.md` 가 진다.
 *    본보기 원고를 통째로 읽히던 것도 같은 낭비였다.
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const SRC = resolve(here, '../../../docs/changjak-books');

const pick = (fm, k) => (fm.match(new RegExp(`^${k}:\\s*(.+)`, 'm')) || [, ''])[1].trim().replace(/^'(.*)'$/, '$1');

const rows = readdirSync(SRC)
  .filter((f) => /^[a-h]\d+\.md$/.test(f))
  .sort()
  .map((f) => {
    const md = readFileSync(join(SRC, f), 'utf8');
    const fm = md.split('---')[1] || '';
    const pages = (md.match(/^## p\d+/gm) || []).length;
    // 착지는 대시 앞 카드 이름만 — 뒤 설명은 겹침 판정에 필요 없다
    const landing = pick(fm, 'landing').split(/\s+[—-]\s+/)[0].trim();
    return {
      id: f.replace('.md', ''),
      title: pick(fm, 'title'),
      engine: pick(fm, 'engine'),
      stage: pick(fm, 'stage').split(/[(（]/)[0].trim(),
      refrain: pick(fm, 'refrain').replace(/\s+/g, ' ').slice(0, 60),
      landing,
      pages,
    };
  });

const out = `# 창작동화 — 이미 쓴 책 (겹침 방지용 한 장)

🔴 **자동 생성** — \`node packages/client/scripts/build-changjak-digest.mjs\`. 직접 고치지 마라.

새 권을 쓰기 전에 이 표만 보면 된다. **무대·후렴·착지가 겹치지 않으면 그 책은 다른 책이다.**
겹치는 줄을 찾았을 때만 그 권의 원고(\`docs/changjak-books/<id>.md\`)를 열어라.

| id | 제목 | 엔진 | 무대 | 쪽 | 후렴 | 착지 카드 |
|---|---|---|---|---|---|---|
${rows.map((r) => `| ${r.id} | ${r.title} | ${r.engine} | ${r.stage} | ${r.pages} | ${r.refrain || '—'} | **${r.landing}** |`).join('\n')}

## 이미 쓴 착지 카드 ${rows.length}장

${[...new Set(rows.map((r) => r.landing))].join(' · ')}

🔴 **새 권은 이 목록에 없는 카드로 착지해야 한다.** 병렬로 여러 권을 쓸 때는 카드를 미리 나눠 받는다 — 작가가 각자 고르면 같은 자리를 집는다(d09·a10 이 둘 다 눈 위 자국으로 끝났다).
`;

writeFileSync(join(SRC, '_DIGEST.md'), out);
console.log(`_DIGEST.md — ${rows.length}권 · ${out.length}자`);
