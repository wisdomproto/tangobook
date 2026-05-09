#!/usr/bin/env node
/**
 * 옛 longform cell 잔존 데이터 정리.
 *
 * 1) (style, lang) 중복 cell — 같은 (artStyle, language) cell 이 2개 이상이면 1개로 통합
 *    우선순위: clipUrl 보유 > scenes 많음 > 첫 등장
 * 2) 언어 미매칭 자막/TTS reset — language ≠ 'ko' 인데 scene.subtitles 의 텍스트에 한글 섞임 →
 *    그 scene 의 subtitles=[], ttsUrl=undefined, ttsDuration=undefined.
 *    (TimelineEditorStep auto-fill 이 이후 storybook.pages[].translations[lang] 에서 채움)
 *
 * dry-run 기본. `--apply` 시 실제 R2 PUT.
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
const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
const bucket = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId, secretAccessKey },
});

const HANGUL_RE = /[가-힣]/;

async function getJson(key) {
  try {
    const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    return JSON.parse(await r.Body.transformToString('utf-8'));
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

function dedupeCells(projects) {
  // 같은 (style, lang) cell 그루핑. 우선순위로 1개만 유지.
  const buckets = new Map();
  for (const p of projects) {
    const k = `${p.artStyle ?? ''}::${p.language ?? 'ko'}`;
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k).push(p);
  }
  const kept = [];
  let removed = 0;
  for (const [k, group] of buckets) {
    if (group.length === 1) {
      kept.push(group[0]);
      continue;
    }
    // 우선순위: clipUrl 많이 보유 > scenes 길이 > 첫 등장
    const ranked = [...group].sort((a, b) => {
      const aClips = (a.scenes ?? []).filter((s) => s.clipUrl).length;
      const bClips = (b.scenes ?? []).filter((s) => s.clipUrl).length;
      if (aClips !== bClips) return bClips - aClips;
      const aLen = (a.scenes ?? []).length;
      const bLen = (b.scenes ?? []).length;
      if (aLen !== bLen) return bLen - aLen;
      return 0;
    });
    kept.push(ranked[0]);
    removed += group.length - 1;
  }
  return { kept, removed };
}

function resetMismatchedScenes(project) {
  const lang = project.language ?? 'ko';
  if (lang === 'ko') return { resetCount: 0 };
  let resetCount = 0;
  for (const s of project.scenes ?? []) {
    const subs = s.subtitles ?? [];
    const hasHangul = subs.some((sub) => HANGUL_RE.test(sub.text ?? ''));
    if (hasHangul) {
      s.subtitles = [];
      s.ttsUrl = undefined;
      s.ttsDuration = undefined;
      resetCount++;
    }
  }
  return { resetCount };
}

console.log(`Mode: ${APPLY ? 'APPLY' : 'DRY-RUN'}`);
console.log('=========================================\n');

console.log('[1/2] storybook-*.json 목록...');
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

console.log('[2/2] longform 점검...');
const plan = [];
let i = 0;
const CONCURRENCY = 20;
async function worker() {
  while (i < keys.length) {
    const idx = i++;
    const key = keys[idx];
    const book = await getJson(key);
    if (!book?.id) continue;
    const projects = book.longformProjects ?? [];
    if (projects.length === 0) continue;

    const { kept, removed } = dedupeCells(projects);
    let totalResets = 0;
    for (const p of kept) {
      const { resetCount } = resetMismatchedScenes(p);
      totalResets += resetCount;
    }
    if (removed === 0 && totalResets === 0) continue;

    plan.push({ key, id: book.id, title: book.title, removed, totalResets, kept, book });
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

console.log(`  변경 대상: ${plan.length}권\n`);
let totalRemoved = 0;
let totalResets = 0;
for (const p of plan) {
  console.log(`  - ${p.id} | ${p.title}`);
  if (p.removed > 0) console.log(`      중복 cell 제거: ${p.removed}`);
  if (p.totalResets > 0) console.log(`      미매칭 scene reset: ${p.totalResets}`);
  totalRemoved += p.removed;
  totalResets += p.totalResets;
}
console.log(`\n총: 중복 cell ${totalRemoved} 제거 / scene reset ${totalResets}`);

if (!APPLY) {
  console.log('\n[DRY-RUN] --apply 추가 시 실제 R2 PUT.');
  process.exit(0);
}

console.log('\n[APPLY] R2 PUT 중...');
let done = 0;
for (const p of plan) {
  const next = {
    ...p.book,
    longformProjects: p.kept,
    updatedAt: new Date().toISOString(),
  };
  await putJson(p.key, next);
  done++;
  if (done % 20 === 0) console.log(`  ${done}/${plan.length}`);
}
console.log(`\n완료: ${done}권 patched.`);
