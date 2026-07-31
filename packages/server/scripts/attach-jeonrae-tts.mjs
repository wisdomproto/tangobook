// 전래동화 로컬 voicebox TTS(wav, 바탕화면) → mp3 변환 → R2 업로드 → storybook ttsUrl 세팅.
//   ko: page.ttsUrl              (폴더 전래동화_ko/NN_제목, 흥부만 흥부와놀부_페이지별_0.85배속)
//   en: page.translations.en = {text, ttsUrl} + book.languages/titleTranslations 갱신 (폴더 전래동화_en/NN_제목)
// 책은 category="전래 동화" + title 로 매칭. 멱등(같은 R2 키로 덮어쓰기).
//
// 사용:
//   node packages/server/scripts/attach-jeonrae-tts.mjs --lang=ko            # dry-run
//   node packages/server/scripts/attach-jeonrae-tts.mjs --lang=ko --apply
//   node packages/server/scripts/attach-jeonrae-tts.mjs --lang=en --apply
//   node packages/server/scripts/attach-jeonrae-tts.mjs --lang=ko --only="흥부와 놀부" --apply
//   node packages/server/scripts/attach-jeonrae-tts.mjs --lang=ko --only="심청전,서동요" --apply   # 쉼표로 여러 편
//   node packages/server/scripts/attach-jeonrae-tts.mjs --lang=en --src=<json> --apply            # 본문까지 이 파일에서
// 🔴 en 은 두 가지로 쓴다: `--src` 를 주면 그 파일의 본문·영문제목까지 심고, 안 주면
//    **이미 R2 에 있는 en 본문은 그대로 두고 ttsUrl 만** 붙인다(translate-apply 로 번역을 이미 넣은 경우).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { loadEnv, listStorybookKeys, getJsonByKey, getStorybook, putStorybook, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CATEGORY = '전래 동화';
const DESK = 'C:/Users/101024/OneDrive/Desktop/voicebox_samples';

const args = parseArgs(process.argv.slice(2));
const EN_SRC = args.src ?? null;
const APPLY = args.flags.has('apply');
const LANG = args.lang === 'en' ? 'en' : 'ko';
const ONLY = args.only ? String(args.only).split(',').map((s) => s.trim()).filter(Boolean) : null;
const safe = (s) => String(s ?? '').replace(/[\\/:*?"<>|]/g, '_').trim();

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
      credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
    });
  }
  return _s3;
}
async function upload(key, buf) {
  const client = await s3();
  await client.send(new PutObjectCommand({
    Bucket: BUCKET, Key: key, Body: buf,
    ContentType: 'audio/mpeg', CacheControl: 'public, max-age=31536000, immutable',
  }));
  return `${PUBLIC_URL}/${key}`;
}
// wav → mp3 (128k) 버퍼
function wavToMp3(wavPath) {
  const tmp = path.join(os.tmpdir(), `jeonrae-tts-${Date.now()}-${Math.floor(Math.random() * 1e6)}.mp3`);
  execFileSync('ffmpeg', ['-y', '-i', wavPath, '-b:a', '128k', tmp], { stdio: 'ignore' });
  const buf = fs.readFileSync(tmp);
  fs.unlinkSync(tmp);
  return buf;
}

// title → 로컬 wav 폴더
function findDir(title) {
  if (LANG === 'ko' && title === '흥부와 놀부') {
    const d = `${DESK}/흥부와놀부_페이지별_0.85배속`;
    return fs.existsSync(d) ? d : null;
  }
  const root = LANG === 'ko' ? `${DESK}/전래동화_ko` : `${DESK}/전래동화_en`;
  if (!fs.existsSync(root)) return null;
  const suffix = `_${safe(title)}`;
  const d = fs.readdirSync(root).find((n) => n.endsWith(suffix));
  return d ? `${root}/${d}` : null;
}

async function main() {
  const enMap = {};
  if (LANG === 'en' && EN_SRC) {
    const arr = JSON.parse(fs.readFileSync(EN_SRC, 'utf-8'));
    for (const b of arr) enMap[b.title] = b;
  }

  console.log(`storybook 로딩 (category="${CATEGORY}")...`);
  const keys = await listStorybookKeys();
  const books = [];
  for (const key of keys) {
    try { const b = await getJsonByKey(key); if (b && b.id && b.title && b.category === CATEGORY) books.push({ id: b.id, title: b.title }); } catch { /* skip */ }
  }
  let list = ONLY ? books.filter((b) => ONLY.includes(b.title)) : books;
  console.log(`대상 ${list.length}권 · lang=${LANG}\n`);

  let totalOk = 0;
  const warn = [];
  for (const bk of list) {
    const dir = findDir(bk.title);
    if (!dir) { warn.push(`"${bk.title}": ${LANG} wav 폴더 없음`); continue; }
    const wavs = fs.readdirSync(dir).filter((f) => /^page\d+\.wav$/.test(f)).sort();
    const enBook = LANG === 'en' && EN_SRC ? enMap[bk.title] : null;
    if (LANG === 'en' && EN_SRC && !enBook) { warn.push(`"${bk.title}": ${EN_SRC} 에 en 번역 없음`); continue; }
    console.log(`[${bk.title}] → ${bk.id} · wav ${wavs.length}개`);
    if (!APPLY) continue;

    const book = await getStorybook(bk.id);
    if (!book) { warn.push(`"${bk.title}": R2 book 없음`); continue; }
    let ok = 0;
    for (const f of wavs) {
      const n = Number(f.match(/^page(\d+)\.wav$/)[1]);
      const page = (book.pages ?? []).find((p) => p.pageNumber === n);
      if (!page) { warn.push(`"${bk.title}" p${n}: 페이지 없음`); continue; }
      const buf = wavToMp3(`${dir}/${f}`);
      if (LANG === 'ko') {
        page.ttsUrl = await upload(`${bk.id}-tts-page${n}-vbox.mp3`, buf);
      } else {
        const url = await upload(`${bk.id}-tts-page${n}-en-vbox.mp3`, buf);
        page.translations = page.translations || {};
        // --src 없으면 이미 있는 본문을 그대로 둔다 — 소리만 붙이러 온 것이므로 덮어쓰면 번역이 날아간다.
        const text = enBook ? (enBook.pages[n - 1] ?? '') : (page.translations.en?.text ?? '');
        if (!text.trim()) warn.push(`"${bk.title}" p${n}: en 본문 없음 (소리만 붙음)`);
        page.translations.en = { ...(page.translations.en || {}), text, ttsUrl: url };
      }
      ok++;
    }
    if (LANG === 'en') {
      book.languages = Array.from(new Set([...(book.languages || ['ko']), 'en']));
      if (enBook) book.titleTranslations = { ...(book.titleTranslations || {}), en: enBook.titleEn };
    } else {
      book.languages = Array.from(new Set([...(book.languages || []), 'ko']));
    }
    book.updatedAt = new Date().toISOString();
    await putStorybook(bk.id, book);
    totalOk += ok;
    console.log(`   ✅ ${ok}쪽 ${LANG} ttsUrl 세팅·저장`);
  }
  console.log(`\n${APPLY ? '완료' : 'DRY-RUN'} — ${list.length}편 · ttsUrl ${totalOk}쪽`);
  if (warn.length) { console.log('⚠️ 경고:'); warn.forEach((w) => console.log('  ' + w)); }
  if (!APPLY) console.log('실제 반영: --apply');
}

main().catch((e) => { console.error(e); process.exit(1); });
