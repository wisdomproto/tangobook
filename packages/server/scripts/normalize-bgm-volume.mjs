#!/usr/bin/env node
/**
 * 배경음악(BGM) 라이브러리의 모든 음악을 동일한 perceived loudness 로 정규화.
 * - 대상: R2 `background-music.json` 의 각 항목 (저작도구 기본설정에 올린 BGM).
 * - 방식: ffmpeg loudnorm (EBU R128) 2-pass — 측정(input_i 등) 후 measured 값으로 정확히 I=-20 LUFS 로 맞춤.
 * - 새 key 로 업로드(immutable 캐시 stale 방지) → 라이브러리 JSON url 갱신 + 모든 storybook 의 옛 URL→새 URL 치환.
 * - 멱등: 이미 `normalizedLufs` 표시된 항목은 skip.
 * - 기본 dry-run(측정·현재 LUFS만 출력) / --apply (백업 후 실제 변환·업로드·치환).
 *
 * 실행: node scripts/normalize-bgm-volume.mjs [--apply]
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import { spawn } from 'node:child_process';
import ffmpegPath from 'ffmpeg-static';
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
const APPLY = process.argv.includes('--apply');
const TARGET_I = -20; // 목표 integrated loudness (LUFS)
const TARGET_TP = -1.5; // true peak ceiling (dBTP)
const TARGET_LRA = 11; // loudness range
const CACHE_CONTROL = 'public, max-age=31536000, immutable';
const LIBRARY_KEY = 'background-music.json';

const urlToKey = (u) => decodeURIComponent(new URL(u).pathname.replace(/^\//, ''));

function runFfmpeg(inputBuf, args) {
  return new Promise((resolve, reject) => {
    const proc = spawn(ffmpegPath, args);
    const out = [];
    const err = [];
    proc.stdout.on('data', (c) => out.push(c));
    proc.stderr.on('data', (c) => err.push(c));
    proc.on('error', reject);
    proc.on('close', (code) =>
      resolve({ stdout: Buffer.concat(out), stderr: Buffer.concat(err).toString(), code })
    );
    proc.stdin.on('error', () => {});
    proc.stdin.end(inputBuf);
  });
}

// 1-pass 측정 — loudnorm 분석 JSON(stderr 끝 블록) 파싱.
async function measureLoudness(buf) {
  const { stderr } = await runFfmpeg(buf, [
    '-i', 'pipe:0',
    '-af', `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}:print_format=json`,
    '-f', 'null', '-',
  ]);
  // loudnorm JSON 은 stderr 끝에 출력됨. 소스 메타데이터에 '{' 가 있을 수 있어 마지막 블록을 견고하게 추출.
  const i = stderr.lastIndexOf('"input_i"');
  if (i !== -1) {
    const start = stderr.lastIndexOf('{', i);
    const end = stderr.indexOf('}', i);
    if (start !== -1 && end !== -1) {
      try {
        return { meas: JSON.parse(stderr.slice(start, end + 1)), stderr };
      } catch {
        /* fall through */
      }
    }
  }
  return { meas: null, stderr };
}

// 2-pass 적용 — 측정값으로 정확히 정규화 → mp3 buffer.
async function normalizeToMp3(buf, meas) {
  const filter =
    `loudnorm=I=${TARGET_I}:TP=${TARGET_TP}:LRA=${TARGET_LRA}` +
    `:measured_I=${meas.input_i}:measured_TP=${meas.input_tp}` +
    `:measured_LRA=${meas.input_lra}:measured_thresh=${meas.input_thresh}` +
    `:offset=${meas.target_offset}:linear=true:print_format=summary`;
  const { stdout, code, stderr } = await runFfmpeg(buf, [
    '-i', 'pipe:0',
    '-af', filter,
    '-ar', '44100',
    '-c:a', 'libmp3lame', '-b:a', '192k',
    '-f', 'mp3', 'pipe:1',
  ]);
  if (code !== 0 || stdout.length === 0) throw new Error(`ffmpeg normalize failed (code ${code}): ${stderr.slice(-300)}`);
  return stdout;
}

async function getJson(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await out.Body.transformToString());
}
async function getBuffer(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return Buffer.from(await out.Body.transformToByteArray());
}

// --- 라이브러리 로드 ---
let library;
try {
  library = await getJson(LIBRARY_KEY);
} catch (e) {
  console.error(`background-music.json 로드 실패: ${e.message}`);
  process.exit(1);
}
if (!Array.isArray(library)) {
  console.error('background-music.json 형식이 배열이 아닙니다.');
  process.exit(1);
}

console.log(`\nBGM 라이브러리: ${library.length}곡  (목표 ${TARGET_I} LUFS, ${APPLY ? 'APPLY' : 'dry-run'})\n`);

// --test: 라이브 데이터 변경 없이 첫 곡을 in-memory 정규화 후 결과 LUFS 검증.
if (process.argv.includes('--test')) {
  for (const item of library) {
    const buf = await getBuffer(urlToKey(item.url));
    const { meas } = await measureLoudness(buf);
    if (!meas) continue;
    const mp3 = await normalizeToMp3(buf, meas);
    const after = await measureLoudness(mp3);
    console.log(
      `검증 [${item.title}]  ${Number(meas.input_i).toFixed(1)} → ${after.meas ? Number(after.meas.input_i).toFixed(1) : '?'} LUFS  (목표 ${TARGET_I}, ${(buf.length / 1024).toFixed(0)}KB → ${(mp3.length / 1024).toFixed(0)}KB)`
    );
    break;
  }
  process.exit(0);
}

const backupDir = path.join(__dirname, '_backup-bgm');
if (APPLY) fs.mkdirSync(backupDir, { recursive: true });

const urlMap = {}; // oldUrl -> newUrl
let processed = 0;
let skipped = 0;

for (const item of library) {
  const tag = `  ${item.title ?? item.id}`;
  if (item.normalizedLufs === TARGET_I) {
    console.log(`${tag}  → skip (이미 정규화됨)`);
    skipped++;
    continue;
  }
  let buf;
  try {
    buf = await getBuffer(urlToKey(item.url));
  } catch (e) {
    console.log(`${tag}  → ERROR 다운로드 실패 ${e.message}`);
    continue;
  }
  const { meas, stderr: measErr } = await measureLoudness(buf);
  const before = meas ? Number(meas.input_i).toFixed(1) : '?';
  if (!meas) {
    console.log(`${tag}  → ERROR 측정 실패 (${(buf.length / 1024).toFixed(0)}KB): ${measErr.trim().split('\n').slice(-2).join(' | ').slice(-220)}`);
    continue;
  }
  if (!APPLY) {
    console.log(`${tag}  현재 ${before} LUFS → ${TARGET_I} LUFS 로 정규화 예정`);
    processed++;
    continue;
  }
  // APPLY: 정규화 → 새 key 업로드 → url 갱신
  try {
    const mp3 = await normalizeToMp3(buf, meas);
    const oldKey = urlToKey(item.url);
    const origin = new URL(item.url).origin;
    const noExt = oldKey.replace(/\.[^.]+$/, '');
    const newKey = `${noExt}-lufs${Math.abs(TARGET_I)}-${Date.now()}.mp3`;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: newKey,
        Body: mp3,
        ContentType: 'audio/mpeg',
        CacheControl: CACHE_CONTROL,
      })
    );
    const newUrl = `${origin}/${newKey}`;
    urlMap[item.url] = newUrl;
    item.url = newUrl;
    item.normalizedLufs = TARGET_I;
    console.log(`${tag}  ${before} → ${TARGET_I} LUFS  (${(buf.length / 1024).toFixed(0)}KB → ${(mp3.length / 1024).toFixed(0)}KB)`);
    processed++;
  } catch (e) {
    console.log(`${tag}  → ERROR 정규화 실패 ${e.message}`);
  }
}

if (!APPLY) {
  console.log(`\n[dry-run] 정규화 대상 ${processed}곡 / skip ${skipped}곡.`);
  console.log(`실제 적용: node scripts/normalize-bgm-volume.mjs --apply`);
  process.exit(0);
}

if (Object.keys(urlMap).length === 0) {
  console.log(`\n변경된 BGM 없음 (정규화 ${processed} / skip ${skipped}).`);
  process.exit(0);
}

// 라이브러리 JSON 백업 + 저장
fs.writeFileSync(path.join(backupDir, LIBRARY_KEY), JSON.stringify(await getJson(LIBRARY_KEY), null, 2));
await s3.send(
  new PutObjectCommand({
    Bucket: bucket,
    Key: LIBRARY_KEY,
    Body: JSON.stringify(library),
    ContentType: 'application/json',
  })
);
console.log(`\n라이브러리 갱신 완료 (${Object.keys(urlMap).length}곡 새 URL).`);

// 모든 storybook 에서 옛 URL → 새 URL 치환
const keys = [];
let token;
do {
  const out = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  for (const o of out.Contents ?? []) if (o.Key.endsWith('.json')) keys.push(o.Key);
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

let booksChanged = 0;
for (const key of keys) {
  try {
    const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    const original = await out.Body.transformToString();
    let text = original;
    for (const [oldUrl, newUrl] of Object.entries(urlMap)) {
      if (text.includes(oldUrl)) text = text.split(oldUrl).join(newUrl);
    }
    if (text === original) continue;
    fs.writeFileSync(path.join(backupDir, key), original);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: text,
        ContentType: 'application/json',
      })
    );
    booksChanged++;
  } catch (e) {
    console.log('ERR', key, e.message);
  }
}

console.log(`storybook URL 치환: ${booksChanged}권 갱신.`);
console.log(`\n✅ 완료 — 정규화 ${processed}곡, 책 ${booksChanged}권. (백업: scripts/_backup-bgm/)`);
