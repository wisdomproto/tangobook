#!/usr/bin/env node
// 모든 storybook 의 KeyObject 풀링 → unique 단어 추출 → JSON dump.
// Phase 1 §5.2 도감 6 카테고리 매핑 작성용 (2026-05-03).
//
// 출력 파일: docs/key-object-dex-extraction.json
//   - byBook: { [bookId]: { title, words: [{ name, korean, dexCategory? }] } }
//   - unique: [{ key, name, korean, occurrences, sampleBookIds, dexCategory? }]   ← 매핑 작성용
//
// key 규칙 (dedupe): korean 우선 (한국어 라벨이 진실 source), 없으면 name lowercase.
// 사용:
//   node packages/server/scripts/extract-key-objects-for-dex.mjs

import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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
  console.error('R2 env vars 누락. packages/server/.env 확인.');
  process.exit(1);
}

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

const HAS_KOREAN = /[ㄱ-㆏가-힯]/;
function dedupeKey(ko, name) {
  const k = (ko ?? '').trim();
  const n = (name ?? '').trim();
  // 한국어 표기 우선 — name 에 한국어가 들어있는 경우도 한국어 키로 통일
  if (k) return `ko:${k}`;
  if (n && HAS_KOREAN.test(n)) return `ko:${n}`;
  if (n) return `en:${n.toLowerCase()}`;
  return null;
}

const keys = await listStorybookKeys();
console.log(`총 ${keys.length} 책 스캔`);

const byBook = {};
const uniqueMap = new Map();

let phonicsSkipped = 0;
let levelVariantSkipped = 0;
let noKeyObjectSkipped = 0;

for (const key of keys) {
  let book;
  try {
    book = await loadBook(key);
  } catch (e) {
    console.warn(`load 실패 ${key}: ${e.message}`);
    continue;
  }

  // 파닉스 / 레벨 variation 제외
  if (book.type === 'phonics' || book.phonicsLanguage) {
    phonicsSkipped++;
    continue;
  }
  if (typeof book.id === 'string' && /__L\d/.test(book.id)) {
    levelVariantSkipped++;
    continue;
  }

  const kos = Array.isArray(book.key_objects) ? book.key_objects : [];
  if (kos.length === 0) {
    noKeyObjectSkipped++;
    continue;
  }

  byBook[book.id] = {
    title: book.title ?? '(제목 없음)',
    category: book.category ?? null,
    words: kos.map((ko) => ({
      name: ko.name ?? null,
      korean: ko.korean ?? null,
      dexCategory: ko.dexCategory ?? null,
    })),
  };

  for (const ko of kos) {
    const dk = dedupeKey(ko.korean, ko.name);
    if (!dk) continue;
    if (!uniqueMap.has(dk)) {
      uniqueMap.set(dk, {
        key: dk,
        name: ko.name ?? null,
        korean: ko.korean ?? null,
        occurrences: 0,
        sampleBookIds: [],
        dexCategory: ko.dexCategory ?? null,
      });
    }
    const entry = uniqueMap.get(dk);
    entry.occurrences += 1;
    if (entry.sampleBookIds.length < 3 && !entry.sampleBookIds.includes(book.id)) {
      entry.sampleBookIds.push(book.id);
    }
    // 이미 dexCategory 가 있는 책 발견 시 entry 에 반영 (기존 분류 보존)
    if (!entry.dexCategory && ko.dexCategory) entry.dexCategory = ko.dexCategory;
  }
}

const unique = Array.from(uniqueMap.values()).sort((a, b) => {
  // 미분류 먼저, 그 다음 occurrences 내림차순
  const aClass = a.dexCategory ? 1 : 0;
  const bClass = b.dexCategory ? 1 : 0;
  if (aClass !== bClass) return aClass - bClass;
  return b.occurrences - a.occurrences;
});

const totalBooks = Object.keys(byBook).length;
const totalUnique = unique.length;
const unclassified = unique.filter((u) => !u.dexCategory).length;

const outDir = path.join(__dirname, '..', '..', '..', 'docs');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'key-object-dex-extraction.json');
fs.writeFileSync(
  outPath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      stats: {
        totalBooksScanned: keys.length,
        booksWithKeyObjects: totalBooks,
        phonicsSkipped,
        levelVariantSkipped,
        noKeyObjectSkipped,
        uniqueWords: totalUnique,
        unclassified,
        alreadyClassified: totalUnique - unclassified,
      },
      unique,
      byBook,
    },
    null,
    2
  ),
  'utf-8'
);

console.log(`\n총 책: ${keys.length}`);
console.log(`  파닉스 제외: ${phonicsSkipped}`);
console.log(`  레벨 variant 제외: ${levelVariantSkipped}`);
console.log(`  KeyObject 없는 책: ${noKeyObjectSkipped}`);
console.log(`  유효 동화책: ${totalBooks}`);
console.log(`unique 단어: ${totalUnique}`);
console.log(`  미분류: ${unclassified}`);
console.log(`  이미 분류됨: ${totalUnique - unclassified}`);
console.log(`\n출력: ${outPath}`);
