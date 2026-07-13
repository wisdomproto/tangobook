// 특정 페이지의 영어 나레이션 TTS 누락 보정 — page.translations.en.text → en TTS 생성 → translations.en.ttsUrl 세팅.
// 뷰어가 영어 모드에서 en ttsUrl 없으면 한글 음성으로 폴백하는 버그(page-text.ts) 대응.
// voice 는 기본값(config.gemini.ttsVoice) = 기존 en 페이지와 동일 화자. language:'en' 으로 영어 낭독.
//   node packages/server/scripts/generate-en-narration.mjs [--dry-run] [--force]
import { loadEnv, getStorybook, putStorybook } from './translation-core.mjs';

loadEnv();

const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';
const DRY = process.argv.includes('--dry-run');
const FORCE = process.argv.includes('--force');

const jobs = [
  { id: '1778555233699', pages: [6], label: '백설공주' },
  { id: '1772510956605', pages: [3, 15], label: '잭과콩나무' },
];

async function genEnTts(storybookId, pageNumber, text) {
  const res = await fetch(`${API}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, provider: 'gemini', language: 'en', storybookId, pageNumber }),
  });
  if (!res.ok) throw new Error(`tts ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return (await res.json()).data.audioUrl;
}

async function main() {
  for (const job of jobs) {
    const book = await getStorybook(job.id);
    if (!book) {
      console.log(`  ! ${job.label}(${job.id}): R2에서 못 찾음`);
      continue;
    }
    const pages = book.pages ?? [];
    let touched = false;
    for (const pn of job.pages) {
      const page = pages.find((p, i) => (p.pageNumber ?? i + 1) === pn);
      if (!page) {
        console.log(`  ! ${job.label} p${pn}: 페이지 없음`);
        continue;
      }
      const en = page.translations?.en;
      const enText = en?.text;
      if (!enText) {
        console.log(`  ! ${job.label} p${pn}: en 텍스트 없음`);
        continue;
      }
      if (en.ttsUrl && !FORCE) {
        console.log(`  = ${job.label} p${pn}: 이미 en ttsUrl 있음 (skip)`);
        continue;
      }
      console.log(`  · ${job.label} p${pn}: "${enText.slice(0, 50)}..."`);
      if (DRY) continue;
      const url = await genEnTts(job.id, pn, enText);
      page.translations.en.ttsUrl = url;
      touched = true;
      console.log(`  ✓ ${job.label} p${pn} → ...${url.slice(-44)}`);
    }
    if (touched && !DRY) await putStorybook(book);
  }
  console.log('\n[en-narration] 완료');
}

main().catch((e) => {
  console.error('[en-narration] 오류:', e);
  process.exit(1);
});
