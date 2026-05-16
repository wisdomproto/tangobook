#!/usr/bin/env node
/**
 * recategorize-proposal.json 의 매핑을 R2 storybook 에 적용.
 *
 * --dry (기본): 변경 list 만 출력
 * --apply: 실제 PutObject 로 category 필드 갱신 + library-config.json 갱신
 *
 * 주의: saveStorybook 우회 (title 안 바뀜 → 중복 체크 skip).
 */
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
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

const PROPOSAL = path.join(__dirname, '_data', 'recategorize-proposal.json');
const LIBRARY_CONFIG_KEY = '_index/library-config.json';
const APPLY = process.argv.includes('--apply');

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

async function patchBookCategory(id, newCat) {
  const realKey = id.startsWith('storybook-') ? `${id}.json` : `storybook-${id}.json`;
  const sb = await getJson(realKey);
  if (sb.category === newCat) return { skipped: true };
  sb.category = newCat;
  sb.updatedAt = new Date().toISOString();
  await putJson(realKey, sb);
  return { skipped: false };
}

async function main() {
  const proposal = JSON.parse(fs.readFileSync(PROPOSAL, 'utf-8'));
  const mappings = proposal.mappings ?? [];
  const categoryList = proposal.categoryList ?? [];

  console.log(
    `총 매핑 ${mappings.length}건 ${APPLY ? '— 실제 적용' : '— DRY RUN (--apply 로 실제 실행)'}`
  );
  console.log();

  for (const m of mappings) {
    console.log(`  ${m.id} | "${m.title}" | ${m.current} → ${m.proposed}`);
  }

  if (!APPLY) {
    console.log('\nDRY RUN 종료. --apply 로 다시 실행하면 실제 R2 patch.');
    return;
  }

  console.log('\n적용 시작...');
  let ok = 0;
  let skip = 0;
  let fail = 0;
  const failures = [];
  for (let i = 0; i < mappings.length; i++) {
    const m = mappings[i];
    try {
      const r = await patchBookCategory(m.id, m.proposed);
      if (r.skipped) skip++;
      else ok++;
      if ((i + 1) % 10 === 0) console.log(`  ... ${i + 1} / ${mappings.length}`);
    } catch (e) {
      fail++;
      failures.push({ ...m, error: e.message });
    }
  }

  console.log(`\nstorybook patch 결과: ok=${ok} skip=${skip} fail=${fail}`);
  if (failures.length > 0) {
    console.log('실패 list:');
    failures.forEach((f) => console.log(`  ${f.id} | ${f.title} | ${f.error}`));
  }

  console.log('\nlibrary-config.json 갱신 중...');
  let cfg;
  try {
    cfg = await getJson(LIBRARY_CONFIG_KEY);
  } catch {
    cfg = {};
  }
  const nextOrder = [];
  for (const c of categoryList) if (!nextOrder.includes(c)) nextOrder.push(c);
  for (const c of cfg.categoryOrder ?? []) if (!nextOrder.includes(c)) nextOrder.push(c);
  const nextCfg = {
    ...cfg,
    categoryList,
    categoryOrder: nextOrder,
    updatedAt: new Date().toISOString(),
  };
  await putJson(LIBRARY_CONFIG_KEY, nextCfg);
  console.log('library-config.json 갱신 완료.');
  console.log('\n끝. 학습자 /library 새로고침해서 새 카테고리 노출 확인.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
