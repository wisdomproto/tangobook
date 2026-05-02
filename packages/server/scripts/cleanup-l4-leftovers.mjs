#!/usr/bin/env node
// __L4 잔존 storybook doc 정리.
// 배경: 4-30 ReadingLevel 4단계→3단계 통합 (memory/reading-level-3tier.md) 시
// readingLevel 만 L3 로 변환하고 sibling id `__L4` suffix doc 은 그대로 두었음.
// 일부는 빈 껍데기 (pages.length=0, isPublic=false) — 안전하게 정리 가능.
// 컨텐츠 있는 L4 (pages>0 또는 isPublic=true) 는 보존.
//
// dry-run (default) → 후보 목록 출력. --apply → 실삭제.

import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
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

const APPLY = process.argv.includes('--apply');
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 env vars 누락');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

console.log(`Mode: ${APPLY ? 'APPLY (실삭제)' : 'DRY-RUN (목록만)'}`);
console.log('=========================================\n');

// 1) storybook-*.json 목록
console.log('[1/3] storybook list 가져오는 중...');
const sbObjects = [];
let token;
do {
  const r = await s3.send(
    new ListObjectsV2Command({
      Bucket: bucket,
      Prefix: 'storybook-',
      ContinuationToken: token,
    })
  );
  if (r.Contents) sbObjects.push(...r.Contents.filter((o) => o.Key?.endsWith('.json')));
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  전체 ${sbObjects.length} storybook docs\n`);

// 2) __L4 suffix 만 필터 + 본문 fetch 후 안전 조건 검증
console.log('[2/3] __L4 잔존 doc 검사 중...');
const l4Objects = sbObjects.filter((o) => o.Key && /__L4\.json$/.test(o.Key));
console.log(`  __L4 suffix doc ${l4Objects.length}개 발견\n`);

const candidates = []; // { key, id, title, pages, isPublic, hasContent }
const skipped = [];

const CONCURRENCY = 30;
for (let i = 0; i < l4Objects.length; i += CONCURRENCY) {
  const batch = l4Objects.slice(i, i + CONCURRENCY);
  await Promise.all(
    batch.map(async (obj) => {
      try {
        const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: obj.Key }));
        const text = await r.Body?.transformToString();
        if (!text) return;
        const sb = JSON.parse(text);

        const pages = sb.pages?.length ?? 0;
        const characters = sb.characters?.length ?? 0;
        const keyObjs = sb.key_objects?.length ?? 0;
        const isPublic = !!sb.isPublic;
        const hasContent = pages > 0 || isPublic;

        const info = {
          key: obj.Key,
          id: sb.id,
          title: sb.title || '(no title)',
          pages,
          characters,
          keyObjs,
          isPublic,
          coverImage: !!sb.coverImage,
        };

        if (hasContent) {
          // 컨텐츠 있음 — 보존
          skipped.push(info);
        } else {
          candidates.push(info);
        }
      } catch (e) {
        console.warn(`  skip ${obj.Key}: ${e.message}`);
      }
    })
  );
}

console.log(`  삭제 후보: ${candidates.length}개 (pages=0 + isPublic=false)`);
console.log(`  보존: ${skipped.length}개 (pages>0 또는 isPublic=true)\n`);

if (skipped.length > 0) {
  console.log('=========================================');
  console.log('보존 (수동 검토 필요):');
  console.log('=========================================');
  skipped.forEach((s) => {
    console.log(
      `  ${s.id.padEnd(28)} | pages=${String(s.pages).padStart(3)} | public=${s.isPublic ? 'Y' : 'N'} | chars=${s.characters} | ${s.title}`
    );
  });
  console.log('');
}

if (candidates.length === 0) {
  console.log('정리할 항목 없음. 종료.');
  process.exit(0);
}

console.log('=========================================');
console.log('삭제 후보 (빈 껍데기):');
console.log('=========================================');
candidates.forEach((c) => {
  console.log(`  ${c.id.padEnd(28)} | ${c.title}`);
});
console.log('');

console.log('=========================================');
console.log(`총 ${candidates.length}개 삭제 예정`);
console.log('=========================================\n');

if (!APPLY) {
  console.log(`실삭제 하려면: node ${path.basename(process.argv[1])} --apply`);
  console.log('주의: 서버 listStorybooks 캐시 (TTL 5분) 자동 만료 또는 서버 재시작 필요');
  process.exit(0);
}

// APPLY 모드 — 실삭제
console.log('[3/3] R2 doc 삭제 중...');
let deleted = 0;
let errors = 0;

for (const c of candidates) {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: c.key }));
    deleted++;
    process.stdout.write(`\r  ${deleted}/${candidates.length} 삭제 완료`);
  } catch (e) {
    console.warn(`\n  [${c.id}] 삭제 실패: ${e.message}`);
    errors++;
  }
}

console.log('\n');
console.log('=========================================');
console.log(`완료: ${deleted} 삭제, ${errors} 오류`);
console.log('=========================================');
console.log('서버 listStorybooks 캐시는 5분 후 자동 갱신됩니다.');
console.log('즉시 반영하려면 서버 재시작.');
