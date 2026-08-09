#!/usr/bin/env node
/**
 * 탱고 유닛송(찬트) → R2 `phonics-chant/` 업로드 (멱등). 각 단원 마무리 「🎵 노래」 스텝 음원.
 *
 * 🔴 탱고 교안의 마무리 = 찬트(성조송·운모송·성모송·병음조합송·복운모송·비운모송·단어송). 전문 녹음·반주가
 *    이미 있다(`/tangoch/{sd,ym,sm,py,fy,by,word1,word2}/`). 음악이라 mono 64k 가 아니라 **96k 스테레오**로 재인코딩.
 *
 * 사용:
 *   node packages/server/scripts/upload-chinese-chants.mjs            # dry-run + 유닛→URL 맵 출력
 *   node packages/server/scripts/upload-chinese-chants.mjs --apply
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadEnv } from './translation-core.mjs';

const execFileAsync = promisify(execFile);
const SRC =
  'D:/탱고 데이터/컨텐츠/12. 중국 판매용 콘텐츠 개발(2022.01.04~)/2. 중국어 콘텐츠/1. 음원/1. 최종 음원(09.13)/tangoch(220913_cei 추가)';
const OUT_PREFIX = 'phonics-chant/';

// 단원 → 찬트 파일(폴더/파일, 확장자 생략). 여러 곡이면 순서대로 재생. basename 이 R2 키(phonics-chant/{basename}.mp3).
const UNIT_CHANTS = {
  'zh-l1-u01': ['sd/sd_song'],
  'zh-l1-u02': ['ym/ym_song_1a', 'ym/ym_song_2o', 'ym/ym_song_3e'],
  'zh-l1-u03': ['ym/ym_song_4i', 'ym/ym_song_5u', 'ym/ym_song_6v'],
  'zh-l2-u01': ['sm/sm_song_1bpmf'],
  'zh-l2-u02': ['sm/sm_song_2dtnl'],
  'zh-l2-u03': ['sm/sm_song_3gkh'],
  'zh-l2-u04': ['sm/sm_song_4jqx'],
  'zh-l2-u05': ['sm/sm_song_6zcs'],
  'zh-l2-u06': ['sm/sm_song_5zhchshr'],
  'zh-l3-u01': ['py/py_song_witha'],
  'zh-l3-u02': ['py/py_song_witha'],
  'zh-l3-u03': ['py/py_song_witha'],
  'zh-l3-u04': ['py/py_song_withv'],
  'zh-l4-u01': ['word1/word1_song'],
  'zh-l4-u02': ['word1/word1_song'],
  'zh-l4-u03': ['word1/word1_song'],
  'zh-l4-u04': ['word1/word1_song'],
  'zh-l5-u01': ['fy/fy_song_1aieiui_1'],
  'zh-l5-u02': ['fy/fy_song_2aoouiu_1'],
  'zh-l5-u03': ['fy/fy_song_3ieveer_1'],
  'zh-l6-u01': ['by/by_song_1n_1'],
  'zh-l6-u02': ['by/by_song_1n_1'],
  'zh-l6-u03': ['by/by_song_2ng_1'],
  'zh-l6-u04': ['by/by_song_2ng_1'],
  'zh-l8-u01': ['word2/word2_song'],
  'zh-l8-u02': ['word2/word2_song'],
  'zh-l8-u03': ['word2/word2_song'],
  'zh-l8-u04': ['word2/word2_song'],
  'zh-l8-u05': ['word2/word2_song'],
  'zh-l8-u06': ['word2/word2_song'],
  'zh-l8-u07': ['word2/word2_song'],
  'zh-l8-u08': ['word2/word2_song'],
};

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
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

async function exists(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch {
    return false;
  }
}

const distinct = [...new Set(Object.values(UNIT_CHANTS).flat())];
console.log(`${DRY ? '👀 DRY-RUN' : '✏️  APPLY'} — 찬트 ${distinct.length}곡, 단원 ${Object.keys(UNIT_CHANTS).length}개\n`);

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'zh-chant-'));
let ok = 0,
  skip = 0,
  miss = 0,
  outBytes = 0;
for (const rel of distinct) {
  const base = rel.split('/').pop();
  const key = `${OUT_PREFIX}${base}.mp3`;
  const srcPath = path.join(SRC, `${rel}.mp3`);
  if (!fs.existsSync(srcPath)) {
    miss++;
    console.log(`  [없음] ${rel}`);
    continue;
  }
  if (await exists(key)) {
    skip++;
    continue;
  }
  if (DRY) {
    ok++;
    console.log(`  ${base}`);
    continue;
  }
  const outPath = path.join(tmp, `${base}.mp3`);
  await execFileAsync(ffmpegPath, ['-i', srcPath, '-ac', '2', '-b:a', '96k', '-y', outPath]);
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
  console.log(`  ✅ ${base} (${(body.length / 1024).toFixed(0)}KB)`);
}
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`\n업로드 ${ok} · skip ${skip} · 없음 ${miss}${DRY ? '' : ` | 96k ${(outBytes / 1024 / 1024).toFixed(1)}MB`}`);

// 클라 chant 맵(unit → URL[]) 출력 — chinese-phonics-units.ts CHANT_URLS 에 붙인다.
const map = Object.fromEntries(
  Object.entries(UNIT_CHANTS).map(([u, rels]) => [
    u,
    rels.map((r) => `${PUBLIC_URL}/${OUT_PREFIX}${r.split('/').pop()}.mp3`),
  ])
);
fs.writeFileSync(path.join(tmp.replace(/zh-chant-\w+$/, ''), 'zh_chant_map.json'), JSON.stringify(map, null, 2));
console.log('\n=== 클라 CHANT_URLS 맵 ===');
console.log(JSON.stringify(map, null, 0));
