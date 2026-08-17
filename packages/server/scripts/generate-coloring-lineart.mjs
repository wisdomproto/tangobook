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
/** 생성 없이 로컬 생성기가 읽을 작업 목록만 뽑는다. */
const JOBS = args.flags.has('jobs');
/** 생성 모델 없이 **원본 삽화**에서 도안+정답본을 만든다. 색 개수는 칸 수에 맞춰 자동 조절. */
const FROM_ILLUSTRATION = args.flags.has('from-illustration');
/** 검사 통과분만 데모(`/coloring-demo`)로 복사하고 매니페스트를 다시 쓴다. */
const MANIFEST = args.flags.has('manifest');
/** 로컬이 뽑은 **평면 색 그림**을 도안+정답본으로 쪼갠다 — 순도가 원리상 100%. */
const SPLIT_FLAT = args.flags.has('split-flat');
const LABELS_FILE = path.join(__dirname, '_preview-coloring', '_labels.json');
/** 파닉스 단원 대신 **동화책 카테고리**를 대상으로 — 카드가 `keyObjectImages[]` 에 있다. */
const CATEGORY = args.category ? String(args.category) : null;
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
/**
 * 칸 수 하한.
 *
 * 🔴 **상한만 재면 밋밋한 도안이 그냥 통과한다** — 로컬 모델이 뽑은 오리가 5칸이었는데 검사기는
 *    "칸 적음 = 좋음"으로 봐서 OK 를 줬다(사용자가 눈으로 잡았다). 그래서 하한이 필요하다.
 *
 * 🔴 다만 **6 은 너무 높았다**(2026-08-17 사용자 지시로 3 으로). 사과·거울·공·별처럼 부위가 원래
 *    두셋뿐인 낱말이 있고, 그런 걸 6칸으로 만들려면 **없는 선을 그리게** 된다. 사물이 단순한 건
 *    도안의 결함이 아니다. 3 이면 "한 번 탭하고 끝"만 막는다.
 */
const MIN_REGIONS = 3;
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
 * 잉크 조각 수 상한.
 *
 * 🔴 실측으로 잡았다: 제대로 그린 도안은 1~4 조각(성 4·침대 1·다리 3·여우 3)인데, 잔선이 낀
 *    사과는 **60 조각**이었다. 자릿수가 다르므로 12 면 넉넉히 가른다.
 */
const MAX_INK_PIECES = 12;
/**
 * 잉크가 덮은 면적 상한.
 *
 * 🔴 **선이 너무 굵으면 가장자리가 부슬거리고 얼룩이 낀다**(집 지붕·굴뚝에 검은 부스러기).
 *    조각 수로는 안 잡힌다 — 얼룩이 굵은 선에 **붙어 있어** 한 조각으로 세어지기 때문이다.
 *    실측: 파닉스 정상 도안 7~9%, 굵게 그려진 명작 생성분 14~19%. 12% 로 가른다.
 */
const MAX_INK_RATIO = 0.12;

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

  // 굵은 검은 덩어리 재기 — 흐린 뒤에도 어두우면 선이 아니라 면이다(선은 흐리면 옅어진다).
  // 🔴 흐림 반경은 **윤곽선보다 넉넉히 커야** 한다. blur(4) 로는 20px 짜리 굵은 윤곽선이 살아남아
  //    「검게 칠해진 면」으로 오인됐고(멀쩡한 도안이 13~17% 로 찍혔다), 그 상태로 기준을 낮췄으면
  //    성의 검은 탑을 통과시킬 뻔했다. blur(12) 면 굵은 선은 옅어지고 칠해진 면만 남는다.
  const blurred = await sharp(linePath)
    .resize(S, S, { fit: 'fill' })
    .greyscale()
    .blur(12)
    .raw()
    .toBuffer();
  let blobPx = 0;
  for (let i = 0; i < blurred.length; i++) if (blurred[i] < 60) blobPx++;
  const blob = blobPx / (S * S);

  /**
   * 잉크가 몇 조각으로 흩어졌나.
   *
   * 🔴 **실지렁이 잔선**을 잡는 유일한 지표다. 면 안의 미세한 색 흔들림이 그은 잔선은 칸 수·순도·
   *    덩어리를 전부 통과한다 — 오히려 칸을 채워 줘서 "칸이 넉넉하다"고 좋은 점수를 받는다
   *    (사과가 8칸·순도 100%·덩어리 2.8% 로 통과해 놓고 얼룩투성이였다).
   *    제대로 그린 도안은 선이 하나로 이어져 조각이 1~4 개인데, 잔선이 끼면 수십 개가 된다.
   */
  const inkPx = new Uint8Array(S * S);
  let inkArea = 0;
  for (let i = 0; i < inkPx.length; i++) {
    inkPx[i] = line[i * 4] < 128 ? 1 : 0;
    inkArea += inkPx[i];
  }
  const inkRatio = inkArea / (S * S);
  const seenInk = new Uint8Array(S * S);
  let inkPieces = 0;
  for (let seed = 0; seed < inkPx.length; seed++) {
    if (!inkPx[seed] || seenInk[seed]) continue;
    inkPieces++;
    const st = [seed];
    seenInk[seed] = 1;
    while (st.length) {
      const p = st.pop();
      const x = p % S;
      for (const q of [x > 0 ? p - 1 : -1, x < S - 1 ? p + 1 : -1, p - S, p + S]) {
        if (q < 0 || q >= inkPx.length || !inkPx[q] || seenInk[q]) continue;
        seenInk[q] = 1;
        st.push(q);
      }
    }
  }

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
  return { regions: required.length, purity: required.length ? worst : 0, blob, inkPieces, inkRatio };
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

/**
 * 그릴 대상 모으기 — 파닉스 단원이면 `flashcards[]`, 동화책 카테고리면 `keyObjectImages[]`.
 *
 * 🔴 **읽는 배열만 다르고 나머지는 같다** — 키포인트 추출 스크립트가 이미 같은 구조로 두 라인을
 *    받는다(`extract-word-card-keypoints.mjs`). 여기서만 다른 모양을 만들면 두 라인이 갈라진다.
 */
async function collectTargets() {
  const out = [];
  if (CATEGORY) {
    const { listStorybookKeys, getJsonByKey } = await import('./translation-core.mjs');
    for (const k of await listStorybookKeys()) {
      const sb = await getJsonByKey(k).catch(() => null);
      if (!sb || sb.category !== CATEGORY) continue;
      for (const img of sb.keyObjectImages ?? []) {
        if (!img.imageUrl || !img.objectName) continue;
        const ko = sb.key_objects?.find(
          (o) => o.name?.toLowerCase() === img.objectName.toLowerCase()
        );
        // 🔴 **`objectName` 을 그림 지시로 쓰면 안 된다** — 동화책 핵심단어는 영어가 아니라
        //    로마자 표기다(`Bak`·`Jige`·`Yeopjeon`). 모델에 "Jige" 를 주면 아무거나 그린다.
        //    사람이 읽을 설명은 `description`(= "a round bottle gourd") 에 있고, 전래동화 200개는
        //    `fill-key-object-descriptions.mjs` 로 이미 다 채워져 있다. 파닉스는 낱말이 곧 사물이라
        //    이 문제가 없어서 여기서 처음 드러났다.
        // 🔴 **라인마다 쓸 만한 필드가 다르다.** 그림 지시로 쓸 수 있는 건 영어 사물 묘사뿐인데,
        //    전래동화는 `objectName` 이 로마자(`Jige`)라 `description`("a Korean A-frame back carrier")을
        //    써야 하고, 세계 명작은 정반대다 — `objectName` 이 진짜 영어(`apple`)이고 `description` 은
        //    한국어 줄거리다("왕비가 건넨, 겉은 탐스럽게 붉지만 독이 든 사과"). 줄거리는 사물 묘사가
        //    아니라서 그대로 넣으면 모델이 왕비를 그린다.
        //    그래서 **설명이 영어일 때만 설명을 쓰고, 아니면 영어 이름으로 되돌린다.**
        const desc = (ko?.description || ko?.definition || '').trim();
        const descIsEnglish = desc.length > 0 && !/[가-힣]/.test(desc);
        const englishName = (ko?.nameEn || img.objectName || '').trim();
        const subject = descIsEnglish ? desc : englishName;
        // 영어 이름조차 로마자면(전래동화인데 설명이 비었을 때) 그릴 수가 없다 — 건너뛴다.
        if (!subject || /[가-힣]/.test(subject)) continue;
        out.push({
          bookId: sb.id,
          slug: `${sb.id}__${img.objectName}`.replace(/[^\w가-힣.-]+/g, '_'),
          word: ko?.korean || img.objectName,
          subject,
          imageUrl: img.imageUrl,
          holder: img,
          sb,
        });
      }
    }
  } else {
    for (const unitId of UNITS) {
      const sb = await getStorybook(unitId);
      for (const card of sb?.flashcards ?? []) {
        const word = card.word ?? card.text;
        if (!word || !card.imageUrl) continue;
        out.push({
          bookId: unitId,
          slug: `${unitId}-${word}`,
          word,
          subject: word,
          imageUrl: card.imageUrl,
          holder: card,
          sb,
        });
      }
    }
  }
  return WORDS ? out.filter((t) => WORDS.includes(t.word) || WORDS.includes(t.subject)) : out;
}

/**
 * 로컬 생성기(`comfy_test/scripts/_coloring_pages.mjs`)가 읽을 작업 목록.
 *
 * 🔴 대상 낱말을 저 스크립트에 손으로 옮겨 적지 않는다 — 파닉스 19개는 그렇게 했는데, 동화책은
 *    수백 개라 옮겨 적는 순간 두 곳이 갈라진다. R2 가 진실이고 목록은 여기서 파생한다.
 */
async function writeJobs(targets) {
  const file = path.join(PREVIEW_DIR, '_jobs.json');
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
  fs.writeFileSync(
    file,
    JSON.stringify(
      targets.map((t) => ({ slug: t.slug, word: t.word, subject: t.subject, ref: t.imageUrl })),
      null,
      2
    )
  );
  console.log(`작업 목록 ${targets.length}개 → ${file}`);
  console.log('다음: (comfy_test) node scripts/_coloring_pages.mjs --jobs');
  return file;
}

// ── 원본 삽화에서 바로 만들기 ────────────────────────────────────────────────
//
// 🔴 **생성 모델을 쓰지 않는 길이고, 쓸 수 있으면 이쪽이 낫다.** 색을 몇 개로 뭉개면 뭉친 덩어리가
//    곧 칸이고, 그 색이 곧 정답색이고, 칸 경계가 곧 선이다. 무엇보다 도안과 정답본이 **같은 원본에서
//    파생**되므로 어긋날 수가 없다 — 생성 경로가 다섯 사이클을 잡아먹은 「정답본 순도」 문제가
//    여기선 원리상 없다(실측 100%). 대신 그림체를 탄다: 색연필·평면 그림은 잘 되고, 니들펠트처럼
//    질감이 두꺼운 그림은 선이 사물이 아니라 명암을 따라가 실패한다.
const POSTER_MIN_RATIO = 0.004; // 이보다 작은 칸은 이웃에 흡수 — 네 살 손가락이 못 짚는다
const POSTER_LINE = 3;
const POSTER_DARK = 85;
/**
 * 칸 수는 색 개수로 조절한다 — 적으면 밋밋하고 많으면 잘다. 통과하면 즉시 멈춘다.
 *
 * 🔴 **적은 쪽부터 훑는다.** 색이 많을수록 면 안의 미세한 색 흔들림이 살아남아 실지렁이 잔선이
 *    되는데(사과가 색 10 으로 통과해 놓고 얼룩투성이였다), 검사기는 그 잔선을 "칸"으로 세기만
 *    하고 결함으로 보지 못한다. 같은 값이면 **덜 쪼갠 쪽이 항상 낫다**.
 */
const COLOR_SWEEP = [4, 5, 6, 8, 10, 12];

function labelByColor(rgb, S) {
  const labels = new Int32Array(S * S);
  const sizes = [0];
  const colorOf = [null];
  const stack = [];
  let next = 0;
  const same = (a, b) =>
    rgb[a * 3] === rgb[b * 3] && rgb[a * 3 + 1] === rgb[b * 3 + 1] && rgb[a * 3 + 2] === rgb[b * 3 + 2];
  for (let seed = 0; seed < labels.length; seed++) {
    if (labels[seed]) continue;
    next++;
    let size = 0;
    labels[seed] = next;
    stack.push(seed);
    while (stack.length) {
      const p = stack.pop();
      size++;
      const x = p % S;
      const push = (q) => {
        if (q < 0 || q >= labels.length || labels[q] || !same(p, q)) return;
        labels[q] = next;
        stack.push(q);
      };
      if (x > 0) push(p - 1);
      if (x < S - 1) push(p + 1);
      push(p - S);
      push(p + S);
    }
    sizes.push(size);
    colorOf.push([rgb[seed * 3], rgb[seed * 3 + 1], rgb[seed * 3 + 2]]);
  }
  return { labels, sizes, colorOf };
}

/** 작은 칸을 가장 많이 맞닿은 이웃 색으로 덮어쓴다 — 질감이 만든 티끌을 걷어낸다. */
function absorbSmall(rgb, S, minPx) {
  for (let pass = 0; pass < 4; pass++) {
    const { labels, sizes, colorOf } = labelByColor(rgb, S);
    const small = new Set();
    for (let id = 1; id < sizes.length; id++) if (sizes[id] < minPx) small.add(id);
    if (small.size === 0) break;
    const nb = new Map();
    for (let i = 0; i < labels.length; i++) {
      const a = labels[i];
      if (!small.has(a)) continue;
      const x = i % S;
      for (const q of [x > 0 ? i - 1 : -1, x < S - 1 ? i + 1 : -1, i - S, i + S]) {
        if (q < 0 || q >= labels.length) continue;
        const b = labels[q];
        if (b === a || small.has(b)) continue;
        const m = nb.get(a) ?? new Map();
        m.set(b, (m.get(b) ?? 0) + 1);
        nb.set(a, m);
      }
    }
    const repl = new Map();
    for (const [a, m] of nb) {
      let best = 0;
      let bestN = -1;
      for (const [b, n] of m) if (n > bestN) ((bestN = n), (best = b));
      if (best) repl.set(a, colorOf[best]);
    }
    if (repl.size === 0) break;
    for (let i = 0; i < labels.length; i++) {
      const c = repl.get(labels[i]);
      if (!c) continue;
      rgb[i * 3] = c[0];
      rgb[i * 3 + 1] = c[1];
      rgb[i * 3 + 2] = c[2];
    }
  }
}

/**
 * 어두운 픽셀 중 **가는 획만** — 눈·입처럼 작가가 그린 선은 살리고, 머리카락·옷 같은 넓은 검은
 * 면은 테두리만 남긴다. 🔴 어두운 걸 다 선으로 삼으면 그 면이 통째로 벽이 돼 영영 못 칠한다.
 */
function thinStrokesOnly(mask, S, r = 4) {
  const eroded = new Uint8Array(S * S);
  for (let y = r; y < S - r; y++) {
    for (let x = r; x < S - r; x++) {
      let all = 1;
      for (let dy = -r; dy <= r && all; dy++)
        for (let dx = -r; dx <= r; dx++)
          if (!mask[(y + dy) * S + (x + dx)]) {
            all = 0;
            break;
          }
      if (all) eroded[y * S + x] = 1;
    }
  }
  const out = new Uint8Array(S * S);
  for (let i = 0; i < mask.length; i++) out[i] = mask[i] && !eroded[i] ? 1 : 0;
  return out;
}

/**
 * 잉크에서 **티끌 조각**을 털어낸다.
 *
 * 🔴 수채 그림의 어두운 반점이 "가는 획"으로 통과해 성벽·나무에 검은 점이 흩뿌려졌다. 큰 덩어리도
 *    굵은 선도 아니라서 기존 검사(칸 수·순도·덩어리)를 전부 빠져나갔고, 나는 숫자만 보고 통과라고
 *    보고했다(사용자가 그림을 열어보고 "개판"이라고 했다). 진짜 선은 서로 이어져 큰 덩어리를
 *    이루므로, **작고 외딴 잉크 조각**은 지워도 그림이 상하지 않는다.
 *    ⚠️ 눈동자는 1024 기준 200~400px 라 상한을 그보다 낮게 둔다.
 */
function despeckle(ink, S, minPx = 120) {
  const seen = new Uint8Array(S * S);
  const stack = [];
  for (let seed = 0; seed < ink.length; seed++) {
    if (!ink[seed] || seen[seed]) continue;
    const comp = [];
    seen[seed] = 1;
    stack.push(seed);
    while (stack.length) {
      const p = stack.pop();
      comp.push(p);
      const x = p % S;
      for (const q of [x > 0 ? p - 1 : -1, x < S - 1 ? p + 1 : -1, p - S, p + S]) {
        if (q < 0 || q >= ink.length || !ink[q] || seen[q]) continue;
        seen[q] = 1;
        stack.push(q);
      }
    }
    if (comp.length < minPx) for (const p of comp) ink[p] = 0;
  }
}

function outlineOf(rgb, S, darkMask) {
  const { labels } = labelByColor(rgb, S);
  const ink = new Uint8Array(S * S);
  for (let i = 0; i < labels.length; i++) {
    const x = i % S;
    if (
      (x < S - 1 && labels[i] !== labels[i + 1]) ||
      (i + S < labels.length && labels[i] !== labels[i + S])
    )
      ink[i] = 1;
    if (darkMask[i]) ink[i] = 1;
  }
  // ⚠️ despeckle(ink, S) 은 쓰지 않는다 — 티끌만 털려던 건데 경계선 자체가 잘게 끊겨 있어서
  //    같이 지워졌고 칸이 0개가 됐다(통과 18/20 → 1/8). 얼룩은 여기서 지울 게 아니라 애초에
  //    안 생기게 해야 한다.
  const out = new Uint8Array(S * S);
  const r = Math.floor(POSTER_LINE / 2);
  for (let i = 0; i < ink.length; i++) {
    if (!ink[i]) continue;
    const x = i % S;
    const y = (i / S) | 0;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < S && ny >= 0 && ny < S) out[ny * S + nx] = 1;
      }
  }
  const gray = Buffer.alloc(S * S);
  for (let i = 0; i < out.length; i++) gray[i] = out[i] ? 0 : 255;
  return gray;
}

/**
 * 검은 선을 **선 그대로** 쓴다.
 *
 * 🔴 굵은 검은 윤곽을 색 덩어리(=칸)로 잡으면 그 선의 **양쪽 테두리를 각각** 그려서 2중선이 된다
 *    (사용자 지적). 원본이 이미 선인 자리는 경계를 긋지 말고 그 자리를 통째로 잉크로 쓴다.
 */
function outlineKeepingInk(rgb, S, inkMask) {
  const { labels } = labelByColor(rgb, S);
  const ink = new Uint8Array(S * S);
  for (let i = 0; i < labels.length; i++) {
    if (inkMask[i]) continue;
    const x = i % S;
    if (
      (x < S - 1 && labels[i] !== labels[i + 1] && !inkMask[i + 1]) ||
      (i + S < labels.length && labels[i] !== labels[i + S] && !inkMask[i + S])
    )
      ink[i] = 1;
  }
  for (let i = 0; i < ink.length; i++) if (inkMask[i]) ink[i] = 1;

  const out = new Uint8Array(S * S);
  const r = Math.floor(POSTER_LINE / 2);
  for (let i = 0; i < ink.length; i++) {
    if (!ink[i]) continue;
    const x = i % S;
    const y = (i / S) | 0;
    for (let dy = -r; dy <= r; dy++)
      for (let dx = -r; dx <= r; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < S && ny >= 0 && ny < S) out[ny * S + nx] = 1;
      }
  }
  const gray = Buffer.alloc(S * S);
  for (let i = 0; i < out.length; i++) gray[i] = out[i] ? 0 : 255;
  return gray;
}

/**
 * 생성한 **평면 색 그림** 한 장 → (도안, 정답본).
 *
 * 🔴 이게 최종 경로다. 두 장을 따로 그리는 대신 한 장을 쪼개므로 **순도가 원리상 100%** 이고,
 *    원본 그림체(수채·니들펠트)에 좌우되지도 않는다 — 평면 색으로 그려 달라고 우리가 주문하기
 *    때문이다. 색뭉개기가 수채에서 무너지던 문제가 여기서 사라진다.
 */
async function splitFlat(srcPath, slug, S = 1024) {
  const base = sharp(srcPath).resize(S, S, { fit: 'contain', background: '#ffffff' }).flatten({
    background: '#ffffff',
  });
  const grayRaw = await base.clone().greyscale().median(3).raw().toBuffer();
  const darkRaw = new Uint8Array(S * S);
  for (let i = 0; i < darkRaw.length; i++) darkRaw[i] = grayRaw[i] < POSTER_DARK ? 1 : 0;
  /**
   * 🔴 검은 자리는 **그대로 선으로 쓴다** — 침식하지 않는다.
   *
   *    침식으로 "선"과 "칠해진 검은 면"을 가르려 했지만 반경으로는 안 갈린다: 반경이 선 굵기보다
   *    크면 굵은 선의 속이 파여 **2중선**이 되고(집이 그렇게 나왔다), 작으면 검은 면이 그대로 남는다.
   *    검은 면은 여기서 지울 게 아니라 **애초에 안 생기게** 해야 한다 — 생성 프롬프트가
   *    "진한 색 금지, 검정은 윤곽선에만"으로 막는다(`_flat-illustrations.mjs`).
   */
  const inkMask = darkRaw;

  const linePath = path.join(PREVIEW_DIR, `${slug}.png`);
  const ansPath = path.join(PREVIEW_DIR, `${slug}-answer.png`);
  let best = null;

  for (const colors of COLOR_SWEEP) {
    // 🔴 median 을 세게 건다(3→9). 평면 색 그림은 면이 이미 단색이라 형태가 안 상하고,
    //    벽면에 남는 **실지렁이 잔선**(미세한 색 흔들림이 그은 경계)만 죽는다.
    const png = await base.clone().median(9).png({ palette: true, colors, dither: 0 }).toBuffer();
    const { data: rgb } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    absorbSmall(rgb, S, Math.round(S * S * POSTER_MIN_RATIO));

    await sharp(Buffer.from(rgb), { raw: { width: S, height: S, channels: 3 } })
      .png({ palette: true, colors: 32 })
      .toFile(ansPath);
    await sharp(outlineKeepingInk(rgb, S, inkMask), { raw: { width: S, height: S, channels: 1 } })
      .png({ palette: true, colors: 2 })
      .toFile(linePath);

    const m = await measure(linePath, ansPath);
    if (
      m.regions >= MIN_REGIONS &&
      m.regions <= MAX_REGIONS &&
      m.blob <= MAX_BLOB &&
      m.inkPieces <= MAX_INK_PIECES &&
      m.inkRatio <= MAX_INK_RATIO
    )
      return { ...m, colors, ok: true };
    const miss =
      m.regions < MIN_REGIONS ? MIN_REGIONS - m.regions : Math.max(0, m.regions - MAX_REGIONS);
    if (!best || miss < best.miss) best = { ...m, colors, ok: false, miss };
  }
  return best;
}

/** 원본 삽화 한 장 → (도안, 정답본). 색 개수를 훑어 칸 수가 범위에 드는 것을 고른다. */
async function buildFromIllustration(url, slug, S = 1024) {
  const src = Buffer.from(await (await fetch(url)).arrayBuffer());
  const base = sharp(src).resize(S, S, { fit: 'contain', background: '#ffffff' }).flatten({
    background: '#ffffff',
  });
  const grayRaw = await base.clone().greyscale().median(3).raw().toBuffer();
  const darkRaw = new Uint8Array(S * S);
  for (let i = 0; i < darkRaw.length; i++) darkRaw[i] = grayRaw[i] < POSTER_DARK ? 1 : 0;
  const darkMask = thinStrokesOnly(darkRaw, S);

  const linePath = path.join(PREVIEW_DIR, `${slug}.png`);
  const ansPath = path.join(PREVIEW_DIR, `${slug}-answer.png`);
  let best = null;

  for (const colors of COLOR_SWEEP) {
    const png = await base.clone().median(7).png({ palette: true, colors, dither: 0 }).toBuffer();
    const { data: rgb } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    absorbSmall(rgb, S, Math.round(S * S * POSTER_MIN_RATIO));

    await sharp(Buffer.from(rgb), { raw: { width: S, height: S, channels: 3 } })
      .png({ palette: true, colors: 32 })
      .toFile(ansPath);
    await sharp(outlineOf(rgb, S, darkMask), { raw: { width: S, height: S, channels: 1 } })
      .png({ palette: true, colors: 2 })
      .toFile(linePath);

    const m = await measure(linePath, ansPath);
    const ok = m.regions >= MIN_REGIONS && m.regions <= MAX_REGIONS && m.blob <= MAX_BLOB;
    if (ok) return { ...m, colors, ok: true };
    // 통과 못 하면 범위에서 얼마나 벗어났는지로 순위만 매긴다.
    const miss =
      m.regions < MIN_REGIONS ? MIN_REGIONS - m.regions : Math.max(0, m.regions - MAX_REGIONS);
    if (!best || miss < best.miss) best = { ...m, colors, ok: false, miss };
  }
  // 제일 나은 색 개수로 다시 써 둔다(마지막 후보가 남아 있으면 안 된다).
  if (best) {
    const png = await base
      .clone()
      .median(7)
      .png({ palette: true, colors: best.colors, dither: 0 })
      .toBuffer();
    const { data: rgb } = await sharp(png).removeAlpha().raw().toBuffer({ resolveWithObject: true });
    absorbSmall(rgb, S, Math.round(S * S * POSTER_MIN_RATIO));
    await sharp(Buffer.from(rgb), { raw: { width: S, height: S, channels: 3 } })
      .png({ palette: true, colors: 32 })
      .toFile(ansPath);
    await sharp(outlineOf(rgb, S, darkMask), { raw: { width: S, height: S, channels: 1 } })
      .png({ palette: true, colors: 2 })
      .toFile(linePath);
  }
  return best;
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

// --split-flat: 로컬 생성기가 뽑아 둔 **평면 색 그림**을 도안+정답본으로 쪼갠다.
if (SPLIT_FLAT) {
  const flatDir = path.join(__dirname, '_preview-flat');
  if (!fs.existsSync(flatDir)) {
    console.log(`평면 색 그림 폴더가 없다: ${flatDir}`);
    process.exit(1);
  }
  const labels = fs.existsSync(LABELS_FILE) ? JSON.parse(fs.readFileSync(LABELS_FILE, 'utf8')) : {};
  const jobsPath = path.join(PREVIEW_DIR, '_jobs.json');
  if (fs.existsSync(jobsPath))
    for (const j of JSON.parse(fs.readFileSync(jobsPath, 'utf8')))
      labels[j.slug] = { word: j.word, originalUrl: j.ref, bookId: j.slug.split('__')[0] };

  // 🔴 후보(`{slug}~1.png`, `~2`, `~3`)를 낱말별로 묶어 **검사를 통과하는 첫 후보**를 고른다.
  //    생성이 확률적이라 한 장만 뽑으면 진한 색·칸 수가 운에 좌우된다 — 고르는 일은 눈이 아니라
  //    검사기가 한다.
  const byWord = new Map();
  for (const f of fs.readdirSync(flatDir).filter((f) => f.endsWith('.png'))) {
    const slug = f.replace(/\.png$/, '');
    const key = slug.split('~')[0];
    (byWord.get(key) ?? byWord.set(key, []).get(key)).push(f);
  }

  console.log('그림                          후보  색  칸수  순도  덩어리  조각  잉크  판정');
  let pass = 0;
  for (const [key, files] of byWord) {
    let chosen = null;
    let chosenN = 0;
    for (const [i, f] of files.sort().entries()) {
      const r = await splitFlat(path.join(flatDir, f), key);
      if (r?.ok) {
        chosen = r;
        chosenN = i + 1;
        break;
      }
      // 🔴 통과 못 했을 때의 순위는 **모든 지표를 함께** 본다. 칸 수만 보면 칸이 범위에 든 채
      //    검게 칠해진 후보가 1등으로 굳어 뒤 후보를 아예 안 보게 된다(숲·집이 그래서 후보 1에
      //    멈춰 있었다). 초과분을 정규화해 더한다.
      const penalty = (m) =>
        (m?.miss ?? 99) / 4 +
        Math.max(0, (m?.blob ?? 1) - MAX_BLOB) / MAX_BLOB +
        Math.max(0, (m?.inkPieces ?? 99) - MAX_INK_PIECES) / MAX_INK_PIECES +
        Math.max(0, (m?.inkRatio ?? 1) - MAX_INK_RATIO) / MAX_INK_RATIO;
      if (!chosen || penalty(r) < penalty(chosen)) {
        chosen = r;
        chosenN = i + 1;
      }
    }
    // 고른 후보로 최종 파일을 다시 쓴다 — 마지막 시도 결과가 남아 있으면 안 된다.
    if (chosen && !chosen.ok) await splitFlat(path.join(flatDir, files.sort()[chosenN - 1]), key);
    if (chosen?.ok) pass++;
    else bad.push({ base: key, ...chosen });
    console.log(
      `${key.slice(-28).padEnd(30)} ${chosenN}/${files.length} ${String(chosen?.colors ?? '-').padStart(
        3
      )} ${String(chosen?.regions ?? '-').padStart(4)}  ${((chosen?.purity ?? 0) * 100)
        .toFixed(0)
        .padStart(4)}% ${((chosen?.blob ?? 0) * 100).toFixed(1).padStart(5)}% ${String(
        chosen?.inkPieces ?? '-'
      ).padStart(5)} ${((chosen?.inkRatio ?? 0) * 100).toFixed(0).padStart(4)}%  ${chosen?.ok ? 'OK' : '⚠'}`
    );
  }
  const files = [...byWord.keys()];
  fs.writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2));
  console.log(`\n통과 ${pass}/${files.length} · 불량 ${bad.length}`);
  process.exit(0);
}

// --from-illustration: 원본 삽화에서 바로 도안+정답본을 만든다(생성 모델 없음).
if (FROM_ILLUSTRATION) {
  const targets = await collectTargets();
  console.log(`대상 ${targets.length}개 — 원본 삽화에서 직접 생성\n`);
  console.log('그림                            색  칸수  덩어리  판정');
  let pass = 0;
  for (const t of targets) {
    try {
      const r = await buildFromIllustration(t.imageUrl, t.slug);
      if (r?.ok) pass++;
      else bad.push({ base: t.slug, ...r });
      console.log(
        `${t.slug.slice(-28).padEnd(30)} ${String(r?.colors ?? '-').padStart(2)} ${String(
          r?.regions ?? '-'
        ).padStart(4)}  ${((r?.blob ?? 0) * 100).toFixed(1).padStart(5)}%  ${r?.ok ? 'OK' : '⚠'}`
      );
    } catch (e) {
      bad.push({ base: t.slug, error: e.message });
      console.log(`${t.slug.slice(-28).padEnd(30)} ${'-'.padStart(2)}   -       -  ✗ ${e.message}`);
    }
  }
  console.log(`\n통과 ${pass}/${targets.length} · 불량 ${bad.length}`);
  // 데모가 쓸 라벨(낱말·원본 삽화 URL)을 남긴다 — 슬러그만으로는 화면에 뭘 띄울지 알 수 없다.
  const labels = fs.existsSync(LABELS_FILE)
    ? JSON.parse(fs.readFileSync(LABELS_FILE, 'utf8'))
    : {};
  for (const t of targets) labels[t.slug] = { word: t.word, originalUrl: t.imageUrl, bookId: t.bookId };
  fs.writeFileSync(LABELS_FILE, JSON.stringify(labels, null, 2));
  console.log(`라벨 ${Object.keys(labels).length}개 → ${LABELS_FILE}`);
  process.exit(0);
}

/**
 * --manifest: 검사를 통과한 짝만 골라 데모(`/coloring-demo`)로 복사하고 매니페스트를 다시 쓴다.
 *
 * 🔴 **통과한 것만 넣는다.** 눈으로 고르지 않는 게 이 파이프라인의 요점이고, 밋밋하거나 잘거나
 *    검게 칠해진 도안이 데모에 섞이면 그게 곧 제품 인상이 된다.
 */
if (MANIFEST) {
  const labels = fs.existsSync(LABELS_FILE)
    ? JSON.parse(fs.readFileSync(LABELS_FILE, 'utf8'))
    : {};
  const publicDir = path.join(__dirname, '..', '..', 'client', 'public', 'coloring');
  fs.mkdirSync(publicDir, { recursive: true });

  // 이미 데모에 있는 항목(파닉스 18장)은 그대로 두고 이어 붙인다.
  const manifestPath = path.join(publicDir, 'manifest.json');
  const existing = fs.existsSync(manifestPath)
    ? JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
    : [];
  const seen = new Set(existing.map((e) => e.lineartUrl));

  let added = 0;
  let skipped = 0;
  for (const f of fs.readdirSync(PREVIEW_DIR).sort()) {
    if (!f.endsWith('-answer.png')) continue;
    const slug = f.replace(/-answer\.png$/, '');
    const linePath = path.join(PREVIEW_DIR, `${slug}.png`);
    if (!fs.existsSync(linePath)) continue;
    const lab = labels[slug];
    if (!lab) continue; // 파닉스 기존 항목은 이미 매니페스트에 있다

    const { regions, purity, blob, inkPieces, inkRatio } = await measure(linePath, path.join(PREVIEW_DIR, f));
    if (regions < MIN_REGIONS || regions > MAX_REGIONS || purity < MIN_PURITY || blob > MAX_BLOB) {
      skipped++;
      continue;
    }
    fs.copyFileSync(linePath, path.join(publicDir, `${slug}.png`));
    fs.copyFileSync(path.join(PREVIEW_DIR, f), path.join(publicDir, `${slug}-answer.png`));
    const entry = {
      unitId: lab.bookId,
      word: lab.word,
      lineartUrl: `/coloring/${slug}.png`,
      answerUrl: `/coloring/${slug}-answer.png`,
      originalUrl: lab.originalUrl,
      ttsUrl: null,
    };
    if (!seen.has(entry.lineartUrl)) {
      existing.push(entry);
      added++;
    }
  }
  fs.writeFileSync(manifestPath, JSON.stringify(existing, null, 2));
  console.log(`데모에 추가 ${added}장 · 검사 탈락 ${skipped}장 · 매니페스트 총 ${existing.length}장`);
  process.exit(0);
}

// --jobs: 로컬 생성기가 읽을 작업 목록만 뽑는다(생성 없음).
if (JOBS) {
  const targets = await collectTargets();
  if (targets.length === 0) {
    console.log('대상이 없다 — --units 또는 --category 를 확인할 것.');
    process.exit(1);
  }
  await writeJobs(targets);
  process.exit(0);
}

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
    const { regions, purity, blob, inkPieces, inkRatio } = await measure(linePath, path.join(PREVIEW_DIR, f));
    const verdicts = [];
    if (purity < MIN_PURITY) verdicts.push('정답본 다시');
    if (regions > MAX_REGIONS) verdicts.push('도안 다시(너무 잘다)');
    if (regions < MIN_REGIONS) verdicts.push('도안 다시(너무 밋밋하다)');
    if (blob > MAX_BLOB) verdicts.push('도안 다시(검게 칠해짐)');
    if (inkPieces > MAX_INK_PIECES) verdicts.push('도안 다시(잔선)');
    if (inkRatio > MAX_INK_RATIO) verdicts.push('도안 다시(선이 굵고 거칠다)');
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
            if (regions >= MIN_REGIONS && regions <= MAX_REGIONS && blob <= MAX_BLOB) return 1;
            const regionScore =
              regions > MAX_REGIONS ? MAX_REGIONS / regions : Math.min(1, regions / MIN_REGIONS);
            return 0.5 * regionScore + 0.5 * Math.min(1, blob > 0 ? MAX_BLOB / blob : 1);
          },
          1,
          word
        );
        fs.writeFileSync(lineFile, png);
        made++;
        const { regions, blob } = await measure(lineFile, lineFile);
        const ok = regions >= MIN_REGIONS && regions <= MAX_REGIONS && blob <= MAX_BLOB;
        if (!ok) bad.push({ base: `${unitId}-${word}`, regions, blob });
        console.log(
          `${ok ? "✓" : "⚠"} ${word.padEnd(6)} 칸 ${regions}개 · 덩어리 ${(blob * 100).toFixed(1)}%  ${lineFile}`
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
