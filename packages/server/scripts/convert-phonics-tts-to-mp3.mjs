#!/usr/bin/env node
/**
 * 파닉스 음원 **wav → mp3** 일괄 변환 (멱등).
 *
 * 🔴 왜: 저작도구가 만든 단어·글자 음원이 **무압축 wav 로 370KB** 씩이다. 아이가 카드를 처음 누르면
 *    그 순간 370KB 를 받느라 소리가 늦는다 — "첫 소리가 늦다"의 진짜 원인이 여기 있었다
 *    (프리워밍은 증상 완화일 뿐이고, 데워지기 전에 누르면 그대로 기다린다).
 *    말소리는 64kbps 모노면 충분해서 **15배 작아진다**(370KB → ~25KB).
 *
 * 🔴 **URL 단위로 한 번만** 변환한다 — 같은 음원이 여러 책·필드에 재사용된다.
 * 🔴 기존 wav 는 지우지 않는다(되돌릴 여지). 새 키는 확장자만 .mp3 로 바꾼 결정적 이름이라
 *    다시 돌려도 이미 있는 건 건너뛴다.
 *
 * 🔴 파닉스만이 아니라 **모든 책**을 훑는다 — 같은 저작도구가 동화책 쪽에도 wav 를 남긴다.
 *    `--type=phonics` 로 좁힐 수 있다.
 *
 * 사용:
 *   node packages/server/scripts/convert-phonics-tts-to-mp3.mjs               # dry-run (전체)
 *   node packages/server/scripts/convert-phonics-tts-to-mp3.mjs --apply
 *   node packages/server/scripts/convert-phonics-tts-to-mp3.mjs --apply --only=en-b1-u01
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const require = createRequire(import.meta.url);
const FFMPEG = require('ffmpeg-static');
const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;
const TYPE = args.type ? String(args.type) : null;
const API = process.env.API_BASE || 'http://localhost:3500';

loadEnv();
const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'tts-mp3-'));

/** 객체 안의 모든 문자열을 훑어 wav URL 을 찾고, 주어진 맵으로 바꿔친다. 바뀐 개수 반환. */
function rewriteWavUrls(node, replace) {
  if (!node || typeof node !== 'object') return 0;
  let n = 0;
  for (const key of Object.keys(node)) {
    const v = node[key];
    if (typeof v === 'string' && /^https?:\/\/.*\.wav(\?|$)/i.test(v)) {
      const next = replace(v);
      if (next && next !== v) {
        node[key] = next;
        n++;
      }
    } else if (typeof v === 'object') {
      n += rewriteWavUrls(v, replace);
    }
  }
  return n;
}

/** wav URL → 같은 경로의 .mp3 R2 키 */
function mp3KeyFor(url) {
  const key = decodeURIComponent(new URL(url).pathname.replace(/^\//, ''));
  return key.replace(/\.wav$/i, '.mp3');
}

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

/** 하나 변환 → 업로드. 이미 있으면 건너뛴다. `{ url, srcBytes, outBytes, skipped }` */
async function convert(wavUrl) {
  const key = mp3KeyFor(wavUrl);
  const url = `${PUBLIC}/${key.split('/').map(encodeURIComponent).join('/')}`;
  if (await exists(key)) return { url, skipped: true };
  if (!APPLY) return { url, skipped: false, srcBytes: 0, outBytes: 0 };

  const res = await fetch(wavUrl);
  if (!res.ok) throw new Error(`다운로드 ${res.status}`);
  const src = Buffer.from(await res.arrayBuffer());
  const inFile = path.join(TMP, 'in.wav');
  const outFile = path.join(TMP, 'out.mp3');
  fs.writeFileSync(inFile, src);
  // 말소리 전용 — 모노 64kbps 면 원음과 구분이 안 되면서 15배 작다.
  execFileSync(FFMPEG, ['-y', '-i', inFile, '-ac', '1', '-b:a', '64k', outFile], { stdio: 'pipe' });
  const out = fs.readFileSync(outFile);
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: out,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return { url, skipped: false, srcBytes: src.length, outBytes: out.length };
}

const list = await (await fetch(`${API}/api/storybooks`)).json();
const books = list.data.filter((b) => (!TYPE || b.type === TYPE) && (!ONLY || b.id === ONLY));
console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'} · 책 ${books.length}권\n`);

const converted = new Map(); // wavUrl → mp3Url
let srcTotal = 0;
let outTotal = 0;
let failed = 0;
let touchedBooks = 0;
let fields = 0;

for (const summary of books) {
  const sb = await getStorybook(summary.id);
  if (!sb) continue;

  // 1) 이 책이 쓰는 wav 를 먼저 전부 변환 (중복 URL 은 한 번만)
  const wavs = new Set();
  rewriteWavUrls(sb, (u) => {
    wavs.add(u);
    return u;
  });
  if (wavs.size === 0) continue;

  for (const wav of wavs) {
    if (converted.has(wav)) continue;
    try {
      const r = await convert(wav);
      converted.set(wav, r.url);
      if (!r.skipped && r.srcBytes) {
        srcTotal += r.srcBytes;
        outTotal += r.outBytes;
      }
    } catch (e) {
      failed++;
      console.log(`  ⚠️ ${wav.split('/').pop()} — ${e.message}`);
    }
  }

  // 2) 책 안의 URL 교체
  const n = rewriteWavUrls(sb, (u) => converted.get(u));
  if (n === 0) continue;
  fields += n;
  touchedBooks++;
  console.log(`[${summary.id}] ${n}곳 교체`);
  if (APPLY) {
    sb.updatedAt = new Date().toISOString();
    await putStorybook(summary.id, sb);
  }
}

fs.rmSync(TMP, { recursive: true, force: true });
console.log(
  `\n책 ${touchedBooks}권 · 필드 ${fields}곳 · 음원 ${converted.size}개` +
    (srcTotal ? ` · ${(srcTotal / 1048576).toFixed(1)}MB → ${(outTotal / 1048576).toFixed(1)}MB` : '')
);
if (failed) console.log(`⚠️ 실패 ${failed}건`);
if (!APPLY) console.log('\n(dry-run — 반영하려면 --apply)');
