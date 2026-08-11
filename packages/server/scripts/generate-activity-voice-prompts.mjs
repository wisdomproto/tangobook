#!/usr/bin/env node
/**
 * 학습 활동 **안내 음성**을 Gemini TTS 로 만들어 클라이언트 정적 자산으로 저장 (멱등).
 *
 *   출력: packages/client/public/sounds/voice/{name}.mp3
 *
 * 🔴 파닉스 concat(음절 mp3 이어붙이기)으로는 문장을 못 만든다 — "잘·듣·고·맞·춰·봐" 를 이어 붙이면
 *    사람이 말하는 게 아니라 글자를 하나씩 읽는 소리가 된다. 문장은 진짜 TTS 로 한 번 굽는다.
 * 🔴 R2 가 아니라 **`public/` 정적 파일**이다 — 활동 진입 때마다 URL 을 물을 이유가 없고,
 *    빌드에 포함돼 오프라인·SW 캐시로 즉시 난다. 대신 문구를 바꾸면 이 스크립트를 다시 돌려야 한다.
 *
 * 사용 (로컬 서버가 떠 있어야 함 — Gemini 키는 서버 .env 에 있다):
 *   node packages/server/scripts/generate-activity-voice-prompts.mjs            # dry-run
 *   node packages/server/scripts/generate-activity-voice-prompts.mjs --apply
 *   node packages/server/scripts/generate-activity-voice-prompts.mjs --apply --force   # 이미 있어도 재생성
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.join(__dirname, '..', '..', 'client', 'public', 'sounds', 'voice');
const API_BASE = process.env.API_BASE || 'http://localhost:3500';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const FORCE = args.flags.has('force');

/** 만들 안내 음성. name = 파일명, 클라이언트가 `/sounds/voice/{name}.mp3` 로 쓴다. */
const PROMPTS = [
  { name: 'quiz-start-ko', text: '잘 듣고 맞춰봐!', language: 'korean' },
  { name: 'quiz-start-en', text: 'Listen carefully and choose!', language: 'english' },
  // ABC 배우기 — 진입하면 화면이 통째로 무음이라 글을 못 읽는 아이가 뭘 할지 몰랐다.
  { name: 'tap-sparkle-ko', text: '반짝이는 곳을 눌러봐!', language: 'korean' },
  // 글자 사냥 — 들어가자마자 목표 글자가 떠서, 무엇을 하라는 건지 없이 문제부터 나왔다.
  { name: 'hunt-start-ko', text: '같은 글자를 모두 찾아봐!', language: 'korean' },
  // 쓰기 — **반짝이는 칸이 있는 화면만**(한글 자음 쓰기 = 짝 중 활성 칸이 코랄로 반짝인다).
  { name: 'write-start-ko', text: '반짝이는 칸에 써 봐!', language: 'korean' },
  // 쓰기 — **낱말/글자 전체를 한꺼번에 보여주는 화면**(ABC 써보기·영어 CVC 써보기·모음 쓰기).
  // "반짝이는 칸" 이 없어 그 멘트가 어긋난다(사용자 지적). 화면 문구("따라써봐")와도 일치.
  { name: 'write-trace-ko', text: '글자를 따라 써 봐!', language: 'korean' },
  // 듣고 고르기 **탐색** 진입 — 퀴즈 전에 카드를 눌러 소리를 들어보는 단계(화면 문구 "눌러서 들어봐!").
  { name: 'listen-explore-ko', text: '눌러서 들어봐!', language: 'korean' },
  // 모음 듣기 — 순서대로 카드를 눌러 소리를 듣는 단계(화면 문구 "순서대로 눌러봐!").
  { name: 'order-listen-ko', text: '순서대로 눌러봐!', language: 'korean' },
  // 자음 배우기 — 글자를 세 번씩 눌러 소리를 듣는다(화면 문구 "○을 세 번씩 눌러봐!").
  { name: 'consonant-tap-ko', text: '세 번씩 눌러봐!', language: 'korean' },
  // 모음 고르기 — 어떤 모음으로 음절을 만들지 고른다(화면 문구 "어떤 모음으로 만들까?").
  { name: 'vowel-pick-ko', text: '어떤 모음을 골라봐?', language: 'korean' },
  // 뒤집기 짝 맞추기 — 같은 짝을 찾는다(화면 문구 "같은 짝을 찾아봐!").
  { name: 'flip-match-ko', text: '같은 짝을 찾아봐!', language: 'korean' },
  // 낱말 그림 그리기(점잇기) — 그림 안을 색칠한다(화면 문구 "그림을 색칠해봐!").
  { name: 'paint-shape-ko', text: '그림을 색칠해봐!', language: 'korean' },
  // 그림 짝 찾기 — 그림과 단어를 짝짓는다.
  { name: 'line-match-ko', text: '그림과 짝을 찾아봐!', language: 'korean' },
  // 블록 게임 — 글자 블록으로 단어를 만든다.
  { name: 'block-make-ko', text: '블록으로 단어를 만들어봐!', language: 'korean' },
];

/**
 * 🔴 **외국어 문구는 지어내지 않는다 — 화면 번역(`i18n/locales/{lang}/phonics.json`)을 그대로 읽는다.**
 *    소리와 화면이 다른 말을 하면 글 못 읽는 아이는 둘 다 못 믿는다. 아래 표는 **음성 자산 ↔ i18n 키**
 *    대응만 적고, 문장은 전부 그 파일에서 온다(이모지는 TTS 에서 뺀다).
 *
 * 🔴 **zh 는 Google TTS**(cmn-CN native) — Gemini 2.5 TTS 는 중국어 미지원이라
 *    `gemini-tts.provider.TTS_LOCALE` 에도 zh 가 없다(억양 자동감지 = 도박).
 */
const VOICE_I18N_KEY = {
  'quiz-start': 'common.listenCarefully', // 잘 듣고 맞춰봐!
  'tap-sparkle': 'alphabetLearn.tapSparkle', // 반짝이는 곳을 눌러봐!
  'hunt-start': 'hunt.prompt', // 같은 글자를 모두 찾아봐!
  'write-start': 'write.sparkleCell', // 반짝이는 칸에 써 봐!
  'write-trace': 'write.trace', // 글자를 따라 써 봐!
  'listen-explore': 'common.tapToListen', // 눌러서 들어봐!
  'order-listen': 'vowelListen.inOrder', // 순서대로 눌러봐!
  'consonant-tap': 'consonantTap.hint', // 세 번씩 눌러봐!
  'vowel-pick': 'vowelPicker.makePrompt', // 어떤 모음을 골라봐?
  'flip-match': 'flip.prompt', // 같은 짝을 찾아봐!
  // 🔴 게임 4종은 파닉스 **밖**(동화책 어휘 게임과 공유)이라 문구가 `games` ns 에 있다.
  //    색칠은 화면에 이미 뜨는 문장 그대로를 읽는다(소리 ≠ 화면이 되지 않게).
  'paint-shape': 'games:connectDots.instruction', // 그림을 색칠해봐!
  'line-match': 'games:guide.lineMatch', // 그림과 짝을 찾아봐!
  'block-make': 'games:guide.blockMake', // 블록으로 단어를 만들어봐!
};
const I18N_LANGS = ['en', 'vi', 'zh', 'th'];
const LOCALE_DIR = path.join(__dirname, '..', '..', 'client', 'src', 'i18n', 'locales');

function i18nPrompts() {
  const out = [];
  for (const lang of I18N_LANGS) {
    const ns = {};
    const load = (name) =>
      (ns[name] ??= JSON.parse(fs.readFileSync(path.join(LOCALE_DIR, lang, `${name}.json`), 'utf8')));
    for (const [name, spec] of Object.entries(VOICE_I18N_KEY)) {
      // `ns:key.path` — ns 를 안 적으면 phonics(기본).
      const [nsName, key] = spec.includes(':') ? spec.split(':') : ['phonics', spec];
      const raw = key.split('.').reduce((o, k) => o?.[k], load(nsName));
      if (!raw) throw new Error(`i18n 키 없음: ${lang}/${nsName}:${key}`);
      // 이모지·선행 화살표는 화면 장식이라 읽히면 안 된다.
      const text = raw.replace(/[\p{Extended_Pictographic}←-⇿️]/gu, '').trim();
      out.push({
        name: `${name}-${lang}`,
        text,
        language: lang,
        provider: lang === 'zh' ? 'google' : 'gemini',
      });
    }
  }
  return out;
}
PROMPTS.push(...i18nPrompts());

async function generate({ name, text, language, provider = 'gemini' }) {
  const res = await fetch(`${API_BASE}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      provider,
      language,
      // storybookId·identifier 는 R2 캐시 키용 — 활동 공용이라 책과 무관한 이름을 준다.
      storybookId: '_activity-voice',
      identifier: name,
    }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status} ${await res.text()}`);
  const { data } = await res.json();
  const audio = await fetch(data.audioUrl);
  if (!audio.ok) throw new Error(`download ${audio.status}`);
  return Buffer.from(await audio.arrayBuffer());
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}\n`);
fs.mkdirSync(OUT_DIR, { recursive: true });

for (const p of PROMPTS) {
  const out = path.join(OUT_DIR, `${p.name}.mp3`);
  if (fs.existsSync(out) && !FORCE) {
    console.log(`[${p.name}] 이미 있음 — skip (재생성은 --force)`);
    continue;
  }
  console.log(`[${p.name}] "${p.text}" (${p.language}/${p.provider ?? 'gemini'})`);
  if (!APPLY) continue;
  try {
    const buf = await generate(p);
    fs.writeFileSync(out, buf);
    console.log(`  ✅ ${(buf.length / 1024).toFixed(0)}KB → ${path.relative(process.cwd(), out)}`);
  } catch (e) {
    console.log(`  ❌ ${e.message}`);
  }
}

if (!APPLY) console.log('\n(dry-run — 만들려면 --apply)');
