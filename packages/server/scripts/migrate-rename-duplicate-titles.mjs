#!/usr/bin/env node
/**
 * 같은 title 동화책 이름 정리 마이그.
 *
 * 룰 A (콘텐츠 우선):
 *   각 중복 그룹에서 (pages desc → key_objects desc → characters desc → createdAt asc) 1위가 winner.
 *   2위, 3위, ... 의 title 을 "{원래제목}-1", "-2", ... 로 변경.
 *
 * variant 끼리(같은 baseId) 는 같은 그룹에 묶이지 않게 dump-duplicate-titles.mjs 에서 이미 제외.
 *
 * 사용:
 *   node scripts/migrate-rename-duplicate-titles.mjs           # dry-run (변경 X)
 *   node scripts/migrate-rename-duplicate-titles.mjs --apply   # 실 적용
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

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;

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

const dataPath = path.join(__dirname, '_data', 'duplicate-titles.json');
if (!fs.existsSync(dataPath)) {
  console.error(`먼저 dump-duplicate-titles.mjs 실행 필요: ${dataPath} 없음`);
  process.exit(1);
}
const groups = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN (변경 없음)'}`);
console.log(`중복 그룹: ${groups.length}개\n`);

// 룰 A 비교: pages desc → ko desc → chars desc → createdAt asc
function compareByContent(a, b) {
  if (a.pageCount !== b.pageCount) return b.pageCount - a.pageCount;
  if (a.keyObjectCount !== b.keyObjectCount) return b.keyObjectCount - a.keyObjectCount;
  if (a.characterCount !== b.characterCount) return b.characterCount - a.characterCount;
  return (a.createdAt || '').localeCompare(b.createdAt || '');
}

// 모든 storybook 의 title set — 새 title 충돌 회피용
const allTitlesAfter = new Set();
for (const g of groups) for (const b of g.books) allTitlesAfter.add(b.title);

const plan = []; // [{ id, oldTitle, newTitle }]
let totalRenames = 0;

for (const group of groups) {
  console.log(`\n[그룹] "${group.title}"`);
  // 같은 baseId 끼리는 같이 가야 (variant) — 분석 단계에서 fork 단위로 묶었으니 baseId 유일
  // sort by content
  const sorted = [...group.books].sort(compareByContent);
  const winner = sorted[0];
  console.log(
    `  ✓ KEEP  ${winner.id.padEnd(36)} pages=${winner.pageCount} ko=${winner.keyObjectCount} chars=${winner.characterCount} created=${(winner.createdAt || '').slice(0, 10)}`
  );

  const losers = sorted.slice(1);
  let suffix = 1;
  for (const loser of losers) {
    let newTitle = `${group.title}-${suffix}`;
    // 만약 그 title 이 이미 다른 곳에 있으면 increment
    while (allTitlesAfter.has(newTitle)) {
      suffix++;
      newTitle = `${group.title}-${suffix}`;
    }
    allTitlesAfter.add(newTitle);
    plan.push({ id: loser.id, oldTitle: loser.title, newTitle });
    console.log(
      `  → ${suffix.toString().padStart(2)}    ${loser.id.padEnd(36)} pages=${loser.pageCount} ko=${loser.keyObjectCount} chars=${loser.characterCount}  "${loser.title}" → "${newTitle}"`
    );
    suffix++;
    totalRenames++;
  }
}

console.log(`\n=== 요약 ===`);
console.log(`총 rename 대상: ${totalRenames}권`);
console.log(`(winner 21권 keep)`);

if (!APPLY) {
  console.log(`\n👀 DRY-RUN 종료. 실 적용은 \`--apply\` 플래그.`);
  process.exit(0);
}

console.log(`\n✏️  실 적용 시작...`);
let ok = 0;
let fail = 0;
for (const item of plan) {
  const key = `storybook-${item.id}.json`;
  try {
    const sb = await getJson(key);
    if (sb.title !== item.oldTitle) {
      console.warn(
        `  ⚠️  ${item.id}: 분석 시점과 R2 title 불일치 ("${sb.title}" vs "${item.oldTitle}") → skip`
      );
      fail++;
      continue;
    }
    sb.title = item.newTitle;
    sb.updatedAt = new Date().toISOString();
    await putJson(key, sb);
    console.log(`  ✓ ${item.id}: "${item.oldTitle}" → "${item.newTitle}"`);
    ok++;
  } catch (e) {
    console.error(`  ✗ ${item.id}: ${e.message}`);
    fail++;
  }
}
console.log(`\n✓ 적용: ${ok}권, ✗ 실패: ${fail}권`);
console.log(`\n⚠️  서버 재시작 권장 (in-memory listCache 새로고침).`);
