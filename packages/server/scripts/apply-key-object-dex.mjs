#!/usr/bin/env node
// 매핑 파일 (docs/key-object-dex-mapping.json) → 모든 storybook 책 KeyObject.dexCategory 채움.
// 사용:
//   node packages/server/scripts/apply-key-object-dex.mjs              # dry-run
//   node packages/server/scripts/apply-key-object-dex.mjs --apply      # R2 저장
//   node packages/server/scripts/apply-key-object-dex.mjs --apply --id 1773134216331

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 env vars 누락');
  process.exit(1);
}

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const idArgIdx = args.indexOf('--id');
const TARGET_ID = idArgIdx >= 0 ? args[idArgIdx + 1] : null;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf-8');
}

async function listStorybookKeys() {
  const keys = [];
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
    );
    for (const obj of out.Contents ?? []) {
      if (obj.Key && obj.Key.match(/^storybook-\d+\.json$/)) keys.push(obj.Key);
    }
    token = out.NextContinuationToken;
  } while (token);
  return keys;
}

async function loadBook(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await streamToString(out.Body));
}

async function saveBook(key, book) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(book),
      ContentType: 'application/json',
    })
  );
}

const HAS_KOREAN = /[ㄱ-㆏가-힯]/;
function dedupeKey(ko, name) {
  const k = (ko ?? '').trim();
  const n = (name ?? '').trim();
  if (k) return `ko:${k}`;
  if (n && HAS_KOREAN.test(n)) return `ko:${n}`;
  if (n) return `en:${n.toLowerCase()}`;
  return null;
}

const mappingPath = path.join(__dirname, '..', '..', '..', 'docs', 'key-object-dex-mapping.json');
const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf-8'));
const wordToCategory = mapping.map; // { 'ko:호박': 'food', 'ko:행복한': null, ... }

console.log(`mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
if (TARGET_ID) console.log(`target id: ${TARGET_ID}`);

const keys = TARGET_ID ? [`storybook-${TARGET_ID}.json`] : await listStorybookKeys();
console.log(`총 ${keys.length} 책 검사`);

let booksTouched = 0;
let booksUpdated = 0;
let keyObjectsTouched = 0;
let keyObjectsAlreadyClassified = 0;
let keyObjectsNoMatch = 0;

for (const key of keys) {
  let book;
  try {
    book = await loadBook(key);
  } catch (e) {
    console.warn(`load 실패 ${key}: ${e.message}`);
    continue;
  }

  if (book.type === 'phonics' || book.phonicsLanguage) continue;
  if (typeof book.id === 'string' && /__L\d/.test(book.id)) continue;

  const kos = Array.isArray(book.key_objects) ? book.key_objects : [];
  if (kos.length === 0) continue;

  let changed = false;

  for (const ko of kos) {
    if (ko.dexCategory) {
      keyObjectsAlreadyClassified++;
      continue;
    }
    const dk = dedupeKey(ko.korean, ko.name);
    if (!dk) {
      keyObjectsNoMatch++;
      continue;
    }
    if (!(dk in wordToCategory)) {
      keyObjectsNoMatch++;
      continue;
    }
    const cat = wordToCategory[dk];
    if (cat == null) {
      // 명시적 SKIP — dexCategory 미설정 (도감 카드 X)
      continue;
    }
    ko.dexCategory = cat;
    changed = true;
    keyObjectsTouched++;
  }

  if (changed) {
    booksTouched++;
    if (APPLY) {
      book.updatedAt = new Date().toISOString();
      await saveBook(key, book);
      booksUpdated++;
    }
  }
}

console.log(`\n책 영향: ${booksTouched} / 검사 ${keys.length}`);
console.log(`KeyObject dexCategory 채움: ${keyObjectsTouched}`);
console.log(`이미 분류됨: ${keyObjectsAlreadyClassified}`);
console.log(`매핑에 없음 (skip): ${keyObjectsNoMatch}`);
if (APPLY) console.log(`R2 저장 완료: ${booksUpdated}권`);
else console.log(`(dry-run — --apply 추가 시 R2 저장)`);
