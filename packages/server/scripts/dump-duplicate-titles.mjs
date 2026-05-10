#!/usr/bin/env node
/**
 * 같은 title 을 가진 동화책 중복 진단.
 *
 * 출력: packages/server/scripts/_data/duplicate-titles.json
 *   [{ title, count, books: [{ id, isVariant, baseId, pageCount, keyObjectCount, characterCount, hasCover, isPublic, createdAt, updatedAt }, ...] }, ...]
 *
 * variant id (`*__L1`/`*__L2`/`*__L3`) 는 별도 fork 가 아니라 같은 base 의 reading-level 변형이므로
 * 같은 baseId 끼리는 중복으로 보지 않음. 분석 결과에 isVariant + baseId 표시.
 */
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

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;

const VARIANT_RE = /^(.+?)__L(\d+)$/;

function parseId(id) {
  const m = VARIANT_RE.exec(id);
  if (m) return { isVariant: true, baseId: m[1], level: Number(m[2]) };
  return { isVariant: false, baseId: id, level: null };
}

async function getJson(key) {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const text = await r.Body.transformToString('utf-8');
    return JSON.parse(text);
  } catch (e) {
    if (e?.name === 'NoSuchKey' || e?.$metadata?.httpStatusCode === 404) return null;
    throw e;
  }
}

console.log('[1/3] storybook-*.json 목록 수집...');
const keys = [];
let token;
do {
  const r = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'storybook-',
      ContinuationToken: token,
    })
  );
  if (r.Contents) {
    for (const o of r.Contents) {
      if (o.Key?.endsWith('.json')) keys.push(o.Key);
    }
  }
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  ${keys.length} files`);

console.log('\n[2/3] 각 storybook 메타 추출...');
const books = [];
let i = 0;
const CONCURRENCY = 30;
async function worker() {
  while (i < keys.length) {
    const idx = i++;
    const sb = await getJson(keys[idx]);
    if (!sb?.id) continue;
    const { isVariant, baseId, level } = parseId(sb.id);
    books.push({
      id: sb.id,
      title: sb.title || '',
      isVariant,
      baseId,
      level,
      type: sb.type || 'storybook',
      pageCount: Array.isArray(sb.pages) ? sb.pages.length : 0,
      keyObjectCount: Array.isArray(sb.key_objects) ? sb.key_objects.length : 0,
      characterCount: Array.isArray(sb.characters) ? sb.characters.length : 0,
      hasCover: !!sb.coverImage,
      isPublic: sb.isPublic !== false,
      category: sb.category || '',
      createdAt: sb.createdAt || '',
      updatedAt: sb.updatedAt || '',
    });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
console.log(`  ${books.length} loaded`);

// storybook 만 분석 대상 (phonics 제외)
const storybooks = books.filter((b) => b.type === 'storybook');
console.log(`  ${storybooks.length} storybook (phonics 제외)`);

console.log('\n[3/3] title 별 그룹화...');
// title 정확히 같은 것끼리 그룹 (trim + lowercase X — 사용자가 의도적으로 다르게 만들었을 수도)
// 단, variant 끼리는 (같은 baseId) 같은 그룹 내에서도 동일 base 로 표시
const byTitle = new Map();
for (const b of storybooks) {
  if (!b.title) continue;
  const key = b.title.trim();
  if (!byTitle.has(key)) byTitle.set(key, []);
  byTitle.get(key).push(b);
}

const groups = [];
for (const [title, list] of byTitle.entries()) {
  if (list.length < 2) continue;
  // baseId 별 sub-group — 같은 base 의 variant 끼리는 의도된 중복이므로 1 fork 로 셈
  const byBase = new Map();
  for (const b of list) {
    if (!byBase.has(b.baseId)) byBase.set(b.baseId, []);
    byBase.get(b.baseId).push(b);
  }
  if (byBase.size < 2) continue; // 같은 baseId 의 variant 만 있는 경우 → 중복 아님
  groups.push({
    title,
    count: byBase.size, // base 기준 카운트
    totalEntries: list.length, // variant 포함
    books: list.sort((a, b) => {
      // baseId 별 묶고, base(non-variant) 먼저, 그 다음 level asc
      if (a.baseId !== b.baseId) return a.baseId.localeCompare(b.baseId);
      if (a.isVariant !== b.isVariant) return a.isVariant ? 1 : -1;
      return (a.level ?? 0) - (b.level ?? 0);
    }),
  });
}
groups.sort((a, b) => b.count - a.count || a.title.localeCompare(b.title, 'ko'));

const outDir = path.join(__dirname, '_data');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'duplicate-titles.json');
fs.writeFileSync(outPath, JSON.stringify(groups, null, 2), 'utf-8');
console.log(`  → ${outPath}`);

console.log('\n=== 요약 ===');
console.log('중복 title 그룹:', groups.length);
console.log('영향 받는 책:', groups.reduce((s, g) => s + g.totalEntries, 0));

console.log('\n=== 중복 그룹 list (상위 30) ===');
for (const g of groups.slice(0, 30)) {
  console.log(`\n  [${g.count} fork × variants ${g.totalEntries}] "${g.title}"`);
  // baseId 별 콘텐츠 metric — base 와 같은 base 의 variant 모두 묶어 표시 가능하나 우선 flat
  for (const b of g.books) {
    const tag = b.isVariant ? `  └─ variant L${b.level}` : 'BASE';
    const flags = [
      b.isPublic ? 'pub' : 'priv',
      b.hasCover ? 'cover' : 'no-cover',
    ].join(',');
    console.log(
      `    ${tag.padEnd(18)} ${b.id.padEnd(36)} pages=${String(b.pageCount).padStart(2)} ko=${String(b.keyObjectCount).padStart(2)} chars=${String(b.characterCount).padStart(2)} cat=${b.category} ${flags} created=${b.createdAt.slice(0, 10)}`
    );
  }
}
if (groups.length > 30) console.log(`\n... +${groups.length - 30} more groups (전체는 dump 파일 참조)`);
