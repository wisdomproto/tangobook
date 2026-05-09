#!/usr/bin/env node
/**
 * parentGuide.overview 백필 — 모든 storybook-*.json 조사 → overview 누락 책에 대해 Gemini 로 생성 → R2 patch.
 *
 * 동작:
 *   1) ListObjectsV2 로 root level `storybook-*.json` 목록
 *   2) 각 storybook 의 parentGuide?.overview 확인 (빈 문자열 / 없음 → 대상)
 *   3) Gemini gemini-2.5-flash-lite 로 overview 생성 (title + category + referenceContent slice 활용)
 *   4) dry-run 기본 (생성 결과만 출력). `--apply` 시 실제 R2 PUT.
 *   5) 옵션: `--limit N` (대상 N개만), `--id {id}` (특정 책만)
 *
 * 안전: 기존 parentGuide.lessons / readingTips 보존. overview 만 추가/덮어쓰기 X (이미 있는 책은 skip).
 */

import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
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
const limitArg = process.argv.find((a) => a.startsWith('--limit='));
const idArg = process.argv.find((a) => a.startsWith('--id='));
const LIMIT = limitArg ? parseInt(limitArg.slice('--limit='.length), 10) : undefined;
const ONLY_ID = idArg ? idArg.slice('--id='.length) : undefined;

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;
const geminiKey = process.env.GEMINI_API_KEY;
const MODEL = 'gemini-2.5-flash-lite';

if (!accountId || !accessKeyId || !secretAccessKey || !bucket) {
  console.error('R2 env vars 누락');
  process.exit(1);
}
if (!geminiKey) {
  console.error('GEMINI_API_KEY 누락');
  process.exit(1);
}

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

async function generateOverview(book) {
  const title = book.title || '(제목 없음)';
  const category = book.category || '동화';
  const ref = (book.referenceContent || '').slice(0, 1000);
  const prompt = `다음 동화책의 부모용 한 문단 책 소개를 작성해줘. 4-5세 아이에게 읽어주는 부모 입장에서 책의 줄거리·분위기·정서를 자연스럽게 소개하는 톤.

제목: ${title}
카테고리: ${category}
${ref ? `원본 일부 (참고용):\n${ref}\n` : ''}

조건:
- 한국어 1~2 문장 (60~140자)
- 광고/과장 X, 자연스러운 소개 톤
- 책의 핵심 줄거리·메시지·정서 한 줄로 압축
- 응답은 본문만 (라벨/접두사/따옴표 없이 단문 그대로)`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${geminiKey}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 300 },
  };

  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(`Gemini ${r.status}: ${t.slice(0, 200)}`);
      }
      const j = await r.json();
      const text = j?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!text) throw new Error('empty response');
      // 따옴표/접두 라벨/줄넘김 정제
      return text
        .replace(/^["“'‘'']+|["”'’'']+$/g, '')
        .replace(/^(소개|책 소개|overview)\s*[:：]\s*/i, '')
        .trim();
    } catch (e) {
      lastErr = e;
      if (attempt < 2) await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
    }
  }
  throw lastErr;
}

console.log(`Mode: ${APPLY ? 'APPLY (실 PUT)' : 'DRY-RUN'} | Model: ${MODEL}`);
if (LIMIT) console.log(`Limit: ${LIMIT}`);
if (ONLY_ID) console.log(`Only ID: ${ONLY_ID}`);
console.log('=========================================\n');

console.log('[1/3] storybook-*.json 목록 가져오는 중...');
const keys = [];
let token;
do {
  const r = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  if (r.Contents) {
    for (const o of r.Contents) {
      if (o.Key?.endsWith('.json') && !o.Key.includes('/')) keys.push(o.Key);
    }
  }
  token = r.IsTruncated ? r.NextContinuationToken : undefined;
} while (token);
console.log(`  ${keys.length} files\n`);

console.log('[2/3] overview 누락 책 식별...');
const missing = []; // { key, book }
let scanIdx = 0;
const SCAN_CONCURRENCY = 20;
async function scanWorker() {
  while (scanIdx < keys.length) {
    const idx = scanIdx++;
    const key = keys[idx];
    const book = await getJson(key);
    if (!book?.id) continue;
    if (ONLY_ID && book.id !== ONLY_ID) continue;
    const ov = book.parentGuide?.overview;
    if (!ov || !ov.trim()) {
      missing.push({ key, book });
    }
  }
}
await Promise.all(Array.from({ length: SCAN_CONCURRENCY }, scanWorker));
console.log(`  overview 누락: ${missing.length}권\n`);

const targets = LIMIT ? missing.slice(0, LIMIT) : missing;

console.log(`[3/3] Gemini 생성 (대상 ${targets.length}권)...`);
const results = []; // { key, book, overview, error }
let genIdx = 0;
const GEN_CONCURRENCY = 5;
async function genWorker() {
  while (genIdx < targets.length) {
    const idx = genIdx++;
    const t = targets[idx];
    try {
      const overview = await generateOverview(t.book);
      results.push({ ...t, overview });
      console.log(`  ✓ ${t.book.id} | ${t.book.title}`);
      console.log(`    → ${overview}`);
    } catch (e) {
      results.push({ ...t, error: e.message });
      console.log(`  ✗ ${t.book.id} | ${t.book.title} : ${e.message}`);
    }
  }
}
await Promise.all(Array.from({ length: GEN_CONCURRENCY }, genWorker));

const ok = results.filter((r) => r.overview);
const failed = results.filter((r) => r.error);
console.log(`\n생성 결과: 성공 ${ok.length} / 실패 ${failed.length}`);

if (!APPLY) {
  console.log('\n[DRY-RUN] --apply 추가 시 실제 R2 PUT 실행됩니다.');
  process.exit(0);
}

console.log('\n[APPLY] R2 PUT 실행 중...');
let done = 0;
for (const r of ok) {
  const next = {
    ...r.book,
    parentGuide: {
      ...(r.book.parentGuide ?? {}),
      overview: r.overview,
    },
    updatedAt: new Date().toISOString(),
  };
  await putJson(r.key, next);
  done++;
  if (done % 10 === 0) console.log(`  ${done}/${ok.length}`);
}
console.log(`\n완료: ${done}권 patched.`);
