// Book 1 낡은 삽화(K/S/X/R — 커리큘럼 낱말과 안 맞던 것) 교체 + 낱말 핫스팟.
//
// 사용자가 커리큘럼 낱말에 맞춰 재생성한 4장(Downloads)을 R2(webp)로 올려 blending.illustrationUrl 을
// 갈아끼우고, Claude(사람 눈)가 정한 낱말 박스를 hotspots 로 넣는다. Gemini 안 씀.
//
//   npx tsx packages/server/scripts/regen-book1-illustrations.ts          # dry-run: preview PNG 만
//   npx tsx packages/server/scripts/regen-book1-illustrations.ts --apply  # R2 업로드 + storybook 저장
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Storybook, WordHotspot } from '@tangobook/shared';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';
import { R2Repository } from '../src/repositories/r2.repository.js';

const APPLY = process.argv.includes('--apply');
const DL = path.join(process.env.USERPROFILE || process.env.HOME || '', 'Downloads');
const PREVIEW_DIR = path.join(process.env.LOCALAPPDATA || '/tmp', 'Temp', 'book1-regen');
fs.mkdirSync(PREVIEW_DIR, { recursive: true });

// {x, y, w, h} 정규화 0-1 (좌상단 원점) — 재생성 삽화를 직접 보고 정한 박스.
type Box = [number, number, number, number];
interface Target {
  unitId: string;
  letter: string;
  file: string;
  boxes: Record<string, Box>;
}

const TARGETS: Target[] = [
  {
    unitId: 'en-b1-u04',
    letter: 'K',
    file: 'Bright_friendly_preschool_phonics_flashcard_illust-1785823876926.png',
    boxes: {
      king: [0.42, 0.15, 0.16, 0.7],
      key: [0.58, 0.24, 0.09, 0.33],
      kiwi: [0.72, 0.55, 0.2, 0.31],
    },
  },
  {
    unitId: 'en-b1-u07',
    letter: 'S',
    file: 'Bright_friendly_preschool_phonics_flashcard_illust-1785823879430.png',
    boxes: {
      sun: [0.77, 0.03, 0.16, 0.32],
      sand: [0.4, 0.24, 0.18, 0.54], // 모래성
      sock: [0.66, 0.57, 0.22, 0.34], // 발 끝까지
    },
  },
  {
    unitId: 'en-b1-u08',
    letter: 'X',
    file: 'Bright_friendly_preschool_phonics_flashcard_illust-1785823881398.png',
    boxes: {
      fox: [0.27, 0.31, 0.21, 0.49],
      box: [0.51, 0.52, 0.21, 0.33],
      six: [0.82, 0.47, 0.12, 0.36], // 숫자 6
    },
  },
  {
    unitId: 'en-b1-u06',
    letter: 'R',
    file: 'Bright_friendly_preschool_phonics_flashcard_illust-1785823883407.png',
    boxes: {
      rabbit: [0.38, 0.08, 0.17, 0.68],
      robot: [0.66, 0.2, 0.18, 0.62],
      ring: [0.47, 0.73, 0.16, 0.24], // 밴드 아래까지
    },
  },
];

interface Blending {
  vowel?: string;
  illustrationUrl?: string;
  exampleWordImageUrl?: string;
}
interface WFWord {
  word: string;
  hotspots?: WordHotspot[];
  hotspot?: WordHotspot;
}

async function savePreview(png: Buffer, boxes: Record<string, Box>, out: string): Promise<void> {
  const { width: W = 0, height: H = 0 } = await sharp(png).metadata();
  const colors = ['#ef4444', '#3b82f6', '#22c55e'];
  const rects = Object.entries(boxes)
    .map(([word, [x, y, w, h]], i) => {
      const c = colors[i % colors.length];
      return `<rect x="${x * W}" y="${y * H}" width="${w * W}" height="${h * H}" fill="none" stroke="${c}" stroke-width="7"/>
        <text x="${x * W + 8}" y="${y * H + 40}" font-size="40" font-weight="bold" fill="${c}" stroke="white" stroke-width="1.5">${word}</text>`;
    })
    .join('');
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  const composed = await sharp(png)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PREVIEW_DIR, out), composed);
}

// Date.now() 는 이 배치 스크립트에선 OK (워크플로우 아님).
const stamp = Date.now();

async function run() {
  console.log(`Mode: ${APPLY ? '✏️ APPLY' : '👀 DRY-RUN'}  preview → ${PREVIEW_DIR}\n`);

  for (const t of TARGETS) {
    const src = path.join(DL, t.file);
    if (!fs.existsSync(src)) {
      console.log(`[${t.letter}] 파일 없음: ${src}`);
      continue;
    }
    const png = fs.readFileSync(src);
    await savePreview(png, t.boxes, `${t.unitId}-${t.letter}.png`);

    if (!APPLY) {
      console.log(`[${t.letter}] preview ✓ (${Object.keys(t.boxes).join(', ')})`);
      continue;
    }

    // 1) webp 로 R2 업로드
    const webp = await sharp(png).webp({ quality: 90 }).toBuffer();
    const key = `${t.unitId}-Book1-${t.letter}-phonics-letter-illust-regen-${stamp}.webp`;
    const url = await uploadBufferToR2(webp, key, 'image/webp');

    // 2) storybook 로드 → blending.illustrationUrl 교체 + 낱말 hotspots
    const sb = (await R2Repository.getStorybook(t.unitId)) as Storybook | null;
    if (!sb) {
      console.log(`[${t.letter}] storybook 없음`);
      continue;
    }
    const lesson = (
      sb as unknown as {
        phonicsLesson?: { blending?: Blending[]; wordFamilies?: { words?: WFWord[] }[] };
      }
    ).phonicsLesson;
    const bl = lesson?.blending ?? [];
    const wf = lesson?.wordFamilies ?? [];
    const i = bl.findIndex((b) => (b.vowel ?? '').toUpperCase() === t.letter);
    if (i < 0) {
      console.log(`[${t.letter}] blending 없음`);
      continue;
    }
    bl[i].illustrationUrl = url;
    const words = wf[i]?.words ?? [];
    let hs = 0;
    for (const [word, [x, y, w, h]] of Object.entries(t.boxes)) {
      const target = words.find((ww) => ww.word.toLowerCase() === word.toLowerCase());
      if (!target) {
        console.log(
          `   [${t.letter}] 낱말 '${word}' 없음 (데이터: ${words.map((z) => z.word).join(',')})`
        );
        continue;
      }
      target.hotspots = [{ x, y, w, h }];
      hs++;
    }
    await R2Repository.saveStorybook(sb);
    console.log(`[${t.letter}] 💾 삽화 교체 + 핫스팟 ${hs}\n   ${url}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
