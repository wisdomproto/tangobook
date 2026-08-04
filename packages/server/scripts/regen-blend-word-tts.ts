// Book 4 (블렌드·이중자음) 낱말 음원을 **[블렌드 소리] [낱말]** 로 다시 굽는다.
//
// 🔴 기존 음원이 "블래 블래 블락"(blend blend word, 3.9초) 로 깨져 있었다(사용자 지적).
//    라이브러리엔 깨끗한 블렌드 소리(mod_phonics `bl`·`cl`…)와 낱말이 있으므로, concat 으로
//    "bl block"(/bl/ + block) 을 만들어 word.ttsUrl 을 교체한다. Gemini 안 씀(라이브러리 concat).
//
//   npx tsx packages/server/scripts/regen-blend-word-tts.ts            # dry-run
//   npx tsx packages/server/scripts/regen-blend-word-tts.ts --apply    # ttsUrl 교체 + 저장
import 'dotenv/config';
import type { Storybook } from '@tangobook/shared';
import { R2Repository } from '../src/repositories/r2.repository.js';

const APPLY = process.argv.includes('--apply');
const unitArg = process.argv.find((a) => a.startsWith('--unit='))?.split('=')[1];
const book = process.argv.find((a) => a.startsWith('--book='))?.split('=')[1] ?? '4';
// Book 4 = 블렌드/이중자음, Book 5 = 모음팀(ee·ea…) — 둘 다 [타겟소리][낱말] 로 굽는다(같은 깨짐).
const UNITS = unitArg ? [unitArg] : Array.from({ length: 8 }, (_, i) => `en-b${book}-u0${i + 1}`);
const CONCAT_API = 'https://www.tangobook.co.kr/api/phonics-library/concat';

const GEN_API = 'https://www.tangobook.co.kr/api/tts/generate';

function matchesPattern(word: string, pattern: string): boolean {
  const core = pattern.replace(/_/g, '').toLowerCase();
  const w = word.toLowerCase();
  if (pattern.startsWith('_')) return w.endsWith(core);
  if (pattern.endsWith('_')) return w.startsWith(core);
  return w.includes(core);
}

/** 낱말이 속한 패턴의 블렌드 소리 — 접두/접미 먼저, 없으면 **포함**(dolphin 의 ph, bath 의 th). */
function blendFor(word: string, patterns: string[]): string | null {
  for (const p of patterns) if (matchesPattern(word, p)) return p.replace(/_/g, '');
  const w = word.toLowerCase();
  for (const p of patterns) {
    const core = p.replace(/_/g, '').toLowerCase();
    if (core && w.includes(core)) return core;
  }
  return null;
}

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

/** 라이브러리에 없는 낱말 — Gemini 로 **낱말만** 합성(블렌드 프리픽스 없음). 폴백용. */
async function genWordOnly(word: string, unitId: string): Promise<string | null> {
  const res = await fetch(GEN_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: word,
      provider: 'gemini',
      language: 'english',
      storybookId: unitId,
      identifier: `blendword-only-${word}`,
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
  console.log(`Mode: ${APPLY ? '✏️ APPLY' : '👀 DRY-RUN'}\n`);
  let ok = 0;
  let fail = 0;

  for (const unitId of UNITS) {
    const sb = (await R2Repository.getStorybook(unitId)) as Storybook | null;
    if (!sb) {
      console.log(`[${unitId}] 없음`);
      continue;
    }
    const patterns =
      (sb as { phonicsConfig?: { targetPatterns?: string[] } }).phonicsConfig?.targetPatterns ?? [];
    const wf =
      (sb as { phonicsLesson?: { wordFamilies?: { words?: WFWord[] }[] } }).phonicsLesson
        ?.wordFamilies ?? [];
    let changed = false;

    for (const fam of wf) {
      for (const w of fam.words ?? []) {
        const blend = blendFor(w.word, patterns);
        if (!blend) {
          console.log(`   [${unitId}] ${w.word}: 패턴 매칭 없음 (patterns=${patterns.join(',')})`);
          fail++;
          continue;
        }
        const text = `${blend} ${w.word}`;
        let url = await concat(text, unitId, `blend-${blend}-${w.word}`);
        let note = `"${text}"`;
        if (!url) {
          // 낱말이 라이브러리에 없다 → Gemini 로 낱말만(블렌드 없이).
          url = await genWordOnly(w.word, unitId);
          note = `낱말만(라이브러리 없음) "${w.word}"`;
        }
        if (!url) {
          console.log(`   [${unitId}] ${w.word}: ❌ 실패 ${note}`);
          fail++;
          continue;
        }
        console.log(`[${unitId}] ${w.word}: ${note} → ${url.split('/').pop()}`);
        ok++;
        if (APPLY) {
          w.ttsUrl = url;
          changed = true;
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
