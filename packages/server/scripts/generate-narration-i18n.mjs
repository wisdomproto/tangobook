// 동화책 페이지 나레이션(vi/zh/th) 생성 → page.translations[lang].ttsUrl 주입 → R2 저장.
// 뷰어가 그 언어로 책을 읽어주고, 게임 장면 리빌도 나레이션이 나온다.
// 엔진 = Gemini Leda (문장 나레이션은 표현력·정확도 우위; STT 검증 zh98/vi99/th98%).
//   ↔ 낱단어(게임)는 Google(=generate-vocab-tts.mjs). ko 나레이션은 generate-storybook-narration.mjs.
//
// 사용:
//   node packages/server/scripts/generate-narration-i18n.mjs --dry-run
//   node packages/server/scripts/generate-narration-i18n.mjs --lang zh
//   node packages/server/scripts/generate-narration-i18n.mjs                # vi+zh+th
//   node packages/server/scripts/generate-narration-i18n.mjs --book 177... --lang vi
//   node packages/server/scripts/generate-narration-i18n.mjs --force
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
const VOICE = argVal('--voice') || 'Leda';
const DRY = hasFlag('--dry-run');
const FORCE = hasFlag('--force');
const LIMIT = Number(argVal('--limit') || 0);
const ONLY_BOOK = argVal('--book');
const ONLY_LANG = argVal('--lang');
const LANGS = ONLY_LANG ? [ONLY_LANG] : ['vi', 'zh', 'th'];
const CONC = Number(argVal('--conc') || 3); // 동시 생성 수 (Gemini withGeminiRetry 가 429 backoff)

/** items 를 conc 개씩 동시 처리. worker(item,i) 성공 카운트 반환. */
async function runPool(items, conc, worker) {
  let idx = 0;
  let ok = 0;
  async function loop() {
    while (idx < items.length) {
      const i = idx++;
      try {
        await worker(items[i], i);
        ok++;
      } catch (e) {
        console.log(`\n  ✗ ${items[i].lang} p${items[i].page.pageNumber} 실패: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(conc, items.length) }, loop));
  return ok;
}

async function fetchBooks() {
  const res = await fetch(`${API}/api/storybooks`);
  if (!res.ok) throw new Error(`목록 조회 실패 ${res.status} — 로컬 서버(${API})가 떠 있어야 합니다`);
  const json = await res.json();
  const list = json.data ?? json;
  return list.filter((b) => b.isPublic && (!b.type || b.type === 'storybook'));
}

async function genPageTts(storybookId, lang, text, pageNumber) {
  const body = JSON.stringify({
    text,
    provider: 'gemini',
    voice: VOICE,
    language: lang,
    storybookId,
    identifier: `narr-${lang}-p${pageNumber}`,
  });
  // 연결 실패(서버 재시작 blip)·5xx 는 재시도. tsx dev 서버가 파일변경/부하로 잠깐 죽어도 견딤.
  let lastErr;
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(`${API}/api/tts/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
      if (!res.ok) throw new Error(`tts ${res.status}: ${(await res.text()).slice(0, 120)}`);
      const json = await res.json();
      return json.data.audioUrl;
    } catch (e) {
      lastErr = e;
      await sleep(2000 * (attempt + 1)); // 2s,4s,6s,8s backoff (서버 재기동 대기)
    }
  }
  throw lastErr;
}

async function processBook(summary) {
  const book = await getStorybook(summary.id);
  if (!book) {
    console.log(`  ! ${summary.title}: R2에서 못 찾음`);
    return { ok: 0, total: 0 };
  }
  const pages = book.pages ?? [];
  // (page, lang) 타겟 = 그 언어 번역 텍스트 있음 + (강제 or ttsUrl 없음)
  const targets = [];
  for (const p of pages) {
    for (const lang of LANGS) {
      const tr = p.translations?.[lang];
      const text = (tr?.text ?? '').trim();
      if (!text) continue;
      if (!FORCE && tr?.ttsUrl) continue;
      targets.push({ page: p, lang, text });
    }
  }
  if (targets.length === 0) return { ok: 0, total: 0 };
  console.log(`\n▶ ${book.title} (${book.id}) — 나레이션 ${targets.length}개`);
  if (DRY) {
    const byLang = {};
    for (const t of targets) byLang[t.lang] = (byLang[t.lang] || 0) + 1;
    console.log(`  [dry] ${Object.entries(byLang).map(([l, n]) => `${l}:${n}`).join(' ')}`);
    return { ok: 0, total: targets.length };
  }
  let done = 0;
  const ok = await runPool(targets, CONC, async ({ page, lang, text }) => {
    const url = await genPageTts(book.id, lang, text, page.pageNumber);
    page.translations[lang].ttsUrl = url;
    process.stdout.write(`  ✓ ${++done}/${targets.length}       \r`);
  });
  await putStorybook(book.id, book);
  console.log(`\n  💾 저장 완료 (${ok}/${targets.length})`);
  return { ok, total: targets.length };
}

(async () => {
  let books = await fetchBooks();
  if (ONLY_BOOK) books = books.filter((b) => b.id === ONLY_BOOK);
  if (LIMIT > 0) books = books.slice(0, LIMIT);

  console.log(`나레이션 생성(i18n) — ${books.length}권 · 언어 [${LANGS.join(',')}] · voice ${VOICE}${DRY ? ' · DRY' : ''}${FORCE ? ' · FORCE' : ''}`);
  let totOk = 0;
  let totTargets = 0;
  for (const b of books) {
    const r = await processBook(b);
    totOk += r.ok;
    totTargets += r.total;
  }
  console.log(`\n완료 — ${books.length}권, 나레이션 ${totOk}/${totTargets} 생성.`);
})();
