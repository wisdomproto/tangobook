// 선언된 `readingLevel` 을 **본문 실측**으로 맞춘다.
//
//   node packages/server/scripts/fix-reading-levels.mjs                # dry-run (기본)
//   node packages/server/scripts/fix-reading-levels.mjs --apply
//   node packages/server/scripts/fix-reading-levels.mjs --category='전래 동화' --apply
//   node packages/server/scripts/fix-reading-levels.mjs --only-missing --apply   # 빈칸만 채우고 기존 값은 안 건드림
//
// 🔴 왜 필요한가 — 선언과 실물이 따로 놀고 있었다(2026-09-04 실측: 빈칸 885권 · 불일치 67권).
//    특히 **호리 세상 탐험 15권이 `L1` 선언인데 실측은 가장 긴 축(316어절)** 이라,
//    「파닉스 막 뗀 아이」에게 우리 책 중 제일 긴 걸 추천하게 된다. 정반대다.
//
// 🔴 판정 규칙은 여기 없다 — `_reading-level.mjs` 한 곳에만 있다.
//    현황판(`build-content-status.mjs`)·감사표(`audit-reading-levels.mjs`)와 같은 사본이다.
//
// 🔴 멱등이다 — 이미 맞는 책은 건너뛴다(쓰기 0). 두 번 돌려도 안전하다.
// ponytail: 저장은 책 하나씩 POST 다(전체 객체 왕복). 배치 API 가 없어서고, 1,200권이면 충분히 빠르다.
import { classify, measure } from './_reading-level.mjs';

const args = process.argv.slice(2);
const argOf = (k, d) => {
  const hit = args.find((a) => a === `--${k}` || a.startsWith(`--${k}=`));
  if (!hit) return d;
  if (hit.includes('=')) return hit.slice(k.length + 3);
  return args[args.indexOf(hit) + 1] ?? d;
};
const API = String(argOf('api', 'https://www.tangobook.co.kr')).replace(/\/$/, '');
const APPLY = args.includes('--apply');
const ONLY_MISSING = args.includes('--only-missing');
const CATEGORY = argOf('category', null);
const LIMIT = Number(argOf('limit', '0'));

async function main() {
  console.log(`읽는 중: ${API}${APPLY ? '' : '  (dry-run — 바꾸려면 --apply)'}`);
  const list = await fetch(`${API}/api/storybooks`).then((r) => r.json());
  let items = (list.data ?? list ?? []).filter((b) => b.type !== 'phonics');
  if (CATEGORY) items = items.filter((b) => (b.category || b.folder) === CATEGORY);
  if (LIMIT) items = items.slice(0, LIMIT);
  console.log(`대상 ${items.length}권`);

  const plan = [];
  let skipped = 0;
  for (const it of items) {
    const full = await fetch(`${API}/api/storybooks/${it.id}`).then((r) => r.json());
    const sb = full.data ?? full;
    if (!sb?.id) continue;
    const m = measure(sb);
    const actual = classify(m.words, m.sentPerPage);
    const declared = sb.readingLevel || null;
    // 글이 없는 책은 판정 불가 — 건드리지 않는다.
    if (!actual) { skipped++; continue; }
    if (declared === actual) { skipped++; continue; }
    if (ONLY_MISSING && declared) { skipped++; continue; }
    plan.push({ sb, id: sb.id, title: sb.title, category: sb.category || sb.folder, declared, actual });
  }

  const byKind = { 빈칸: plan.filter((p) => !p.declared).length, 불일치: plan.filter((p) => p.declared).length };
  console.log(`\n바꿀 것 ${plan.length}권 (빈칸 ${byKind.빈칸} · 불일치 ${byKind.불일치}) · 그대로 ${skipped}권`);
  for (const p of plan.filter((x) => x.declared).slice(0, 20)) {
    console.log(`  ⚠ ${p.category} · ${p.title}: ${p.declared} → ${p.actual}`);
  }
  if (byKind.불일치 > 20) console.log(`  … 불일치 ${byKind.불일치 - 20}건 더`);

  if (!APPLY) {
    console.log('\ndry-run 이라 아무것도 안 바꿨다. --apply 로 실행.');
    return;
  }

  let ok = 0;
  for (const p of plan) {
    const res = await fetch(`${API}/api/storybooks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storybook: { ...p.sb, readingLevel: p.actual } }),
    });
    if (res.ok) ok++;
    else console.error(`  ✗ ${p.title}: ${res.status} ${(await res.text()).slice(0, 120)}`);
  }
  console.log(`\n적용 ${ok}/${plan.length}`);
  console.log('🔴 끝나면 현황판을 다시 굽는다: node packages/server/scripts/build-content-status.mjs');
}

main().catch((e) => {
  console.error(e?.message || e);
  process.exit(1);
});
