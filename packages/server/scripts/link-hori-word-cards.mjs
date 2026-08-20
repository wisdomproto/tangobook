#!/usr/bin/env node
/**
 * 호리 3라인(생활동화·유치원동화·세상 탐험) 낱말 카드(니들펠트) → R2 storybook 연동 (멱등).
 *
 *   소스: comfy_test/outputs/hori-wordcards-webp/<낱말>.webp  (w800, 로컬 생성물)
 *   맵  : scripts/_data/hori-cards-map.json  ({ en, bookWords, gloss })
 *   대상: storybook-<id>.json 의 key_objects[] + keyObjectImages[]
 *
 * 대부분 호리 책엔 key_objects 가 없다(8/12 에 R2 적용을 미뤄둠) → 없으면 만든다.
 *   key_objects: { name: 영어, nameEn: 영어, korean: 낱말, description: 한국어 뜻, pages, sizeCategory }
 *   keyObjectImages: { objectName: key_objects.name, imageUrl, success:true }
 * pages 는 그 책 본문에서 낱말을 찾아 계산(extract-hori-changjak 의 has() 와 동일 규칙).
 *
 * webp 는 내용 해시 키로 phonics-word-cards/ 에 올린다(같은 그림=같은 키=업로드 skip).
 *
 * 사용:
 *   node packages/server/scripts/link-hori-word-cards.mjs            # dry-run
 *   node packages/server/scripts/link-hori-word-cards.mjs --apply
 *   node packages/server/scripts/link-hori-word-cards.mjs --only=1782863860824 --apply
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, '_data', 'hori-cards-map.json'), 'utf8'));
const WEBP_DIR = 'C:/projects/comfy_test/outputs/hori-wordcards-webp';
const OUT_PREFIX = 'phonics-word-cards/';

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;

loadEnv();
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const BUCKET = process.env.R2_BUCKET_NAME;
const PUBLIC_URL = process.env.R2_PUBLIC_URL;

// ── 본문 낱말 찾기 (extract-hori-changjak-key-objects.mjs 와 동일) ──
const JOSA = ['은','는','이','가','을','를','와','과','도','만','의','에','로','랑','야','아','님','들',
  '에서','으로','이랑','에게','한테','까지','부터','밖에','마다','조차','에는','에도','으로는'];
const SIMILE = /^(처럼|같|듯|만큼)/;
const H = /[가-힣]/;
function has(text, w) {
  if (!text) return false;
  let i = -1;
  while ((i = text.indexOf(w, i + 1)) >= 0) {
    if (text[i - 1] && H.test(text[i - 1])) continue;
    const rest = text.slice(i + w.length);
    if (SIMILE.test(rest.trimStart())) continue;
    if (!rest[0] || !H.test(rest[0])) return true;
    if (JOSA.some((j) => rest.startsWith(j) && !H.test(rest[j.length] ?? ''))) return true;
  }
  return false;
}
const pagesOf = (sb, word) =>
  (sb.pages ?? []).map((p, i) => ({ n: i + 1, t: p.text ?? '' })).filter((p) => has(p.t, word)).map((p) => p.n);

async function existsKey(key) {
  try { await s3.send(new HeadObjectCommand({ Bucket: BUCKET, Key: key })); return true; } catch { return false; }
}

// 낱말 webp → 내용해시 키로 업로드(멱등). 반환 URL.
const urlCache = new Map();
async function uploadCard(word) {
  if (urlCache.has(word)) return urlCache.get(word);
  const file = path.join(WEBP_DIR, `${word}.webp`);
  const buf = fs.readFileSync(file);
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 12);
  const key = `${OUT_PREFIX}hori-${hash}-w800.webp`;
  const url = `${PUBLIC_URL}/${key}`;
  urlCache.set(word, url);
  if (APPLY && !(await existsKey(key))) {
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET, Key: key, Body: buf, ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
    }));
    uploaded++;
  }
  return url;
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}`);
const entries = Object.entries(MAP.bookWords).filter(([, ws]) => ws.length);
console.log(`대상 책 ${entries.length} · (책,낱말) ${entries.reduce((a, [, w]) => a + w.length, 0)}\n`);

let uploaded = 0, koCreated = 0, koFilled = 0, imgSet = 0, booksChanged = 0;
const missingWebp = [];

for (const [bookId, words] of entries) {
  if (ONLY && bookId !== ONLY) continue;
  let sb;
  try { sb = await getStorybook(bookId); } catch { console.log(`[${bookId}] 책 없음 — skip`); continue; }
  const koArr = (sb.key_objects ??= []);
  const imgArr = (sb.keyObjectImages ??= []);
  let changed = 0;
  for (const word of words) {
    if (!fs.existsSync(path.join(WEBP_DIR, `${word}.webp`))) { missingWebp.push(`${bookId}|${word}`); continue; }
    const enName = MAP.en[word];
    const pages = pagesOf(sb, word);
    // key_object 찾기(한국어 우선) 또는 생성
    let ko = koArr.find((o) => o.korean === word || (o.name && o.name === enName));
    if (!ko) {
      ko = { name: enName, nameEn: enName, korean: word, description: MAP.gloss[word] || '', pages, sizeCategory: 'small' };
      koArr.push(ko); koCreated++; changed++;
    } else if ((!ko.pages || ko.pages.length === 0) && pages.length) {
      ko.pages = pages; koFilled++; changed++;
    }
    // 이미지 업로드 + keyObjectImages 반영
    const url = await uploadCard(word);
    let img = imgArr.find((i) => i.objectName === ko.name);
    if (!img) {
      imgArr.push({ objectName: ko.name, imageUrl: url, success: true }); imgSet++; changed++;
    } else if (img.imageUrl !== url) {
      img.imageUrl = url; img.success = true; delete img.keypoints; imgSet++; changed++;
    }
  }
  if (changed) {
    booksChanged++;
    console.log(`[${bookId}] ${sb.title ?? bookId} — ${words.length}낱말 · ${changed}건 반영`);
    if (APPLY) { sb.updatedAt = new Date().toISOString(); await putStorybook(bookId, sb); }
  }
}

console.log(`\n책 ${booksChanged}권 변경 · key_objects 신규 ${koCreated} · pages 보강 ${koFilled} · 이미지 ${imgSet} · webp 업로드 ${uploaded}`);
if (missingWebp.length) console.log(`⚠️ webp 없음 ${missingWebp.length}: ${missingWebp.slice(0, 10).join(', ')}`);
if (!APPLY) console.log('\n(dry-run — 반영하려면 --apply)');
