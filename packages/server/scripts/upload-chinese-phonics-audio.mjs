#!/usr/bin/env node
/**
 * 병음(拼音) L1 원어민 녹음 → R2 `phonics-library/mod_chinese/` 업로드.
 *
 * 소스 = `mod_cn(최종07.04)` 덤프(声韵母表 SSOT). 파일명 `{base}-{tone}.mp3`(핵 모음 뒤 성조 숫자,
 * v=ü) · `ma-{tone}.mp3`. 사운드 키 = 성조부호 병음(NFC) 그대로 — 클라 `getChineseSyllableUrl` 이 조회.
 *
 * 🔴 원본이 stereo 200kbps(~26KB)라 말소리엔 과함 → ffmpeg 로 mono 64k 재인코딩(런타임 concat 과 동일 규격).
 * 업로드 후 `phonics-library/_index.json` 삭제 → 다음 list() 가 mod_chinese 포함해 재빌드.
 *
 * usage: node scripts/upload-chinese-phonics-audio.mjs [--dry-run]
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry-run');

// .env 로드
const envText = await readFile(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const SRC_DIR =
  'D:/탱고 데이터/컨텐츠/12. 중국 판매용 콘텐츠 개발(2022.01.04~)/2. 중국어 콘텐츠/1. 음원/0.dump/mod_cn(최종07.04)';

// 声韵母表: base(핵 모음, v=ü) → 4성 부호
const TONE_MARKS = {
  a: ['ā', 'á', 'ǎ', 'à'],
  o: ['ō', 'ó', 'ǒ', 'ò'],
  e: ['ē', 'é', 'ě', 'è'],
  i: ['ī', 'í', 'ǐ', 'ì'],
  u: ['ū', 'ú', 'ǔ', 'ù'],
  v: ['ǖ', 'ǘ', 'ǚ', 'ǜ'],
  ma: ['mā', 'má', 'mǎ', 'mà'],
};

// 업로드 대상 = {소스파일, 사운드키}. L1 = 단운모 6 × 4성 + ma 4성 = 28.
const targets = [];
for (const [base, marks] of Object.entries(TONE_MARKS)) {
  for (let t = 1; t <= 4; t++) {
    targets.push({ src: `${base}-${t}.mp3`, sound: marks[t - 1].normalize('NFC') });
  }
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
const publicUrl = process.env.R2_PUBLIC_URL;

if (!existsSync(SRC_DIR)) {
  console.error(`소스 폴더 없음: ${SRC_DIR}`);
  process.exit(1);
}

const tempDir = await mkdtemp(path.join(tmpdir(), 'zh-phonics-'));
let ok = 0;
let srcBytes = 0;
let outBytes = 0;
try {
  for (const { src, sound } of targets) {
    const srcPath = path.join(SRC_DIR, src);
    if (!existsSync(srcPath)) {
      console.warn(`  skip (소스 없음): ${src}`);
      continue;
    }
    const outPath = path.join(tempDir, `${src}.out.mp3`);
    await execFileAsync(ffmpegPath, ['-i', srcPath, '-ac', '1', '-b:a', '64k', '-y', outPath], {
      timeout: 30000,
    });
    const buf = await readFile(outPath);
    srcBytes += (await readFile(srcPath)).length;
    outBytes += buf.length;
    const key = `phonics-library/mod_chinese/${sound}.mp3`;
    if (!DRY) {
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: buf,
          ContentType: 'audio/mpeg',
          CacheControl: 'public, max-age=31536000, immutable',
        })
      );
    }
    ok++;
    console.log(`  ${DRY ? '[dry] ' : ''}${src} → mod_chinese/${sound}.mp3 (${buf.length}B)`);
  }

  if (!DRY && ok > 0) {
    // 인덱스 무효화 → 다음 list() 가 mod_chinese 포함해 재빌드.
    await s3
      .send(new DeleteObjectCommand({ Bucket: bucket, Key: 'phonics-library/_index.json' }))
      .catch(() => {});
    console.log('  _index.json 삭제(재빌드 유도)');
  }
} finally {
  await rm(tempDir, { recursive: true, force: true }).catch(() => {});
}

console.log(
  `\n${DRY ? '[dry-run] ' : ''}업로드 ${ok}/${targets.length} | 원본 ${(srcBytes / 1024).toFixed(0)}KB → mono64k ${(outBytes / 1024).toFixed(0)}KB`
);
if (!DRY && ok > 0) console.log(`예: ${publicUrl}/phonics-library/mod_chinese/${targets[0].sound}.mp3`);
