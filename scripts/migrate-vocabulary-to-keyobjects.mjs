// 2026-04-30 — educational_content.vocabulary[] → key_objects[] 통합 마이그레이션.
//
// 룰 (한국어/영어 양방향 매칭):
//   각 책의 vocabulary 항목 v 마다, key_objects 중 매칭 시도:
//     - 매칭: lc(v.word) ∈ {lc(k.name), lc(k.nameEn), lc(k.nameTranslations.en)}
//             OR lc(v.korean) ∈ {lc(k.name), lc(k.korean)}
//     1. 매칭되면 → 빈 필드만 채움:
//        - k.korean ← v.korean (k.korean 비어있으면)
//        - k.nameTranslations.en ← v.word (없으면)
//        - k.nameEn ← v.word (없으면)
//        - k.definition ← v.definition (없으면)
//        - k.example ← v.example (없으면)
//     2. 매칭 안 되면 → 새 key_object push:
//        - 책의 default 언어가 한국어로 추정되면: name=v.korean, nameEn=v.word
//        - 영어로 추정되면: name=v.word, korean=v.korean
//        - description='', pages=[], definition, example
//
// 안전:
//   - key_objects[].name 은 절대 덮어쓰지 않음 (image generation identifier 보호)
//   - description / pages / size / customPrompt 그대로
//   - educational_content.vocabulary 도 비우지 않음 (호환 유지)
//   - idempotent — 재실행해도 추가 변화 없음
//
// 실행:
//   node scripts/migrate-vocabulary-to-keyobjects.mjs              # dry-run + 분석 리포트
//   node scripts/migrate-vocabulary-to-keyobjects.mjs --apply      # 실제 update

const API = 'http://localhost:3500/api';
const APPLY = process.argv.includes('--apply');
const CONCURRENCY = 6;

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
  let cursor = 0, done = 0;
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
    })
  );
  process.stdout.write('\n');
  return out;
}

function lc(s) { return (s || '').toLowerCase().trim(); }
const HANGUL_RE = /[ㄱ-ㆎ가-힣]/;
function isKorean(s) { return HANGUL_RE.test(s || ''); }

function findMatchIdx(next, v) {
  const vw = lc(v.word);
  const vk = lc(v.korean);
  for (let i = 0; i < next.length; i++) {
    const k = next[i];
    const kn = lc(k.name);
    const kkr = lc(k.korean);
    const ken = lc(k.nameEn);
    const ktrEn = lc(k.nameTranslations?.en);
    if (vw && (vw === kn || vw === ken || vw === ktrEn)) return i;
    if (vk && (vk === kn || vk === kkr)) return i;
  }
  return -1;
}

// 책의 key_objects 첫 항목의 name 으로 default 언어 추정
function detectDefaultLang(book) {
  const first = (book.key_objects || []).find((k) => k.name);
  if (first) return isKorean(first.name) ? 'ko' : 'en';
  return book.defaultLanguage || 'ko';
}

function planMigration(book) {
  const ko = book.key_objects || [];
  const vocab = book.educational_content?.vocabulary || [];
  if (!vocab.length) return { changed: false, merged: 0, added: 0, nextKeyObjects: ko };

  const next = ko.map((k) => ({ ...k, nameTranslations: { ...(k.nameTranslations || {}) } }));
  const defaultLang = detectDefaultLang(book);

  let merged = 0, added = 0;

  for (const v of vocab) {
    if (!v.word && !v.korean) continue;

    const idx = findMatchIdx(next, v);
    if (idx >= 0) {
      const k = next[idx];
      let touched = false;
      if (!k.korean && v.korean) { k.korean = v.korean; touched = true; }
      if (!k.nameEn && v.word) { k.nameEn = v.word; touched = true; }
      if (!k.nameTranslations.en && v.word) { k.nameTranslations.en = v.word; touched = true; }
      if (!k.definition && v.definition) { k.definition = v.definition; touched = true; }
      if (!k.example && v.example) { k.example = v.example; touched = true; }
      if (touched) merged++;
    } else {
      // 신규 key_object — default 언어에 맞게 name 결정
      const newKo = {
        name: defaultLang === 'ko' ? (v.korean || v.word) : v.word,
        korean: v.korean || '',
        nameEn: v.word || undefined,
        nameTranslations: v.word ? { en: v.word } : {},
        description: '',
        pages: [],
        definition: v.definition || undefined,
        example: v.example || undefined,
      };
      next.push(newKo);
      added++;
    }
  }

  // 빈 nameTranslations 객체는 정리 (필드 자체 제거)
  for (const k of next) {
    if (k.nameTranslations && Object.keys(k.nameTranslations).length === 0) {
      delete k.nameTranslations;
    }
  }

  return { changed: merged > 0 || added > 0, merged, added, nextKeyObjects: next };
}

async function main() {
  console.log(`mode: ${APPLY ? '🔥 APPLY' : 'DRY-RUN'}\n`);
  const list = await apiJson('/storybooks');
  console.log(`라이브러리 ${list.length}권. 개별 fetch...\n`);
  const books = await mapWithConcurrency(list, (s) => apiJson(`/storybooks/${s.id}`), CONCURRENCY);

  let totalVocab = 0, totalMerged = 0, totalAdded = 0, booksWithVocab = 0, booksToUpdate = 0;
  const samples = [];
  const willUpdate = [];

  for (const b of books) {
    if (!b || b.__error) continue;
    const vocab = b.educational_content?.vocabulary || [];
    totalVocab += vocab.length;
    if (vocab.length) booksWithVocab++;

    const plan = planMigration(b);
    if (plan.changed) {
      booksToUpdate++;
      totalMerged += plan.merged;
      totalAdded += plan.added;
      willUpdate.push({ book: b, plan });
      if (samples.length < 8) {
        samples.push(`  ${b.id.padEnd(20)} "${b.title?.slice(0,20)}"  vocab ${vocab.length} → merge ${plan.merged} / new ${plan.added}`);
      }
    }
  }

  console.log('─'.repeat(70));
  console.log(`라이브러리:                 ${list.length} 권`);
  console.log(`vocabulary 보유 책:         ${booksWithVocab} 권 (${((booksWithVocab/list.length)*100).toFixed(0)}%)`);
  console.log(`vocabulary 항목 합계:       ${totalVocab}`);
  console.log(`업데이트 대상 책:           ${booksToUpdate} 권`);
  console.log(`└ 기존 key_object 에 merge: ${totalMerged} 항목 (definition/example 추가)`);
  console.log(`└ 신규 key_object 추가:      ${totalAdded} 항목 (vocab-only 단어)`);
  console.log('\n샘플:');
  for (const s of samples) console.log(s);

  if (!APPLY) {
    console.log(`\n💡 위 결과 OK면 \`node scripts/migrate-vocabulary-to-keyobjects.mjs --apply\` 로 실행.`);
    return;
  }

  console.log('\n🔥 APPLY 모드 — 실제 업데이트 시작\n');
  let updated = 0, failed = 0;
  for (let i = 0; i < willUpdate.length; i++) {
    const { book: b, plan } = willUpdate[i];
    try {
      const next = { ...b, key_objects: plan.nextKeyObjects };
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
