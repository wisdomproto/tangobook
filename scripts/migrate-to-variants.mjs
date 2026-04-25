// v1 storybook → v2 books/{bid}/... 마이그레이션 caller.
//
// 동작: server endpoint /api/admin/book-v2/{scan,migrate}를 호출.
//   1. /scan → 그룹 list (baseBid → variantIds)
//   2. 각 baseBid에 대해 /migrate 호출 (dryRun이면 plan만, apply면 실제 R2 write)
//
// 실행:
//   node scripts/migrate-to-variants.mjs                        # dry-run
//   node scripts/migrate-to-variants.mjs --apply                # 실제 적용
//   node scripts/migrate-to-variants.mjs --only baseBid1,bid2   # 특정 base bid만
//   node scripts/migrate-to-variants.mjs --concurrency 5
//   node scripts/migrate-to-variants.mjs --apply --force        # 기존 manifest 덮어쓰기

const API = 'http://localhost:3500/api/admin/book-v2';
const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force');

function flag(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const ONLY = flag('--only', '').split(',').filter(Boolean);
const CONCURRENCY = Number(flag('--concurrency', '3'));

async function jsonPost(path, body) {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body ?? {}),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`); }
  if (!res.ok || json.success === false) throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 300)}`);
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
        process.stdout.write(`\r  ${done}/${items.length}    `);
      }
    }),
  );
  process.stdout.write('\n');
  return out;
}

function fmtMs(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

async function main() {
  console.log(`mode: ${APPLY ? '🔥 APPLY' : 'DRY-RUN'}${FORCE ? ' (--force)' : ''}`);
  if (ONLY.length) console.log(`only: ${ONLY.join(', ')}`);
  console.log(`concurrency: ${CONCURRENCY}\n`);

  console.log('1) v1 storybook list scan...');
  const scan = await jsonPost('/scan');
  console.log(`   총 ${scan.totalStorybooks}권 / ${scan.totalGroups} base bid 그룹\n`);

  let groups = scan.groups;
  if (ONLY.length) {
    const set = new Set(ONLY);
    groups = groups.filter((g) => set.has(g.baseBid));
    console.log(`   필터 적용: ${groups.length}개 그룹\n`);
  }

  console.log(`2) ${APPLY ? 'apply' : 'dry-run'} migration...`);
  const t0 = Date.now();

  const results = await mapWithConcurrency(
    groups,
    async (g) => {
      const r = await jsonPost('/migrate', {
        baseBid: g.baseBid,
        variantIds: g.variantIds,
        dryRun: !APPLY,
        force: FORCE,
      });
      return r;
    },
    CONCURRENCY,
  );

  const dur = Date.now() - t0;
  console.log(`\n   소요 ${fmtMs(dur)}\n`);

  // 종합
  const byStatus = { migrated: 0, skipped: 0, failed: 0 };
  let textSlices = 0;
  let styleAssets = 0;
  let audioFiles = 0;
  const warnings = [];
  const failures = [];
  for (let i = 0; i < results.length; i++) {
    const r = results[i];
    if (!r || r.__error) {
      byStatus.failed++;
      failures.push({ baseBid: groups[i].baseBid, error: r?.__error ?? 'unknown' });
      continue;
    }
    byStatus[r.status] = (byStatus[r.status] ?? 0) + 1;
    textSlices += r.textSlicesWritten ?? 0;
    styleAssets += r.styleAssetsCopied ?? 0;
    audioFiles += r.audioFilesCopied ?? 0;
    if (r.warnings?.length) {
      warnings.push({ baseBid: r.bid, warnings: r.warnings });
    }
  }

  console.log('━━ 결과 ━━');
  console.log(`migrated: ${byStatus.migrated}`);
  console.log(`skipped:  ${byStatus.skipped}`);
  console.log(`failed:   ${byStatus.failed}`);
  console.log(`text slices written: ${textSlices}`);
  console.log(`style assets copied: ${styleAssets}`);
  console.log(`audio files copied:  ${audioFiles}`);
  if (failures.length) {
    console.log('\nFAILURES:');
    for (const f of failures.slice(0, 10)) {
      console.log(`  ${f.baseBid} - ${f.error}`);
    }
    if (failures.length > 10) console.log(`  ... +${failures.length - 10} more`);
  }
  if (warnings.length) {
    console.log(`\nWARNINGS in ${warnings.length} books (앞 3개 책의 앞 5건):`);
    for (const w of warnings.slice(0, 3)) {
      console.log(`  ${w.baseBid}:`);
      for (const line of w.warnings.slice(0, 5)) console.log(`    - ${line}`);
    }
  }
  if (!APPLY) {
    console.log('\n💡 위 plan OK면 --apply로 실제 실행.');
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
