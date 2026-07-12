// 다국어 어휘 게임 단어 발음(vi/zh/th) 생성 → key_objects[].ttsUrls[lang] 주입 → R2 저장.
// 게임(order-block/order-writing·그림짝·단어 미리보기)이 이 URL 을 자동 재생.
//
// 생성 = 실행 중인 로컬 서버 POST /api/tts/generate (provider:google, Chirp3-HD/Achernar 보이스).
// 저장 = translation-core(R2 직접). node 실행 필수(bash curl 은 한자 UTF-8 깨짐).
//
// 사용:
//   node packages/server/scripts/generate-vocab-tts.mjs --dry-run           # 대상 카운트만
//   node packages/server/scripts/generate-vocab-tts.mjs --lang zh           # 중국어만
//   node packages/server/scripts/generate-vocab-tts.mjs                     # zh+vi+th 전부
//   node packages/server/scripts/generate-vocab-tts.mjs --book 177... --lang th
//   node packages/server/scripts/generate-vocab-tts.mjs --limit 3
//   node packages/server/scripts/generate-vocab-tts.mjs --force            # 기존 ttsUrls[lang] 덮어쓰기
import { loadEnv, getStorybook, putStorybook } from './translation-core.mjs';

loadEnv();

const argv = process.argv;
const hasFlag = (f) => argv.includes(f);
const argVal = (f) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';
const DRY = hasFlag('--dry-run');
const FORCE = hasFlag('--force');
const LIMIT = Number(argVal('--limit') || 0);
const ONLY_BOOK = argVal('--book');
const ONLY_LANG = argVal('--lang');
const LANGS = ONLY_LANG ? [ONLY_LANG] : ['zh', 'vi', 'th'];
const DELAY_MS = 400; // Google TTS QPS 여유

async function fetchBooks() {
  const res = await fetch(`${API}/api/storybooks`);
  if (!res.ok) throw new Error(`목록 조회 실패 ${res.status} — 로컬 서버(${API})가 떠 있어야 합니다`);
  const json = await res.json();
  const list = json.data ?? json;
  return list.filter((b) => b.isPublic && (!b.type || b.type === 'storybook'));
}

async function genWordTts(storybookId, lang, word, identifier) {
  const res = await fetch(`${API}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: word, provider: 'google', language: lang, storybookId, identifier }),
  });
  if (!res.ok) throw new Error(`tts ${res.status}: ${(await res.text()).slice(0, 160)}`);
  const json = await res.json();
  return json.data.audioUrl;
}

async function processBook(summary) {
  const book = await getStorybook(summary.id);
  if (!book) {
    console.log(`  ! ${summary.title}: R2에서 못 찾음`);
    return { ok: 0, total: 0 };
  }
  const kos = book.key_objects ?? [];
  // (keyObject, lang, word) 타겟 = 번역 있음 + (강제 or ttsUrls[lang] 없음)
  const targets = [];
  for (const ko of kos) {
    for (const lang of LANGS) {
      const word = ko.nameTranslations?.[lang]?.trim();
      if (!word) continue;
      if (!FORCE && ko.ttsUrls?.[lang]) continue;
      targets.push({ ko, lang, word });
    }
  }
  if (targets.length === 0) return { ok: 0, total: 0 };
  console.log(`\n▶ ${book.title} (${book.id}) — 단어 음원 ${targets.length}개`);
  if (DRY) {
    const byLang = {};
    for (const t of targets) byLang[t.lang] = (byLang[t.lang] || 0) + 1;
    console.log(`  [dry-run] ${Object.entries(byLang).map(([l, n]) => `${l}:${n}`).join(' ')}`);
    return { ok: 0, total: targets.length };
  }
  let ok = 0;
  for (let i = 0; i < targets.length; i++) {
    const { ko, lang, word } = targets[i];
    try {
      const id = `vword-${lang}-${encodeURIComponent(word)}`;
      const url = await genWordTts(book.id, lang, word, id);
      ko.ttsUrls = ko.ttsUrls ?? {};
      ko.ttsUrls[lang] = url;
      ok++;
      process.stdout.write(`  ✓ ${i + 1}/${targets.length} ${lang} ${word}            \r`);
    } catch (e) {
      console.log(`\n  ✗ ${lang} ${word} 실패: ${e.message}`);
    }
    if (i < targets.length - 1) await sleep(DELAY_MS);
  }
  await putStorybook(book.id, book);
  console.log(`\n  💾 저장 완료 (${ok}/${targets.length})`);
  return { ok, total: targets.length };
}

(async () => {
  let books = await fetchBooks();
  if (ONLY_BOOK) books = books.filter((b) => b.id === ONLY_BOOK);
  if (LIMIT > 0) books = books.slice(0, LIMIT);

  console.log(`어휘 단어 TTS 생성 — ${books.length}권 · 언어 [${LANGS.join(',')}]${DRY ? ' · DRY-RUN' : ''}${FORCE ? ' · FORCE' : ''}`);
  let totOk = 0;
  let totTargets = 0;
  for (const b of books) {
    const r = await processBook(b);
    totOk += r.ok;
    totTargets += r.total;
  }
  console.log(`\n완료 — ${books.length}권, 단어 음원 ${totOk}/${totTargets} 생성.`);
  if (!DRY) console.log('※ 서버 목록 캐시는 잠시 후 갱신 — 즉시 확인하려면 서버 재시작.');
})();
