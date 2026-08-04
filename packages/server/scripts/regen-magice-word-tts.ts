// Book 3 (Magic-e 장모음) 낱말 음원을 **[장모음 이름] [낱말]** 로 다시 굽는다.
//
// 🔴 매직-e 는 "e 가 모음을 이름대로 말하게 한다"(a_e → 모음 a 가 '에이'). 그래서 낱말만 읽던 걸
//    (사용자 지적) 장모음(모음이 제 이름을 말하는 소리) + 낱말로 바꾼다 — Book 4/5 [블렌드][낱말]과 대칭.
//    장모음 이름 = long-a→"ay"(에이) · long-i→"eye"(아이) · long-o→"oh"(오) · long-u→"you"(유).
//    라이브러리엔 장모음 낱글자 이름 클립이 없어(ai/oa 는 있지만 i/u 없음) 한 목소리로 통일하려고
//    **Gemini 로 통 문장** "ay cave" 를 굽는다(Book 5 라이브러리 없는 낱말 폴백과 같은 경로).
//
//   npx tsx packages/server/scripts/regen-magice-word-tts.ts --unit=en-b3-u01 --sample   # 1개만 dry
//   npx tsx packages/server/scripts/regen-magice-word-tts.ts                              # dry-run 전체
//   npx tsx packages/server/scripts/regen-magice-word-tts.ts --apply                      # 교체 + 저장
import 'dotenv/config';
import type { Storybook } from '@tangobook/shared';
import { R2Repository } from '../src/repositories/r2.repository.js';

const APPLY = process.argv.includes('--apply');
const SAMPLE = process.argv.includes('--sample'); // 유닛당 첫 낱말 하나만
const unitArg = process.argv.find((a) => a.startsWith('--unit='))?.split('=')[1];
const UNITS = unitArg ? [unitArg] : Array.from({ length: 7 }, (_, i) => `en-b3-u0${i + 1}`);
const GEN_API = 'https://www.tangobook.co.kr/api/tts/generate';
const CONCAT_API = 'https://www.tangobook.co.kr/api/phonics-library/concat';

// 장모음 = 모음이 제 이름을 말하는 소리(모음이 이름을 말함). 화면 a_e 팀 강조와 일치.
// 🔴 concat 은 라이브러리 클립을 이어붙인다(Gemini 통문장은 프리픽스를 들쭉날쭉 읽어 탈락) —
//    ay=Book 5 장-a 이중자음 클립(/eɪ/) · eye/oh/you=단어 클립(/aɪ/·/oʊ/·/juː/, letter 이름과 동일).
const LONG_VOWEL_NAME: Record<string, string> = {
  'long-a': 'ay',
  'long-i': 'eye',
  'long-o': 'oh',
  'long-u': 'you',
};

async function concat(text: string, unitId: string, identifier: string): Promise<string | null> {
  const res = await fetch(CONCAT_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, storybookId: unitId, identifier, language: 'english' }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { data?: { audioUrl?: string } };
  return j?.data?.audioUrl ?? null;
}

async function genPhrase(text: string, unitId: string, identifier: string): Promise<string | null> {
  const res = await fetch(GEN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      provider: 'gemini',
      language: 'english',
      storybookId: unitId,
      identifier,
    }),
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { data?: { audioUrl?: string } };
  return j?.data?.audioUrl ?? null;
}

interface WFWord {
  word: string;
  ttsUrl?: string;
}

async function run() {
  console.log(`Mode: ${APPLY ? '✏️ APPLY' : SAMPLE ? '🎧 SAMPLE' : '👀 DRY-RUN'}\n`);
  let ok = 0;
  let fail = 0;

  for (const unitId of UNITS) {
    const sb = (await R2Repository.getStorybook(unitId)) as Storybook | null;
    if (!sb) {
      console.log(`[${unitId}] 없음`);
      continue;
    }
    // 🔴 장모음은 커리큘럼 phonemes 가 아니라 **낱말의 모음(a/i/o/u)에서 직접** 판정한다
    //    (magic-e = 모음 + 자음 + e). storybook 에 phonemes 가 없어도 안전.
    const wf =
      (sb as { phonicsLesson?: { wordFamilies?: { words?: WFWord[] }[] } }).phonicsLesson
        ?.wordFamilies ?? [];
    let changed = false;

    for (const fam of wf) {
      for (const w of fam.words ?? []) {
        // magic-e 낱말의 장모음 = 끝에서 두 번째 모음(_VCe). 첫 모음을 잡는다.
        const m = w.word.toLowerCase().match(/([aiou])[bcdfghjklmnpqrstvwxyz]e$/);
        const vowel = m?.[1];
        const key =
          vowel === 'a'
            ? 'long-a'
            : vowel === 'i'
              ? 'long-i'
              : vowel === 'o'
                ? 'long-o'
                : vowel === 'u'
                  ? 'long-u'
                  : null;
        const prefix = key ? LONG_VOWEL_NAME[key] : null;
        if (!prefix) {
          console.log(`   [${unitId}] ${w.word}: 매직-e 모음 못 찾음`);
          fail++;
          continue;
        }
        const text = `${prefix} ${w.word}`;
        // 🔴 라이브러리 concat 우선(일관된 pre-recorded 클립) → 낱말이 라이브러리에 없으면 Gemini 통문장 폴백.
        let url = await concat(text, unitId, `magice-${prefix}-${w.word}`);
        let note = `concat "${text}"`;
        if (!url) {
          url = await genPhrase(text, unitId, `magice-gem-${prefix}-${w.word}`);
          note = `gemini "${text}"`;
        }
        if (!url) {
          console.log(`   [${unitId}] ${w.word}: ❌ 실패 "${text}"`);
          fail++;
          continue;
        }
        console.log(`[${unitId}] ${w.word}: ${note} → ${url}`);
        ok++;
        if (APPLY) {
          w.ttsUrl = url;
          changed = true;
        }
        if (SAMPLE) {
          console.log(`\n🎧 SAMPLE 1개만: ${url}`);
          return;
        }
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    if (changed && APPLY) {
      await R2Repository.saveStorybook(sb);
      console.log(`[${unitId}] 💾 저장`);
    }
  }
  console.log(`\nok ${ok} · fail ${fail}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
