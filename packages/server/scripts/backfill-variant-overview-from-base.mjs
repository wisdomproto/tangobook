#!/usr/bin/env node
/**
 * Level variant (`{base}__L1` / `{base}__L2` / `{base}__L4`) 의 parentGuide.overview 를
 * base storybook 의 overview 에서 복사한다.
 *
 * 배경: 84권 base 책에 overview 작성 + R2 적용 후, level variant 들은 base 와 같은 줄거리
 * 인데 별도 storybook-*.json 에 overview 가 비어 있어 부모 가이드가 안 보임.
 *
 * - dry-run 기본. `--apply` 시 실제 PUT.
 * - base 가 R2 에 없거나 base 의 overview 도 비어있으면 해당 variant skip.
 * - 이미 variant 에 overview 있으면 skip (덮어쓰기 X).
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

async function putJson(key, data) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: 'application/json',
    })
  );
}

const dumpPath = path.join(__dirname, '_data', 'books-missing-overview.json');
const dump = JSON.parse(fs.readFileSync(dumpPath, 'utf-8'));
const variants = dump.filter((x) => x.id.includes('__L'));
console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'} | Level variants: ${variants.length}\n`);

const plan = []; // { id, base, action: 'patch' | 'skip-no-base' | 'skip-no-base-overview' | 'skip-already-has', overview? }

let idx = 0;
const CONCURRENCY = 10;
async function worker() {
  while (idx < variants.length) {
    const i = idx++;
    const v = variants[i];
    const baseId = v.id.split('__')[0];
    const variant = await getJson(`storybook-${v.id}.json`);
    if (variant?.parentGuide?.overview?.trim()) {
      plan.push({ id: v.id, base: baseId, action: 'skip-already-has' });
      continue;
    }
    const base = await getJson(`storybook-${baseId}.json`);
    if (!base) {
      plan.push({ id: v.id, base: baseId, action: 'skip-no-base' });
      continue;
    }
    const ov = base.parentGuide?.overview;
    if (!ov || !ov.trim()) {
      plan.push({ id: v.id, base: baseId, action: 'skip-no-base-overview' });
      continue;
    }
    plan.push({ id: v.id, base: baseId, action: 'patch', overview: ov, variant, title: v.title });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

const counts = plan.reduce((acc, p) => ((acc[p.action] = (acc[p.action] ?? 0) + 1), acc), {});
console.log('계획:', counts, '\n');

const toPatch = plan.filter((p) => p.action === 'patch');
console.log(`PATCH 대상: ${toPatch.length}권`);
for (const p of toPatch.slice(0, 10)) {
  console.log(`  - ${p.id} | ${p.title}`);
  console.log(`      base: ${p.base}`);
  console.log(`      ${p.overview.slice(0, 80)}...`);
}
if (toPatch.length > 10) console.log(`  ... +${toPatch.length - 10}권`);

const skipped = plan.filter((p) => p.action !== 'patch' && p.action !== 'skip-already-has');
if (skipped.length) {
  console.log(`\nSkip 사유 분석 (${skipped.length}권):`);
  for (const p of skipped.slice(0, 10)) {
    console.log(`  - ${p.id} | ${p.action}`);
  }
  if (skipped.length > 10) console.log(`  ... +${skipped.length - 10}권`);
}

if (!APPLY) {
  console.log('\n[DRY-RUN] --apply 추가 시 실제 PUT.');
  process.exit(0);
}

console.log('\n[APPLY] R2 PUT...');
let done = 0;
for (const p of toPatch) {
  const next = {
    ...p.variant,
    parentGuide: { ...(p.variant.parentGuide ?? {}), overview: p.overview },
    updatedAt: new Date().toISOString(),
  };
  await putJson(`storybook-${p.id}.json`, next);
  done++;
  if (done % 10 === 0) console.log(`  ${done}/${toPatch.length}`);
}
console.log(`\n완료: ${done}권 patched.`);
