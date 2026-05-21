#!/usr/bin/env node
/**
 * 영어 파닉스 Book 1 학습카드 일러스트 (PNG/JPG) 를 WebP 로 변환 후 원본 R2 객체 삭제.
 *
 * 대상: en-b1-u01 ~ u08 의 `phonicsLesson.blending[i].illustrationUrl` (그리고 history).
 *      `.png` / `.jpg` / `.jpeg` 만 변환. 이미 `.webp` 면 skip.
 *
 * 처리 흐름 (file 단위):
 *   1. R2 GetObject (원본 png)
 *   2. python Pillow webp 변환 (quality 85, method 6)
 *   3. R2 PutObject (.webp 키)
 *   4. storybook json 의 URL 교체
 *   5. R2 DeleteObject (원본 png)
 *   서버 PUT 은 unit 단위로 모아서 한 번에.
 *
 * 사용:
 *   node scripts/convert-phonics-book1-illustrations-to-webp.mjs            # dry-run
 *   node scripts/convert-phonics-book1-illustrations-to-webp.mjs --apply
 */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const API_BASE = process.env.API_BASE || 'http://localhost:3500';
const APPLY = process.argv.includes('--apply');
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;
const BUCKET = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const UNIT_IDS = [
  'en-b1-u01',
  'en-b1-u02',
  'en-b1-u03',
  'en-b1-u04',
  'en-b1-u05',
  'en-b1-u06',
  'en-b1-u07',
  'en-b1-u08',
];

const PY = `
from PIL import Image
import sys
src, dst = sys.argv[1], sys.argv[2]
img = Image.open(src)
if img.mode == 'P' and 'transparency' in img.info:
    img = img.convert('RGBA')
img.save(dst, 'webp', quality=85, method=6)
`;

const PY_BIN = process.platform === 'win32' ? 'python' : 'python3';

function urlToKey(url) {
  if (!url || !url.startsWith(R2_PUBLIC_URL + '/')) return null;
  return url.slice(R2_PUBLIC_URL.length + 1);
}

function isConvertible(url) {
  return !!url && /\.(png|jpe?g)(\?|$)/i.test(url);
}

async function downloadToTemp(key, ext) {
  const r = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
  const bytes = Buffer.from(await r.Body.transformToByteArray());
  const tmpFile = path.join(tmpdir(), `phonics-conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`);
  fs.writeFileSync(tmpFile, bytes);
  return tmpFile;
}

async function getBook(id) {
  const r = await fetch(`${API_BASE}/api/storybooks/${id}`);
  if (!r.ok) throw new Error(`GET ${id}: ${r.status}`);
  return (await r.json()).data;
}
async function putBook(sb) {
  const r = await fetch(`${API_BASE}/api/storybooks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ storybook: sb }),
  });
  if (!r.ok) {
    const t = await r.text();
    throw new Error(`PUT ${sb.id}: ${r.status} ${t}`);
  }
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}  · API: ${API_BASE}\n`);

let totalConvert = 0;
let totalSavedBytes = 0;
let totalFailed = 0;
const fails = [];

for (const id of UNIT_IDS) {
  const sb = await getBook(id);
  const blending = sb.phonicsLesson?.blending ?? [];
  // 변환 대상 수집 — illustrationUrl + history (PNG/JPG 만)
  const tasks = []; // { writeBack: (newUrl) => void, oldUrl, oldKey, ext }
  for (let i = 0; i < blending.length; i++) {
    const b = blending[i];
    const fields = ['illustrationUrl', 'exampleWordImageUrl'];
    for (const f of fields) {
      if (isConvertible(b[f])) {
        const oldKey = urlToKey(b[f]);
        if (!oldKey) continue;
        const ext = oldKey.match(/\.(png|jpe?g)$/i)[1].toLowerCase();
        tasks.push({
          oldUrl: b[f],
          oldKey,
          ext,
          writeBack: (newUrl) => {
            blending[i][f] = newUrl;
          },
        });
      }
    }
    const histFields = ['illustrationHistory', 'exampleWordImageHistory'];
    for (const f of histFields) {
      const arr = b[f] ?? [];
      for (let k = 0; k < arr.length; k++) {
        if (isConvertible(arr[k])) {
          const oldKey = urlToKey(arr[k]);
          if (!oldKey) continue;
          const ext = oldKey.match(/\.(png|jpe?g)$/i)[1].toLowerCase();
          tasks.push({
            oldUrl: arr[k],
            oldKey,
            ext,
            writeBack: (newUrl) => {
              blending[i][f][k] = newUrl;
            },
          });
        }
      }
    }
  }

  console.log(`[${id}] 변환 대상: ${tasks.length}건`);
  if (tasks.length === 0) {
    console.log(`  (스킵)\n`);
    continue;
  }
  if (!APPLY) {
    for (const t of tasks.slice(0, 3)) {
      console.log(`    [${t.ext}] ...${t.oldKey.slice(-60)}`);
    }
    if (tasks.length > 3) console.log(`    ... +${tasks.length - 3}건`);
    console.log();
    continue;
  }

  let okCount = 0;
  for (const t of tasks) {
    try {
      // 1. 원본 다운로드
      const srcTmp = await downloadToTemp(t.oldKey, t.ext);
      const dstTmp = srcTmp.replace(new RegExp(`\\.${t.ext}$`), '.webp');
      // 2. webp 변환
      const py = spawnSync(PY_BIN, ['-c', PY, srcTmp, dstTmp], { encoding: 'utf-8' });
      if (py.status !== 0) {
        throw new Error(`Pillow 실패: ${py.stderr.slice(0, 200)}`);
      }
      const oldBytes = fs.statSync(srcTmp).size;
      const newBytes = fs.statSync(dstTmp).size;
      const webpBuffer = fs.readFileSync(dstTmp);
      const newKey = t.oldKey.replace(new RegExp(`\\.${t.ext}$`), '.webp');
      // 3. R2 PUT (.webp)
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: newKey,
          Body: webpBuffer,
          ContentType: 'image/webp',
        })
      );
      // 4. JSON URL 갱신
      const newUrl = `${R2_PUBLIC_URL}/${newKey}`;
      t.writeBack(newUrl);
      // 5. 원본 삭제
      await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: t.oldKey }));
      // 6. tmp 정리
      try { fs.unlinkSync(srcTmp); fs.unlinkSync(dstTmp); } catch {}

      totalConvert++;
      totalSavedBytes += oldBytes - newBytes;
      okCount++;
      const ratio = ((1 - newBytes / oldBytes) * 100).toFixed(0);
      console.log(`  ✓ ${path.basename(t.oldKey)} → .webp  (${(oldBytes / 1024).toFixed(0)}KB → ${(newBytes / 1024).toFixed(0)}KB, ${ratio}% ↓)`);
    } catch (e) {
      totalFailed++;
      fails.push({ id, key: t.oldKey, err: e.message });
      console.error(`  ✗ ${path.basename(t.oldKey)}: ${e.message}`);
    }
  }

  if (okCount > 0) {
    sb.updatedAt = new Date().toISOString();
    try {
      await putBook(sb);
      console.log(`  💾 storybook 저장 (${okCount}건 URL 갱신)\n`);
    } catch (e) {
      console.error(`  ✗ storybook 저장 실패: ${e.message}\n`);
    }
  }
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
if (APPLY) {
  console.log(`✓ 변환: ${totalConvert}건 · 절감: ${(totalSavedBytes / 1024 / 1024).toFixed(2)} MB · 실패: ${totalFailed}건`);
  if (fails.length > 0) {
    console.log(`\n실패 목록:`);
    fails.forEach((f) => console.log(`  ${f.id} / ${f.key}: ${f.err}`));
  }
} else {
  console.log(`DRY-RUN 종료. 실 적용은 \`--apply\``);
}
