#!/usr/bin/env node
// YouTube 업로드 끝난 audiobook/longform mp4 정리.
// dry-run (default) → list 만 출력. --apply → 실삭제 + storybook doc 갱신.

import { S3Client, ListObjectsV2Command, DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

const APPLY = process.argv.includes('--apply');
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const publicUrl = process.env.R2_PUBLIC_URL;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket || !publicUrl) {
  console.error('R2 env vars 누락');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

function urlToKey(url) {
  return url.replace(`${publicUrl}/`, '');
}

function fmt(b) {
  const u = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let n = b;
  while (n >= 1024 && i < u.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(2)} ${u[i]}`;
}

console.log(`Mode: ${APPLY ? 'APPLY (실삭제)' : 'DRY-RUN (목록만)'}`);
console.log('=========================================\n');

// 1) storybook-*.json 목록
console.log('[1/3] storybook list 가져오는 중...');
const sbObjects = [];
let token;
do {
  const r = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token }));
  if (r.Contents) sbObjects.push(...r.Contents.filter(o => o.Key?.endsWith('.json')));
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  ${sbObjects.length} storybook docs\n`);

// 2) 각 storybook 에서 YouTube 업로드 끝난 audiobook/longform 의 outputUrl 추출
console.log('[2/3] YouTube 업로드된 mp4 찾는 중...');
const candidates = [];

const CONCURRENCY = 30;
for (let i = 0; i < sbObjects.length; i += CONCURRENCY) {
  const batch = sbObjects.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(async (obj) => {
    try {
      const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: obj.Key }));
      const text = await r.Body?.transformToString();
      if (!text) return;
      const sb = JSON.parse(text);

      const projects = [
        ...(sb.audiobookProjects ?? []).map(p => ({ kind: 'audiobook', p })),
        ...(sb.longformProjects ?? []).map(p => ({ kind: 'longform', p })),
      ];

      for (const { kind, p } of projects) {
        if (p?.youtubeUpload?.videoId && p?.outputUrl?.startsWith(publicUrl)) {
          const key = urlToKey(p.outputUrl);
          candidates.push({
            sbId: sb.id,
            sbTitle: sb.title,
            sbKey: obj.Key,
            kind,
            projectId: p.id,
            videoId: p.youtubeUpload.videoId,
            r2Key: key,
          });
        }
      }
    } catch (e) {
      console.warn(`  skip ${obj.Key}: ${e.message}`);
    }
  }));
  if ((i + CONCURRENCY) % 300 === 0 || i + CONCURRENCY >= sbObjects.length) {
    process.stdout.write(`\r  ... ${Math.min(i + CONCURRENCY, sbObjects.length)} / ${sbObjects.length}`);
  }
}
console.log(`\n  ${candidates.length} YouTube 업로드된 mp4 발견\n`);

if (candidates.length === 0) {
  console.log('정리할 항목 없음. 종료.');
  process.exit(0);
}

// 3) 각 R2 객체 size 확인 + 표시
console.log('[3/3] R2 객체 size 확인 중...');
const sized = [];
let totalBytes = 0;
let missing = 0;
for (let i = 0; i < candidates.length; i += CONCURRENCY) {
  const batch = candidates.slice(i, i + CONCURRENCY);
  await Promise.all(batch.map(async (c) => {
    try {
      const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: c.r2Key }));
      const size = Number(r.ContentLength) || 0;
      r.Body?.destroy?.();
      sized.push({ ...c, size });
      totalBytes += size;
    } catch {
      sized.push({ ...c, size: 0, missing: true });
      missing++;
    }
  }));
}
console.log(`  ${sized.length - missing} 객체 (${fmt(totalBytes)}), ${missing}개는 R2 에 없음 (이미 지워짐)\n`);

// 결과 리스트
console.log('=========================================');
console.log('정리 후보 (top 30):');
console.log('=========================================');
sized.sort((a, b) => b.size - a.size);
for (const c of sized.slice(0, 30)) {
  const tag = c.missing ? '(없음)' : fmt(c.size).padStart(10);
  console.log(`  ${tag} ${c.kind.padEnd(9)} ${c.sbTitle.slice(0, 40).padEnd(42)} → YT:${c.videoId}`);
}
if (sized.length > 30) console.log(`  ... 외 ${sized.length - 30}개`);

console.log('\n=========================================');
console.log(`총 ${sized.length} 영상 / ${fmt(totalBytes)} 회수 가능`);
console.log('=========================================\n');

if (!APPLY) {
  console.log('실삭제 하려면: node ' + path.basename(process.argv[1]) + ' --apply');
  process.exit(0);
}

// APPLY 모드 — 실삭제
console.log('[APPLY] R2 객체 + storybook doc 갱신 중...\n');

// storybook 별로 그룹핑 (한 책에 여러 mp4 있을 수 있어 1번만 save)
const bySbId = new Map();
for (const c of sized) {
  if (!bySbId.has(c.sbId)) bySbId.set(c.sbId, []);
  bySbId.get(c.sbId).push(c);
}

let r2Deleted = 0;
let docsUpdated = 0;
let errors = 0;

for (const [sbId, items] of bySbId) {
  // 1) storybook doc fetch
  const sbKey = items[0].sbKey;
  let sb;
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: sbKey }));
    sb = JSON.parse(await r.Body.transformToString());
  } catch (e) {
    console.warn(`  [${sbId}] doc fetch 실패: ${e.message}`);
    errors++;
    continue;
  }

  // 2) 각 mp4 R2 삭제 + project.outputUrl 비우기
  for (const c of items) {
    if (!c.missing) {
      try {
        await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: c.r2Key }));
        r2Deleted++;
      } catch (e) {
        console.warn(`  [${c.r2Key}] R2 삭제 실패: ${e.message}`);
        errors++;
        continue;
      }
    }
    const arr = c.kind === 'audiobook' ? sb.audiobookProjects : sb.longformProjects;
    const proj = arr?.find(p => p.id === c.projectId);
    if (proj) proj.outputUrl = undefined;
  }

  // 3) doc 저장
  try {
    sb.updatedAt = new Date().toISOString();
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: sbKey,
      Body: JSON.stringify(sb),
      ContentType: 'application/json',
    }));
    docsUpdated++;
    process.stdout.write(`\r  ${docsUpdated} / ${bySbId.size} books, ${r2Deleted} mp4 deleted`);
  } catch (e) {
    console.warn(`\n  [${sbId}] doc 저장 실패: ${e.message}`);
    errors++;
  }
}

console.log(`\n\n완료: ${docsUpdated} 책 업데이트, ${r2Deleted} mp4 삭제, ${errors} 에러`);
console.log(`회수: ${fmt(totalBytes)}`);
