#!/usr/bin/env node
// styleAssets 그림체 버킷 간 표지 오염 정리.
// 한 그림체 칸(primaryCoverByLang[lang])에 다른 그림체의 표지가 잘못 저장된 항목 제거.
// 제거하면 BookDetailPage 폴백이 그 그림체의 진짜 coverImage(있으면) 로, 없으면 placeholder 로 복구.
//
// 안전장치: 현재 값이 expected 오염 파일명을 포함할 때만 제거 (멱등 + 데이터 변동 감지).
// 기본 dry-run. 실제 저장은 --apply.
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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
const short = (u) => (typeof u === 'string' ? u.split('/').pop() : u ?? 'placeholder(표지없음)');

// 검증 완료한 오염 항목 (그림체 칸 → 실제로는 다른 그림체 표지)
const PATCHES = [
  { book: '1777276113613', style: 'pixar-3d',   lang: 'ko', expect: '1777361771600', note: '종이공예' },
  { book: '1777276113613', style: 'pixar-3d',   lang: 'en', expect: '1777362113060', note: '종이공예' },
  { book: '1777274769616', style: 'pixar-3d',   lang: 'ko', expect: '1777857297216', note: '수채화' },
  { book: '1777274769616', style: 'pixar-3d',   lang: 'en', expect: '1777364488533', note: '종이공예' },
  { book: '1777277215628', style: 'watercolor', lang: 'en', expect: '1777361702427', note: '종이공예' },
  { book: '1772510956605', style: 'watercolor', lang: 'ko', expect: '1776864070165', note: '종이공예' },
];

const byBook = {};
for (const p of PATCHES) (byBook[p.book] ??= []).push(p);

for (const [bookId, patches] of Object.entries(byBook)) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: `storybook-${bookId}.json` }));
  const rawText = await out.Body.transformToString();
  const sb = JSON.parse(rawText);
  console.log(`\n=== ${sb.title} (${bookId}) | artStyle=${sb.artStyle} | availableStyles=${JSON.stringify(sb.availableStyles)} ===`);
  let changed = false;
  const affected = new Set();
  for (const p of patches) {
    const pcbl = sb.styleAssets?.[p.style]?.primaryCoverByLang;
    const cur = pcbl?.[p.lang];
    if (!cur) { console.log(`  [${p.style}.${p.lang}] 이미 정리됨(없음) — skip`); continue; }
    if (!String(cur).includes(p.expect)) {
      console.log(`  [${p.style}.${p.lang}] ⚠ 값 불일치 cur=${short(cur)} (expect ~${p.expect}) — SKIP(안전)`);
      continue;
    }
    delete pcbl[p.lang];
    changed = true;
    affected.add(p.style);
    console.log(`  [${p.style}.${p.lang}] REMOVE ${short(cur)} (=${p.note})`);
  }
  // 영향 그림체별 최종 표지 (BookDetailPage pickCover 시뮬레이션)
  for (const style of affected) {
    const isActive = style === sb.artStyle;
    const sa = sb.styleAssets?.[style];
    const pick = (l) => sa?.primaryCoverByLang?.[l] ?? (isActive ? sb.primaryCoverByLang?.[l] : undefined);
    const inMenu = (sb.availableStyles ?? []).includes(style);
    const finalCover = pick('ko') ?? pick('en') ?? sa?.coverImage ?? (isActive ? sb.coverImage : undefined);
    console.log(`     → [${style}] 정리 후 표지: ${short(finalCover)}  ${inMenu ? '(학습자 노출 O)' : '(노출 목록 밖 orphan)'}`);
  }
  if (changed && APPLY) {
    const backupDir = path.join(__dirname, '_backup');
    fs.mkdirSync(backupDir, { recursive: true });
    fs.writeFileSync(path.join(backupDir, `storybook-${bookId}.json`), rawText);
    sb.updatedAt = new Date().toISOString();
    await s3.send(new PutObjectCommand({
      Bucket: bucket,
      Key: `storybook-${bookId}.json`,
      Body: JSON.stringify(sb),
      ContentType: 'application/json',
    }));
    console.log(`  ✅ R2 저장 완료 (원본 백업: scripts/_backup/storybook-${bookId}.json)`);
  } else if (changed) {
    console.log('  (dry-run — 저장 안 함, --apply 로 실제 적용)');
  } else {
    console.log('  변경 없음');
  }
}
console.log(`\n[${APPLY ? 'APPLIED' : 'DRY-RUN'}] 완료`);
