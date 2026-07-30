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
];

async function generate({ name, text, language }) {
  const res = await fetch(`${API_BASE}/api/tts/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text,
      provider: 'gemini',
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
  console.log(`[${p.name}] "${p.text}" (${p.language})`);
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
