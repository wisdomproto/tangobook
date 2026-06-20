#!/usr/bin/env node
/**
 * 추출 JSON(모기의_항변.json) + 이미지 URL 맵 → MOSQUITO_PAGES 생성 → mosquito-ebook.ts 주입.
 * - 일본어 jp → ja 매핑. 페르시아어(fa)는 1차 제외.
 * - overlays: imageText 의 type/text 만. 좌표(x,y)·fontSize·anim 은 placeholder(Chunk 3 에서 수동 조정).
 * - ttsUrl: 키 규칙으로 예측 생성(narration 있을 때만).
 * - ttsDurationSec: _data/mosquito-tts-durations.json 있으면 채움(Chunk 2 재실행).
 *
 * ⚠️ 1회 부트스트랩 + Chunk 2(TTS) 재실행까지만. Chunk 3 에서 좌표 채운 뒤엔 재실행 금지(덮어씀).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}
const PUBLIC_URL = process.env.R2_PUBLIC_URL;
if (!PUBLIC_URL) {
  console.error('R2_PUBLIC_URL env 누락');
  process.exit(1);
}

const EXTRACT_JSON =
  process.env.EXTRACT_JSON ??
  'C:/Users/101024/Documents/카카오톡 받은 파일/모기의_항변_추출/모기의_항변.json';
const imgMap = JSON.parse(
  fs.readFileSync(path.join(__dirname, '_data', 'mosquito-image-urls.json'), 'utf-8')
);
const durPath = path.join(__dirname, '_data', 'mosquito-tts-durations.json');
const durMap = fs.existsSync(durPath) ? JSON.parse(fs.readFileSync(durPath, 'utf-8')) : null;
const extract = JSON.parse(fs.readFileSync(EXTRACT_JSON, 'utf-8'));

// placeholder 기본값 (Chunk 3 에서 페이지별 수동 조정)
const ANIM_BY_KIND = { 의성어: 'drop', 키워드: 'pop', 제목: 'fade', 라벨: 'fade' };
const FONT_BY_KIND = { 의성어: 56, 키워드: 44, 제목: 72, 라벨: 40 };

// 오버레이별 위치/스타일 (원본 글자 위치 기반). preview(/ebook/mosquito?debug=1)로 조정.
// x,y = 이미지 박스 기준 0~1 중심. fontSize = EBOOK_HEIGHT(904) 기준 px.
const OVERLAY_OVERRIDE = {
  'p01-0': { x: 0.42, y: 0.16, fontSize: 88, anim: 'fade', color: '#1b5e20' }, // 蚊のいいぶん
  'p02-0': { x: 0.64, y: 0.32, fontSize: 34, anim: 'pop', color: '#6b4423', rotate: -2 }, // 키워드 5
  'p09-0': { x: 0.15, y: 0.42, fontSize: 66, anim: 'drop', color: '#c0392b', rotate: -8 }, // ギクリ
  'p10-0': { x: 0.4, y: 0.15, fontSize: 54, anim: 'drop', color: '#c0392b', rotate: -4 }, // かーっ するどい
  'p11-0': { x: 0.85, y: 0.5, fontSize: 64, anim: 'fade', color: '#1b5e20' }, // 食物連鎖
  'p11-1': { x: 0.43, y: 0.92, fontSize: 28, anim: 'fade', color: '#3a3a3a' }, // 흙 풀 토끼 사자 사체
  'p14-0': { x: 0.5, y: 0.1, fontSize: 60, anim: 'fade', color: '#1b5e20' }, // 歯型
  'p14-1': { x: 0.46, y: 0.64, fontSize: 38, anim: 'pop', color: '#c0392b' }, // 채식 육식
  'p22-0': { x: 0.5, y: 0.12, fontSize: 28, anim: 'fade', color: '#3a3a3a' }, // 肉1kg...
  'p22-1': { x: 0.5, y: 0.52, fontSize: 24, anim: 'fade', color: '#3a3a3a' }, // 牛...
  'p26-0': { x: 0.3, y: 0.22, fontSize: 76, anim: 'drop', color: '#c0392b' }, // 死
  'p29-0': { x: 0.4, y: 0.24, fontSize: 36, anim: 'pop', color: '#1b5e20' }, // 自然 調和...
  'p30-0': { x: 0.42, y: 0.18, fontSize: 76, anim: 'drop', color: '#c0392b' }, // 死
  'p31-0': { x: 0.5, y: 0.3, fontSize: 84, anim: 'fade', color: '#1b5e20' }, // おしまい
};

const pages = extract.pages.map((p) => {
  const pad = String(p.page).padStart(2, '0');
  const ko = (p.narration?.ko ?? '').trim();
  const ja = (p.narration?.jp ?? '').trim();
  const ttsUrl = {};
  const ttsDurationSec = {};
  if (ko) {
    ttsUrl.ko = `${PUBLIC_URL}/ebook/mosquito/tts/v1/ko/page-${pad}.mp3`;
    if (durMap?.[p.page]?.ko != null) ttsDurationSec.ko = durMap[p.page].ko;
  }
  if (ja) {
    ttsUrl.ja = `${PUBLIC_URL}/ebook/mosquito/tts/v1/ja/page-${pad}.mp3`;
    if (durMap?.[p.page]?.ja != null) ttsDurationSec.ja = durMap[p.page].ja;
  }
  const overlays = (p.imageText ?? []).map((t, i) => {
    const id = `p${pad}-${i}`;
    const base = {
      id,
      kind: t.type,
      text: { ko: t.ko ?? '', ja: t.jp ?? '' },
      x: 0.5,
      y: 0.28,
      anim: ANIM_BY_KIND[t.type] ?? 'fade',
      delaySec: 0.3,
      fontSize: FONT_BY_KIND[t.type] ?? 44,
      color: '#c0392b',
    };
    return { ...base, ...(OVERLAY_OVERRIDE[id] ?? {}) };
  });
  return {
    page: p.page,
    imageUrl: imgMap[p.page] ?? '',
    narration: { ko, ja },
    ttsUrl,
    ttsDurationSec,
    overlays,
  };
});

const tsPath = path.join(__dirname, '..', '..', 'remotion', 'src', 'data', 'mosquito-ebook.ts');
const ts = fs.readFileSync(tsPath, 'utf-8');
const marker = '// mosquito-build-data 스크립트가';
const idx = ts.indexOf(marker);
const head = idx >= 0 ? ts.slice(0, idx) : ts.slice(0, ts.indexOf('export const MOSQUITO_PAGES'));
const body = `// mosquito-build-data 스크립트가 생성/주입한다 (수동 편집 가능; Chunk 2 까지만 재실행).\nexport const MOSQUITO_PAGES: EbookPage[] = ${JSON.stringify(pages, null, 2)};\n`;
fs.writeFileSync(tsPath, head + body);

const overlayCount = pages.reduce((s, p) => s + p.overlays.length, 0);
const ttsCount = pages.reduce((s, p) => s + Object.keys(p.ttsUrl).length, 0);
console.log(`✅ ${pages.length} pages → mosquito-ebook.ts`);
console.log(`   overlays ${overlayCount} | ttsUrl ${ttsCount} | durations ${durMap ? '채움' : '없음(Chunk2 후 재실행)'}`);
