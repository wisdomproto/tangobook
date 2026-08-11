#!/usr/bin/env node
/**
 * 병음(拼音) 원어민 녹음 **전체** → R2 `phonics-library/mod_chinese/` 업로드.
 *
 * 소스 = `mod_cn(최종07.04)` 덤프(声韵母表 SSOT). 파일명 = `{성모+핵모음}-{성조}{운미}.mp3`
 * (성조 숫자를 핵 모음 뒤에 삽입, v=ü). 사운드 키 = 성조부호 병음(NFC) — 클라 `getChineseSyllableUrl` 조회.
 *   ba-1 → bā · ba-1ng → bāng · be-1i → bēi · jia-1o → jiāo · dui-4 → duì · v-1 → ǖ · jv-1 → jū · lv-3 → lǚ
 *
 * 🔴 사용자 지시(2026-08-08): "탱고 데이터에 있는걸로 다 교체" — L1 28개가 아니라 mod_cn 전 음절(성조 1~4)을
 *    올려 병음 커리큘럼 전 범위를 native 녹음으로 덮는다. 성조 5(경성)·6(3+3 변조)·성조 없는 파일은 제외
 *    (커리큘럼은 성조 1~4). 바 성조 카드(`-1.mp3`)도 제외.
 * 🔴 원본 stereo 200kbps → ffmpeg mono 64k 재인코딩(런타임 concat 규격). 업로드 후 `_index.json` 삭제 → 재빌드.
 *
 * usage: node scripts/upload-chinese-phonics-audio.mjs [--dry-run] [--limit N]
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile, readdir, mkdtemp, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ffmpegPath from 'ffmpeg-static';

const execFileAsync = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DRY = process.argv.includes('--dry-run');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]) || Infinity;

// .env 로드
const envText = await readFile(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const SRC_DIR =
  'D:/탱고 데이터/컨텐츠/12. 중국 판매용 콘텐츠 개발(2022.01.04~)/2. 중국어 콘텐츠/1. 음원/0.dump/mod_cn(최종07.04)';

// 성조부호 (precomposed, 1~4성)
const MARK = {
  a: 'āáǎà',
  o: 'ōóǒò',
  e: 'ēéěè',
  i: 'īíǐì',
  u: 'ūúǔù',
  v: 'ǖǘǚǜ', // ü (l/n 뒤)
  vj: 'ūúǔù', // ü after j/q/x → u 로 표기
};

/**
 * 파일명(확장자 제외) → 성조부호 병음 키. 성조 1~4 음절만, 아니면 null.
 * 규칙: 성조 위치 = a > o > e > (i/u/ü 중 마지막). ü(v) = j/q/x 뒤면 'u', 아니면 'ü'.
 */
function deriveKey(fn) {
  const m = fn.match(/^([a-z]+)-([1-6])([a-z]*)$/);
  if (!m) return null; // 바 성조 카드(-1) · 성조 없는 파일 등
  const [, pre, toneStr, post] = m;
  const tone = Number(toneStr);
  if (tone < 1 || tone > 4) return null; // 경성(5)·변조(6) 제외
  const base = pre + post; // 성조 없는 음절(v 포함 가능)
  const jqx = /^[jqx]/.test(base);
  // 성조 target 모음 index
  let ti = base.indexOf('a');
  if (ti < 0) ti = base.indexOf('o');
  if (ti < 0) ti = base.indexOf('e');
  if (ti < 0) for (let i = base.length - 1; i >= 0; i--) if ('iuv'.includes(base[i])) { ti = i; break; } // prettier-ignore
  if (ti < 0) return null;
  let out = '';
  for (let i = 0; i < base.length; i++) {
    const c = base[i];
    if (i === ti) out += c === 'v' ? MARK[jqx ? 'vj' : 'v'][tone - 1] : MARK[c][tone - 1];
    else out += c === 'v' ? (jqx ? 'u' : 'ü') : c;
  }
  return out.normalize('NFC');
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

const files = (await readdir(SRC_DIR)).filter((f) => f.toLowerCase().endsWith('.mp3'));
const targets = [];
const seen = new Set();
for (const f of files) {
  const key = deriveKey(f.slice(0, -4));
  if (!key) continue;
  if (seen.has(key)) continue; // 같은 병음 중복(예외) — 첫 파일만
  seen.add(key);
  targets.push({ src: f, sound: key });
}
targets.sort((a, b) => a.sound.localeCompare(b.sound));
console.log(`대상 ${targets.length}개 (mp3 ${files.length}개 중, 성조 1~4 음절)`);
console.log('샘플:', targets.slice(0, 12).map((t) => `${t.src}→${t.sound}`).join(' · ')); // prettier-ignore

const tempDir = await mkdtemp(path.join(tmpdir(), 'zh-phonics-'));
let ok = 0;
let outBytes = 0;
try {
  for (const { src, sound } of targets) {
    if (ok >= LIMIT) break;
    const srcPath = path.join(SRC_DIR, src);
    const key = `phonics-library/mod_chinese/${sound}.mp3`;
    if (DRY) {
      ok++;
      console.log(`  [dry] ${src} → mod_chinese/${sound}.mp3`);
      continue;
    }
    const outPath = path.join(tempDir, `out.mp3`);
    await execFileAsync(ffmpegPath, ['-i', srcPath, '-ac', '1', '-b:a', '64k', '-y', outPath], {
      timeout: 30000,
    });
    const buf = await readFile(outPath);
    outBytes += buf.length;
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buf,
        ContentType: 'audio/mpeg',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
    ok++;
    if (ok % 100 === 0) console.log(`  ...${ok}/${targets.length}`);
  }
  if (!DRY && ok > 0) {
    await s3
      .send(new DeleteObjectCommand({ Bucket: bucket, Key: 'phonics-library/_index.json' }))
      .catch(() => {});
    console.log('  _index.json 삭제(재빌드 유도)');
  }
} finally {
  await rm(tempDir, { recursive: true, force: true }).catch(() => {});
}

console.log(
  `\n${DRY ? '[dry-run] ' : ''}업로드 ${ok}/${targets.length}${DRY ? '' : ` | mono64k ${(outBytes / 1024 / 1024).toFixed(1)}MB`}`
);
if (!DRY && ok > 0) console.log(`예: ${publicUrl}/phonics-library/mod_chinese/${targets[0].sound}.mp3`);
