// 영어 Book 1 (ABC 배우기) 학습카드의 **낱말 핫스팟**을 Gemini 비전(바운딩 박스)으로 자동 생성.
//
// ABC 배우기(AlphabetLetterLearnActivity)는 글자 삽화 위에서 낱말별 핫스팟을 순서대로
// 스포트라이트한다. 사용자가 일부 글자만 손으로 넣었고 나머지(D·E·F·… 대부분)는 비어 있어
// 그 글자는 그림을 눌러도 반응이 없었다. 삽화에서 각 낱말 사물의 위치를 찾아 채운다.
//
// 🔴 잘못된 핫스팟은 없느니만 못하다 — 기본은 **박스를 삽화에 그린 preview PNG**를 내고(육안 검증),
//    `--apply` 일 때만 R2 storybook 에 쓴다.
//
// 사용:
//   npx tsx packages/server/scripts/generate-phonics-hotspots.ts                 # dry-run + preview
//   npx tsx packages/server/scripts/generate-phonics-hotspots.ts --unit=en-b1-u02
//   npx tsx packages/server/scripts/generate-phonics-hotspots.ts --apply         # R2 에 기록
//   npx tsx packages/server/scripts/generate-phonics-hotspots.ts --apply --force # 기존 핫스팟도 덮어씀
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Part as GenAIPart } from '@google/genai';
import type { Storybook, WordHotspot } from '@tangobook/shared';
import { getAI } from '../src/providers/gemini.provider.js';
import { R2Repository } from '../src/repositories/r2.repository.js';
import { config } from '../src/config/index.js';

const MODEL = process.env.GEMINI_TEXT_MODEL ?? config.gemini.textModel;
const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const FORCE = args.includes('--force');
const unitArg = args.find((a) => a.startsWith('--unit='))?.split('=')[1];
const UNITS = unitArg ? [unitArg] : Array.from({ length: 8 }, (_, i) => `en-b1-u0${i + 1}`);

const PREVIEW_DIR = path.join(process.env.LOCALAPPDATA || '/tmp', 'Temp', 'phonics-hotspots');
fs.mkdirSync(PREVIEW_DIR, { recursive: true });

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
interface WordFamily {
  words?: WFWord[];
}

async function withRetry<T>(fn: () => Promise<T>, n = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
  throw last;
}

async function toPng(url: string): Promise<{ b64: string; width: number; height: number }> {
  const res = await fetch(encodeURI(url));
  if (!res.ok) throw new Error(`fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const png = await sharp(buf).png().toBuffer();
  const meta = await sharp(png).metadata();
  return { b64: png.toString('base64'), width: meta.width ?? 0, height: meta.height ?? 0 };
}

/** Gemini 응답에서 JSON 관대 추출. */
function parseLoose(text: string): Record<string, number[]> | null {
  const t = text.replace(/```(?:json)?/gi, '').trim();
  for (const cand of [t, t.match(/\{[\s\S]*\}/)?.[0]]) {
    if (!cand) continue;
    try {
      return JSON.parse(cand);
    } catch {
      /* next */
    }
  }
  return null;
}

/** 삽화에서 낱말 사물들의 박스를 받는다 → { word: [ymin,xmin,ymax,xmax] } 0-1000. */
async function detectBoxes(b64: string, words: string[]): Promise<Record<string, number[]>> {
  const prompt =
    `This is a children's illustration containing several distinct objects. ` +
    `For EACH object in this list, return its tight 2D bounding box: ${words.join(', ')}. ` +
    `Respond with JSON ONLY: an object mapping each object name (exactly as given) to ` +
    `[ymin, xmin, ymax, xmax], each an integer 0-1000 with the top-left as origin (y increases downward). ` +
    `Make the box snug around just that object. If an object is not clearly present, omit it. ` +
    `Example: {"apple":[300,450,470,560]}`;
  const parts: GenAIPart[] = [
    { inlineData: { data: b64, mimeType: 'image/png' } },
    { text: prompt },
  ];
  const result = await withRetry(() =>
    getAI().models.generateContent({
      model: MODEL,
      contents: [{ role: 'user', parts }],
      config: { responseMimeType: 'application/json' },
    })
  );
  const text = (result.candidates ?? [])
    .flatMap((c) => c.content?.parts ?? [])
    .map((p) => p.text ?? '')
    .join('')
    .trim();
  return parseLoose(text) ?? {};
}

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));

/** [ymin,xmin,ymax,xmax] 0-1000 → WordHotspot {x,y,w,h} 0-1. 비정상 박스는 null. */
function toHotspot(box: number[]): WordHotspot | null {
  if (!Array.isArray(box) || box.length !== 4) return null;
  const [ymin, xmin, ymax, xmax] = box;
  const x = clamp01(xmin / 1000);
  const y = clamp01(ymin / 1000);
  const w = clamp01((xmax - xmin) / 1000);
  const h = clamp01((ymax - ymin) / 1000);
  if (w <= 0.01 || h <= 0.01) return null; // 점 수준이면 버린다
  return { x, y, w, h };
}

/** 삽화 위에 박스+라벨을 그려 검증용 PNG 저장. */
async function savePreview(
  pngB64: string,
  W: number,
  H: number,
  boxes: Array<{ word: string; hs: WordHotspot }>,
  outName: string
): Promise<void> {
  const colors = ['#ef4444', '#3b82f6', '#22c55e', '#a855f7', '#f59e0b'];
  const rects = boxes
    .map((b, i) => {
      const c = colors[i % colors.length];
      const x = b.hs.x * W;
      const y = b.hs.y * H;
      const w = b.hs.w * W;
      const h = b.hs.h * H;
      return `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${c}" stroke-width="6"/>
        <text x="${x + 6}" y="${y + 34}" font-size="34" font-weight="bold" fill="${c}" stroke="white" stroke-width="1">${b.word}</text>`;
    })
    .join('');
  const svg = `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
  const out = await sharp(Buffer.from(pngB64, 'base64'))
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(PREVIEW_DIR, outName), out);
}

async function run() {
  console.log(`Mode: ${APPLY ? '✏️ APPLY (R2 기록)' : '👀 DRY-RUN (preview 만)'}  model=${MODEL}`);
  console.log(`Preview → ${PREVIEW_DIR}\n`);
  let filled = 0;
  let missed = 0;

  for (const unitId of UNITS) {
    const sb = (await R2Repository.getStorybook(unitId)) as Storybook | null;
    if (!sb) {
      console.log(`[${unitId}] 없음 — skip`);
      continue;
    }
    const lesson = (
      sb as unknown as { phonicsLesson?: { blending?: Blending[]; wordFamilies?: WordFamily[] } }
    ).phonicsLesson;
    const bl = lesson?.blending ?? [];
    const wf = lesson?.wordFamilies ?? [];
    let changed = false;

    for (let i = 0; i < wf.length; i++) {
      const letter = bl[i]?.vowel ?? `#${i}`;
      const illus = bl[i]?.illustrationUrl ?? bl[i]?.exampleWordImageUrl;
      const words = wf[i]?.words ?? [];
      const need = words.filter((w) => FORCE || !(w.hotspots?.length || w.hotspot));
      if (!need.length) continue;
      if (!illus) {
        console.log(`[${unitId}] ${letter}: 삽화 없음 — skip`);
        continue;
      }
      try {
        const { b64, width, height } = await toPng(illus);
        const boxes = await detectBoxes(
          b64,
          need.map((w) => w.word)
        );
        // 대소문자 무시 매칭
        const lower: Record<string, number[]> = {};
        for (const [k, v] of Object.entries(boxes)) lower[k.toLowerCase()] = v;
        const preview: Array<{ word: string; hs: WordHotspot }> = [];
        for (const w of need) {
          const hs = toHotspot(lower[w.word.toLowerCase()] ?? []);
          if (!hs) {
            missed++;
            console.log(`   [${unitId}] ${letter}/${w.word}: 박스 못 얻음`);
            continue;
          }
          w.hotspots = [hs];
          filled++;
          changed = true;
          preview.push({ word: w.word, hs });
        }
        if (preview.length) {
          await savePreview(b64, width, height, preview, `${unitId}-${letter}.png`);
          console.log(
            `[${unitId}] ${letter}: ${preview.map((p) => p.word).join(', ')} ✓ (${width}x${height})`
          );
        }
      } catch (e) {
        console.log(`[${unitId}] ${letter}: 실패 — ${(e as Error).message}`);
      }
    }

    if (changed && APPLY) {
      await R2Repository.saveStorybook(sb);
      console.log(`[${unitId}] 💾 저장`);
    }
  }
  console.log(`\n채운 핫스팟 ${filled} · 못 얻음 ${missed}`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
