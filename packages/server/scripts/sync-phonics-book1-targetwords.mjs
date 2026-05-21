#!/usr/bin/env node
/**
 * 영어 파닉스 Book 1 의 `phonicsConfig.targetWords` 와 `flashcards` 를
 * 표준화된 `wordFamilies` 와 동기화.
 *
 * 배경: migrate-phonics-book1-letters.mjs 가 wordFamilies 만 글자별 표준 단어로 재구성.
 *      그 결과 targetWords / flashcards 와 wordFamilies 의 단어가 불일치 →
 *      게임 어댑터 (phonics-game-adapter.ts) 는 targetWords 만 보기 때문에
 *      게임이 옛 단어 풀 (desk/elbow/elephant ...) 을 사용. 이미지/TTS 도 없는 단어들.
 *
 * 정리:
 *   targetWords = wordFamilies 의 모든 단어 (flatMap)
 *   flashcards  = wordFamilies 단어별 entry. ttsUrl 이 있으면 mirror.
 *                 기존 flashcards 의 imageUrl/keypoints 는 word match 시 보존.
 *
 * 사용:
 *   node scripts/sync-phonics-book1-targetwords.mjs            # dry-run
 *   node scripts/sync-phonics-book1-targetwords.mjs --apply
 */
const API_BASE = process.env.API_BASE || 'http://localhost:3500';
const APPLY = process.argv.includes('--apply');

const UNIT_IDS = [
  'en-b1-u01',
  'en-b1-u02',
  'en-b1-u03',
  'en-b1-u04',
  'en-b1-u05',
  'en-b1-u06',
  'en-b1-u07',
  'en-b1-u08',
];

async function getBook(id) {
  const r = await fetch(`${API_BASE}/api/storybooks/${id}`);
  if (!r.ok) throw new Error(`GET ${id}: ${r.status}`);
  return (await r.json()).data;
}
async function putBook(sb) {
  const r = await fetch(`${API_BASE}/api/storybooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook: sb }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PUT ${sb.id}: ${r.status} ${t}`);
  }
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}\n`);

const summary = [];
for (const id of UNIT_IDS) {
  const sb = await getBook(id);
  const lesson = sb.phonicsLesson;
  if (!lesson) {
    console.warn(`[${id}] phonicsLesson 없음 — skip`);
    continue;
  }

  // 1) targetWords = wordFamilies flatMap
  const newTargetWords = (lesson.wordFamilies ?? []).flatMap(
    (wf) => wf.words?.map((w) => w.word) ?? []
  );

  // 2) flashcards 재구성. 기존 flashcards 의 imageUrl/keypoints/url 등은 word match 시 보존.
  const oldFlashcards = sb.flashcards ?? [];
  const oldByWord = new Map(
    oldFlashcards.map((c) => [String(c.word ?? c.localWord ?? '').toLowerCase(), c])
  );

  const newFlashcards = [];
  for (let wfIdx = 0; wfIdx < lesson.wordFamilies.length; wfIdx++) {
    const wf = lesson.wordFamilies[wfIdx];
    const blend = wf.blend ?? lesson.blending?.[wfIdx]?.blend ?? '';
    for (const w of wf.words ?? []) {
      const wkey = w.word.toLowerCase();
      const old = oldByWord.get(wkey) ?? {};
      newFlashcards.push({
        ...old, // 기존 imageUrl/keypoints/url 등 자산 보존
        word: w.word,
        localWord: old.localWord ?? w.korean ?? old.localWord,
        ttsUrl: w.ttsUrl ?? old.ttsUrl,
        phonicPattern: blend, // 글자별 blend (Aa, Bb, ...) 로 통일
      });
    }
  }

  const oldTargetCount = sb.phonicsConfig?.targetWords?.length ?? 0;
  const oldFlashCount = oldFlashcards.length;
  const changedTarget = JSON.stringify(sb.phonicsConfig?.targetWords ?? []) !== JSON.stringify(newTargetWords);
  const changedFlash = oldFlashCount !== newFlashcards.length;

  summary.push({
    id,
    oldTarget: oldTargetCount,
    newTarget: newTargetWords.length,
    oldFlash: oldFlashCount,
    newFlash: newFlashcards.length,
    changedTarget,
    changedFlash,
  });

  console.log(`[${id}]`);
  console.log(`  targetWords: ${oldTargetCount} → ${newTargetWords.length}`);
  console.log(`  flashcards : ${oldFlashCount} → ${newFlashcards.length}`);
  if (!APPLY) {
    console.log(`  new targetWords: ${newTargetWords.join(', ')}`);
    console.log();
    continue;
  }

  if (!sb.phonicsConfig) sb.phonicsConfig = {};
  sb.phonicsConfig.targetWords = newTargetWords;
  sb.flashcards = newFlashcards;
  sb.updatedAt = new Date().toISOString();
  try {
    await putBook(sb);
    console.log(`  ✓ 적용 완료\n`);
  } catch (e) {
    console.error(`  ✗ 실패: ${e.message}\n`);
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.table(summary);
if (!APPLY) console.log(`\n👀 DRY-RUN 종료. 실 적용은 \`--apply\``);
else console.log(`\n✓ 완료. 서버 재시작 권장 (listCache).`);
