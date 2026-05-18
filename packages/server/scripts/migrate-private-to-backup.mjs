#!/usr/bin/env node
/**
 * 비공개 storybook(`isPublic === false`) 전부를 'backup' 카테고리로 이동.
 *
 * --dry (기본): 대상 list 출력
 * --apply: R2 PutObject 로 category 필드 갱신 + library-config.json 정합성 확인
 *
 * 'backup' 카테고리는 /library-master 에서 미리 만들어둔 상태여야 함.
 * (없으면 categoryList 에 자동 추가)
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});
const bucket = process.env.R2_BUCKET_NAME;
const LIBRARY_CONFIG_KEY = '_index/library-config.json';
const TARGET_CAT = 'backup';
const APPLY = process.argv.includes('--apply');

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
  const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  return JSON.parse(await r.Body.transformToString('utf-8'));
}

async function putJson(key, obj) {
  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: JSON.stringify(obj),
      ContentType: 'application/json',
    })
  );
}

async function main() {
  console.log('R2 storybook 키 목록 가져오는 중...');
  const bookKeys = await listAllKeys('storybook-');
  console.log(`총 storybook.json 키: ${bookKeys.length}`);

  // 병렬로 읽고 isPublic===false 인 책만 추리기
  const candidates = [];
  let i = 0;
  const concurrency = 12;
  async function worker() {
    while (i < bookKeys.length) {
      const key = bookKeys[i++];
      try {
        const sb = await getJson(key);
        if (sb.isPublic === false) {
          candidates.push({
            key,
            id: sb.id,
            title: sb.title,
            currentCategory: sb.category ?? '기타',
          });
        }
      } catch (e) {
        console.error(`  read fail: ${key} — ${e.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // 이미 backup 인 것은 skip 표시
  const toMove = candidates.filter((b) => b.currentCategory !== TARGET_CAT);
  const alreadyBackup = candidates.filter((b) => b.currentCategory === TARGET_CAT);

  console.log(`\n비공개(isPublic=false) 책: ${candidates.length}권`);
  console.log(`  이미 backup: ${alreadyBackup.length}권`);
  console.log(`  이동 대상: ${toMove.length}권`);
  console.log(APPLY ? '\n=== 실제 적용 ===' : '\n=== DRY RUN (--apply 로 실제 실행) ===\n');

  // 카테고리별 그룹 출력
  const byCat = new Map();
  for (const b of toMove) {
    if (!byCat.has(b.currentCategory)) byCat.set(b.currentCategory, []);
    byCat.get(b.currentCategory).push(b);
  }
  for (const [cat, books] of [...byCat.entries()].sort((a, b) => b[1].length - a[1].length)) {
    console.log(`\n  [${cat}] ${books.length}권`);
    for (const b of books) {
      console.log(`    - ${b.id} | ${b.title}`);
    }
  }

  if (!APPLY) {
    console.log('\nDRY RUN 종료. --apply 로 다시 실행하면 실제 R2 patch.');
    return;
  }

  if (toMove.length === 0) {
    console.log('\n이동할 책이 없습니다.');
    return;
  }

  console.log('\n적용 시작...');
  let ok = 0;
  let fail = 0;
  const failures = [];
  for (let j = 0; j < toMove.length; j++) {
    const b = toMove[j];
    try {
      const sb = await getJson(b.key);
      sb.category = TARGET_CAT;
      sb.updatedAt = new Date().toISOString();
      await putJson(b.key, sb);
      ok++;
      if ((j + 1) % 10 === 0) console.log(`  ... ${j + 1} / ${toMove.length}`);
    } catch (e) {
      fail++;
      failures.push({ ...b, error: e.message });
    }
  }

  console.log(`\nstorybook patch 결과: ok=${ok} fail=${fail}`);
  if (failures.length > 0) {
    console.log('실패 list:');
    failures.forEach((f) => console.log(`  ${f.id} | ${f.title} | ${f.error}`));
  }

  // library-config 에 'backup' 등록 보장
  console.log('\nlibrary-config.json 정합성 확인...');
  let cfg;
  try {
    cfg = await getJson(LIBRARY_CONFIG_KEY);
  } catch {
    cfg = {};
  }
  const categoryList = cfg.categoryList ?? [];
  const categoryOrder = cfg.categoryOrder ?? [];
  let changed = false;
  if (!categoryList.includes(TARGET_CAT)) {
    categoryList.push(TARGET_CAT);
    changed = true;
  }
  if (!categoryOrder.includes(TARGET_CAT)) {
    categoryOrder.push(TARGET_CAT); // 맨 뒤로
    changed = true;
  }
  if (changed) {
    await putJson(LIBRARY_CONFIG_KEY, {
      ...cfg,
      categoryList,
      categoryOrder,
      updatedAt: new Date().toISOString(),
    });
    console.log('library-config.json 갱신 (backup 카테고리 등록).');
  } else {
    console.log('library-config.json 변경 없음 (이미 등록됨).');
  }

  console.log('\n끝. /library-master 새로고침해서 backup 카테고리 확인.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
