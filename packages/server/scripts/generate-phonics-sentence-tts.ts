// 파닉스 flashcard 예문(`sentence`)의 **자연스러운 문장 음원**을 만든다 → `flashcard.sentenceTtsUrl`.
//
// 🔴 왜: 써보기 완성 시 예문을 `resolveTtsUrl`(파닉스 라이브러리 concat)로 읽었더니 "I have a can" 을
//    음소로 이어붙여 "이 해브 애 캔"(a=/æ/)처럼 어색했다(사용자 지적). 문장은 concat 이 아니라 **Gemini
//    자연 TTS** 로 읽어야 한다(Gemini 는 짧은 토큰엔 약하지만 전체 문장은 자연스럽다).
//
//   npx tsx packages/server/scripts/generate-phonics-sentence-tts.ts            # dry-run
//   npx tsx packages/server/scripts/generate-phonics-sentence-tts.ts --apply    # sentenceTtsUrl 저장
//   npx tsx packages/server/scripts/generate-phonics-sentence-tts.ts --book=3 --apply
import 'dotenv/config';
import type { Storybook } from '@tangobook/shared';
import { R2Repository } from '../src/repositories/r2.repository.js';

const APPLY = process.argv.includes('--apply');
const FORCE = process.argv.includes('--force'); // 이미 있어도 다시 굽기
const bookArg = process.argv.find((a) => a.startsWith('--book='))?.split('=')[1];
const GEN_API = 'https://www.tangobook.co.kr/api/tts/generate';

// Book 2·3·4·5 (예문이 flashcard 에 있는 권). Book 1 은 알파벳이라 예문 없음.
const UNIT_COUNTS: Record<string, number> = { '2': 8, '3': 7, '4': 8, '5': 8 };
const books = bookArg ? [bookArg] : ['2', '3', '4', '5'];
const UNITS = books.flatMap((b) =>
  Array.from({ length: UNIT_COUNTS[b] ?? 0 }, (_, i) => `en-b${b}-u0${i + 1}`)
);

interface Flashcard {
  word?: string;
  sentence?: string;
  sentenceTtsUrl?: string;
}

async function genSentence(text: string, unitId: string, ident: string): Promise<string | null> {
  const res = await fetch(GEN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      provider: 'gemini',
      language: 'english',
      storybookId: unitId,
      identifier: ident,
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { data?: { audioUrl?: string } };
  return j?.data?.audioUrl ?? null;
}

async function run() {
  console.log(`Mode: ${APPLY ? '✏️ APPLY' : '👀 DRY-RUN'}  units: ${UNITS.length}\n`);
  let ok = 0;
  let fail = 0;
  let skip = 0;

  for (const unitId of UNITS) {
    const sb = (await R2Repository.getStorybook(unitId)) as (Storybook & { flashcards?: Flashcard[] }) | null; // prettier-ignore
    if (!sb) {
      console.log(`[${unitId}] 없음`);
      continue;
    }
    const cards = sb.flashcards ?? [];
    let changed = false;
    for (const f of cards) {
      if (!f.sentence) continue;
      if (f.sentenceTtsUrl && !FORCE) {
        skip++;
        continue;
      }
      const url = await genSentence(
        f.sentence,
        unitId,
        `sentence-${f.word ?? f.sentence.slice(0, 12)}`
      );
      if (!url) {
        console.log(`   [${unitId}] ${f.word}: ❌ "${f.sentence}"`);
        fail++;
        continue;
      }
      console.log(`[${unitId}] ${f.word}: "${f.sentence}" → ${url.split('/').pop()}`);
      ok++;
      if (APPLY) {
        f.sentenceTtsUrl = url;
        changed = true;
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    if (changed && APPLY) {
      await R2Repository.saveStorybook(sb as Storybook);
      console.log(`[${unitId}] 💾 저장`);
    }
  }
  console.log(`\nok ${ok} · skip ${skip} · fail ${fail}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
