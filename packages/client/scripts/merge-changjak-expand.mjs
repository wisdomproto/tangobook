/**
 * 창작동화 확장분(주제군별 조각 파일) → 기획서 §5 표에 삽입
 *
 *   docs/changjak-expand/{A..H}.html  →  public/changjak-plan.html
 *   node packages/client/scripts/merge-changjak-expand.mjs [--apply]
 *
 * 🔴 기본은 dry-run. `--apply` 를 줘야 파일을 고친다.
 * 🔴 멱등 — 이미 들어간 번호는 건너뛴다(같은 조각을 두 번 붙여도 중복되지 않는다).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const PLAN = resolve(here, '../public/changjak-plan.html');
const FRAG = resolve(here, '../../../docs/changjak-expand');
const APPLY = process.argv.includes('--apply');

// 주제군 → .grp 블록을 고르는 표시 문자열(헤더 h3 텍스트)
const GROUPS = [
  ['A', 'A · 마음·감정', 180],
  ['B', 'B · 상상·변신', 150],
  ['C', 'C · 자연·계절·동물', 150],
  ['D', 'D · 모험·여정', 120],
  ['E', 'E · 웃음·말놀이', 120],
  ['F', 'F · 집·가족의 작은 사건', 110],
  ['G', 'G · 용기·두려움', 90],
  ['H', 'H · 호기심·만들기·직업', 80],
];

let plan = readFileSync(PLAN, 'utf8').replace(/\r\n/g, '\n');
const report = [];

for (const [key, heading, target] of GROUPS) {
  const file = join(FRAG, `${key}.html`);
  if (!existsSync(file)) {
    report.push(`${key}: 조각 파일 없음 — 건너뜀`);
    continue;
  }
  const rows = readFileSync(file, 'utf8')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.startsWith('<tr>'));

  // 이 주제군의 .grp 블록을 찾는다
  const gi = plan.indexOf(`<h3>${heading}</h3>`);
  if (gi < 0) throw new Error(`${key}: 기획서에서 '${heading}' 블록을 못 찾음`);
  const tStart = plan.indexOf('<table class="books">', gi);
  const tEnd = plan.indexOf('</table>', tStart);
  if (tStart < 0 || tEnd < 0) throw new Error(`${key}: books 표를 못 찾음`);

  const table = plan.slice(tStart, tEnd);
  const have = new Set([...table.matchAll(/<tr><td>(\d+)<\/td>/g)].map((m) => m[1]));
  const fresh = rows.filter((r) => {
    const n = r.match(/<tr><td>(\d+)<\/td>/);
    return n && !have.has(n[1]);
  });

  report.push(
    `${key}: 조각 ${rows.length}행 · 기존 ${have.size}행 · 추가 ${fresh.length}행 → ${have.size + fresh.length}/${target}`
  );
  if (!fresh.length || !APPLY) continue;

  plan = plan.slice(0, tEnd) + fresh.join('\n') + '\n' + plan.slice(tEnd);

  // 헤더 배지 "N권 중 15" → "N권 중 <합계>"
  const total = have.size + fresh.length;
  const badgeRe = new RegExp(`(<h3>${heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h3><span class="cnt">)([^<]*)(</span>)`);
  plan = plan.replace(badgeRe, `$1${target}권 중 ${total}$3`);
}

console.log(report.join('\n'));
if (!APPLY) {
  console.log('\n(dry-run — 반영하려면 --apply)');
} else {
  writeFileSync(PLAN, plan, 'utf8');
  console.log('\n기획서에 반영했다.');
}
