#!/usr/bin/env node
/**
 * 중국어 병음 낱말 유닛 storybook 생성 + 삽화 연동 (멱등) — L4 확장 + L5/L6 복운모·비운모 낱말.
 *
 * `create-chinese-l4-storybooks.mjs` 를 그대로 본떴다(같은 bakeCard·mod_chinese 직행·flashcard 병합).
 * 다른 점은 대상 유닛/낱말뿐이다. 기존 zh-l4-u01~u03 은 건드리지 않는다(그 스크립트 소관).
 *
 * 🔴 중국어는 단음절어라 우리가 가르치는 음절이 곧 낱말이다(māo猫·shān山…). 그림 되는 구체 낱말만
 *    골라 낱말 유닛으로 만든다(추상 半·分 은 소리 유닛에만 남긴다). 복습(6종)이 이 낱말 유닛을 청킹한다.
 *
 * 각 낱말: 로컬 PNG(1024², scratchpad/pinyin-cards) → w800 webp → R2 `phonics-word-cards/` → flashcard.imageUrl.
 * 음원 = `mod_chinese/{병음}.mp3` 직행(원어민 녹음). keypoints 는 `extract-word-card-keypoints.mjs` 가 채운다.
 *
 * 사용:
 *   node packages/server/scripts/create-chinese-word-storybooks.mjs                 # dry-run
 *   node packages/server/scripts/create-chinese-word-storybooks.mjs --apply
 *   node packages/server/scripts/create-chinese-word-storybooks.mjs --only=zh-l5-u04 --apply
 */
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { loadEnv, getStorybook, putStorybook, getJsonByKey, parseArgs } from './translation-core.mjs';

const CARDS_DIR =
  'C:/Users/101024/AppData/Local/Temp/claude/C--projects-tangobook--claude-worktrees-blog-multilingual-setup-32f610/8929740f-d76e-44f5-84fd-bd817043bd00/scratchpad/pinyin-cards';
const OUT_PREFIX = 'phonics-word-cards/';
const WIDTH = 800;
const QUALITY = 82;

// 🔴 WORD SSOT — client `chinese-phonics-units.ts` WORD_UNIT_WORDS 와 일치. 병음(NFC) → { 한자, 뜻, 슬러그 }.
const WORDS = {
  // 단운모/통독 확장
  zhū: { hanzi: '猪', gloss: '돼지', slug: 'zhu_pig' },
  shū: { hanzi: '书', gloss: '책', slug: 'shu_book' },
  yú: { hanzi: '鱼', gloss: '물고기', slug: 'yu_fish' },
  yǔ: { hanzi: '雨', gloss: '비', slug: 'yu_rain' },
  yī: { hanzi: '衣', gloss: '옷', slug: 'yi_clothes' },
  // 복운모 (L5)
  māo: { hanzi: '猫', gloss: '고양이', slug: 'test_mao_cat' },
  gǒu: { hanzi: '狗', gloss: '개', slug: 'gou_dog' },
  niú: { hanzi: '牛', gloss: '소', slug: 'niu_cow' },
  hǎi: { hanzi: '海', gloss: '바다', slug: 'hai_sea' },
  bāo: { hanzi: '包', gloss: '가방', slug: 'bao_bag' },
  shuǐ: { hanzi: '水', gloss: '물', slug: 'shui_water' },
  bēi: { hanzi: '杯', gloss: '컵', slug: 'beizi_cup' },
  qiú: { hanzi: '球', gloss: '공', slug: 'qiu_ball' },
  nǎi: { hanzi: '奶', gloss: '우유', slug: 'nai_milk' },
  yè: { hanzi: '叶', gloss: '잎', slug: 'ye_leaf' },
  xié: { hanzi: '鞋', gloss: '신발', slug: 'xie_shoe' },
  yuè: { hanzi: '月', gloss: '달', slug: 'yue_moon' },
  xuě: { hanzi: '雪', gloss: '눈', slug: 'xue_snow' },
  // 비운모 (L6)
  shān: { hanzi: '山', gloss: '산', slug: 'shan_mountain' },
  mén: { hanzi: '门', gloss: '문', slug: 'men_door' },
  yún: { hanzi: '云', gloss: '구름', slug: 'yun_cloud' },
  yáng: { hanzi: '羊', gloss: '양', slug: 'yang_sheep' },
  dēng: { hanzi: '灯', gloss: '등', slug: 'deng_lantern' },
  xīng: { hanzi: '星', gloss: '별', slug: 'xing_star' },
  bīng: { hanzi: '冰', gloss: '얼음', slug: 'bing_ice' },
  píng: { hanzi: '瓶', gloss: '병', slug: 'ping_bottle' },
  xióng: { hanzi: '熊', gloss: '곰', slug: 'xiong_bear' },
  zhōng: { hanzi: '钟', gloss: '시계', slug: 'zhong_clock' },
  chóng: { hanzi: '虫', gloss: '벌레', slug: 'chong_bug' },
  táng: { hanzi: '糖', gloss: '사탕', slug: 'tang_candy' },
};

// 유닛 → 병음 낱말. shared CHINESE_PHONICS_CURRICULUM 의 word 유닛과 일치.
const UNITS = {
  'zh-l4-u04': { level: 'level4', title: 'Unit 04: zhū shū yú yǔ yī', words: ['zhū', 'shū', 'yú', 'yǔ', 'yī'] },
  'zh-l5-u04': { level: 'level5', title: 'Unit 04: 동물 (māo gǒu niú hǎi bāo)', words: ['māo', 'gǒu', 'niú', 'hǎi', 'bāo'] },
  'zh-l5-u05': { level: 'level5', title: 'Unit 05: 사물 (shuǐ bēi qiú nǎi)', words: ['shuǐ', 'bēi', 'qiú', 'nǎi'] },
  'zh-l5-u06': { level: 'level5', title: 'Unit 06: 자연 (yè xié yuè xuě)', words: ['yè', 'xié', 'yuè', 'xuě'] },
  'zh-l6-u05': { level: 'level6', title: 'Unit 05: 자연 (shān mén yún yáng)', words: ['shān', 'mén', 'yún', 'yáng'] },
  'zh-l6-u06': { level: 'level6', title: 'Unit 06: 사물 (dēng xīng bīng píng)', words: ['dēng', 'xīng', 'bīng', 'píng'] },
  'zh-l6-u07': { level: 'level6', title: 'Unit 07: 사물 (xióng zhōng chóng táng)', words: ['xióng', 'zhōng', 'chóng', 'táng'] },
}; // prettier-ignore

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
    const info = WORDS[word.normalize('NFC')];
    if (!info) {
      problems.push(`[${unitId}] "${word}" — WORDS 에 없음`);
      continue;
    }
    const srcPath = path.join(CARDS_DIR, `${info.slug}.png`);
    if (!fs.existsSync(srcPath)) {
      problems.push(`[${unitId}] "${word}"(${info.slug}) — 삽화 PNG 없음`);
      continue;
    }
    const ttsUrl = zhAudio.get(word.normalize('NFC'));
    if (!ttsUrl) problems.push(`[${unitId}] "${word}" — mod_chinese 음원 없음`);

    const roman = info.slug;
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
      title: `중국어 파닉스 · 낱말 · ${u.title}`,
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
    level: u.level,
    targetUnit: u.title,
    targetPhonemes: [],
    targetWords: u.words,
    targetPatterns: ['word'],
  };
  const byWord = new Map((sb.flashcards ?? []).map((c) => [c.word ?? c.localWord, c]));
  sb.flashcards = flashcards.map((nc) => {
    const old = byWord.get(nc.word);
    if (old?.imageUrl && old.imageUrl !== nc.imageUrl) {
      nc.imageHistory = [...(old.imageHistory ?? []), old.imageUrl];
    }
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
