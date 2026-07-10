// 나레이션(한국어 TTS) 없는 동화책 → 글 있는 페이지에 TTS 생성 → page.ttsUrl 세팅 → R2 저장.
// 생성 = 실행 중인 로컬 서버 `POST /api/tts/generate`(gemini) · 로드/저장 = translation-core(R2 직접).
// editor2 "전체 TTS 생성"(PagesTab)과 동일 경로(ko=page.ttsUrl, voice 기본 Leda).
//
// 사용:
//   node packages/server/scripts/generate-storybook-narration.mjs --dry-run      # 대상만 출력
//   node packages/server/scripts/generate-storybook-narration.mjs                # 전부 생성
//   node packages/server/scripts/generate-storybook-narration.mjs --limit 3      # 앞 3권만
//   node packages/server/scripts/generate-storybook-narration.mjs --book 178...  # 특정 책만
//   node packages/server/scripts/generate-storybook-narration.mjs --voice Sulafat
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
const LIMIT = Number(argVal('--limit') || 0);
const ONLY_BOOK = argVal('--book');
const DELAY_MS = 1500; // Gemini rate limit 방지

async function fetchMissingBooks() {
  const res = await fetch(`${API}/api/storybooks`);
  if (!res.ok) throw new Error(`목록 조회 실패 ${res.status} — 로컬 서버(${API})가 떠 있어야 합니다`);
  const json = await res.json();
  const list = json.data ?? json;
  return list.filter(
    (b) =>
      b.isPublic &&
      (!b.type || b.type === 'storybook') &&
      !(b.koCompletion && b.koCompletion.pagesTts)
  );
}

async function genPageTts(storybookId, pageNumber, text) {
  const res = await fetch(`${API}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, provider: 'gemini', voice: VOICE, language: 'ko', storybookId, pageNumber }),
  });
  if (!res.ok) throw new Error(`tts ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const json = await res.json();
  return json.data.audioUrl;
}

async function processBook(summary) {
  const book = await getStorybook(summary.id);
  if (!book) {
    console.log(`  ! ${summary.title}: R2에서 못 찾음`);
    return { ok: 0, total: 0 };
  }
  const pages = book.pages ?? [];
  const targets = pages.filter((p) => (p.text ?? '').trim().length > 0 && !p.ttsUrl);
  console.log(`\n▶ ${book.title} (${book.id}) — 나레이션 없는 글 페이지 ${targets.length}쪽`);
  if (targets.length === 0) {
    console.log('  (이미 완비)');
    return { ok: 0, total: 0 };
  }
  if (DRY) {
    console.log('  [dry-run] 생성 안 함');
    return { ok: 0, total: targets.length };
  }
  let ok = 0;
  for (let i = 0; i < targets.length; i++) {
    const p = targets[i];
    try {
      p.ttsUrl = await genPageTts(book.id, p.pageNumber, p.text);
      ok++;
      process.stdout.write(`  ✓ ${i + 1}/${targets.length} (쪽 ${p.pageNumber})       \r`);
    } catch (e) {
      console.log(`\n  ✗ 쪽 ${p.pageNumber} 실패: ${e.message}`);
    }
    if (i < targets.length - 1) await sleep(DELAY_MS);
  }
  await putStorybook(book.id, book);
  console.log(`\n  💾 저장 완료 (${ok}/${targets.length} 생성)`);
  return { ok, total: targets.length };
}

(async () => {
  let books = await fetchMissingBooks();
  if (ONLY_BOOK) books = books.filter((b) => b.id === ONLY_BOOK);
  if (LIMIT > 0) books = books.slice(0, LIMIT);

  console.log(`나레이션 생성 대상: ${books.length}권 (voice=${VOICE}${DRY ? ', DRY-RUN' : ''})`);
  const byCat = {};
  for (const b of books) (byCat[b.category || '기타'] ||= []).push(b.title);
  for (const [c, ts] of Object.entries(byCat)) console.log(`  ■ ${c} (${ts.length}): ${ts.join(', ')}`);

  let totOk = 0;
  let totPages = 0;
  for (const b of books) {
    const r = await processBook(b);
    totOk += r.ok;
    totPages += r.total;
  }
  console.log(`\n완료 — ${books.length}권, 페이지 ${totOk}/${totPages} 생성.`);
  if (!DRY)
    console.log('※ 실행 중인 서버의 목록 캐시는 잠시 후 갱신 — 즉시 확인하려면 서버 재시작.');
})();
