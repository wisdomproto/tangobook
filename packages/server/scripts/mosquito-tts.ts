#!/usr/bin/env node
/**
 * 모기 이북: 페이지 나레이션(ko/ja) → Gemini TTS → (속도 조절) → R2 (ebook/mosquito/tts/v1/{lang}/page-NN.mp3).
 * + 오디오 길이 probe → _data/mosquito-tts-durations.json ({page:{ko,ja}}); 시드가 ttsDurationSec 주입.
 *
 * provider 직접 호출(우리 키 규칙 유지 + 검증된 프롬프트 로직 재사용). config import 로 .env 자동 로드.
 * 속도: ffmpeg atempo 후처리(음정 유지). --speed=1.25 기본(0.5~2.0).
 * 실행:
 *   pnpm --filter @tangobook/server exec tsx scripts/mosquito-tts.ts                       # dry-run 전체
 *   pnpm --filter @tangobook/server exec tsx scripts/mosquito-tts.ts --apply --only=2,17   # 샘플
 *   pnpm --filter @tangobook/server exec tsx scripts/mosquito-tts.ts --apply               # 전량
 *   ... --voice=Sulafat --lang=ko,ja --speed=1.25
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { generateGeminiTts } from '../src/providers/gemini-tts.provider.js';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';
import { getAudioDuration } from '../src/utils/audio-duration.js';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const flag = (k: string, d: string | null = null): string | null => {
  const a = argv.find((x) => x.startsWith(`--${k}=`));
  return a ? a.split('=')[1] : d;
};
const APPLY = argv.includes('--apply');
const VOICE = flag('voice', 'Sulafat')!;
const SPEED = Math.min(2, Math.max(0.5, parseFloat(flag('speed', '1.25')!)));
const ONLY = flag('only')
  ?.split(',')
  .map((n) => parseInt(n, 10));
const LANGS = (flag('lang', 'ko,ja') as string).split(',') as Array<'ko' | 'ja'>;

const EXTRACT_JSON =
  process.env.EXTRACT_JSON ??
  'C:/Users/101024/Documents/카카오톡 받은 파일/모기의_항변_추출/모기의_항변.json';
const extract = JSON.parse(fs.readFileSync(EXTRACT_JSON, 'utf-8'));

/** ffmpeg atempo 로 음정 유지하며 속도 조절. tempo=1 이면 원본 그대로. */
async function applySpeed(mp3: Buffer, tempo: number): Promise<Buffer> {
  if (Math.abs(tempo - 1) < 0.001) return mp3;
  const ffmpegPath = (await import('ffmpeg-static')).default as unknown as string;
  const stamp = `${Date.now()}-${Math.floor(performance.now())}`;
  const tmpIn = path.join(os.tmpdir(), `mosq-in-${stamp}.mp3`);
  const tmpOut = path.join(os.tmpdir(), `mosq-out-${stamp}.mp3`);
  fs.writeFileSync(tmpIn, mp3);
  try {
    await execFileAsync(ffmpegPath, ['-y', '-i', tmpIn, '-filter:a', `atempo=${tempo}`, tmpOut], {
      timeout: 30_000,
    });
    return fs.readFileSync(tmpOut);
  } finally {
    for (const f of [tmpIn, tmpOut]) if (fs.existsSync(f)) fs.unlinkSync(f);
  }
}

const durMap: Record<number, Partial<Record<'ko' | 'ja', number>>> = {};
let ok = 0;
let fail = 0;

for (const p of extract.pages as Array<{
  page: number;
  narration?: { ko?: string; jp?: string };
}>) {
  if (ONLY && !ONLY.includes(p.page)) continue;
  const pad = String(p.page).padStart(2, '0');
  const texts: Record<'ko' | 'ja', string> = {
    ko: (p.narration?.ko ?? '').trim(),
    ja: (p.narration?.jp ?? '').trim(),
  };
  for (const lang of LANGS) {
    const text = texts[lang];
    if (!text) continue;
    const key = `ebook/mosquito/tts/v1/${lang}/page-${pad}.mp3`;
    if (!APPLY) {
      console.log(`  [dry] p${p.page} ${lang} (${text.length}자) → ${key}`);
      continue;
    }
    try {
      const raw = await generateGeminiTts({ text, voice: VOICE, language: lang });
      const buf = await applySpeed(raw, SPEED);
      const url = await uploadBufferToR2(buf, key, 'audio/mpeg');
      const dur = await getAudioDuration(url);
      (durMap[p.page] ??= {})[lang] = Math.round(dur * 100) / 100;
      ok++;
      console.log(`  ✓ p${p.page} ${lang} ${dur.toFixed(1)}s (x${SPEED}) → ${key}`);
    } catch (e) {
      fail++;
      console.log(`  ✗ p${p.page} ${lang}: ${(e as Error).message}`);
    }
  }
}

if (APPLY) {
  const dataDir = path.join(__dirname, '_data');
  fs.mkdirSync(dataDir, { recursive: true });
  const durPath = path.join(dataDir, 'mosquito-tts-durations.json');
  const existing: Record<string, Record<string, number>> = fs.existsSync(durPath)
    ? JSON.parse(fs.readFileSync(durPath, 'utf-8'))
    : {};
  for (const [pg, langs] of Object.entries(durMap)) existing[pg] = { ...existing[pg], ...langs };
  fs.writeFileSync(durPath, JSON.stringify(existing, null, 2));
  console.log(`\n✅ ${ok} 생성, ${fail} 실패 (속도 x${SPEED}) → durations merged: ${durPath}`);
} else {
  console.log(`\n[dry-run] --apply 로 생성. (--only=2,17 로 샘플, --speed=1.25)`);
}
