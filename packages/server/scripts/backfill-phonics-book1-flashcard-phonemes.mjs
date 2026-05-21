#!/usr/bin/env node
/**
 * 영어 파닉스 Book 1 flashcards 의 `phonemes` 필드 누락 보강.
 *
 * sync-phonics-book1-targetwords.mjs 가 새로 추가한 flashcard entry (옛 flashcards 에 없던 단어)
 * 는 phonemes 필드를 빠뜨림 → FlashcardTab `.map()` 런타임 에러.
 *
 * 보강 규칙: `phonemes = word.toLowerCase().split('')` (가장 단순한 분해 — Book 1 학습 단어용).
 * 또한 `sentence` / `imageDescription` 도 비어있으면 기본 문구로 채움.
 *
 * 사용:
 *   node scripts/backfill-phonics-book1-flashcard-phonemes.mjs            # dry-run
 *   node scripts/backfill-phonics-book1-flashcard-phonemes.mjs --apply
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

let totalFixed = 0;
for (const id of UNIT_IDS) {
  const sb = await getBook(id);
  const fc = sb.flashcards ?? [];
  let fixed = 0;
  for (const c of fc) {
    if (!Array.isArray(c.phonemes) || c.phonemes.length === 0) {
      c.phonemes = String(c.word ?? '')
        .toLowerCase()
        .split('')
        .filter((ch) => /[a-z]/.test(ch));
      fixed++;
    }
    if (!c.sentence) {
      // 단어 안 'a' 모음이면 'An X.' 패턴, 자음이면 'The X.' — 단순
      const w = String(c.word ?? '');
      c.sentence = /^[aeiouAEIOU]/.test(w) ? `An ${w}.` : `The ${w}.`;
    }
    if (!c.imageDescription) {
      c.imageDescription = `A clear, friendly illustration of ${c.word} for kids.`;
    }
  }
  totalFixed += fixed;
  console.log(`[${id}] flashcards ${fc.length} · phonemes 누락 보강 ${fixed}건`);
  if (APPLY && fixed > 0) {
    sb.updatedAt = new Date().toISOString();
    try {
      await putBook(sb);
      console.log(`  ✓ 적용`);
    } catch (e) {
      console.error(`  ✗ 실패: ${e.message}`);
    }
  }
}

console.log(`\n총 보강: ${totalFixed}건`);
if (!APPLY) console.log(`실 적용은 \`--apply\``);
