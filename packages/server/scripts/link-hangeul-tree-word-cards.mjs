#!/usr/bin/env node
/**
 * 한글 나무 기획서의 「🍎 타겟 단어 카드」 삽화 → 한글 파닉스 유닛 storybook 연동 (멱등).
 *
 *   소스: R2 comic-assets/hangeul-tree-plan/word-{uid}-{roman}.{jpg|png}  (기획서 붙여넣기 원본, 장당 1~4MB)
 *   대상: storybook-kr-{h?-u??}.json 의 flashcards[].imageUrl
 *
 * 원본을 그대로 물리면 게임 한 판(카드 4장) 이 ~7MB 라, 기존 파닉스 삽화와 같은
 * w800 webp 로 구워 `phonics-word-cards/` 에 올리고 그 URL 을 물린다.
 * 키에 원본 해시가 들어가므로 카드를 다시 붙여넣고 재실행하면 새 URL(캐시 안전),
 * 안 바뀌었으면 업로드 skip.
 *
 * 한글↔로마자 매핑은 기획서 HTML 의 UNITS 배열이 SSOT — 여기 다시 적지 않는다.
 *
 * 사용:
 *   node packages/server/scripts/link-hangeul-tree-word-cards.mjs                # dry-run
 *   node packages/server/scripts/link-hangeul-tree-word-cards.mjs --apply
 *   node packages/server/scripts/link-hangeul-tree-word-cards.mjs --only=h3-u03 --apply
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLAN_HTML = path.join(__dirname, '..', '..', 'client', 'public', 'hangeul-tree-plan.html');
const SRC_PREFIX = 'comic-assets/hangeul-tree-plan/';
const OUT_PREFIX = 'phonics-word-cards/';
const WIDTH = 800;
const QUALITY = 82;

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;

loadEnv();
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

/** 기획서 UNITS → { 'h1-u02': [['고기','gogi'], …] }. id 뒤에 오는 [한글, 로마자, 설명] 튜플을 그 유닛에 귀속. */
export function parsePlanUnits(html) {
  const units = {};
  let cur = null;
  const re = /id:\s*'(h\d-u\d\d)'|\['([^']+)',\s*'([a-z]+)',/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) units[(cur = m[1])] = [];
    else if (cur) units[cur].push([m[2], m[3]]);
  }
  return units;
}

async function listSourceCards() {
  const map = {}; // 'h1u02' → { gogi: key }
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: SRC_PREFIX, ContinuationToken: token })
    );
    for (const obj of out.Contents ?? []) {
      const m = (obj.Key ?? '').match(/\/word-([a-z0-9]+)-(.+)\.(png|jpg|jpeg|webp)$/);
      if (m) (map[m[1]] ??= {})[m[2]] = obj.Key;
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return map;
}

/**
 * 유닛 데이터의 오타 교정. `참의` 는 단어가 아니라 `참외`(멜론) 오타인데
 * targetWords·wordFamilies·flashcard 에 그대로 퍼져 있어 아이가 없는 낱말을 배우고,
 * 기획서 삽화(chamoe)와도 매칭이 안 된다.
 */
const TYPOS = { 'kr-h4-u03': { 참의: '참외' } };

function fixTypos(sb, unitId) {
  const map = TYPOS[unitId];
  if (!map) return 0;
  let n = 0;
  const swap = (s) => {
    if (typeof s !== 'string') return s;
    const out = Object.entries(map).reduce((acc, [bad, good]) => acc.split(bad).join(good), s);
    if (out !== s) n++;
    return out;
  };
  const cfg = sb.phonicsConfig;
  if (cfg?.targetWords) cfg.targetWords = cfg.targetWords.map(swap);
  for (const wf of sb.phonicsLesson?.wordFamilies ?? [])
    for (const w of wf.words ?? []) w.word = swap(w.word);
  for (const c of sb.flashcards ?? []) {
    c.word = swap(c.word);
    c.localWord = swap(c.localWord);
    c.sentence = swap(c.sentence);
    c.phonicPattern = swap(c.phonicPattern);
    c.imageDescription = swap(c.imageDescription);
  }
  if (n) console.log(`  ✏️  오타 교정 ${n}건 (${Object.entries(map).map(([b, g]) => `${b}→${g}`).join(', ')})`);
  return n;
}

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** 원본 → w800 webp 업로드. 같은 내용이면 이미 있는 키 재사용. */
async function bakeCard(srcKey, unitId, roman) {
  const src = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: srcKey }));
  const buf = Buffer.from(await src.Body.transformToByteArray());
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const outKey = `${OUT_PREFIX}${unitId}-${roman}-${hash}-w${WIDTH}.webp`;
  const url = `${PUBLIC_URL}/${outKey}`;
  if (await exists(outKey)) return { url, skipped: true, bytes: 0 };
  const webp = await sharp(buf)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  if (APPLY) {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: outKey,
        Body: webp,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
  }
  return { url, skipped: false, bytes: webp.length, srcBytes: buf.length };
}

const plan = parsePlanUnits(fs.readFileSync(PLAN_HTML, 'utf-8'));
const sources = await listSourceCards();

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}`);
console.log(`기획서 유닛 ${Object.keys(plan).length}개 / 원본 카드 ${Object.values(sources).reduce((n, u) => n + Object.keys(u).length, 0)}장\n`);

let linked = 0;
let baked = 0;
const problems = [];

for (const [planId, words] of Object.entries(plan)) {
  if (ONLY && planId !== ONLY) continue;
  const unitId = `kr-${planId}`;
  const uid = planId.replace('-', '');
  const cards = sources[uid] ?? {};
  if (Object.keys(cards).length === 0) {
    console.log(`[${unitId}] 원본 카드 없음 — skip`);
    continue;
  }

  const sb = await getStorybook(unitId);
  let changed = fixTypos(sb, unitId);
  const flashcards = (sb.flashcards ??= []);
  const romanByWord = new Map(words.map(([ko, rom]) => [ko, rom]));

  // 게임 어댑터는 targetWords 를 돌며 flashcard 를 찾는다 → 매칭 기준도 targetWords.
  for (const word of sb.phonicsConfig?.targetWords ?? []) {
    const roman = romanByWord.get(word);
    if (!roman) {
      problems.push(`[${unitId}] "${word}" — 기획서에 없는 단어 (카드 매칭 실패)`);
      continue;
    }
    const srcKey = cards[roman];
    if (!srcKey) {
      problems.push(`[${unitId}] "${word}"(${roman}) — 삽화 미업로드`);
      continue;
    }
    let card = flashcards.find((c) => (c.word ?? c.localWord) === word);
    if (!card) {
      // targetWords 에 있는데 카드가 없던 단어(예: h4-u02 시계·얘기) — 이미지만 있는 최소 카드 생성.
      card = { word, localWord: word };
      flashcards.push(card);
      changed++;
      console.log(`  ➕ flashcard 생성: ${word}`);
    }
    if (!APPLY) {
      // dry-run 은 원본(212MB)을 안 받는다 — 매칭만 확인.
      linked++;
      changed++;
      continue;
    }
    const { url, skipped, bytes, srcBytes } = await bakeCard(srcKey, unitId, roman);
    if (!skipped) {
      baked++;
      console.log(
        `  🖼️  ${word} ${(srcBytes / 1024 / 1024).toFixed(1)}MB → ${(bytes / 1024).toFixed(0)}KB`
      );
    }
    if (card.imageUrl === url) continue;
    if (card.imageUrl) card.imageHistory = [...(card.imageHistory ?? []), card.imageUrl];
    card.imageUrl = url;
    changed++;
    linked++;
  }

  console.log(`[${unitId}] 타겟 단어 ${(sb.phonicsConfig?.targetWords ?? []).length}개 중 ${changed}건 반영`);
  if (changed && APPLY) {
    sb.updatedAt = new Date().toISOString();
    await putStorybook(unitId, sb);
  }
}

console.log(`\n연결 ${linked}장 / webp 신규 생성 ${baked}장`);
if (problems.length) {
  console.log(`\n⚠️  확인 필요 ${problems.length}건`);
  problems.forEach((p) => console.log('  - ' + p));
}
if (!APPLY) console.log('\n(dry-run — 반영하려면 --apply)');
