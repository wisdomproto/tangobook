#!/usr/bin/env node
// 읽기 전용: R2 책 이미지(표지/페이지)의 포맷 + 실제 바이트 크기 전수/샘플 측정.
import { S3Client, GetObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
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
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});
const bucket = process.env.R2_BUCKET_NAME;

async function listAllKeys(prefix) {
  const keys = []; let token;
  do {
    const out = await s3.send(new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token }));
    (out.Contents ?? []).forEach((o) => { if (o.Key?.endsWith('.json')) keys.push(o.Key); });
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}
async function getJson(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await out.Body.transformToString('utf-8'));
}

function urlToKey(url) {
  if (typeof url !== 'string') return null;
  const i = url.indexOf('.r2.dev/');
  if (i < 0) return null;
  let key = url.slice(i + '.r2.dev/'.length).split('?')[0];
  try { key = decodeURIComponent(key); } catch {}
  return key;
}
function ext(url) {
  const m = (url || '').split('?')[0].toLowerCase().match(/\.([a-z0-9]+)$/);
  return m ? m[1] : '(none)';
}

function collectCovers(sb) {
  const urls = new Set();
  const add = (u) => { if (typeof u === 'string' && u.includes('.r2.dev/')) urls.add(u); };
  add(sb.coverImage);
  Object.values(sb.primaryCoverByLang ?? {}).forEach(add);
  Object.values(sb.coversByStyle ?? {}).forEach(add);
  (sb.coverImages ?? []).forEach((c) => add(c?.imageUrl));
  for (const sa of Object.values(sb.styleAssets ?? {})) {
    add(sa?.coverImage);
    Object.values(sa?.primaryCoverByLang ?? {}).forEach(add);
    Object.values(sa?.coversByStyle ?? {}).forEach(add);
  }
  return [...urls];
}
function collectPages(sb) {
  const urls = new Set();
  const add = (u) => { if (typeof u === 'string' && u.includes('.r2.dev/')) urls.add(u); };
  (sb.pages ?? []).forEach((p) => add(p?.imageUrl));
  for (const sa of Object.values(sb.styleAssets ?? {})) {
    (sa?.pages ?? []).forEach((p) => add(p?.imageUrl ?? p?.url));
  }
  return [...urls];
}

async function headSize(url) {
  const key = urlToKey(url);
  if (!key) return null;
  try {
    const h = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { bytes: h.ContentLength ?? 0, ct: h.ContentType ?? '', ext: ext(url) };
  } catch (e) {
    return { bytes: null, ct: 'ERR', ext: ext(url), err: e.name };
  }
}

const fmt = (b) => b == null ? '—' : b >= 1e6 ? (b/1e6).toFixed(2)+'MB' : (b/1e3).toFixed(0)+'KB';

async function measure(label, urls, sampleN) {
  const uniq = [...new Set(urls)];
  const sample = sampleN && uniq.length > sampleN
    ? uniq.filter((_, i) => i % Math.ceil(uniq.length / sampleN) === 0).slice(0, sampleN)
    : uniq;
  const byExt = {};
  let i = 0;
  async function worker() {
    while (i < sample.length) {
      const u = sample[i++];
      const r = await headSize(u);
      if (!r) continue;
      const e = r.ext;
      byExt[e] = byExt[e] || { n: 0, bytes: 0, errs: 0 };
      byExt[e].n++;
      if (r.bytes == null) byExt[e].errs++;
      else byExt[e].bytes += r.bytes;
    }
  }
  await Promise.all(Array.from({ length: 24 }, worker));
  console.log(`\n=== ${label} === (고유 ${uniq.length}개${sampleN && uniq.length>sampleN ? `, 샘플 ${sample.length}` : ''})`);
  let totN = 0, totB = 0;
  for (const [e, v] of Object.entries(byExt).sort((a, b) => b[1].bytes - a[1].bytes)) {
    const ok = v.n - v.errs;
    console.log(`  ${e.padEnd(6)} ${String(v.n).padStart(4)}개  합 ${fmt(v.bytes).padStart(8)}  평균 ${fmt(ok ? v.bytes/ok : 0).padStart(7)}${v.errs ? `  (err ${v.errs})` : ''}`);
    totN += v.n; totB += v.bytes;
  }
  console.log(`  ${'합계'.padEnd(6)} ${String(totN).padStart(4)}개  합 ${fmt(totB).padStart(8)}  평균 ${fmt(totN ? totB/totN : 0).padStart(7)}`);
  return { byExt, totN, totB, uniqCount: uniq.length };
}

async function main() {
  const keys = await listAllKeys('storybook-');
  console.log(`${keys.length} 책 JSON 로드...`);
  const allCovers = [], allPages = [];
  let i = 0;
  async function loader() {
    while (i < keys.length) {
      const k = keys[i++];
      try { const sb = await getJson(k); allCovers.push(...collectCovers(sb)); allPages.push(...collectPages(sb)); }
      catch {}
    }
  }
  await Promise.all(Array.from({ length: 16 }, loader));

  const cov = await measure('표지 (전수)', allCovers, null);
  const pg = await measure('페이지 이미지 (샘플 300)', allPages, 300);

  // webp 절감 추정: jpg/jpeg -28%, png -65%, webp 0
  const estSave = (byExt) => {
    let cur = 0, after = 0;
    for (const [e, v] of Object.entries(byExt)) {
      cur += v.bytes;
      const rate = (e === 'jpg' || e === 'jpeg') ? 0.28 : e === 'png' ? 0.65 : 0;
      after += v.bytes * (1 - rate);
    }
    return { cur, after, savePct: cur ? ((cur - after) / cur * 100) : 0 };
  };
  console.log('\n=== webp 전환 절감 추정 (jpg -28% · png -65% · webp 0%) ===');
  const cs = estSave(cov.byExt);
  console.log(`표지: ${fmt(cs.cur)} → ${fmt(cs.after)}  (-${cs.savePct.toFixed(0)}%)`);
  const ps = estSave(pg.byExt);
  console.log(`페이지(샘플): ${fmt(ps.cur)} → ${fmt(ps.after)}  (-${ps.savePct.toFixed(0)}%)  ※ 샘플 기준, 전체는 ×${(pg.uniqCount/Math.max(1,pg.totN)).toFixed(1)}`);
}
main().catch((e) => { console.error(e); process.exit(1); });
