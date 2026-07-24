// 세상 탐험 로컬 TTS(voicebox mp3, 바탕화면) → R2 업로드 → editor2 storybook page.ttsUrl 세팅.
// gen-tamheom.mjs 가 바탕화면 voicebox_samples/탐험_{Txx}_{title}/pNN.mp3 로 뽑은 걸 붙인다.
// 책은 folder="호리 세상 탐험" + (번호 제거) title 로 매칭. 멱등(같은 키로 덮어쓰기).
// 🔴 번호는 index label("T01 🚒 소방차")에서 추출(파일명=슬러그).
//
// 사용:
//   node packages/server/scripts/attach-tamheom-tts.mjs --only=T01 --apply
//   node packages/server/scripts/attach-tamheom-tts.mjs --apply           # T01~T15 전부
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { loadEnv, listStorybookKeys, getJsonByKey, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FOLDER = '호리 세상 탐험';
const DESK = 'C:/Users/101024/OneDrive/Desktop/voicebox_samples';
const INDEX = JSON.parse(
  fs.readFileSync(path.join(__dirname, '..', '..', 'client', 'public', 'tamheom-index.json'), 'utf-8')
);

const EPS = [];
for (const e of INDEX) {
  if (!e.file || e.file === 'tamheom-plan.html') continue;
  const m = String(e.label || '').match(/T(\d+)/);
  if (m) EPS.push({ code: `T${m[1]}`, num: Number(m[1]), title: e.title });
}
EPS.sort((a, b) => a.num - b.num);

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;
const strip = (s) => String(s ?? '').replace(/^\s*\d+\.\s*/, '');

loadEnv();
const PUBLIC_URL = (process.env.R2_PUBLIC_URL ?? '').replace(/\/$/, '');
const BUCKET = process.env.R2_BUCKET_NAME;
let _s3;
async function s3() {
  if (!_s3) {
    const { S3Client } = await import('@aws-sdk/client-s3');
    _s3 = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
      },
    });
  }
  return _s3;
}
async function upload(key, buf) {
  const client = await s3();
  await client.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buf,
    ContentType: 'audio/mpeg',
    CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${PUBLIC_URL}/${key}`;
}

function findDeskDir(code) {
  if (!fs.existsSync(DESK)) return null;
  const d = fs.readdirSync(DESK).find((n) => n.startsWith(`탐험_${code}_`));
  return d ? path.join(DESK, d) : null;
}

async function main() {
  let eps = EPS;
  if (ONLY) eps = eps.filter((e) => e.code === ONLY);

  console.log(`storybook 목록 로딩 (folder="${FOLDER}")...`);
  const keys = await listStorybookKeys();
  const byTitle = {};
  for (const key of keys) {
    try {
      const b = await getJsonByKey(key);
      if (b && b.id && b.title && (b.folder === FOLDER || b.category === FOLDER)) byTitle[strip(b.title)] = b.id;
    } catch { /* skip */ }
  }
  console.log(`"${FOLDER}" 책 ${Object.keys(byTitle).length}권.\n`);

  let totalOk = 0;
  const warn = [];
  for (const ep of eps) {
    const dir = findDeskDir(ep.code);
    const bookId = byTitle[ep.title];
    if (!dir) { warn.push(`${ep.code} "${ep.title}": mp3 폴더 없음`); continue; }
    if (!bookId) { warn.push(`${ep.code} "${ep.title}": 매칭 책 없음`); continue; }
    const mp3s = fs.readdirSync(dir).filter((f) => /^p\d+\.mp3$/.test(f)).sort();
    console.log(`[${ep.code}] "${ep.title}" → ${bookId} · mp3 ${mp3s.length}개`);
    if (!APPLY) continue;

    const book = await getStorybook(bookId);
    if (!book) { warn.push(`${ep.code}: R2 book 없음`); continue; }
    let ok = 0;
    for (const f of mp3s) {
      const n = Number(f.match(/^p(\d+)\.mp3$/)[1]);
      const page = (book.pages ?? []).find((p) => p.pageNumber === n);
      if (!page) { warn.push(`${ep.code} p${n}: 페이지 없음`); continue; }
      const buf = fs.readFileSync(path.join(dir, f));
      const key = `${bookId}-tts-page${n}-vbox.mp3`;
      page.ttsUrl = await upload(key, buf);
      ok++;
    }
    book.updatedAt = new Date().toISOString();
    await putStorybook(bookId, book);
    totalOk += ok;
    console.log(`   ✅ ${ok}쪽 ttsUrl 세팅·저장`);
  }
  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — ${eps.length}편 · ttsUrl ${totalOk}쪽`);
  if (warn.length) { console.log('⚠️ 경고:'); warn.forEach((w) => console.log('  ' + w)); }
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
