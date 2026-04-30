// 4단계(L1-L4) → 3단계(L1-L3) DB 마이그레이션.
// 매핑: L1→L1, L2→L2, L3→L2, L4→L3.
//
// Variant ID(`__L4` suffix)는 그대로 유지(A안). readingLevel 필드만 update.
//
// 실행:
//   node scripts/migrate-reading-level.mjs                # dry-run + 분포 출력
//   node scripts/migrate-reading-level.mjs --apply        # 실제 update

const API = 'http://localhost:3500/api';
const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 6;

const LEVEL_MAP = { L1: 'L1', L2: 'L2', L3: 'L2', L4: 'L3' };

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`); }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 200)}`);
  }
  return json.data;
}

async function mapWithConcurrency(items, fn, n) {
  const out = new Array(items.length);
  let cursor = 0;
  let done = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        try { out[i] = await fn(items[i], i); } catch (e) { out[i] = { __error: e.message }; }
        done++;
        if (done % 20 === 0 || done === items.length) {
          process.stdout.write(`\r  ${done}/${items.length}    `);
        }
      }
    }),
  );
  process.stdout.write('\n');
  return out;
}

function bidSuffix(id) {
  const m = String(id ?? '').match(/^(\d+)__(L[1-4])$/);
  return m ? m[2] : null;
}

async function main() {
  console.log(`mode: ${APPLY ? '🔥 APPLY' : 'DRY-RUN'}\n`);
  const list = await apiJson('/storybooks');
  console.log(`라이브러리 ${list.length}권. 개별 fetch...\n`);

  const books = await mapWithConcurrency(list, (s) => apiJson(`/storybooks/${s.id}`), CONCURRENCY);

  // 분포 카운트
  const before = { L1: 0, L2: 0, L3: 0, L4: 0, none: 0 };
  const suffix = { L1: 0, L2: 0, L3: 0, L4: 0, none: 0 };
  const willUpdate = [];
  let errors = 0;

  for (const b of books) {
    if (!b || b.__error) { errors++; continue; }
    const r = b.readingLevel ?? 'none';
    before[r] = (before[r] ?? 0) + 1;
    const sx = bidSuffix(b.id) ?? 'none';
    suffix[sx] = (suffix[sx] ?? 0) + 1;

    if (b.readingLevel && (b.readingLevel === 'L3' || b.readingLevel === 'L4')) {
      const next = LEVEL_MAP[b.readingLevel];
      if (next !== b.readingLevel) {
        willUpdate.push({ book: b, from: b.readingLevel, to: next });
      }
    }
  }

  console.log('─'.repeat(70));
  console.log('readingLevel 분포 (현재):');
  for (const [l, n] of Object.entries(before)) console.log(`  ${l.padEnd(6)} ${n}`);
  console.log('\nvariant suffix 분포 (현재):');
  for (const [l, n] of Object.entries(suffix)) console.log(`  ${l.padEnd(6)} ${n}`);
  console.log('\n매핑 후 readingLevel 분포 (예상):');
  const after = { L1: 0, L2: 0, L3: 0, none: before.none };
  for (const [l, n] of Object.entries(before)) {
    if (l === 'none') continue;
    const next = LEVEL_MAP[l] ?? l;
    after[next] = (after[next] ?? 0) + n;
  }
  for (const [l, n] of Object.entries(after)) console.log(`  ${l.padEnd(6)} ${n}`);
  console.log(`\n업데이트 대상: ${willUpdate.length} 권 (errors: ${errors})`);

  // 샘플 5권
  console.log('\n샘플:');
  for (const u of willUpdate.slice(0, 10)) {
    console.log(`  ${u.book.id.padEnd(20)} ${u.from} → ${u.to}  ${u.book.title?.slice(0, 30) ?? ''}`);
  }

  if (!APPLY) {
    console.log(`\n💡 위 매핑 OK면 \`node scripts/migrate-reading-level.mjs --apply\` 로 실제 업데이트.`);
    return;
  }

  // === APPLY ===
  console.log('\n🔥 APPLY 모드 — 실제 업데이트 시작\n');
  let updated = 0; let failed = 0;
  for (let i = 0; i < willUpdate.length; i++) {
    const { book: b, to } = willUpdate[i];
    try {
      const next = { ...b, readingLevel: to };
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: next }),
      });
      updated++;
      if (updated % 20 === 0) process.stdout.write(`\r  updated ${updated}    `);
    } catch (e) {
      failed++;
      if (failed <= 5) console.log(`  ${b.id} FAILED: ${e.message}`);
    }
  }
  process.stdout.write('\n');
  console.log(`\n━━ 완료 ━━\nupdated: ${updated}\nfailed:  ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
