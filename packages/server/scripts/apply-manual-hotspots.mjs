// Claude(사람 눈)가 직접 삽화를 보고 정한 낱말 핫스팟을 적용 — **Gemini 안 씀, 비용 0**.
//
// Gemini 자동 검출이 놓친(그림엔 있는) 낱말을 채운다. 좌표는 삽화를 직접 보고 정한 근사치
// {x,y,w,h} 정규화 0-1(좌상단 원점). 핫스팟은 스포트라이트라 근사치로 충분.
//
//   node packages/server/scripts/apply-manual-hotspots.mjs            # dry-run + preview
//   node packages/server/scripts/apply-manual-hotspots.mjs --apply    # R2 기록
//   node packages/server/scripts/apply-manual-hotspots.mjs --force    # 기존 핫스팟도 덮어씀
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import sharp from 'sharp';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

loadEnv();
const { flags } = parseArgs(process.argv.slice(2));
const APPLY = flags.has('apply');
const FORCE = flags.has('force');

const PREVIEW_DIR = path.join(process.env.LOCALAPPDATA || '/tmp', 'Temp', 'phonics-hotspots-manual');
fs.mkdirSync(PREVIEW_DIR, { recursive: true });

// Claude 가 삽화를 직접 보고 정한 박스 — {unitId: {LETTER: {word: [x, y, w, h]}}}
const BOXES = {
  'en-b1-u07': {
    V: { violin: [0.73, 0.46, 0.15, 0.44] }, // 오른쪽에 세워둔 온전한 바이올린
  },
  'en-b1-u08': {
    W: { watermelon: [0.64, 0.6, 0.16, 0.23] }, // 돗자리 위 통수박
    Y: { yacht: [0.34, 0.5, 0.43, 0.38] }, // 야크가 모는 요트(선체+돛)
  },
};

const dl = (url) =>
  new Promise((res, rej) => {
    const chunks = [];
    https
      .get(encodeURI(url), (r) => {
        r.on('data', (c) => chunks.push(c));
        r.on('end', () => res(Buffer.concat(chunks)));
      })
      .on('error', rej);
  });

async function savePreview(url, box, word, out) {
  const buf = await dl(url);
  const png = await sharp(buf).png().toBuffer();
  const { width: W, height: H } = await sharp(png).metadata();
  const [x, y, w, h] = box;
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
    <rect x="${x * W}" y="${y * H}" width="${w * W}" height="${h * H}" fill="none" stroke="#ef4444" stroke-width="6"/>
    <text x="${x * W + 6}" y="${y * H + 34}" font-size="34" font-weight="bold" fill="#ef4444" stroke="white" stroke-width="1">${word}</text>
  </svg>`;
  const composed = await sharp(png)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PREVIEW_DIR, out), composed);
}

console.log(`Mode: ${APPLY ? '✏️ APPLY' : '👀 DRY-RUN'}  preview → ${PREVIEW_DIR}\n`);
let filled = 0;

for (const [unitId, letters] of Object.entries(BOXES)) {
  const sb = await getStorybook(unitId);
  if (!sb) {
    console.log(`[${unitId}] 없음`);
    continue;
  }
  const bl = sb.phonicsLesson?.blending ?? [];
  const wf = sb.phonicsLesson?.wordFamilies ?? [];
  let changed = false;

  for (const [letter, wordBoxes] of Object.entries(letters)) {
    const i = bl.findIndex((b) => (b.vowel ?? '').toUpperCase() === letter);
    if (i < 0) {
      console.log(`[${unitId}] ${letter}: blending 없음`);
      continue;
    }
    const illus = bl[i].illustrationUrl ?? bl[i].exampleWordImageUrl;
    const words = wf[i]?.words ?? [];
    for (const [word, box] of Object.entries(wordBoxes)) {
      const w = words.find((x) => x.word.toLowerCase() === word.toLowerCase());
      if (!w) {
        console.log(`[${unitId}] ${letter}/${word}: 낱말 없음`);
        continue;
      }
      if ((w.hotspots?.length || w.hotspot) && !FORCE) {
        console.log(`[${unitId}] ${letter}/${word}: 이미 있음 — skip`);
        continue;
      }
      const [x, y, wd, h] = box;
      w.hotspots = [{ x, y, w: wd, h }];
      changed = true;
      filled++;
      if (illus) await savePreview(illus, box, word, `${unitId}-${letter}-${word}.png`);
      console.log(`[${unitId}] ${letter}/${word}: ✓ ${JSON.stringify(box)}`);
    }
  }
  if (changed && APPLY) {
    await putStorybook(unitId, sb);
    console.log(`[${unitId}] 💾 저장`);
  }
}
console.log(`\n채운 핫스팟 ${filled}`);
