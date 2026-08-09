#!/usr/bin/env node
/**
 * 탱고 시나리오 8단계 2음절 낱말 원어민 녹음(`/tangoch/word2/`) → R2 `mod_chinese` 업로드 (멱등).
 *
 * 🔴 탱고 커리큘럼 "완전 따라하기" — 2음절 낱말(海边·妹妹·星星…)은 원어민 녹음이 이미 있다(경성까지 정확).
 *    TTS 근사 대신 이 녹음을 그대로 쓴다. 키 = 성조 병음(pypinyin, `word2_manifest.json`).
 *
 * 원본 stereo → ffmpeg mono 64k 재인코딩(런타임 규격, 단음절과 동일). 업로드 후 `_index.json` 삭제 → 재빌드.
 *
 * 사용:
 *   node packages/server/scripts/upload-chinese-word2-audio.mjs            # dry-run
 *   node packages/server/scripts/upload-chinese-word2-audio.mjs --apply
 */
import { S3Client, PutObjectCommand, HeadObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv } from './translation-core.mjs';

const execFileAsync = promisify(execFile);

const MANIFEST =
  'C:/Users/101024/AppData/Local/Temp/claude/C--projects-tangobook--claude-worktrees-blog-multilingual-setup-32f610/8929740f-d76e-44f5-84fd-bd817043bd00/scratchpad/word2_manifest.json';
const SRC_DIR =
  'D:/탱고 데이터/컨텐츠/12. 중국 판매용 콘텐츠 개발(2022.01.04~)/2. 중국어 콘텐츠/1. 음원/1. 최종 음원(09.13)/tangoch(220913_cei 추가)/word2';

const DRY = !process.argv.includes('--apply');

loadEnv();
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const BUCKET = process.env.R2_BUCKET_NAME;

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

const words = JSON.parse(fs.readFileSync(MANIFEST, 'utf-8'));
console.log(`${DRY ? '👀 DRY-RUN' : '✏️  APPLY'} — 2음절 낱말 ${words.length}개\n`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zh-word2-'));
let ok = 0,
  skip = 0,
  miss = 0,
  outBytes = 0;

for (const w of words) {
  const key = `phonics-library/mod_chinese/${w.pinyin.normalize('NFC')}.mp3`;
  const srcPath = path.join(SRC_DIR, `${w.file}.mp3`);
  if (!fs.existsSync(srcPath)) {
    miss++;
    console.log(`  [없음] ${w.pinyin} ${w.hanzi} — 원본 ${w.file}.mp3`);
    continue;
  }
  if (await exists(key)) {
    skip++;
    continue;
  }
  if (DRY) {
    console.log(`  ${w.pinyin} ${w.hanzi} ← ${w.file}.mp3`);
    ok++;
    continue;
  }
  const outPath = path.join(tmp, `${w.file}.mp3`);
  await execFileAsync(ffmpegPath, ['-i', srcPath, '-ac', '1', '-b:a', '64k', '-y', outPath]);
  const body = fs.readFileSync(outPath);
  outBytes += body.length;
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: body,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  ok++;
  console.log(`  ✅ ${w.pinyin} ${w.hanzi} (${(body.length / 1024).toFixed(0)}KB)`);
}

if (!DRY && ok > 0) {
  await s3
    .send(new DeleteObjectCommand({ Bucket: BUCKET, Key: 'phonics-library/_index.json' }))
    .then(() => console.log('  _index.json 삭제(재빌드 유도)'))
    .catch(() => {});
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(
  `\n${DRY ? '[dry-run] ' : ''}업로드 ${ok} · skip ${skip} · 원본없음 ${miss}${DRY ? '' : ` | mono64k ${(outBytes / 1024 / 1024).toFixed(1)}MB`}`
);
