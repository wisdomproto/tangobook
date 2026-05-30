#!/usr/bin/env node
/**
 * backfill-languages: 영어(또는 기타) 콘텐츠가 있는데 `languages` 필드가 비어/누락된 책에
 * content 기준으로 `languages` + `defaultLanguage:'ko'` 를 채운다 (idempotent, 변경분만 write).
 *
 * 대상: 자연관찰(육지/곤충/식물/공룡/바다/하늘/우주/우리몸) + 세계 명작. (파닉스·backup 제외)
 *
 * 사용:
 *   node scripts/backfill-languages.mjs           # dry-run (write 안 함)
 *   node scripts/backfill-languages.mjs --apply   # 실제 R2 반영
 */
import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envText = fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf-8');
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

const NATURE = [
  '육지 동물 친구들', '곤충 친구들', '식물 친구들', '공룡 친구들',
  '바다 동물 친구들', '하늘 동물 친구들', '우주와 자연', '우리 몸 이야기',
];
const TARGET_CATEGORIES = new Set([...NATURE, '세계 명작']);

async function listAllKeys(prefix) {
  const keys = [];
  let token;
  do {
    const out = await s3.send(
      new ListObjectsV2Command({ Bucket: bucket, Prefix: prefix, ContinuationToken: token })
    );
    (out.Contents ?? []).forEach((o) => {
      if (o.Key && o.Key.endsWith('.json')) keys.push(o.Key);
    });
    token = out.IsTruncated ? out.NextContinuationToken : undefined;
  } while (token);
  return keys;
}
async function getJson(key) {
  const out = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await out.Body.transformToString('utf-8'));
}

// content 에 실제 존재하는 언어 (ko 기본 + 페이지/단어 번역).
function contentLangs(sb) {
  const set = new Set(['ko']);
  for (const p of sb.pages ?? []) {
    const tr = p.translations ?? {};
    for (const k of Object.keys(tr)) {
      if (tr[k]?.text && String(tr[k].text).trim()) set.add(k);
    }
  }
  for (const k of sb.key_objects ?? sb.keyObjects ?? []) {
    if (k.nameEn) set.add('en');
    if (k.nameTranslations) for (const lc of Object.keys(k.nameTranslations)) {
      if (k.nameTranslations[lc]) set.add(lc);
    }
  }
  return set;
}

function orderLangs(set) {
  const rest = [...set].filter((l) => l !== 'ko').sort();
  return ['ko', ...rest];
}

async function main() {
  console.log(APPLY ? '🔴 APPLY 모드 — R2 에 실제 반영' : '🟡 DRY-RUN — write 안 함 (--apply 로 반영)');
  const keys = await listAllKeys('storybook-');
  console.log(`총 ${keys.length} 키 스캔...`);

  const planned = [];
  let i = 0;
  const buf = [];
  async function worker() {
    while (i < keys.length) {
      const key = keys[i++];
      try {
        const sb = await getJson(key);
        if (!sb.id) continue;
        if (!TARGET_CATEGORIES.has(sb.category)) continue;
        const declared = new Set(sb.languages ?? []);
        const content = contentLangs(sb);
        const after = orderLangs(new Set([...declared, ...content]));
        // 다국어(2+)가 아니면 언어 토글과 무관 — skip (ko 단독 책에 languages:['ko'] 쓰는 노이즈 방지)
        if (after.length < 2) continue;
        const existing = sb.languages ?? [];
        const same = existing.length === after.length && after.every((l, idx) => l === existing[idx]);
        if (same) continue; // 이미 languages 정상 — skip
        const needDefault = !sb.defaultLanguage;
        buf.push({ key, sb, after, needDefault });
        planned.push({
          id: sb.id, title: sb.title, category: sb.category,
          variant: /__L\d+$/.test(sb.id),
          from: sb.languages ?? null, to: after,
        });
      } catch (e) {
        console.warn(`skip ${key}: ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: 12 }, worker));

  // 카테고리별 집계
  const byCat = {};
  for (const p of planned) byCat[p.category] = (byCat[p.category] || 0) + 1;
  console.log(`\n변경 대상: ${planned.length}권`);
  for (const [c, n] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${c}: ${n}권`);
  }
  console.log('\n샘플 10권:');
  planned.slice(0, 10).forEach((p) =>
    console.log(`  ${p.title}${p.variant ? ' (variant)' : ''}: ${JSON.stringify(p.from)} → ${JSON.stringify(p.to)}`)
  );

  fs.writeFileSync(
    path.join(__dirname, '_data', '_backfill-languages-plan.json'),
    JSON.stringify({ apply: APPLY, count: planned.length, planned }, null, 2)
  );
  console.log(`\n계획 저장: _data/_backfill-languages-plan.json`);

  if (!APPLY) {
    console.log('\n🟡 DRY-RUN 종료. 반영하려면: node scripts/backfill-languages.mjs --apply');
    return;
  }

  // APPLY
  console.log('\n🔴 R2 반영 시작...');
  let done = 0, failed = 0;
  for (const { key, sb, after, needDefault } of buf) {
    try {
      sb.languages = after;
      if (needDefault) sb.defaultLanguage = 'ko';
      await s3.send(new PutObjectCommand({
        Bucket: bucket, Key: key,
        Body: JSON.stringify(sb), ContentType: 'application/json',
      }));
      done++;
      if (done % 20 === 0) console.log(`  ...${done}/${buf.length}`);
    } catch (e) {
      failed++;
      console.warn(`  ❌ ${sb.id}: ${e.message}`);
    }
  }
  console.log(`\n✅ 완료: ${done} 반영 / ${failed} 실패`);
}

main().catch((e) => { console.error(e); process.exit(1); });
