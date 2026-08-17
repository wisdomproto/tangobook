#!/usr/bin/env node
/**
 * 단어 카드 삽화 → **색칠공부 도안**(흰 면 + 굵은 검은 선) 생성.
 *
 * 색칠 게임(`ColoringPlayer`)은 탭한 자리에서 flood fill 로 칸을 채운다 — 그래서 도안은
 * 예쁜 그림이 아니라 **채울 수 있는 그림**이어야 한다:
 *
 *   1) 선이 끊기면 물감이 새서 그림 전체가 한 색이 된다 → 모든 윤곽은 닫힌 고리.
 *   2) 회색 음영·해칭·질감이 있으면 그게 다 제각각의 칸이 된다 → 오직 흰색과 검은색.
 *   3) 칸이 잘면 네 살 손가락으로 못 짚는다 → 큰 칸 몇 개.
 *
 * 🔴 그래서 **니들펠트 원본을 그대로 선화로 바꾸라고 하면 안 된다** — 원본의 보풀·그림자·
 *    바느질 자국까지 선으로 옮겨 와 칸이 수십 개가 된다. 원본은 "무엇을 그릴지"의 참조일 뿐,
 *    도안은 새로 그리는 것이다(프롬프트가 그 둘을 명시적으로 갈라 놓는다).
 *
 * 사용:
 *   node packages/server/scripts/generate-coloring-lineart.mjs --words=고기,오리        # 미리보기만
 *   node packages/server/scripts/generate-coloring-lineart.mjs --units=kr-h1-u01,kr-h1-u02
 *   node packages/server/scripts/generate-coloring-lineart.mjs --answers --units=…      # 정답본
 *   node packages/server/scripts/generate-coloring-lineart.mjs --check                  # 짝이 맞물리는지 검사
 *   node packages/server/scripts/generate-coloring-lineart.mjs --units=… --apply        # R2 업로드 + 카드에 물림
 *
 * 🔴 순서는 **도안 → 정답본 → `--check`** 다. 검사를 건너뛰지 말 것 — 첫 19장에서 7장이 걸렸다
 *    (정답본 5장이 어긋났고 2장은 칸이 33·44개로 쪼개져 네 살이 못 끝낸다). 둘 다 나란히 놓고
 *    눈으로 보면 멀쩡해 보이는 결함이다.
 *
 * 멱등: `--apply` 는 이미 URL 이 물린 카드를 건너뛴다(`--force` 로 재생성).
 */
import { GoogleGenAI } from '@google/genai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';
// 🔴 칸 나누기는 **앱과 같은 구현**을 쓴다 — 검사기가 제 나름대로 칸을 나누면, 앱에서 깨지는 도안에
//    "맞물림"이라고 답하는 검사기가 된다.
import { buildWalls, labelRegions, paintableRegions, borderRegions } from '@tangobook/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PREVIEW_DIR = path.join(__dirname, '_preview-coloring');
const OUT_PREFIX = 'coloring-lineart/';
const MODEL = process.env.GEMINI_IMAGE_MODEL ?? 'gemini-3.1-flash-image-preview';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const FORCE = args.flags.has('force');
/** 도안이 아니라 **정답본**(도안을 칠한 그림)을 만든다. 도안이 먼저 있어야 한다. */
const ANSWERS = args.flags.has('answers');
/** 생성 없이, 만들어 둔 짝을 전부 재 본다. 불량이 있으면 exit 1. */
const CHECK = args.flags.has('check');
/**
 * 로컬 ComfyUI 가 뽑아 둔 **날것**을 받아 2치화·팔레트 인코딩만 한다(생성 없음).
 *
 * 🔴 생성은 `comfy_test/scripts/_coloring_pages.mjs`(로컬 GPU, 무료)가 하고 여기서는 후처리만 한다 —
 *    comfy_test 에는 sharp 이 없고, 탱고북이 로컬 테스트벤치를 import 하게 만들고 싶지도 않다.
 *    병음 카드 때와 같은 구조다(생성기가 탱고북 폴더로 떨궈 주면 탱고북이 집어 간다).
 */
const INGEST = args.flags.has('ingest');
const RAW_DIR = path.join(__dirname, '_preview-coloring-raw');
const UNITS = (args.units ? String(args.units) : 'kr-h1-u01').split(',').filter(Boolean);
const WORDS = args.words ? String(args.words).split(',').filter(Boolean) : null;

loadEnv();

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

/**
 * 도안 프롬프트.
 *
 * 참조 이미지는 **소재만** 알려준다 — 니들펠트 질감을 옮겨 오면 칠할 수 없는 도안이 된다.
 */
function buildPrompt(word) {
  return [
    'Redraw the subject of the reference image as a COLORING BOOK PAGE for a 4-year-old.',
    '',
    'This is not an illustration — it is a page a small child will fill in with color, so:',
    '- PURE WHITE background and PURE WHITE interior. Absolutely no grey, no shading, no gradient, no hatching, no stippling, no texture, no fill of any kind.',
    '- Solid BLACK outlines only, thick and even (like a 8px marker), same weight everywhere.',
    '- Every outline must be a CLOSED loop with no gaps, so paint cannot leak between areas.',
    // 🔴 "4~8개"만 적었더니 돌다리를 돌 하나하나까지 그려 43칸이 나왔다. 반복 무늬를 이름으로
    //    집어 금지해야 모델이 뭉갠다.
    '- HARD LIMIT: at most 8 enclosed areas in the whole drawing. Count them before you draw.',
    '- Draw NO repeating pattern and NO small parts: no bricks, stones, planks, wood grain, scales, fur tufts, petals, holes, dots, stripes, or spots. A surface made of many pieces must be drawn as ONE smooth empty shape.',
    '- Merge small details away. A chubby, rounded, simplified cartoon shape.',
    // 🔴 "속은 흰색"이라고만 했더니 누나의 원피스를 통째로 검게 칠해 왔다. 검정은 벽이라 영영
    //    못 칠하고, 아이 눈엔 이미 칠해진 그림이다. 옷·머리카락이 자주 이렇게 된다.
    '- NEVER fill a large area with black or any dark colour. Black is ONLY for the outline strokes. Clothes, hair, shoes and every other big shape must stay EMPTY WHITE inside, no matter what colour the real thing is. Only a tiny detail such as an eye pupil may be solid black.',
    '- Do NOT copy the wool/felt texture, fuzz, stitching, or drop shadow of the reference. Ignore how it is made; keep only WHAT it is.',
    '',
    'One single subject, centred, fully inside the frame with a small white margin. No text, no letters, no numbers, no border frame, no background scenery.',
    `The subject is: ${word}.`,
  ].join('\n');
}

/**
 * 정답본 프롬프트 — **도안을 칠한다**(새로 그리지 않는다).
 *
 * 🔴 선이 한 픽셀이라도 움직이면 정답본이 쓸모없어진다. 칸 나누기는 도안에서 하고 정답색은
 *    정답본의 같은 자리에서 읽으므로, 두 장의 선이 어긋나면 엉뚱한 칸의 색을 읽는다.
 *    그래서 "새로 그리지 말고 이 그림 안을 채워라"를 프롬프트가 계속 붙든다.
 */
function buildAnswerPrompt(word) {
  return [
    'Fill in this coloring page with colour.',
    '',
    '- Keep every black outline EXACTLY where it is: same position, same shape, same thickness. Do not redraw, move, smooth, or add any line.',
    '- Fill each white area with ONE FLAT solid colour. No shading, no gradient, no texture, no highlight, no outline of a different colour.',
    // 🔴 여우 배(흰색)처럼 "한 칸인데 두 색으로 칠하고 싶은" 자리가 순도를 무너뜨린다. 아이는 칸
    //    하나를 색 하나로 칠하므로, 정답본도 칸 하나에 색 하나여야 한다.
    '- If an area looks like it should have two colours, still use only ONE — the dominant one. Never split an enclosed white area into two colours, and never paint a colour boundary where there is no black line.',
    '- Use few colours — the natural, obvious colours a child would name.',
    '- Leave the area outside the subject pure white.',
    '- Add nothing new: no background, no scenery, no pattern, no text.',
    `The subject is: ${word}.`,
  ].join('\n');
}

async function fetchAsBase64(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${res.status} ${url}`);
  const buf = Buffer.from(await res.arrayBuffer());
  // webp 는 모델 입력으로 안 받는 경우가 있어 png 로 통일.
  const png = await sharp(buf).png().toBuffer();
  return png.toString('base64');
}

async function generate(word, prompt, refBase64) {
  const parts = [];
  if (refBase64) parts.push({ inlineData: { data: refBase64, mimeType: 'image/png' } });
  parts.push({ text: prompt });

  const result = await ai.models.generateContent({
    model: MODEL,
    contents: [{ role: 'user', parts }],
    config: { responseModalities: ['IMAGE', 'TEXT'], imageConfig: { aspectRatio: '1:1' } },
  });
  const candidate = result.candidates?.[0];
  const img = candidate?.content?.parts?.find((p) => p.inlineData)?.inlineData?.data;
  if (!img) {
    const why =
      result.promptFeedback?.blockReason ??
      candidate?.finishReason ??
      candidate?.content?.parts?.find((p) => p.text)?.text ??
      'empty response';
    throw new Error(`생성 실패 (${word}): ${why}`);
  }
  return Buffer.from(img, 'base64');
}

/**
 * 도안을 **흑백 2치**로 굳힌다.
 *
 * 🔴 이건 화질 손질이 아니라 게임이 도는 조건이다 — 모델이 아무리 "흰 배경"이라고 들어도
 * 안티에일리어싱 때문에 선 가장자리에 회색 띠가 남고, flood fill 은 그 띠에서 멈춰
 * **칠한 색과 선 사이에 흰 테두리**를 남긴다. 임계값으로 눌러 회색을 없애 둔다.
 */
async function toBinary(buf) {
  return sharp(buf)
    .resize(1024, 1024, { fit: 'contain', background: '#ffffff' })
    .greyscale()
    .threshold(200) // 200 이상 = 흰 면, 미만 = 검은 선
    .png({ palette: true, colors: 2, effort: 10 }) // 흑백 두 색뿐이다 — 트루컬러로 둘 이유가 없다
    .toBuffer();
}

/**
 * 정답본 인코딩.
 *
 * 🔴 평면 색 대여섯 개짜리 그림을 트루컬러 PNG 로 두면 **장당 494KB** 다(파일럿 19장 = 9.7MB).
 *    팔레트 PNG 로 굽으면 69KB 로 떨어지고, 덤으로 색이 더 고르게 뭉쳐 순도가 올라간다.
 */
async function toFlatPalette(buf) {
  return sharp(buf)
    .resize(1024, 1024, { fit: 'fill' })
    .png({ palette: true, colors: 32, effort: 10 })
    .toBuffer();
}

// ── 검사 ─────────────────────────────────────────────────────────────────────

/** 네 살이 감당할 칸 수 상한. 넘으면 도안이 잘게 쪼개진 것이라 다시 그려야 한다. */
const MAX_REGIONS = 14;
/** 정답본이 도안과 맞물렸다고 볼 최저 순도. */
const MIN_PURITY = 0.8;
/**
 * 통째로 검게 칠해진 덩어리의 상한.
 *
 * 🔴 검정은 벽이라 **영영 못 칠한다** — 원피스를 까맣게 칠해 오면 아이 눈엔 이미 칠해진 그림이고,
 *    칸 수·순도 검사는 그걸 못 잡는다(누나가 그렇게 통과했다). 실측으로 경계를 잡았다:
 *    누나 10.99% vs 나머지 19장 최대 2.81% — 자릿수가 다르다.
 */
const MAX_BLOB = 0.04;

/**
 * 도안 ↔ 정답본이 실제로 맞물리는지 잰다.
 *
 * 🔴 **눈으로는 못 잡는다.** 모델은 "선을 그대로 두라"고 해도 굵기·위치를 슬쩍 바꾸는데, 나란히
 *    놓고 보면 둘 다 그럴듯해 보인다. 어긋나면 앱이 **엉뚱한 칸의 색**을 정답으로 읽으므로,
 *    칸마다 정답본 색이 얼마나 한 가지인지(순도)를 재야 드러난다. 첫 19장에서 5장이 이렇게 걸렸다.
 */
async function measure(linePath, answerPath, S = 512) {
  const line = await sharp(linePath).resize(S, S, { fit: 'fill' }).ensureAlpha().raw().toBuffer();
  const ans = await sharp(answerPath).resize(S, S, { fit: 'fill' }).ensureAlpha().raw().toBuffer();

  // 굵은 검은 덩어리 재기 — 흐린 뒤에도 어두우면 선이 아니라 면이다(가는 선은 흐리면 옅어진다).
  const blurred = await sharp(linePath)
    .resize(S, S, { fit: 'fill' })
    .greyscale()
    .blur(4)
    .raw()
    .toBuffer();
  let blobPx = 0;
  for (let i = 0; i < blurred.length; i++) if (blurred[i] < 60) blobPx++;
  const blob = blobPx / (S * S);

  const lineRgba = new Uint8ClampedArray(line.buffer, line.byteOffset, line.length);
  const regions = labelRegions(buildWalls(lineRgba), S, S);
  const required = paintableRegions(regions, S * S, 0.003, borderRegions(regions.labels, S, S));

  let worst = 1;
  for (const id of required) {
    // 최빈 색 무리를 찾고(32단계), 그 색에서 ±40 안에 드는 픽셀 비율을 순도로 본다.
    // 🔴 버킷 개수만 세면 안 된다 — 고르게 칠한 면도 두 버킷에 걸치면 순도가 반토막 나서
    //    멀쩡한 정답본을 불량으로 떨군다.
    const bins = new Map();
    let total = 0;
    for (let i = 0; i < regions.labels.length; i++) {
      if (regions.labels[i] !== id) continue;
      total++;
      const o = i * 4;
      const k = ((ans[o] >> 5) << 10) | ((ans[o + 1] >> 5) << 5) | (ans[o + 2] >> 5);
      bins.set(k, (bins.get(k) ?? 0) + 1);
    }
    let bestKey = 0;
    let best = -1;
    for (const [k, n] of bins) if (n > best) ((best = n), (bestKey = k));
    const br = (((bestKey >> 10) & 31) << 5) + 16;
    const bg = (((bestKey >> 5) & 31) << 5) + 16;
    const bb = ((bestKey & 31) << 5) + 16;

    let near = 0;
    for (let i = 0; i < regions.labels.length; i++) {
      if (regions.labels[i] !== id) continue;
      const o = i * 4;
      if (
        Math.abs(ans[o] - br) < 40 &&
        Math.abs(ans[o + 1] - bg) < 40 &&
        Math.abs(ans[o + 2] - bb) < 40
      )
        near++;
    }
    worst = Math.min(worst, near / total);
  }
  return { regions: required.length, purity: required.length ? worst : 0, blob };
}

/**
 * 될 때까지 몇 번 다시 뽑고, 안 되면 **그중 제일 나은 것**을 남긴다.
 *
 * 🔴 생성은 확률적이라 손으로 다시 돌리면 더 나빠질 수도 있다(여우 정답본이 62%→43%로 갔다).
 *    그래서 다시 뽑는 일은 사람이 아니라 스크립트가, **점수를 보면서** 해야 한다.
 */
async function bestOf(make, score, pass, label, tries = 3) {
  let bestBuf = null;
  let bestScore = -1;
  for (let i = 0; i < tries; i++) {
    const buf = await make();
    const s = await score(buf);
    if (s > bestScore) {
      bestScore = s;
      bestBuf = buf;
    }
    if (s >= pass) return buf;
    if (i < tries - 1) console.log(`  ↻ ${label} 다시 (${i + 1}/${tries - 1})`);
  }
  return bestBuf;
}

async function upload(key, buf) {
  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: key,
      Body: buf,
      ContentType: 'image/png',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

// ── 실행 ─────────────────────────────────────────────────────────────────────

fs.mkdirSync(PREVIEW_DIR, { recursive: true });
let made = 0;
let skipped = 0;
let failed = 0;
const bad = [];

// --ingest: 로컬 생성기가 떨군 날것을 2치화·팔레트 인코딩해 _preview-coloring 으로 옮긴다.
if (INGEST) {
  if (!fs.existsSync(RAW_DIR)) {
    console.log(`날것 폴더가 없다: ${RAW_DIR}`);
    process.exit(1);
  }
  let n = 0;
  for (const f of fs.readdirSync(RAW_DIR).sort()) {
    if (!f.endsWith('.png')) continue;
    const src = fs.readFileSync(path.join(RAW_DIR, f));
    const out = f.endsWith('-answer.png') ? await toFlatPalette(src) : await toBinary(src);
    fs.writeFileSync(path.join(PREVIEW_DIR, f), out);
    n++;
    console.log(`${f.padEnd(30)} ${(src.length / 1024).toFixed(0)}KB → ${(out.length / 1024).toFixed(0)}KB`);
  }
  console.log(`\n${n}장 후처리. 이제 --check 로 재 볼 것.`);
  if (!CHECK) process.exit(0);
}

// --check: 이미 만들어 둔 도안·정답본 짝을 전부 재 본다(생성 없음).
if (CHECK) {
  const files = fs.readdirSync(PREVIEW_DIR);
  console.log('그림                   칸수  순도  덩어리  판정');
  for (const f of files.sort()) {
    if (!f.endsWith('-answer.png')) continue;
    const base = f.replace(/-answer\.png$/, '');
    const linePath = path.join(PREVIEW_DIR, `${base}.png`);
    if (!fs.existsSync(linePath)) continue;
    const { regions, purity, blob } = await measure(linePath, path.join(PREVIEW_DIR, f));
    const verdicts = [];
    if (purity < MIN_PURITY) verdicts.push('정답본 다시');
    if (regions > MAX_REGIONS) verdicts.push('도안 다시(너무 잘다)');
    if (blob > MAX_BLOB) verdicts.push('도안 다시(검게 칠해짐)');
    if (verdicts.length) bad.push({ base, regions, purity, blob, verdicts });
    console.log(
      `${base.padEnd(22)} ${String(regions).padStart(3)}  ${(purity * 100).toFixed(0).padStart(4)}%  ${(
        blob * 100
      )
        .toFixed(1)
        .padStart(5)}%  ${verdicts.length ? '⚠ ' + verdicts.join(' · ') : 'OK'}`
    );
  }
  console.log(`\n불량 ${bad.length}장${bad.length ? ': ' + bad.map((b) => b.base.split('-').pop()).join(', ') : ''}`);
  process.exit(bad.length ? 1 : 0);
}

for (const unitId of UNITS) {
  const sb = await getStorybook(unitId);
  if (!sb?.flashcards?.length) {
    console.log(`${unitId}: 카드 없음`);
    continue;
  }
  let dirty = false;

  for (const card of sb.flashcards) {
    const word = card.word ?? card.text;
    if (!word) continue;
    if (WORDS && !WORDS.includes(word)) continue;
    const existing = ANSWERS ? card.coloringAnswerUrl : card.coloringImageUrl;
    if (existing && !FORCE) {
      skipped++;
      continue;
    }

    try {
      const lineFile = path.join(PREVIEW_DIR, `${unitId}-${word}.png`);

      if (ANSWERS) {
        // 정답본은 **도안을 참조**한다 — 원본 삽화가 아니라. 선이 같아야 칸이 맞물린다.
        if (!fs.existsSync(lineFile)) throw new Error('도안 없음 — 먼저 도안부터 생성');
        const file = path.join(PREVIEW_DIR, `${unitId}-${word}-answer.png`);
        const ref = fs.readFileSync(lineFile).toString('base64');
        const png = await bestOf(
          async () => {
            return toFlatPalette(await generate(word, buildAnswerPrompt(word), ref));
          },
          async (buf) => {
            fs.writeFileSync(file, buf);
            return (await measure(lineFile, file)).purity;
          },
          MIN_PURITY,
          word
        );
        fs.writeFileSync(file, png);
        made++;
        const { purity } = await measure(lineFile, file);
        if (purity < MIN_PURITY) bad.push({ base: `${unitId}-${word}`, purity });
        console.log(`${purity >= MIN_PURITY ? '✓' : '⚠'} ${word.padEnd(6)} 순도 ${(purity * 100).toFixed(0)}%  ${file}`);

        if (APPLY) {
          const hash = crypto.createHash('sha1').update(png).digest('hex').slice(0, 8);
          card.coloringAnswerUrl = await upload(
            `${OUT_PREFIX}${unitId}-${word}-answer-${hash}.png`,
            png
          );
          dirty = true;
        }
      } else {
        const ref = await fetchAsBase64(card.imageUrl);
        const png = await bestOf(
          async () => toBinary(await generate(word, buildPrompt(word), ref)),
          async (buf) => {
            fs.writeFileSync(lineFile, buf);
            const { regions, blob } = await measure(lineFile, lineFile);
            // 🔴 칸 수와 덩어리는 **둘 다** 봐야 한다 — 칸 수만 보면 원피스를 까맣게 칠해 온 도안이
            //    "칸이 적다"고 오히려 좋은 점수를 받는다(누나가 칸 7개로 통과했었다).
            //    척도가 다르니 min 으로 섞지 말고, 통과면 1 · 아니면 얼마나 가까운지로 순위만 매긴다.
            if (regions <= MAX_REGIONS && blob <= MAX_BLOB) return 1;
            return (
              0.5 * Math.min(1, MAX_REGIONS / regions) +
              0.5 * Math.min(1, blob > 0 ? MAX_BLOB / blob : 1)
            );
          },
          1,
          word
        );
        fs.writeFileSync(lineFile, png);
        made++;
        const { regions, blob } = await measure(lineFile, lineFile);
        const ok = regions <= MAX_REGIONS && blob <= MAX_BLOB;
        if (!ok) bad.push({ base: `${unitId}-${word}`, regions, blob });
        console.log(
          `${ok ? '✓' : '⚠'} ${word.padEnd(6)} 칸 ${regions}개 · 덩어리 ${(blob * 100).toFixed(1)}%  ${lineFile}`
        );

        if (APPLY) {
          const hash = crypto.createHash('sha1').update(png).digest('hex').slice(0, 8);
          card.coloringImageUrl = await upload(`${OUT_PREFIX}${unitId}-${word}-${hash}.png`, png);
          dirty = true;
        }
      }
    } catch (e) {
      failed++;
      console.log(`✗ ${word.padEnd(6)} ${e.message}`);
    }
  }

  if (APPLY && dirty) {
    await putStorybook(unitId, sb);
    console.log(`  → ${unitId} 저장`);
  }
}

console.log(
  `\n생성 ${made} · 건너뜀 ${skipped} · 실패 ${failed}${APPLY ? '' : '  (미리보기만 — 적용하려면 --apply)'}`
);
console.log(`미리보기: ${PREVIEW_DIR}`);
