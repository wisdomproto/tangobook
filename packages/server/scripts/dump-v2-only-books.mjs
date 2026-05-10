#!/usr/bin/env node
/**
 * v2 manifest 만 있고 v1 storybook (`storybook-{id}.json`) 이 없는 "v2-only" 책 진단.
 *
 * 배경:
 *   4-25~26 v2 시도 시 일부 책이 v2 manifest 로만 만들어짐. v1 폐기 후 라이브러리는
 *   v1 단일화 됐고, 이 v2-only 책들은 노출 X (사용자 보기엔 사라진 상태).
 *
 * 출력: packages/server/scripts/_data/v2-only-books.json
 *   [{ id, title, category, manifestKey, hasPages, pageCount, hasCover, hasArtStyle, ...}, ...]
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
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

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

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

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch (e) {
    if (e?.name === 'NotFound' || e?.$metadata?.httpStatusCode === 404) return false;
    throw e;
  }
}

console.log('[1/3] v2 manifest list (books/*/manifest.json)...');
const manifestKeys = [];
let token;
do {
  const r = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'books/', ContinuationToken: token })
  );
  if (r.Contents) {
    for (const o of r.Contents) {
      if (o.Key?.endsWith('/manifest.json')) manifestKeys.push(o.Key);
    }
  }
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  ${manifestKeys.length} v2 manifests`);

console.log('\n[2/3] 각 manifest 의 v1 존재 여부 확인...');
const v2Only = [];
let i = 0;
const CONCURRENCY = 20;
async function worker() {
  while (i < manifestKeys.length) {
    const idx = i++;
    const mkey = manifestKeys[idx];
    const m = await getJson(mkey);
    if (!m?.id) continue;
    const v1Exists = await exists(`storybook-${m.id}.json`);
    if (v1Exists) continue;
    v2Only.push({
      id: m.id,
      title: m.title || '',
      category: m.category || '',
      manifestKey: mkey,
      hasPages: Array.isArray(m.pages) && m.pages.length > 0,
      pageCount: m.pages?.length ?? 0,
      hasCover: !!(m.coverImage || m.coverImageUrl),
      hasArtStyle: !!m.artStyle,
      artStyle: m.artStyle || null,
      hasCurriculumMeta: !!m.curriculumMeta && Object.keys(m.curriculumMeta).length > 0,
      hasKeyObjects: Array.isArray(m.keyObjects) && m.keyObjects.length > 0,
      keyObjectCount: m.keyObjects?.length ?? 0,
      hasEducationalContent: !!m.educationalContent,
      isPublic: m.isPublic !== false,
      createdAt: m.createdAt || null,
      updatedAt: m.updatedAt || null,
    });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

v2Only.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'ko'));

console.log(`  v2-only: ${v2Only.length} 권`);

console.log('\n[3/3] dump 저장...');
const outDir = path.join(__dirname, '_data');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'v2-only-books.json');
fs.writeFileSync(outPath, JSON.stringify(v2Only, null, 2), 'utf-8');
console.log(`  ${outPath}`);

console.log('\n=== 요약 ===');
console.log('총:', v2Only.length, '권');
console.log('hasPages:', v2Only.filter((b) => b.hasPages).length);
console.log('hasCover:', v2Only.filter((b) => b.hasCover).length);
console.log('hasArtStyle:', v2Only.filter((b) => b.hasArtStyle).length);
console.log('hasKeyObjects:', v2Only.filter((b) => b.hasKeyObjects).length);
console.log('hasCurriculumMeta:', v2Only.filter((b) => b.hasCurriculumMeta).length);
console.log('isPublic:', v2Only.filter((b) => b.isPublic).length);

console.log('\n=== 책 list ===');
for (const b of v2Only) {
  console.log(
    `  ${b.id} | ${b.category || '(none)'} | ${b.title} | pages=${b.pageCount} cover=${b.hasCover ? 'Y' : 'N'} ko=${b.hasKeyObjects ? `Y(${b.keyObjectCount})` : 'N'} curm=${b.hasCurriculumMeta ? 'Y' : 'N'} pub=${b.isPublic ? 'Y' : 'N'}`
  );
}
