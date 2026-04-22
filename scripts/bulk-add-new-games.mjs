// 완성 폴더 30권에 신규 4게임(선긋기 매칭 × 한/영, 스토리 이미지 × 한/영) 일괄 생성.
// Gemini 호출 없이 기존 데이터에서 추출만 — 빠르게 완료.
//
// 실행: node scripts/bulk-add-new-games.mjs

const API = 'http://localhost:3500/api';
const TARGET_FOLDER = '완성';

const NEW_RECIPES = [
  {
    id: 'korean-line-matching',
    nameKo: '그림-단어 선긋기',
    defaultConfig: { type: 'korean-line-matching', itemCount: 4 },
  },
  {
    id: 'english-line-matching',
    nameKo: '그림-단어 선긋기 (영어)',
    defaultConfig: { type: 'english-line-matching', itemCount: 4 },
  },
  {
    id: 'korean-story-image',
    nameKo: '이야기 듣고 그림 찾기',
    defaultConfig: { type: 'korean-story-image', roundCount: 5, optionsPerRound: 3 },
  },
  {
    id: 'english-story-image',
    nameKo: '이야기 듣고 그림 찾기 (영어)',
    defaultConfig: { type: 'english-story-image', roundCount: 5, optionsPerRound: 3 },
  },
];

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
  console.log(`\n${prefix}`);

  const full = await apiJson(`/storybooks/${summary.id}`);
  if (!Array.isArray(full.games)) full.games = [];
  const existing = new Set(full.games.map((g) => g.gameType));
  const missing = NEW_RECIPES.filter((r) => !existing.has(r.id));

  if (missing.length === 0) {
    console.log('  = 이미 전부 있음');
    return { added: 0 };
  }

  let added = 0;
  for (const recipe of missing) {
    process.stdout.write(`    · ${recipe.id} ... `);
    try {
      const data = await apiJson('/games/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storybookId: summary.id,
          gameType: recipe.id,
          config: recipe.defaultConfig,
        }),
      });
      full.games.push({
        id: crypto.randomUUID(),
        gameType: recipe.id,
        title: recipe.nameKo,
        difficulty: 'easy',
        createdAt: new Date().toISOString(),
        config: recipe.defaultConfig,
        data,
      });
      added += 1;
      console.log('OK');
    } catch (err) {
      console.log(`SKIP (${err.message.slice(0, 80)})`);
    }
  }

  if (added > 0) {
    await apiJson('/storybooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storybook: full }),
    });
    console.log(`  ✓ ${added}개 추가 저장`);
  }
  return { added };
}

async function main() {
  console.log(`서버: ${API}`);
  console.log(`대상: ${NEW_RECIPES.map((r) => r.id).join(', ')}`);

  const all = await apiJson('/storybooks');
  const targets = all.filter((b) => b.folder === TARGET_FOLDER);
  console.log(`\n총 ${all.length}권 중 완성 폴더 ${targets.length}권\n`);

  const summary = { processed: 0, totalAdded: 0, errors: [] };

  for (const [i, book] of targets.entries()) {
    try {
      const r = await processBook(book, i, targets.length);
      summary.processed += 1;
      summary.totalAdded += r.added;
    } catch (err) {
      console.log(`  ✗ FAIL: ${err.message}`);
      summary.errors.push({ id: book.id, title: book.title, err: err.message });
    }
  }

  console.log('\n─────────────────────────');
  console.log(`처리: ${summary.processed}/${targets.length}`);
  console.log(`게임 추가: ${summary.totalAdded}개`);
  if (summary.errors.length) {
    console.log(`에러: ${summary.errors.length}`);
    summary.errors.forEach((e) => console.log(`  - [${e.id}] ${e.title}: ${e.err}`));
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
