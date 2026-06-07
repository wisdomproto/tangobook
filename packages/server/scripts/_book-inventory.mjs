#!/usr/bin/env node
// 읽기 전용: 동화책(type=storybook) category별 권수 집계. category==='backup' 은 제외(무시).
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

const books = [];
let i = 0;
async function loader() {
  while (i < keys.length) {
    const k = keys[i++];
    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: k }));
      books.push(JSON.parse(await out.Body.transformToString('utf-8')));
    } catch {}
  }
}
await Promise.all(Array.from({ length: 16 }, loader));

// 동화책만 (파닉스 제외)
const storybooks = books.filter((b) => !b.type || b.type === 'storybook');

// category별 집계 (공개/비공개)
const byCat = new Map(); // cat -> { pub, priv, undef }
for (const b of storybooks) {
  const cat = b.category || '(미분류)';
  const cur = byCat.get(cat) ?? { pub: 0, priv: 0, undef: 0 };
  if (b.isPublic === true) cur.pub++;
  else if (b.isPublic === false) cur.priv++;
  else cur.undef++;
  byCat.set(cat, cur);
}

const total = (c) => c.pub + c.priv + c.undef;
const rows = [...byCat.entries()].sort((a, b) => total(b[1]) - total(a[1]));

console.log(`동화책(type=storybook) 총 ${storybooks.length}권 (파닉스 ${books.length - storybooks.length} 제외)\n`);
console.log('── category 별 raw 분포 (공개 / 비공개 / 미설정) ──');
console.log('카테고리'.padEnd(22) + '공개'.padStart(6) + '비공개'.padStart(8) + '미설정'.padStart(8) + '합계'.padStart(7));
console.log('─'.repeat(52));
for (const [cat, c] of rows) {
  const mark = cat === 'backup' ? '  ← 무시' : '';
  console.log(cat.padEnd(22) + String(c.pub).padStart(6) + String(c.priv).padStart(8) + String(c.undef).padStart(8) + String(total(c)).padStart(7) + mark);
}

// 그룹 소계 (backup 제외)
const NATURE = ['공룡 친구들', '곤충 친구들', '육지 동물 친구들', '바다 동물 친구들', '하늘 동물 친구들', '식물 친구들', '우주와 자연', '우리 몸 이야기'];
const sum = (cats) => cats.reduce((n, cat) => n + (byCat.has(cat) ? total(byCat.get(cat)) : 0), 0);
const sumPub = (cats) => cats.reduce((n, cat) => n + (byCat.has(cat) ? byCat.get(cat).pub : 0), 0);

const classics = byCat.get('세계 명작') ? total(byCat.get('세계 명작')) : 0;
const classicsPub = byCat.get('세계 명작') ? byCat.get('세계 명작').pub : 0;
const folk = byCat.get('전래 동화') ? total(byCat.get('전래 동화')) : 0;
const folkPub = byCat.get('전래 동화') ? byCat.get('전래 동화').pub : 0;
const backup = byCat.get('backup') ? total(byCat.get('backup')) : 0;

const known = new Set(['세계 명작', '전래 동화', 'backup', ...NATURE]);
const otherCats = rows.filter(([cat]) => !known.has(cat));
const otherTotal = otherCats.reduce((n, [, c]) => n + total(c), 0);

console.log('\n── 그룹 소계 (backup 제외) ──');
console.log(`세계 명작:            ${classics}권 (공개 ${classicsPub})`);
console.log(`전래 동화:            ${folk}권 (공개 ${folkPub})`);
console.log(`자연관찰 (합계):       ${sum(NATURE)}권 (공개 ${sumPub(NATURE)})`);
for (const cat of NATURE) {
  if (!byCat.has(cat)) continue;
  const c = byCat.get(cat);
  console.log(`   - ${cat.padEnd(16)} ${total(c)}권 (공개 ${c.pub})`);
}
if (otherCats.length) {
  console.log(`기타/그외:            ${otherTotal}권`);
  for (const [cat, c] of otherCats) console.log(`   - ${cat.padEnd(16)} ${total(c)}권 (공개 ${c.pub})`);
}
console.log(`\n[무시] backup:         ${backup}권`);
const grandPub = storybooks.filter((b) => b.isPublic === true && b.category !== 'backup').length;
const grandTotal = storybooks.filter((b) => b.category !== 'backup').length;
console.log(`\n총 동화책 (backup 제외): ${grandTotal}권 (공개 ${grandPub})`);
