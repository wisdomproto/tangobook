// 완성 폴더 30권에서 제거 대상 게임 인스턴스를 일괄 삭제.
// 4~5세 대상으로 게임 리스트를 단순화하는 정리 작업.
//
// 실행: node scripts/bulk-cleanup-deprecated-games.mjs
// 서버(localhost:3500)가 돌고 있어야 함.

const API = 'http://localhost:3500/api';
const TARGET_FOLDER = '완성';

// 제거 대상: 4-5세에게 너무 어렵거나 중복. 클라 코드는 추후 별도 정리.
const REMOVE_GAME_TYPES = new Set([
  'vocabulary-matching', // → 선긋기 매칭으로 재설계 예정
  'word-quiz',
  'picture-sequence',
  'odd-one-out',
  'storybook-quiz', // → 스토리 이미지 맞추기로 대체 예정
  'blending-listening',
  'letter-sound',
  'word-image-matching',
  'word-listening',
]);

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

async function processBook(summary, idx, total) {
  const prefix = `[${String(idx + 1).padStart(2, '0')}/${total}] ${summary.title}`;
  const full = await apiJson(`/storybooks/${summary.id}`);

  const before = (full.games ?? []).length;
  const kept = (full.games ?? []).filter((g) => !REMOVE_GAME_TYPES.has(g.gameType));
  const removed = before - kept.length;

  if (removed === 0) {
    console.log(`${prefix}  = 이미 정리됨 (${before}개)`);
    return { removed: 0 };
  }

  full.games = kept;
  await apiJson('/storybooks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook: full }),
  });

  console.log(`${prefix}  ✓ ${removed}개 제거 (${before} → ${kept.length})`);
  return { removed };
}

async function main() {
  console.log(`서버: ${API}`);
  console.log(`제거 대상: ${[...REMOVE_GAME_TYPES].join(', ')}`);

  const all = await apiJson('/storybooks');
  const targets = all.filter((b) => b.folder === TARGET_FOLDER);
  console.log(`\n총 ${all.length}권 중 완성 폴더 ${targets.length}권\n`);

  const summary = { processed: 0, totalRemoved: 0, errors: [] };

  for (const [i, book] of targets.entries()) {
    try {
      const r = await processBook(book, i, targets.length);
      summary.processed += 1;
      summary.totalRemoved += r.removed;
    } catch (err) {
      console.log(`  ✗ FAIL: ${err.message}`);
      summary.errors.push({ id: book.id, title: book.title, err: err.message });
    }
  }

  console.log('\n─────────────────────────');
  console.log(`처리: ${summary.processed}/${targets.length}`);
  console.log(`게임 인스턴스 제거: ${summary.totalRemoved}개`);
  if (summary.errors.length) {
    console.log(`에러: ${summary.errors.length}`);
    summary.errors.forEach((e) => console.log(`  - [${e.id}] ${e.title}: ${e.err}`));
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
