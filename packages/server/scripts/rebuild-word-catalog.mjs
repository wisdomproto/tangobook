#!/usr/bin/env node
// 모든 storybook 책의 KeyObject 풀 → 단어 단위 카드 카탈로그 재생성.
// Phase 1 §5.2 정합 (2026-05-03). 책 단위 catalog 폐기 후 재생성.
//
// dedupe key 기반 단어 통합 (한 단어가 N권에 등장 → 카드 1장 + sourceBookIds N개).
// 카드 ID = 영어 단어 → `word-{lowercase}` (예: word-pumpkin). 한글만 → `word-ko-{korean}`.
// dexCategory 없는 KeyObject 는 카드 X.
//
// 사용:
//   node packages/server/scripts/rebuild-word-catalog.mjs           # dry-run
//   node packages/server/scripts/rebuild-word-catalog.mjs --apply   # R2 저장

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
  if (k) return `ko:${k}`;
  if (n && HAS_KOREAN.test(n)) return `ko:${n}`;
  if (n) return `en:${n.toLowerCase()}`;
  return null;
}

/** 단어 카드 ID 생성 — 영어 우선, 한글이면 ko 접두 */
function buildCardId(name, korean) {
  const n = (name ?? '').trim();
  if (n && !HAS_KOREAN.test(n)) {
    const slug = n.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-');
    if (slug) return `word-${slug}`;
  }
  const ko = (korean ?? n ?? '').trim();
  if (ko) return `word-ko-${ko.replace(/\s+/g, '-')}`;
  return null;
}

function pickKoreanLabel(ko, name) {
  const k = (ko ?? '').trim();
  if (k) return k;
  if (name && HAS_KOREAN.test(name)) return name;
  return null;
}

function pickEnglishLabel(nameEn, name) {
  const e = (nameEn ?? '').trim();
  if (e) return e;
  if (name && !HAS_KOREAN.test(name)) return name;
  return null;
}

const keys = await listStorybookKeys();
console.log(`총 ${keys.length} 책 스캔`);

// keyObject 단위 풀링 — dedupe key 별로 통합
const cardMap = new Map(); // dedupeKey → card draft
let phonicsSkipped = 0;
let levelVariantSkipped = 0;
let noKeyObjectSkipped = 0;
let keyObjectsTotal = 0;
let keyObjectsNoDexCategory = 0;
let keyObjectsNoId = 0;

for (const key of keys) {
  let book;
  try {
    book = await loadBook(key);
  } catch (e) {
    console.warn(`load 실패 ${key}: ${e.message}`);
    continue;
  }

  if (book.type === 'phonics' || book.phonicsLanguage) {
    phonicsSkipped++;
    continue;
  }
  if (typeof book.id === 'string' && /__L\d/.test(book.id)) {
    levelVariantSkipped++;
    continue;
  }
  if (book.isPublic === false) {
    // 비공개는 skip — 단, 사용자가 발행 후 자동 합류 가능 (Phase C-2 훅)
    continue;
  }

  const kos = Array.isArray(book.key_objects) ? book.key_objects : [];
  if (kos.length === 0) {
    noKeyObjectSkipped++;
    continue;
  }

  const pages = Array.isArray(book.pages) ? book.pages : [];
  const pageById = new Map(); // page_number → page obj
  for (const p of pages) pageById.set(p.pageNumber ?? p.page_number, p);

  // defaultStyle 우선 — 사용자가 지정한 대표 그림체 페이지 일러스트 사용
  const targetStyle = book.defaultStyle ?? book.artStyle;
  const defaultStylePageIllustrations = targetStyle
    ? book.styleAssets?.[targetStyle]?.pageIllustrations
    : null;

  for (const ko of kos) {
    keyObjectsTotal++;
    if (!ko.dexCategory) {
      keyObjectsNoDexCategory++;
      continue;
    }
    const dk = dedupeKey(ko.korean, ko.name);
    if (!dk) {
      keyObjectsNoId++;
      continue;
    }

    const cardId = buildCardId(ko.name, ko.korean);
    if (!cardId) {
      keyObjectsNoId++;
      continue;
    }

    // 첫 등장 페이지 illustration — defaultStyle 우선 → top-level page fallback
    const firstPageNum = Array.isArray(ko.pages) && ko.pages.length > 0 ? ko.pages[0] : null;
    const styleUrl =
      firstPageNum != null
        ? defaultStylePageIllustrations?.[firstPageNum]?.illustrationUrl
        : null;
    const firstPage = firstPageNum != null ? pageById.get(firstPageNum) : null;
    const pageImageUrl = styleUrl ?? firstPage?.illustrationUrl ?? null;

    if (!cardMap.has(dk)) {
      const nameKo = pickKoreanLabel(ko.korean, ko.name);
      const nameEn = pickEnglishLabel(ko.nameEn, ko.name);
      cardMap.set(dk, {
        id: cardId,
        category: ko.dexCategory,
        nameKo: nameKo ?? cardId.replace(/^word-(ko-)?/, ''),
        nameEn,
        imageUrl: pageImageUrl ?? book.coverImage ?? null,
        sourceBookIds: [book.id],
        example: ko.example ?? null,
        rarity: 'common',
        createdAt: new Date().toISOString(),
        // 메타 — 사용자가 dexCategory 변경 가능 (Phase E editor UI)
      });
    } else {
      const card = cardMap.get(dk);
      if (!card.sourceBookIds.includes(book.id)) card.sourceBookIds.push(book.id);
      // imageUrl 비어있고 새 책에 그림 있으면 채움
      if (!card.imageUrl && pageImageUrl) card.imageUrl = pageImageUrl;
      // example 비어있고 새 책에 있으면 채움
      if (!card.example && ko.example) card.example = ko.example;
      // dexCategory 충돌 시 첫 등장 우선 (사용자가 editor 에서 수정 가능)
    }
  }
}

const items = Array.from(cardMap.values()).filter((c) => c.imageUrl); // imageUrl 없는 카드 제외

const catalog = {
  version: 2,
  updatedAt: new Date().toISOString(),
  items,
};

const byCategory = {};
for (const item of items) byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;

console.log(`\n총 KeyObject: ${keyObjectsTotal}`);
console.log(`  dexCategory 없음 (skip): ${keyObjectsNoDexCategory}`);
console.log(`  ID 생성 실패: ${keyObjectsNoId}`);
console.log(`  파닉스 책 skip: ${phonicsSkipped}`);
console.log(`  레벨 variant skip: ${levelVariantSkipped}`);
console.log(`  KeyObject 없는 책: ${noKeyObjectSkipped}`);
console.log(`\n생성된 카드: ${items.length}장`);
console.log('카테고리별 카드:');
for (const [cat, n] of Object.entries(byCategory)) console.log(`  ${cat}: ${n}`);

// 카드별 sourceBookIds 통계
const bookCounts = items.map((c) => c.sourceBookIds.length).sort((a, b) => b - a);
console.log(`\nsourceBookIds 통계: 최대 ${bookCounts[0]}권, 평균 ${(bookCounts.reduce((a, b) => a + b, 0) / bookCounts.length).toFixed(1)}권`);

if (APPLY) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: 'collection-catalog.json',
      Body: JSON.stringify(catalog),
      ContentType: 'application/json',
    })
  );
  console.log(`\n✓ R2 저장 완료: collection-catalog.json (${items.length} 카드)`);
} else {
  // dry-run: 결과 docs/ 에 dump
  const outPath = path.join(__dirname, '..', '..', '..', 'docs', 'collection-catalog-preview.json');
  fs.writeFileSync(outPath, JSON.stringify(catalog, null, 2), 'utf-8');
  console.log(`\n(dry-run — preview 출력: ${outPath})`);
}
