// 기존 storybook에 `readingLevel` 메타를 일괄 태깅.
//
// 기본: 완성 폴더 (folder === '완성')의 type=storybook 책 → readingLevel='L3'
//       실측 결과 평균 페이지 15, 문장/쪽 3.2, 총 단어 255 → ORT Stage 4~5 = L3 확정.
//
// 서버(localhost:3500) 필요. storybook 개별 fetch → 업데이트 → POST /storybooks.
//
// 실행:
//   node scripts/tag-reading-level.mjs                    # 완성 폴더 → L3
//   node scripts/tag-reading-level.mjs --force            # 기존 readingLevel 덮어쓰기
//   node scripts/tag-reading-level.mjs --folder 완성 --level L3   # 명시

const API = 'http://localhost:3500/api';

function parseFlag(name, fallback) {
  const idx = process.argv.indexOf(name);
  if (idx < 0) return fallback;
  return process.argv[idx + 1] ?? fallback;
}

const FORCE = process.argv.includes('--force');
const FOLDER = parseFlag('--folder', '완성');
const LEVEL = parseFlag('--level', 'L3');

async function apiJson(path, init) {
  const res = await fetch(`${API}${path}`, init);
  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    throw new Error(`${res.status} ${path}: ${text.slice(0, 200)}`);
  }
  if (!res.ok || json.success === false) {
    throw new Error(`${res.status} ${path}: ${json?.error ?? text.slice(0, 200)}`);
  }
  return json.data;
}

async function main() {
  console.log(`모드: folder='${FOLDER}' · level='${LEVEL}' · ${FORCE ? 'FORCE' : 'SAFE (기존 readingLevel 있으면 skip)'}`);

  const list = await apiJson('/storybooks');
  const targets = list.filter(
    (s) => s.folder === FOLDER && s.type !== 'phonics',
  );
  console.log(`대상: ${targets.length}권 (folder='${FOLDER}', type=storybook)\n`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < targets.length; i++) {
    const summary = targets[i];
    const prefix = `[${String(i + 1).padStart(2, '0')}/${targets.length}] ${summary.id} ${summary.title.slice(0, 24)}`;
    try {
      const sb = await apiJson(`/storybooks/${summary.id}`);
      if (sb.readingLevel && !FORCE) {
        console.log(`${prefix} — skip (readingLevel=${sb.readingLevel})`);
        skipped++;
        continue;
      }
      const next = { ...sb, readingLevel: LEVEL };
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: next }),
      });
      console.log(`${prefix} — ${sb.readingLevel ?? '(없음)'} → ${LEVEL}`);
      updated++;
    } catch (err) {
      console.error(`${prefix} — FAILED: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n━━ 완료 ━━\nupdated: ${updated}\nskipped: ${skipped}\nfailed:  ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('스크립트 오류:', e);
  process.exit(1);
});
