#!/usr/bin/env node
/**
 * mp3 로 바꾼 뒤 **아무도 안 쓰는 wav** 를 지운다.
 *
 * 🔴 지우기 전에 **참조를 전수 확인**한다 — 버킷 안 모든 JSON(책·인덱스·설정)을 읽어
 *    거기 적힌 wav 를 모으고, 그 목록에 **없는 것만** 지운다. 파닉스 라이브러리 원본처럼
 *    아직 wav 로 쓰이는 게 섞여 있으면 앱이 통째로 조용해진다.
 *
 * 🔴 되돌릴 수 없다. 기본은 dry-run 이고, `--apply` 를 줘야 실제로 지운다.
 *
 * 사용:
 *   node packages/server/scripts/delete-orphan-wav.mjs           # 무엇이 지워질지만
 *   node packages/server/scripts/delete-orphan-wav.mjs --apply
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
import { loadEnv, parseArgs } from './translation-core.mjs';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
loadEnv();

const BUCKET = process.env.R2_BUCKET_NAME;
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

async function listAll() {
  const out = [];
  let token;
  do {
    const res = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, ContinuationToken: token })
    );
    out.push(...(res.Contents ?? []));
    token = res.IsTruncated ? res.NextContinuationToken : undefined;
  } while (token);
  return out;
}

const all = await listAll();
const wavs = all.filter((o) => /\.wav$/i.test(o.Key));
const jsons = all.filter((o) => /\.json$/i.test(o.Key));
console.log(`객체 ${all.length}개 · wav ${wavs.length}개 · json ${jsons.length}개\n`);

/** 모든 JSON 을 읽어 거기 적힌 wav 키를 모은다(URL 이든 경로든 파일명 기준으로). */
const referenced = new Set();
let scanned = 0;
for (const obj of jsons) {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: obj.Key }));
    const text = await res.Body.transformToString('utf-8');
    for (const m of text.matchAll(/[^"'\s]+\.wav/gi)) {
      // URL·경로 어느 형태든 **파일명**으로 맞춘다(도메인·인코딩 차이를 타지 않게).
      referenced.add(decodeURIComponent(m[0].split('/').pop()).toLowerCase());
    }
  } catch {
    /* 개별 실패는 건너뛴다 — 참조를 못 읽었으면 그 파일은 지우지 않는 쪽이 안전하다 */
  }
  if (++scanned % 100 === 0) console.log(`  json ${scanned}/${jsons.length} 스캔`);
}
console.log(`\nJSON 이 참조하는 wav 파일명 ${referenced.size}개`);

const orphans = wavs.filter(
  (o) => !referenced.has(decodeURIComponent(o.Key.split('/').pop()).toLowerCase())
);
const keep = wavs.length - orphans.length;
const mb = orphans.reduce((s, o) => s + (o.Size ?? 0), 0) / 1048576;
console.log(`삭제 대상 ${orphans.length}개 · ${mb.toFixed(0)}MB · 참조되어 남기는 것 ${keep}개\n`);
console.log('샘플:');
orphans.slice(0, 10).forEach((o) => console.log(`  ${o.Key}`));

if (!APPLY) {
  console.log('\n(dry-run — 실제로 지우려면 --apply)');
  process.exit(0);
}

for (let i = 0; i < orphans.length; i += 1000) {
  const batch = orphans.slice(i, i + 1000);
  await s3.send(
    new DeleteObjectsCommand({
      Bucket: BUCKET,
      Delete: { Objects: batch.map((o) => ({ Key: o.Key })), Quiet: true },
    })
  );
  console.log(`  삭제 ${Math.min(i + 1000, orphans.length)}/${orphans.length}`);
}
console.log(`\n✅ ${orphans.length}개 삭제 · ${mb.toFixed(0)}MB 회수`);
