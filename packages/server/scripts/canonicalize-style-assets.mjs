#!/usr/bin/env node
// 모든 storybook 의 styleAssets 키 정규화 (ART_STYLES prompt 형태 → canonical id 머지)
// + 영향받은 책 목록 출력. 변경 시 server 의 saveStorybook 자동 정규화도 함께 작동.
//
// 사용:
//   node packages/server/scripts/canonicalize-style-assets.mjs           # dry-run (보고만)
//   node packages/server/scripts/canonicalize-style-assets.mjs --apply   # 실제 R2 에 저장
//   node packages/server/scripts/canonicalize-style-assets.mjs --apply --id 1777720273075   # 특정 책만

import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalizeArtStyle, canonicalizeStyleAssets } from '@tangobook/shared';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 로드
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
  console.error('R2 env vars 누락. packages/server/.env 확인.');
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

function detectIssues(book) {
  const issues = [];
  // styleAssets 키 중 ART_STYLES.id 가 아닌 prompt 형태가 있는지
  if (book.styleAssets) {
    for (const k of Object.keys(book.styleAssets)) {
      const canon = canonicalizeArtStyle(k);
      if (canon !== k) issues.push(`styleAssets[${k.slice(0, 60)}...] → ${canon}`);
    }
  }
  // top-level artStyle 점검
  if (book.artStyle) {
    const canon = canonicalizeArtStyle(book.artStyle);
    if (canon !== book.artStyle) issues.push(`artStyle: ${book.artStyle.slice(0, 60)}... → ${canon}`);
  }
  // availableStyles 점검 — prompt-form 또는 중복 (canonical 기준)
  if (Array.isArray(book.availableStyles)) {
    const normalized = book.availableStyles.map((s) => canonicalizeArtStyle(s) || s);
    const deduped = Array.from(new Set(normalized));
    const changed =
      book.availableStyles.some((s, i) => s !== normalized[i]) ||
      deduped.length !== book.availableStyles.length;
    if (changed) {
      issues.push(`availableStyles: [${book.availableStyles.join(', ')}] → [${deduped.join(', ')}]`);
    }
  }
  return issues;
}

console.log(`mode: ${APPLY ? 'APPLY (R2 저장)' : 'DRY-RUN'}`);
if (TARGET_ID) console.log(`target id: ${TARGET_ID}`);

const keys = TARGET_ID ? [`storybook-${TARGET_ID}.json`] : await listStorybookKeys();
console.log(`총 ${keys.length} 책 검사`);

let affected = 0;
let updated = 0;
const affectedList = [];

for (const key of keys) {
  let book;
  try {
    book = await loadBook(key);
  } catch (e) {
    console.warn(`load 실패 ${key}: ${e.message}`);
    continue;
  }
  const issues = detectIssues(book);
  if (issues.length === 0) continue;
  affected++;

  const before = JSON.stringify({
    keys: Object.keys(book.styleAssets ?? {}),
    artStyle: book.artStyle,
    availableStyles: book.availableStyles,
  });

  const normalized = canonicalizeStyleAssets(book.styleAssets);
  const newArtStyle = canonicalizeArtStyle(book.artStyle ?? '') || book.artStyle;
  const newAvailable = Array.isArray(book.availableStyles)
    ? Array.from(new Set(book.availableStyles.map((s) => canonicalizeArtStyle(s) || s)))
    : book.availableStyles;

  const after = JSON.stringify({
    keys: Object.keys(normalized),
    artStyle: newArtStyle,
    availableStyles: newAvailable,
  });

  affectedList.push({
    id: book.id,
    title: book.title,
    issues,
    before,
    after,
  });

  if (APPLY) {
    book.styleAssets = normalized;
    book.artStyle = newArtStyle;
    book.availableStyles = newAvailable;
    book.updatedAt = new Date().toISOString();
    await saveBook(key, book);
    updated++;
    console.log(`✓ updated: ${book.id} | ${book.title}`);
  }
}

console.log('\n=== 영향받은 책 ===');
for (const a of affectedList) {
  console.log(`\n[${a.id}] ${a.title}`);
  for (const iss of a.issues) console.log(`  - ${iss}`);
  console.log(`  before: ${a.before}`);
  console.log(`  after:  ${a.after}`);
}

console.log(`\n총 영향: ${affected}권 / 검사: ${keys.length}권`);
if (APPLY) console.log(`업데이트 완료: ${updated}권`);
else console.log(`(dry-run — 실제 적용은 --apply 추가)`);
