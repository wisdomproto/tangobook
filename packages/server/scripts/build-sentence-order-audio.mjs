// 문장 되맞추기 시안(`public/sentence-order.html`)용 음원 굽기 — 어절 하나하나 + 문장 전체.
//
// 🔴 왜 필요한가: 쪽 나레이션(`page.ttsUrl`)은 쪽 전체를 읽는다(2~6문장 10~26초).
//    아이가 타일을 누를 때 그 낱말이 나야 하는데 그 단위 음원이 어디에도 없다.
//    ❌ 쪽 mp3 를 무음으로 자르는 건 안 된다 — 문장 4개에 무음이 7~11개 나오고(쉼표),
//       「가장 긴 N−1개에서 자르기」로 재 보니 30쪽 중 10쪽만 맞았다(r≥0.90).
//
// 🔴 목소리는 책 나레이션과 같은 것 — voicebox `qwen` 1.7B + 프로필 `Tangobook Narrator KO`.
//    엔진·참조를 바꿔 보고 되돌린 기록이 memory `tts-voice-clone-reference-2026-08-08` 에 있다.
//    성우 실녹음도 고샘플레이트 엔진도 더 낫지 않았다 — 참조의 **톤·장르**가 음질보다 중요하다.
//
// 🔴 산출물은 mp3 — wav 금지(모노 64kbps). memory `audio-mp3-not-wav-2026-07-27`.
//
// 준비: voicebox 백엔드를 먼저 띄운다.
//   cd C:/projects/voicebox && ./backend/venv/Scripts/uvicorn.exe backend.main:app --port 17493
//
// 사용:
//   node packages/server/scripts/build-sentence-order-audio.mjs            # 책 자동 선택
//   node packages/server/scripts/build-sentence-order-audio.mjs --book=<id>
//   node packages/server/scripts/build-sentence-order-audio.mjs --dry-run  # 대상만 보기

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import ffmpeg from 'ffmpeg-static';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(HERE, '../../client/public/sentence-order-audio');

const API = process.env.SENTENCE_ORDER_API ?? 'https://www.tangobook.co.kr/api/storybooks';
const VOICEBOX = 'http://127.0.0.1:17493';
const PROFILE_KO = 'b8f4b383-9598-4ca4-bfad-daf8917cf30d'; // Tangobook Narrator KO

const argVal = (name) => {
  const hit = process.argv.find((a) => a === name || a.startsWith(`${name}=`));
  if (!hit) return null;
  if (hit.includes('=')) return hit.split('=').slice(1).join('=');
  return process.argv[process.argv.indexOf(hit) + 1] ?? null;
};
const DRY = process.argv.includes('--dry-run');
const BOOK_ID = argVal('--book');
const ROUNDS = Number(argVal('--rounds') ?? 5);

// ── 라운드 뽑기 — sentence-order.html 과 **같은 규칙** ────────────────────────
// 🔴 규칙이 갈라지면 음원이 없는 문장이 화면에 뜬다. 바꿀 땐 양쪽 다.
const MIN_UNITS = 3;
const MAX_UNITS = 7;

const clean = (t) =>
  String(t || '')
    .replace(/\*\*/g, '')
    .replace(/[“”"‘’]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

const sentences = (text) =>
  clean(text)
    .split(/(?<=[.!?…])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

const units = (s) =>
  s
    .replace(/[.!?…]+$/, '')
    .split(/\s+/)
    .filter(Boolean);

function buildRounds(book) {
  const out = [];
  for (const p of book.pages || []) {
    if (!p.text || !p.illustrationUrl) continue;
    const cands = sentences(p.text).filter((s) => {
      const n = units(s).length;
      return n >= MIN_UNITS && n <= MAX_UNITS;
    });
    if (!cands.length) continue;
    // 시안은 제일 긴 것을 쓴다 — 놀 거리가 많다.
    const best = cands.sort((a, b) => units(b).length - units(a).length)[0];
    out.push({
      sentence: best.replace(/[.!?…]+$/, ''),
      units: units(best),
      illus: p.illustrationUrl,
      page: p.pageNumber,
    });
  }
  return out.length >= 4 ? out.slice(0, ROUNDS) : null;
}

// ── voicebox ────────────────────────────────────────────────────────────────
async function tts(text, wavPath) {
  const res = await fetch(`${VOICEBOX}/generate/stream`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      profile_id: PROFILE_KO,
      text,
      language: 'ko',
      engine: 'qwen',
      model_size: '1.7B',
    }),
  });
  if (!res.ok) throw new Error(`voicebox ${res.status}: ${(await res.text()).slice(0, 160)}`);
  fs.writeFileSync(wavPath, Buffer.from(await res.arrayBuffer()));
}

/** 🔴 mp3 — 모노 64kbps. wav 로 두면 낱말 하나가 수백 KB 라 첫 탭이 늦는다. */
function toMp3(wavPath, mp3Path) {
  const r = spawnSync(
    ffmpeg,
    ['-y', '-i', wavPath, '-ac', '1', '-b:a', '64k', '-ar', '24000', mp3Path],
    { encoding: 'utf8' }
  );
  if (r.status !== 0) throw new Error(`ffmpeg 실패: ${String(r.stderr).slice(-200)}`);
}

// ── 실행 ────────────────────────────────────────────────────────────────────
async function pickBook() {
  const list = (await (await fetch(API)).json()).data || [];
  if (BOOK_ID) {
    const d = (await (await fetch(`${API}/${BOOK_ID}`)).json()).data;
    const r = buildRounds(d);
    if (!r) throw new Error(`${BOOK_ID}: 조건에 맞는 쪽이 4개 미만입니다`);
    return { book: d, rounds: r };
  }
  // 🔴 자동 선택 = 어절이 제일 적은 책. 시안은 짧을수록 좋다.
  const cats = new Set(['전래 동화', '세계 명작', '생활동화']);
  const cands = list.filter((b) => cats.has(b.category)).slice(0, 24);
  let best = null;
  for (const s of cands) {
    let d;
    try {
      d = (await (await fetch(`${API}/${s.id}`)).json()).data;
    } catch {
      continue;
    }
    const r = buildRounds(d);
    if (!r) continue;
    const total = r.reduce((n, x) => n + x.units.length, 0);
    if (!best || total < best.total) best = { book: d, rounds: r, total };
  }
  if (!best) throw new Error('조건에 맞는 책을 못 찾았습니다');
  return best;
}

(async () => {
  const alive = await fetch(`${VOICEBOX}/health`).then(
    (r) => r.ok,
    () => false
  );
  if (!alive && !DRY) {
    console.error('voicebox 가 꺼져 있습니다. 먼저 띄우세요:');
    console.error('  cd C:/projects/voicebox && ./backend/venv/Scripts/uvicorn.exe backend.main:app --port 17493');
    process.exit(1);
  }

  const { book, rounds } = await pickBook();
  // 어절 + 문장 전체가 음원 대상. 어절은 여러 문장에 겹치므로 중복을 없앤다.
  const texts = [...new Set([...rounds.flatMap((r) => r.units), ...rounds.map((r) => r.sentence)])];

  console.log(`책: ${book.title} (${book.id})`);
  rounds.forEach((r, i) => console.log(`  ${i + 1}. [${r.units.length}] ${r.sentence}`));
  console.log(`음원 ${texts.length}개 (어절 ${texts.length - rounds.length} + 문장 ${rounds.length})`);
  if (DRY) return;

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmp = path.join(OUT_DIR, '_tmp.wav');
  const audio = {};
  let made = 0;
  let skipped = 0;
  for (const [i, text] of texts.entries()) {
    const file = `a${String(i).padStart(3, '0')}.mp3`;
    const dest = path.join(OUT_DIR, file);
    audio[text] = file;
    if (fs.existsSync(dest)) {
      skipped++;
      continue; // 멱등 — 다시 돌려도 있는 건 안 만든다
    }
    const t0 = Date.now();
    await tts(text, tmp);
    toMp3(tmp, dest);
    made++;
    const kb = Math.round(fs.statSync(dest).size / 1024);
    console.log(`  [${i + 1}/${texts.length}] ${text} — ${Date.now() - t0}ms · ${kb}KB`);
  }
  if (fs.existsSync(tmp)) fs.unlinkSync(tmp);

  fs.writeFileSync(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify({ bookId: book.id, title: book.title, lang: 'ko', rounds, audio }, null, 2)
  );
  console.log(`\n생성 ${made} · 건너뜀 ${skipped} → ${OUT_DIR}`);
})();
