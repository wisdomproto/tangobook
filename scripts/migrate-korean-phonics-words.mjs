// 2026-05-01 — 한글 파닉스 책(kr-h*-u*) 의 영어 word 필드 → 한글로 정정.
//
// 문제:
//   AI 생성 prompt 가 한글 파닉스 책에서도 word="영어단어" 또는 word="로마자표기"로 저장.
//   예: flashcards.word="do-you" (도마), vocabulary.word="soy milk" (두유), key_objects.name="soy milk" (두유)
//
// 룰:
//   - flashcards: word ← localWord (한글). localWord 비어있으면 skip.
//   - vocabulary: word ← korean. korean 비어있으면 skip.
//   - key_objects: name ← korean. nameEn 은 그대로 (영어 번역 보존).
//   - 이미 한글이면 변경 없음 (idempotent)
//
// 안전:
//   - kr-h*-u* 책만 처리 (영어 파닉스 en-b*-u* 절대 안 건드림)
//   - korean/localWord 비어있으면 skip — 데이터 안전
//
// 실행:
//   node scripts/migrate-korean-phonics-words.mjs              # dry-run
//   node scripts/migrate-korean-phonics-words.mjs --apply      # 실제 update

const API = 'http://localhost:3500/api';
const APPLY = process.argv.includes('--apply');
const HANGUL = /[가-힯ᄀ-ᇿ]/;

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

function planMigration(book) {
  const changes = { flashcards: 0, vocab: 0, keyObjects: 0 };
  let touched = false;

  // flashcards: word ← localWord (한글이어야 함)
  if (Array.isArray(book.flashcards)) {
    for (const f of book.flashcards) {
      const lw = (f.localWord || '').trim();
      const w = (f.word || '').trim();
      // localWord 한글이고 word 가 한글 아니면 swap
      if (lw && HANGUL.test(lw) && !HANGUL.test(w)) {
        f.word = lw;
        changes.flashcards++;
        touched = true;
      }
    }
  }

  // educational_content.vocabulary: word ← korean
  const vocab = book.educational_content?.vocabulary;
  if (Array.isArray(vocab)) {
    for (const v of vocab) {
      const ko = (v.korean || '').trim();
      const w = (v.word || '').trim();
      if (ko && HANGUL.test(ko) && !HANGUL.test(w)) {
        v.word = ko;
        changes.vocab++;
        touched = true;
      }
    }
  }

  // key_objects: name ← korean (nameEn 보존)
  if (Array.isArray(book.key_objects)) {
    for (const k of book.key_objects) {
      const ko = (k.korean || '').trim();
      const nm = (k.name || '').trim();
      if (ko && HANGUL.test(ko) && !HANGUL.test(nm)) {
        // 기존 영어 name 은 nameEn 으로 보존 (없을 때만)
        if (!k.nameEn && nm) k.nameEn = nm;
        if (!k.nameTranslations) k.nameTranslations = {};
        if (!k.nameTranslations.en && nm) k.nameTranslations.en = nm;
        k.name = ko;
        changes.keyObjects++;
        touched = true;
      }
    }
  }

  return { touched, changes };
}

async function main() {
  console.log(`mode: ${APPLY ? '🔥 APPLY' : 'DRY-RUN'}\n`);
  const list = await apiJson('/storybooks');
  const koreanPhonics = list.filter((s) => /^kr-h\d+-u\d+$/.test(s.id));
  console.log(`한글 파닉스 책: ${koreanPhonics.length} 권\n`);

  let totalChanges = { flashcards: 0, vocab: 0, keyObjects: 0 };
  let booksToUpdate = 0, booksSkipped = 0, errors = 0;
  const willUpdate = [];
  const samples = [];

  for (const summary of koreanPhonics) {
    try {
      const book = await apiJson(`/storybooks/${summary.id}`);
      const plan = planMigration(book);
      if (plan.touched) {
        booksToUpdate++;
        totalChanges.flashcards += plan.changes.flashcards;
        totalChanges.vocab += plan.changes.vocab;
        totalChanges.keyObjects += plan.changes.keyObjects;
        willUpdate.push({ book, plan });
        if (samples.length < 8) {
          samples.push(`  ${book.id}  flashcards ${plan.changes.flashcards} / vocab ${plan.changes.vocab} / keyObj ${plan.changes.keyObjects}  "${book.title?.slice(0,30)}"`);
        }
      } else {
        booksSkipped++;
      }
    } catch (e) {
      errors++;
      console.error(`  ${summary.id}: ${e.message}`);
    }
  }

  console.log('─'.repeat(70));
  console.log(`업데이트 대상:           ${booksToUpdate} 권`);
  console.log(`이미 한글 (skip):        ${booksSkipped} 권`);
  console.log(`errors:                  ${errors}`);
  console.log(`flashcards.word 정정:    ${totalChanges.flashcards}`);
  console.log(`vocabulary.word 정정:    ${totalChanges.vocab}`);
  console.log(`key_objects.name 정정:   ${totalChanges.keyObjects}`);
  console.log('\n샘플:');
  for (const s of samples) console.log(s);

  if (!APPLY) {
    console.log(`\n💡 위 결과 OK면 \`node scripts/migrate-korean-phonics-words.mjs --apply\` 로 실행.`);
    return;
  }

  console.log('\n🔥 APPLY 모드 — 실제 업데이트 시작\n');
  let updated = 0, failed = 0;
  for (let i = 0; i < willUpdate.length; i++) {
    const { book } = willUpdate[i];
    try {
      await apiJson('/storybooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storybook: book }),
      });
      updated++;
      if (updated % 5 === 0) process.stdout.write(`\r  updated ${updated}    `);
    } catch (e) {
      failed++;
      if (failed <= 5) console.log(`  ${book.id} FAILED: ${e.message}`);
    }
  }
  process.stdout.write('\n');
  console.log(`\n━━ 완료 ━━\nupdated: ${updated}\nfailed:  ${failed}`);

  // vocabulary-db bulk-sync 트리거 (변경 내용 반영)
  console.log('\n🔄 vocabulary-db bulk-sync 트리거...');
  try {
    const result = await apiJson('/vocabulary-db/bulk-sync', { method: 'POST' });
    console.log(`✅ bulk-sync: total=${result.total ?? '?'} added=${result.added ?? '?'} updated=${result.updated ?? '?'}`);
  } catch (e) {
    console.warn(`⚠️ bulk-sync 실패: ${e.message}. 수동으로 \`POST /api/vocabulary-db/bulk-sync\` 호출 필요.`);
  }
}

main().catch((err) => { console.error(err); process.exit(1); });
