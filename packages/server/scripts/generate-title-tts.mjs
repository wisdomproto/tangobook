// 동화책 제목 낭독 TTS 배치 생성 — 표지+제목 인트로용. 모든 공개책 × 지원 언어(ko·en·vi·zh·th).
// 제목 = ko:book.title / 그 외:book.titleTranslations[lang]. → titleTtsUrls[lang] 저장 (멱등).
// Google native TTS(5개 언어 보이스) — 짧은 CJK/타이 제목도 정확·명료(Gemini 는 짧은 CJK 반복/무응답).
//   node packages/server/scripts/generate-title-tts.mjs [--dry-run] [--force] [--limit=N] [--book=<id>] [--lang=en]
import { loadEnv, getStorybook, putStorybook } from './translation-core.mjs';

loadEnv();

const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';
const ALL_LANGS = ['ko', 'en', 'vi', 'zh', 'th'];
const argVal = (n) => (process.argv.find((a) => a.startsWith(`--${n}=`)) ?? '').split('=')[1];
const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');
const LIMIT = Number(argVal('limit') || 0);
const ONLY_BOOK = argVal('book');
const ONLY_LANG = argVal('lang');
const LANGS = ONLY_LANG ? [ONLY_LANG] : ALL_LANGS;

function titleFor(book, lang) {
  return lang === 'ko' ? book.title : book.titleTranslations?.[lang];
}

async function genTitleTts(storybookId, lang, text) {
  const res = await fetch(`${API}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, provider: 'google', language: lang, storybookId, identifier: `title-${lang}` }),
  });
  if (!res.ok) throw new Error(`tts ${res.status}: ${(await res.text()).slice(0, 150)}`);
  return (await res.json()).data.audioUrl;
}

async function main() {
  const listRes = await fetch(`${API}/api/storybooks`);
  if (!listRes.ok) throw new Error(`목록 조회 실패 ${listRes.status} — 로컬 서버(${API}) 필요`);
  let list = ((await listRes.json()).data ?? []).filter(
    (b) => b.isPublic !== false && (!b.type || b.type === 'storybook')
  );
  if (ONLY_BOOK) list = list.filter((b) => b.id === ONLY_BOOK);
  if (LIMIT) list = list.slice(0, LIMIT);

  console.log(`[title-tts] 대상 ${list.length}권 × ${LANGS.join('/')} · dryRun=${DRY} · force=${FORCE}`);
  let ok = 0, skip = 0, fail = 0, missing = 0;

  for (const summary of list) {
    const book = await getStorybook(summary.id);
    if (!book) continue;
    book.titleTtsUrls = book.titleTtsUrls ?? {};
    let touched = false;
    for (const lang of LANGS) {
      const title = titleFor(book, lang);
      if (!title) { missing++; continue; }
      if (book.titleTtsUrls[lang] && !FORCE) { skip++; continue; }
      if (DRY) { console.log(`  · ${book.title} [${lang}] "${title}"`); continue; }
      try {
        const url = await genTitleTts(book.id, lang, title);
        book.titleTtsUrls[lang] = url;
        touched = true; ok++;
        await new Promise((r) => setTimeout(r, 1200)); // rate limit
      } catch (e) {
        console.error(`  ! ${book.title} [${lang}]: ${e.message}`);
        fail++;
      }
    }
    if (touched && !DRY) await putStorybook(book.id, book);
    if (!DRY) console.log(`  ✓ ${book.title} (ok=${ok} skip=${skip} fail=${fail})`);
  }
  console.log(`\n[title-tts] 완료 — ok=${ok} skip=${skip} fail=${fail} missing(제목없음)=${missing}`);
}

main().catch((e) => {
  console.error('[title-tts] 오류:', e);
  process.exit(1);
});
