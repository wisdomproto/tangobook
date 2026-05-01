#!/usr/bin/env node
// R2 prefix 별 크기 분포 분석 — 어디서 50GB가 차지되는지 진단

import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manual .env parser (dotenv 의존 X)
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

function fmt(bytes) {
  const u = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < u.length - 1) {
    n /= 1024;
    i++;
  }
  return `${n.toFixed(2)} ${u[i]}`;
}

function classifyPrefix(key) {
  // top-level prefix 분류
  if (key.startsWith('_backup/')) return '_backup/';
  if (key.startsWith('_migrations/')) return '_migrations/';
  if (key.startsWith('books/')) return 'books/ (v2 manifest tree)';
  if (key.startsWith('audiobooks/')) return 'audiobooks/';
  if (key.startsWith('longform/')) return 'longform/';
  if (key.startsWith('phonics-library/')) return 'phonics-library/';
  if (key.startsWith('vocabulary-units/')) return 'vocabulary-units/';
  if (key.startsWith('background-music/')) return 'background-music/';
  if (key.startsWith('hori/') || key.startsWith('mascot/')) return 'hori/mascot/';
  if (key.startsWith('strategy-samples/')) return 'strategy-samples/';
  if (key.startsWith('collection-')) return 'collection/';
  if (key.startsWith('youtube-')) return 'youtube/';
  if (key.startsWith('storybook-')) return 'storybook-*.json';
  if (/^\d{13}-/.test(key)) {
    // 1773xxxxxxxxx-... = top-level book asset (legacy 자산)
    if (key.endsWith('.webp') || key.endsWith('.png') || key.endsWith('.jpg') || key.endsWith('.jpeg'))
      return 'top-level images (legacy)';
    if (key.endsWith('.mp3') || key.endsWith('.wav')) return 'top-level audio (legacy)';
    if (key.endsWith('.mp4')) return 'top-level video (legacy)';
    return 'top-level misc (legacy)';
  }
  // unclassified — top-level prefix 추출
  const slash = key.indexOf('/');
  if (slash > 0) return `${key.slice(0, slash)}/`;
  return 'other (root)';
}

function classifyExt(key) {
  const m = key.match(/\.([a-z0-9]+)$/i);
  return m ? m[1].toLowerCase() : '(no-ext)';
}

const stats = new Map(); // prefix → { count, bytes }
const extStats = new Map(); // ext → { count, bytes }
let totalCount = 0;
let totalBytes = 0;
let continuationToken;
let pageCount = 0;

console.log('R2 listing 시작...\n');

const t0 = Date.now();
do {
  const result = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      ContinuationToken: continuationToken,
    })
  );
  pageCount++;
  if (result.Contents) {
    for (const obj of result.Contents) {
      const key = obj.Key;
      const size = obj.Size ?? 0;
      totalCount++;
      totalBytes += size;
      const prefix = classifyPrefix(key);
      const cur = stats.get(prefix) ?? { count: 0, bytes: 0 };
      cur.count++;
      cur.bytes += size;
      stats.set(prefix, cur);
      const ext = classifyExt(key);
      const ec = extStats.get(ext) ?? { count: 0, bytes: 0 };
      ec.count++;
      ec.bytes += size;
      extStats.set(ext, ec);
    }
  }
  continuationToken = result.IsTruncated ? result.NextContinuationToken : undefined;
  if (pageCount % 10 === 0) {
    process.stdout.write(`\r... ${pageCount} pages, ${totalCount} objects, ${fmt(totalBytes)}`);
  }
} while (continuationToken);

console.log(`\n\n완료: ${totalCount} 객체, ${fmt(totalBytes)} (${((Date.now() - t0) / 1000).toFixed(1)}s)\n`);

// Prefix 별 정렬 (bytes desc)
const sorted = [...stats.entries()].sort((a, b) => b[1].bytes - a[1].bytes);
console.log('━━━ Prefix 별 크기 (bytes desc) ━━━');
console.log('Prefix'.padEnd(40), 'Count'.padStart(10), 'Size'.padStart(15));
console.log('─'.repeat(70));
for (const [prefix, { count, bytes }] of sorted) {
  const pct = ((bytes / totalBytes) * 100).toFixed(1);
  console.log(prefix.padEnd(40), String(count).padStart(10), fmt(bytes).padStart(15), `${pct}%`);
}

console.log('\n━━━ 확장자 별 크기 (top 10) ━━━');
const sortedExt = [...extStats.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 10);
console.log('Ext'.padEnd(15), 'Count'.padStart(10), 'Size'.padStart(15));
console.log('─'.repeat(50));
for (const [ext, { count, bytes }] of sortedExt) {
  const pct = ((bytes / totalBytes) * 100).toFixed(1);
  console.log(ext.padEnd(15), String(count).padStart(10), fmt(bytes).padStart(15), `${pct}%`);
}

console.log(`\n총합: ${totalCount} 객체, ${fmt(totalBytes)}`);

// 추가 분석: storybooks/, books/ 의 sub-prefix + 큰 객체 top10
console.log('\n━━━ Top 30 큰 객체 ━━━');
const all = [];
let token2;
const refetch = async () => {
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token2 }));
    if (r.Contents) for (const o of r.Contents) all.push({ k: o.Key, s: o.Size ?? 0 });
    token2 = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token2);
};
await refetch();
all.sort((a, b) => b.s - a.s);
for (const o of all.slice(0, 30)) {
  console.log(fmt(o.s).padStart(12), o.k);
}

// storybooks/ 의 sub-prefix 합산
console.log('\n━━━ storybooks/ sub-prefix 합산 ━━━');
const subStats = new Map();
for (const o of all) {
  if (!o.k.startsWith('storybooks/')) continue;
  // storybooks/{bid}/{kind}/...
  const parts = o.k.split('/');
  const sub = parts.slice(0, 3).join('/') + '/';
  const cur = subStats.get(sub) ?? { count: 0, bytes: 0 };
  cur.count++;
  cur.bytes += o.s;
  subStats.set(sub, cur);
}
const topSub = [...subStats.entries()].sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 15);
for (const [sub, { count, bytes }] of topSub) {
  console.log(sub.padEnd(60), String(count).padStart(6), fmt(bytes).padStart(12));
}

// books/ 안의 kind 별
console.log('\n━━━ books/ sub-kind 분포 (audio/video/styles/games/...) ━━━');
const booksKind = new Map();
for (const o of all) {
  if (!o.k.startsWith('books/')) continue;
  const parts = o.k.split('/');
  const kind = parts[2] ?? '(root)';
  const cur = booksKind.get(kind) ?? { count: 0, bytes: 0 };
  cur.count++;
  cur.bytes += o.s;
  booksKind.set(kind, cur);
}
for (const [k, { count, bytes }] of [...booksKind.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(k.padEnd(20), String(count).padStart(6), fmt(bytes).padStart(12));
}
