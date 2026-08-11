#!/usr/bin/env node
/**
 * 중국어 병음 Level 4(단어) storybook 3개 생성 + 삽화 연동 (멱등).
 *
 * 한글 나무 카드 파이프라인(`link-hangeul-tree-word-cards.mjs`)을 그대로 본떴다. 다른 점:
 *   - 삽화 소스가 R2 comic-assets 가 아니라 **로컬 스크래치패드 PNG**(GPT 생성 니들펠트 카드).
 *   - storybook 이 아직 없으므로(L1~L3 은 소리 유닛이라 storybook 없음) **새로 만든다**.
 *   - 낱말 음원 = `mod_chinese/{병음}.mp3` 직행(원어민 녹음, 성조 정확) — 새 bake 0.
 *
 * 각 낱말: 원본 PNG(1024²) → w800 webp → R2 `phonics-word-cards/` → flashcard.imageUrl.
 * flashcard = { word:병음, localWord, hanzi, gloss, imageUrl, ttsUrl(mod_chinese), phonemes:[] }.
 * keypoints(낱말 그리기 폴리곤)는 별도: `extract-word-card-keypoints.mjs`(storybook 생성 뒤).
 *
 * 사용:
 *   node packages/server/scripts/create-chinese-l4-storybooks.mjs                # dry-run
 *   node packages/server/scripts/create-chinese-l4-storybooks.mjs --apply
 *   node packages/server/scripts/create-chinese-l4-storybooks.mjs --only=zh-l4-u01 --apply
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv, getStorybook, putStorybook, getJsonByKey, parseArgs } from './translation-core.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_DIR =
  'C:/Users/101024/AppData/Local/Temp/claude/C--projects-tangobook--claude-worktrees-blog-multilingual-setup-32f610/8929740f-d76e-44f5-84fd-bd817043bd00/scratchpad/pinyin-cards';
const OUT_PREFIX = 'phonics-word-cards/';
const WIDTH = 800;
const QUALITY = 82;

// 🔴 L4_WORDS SSOT (client `chinese-phonics-units.ts` 의 표와 일치) — 병음 → { 한자, 뜻, 슬러그 }.
const L4_WORDS = {
  mǐ: { hanzi: '米', gloss: '쌀', slug: 'mi_rice' },
  mǎ: { hanzi: '马', gloss: '말', slug: 'ma_horse' },
  mù: { hanzi: '木', gloss: '나무', slug: 'mu_tree' },
  tù: { hanzi: '兔', gloss: '토끼', slug: 'tu_rabbit' },
  lù: { hanzi: '鹿', gloss: '사슴', slug: 'lu_deer' },
  jī: { hanzi: '鸡', gloss: '닭', slug: 'ji_chicken' },
  shī: { hanzi: '狮', gloss: '사자', slug: 'shi_lion' },
  rì: { hanzi: '日', gloss: '해', slug: 'ri_sun' },
  chī: { hanzi: '吃', gloss: '먹다', slug: 'chi_eat' },
  hé: { hanzi: '河', gloss: '강', slug: 'he_river' },
  hǔ: { hanzi: '虎', gloss: '호랑이', slug: 'hu_tiger' },
  gǔ: { hanzi: '鼓', gloss: '북', slug: 'gu_drum' },
  é: { hanzi: '鹅', gloss: '거위', slug: 'e_goose' },
  sì: { hanzi: '四', gloss: '넷', slug: 'si_four' },
};

// 유닛 → 병음 낱말(성조부호). shared CHINESE_PHONICS_CURRICULUM Level 4 와 일치.
const UNITS = {
  'zh-l4-u01': { title: 'Unit 01: mǐ mǎ mù tù lù', words: ['mǐ', 'mǎ', 'mù', 'tù', 'lù'] },
  'zh-l4-u02': { title: 'Unit 02: jī shī rì chī', words: ['jī', 'shī', 'rì', 'chī'] },
  'zh-l4-u03': { title: 'Unit 03: hé hǔ gǔ é sì', words: ['hé', 'hǔ', 'gǔ', 'é', 'sì'] },
};

const args = parseArgs(process.argv.slice(2));
const APPLY = args.flags.has('apply');
const ONLY = args.only ? String(args.only) : null;

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

/** 로컬 PNG → w800 webp → R2. 같은 내용이면 이미 있는 키 재사용(해시). */
async function bakeCard(unitId, roman, srcPath) {
  const buf = fs.readFileSync(srcPath);
  const hash = crypto.createHash('sha1').update(buf).digest('hex').slice(0, 8);
  const outKey = `${OUT_PREFIX}${unitId}-${roman}-${hash}-w${WIDTH}.webp`;
  const url = `${PUBLIC_URL}/${outKey}`;
  if (await exists(outKey)) return { url, skipped: true, bytes: 0, srcBytes: buf.length };
  const webp = await sharp(buf)
    .resize({ width: WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toBuffer();
  if (APPLY) {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: outKey,
        Body: webp,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      })
    );
  }
  return { url, skipped: false, bytes: webp.length, srcBytes: buf.length };
}

// mod_chinese 음원 index → 병음(NFC) → mp3 URL.
const libIndex = await getJsonByKey('phonics-library/_index.json');
const zhAudio = new Map(
  (libIndex.mod_chinese ?? []).map((x) => [(x.sound ?? '').normalize('NFC'), x.url])
);

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN'}`);
console.log(`mod_chinese 음원 ${zhAudio.size}개 로드\n`);

const problems = [];
let baked = 0;

for (const [unitId, u] of Object.entries(UNITS)) {
  if (ONLY && unitId !== ONLY) continue;

  const flashcards = [];
  for (const word of u.words) {
    const info = L4_WORDS[word.normalize('NFC')];
    if (!info) {
      problems.push(`[${unitId}] "${word}" — L4_WORDS 에 없음`);
      continue;
    }
    const srcPath = path.join(CARDS_DIR, `${info.slug}.png`);
    if (!fs.existsSync(srcPath)) {
      problems.push(`[${unitId}] "${word}"(${info.slug}) — 삽화 PNG 없음`);
      continue;
    }
    const ttsUrl = zhAudio.get(word.normalize('NFC'));
    if (!ttsUrl) problems.push(`[${unitId}] "${word}" — mod_chinese 음원 없음`);

    const roman = info.slug; // mi_rice 등 — 유닛 내 고유
    const { url, skipped, bytes, srcBytes } = APPLY
      ? await bakeCard(unitId, roman, srcPath)
      : { url: `${PUBLIC_URL}/${OUT_PREFIX}${unitId}-${roman}-DRYRUN-w${WIDTH}.webp`, skipped: true };
    if (APPLY && !skipped) {
      baked++;
      console.log(
        `  🖼️  ${word} ${info.hanzi} ${(srcBytes / 1024 / 1024).toFixed(1)}MB → ${(bytes / 1024).toFixed(0)}KB`
      );
    }

    flashcards.push({
      word,
      localWord: word,
      hanzi: info.hanzi,
      gloss: info.gloss,
      phonemes: [],
      phonicPattern: 'word',
      sentence: '',
      imageDescription: `${info.gloss} (${info.hanzi})`,
      imageUrl: url,
      ...(ttsUrl ? { ttsUrl } : {}),
    });
  }

  // 기존 storybook 이 있으면(재실행) keypoints·imageHistory 등을 보존하며 flashcard 를 갱신한다.
  let sb;
  try {
    sb = await getStorybook(unitId);
  } catch {
    sb = null;
  }
  const now = new Date().toISOString();
  if (!sb) {
    sb = {
      id: unitId,
      type: 'phonics',
      title: `중국어 파닉스 · Level 4 단어 · ${u.title}`,
      targetAge: '4-7',
      artStyle: 'needlefelt',
      category: '중국어 파닉스',
      isPublic: true,
      isAccessibleForFree: true,
      createdAt: now,
      characters: [],
      pages: [],
      key_objects: [],
      phonicsConfig: {},
      phonicsLesson: { title: u.title, blending: [], wordFamilies: [] },
      flashcards: [],
    };
  }

  sb.phonicsConfig = {
    language: 'chinese',
    level: 'level4',
    targetUnit: u.title,
    targetPhonemes: [],
    targetWords: u.words,
    targetPatterns: ['word'],
  };
  // flashcard 갱신 — 낱말별로 병합해 기존 keypoints 를 보존한다.
  const byWord = new Map((sb.flashcards ?? []).map((c) => [c.word ?? c.localWord, c]));
  sb.flashcards = flashcards.map((nc) => {
    const old = byWord.get(nc.word);
    if (old?.imageUrl && old.imageUrl !== nc.imageUrl) {
      nc.imageHistory = [...(old.imageHistory ?? []), old.imageUrl];
    }
    // keypoints 는 extract 스크립트가 채운다 — 있으면 유지.
    if (old?.keypoints) nc.keypoints = old.keypoints;
    return nc;
  });
  sb.updatedAt = now;

  console.log(`[${unitId}] flashcards ${sb.flashcards.length}개 (${u.words.join(' ')})`);
  if (APPLY) await putStorybook(unitId, sb);
}

console.log(`\nwebp 신규 생성 ${baked}장`);
if (problems.length) {
  console.log(`\n⚠️  확인 필요 ${problems.length}건`);
  problems.forEach((p) => console.log('  - ' + p));
}
if (!APPLY) console.log('\n(dry-run — 반영하려면 --apply)');
