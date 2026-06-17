#!/usr/bin/env node
/**
 * 어떤 JSON 에서도 참조되지 않는 원본 래스터(jpg/jpeg/png)를 R2 에서 삭제.
 *
 * 안전 설계:
 * - 참조 수집: 버킷의 *모든* .json 을 파싱 후 재귀 탐색으로 등장하는 모든 이미지 URL → key.
 *   - active  = storybook-/books- 등 일반 콘텐츠 JSON (운영 중)
 *   - archive = _backup/ · _migrations/ · 기타 _ 로 시작 (과거 스냅샷)
 * - 분류 (jpg/jpeg/png 객체):
 *   - active 참조        → 보존 (절대 삭제 안 함)
 *   - archive 만 참조     → 백업/마이그에만 존재 (운영 미사용) — 기본 보존, --include-archive 로 삭제
 *   - 무참조(고아)        → webp 대체본 있으면 safe, 없으면 no-webp
 * - 삭제 대상:
 *   - 기본          = 고아 + webp존재 (safe)
 *   - --include-no-webp  = 고아 전부
 *   - --include-archive  = archive-only 도 포함
 * - 기본 dry-run / --apply 로만 실제 삭제. 삭제 목록은 로그파일에 기록.
 */
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3';
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
const INCLUDE_NO_WEBP = process.argv.includes('--include-no-webp');
const INCLUDE_ARCHIVE = process.argv.includes('--include-archive');

const urlToKey = (u) => {
  try {
    return decodeURIComponent(new URL(u).pathname.replace(/^\//, ''));
  } catch {
    return null;
  }
};
const isRaster = (k) => /\.(jpe?g|png)$/i.test(k.split('?')[0]);
const isWebp = (k) => /\.webp$/i.test(k);
const isArchiveJson = (k) => k.startsWith('_'); // _backup/ _migrations/ _index ...
const fmt = (b) =>
  b == null ? '—' : b >= 1e9 ? (b / 1e9).toFixed(2) + 'GB' : b >= 1e6 ? (b / 1e6).toFixed(1) + 'MB' : (b / 1e3).toFixed(0) + 'KB';

function collectRefs(node, set) {
  if (typeof node === 'string') {
    if (/^https?:\/\//.test(node) && isRaster(node)) {
      const k = urlToKey(node);
      if (k) set.add(k);
    }
  } else if (Array.isArray(node)) {
    for (const x of node) collectRefs(x, set);
  } else if (node && typeof node === 'object') {
    for (const x of Object.values(node)) collectRefs(x, set);
  }
}

async function listAll() {
  const all = [];
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, ContinuationToken: token })
    );
    for (const o of out.Contents ?? []) all.push(o);
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return all;
}

const all = await listAll();
const jsonObjs = all.filter((o) => o.Key.endsWith('.json'));
const rasterObjs = all.filter((o) => isRaster(o.Key));
const webpKeys = new Set(all.filter((o) => isWebp(o.Key)).map((o) => o.Key));
console.log(`버킷 ${all.length} 객체 | JSON ${jsonObjs.length} | 원본(jpg/png) ${rasterObjs.length} | webp ${webpKeys.size}`);

// 참조 수집: active / archive 분리
const refActive = new Set();
const refArchive = new Set();
let idx = 0;
let parsed = 0;
async function loader() {
  while (idx < jsonObjs.length) {
    const o = jsonObjs[idx++];
    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: o.Key }));
      const j = JSON.parse(await out.Body.transformToString('utf-8'));
      collectRefs(j, isArchiveJson(o.Key) ? refArchive : refActive);
      parsed++;
    } catch (e) {
      console.log('ERR json', o.Key, e.message);
    }
  }
}
console.log(`모든 JSON 파싱 → 참조 수집 (active vs archive)...`);
await Promise.all(Array.from({ length: 16 }, loader));
console.log(`파싱 ${parsed}/${jsonObjs.length} | active참조 ${refActive.size} | archive전용참조 ${[...refArchive].filter((k) => !refActive.has(k)).length}`);

// 분류
const referencedActive = [];
const archiveOnly = [];
const orphanSafe = [];
const orphanNoWebp = [];
for (const o of rasterObjs) {
  if (refActive.has(o.Key)) {
    referencedActive.push(o);
  } else if (refArchive.has(o.Key)) {
    archiveOnly.push(o);
  } else {
    const webpVariant = o.Key.replace(/\.(jpe?g|png)$/i, '.webp');
    if (webpKeys.has(webpVariant)) orphanSafe.push(o);
    else orphanNoWebp.push(o);
  }
}
const sum = (arr) => arr.reduce((s, o) => s + (o.Size ?? 0), 0);

console.log(`\n=== 원본 래스터(jpg/png) ${rasterObjs.length}개 / ${fmt(sum(rasterObjs))} 분류 ===`);
console.log(`  active 참조(보존):       ${String(referencedActive.length).padStart(5)}개  ${fmt(sum(referencedActive))}`);
console.log(`  archive 전용(백업만):     ${String(archiveOnly.length).padStart(5)}개  ${fmt(sum(archiveOnly))}  ${INCLUDE_ARCHIVE ? '★삭제포함' : '(기본 보존)'}`);
console.log(`  고아 + webp존재:          ${String(orphanSafe.length).padStart(5)}개  ${fmt(sum(orphanSafe))}  ★삭제`);
console.log(`  고아 + webp없음:          ${String(orphanNoWebp.length).padStart(5)}개  ${fmt(sum(orphanNoWebp))}  ${INCLUDE_NO_WEBP ? '★삭제포함' : '(기본 보존)'}`);

// 경로 패턴(prefix) 분포 — 어느 영역의 잔재인지 파악
const grpPrefix = (arr) => {
  const g = {};
  for (const o of arr) {
    const m = o.Key.match(/^([a-zA-Z_]+[-/]?)/);
    const p = m ? m[1] : '?';
    g[p] = (g[p] || 0) + 1;
  }
  return Object.entries(g).sort((a, b) => b[1] - a[1]).map(([p, n]) => `${p}×${n}`).join('  ');
};
console.log(`\n  고아+webp없음 경로분포: ${grpPrefix(orphanNoWebp)}`);
console.log(`  고아+webp없음 샘플:`);
for (const o of orphanNoWebp.slice(0, 12)) console.log(`    ${o.Key}`);
console.log(`  archive전용 경로분포: ${grpPrefix(archiveOnly)}`);

const toDelete = [
  ...orphanSafe,
  ...(INCLUDE_NO_WEBP ? orphanNoWebp : []),
  ...(INCLUDE_ARCHIVE ? archiveOnly : []),
];
console.log(`\n삭제 대상 합계: ${toDelete.length}개  ${fmt(sum(toDelete))}`);

const logPath = path.join(__dirname, `_orphan-delete-${APPLY ? 'applied' : 'dryrun'}.log`);
fs.writeFileSync(
  logPath,
  [
    `# ${APPLY ? 'APPLIED' : 'DRY-RUN'}  include-no-webp=${INCLUDE_NO_WEBP} include-archive=${INCLUDE_ARCHIVE}`,
    `# active참조보존 ${referencedActive.length} | archiveOnly ${archiveOnly.length} | orphanSafe ${orphanSafe.length} | orphanNoWebp ${orphanNoWebp.length}`,
    '',
    ...toDelete.map((o) => `${o.Key}\t${o.Size}`),
  ].join('\n'),
  'utf-8'
);
console.log(`삭제 목록 기록: ${path.relative(process.cwd(), logPath)}`);

if (!APPLY) {
  console.log(`\n👀 dry-run. 실제 삭제: node scripts/delete-orphan-raster.mjs --apply${INCLUDE_NO_WEBP ? ' --include-no-webp' : ''}${INCLUDE_ARCHIVE ? ' --include-archive' : ''}`);
} else {
  console.log(`\n🗑️  삭제 중...`);
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 1000) {
    const batch = toDelete.slice(i, i + 1000);
    const out = await s3.send(
      new DeleteObjectsCommand({
        Bucket: bucket,
        Delete: { Objects: batch.map((o) => ({ Key: o.Key })), Quiet: true },
      })
    );
    deleted += batch.length - (out.Errors?.length ?? 0);
    if (out.Errors?.length) for (const e of out.Errors) console.log('  DELERR', e.Key, e.Message);
    console.log(`  ${Math.min(i + 1000, toDelete.length)}/${toDelete.length}`);
  }
  console.log(`\n✅ 삭제 완료: ${deleted}개  ${fmt(sum(toDelete))} 확보`);
}
