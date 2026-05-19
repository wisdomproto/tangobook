#!/usr/bin/env node
/**
 * 파닉스 unit ID/title 0-padding 마이그.
 *
 * 문제: `kr-h1-u1`, `kr-h1-u10`, `kr-h1-u11`, ..., `kr-h1-u2` 알파벳 정렬 시 u1, u10, u11, ..., u15, u2 순.
 *      title 도 "unit 1", "unit 10" 식으로 같은 버그.
 *
 * 해결: 단자릿수 unit 번호만 0-pad.
 *   ID:    `kr-h1-u1` → `kr-h1-u01`,  `en-b3-u7` → `en-b3-u07`. `u10`+ 는 그대로.
 *   Title: "unit 1:" → "unit 01:",  "Unit 7:" → "Unit 07:". "unit 10:"+ 는 그대로.
 *
 * 동작:
 *   - 모든 phonics storybook 나열
 *   - 매칭되는 ID 만 처리 — 새 ID 로 PUT 후 옛 key DELETE
 *   - JSON 내 id 필드 + title 필드 동시 업데이트
 *
 * 사용:
 *   node scripts/migrate-phonics-unit-padding.mjs           # dry-run
 *   node scripts/migrate-phonics-unit-padding.mjs --apply   # 실 적용
 */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
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

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;

async function listStorybookKeys() {
  const keys = [];
  let token;
  do {
    const r = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
    );
    for (const o of r.Contents || []) keys.push(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return keys;
}

async function getJson(key) {
  const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await r.Body.transformToString('utf-8'));
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
async function deleteKey(key) {
  await s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
}

// kr-hN-uN  또는  en-bN-uN — 마지막 -u 뒤 단자릿수만 pad
const ID_REGEX = /^((?:kr-h|en-b)\d+-u)(\d)$/;
function padId(id) {
  const m = id.match(ID_REGEX);
  if (!m) return null;
  return `${m[1]}0${m[2]}`;
}

// "unit 7:" / "Unit 3:" 단자릿수 pad. lookbehind 로 "unit 10" 같은 더 큰 수 회피.
function padTitle(title) {
  return title.replace(/\b([Uu]nit)\s+(\d)\b(?!\d)/g, (_, u, n) => `${u} 0${n}`);
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN (변경 없음)'}\n`);

const keys = await listStorybookKeys();
console.log(`storybook-*.json 총 ${keys.length}개\n`);

const plan = [];
for (const key of keys) {
  const m = key.match(/^storybook-(.+)\.json$/);
  if (!m) continue;
  const oldId = m[1];
  const newId = padId(oldId);
  if (!newId) continue; // 매칭 안 되는 ID 는 skip
  plan.push({ oldId, newId, oldKey: key, newKey: `storybook-${newId}.json` });
}

console.log(`0-pad 대상: ${plan.length}권`);
for (const p of plan.slice(0, 5)) console.log(`  ${p.oldId} → ${p.newId}`);
if (plan.length > 5) console.log(`  ... (${plan.length - 5} more)`);
console.log();

if (!APPLY) {
  // dry-run: 처음 3건의 title 만 미리보기
  console.log('Title 변경 미리보기 (3건):');
  for (const p of plan.slice(0, 3)) {
    try {
      const sb = await getJson(p.oldKey);
      const newTitle = padTitle(sb.title || '');
      console.log(`  [${p.oldId}]`);
      console.log(`    "${sb.title}"`);
      console.log(`    → "${newTitle}"`);
    } catch (e) {
      console.log(`  [${p.oldId}] (preview 실패: ${e.message})`);
    }
  }
  console.log(`\n👀 DRY-RUN 종료. 실 적용은 \`--apply\` 플래그.`);
  process.exit(0);
}

console.log(`\n✏️  실 적용 시작...`);
let ok = 0;
let fail = 0;
for (const p of plan) {
  try {
    const sb = await getJson(p.oldKey);
    const oldTitle = sb.title;
    sb.id = p.newId;
    sb.title = padTitle(oldTitle || '');
    sb.updatedAt = new Date().toISOString();
    await putJson(p.newKey, sb);
    await deleteKey(p.oldKey);
    console.log(`  ✓ ${p.oldId} → ${p.newId}   "${oldTitle}" → "${sb.title}"`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${p.oldId}: ${e.message}`);
    fail++;
  }
}
console.log(`\n✓ 적용: ${ok}권, ✗ 실패: ${fail}권`);
console.log(`\n⚠️  서버 재시작 권장 (in-memory listCache 새로고침).`);
