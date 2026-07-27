#!/usr/bin/env node
/**
 * ABC 나무 기획서의 「🍎 타겟 단어 카드」 삽화 → 영어 파닉스 유닛 storybook 연동 (멱등).
 * 한글판 `link-hangeul-tree-word-cards.mjs` 의 포크 — 다른 점만 아래에.
 *
 *   소스: R2 comic-assets/abc-tree-plan/word-{en-b?-u??}-{영숫자}.{jpg|png}  (붙여넣기 원본, 장당 1~4MB)
 *   대상: storybook-en-b?-u??.json 의 flashcards[].imageUrl
 *
 * 🔴 한글판과 달리 **로마자 매핑이 필요 없다** — 단어가 이미 영문이라 기획서 HTML 을 파싱하지 않는다.
 *    대신 붙여넣기 키가 영숫자만 남기므로(`yo-yo`→`yoyo`, `June`→`June`) 양쪽을 정규화해 맞춘다.
 *
 * 🔴 매칭 기준은 flashcard 가 아니라 **`phonicsConfig.targetWords`** — 게임 어댑터가 그걸 돌며
 *    flashcard 를 찾기 때문이다. targetWords 에 없는 카드는 아무 게임에도 안 뜬다.
 *
 * 사용:
 *   node packages/server/scripts/link-abc-tree-word-cards.mjs                 # dry-run
 *   node packages/server/scripts/link-abc-tree-word-cards.mjs --apply
 *   node packages/server/scripts/link-abc-tree-word-cards.mjs --only=en-b2-u01 --apply
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
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const SRC_PREFIX = 'comic-assets/abc-tree-plan/';
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

/** 붙여넣기 키가 영숫자만 남긴다(abc-tree-plan.html) — 비교는 양쪽 다 같은 규칙으로. */
export const normWord = (w) => String(w).replace(/[^a-z0-9]/gi, '').toLowerCase();

async function listSourceCards() {
  const map = {}; // 'en-b1-u01' → { apple: key }
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: SRC_PREFIX, ContinuationToken: token })
    );
    for (const obj of out.Contents ?? []) {
      const m = (obj.Key ?? '').match(/\/word-(en-b\d-u\d\d)-(.+)\.(png|jpg|jpeg|webp)$/);
      if (m) (map[m[1]] ??= {})[normWord(m[2])] = obj.Key;
    }
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return map;
}

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** 원본 → w800 webp 업로드. 같은 내용이면 이미 있는 키 재사용(해시가 키에 들어간다). */
async function bakeCard(srcKey, unitId, word) {
  const src = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: srcKey }));
  const buf = Buffer.from(await src.Body.transformToByteArray());
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const outKey = `${OUT_PREFIX}${unitId}-${word}-${hash}-w${WIDTH}.webp`;
  const url = `${PUBLIC_URL}/${outKey}`;
  if (await exists(outKey)) return { url, skipped: true, bytes: 0, srcBytes: buf.length };
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

const sources = await listSourceCards();
const unitIds = Object.keys(sources).sort();

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}`);
console.log(
  `유닛 ${unitIds.length}개 / 원본 카드 ${Object.values(sources).reduce((n, u) => n + Object.keys(u).length, 0)}장\n`
);

let linked = 0;
let baked = 0;
const problems = [];

for (const unitId of unitIds) {
  if (ONLY && unitId !== ONLY) continue;
  const cards = sources[unitId];

  let sb;
  try {
    sb = await getStorybook(unitId);
  } catch {
    problems.push(`[${unitId}] storybook 없음 — 카드 ${Object.keys(cards).length}장 대기`);
    continue;
  }

  let changed = 0;
  const flashcards = (sb.flashcards ??= []);
  const targetWords = sb.phonicsConfig?.targetWords ?? [];
  const used = new Set();

  for (const word of targetWords) {
    const key = normWord(word);
    const srcKey = cards[key];
    if (!srcKey) {
      problems.push(`[${unitId}] "${word}" — 삽화 없음`);
      continue;
    }
    used.add(key);

    let card = flashcards.find((c) => (c.word ?? c.localWord) === word);
    if (!card) {
      card = { word, localWord: word };
      flashcards.push(card);
      changed++;
      console.log(`  ➕ flashcard 생성: ${word}`);
    }
    if (!APPLY) {
      // dry-run 은 원본(697MB)을 안 받는다 — 매칭만 확인.
      linked++;
      changed++;
      continue;
    }
    const { url, skipped, bytes, srcBytes } = await bakeCard(srcKey, unitId, key);
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

  for (const key of Object.keys(cards)) {
    if (!used.has(key)) problems.push(`[${unitId}] 카드 "${key}" — targetWords 에 없어 안 쓰임`);
  }

  console.log(`[${unitId}] 타겟 단어 ${targetWords.length}개 중 ${changed}건 반영`);
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
