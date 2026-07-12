// 동화책 표지의 베이크된 제목/장식 텍스트를 Gemini 이미지 편집으로 지운 "클린 표지"를 배치 생성.
// 다국어 인앱 표지 오버레이(<BookCover>)의 베이스 이미지 — 그림체별로 텍스트 없는 표지를 만들어
// styleAssets[style].cleanCoverImage (활성 그림체는 top-level cleanCoverImage) 에 URL 을 기록한다.
//
// 생성 후 **피델리티 게이트**(Gemini 비전 호출: 원본 vs 편집본 비교)를 자동 통과한 결과만 채택한다.
// 게이트 실패 시 더 엄격한 프롬프트로 재시도하고, 최종 실패는 out/clean-covers-review.json 에 기록만 하고
// 해당 (책,그림체)는 저장하지 않는다.
//
// 실행 (⚠️ 유료 Gemini API + 비-dry 는 프로덕션 R2/레코드 변경 — 수동 승인 단계):
//   dry-run (out/clean-covers 에 PNG 저장, R2/레코드 미기록, 게이트는 그대로 실행):
//     pnpm --filter @tangobook/server exec tsx scripts/generate-clean-covers.ts --book=<id> --dry-run
//   전체 (R2 업로드 + 레코드 기록, 멱등 — 이미 cleanCoverImage 있으면 skip):
//     pnpm --filter @tangobook/server exec tsx scripts/generate-clean-covers.ts
//   재생성: --force · 특정 그림체만: --style=<id> · 개수 제한: --limit=N · 게이트 재시도 횟수: --retries=N
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import type { Part as GenAIPart } from '@google/genai';
import type { Storybook } from '@tangobook/shared';
import { getAI, generateImageWithGemini } from '../src/providers/gemini.provider.js';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';
import { R2Repository } from '../src/repositories/r2.repository.js';
import { parseGeminiJSON } from '../src/utils/parse-gemini-json.js';
import { config } from '../src/config/index.js';
import {
  pickStyleCovers,
  buildCleanKey,
  parseGateVerdict,
  type GateVerdict,
} from '../src/services/covers/clean-cover.js';

const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL ?? config.gemini.imageModel;
const GATE_MODEL = process.env.GEMINI_TEXT_MODEL ?? config.gemini.textModel;

const PROMPT = `Edit this children's book cover. Remove ALL text and every decorative title/sticker graphic. CRITICAL: do NOT reinterpret, re-crop, restyle, or redraw the scene — keep the exact same main subject, composition, framing, colors, lighting and perspective. Only erase the text/stickers and seamlessly reconstruct the background that was behind them, matching the surrounding art. The result must be the identical illustration minus text, wide 16:9, with absolutely no letters/numbers/sticker graphics anywhere.`;

const STRICT_PREFIX = `STRICT RETRY — the previous attempt either altered the scene or left text/stickers behind. Be extremely conservative: reproduce the ORIGINAL illustration as faithfully as possible (same subject, pose, composition, framing, palette) and ONLY erase text and sticker graphics, inpainting the background beneath them. Change nothing else. `;

const GATE_PROMPT = `Compare ORIGINAL vs EDITED children's book cover. Return JSON {sameSubject:boolean, textRemains:boolean, reason:string}. sameSubject=false if the main subject, composition, or framing changed at all; textRemains=true if ANY letters/numbers/sticker graphics remain.`;

interface ReviewEntry {
  id: string;
  style: string;
  reason?: string;
}

function argVal(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}
function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

/** 표지 URL → PNG base64 (Gemini 레퍼런스용, webp/한글 파일명 정규화). */
async function coverToPngBase64(url: string): Promise<string> {
  const res = await fetch(encodeURI(url));
  if (!res.ok) throw new Error(`cover fetch ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const png = await sharp(buf).png().toBuffer();
  return png.toString('base64');
}

async function withRetry<T>(fn: () => Promise<T>, n = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < n; i++) {
    try {
      return await fn();
    } catch (e) {
      last = e;
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  }
  throw last;
}

/** 피델리티 게이트: 원본 png + 편집 png 를 비전 모델로 비교 → JSON 판정. */
async function runFidelityGate(originalPngB64: string, cleanPngB64: string): Promise<GateVerdict> {
  const parts: GenAIPart[] = [
    { text: 'ORIGINAL:' },
    { inlineData: { data: originalPngB64, mimeType: 'image/png' } },
    { text: 'EDITED:' },
    { inlineData: { data: cleanPngB64, mimeType: 'image/png' } },
    { text: GATE_PROMPT },
  ];
  const result = await getAI().models.generateContent({
    model: GATE_MODEL,
    contents: [{ role: 'user', parts }],
    config: { responseMimeType: 'application/json' },
  });
  const text = result.candidates?.[0]?.content?.parts?.find((p) => p.text)?.text ?? '';
  const v = parseGeminiJSON<{ sameSubject: boolean; textRemains: boolean; reason?: string }>(
    text,
    '피델리티 게이트 JSON 파싱 실패'
  );
  return parseGateVerdict(v);
}

interface StyleOutcome {
  status: 'ok' | 'skip' | 'fail';
  saved?: Storybook;
}

async function processStyle(
  sb: Storybook,
  id: string,
  style: string,
  url: string,
  opts: { dryRun: boolean; force: boolean; retries: number; outDir: string; review: ReviewEntry[] }
): Promise<StyleOutcome> {
  const { dryRun, force, retries, outDir, review } = opts;

  // 멱등 skip — 이미 cleanCoverImage 가 있으면 (활성 그림체는 top-level, 그 외는 styleAssets) 건너뜀.
  const existing =
    style === sb.artStyle ? sb.cleanCoverImage : sb.styleAssets?.[style]?.cleanCoverImage;
  if (existing && !force) return { status: 'skip' };

  const originalB64 = await coverToPngBase64(url);

  // retries = 총 생성 시도 횟수. 첫 시도는 기본 프롬프트, 이후는 더 엄격한 프리픽스.
  let cleanB64: string | undefined;
  let verdict: GateVerdict | undefined;
  const attempts = Math.max(1, retries);
  for (let attempt = 0; attempt < attempts; attempt++) {
    const prompt = attempt === 0 ? PROMPT : STRICT_PREFIX + PROMPT;
    cleanB64 = await withRetry(() =>
      generateImageWithGemini({
        prompt,
        referenceImages: [{ base64: originalB64, mimeType: 'image/png' }],
        model: IMAGE_MODEL,
      })
    );
    verdict = await runFidelityGate(originalB64, cleanB64);
    if (verdict.pass) break;
    console.warn(
      `    ↻ ${id}/${style} 게이트 실패 (attempt ${attempt + 1}/${attempts}): ${verdict.reason ?? ''}`
    );
  }

  // 업로드 형식과 동일하게 webp 로 트랜스코드 (dry-run 로컬 파일도 실제 업로드본과 일치).
  const webpBuf = cleanB64
    ? await sharp(Buffer.from(cleanB64, 'base64')).webp({ quality: 90 }).toBuffer()
    : undefined;

  if (dryRun && webpBuf) {
    const suffix = verdict?.pass ? '' : '-FAIL';
    const p = path.join(outDir, `${id}-${style}${suffix}.webp`);
    fs.writeFileSync(p, webpBuf);
    console.log(`  ${verdict?.pass ? '✓' : '✗'} ${id}/${style} → ${p}`);
  }

  if (!verdict?.pass || !webpBuf) {
    review.push({ id, style, reason: verdict?.reason });
    return { status: 'fail' };
  }

  if (dryRun) return { status: 'ok' };

  const ts = Date.now();
  const cleanUrl = await uploadBufferToR2(webpBuf, buildCleanKey(id, style, ts), 'image/webp');
  sb.styleAssets ??= {};
  sb.styleAssets[style] ??= {};
  sb.styleAssets[style].cleanCoverImage = cleanUrl;
  if (style === sb.artStyle) sb.cleanCoverImage = cleanUrl;
  const saved = await R2Repository.saveStorybook(sb);
  console.log(`  ✓ ${id}/${style} → ${cleanUrl.slice(-52)}`);
  return { status: 'ok', saved };
}

async function main() {
  const dryRun = hasFlag('dry-run');
  const force = hasFlag('force');
  const book = argVal('book');
  const styleFilter = argVal('style');
  const limit = argVal('limit') ? Number(argVal('limit')) : undefined;
  const retries = argVal('retries') ? Number(argVal('retries')) : 2;

  const summaries = await R2Repository.listStorybooks();
  let targets = summaries.filter((s) => s.isPublic !== false && s.koCompletion?.cover);
  if (book) targets = targets.filter((s) => s.id === book);
  if (limit != null) targets = targets.slice(0, limit);

  const outDir = path.resolve(process.cwd(), 'out/clean-covers');
  if (dryRun) fs.mkdirSync(outDir, { recursive: true });

  console.log(
    `[clean-covers] 대상 ${targets.length}권 · imageModel=${IMAGE_MODEL} · gateModel=${GATE_MODEL} · dryRun=${dryRun} · retries=${retries}`
  );
  const summary = { ok: 0, skip: 0, fail: 0 };
  const review: ReviewEntry[] = [];

  for (const t of targets) {
    let sb = await R2Repository.getStorybook(t.id);
    if (!sb) {
      console.error(`  ✗ ${t.id} 로드 실패`);
      summary.fail++;
      continue;
    }
    let styles = pickStyleCovers(sb);
    if (styleFilter) styles = styles.filter((s) => s.style === styleFilter);

    for (const { style, url } of styles) {
      try {
        const r = await processStyle(sb, t.id, style, url, {
          dryRun,
          force,
          retries,
          outDir,
          review,
        });
        if (r.saved) sb = r.saved;
        summary[r.status]++;
      } catch (e) {
        console.error(`  ✗ ${t.id}/${style} FAILED: ${(e as Error).message}`);
        summary.fail++;
        review.push({ id: t.id, style, reason: (e as Error).message });
      }
    }
  }

  if (review.length > 0) {
    const reviewPath = path.resolve(process.cwd(), 'out/clean-covers-review.json');
    fs.mkdirSync(path.dirname(reviewPath), { recursive: true });
    fs.writeFileSync(reviewPath, JSON.stringify(review, null, 2));
    console.log(`\n[clean-covers] 검토 필요 ${review.length}건 → ${reviewPath}`);
  }

  console.log(`\n[clean-covers] 완료 — ${JSON.stringify(summary)}`);
}

main().catch((e) => {
  console.error('[clean-covers] 치명적 오류:', e);
  process.exit(1);
});
