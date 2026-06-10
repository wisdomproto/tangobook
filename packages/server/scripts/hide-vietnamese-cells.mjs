#!/usr/bin/env node
/**
 * 전체 동화책(languages 에 'vi' 포함)의 모든 그림체에 대해 베트남어(vi) 셀을 비공개로 마킹.
 * publicByStyleLang[style].vi = false (기존 ko/en 등 값 보존). isPublic 은 모든 셀이 false 일 때만 false.
 *
 * 그림체 집합 = availableStyles ∪ artStyle ∪ styleAssets 키 (학습자 노출 + orphan 모두).
 * 멱등(이미 vi=false 면 skip). 기본 dry-run / --apply (원본 _backup-vi 백업 후 저장).
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

// 1. 전수 스캔 (key 수집)
const keys = [];
let token;
do {
  const out = await s3.send(
    new ListObjectsV2Command({ Bucket: bucket, Prefix: 'storybook-', ContinuationToken: token })
  );
  for (const o of out.Contents ?? []) if (o.Key.endsWith('.json')) keys.push(o.Key);
  token = out.IsTruncated ? out.NextContinuationToken : undefined;
} while (token);

const backupDir = path.join(__dirname, '_backup-vi');
if (APPLY) fs.mkdirSync(backupDir, { recursive: true });

let scanned = 0;
let noVi = 0;
const changed = [];
let applied = 0;
let idx = 0;

async function worker() {
  while (idx < keys.length) {
    const key = keys[idx++];
    try {
      const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
      const rawText = await out.Body.transformToString();
      const sb = JSON.parse(rawText);
      scanned++;
      const langs = sb.languages ?? [];
      if (!langs.includes('vi')) {
        noVi++;
        continue;
      }
      const styles = [
        ...new Set(
          [
            ...(sb.availableStyles ?? []),
            sb.artStyle,
            ...Object.keys(sb.styleAssets ?? {}),
          ].filter(Boolean)
        ),
      ];
      if (styles.length === 0) continue;

      const pbsl = sb.publicByStyleLang ?? {};
      let ch = false;
      for (const style of styles) {
        if (pbsl[style]?.vi !== false) {
          pbsl[style] = { ...(pbsl[style] ?? {}), vi: false };
          ch = true;
        }
      }
      if (!ch) continue;

      // isPublic 동기화 — 모든 (그림체 × 언어) 셀이 false 면 책도 비공개.
      const allFalse = styles.every((s) => langs.every((l) => pbsl[s]?.[l] === false));
      const nextPublic = !allFalse;

      changed.push({ id: sb.id, title: sb.title, styles: styles.length, isPublic: nextPublic });

      if (APPLY) {
        sb.publicByStyleLang = pbsl;
        sb.isPublic = nextPublic;
        sb.updatedAt = new Date().toISOString();
        fs.writeFileSync(path.join(backupDir, `storybook-${sb.id}.json`), rawText);
        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: JSON.stringify(sb),
            ContentType: 'application/json',
          })
        );
        applied++;
      }
    } catch (e) {
      console.log('ERR', key, e.message);
    }
  }
}
await Promise.all(Array.from({ length: 12 }, worker));

console.log(`\n[${APPLY ? 'APPLY' : 'dry-run'}] scanned ${scanned} | vi 없음 ${noVi} | 변경 대상 ${changed.length}`);
console.log('샘플 (처음 12):');
for (const c of changed.slice(0, 12)) {
  console.log(`  ${c.id} | ${c.title} | 그림체 ${c.styles}개 vi=false | isPublic=${c.isPublic}`);
}
if (APPLY) console.log(`\n✅ 적용 ${applied} 권 (원본 백업: scripts/_backup-vi/)`);
else console.log(`\n실제 적용: node scripts/hide-vietnamese-cells.mjs --apply`);
