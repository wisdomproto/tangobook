// 완성 폴더에 있는 동화책을 일괄 처리:
//   1. category = '세계 명작'으로 변경
//   2. storybook에서 만들 수 있는 모든 게임을 아직 없으면 생성
// 서버(localhost:3500)가 돌고 있어야 실행 가능.
// 실행: node scripts/bulk-setup-complete-books.mjs

const API = 'http://localhost:3500/api';
const TARGET_FOLDER = '완성';
const TARGET_CATEGORY = '세계 명작';

// 동화책(storybook)에서 만들 수 있는 게임 타입과 기본 설정 — registry/games/*.register.* 미러
const GAME_RECIPES = [
  { id: 'vocabulary-matching', nameKo: '어휘 매칭', defaultConfig: { type: 'vocabulary-matching', pairCount: 6 } },
  { id: 'word-writing', nameKo: '단어 쓰기', defaultConfig: { type: 'word-writing', language: 'english', wordSource: 'vocabulary', showGuide: true, accuracyThreshold: 70 } },
  { id: 'connect-the-dots', nameKo: '점잇기', defaultConfig: { type: 'connect-the-dots', sourcePages: [], sourceMode: 'objects', sourceObjects: [], pointCount: 20, showNumbers: true, showFaintOutline: true } },
  { id: 'word-quiz', nameKo: '단어 퀴즈', defaultConfig: { type: 'word-quiz', questionCount: 6, questionTypes: ['picture'] } },
  { id: 'picture-sequence', nameKo: '그림 순서', defaultConfig: { type: 'picture-sequence', imageCount: 4 } },
  { id: 'odd-one-out', nameKo: '다른 그림', defaultConfig: { type: 'odd-one-out', roundCount: 5, optionsPerRound: 4 } },
  { id: 'korean-block', nameKo: '한글 블록', defaultConfig: { type: 'korean-block', itemCount: 5, includeKeyObjects: true, includeCharacters: false } },
  { id: 'english-block', nameKo: '영어 블록', defaultConfig: { type: 'english-block', itemCount: 5, includeKeyObjects: true, includeCharacters: false } },
  { id: 'korean-word-writing', nameKo: '한글 낱말쓰기', defaultConfig: { type: 'korean-word-writing', language: 'korean', wordSource: 'vocabulary', showGuide: true, accuracyThreshold: 70 } },
  { id: 'english-word-writing', nameKo: '영어 낱말쓰기', defaultConfig: { type: 'english-word-writing', language: 'english', wordSource: 'vocabulary', showGuide: true, accuracyThreshold: 70 } },
  { id: 'storybook-quiz', nameKo: '동화책 퀴즈', defaultConfig: { type: 'storybook-quiz', questionCount: 5 } },
  { id: 'korean-speaking', nameKo: '한국어 말하기', defaultConfig: { type: 'korean-speaking' } },
  { id: 'english-speaking', nameKo: '영어 말하기', defaultConfig: { type: 'english-speaking' } },
];

function randomUuid() {
  // Node 18+ 에선 crypto.randomUUID 사용 가능
  return crypto.randomUUID();
}

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

  // 1. 카테고리 변경
  let categoryChanged = false;
  if (full.category !== TARGET_CATEGORY) {
    full.category = TARGET_CATEGORY;
    categoryChanged = true;
    console.log(`  ✓ 카테고리 → ${TARGET_CATEGORY}`);
  }

  // 2. 미생성 게임 식별
  if (!Array.isArray(full.games)) full.games = [];
  const existing = new Set(full.games.map((g) => g.gameType));
  const missing = GAME_RECIPES.filter((r) => !existing.has(r.id));
  console.log(`  미생성 ${missing.length}/${GAME_RECIPES.length}: ${missing.map((m) => m.id).join(', ') || '(없음)'}`);

  // 3. 각 미생성 게임 생성
  let gamesAdded = 0;
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
        id: randomUuid(),
        gameType: recipe.id,
        title: recipe.nameKo,
        difficulty: 'easy',
        createdAt: new Date().toISOString(),
        config: recipe.defaultConfig,
        data,
      });
      gamesAdded += 1;
      console.log('OK');
    } catch (err) {
      console.log(`SKIP (${err.message.slice(0, 80)})`);
    }
  }

  // 4. 변경점이 있으면 저장
  if (categoryChanged || gamesAdded > 0) {
    await apiJson('/storybooks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storybook: full }),
    });
    console.log(`  ✓ 저장 완료 (게임 +${gamesAdded})`);
  } else {
    console.log('  = 변경 없음');
  }
  return { categoryChanged, gamesAdded };
}

async function main() {
  console.log(`서버: ${API}`);
  console.log(`대상 폴더: '${TARGET_FOLDER}' / 카테고리 → '${TARGET_CATEGORY}'`);

  const all = await apiJson('/storybooks');
  const targets = all.filter((b) => b.folder === TARGET_FOLDER);
  console.log(`\n총 ${all.length}권 중 완성 폴더 ${targets.length}권\n`);

  const summary = { processed: 0, categoryChanged: 0, gamesAdded: 0, errors: [] };

  for (const [i, book] of targets.entries()) {
    try {
      const r = await processBook(book, i, targets.length);
      summary.processed += 1;
      if (r.categoryChanged) summary.categoryChanged += 1;
      summary.gamesAdded += r.gamesAdded;
    } catch (err) {
      console.log(`  ✗ FAIL: ${err.message}`);
      summary.errors.push({ id: book.id, title: book.title, err: err.message });
    }
  }

  console.log('\n─────────────────────────');
  console.log(`처리: ${summary.processed}/${targets.length}`);
  console.log(`카테고리 변경: ${summary.categoryChanged}`);
  console.log(`게임 추가: ${summary.gamesAdded}`);
  if (summary.errors.length) {
    console.log(`에러: ${summary.errors.length}`);
    summary.errors.forEach((e) => console.log(`  - [${e.id}] ${e.title}: ${e.err}`));
  }
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
