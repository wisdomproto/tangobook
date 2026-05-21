#!/usr/bin/env node
/**
 * 영어 파닉스 Book 1 (Single Letter Sounds) 학습카드 정리.
 *
 * 문제: Book 1 은 알파벳 한 글자씩 (A·B·C, D·E·F …) 가르치는 단원인데
 *      blending[] 이 Book 2(Short Vowels)의 라임 패턴(an/at/ap/eg/et …)으로
 *      잘못 세팅돼 있어 AlphabetCardTab/PreviewModal 의
 *      `isAlphabetCard` 판정(vowel.length===1 && vowel.toLower===consonant.toLower)
 *      이 false 가 됨 → 대/소문자 표시·핫스팟 UX 등이 안 켜짐.
 *      추가로 wordFamilies 도 일부 unit 에서 글자 그룹과 무관(라임 그룹)으로 들어있음.
 *
 * 정리 기준:
 *   blending[i]   = { vowel: 'A', consonant: 'a', blend: 'Aa', exampleWord: 'apple', ... }
 *   wordFamilies[i] = { key/blend: 'Aa', words: [ {word:'apple', korean:'사과', ...}, ... ] }
 *
 * 자산 보존:
 *   - 기존 wordFamilies 의 모든 word → (ttsUrl, hotspot, korean) lookup
 *     새 단어가 기존에 있으면 그 자산 그대로 인계
 *   - 기존 blending 의 exampleWord/illustrationUrl → exampleWord lookup
 *     새 exampleWord 가 기존에 있으면 그 illustration 자산 인계
 *   - 매칭 안 되는 자산은 _backup/phonics-book1-pre-cleanup/{id}.json 에 백업 후 폐기
 *
 * 사용:
 *   node scripts/migrate-phonics-book1-letters.mjs            # dry-run (변경 없음, plan 출력)
 *   node scripts/migrate-phonics-book1-letters.mjs --apply    # 실 적용
 */
import {
  S3Client,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '..', '.env');
const envText = fs.readFileSync(envPath, 'utf-8');
for (const line of envText.split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
}

const APPLY = process.argv.includes('--apply');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;

// 글자별 표준 phonics 단어 (대표 단어를 첫 번째로). 한글 번역 포함.
const LETTER_WORDS = {
  A: [{ word: 'apple', korean: '사과' }, { word: 'alligator', korean: '악어' }, { word: 'ant', korean: '개미' }],
  B: [{ word: 'bat', korean: '야구방망이' }, { word: 'bag', korean: '가방' }, { word: 'book', korean: '책' }],
  C: [{ word: 'cat', korean: '고양이' }, { word: 'cap', korean: '모자' }, { word: 'cup', korean: '컵' }],
  D: [{ word: 'dog', korean: '강아지' }, { word: 'duck', korean: '오리' }, { word: 'doll', korean: '인형' }],
  E: [{ word: 'egg', korean: '달걀' }, { word: 'elephant', korean: '코끼리' }, { word: 'elf', korean: '요정' }],
  F: [{ word: 'fan', korean: '선풍기' }, { word: 'fish', korean: '물고기' }, { word: 'fox', korean: '여우' }],
  G: [{ word: 'goat', korean: '염소' }, { word: 'gift', korean: '선물' }, { word: 'gorilla', korean: '고릴라' }],
  H: [{ word: 'hat', korean: '모자' }, { word: 'hand', korean: '손' }, { word: 'hen', korean: '암탉' }],
  I: [{ word: 'igloo', korean: '이글루' }, { word: 'iguana', korean: '이구아나' }, { word: 'ink', korean: '잉크' }],
  J: [{ word: 'jet', korean: '제트기' }, { word: 'jam', korean: '잼' }, { word: 'juice', korean: '주스' }],
  K: [{ word: 'king', korean: '왕' }, { word: 'kite', korean: '연' }, { word: 'kiwi', korean: '키위' }],
  L: [{ word: 'lion', korean: '사자' }, { word: 'lemon', korean: '레몬' }, { word: 'leaf', korean: '나뭇잎' }],
  M: [{ word: 'map', korean: '지도' }, { word: 'milk', korean: '우유' }, { word: 'melon', korean: '멜론' }],
  N: [{ word: 'nest', korean: '둥지' }, { word: 'nut', korean: '견과류' }, { word: 'net', korean: '그물' }],
  O: [{ word: 'octopus', korean: '문어' }, { word: 'ostrich', korean: '타조' }, { word: 'ox', korean: '황소' }],
  P: [{ word: 'pen', korean: '펜' }, { word: 'pan', korean: '프라이팬' }, { word: 'pig', korean: '돼지' }],
  Q: [{ word: 'queen', korean: '여왕' }, { word: 'quilt', korean: '퀼트' }, { word: 'quail', korean: '메추라기' }],
  R: [{ word: 'rat', korean: '쥐' }, { word: 'ring', korean: '반지' }, { word: 'rose', korean: '장미' }],
  S: [{ word: 'sun', korean: '태양' }, { word: 'star', korean: '별' }, { word: 'sock', korean: '양말' }],
  T: [{ word: 'tiger', korean: '호랑이' }, { word: 'tree', korean: '나무' }, { word: 'top', korean: '팽이' }],
  U: [{ word: 'umbrella', korean: '우산' }, { word: 'up', korean: '위' }],
  V: [{ word: 'van', korean: '밴' }, { word: 'vest', korean: '조끼' }, { word: 'violin', korean: '바이올린' }],
  W: [{ word: 'watch', korean: '시계' }, { word: 'watermelon', korean: '수박' }, { word: 'wolf', korean: '늑대' }],
  X: [{ word: 'box', korean: '상자' }, { word: 'fox', korean: '여우' }, { word: 'ox', korean: '황소' }],
  Y: [{ word: 'yacht', korean: '요트' }, { word: 'yellow', korean: '노란색' }, { word: 'yo-yo', korean: '요요' }],
  Z: [{ word: 'zebra', korean: '얼룩말' }, { word: 'zoo', korean: '동물원' }, { word: 'zero', korean: '영' }],
};

// Book 1 unit → 글자 (title 의 "Unit 01: Aa Bb Cc" 와 일치)
const UNIT_LETTERS = {
  'en-b1-u01': ['A', 'B', 'C'],
  'en-b1-u02': ['D', 'E', 'F'],
  'en-b1-u03': ['G', 'H', 'I'],
  'en-b1-u04': ['J', 'K', 'L'],
  'en-b1-u05': ['M', 'N', 'O'],
  'en-b1-u06': ['P', 'Q', 'R'],
  'en-b1-u07': ['S', 'T', 'U', 'V'],
  'en-b1-u08': ['W', 'X', 'Y', 'Z'],
};

async function getJson(key) {
  const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await r.Body.transformToString('utf-8'));
}
async function putJson(key, data, contentType = 'application/json') {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: contentType,
    })
  );
}

console.log(`Mode: ${APPLY ? '✏️  APPLY' : '👀 DRY-RUN (변경 없음)'}\n`);

const summary = [];
for (const [unitId, letters] of Object.entries(UNIT_LETTERS)) {
  const key = `storybook-${unitId}.json`;
  let sb;
  try {
    sb = await getJson(key);
  } catch (e) {
    console.error(`  ✗ ${unitId}: ${e.message}`);
    continue;
  }
  const lesson = sb.phonicsLesson;
  if (!lesson) {
    console.error(`  ✗ ${unitId}: phonicsLesson 없음`);
    continue;
  }

  // 기존 단어/exampleWord 자산 lookup 구축
  const wordAssetMap = new Map(); // word(lowercase) → { ttsUrl, korean, hotspot }
  for (const wf of lesson.wordFamilies ?? []) {
    for (const w of wf.words ?? []) {
      const key = (w.word ?? '').toLowerCase().trim();
      if (!key) continue;
      if (!wordAssetMap.has(key)) {
        wordAssetMap.set(key, {
          ttsUrl: w.ttsUrl,
          korean: w.korean,
          hotspot: w.hotspot,
        });
      }
    }
  }

  const blendingAssetMap = new Map(); // exampleWord(lowercase) → { illustrationUrl, ... }
  for (const b of lesson.blending ?? []) {
    const key = (b.exampleWord ?? '').toLowerCase().trim();
    if (!key) continue;
    if (!blendingAssetMap.has(key)) {
      blendingAssetMap.set(key, {
        illustrationUrl: b.illustrationUrl,
        illustrationDescription: b.illustrationDescription,
        illustrationHistory: b.illustrationHistory,
        exampleWordImageUrl: b.exampleWordImageUrl,
        exampleWordImageDescription: b.exampleWordImageDescription,
        exampleWordImageHistory: b.exampleWordImageHistory,
        exampleWordTracingPoints: b.exampleWordTracingPoints,
        vowelTtsUrl: b.vowelTtsUrl,
        consonantTtsUrl: b.consonantTtsUrl,
        blendTtsUrl: b.blendTtsUrl,
        blendingSequenceTtsUrl: b.blendingSequenceTtsUrl,
      });
    }
  }

  // 새 blending + wordFamilies 생성
  const newBlending = [];
  const newWordFamilies = [];
  const reuseStats = { illustration: 0, wordTts: 0, hotspot: 0 };

  for (const L of letters) {
    const lower = L.toLowerCase();
    const blend = `${L}${lower}`;
    const words = LETTER_WORDS[L] ?? [];
    if (words.length === 0) {
      console.warn(`  ⚠ ${unitId}: 글자 ${L} 의 표준 단어 매핑 없음`);
      continue;
    }
    const exampleWord = words[0].word;
    const assetB = blendingAssetMap.get(exampleWord.toLowerCase());
    if (assetB?.illustrationUrl || assetB?.exampleWordImageUrl) reuseStats.illustration++;

    newBlending.push({
      vowel: L,
      consonant: lower,
      blend,
      exampleWord,
      illustrationUrl: assetB?.illustrationUrl,
      illustrationDescription: assetB?.illustrationDescription,
      illustrationHistory: assetB?.illustrationHistory,
      exampleWordImageUrl: assetB?.exampleWordImageUrl,
      exampleWordImageDescription: assetB?.exampleWordImageDescription,
      exampleWordImageHistory: assetB?.exampleWordImageHistory,
      exampleWordTracingPoints: assetB?.exampleWordTracingPoints,
      vowelTtsUrl: assetB?.vowelTtsUrl,
      consonantTtsUrl: assetB?.consonantTtsUrl,
      blendTtsUrl: assetB?.blendTtsUrl,
      blendingSequenceTtsUrl: assetB?.blendingSequenceTtsUrl,
    });

    newWordFamilies.push({
      key: blend,
      blend,
      words: words.map((w) => {
        const asset = wordAssetMap.get(w.word.toLowerCase());
        if (asset?.ttsUrl) reuseStats.wordTts++;
        if (asset?.hotspot) reuseStats.hotspot++;
        return {
          word: w.word,
          korean: w.korean,
          ttsUrl: asset?.ttsUrl,
          hotspot: asset?.hotspot,
        };
      }),
    });
  }

  // 백업 (기존 데이터 전체 — _backup/phonics-book1-pre-cleanup/{id}.json)
  const backupKey = `_backup/phonics-book1-pre-cleanup/${unitId}.json`;

  summary.push({
    unitId,
    letters: letters.join(','),
    oldBlendingCount: lesson.blending?.length ?? 0,
    oldWordFamiliesCount: lesson.wordFamilies?.length ?? 0,
    newBlendingCount: newBlending.length,
    newWordFamiliesCount: newWordFamilies.length,
    reuseIllustration: reuseStats.illustration,
    reuseWordTts: reuseStats.wordTts,
    reuseHotspot: reuseStats.hotspot,
  });

  console.log(`[${unitId}] ${letters.join(' · ')}`);
  console.log(`  blending: ${lesson.blending?.length ?? 0} → ${newBlending.length}`);
  console.log(`  wordFamilies: ${lesson.wordFamilies?.length ?? 0} → ${newWordFamilies.length}`);
  console.log(`  자산 보존: illustration=${reuseStats.illustration} / wordTts=${reuseStats.wordTts} / hotspot=${reuseStats.hotspot}`);
  if (!APPLY) {
    console.log(`  새 blending 미리보기:`);
    for (const b of newBlending.slice(0, 3)) {
      console.log(`    ${b.vowel}${b.consonant} (${b.blend}) → ${b.exampleWord}${b.illustrationUrl ? ' [✓삽화]' : ''}`);
    }
  }

  if (APPLY) {
    try {
      await putJson(backupKey, sb);
      console.log(`  📦 백업: ${backupKey}`);

      // 새 phonicsLesson 만 교체. 다른 필드(title, characters, sightWords 등) 보존.
      sb.phonicsLesson = {
        ...lesson,
        blending: newBlending,
        wordFamilies: newWordFamilies,
      };
      sb.updatedAt = new Date().toISOString();
      await putJson(key, sb);
      console.log(`  ✓ 적용 완료`);
    } catch (e) {
      console.error(`  ✗ 적용 실패: ${e.message}`);
    }
  }
  console.log();
}

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('정리 요약:');
console.table(summary);

if (!APPLY) {
  console.log(`\n👀 DRY-RUN 종료. 실 적용은 \`--apply\` 플래그.`);
} else {
  console.log(`\n✓ 적용 완료. 서버 in-memory 캐시 새로고침을 위해 재시작 권장.`);
}
