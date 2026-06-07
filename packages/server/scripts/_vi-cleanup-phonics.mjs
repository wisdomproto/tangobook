#!/usr/bin/env node
// 잘못 생성된 파닉스 vi 번역 JSON 삭제 (translate-extract --category=all 가 type 무관하게 쓸어담은 것 정리).
// R2 에서 type==='phonics' id 수집 → _data/translations/vi/<id>.json 존재 시 삭제.
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
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

const keys = [];
let token;
do {
  const out = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  for (const o of out.Contents ?? []) if (o.Key.endsWith('.json')) keys.push(o.Key);
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

const phonicsIds = new Set();
let i = 0;
async function worker() {
  while (i < keys.length) {
    const k = keys[i++];
    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: k }));
      const sb = JSON.parse(await out.Body.transformToString('utf-8'));
      if (sb.type === 'phonics' && sb.id) phonicsIds.add(String(sb.id));
    } catch {}
  }
}
await Promise.all(Array.from({ length: 16 }, worker));

const dir = path.join(__dirname, '_data', 'translations', 'vi');
const files = fs.readdirSync(dir).filter((f) => f.endsWith('.json'));
let del = 0;
for (const f of files) {
  const id = f.replace(/\.json$/, '');
  if (phonicsIds.has(id)) {
    fs.unlinkSync(path.join(dir, f));
    del++;
  }
}
console.log(`R2 phonics ${phonicsIds.size}권 | vi 폴더 ${files.length}개 → 파닉스 삭제 ${del} | 잔여 ${files.length - del}`);
