#!/usr/bin/env node
/**
 * 모든 storybook 의 (id, title, category, type, isPublic, ageRange?, keyObjects 일부) 덤프.
 * /library-master 카테고리 재분류 작업용. variant (`__L\d+$`) 는 base 만 남김.
 *
 * 출력: packages/server/scripts/_data/books-by-category.json
 *   {
 *     summary: { totalBooks, byCategory: { [cat]: count } },
 *     books: [{ id, title, category, type, isPublic, ageRange, keyObjectSample, ... }]
 *   }
 */
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';
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
const VARIANT_RE = /__L\d+$/;

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
  const text = await out.Body.transformToString();
  return JSON.parse(text);
}

async function main() {
  console.log('R2 storybook 키 목록 가져오는 중...');
  const bookKeys = await listAllKeys('storybook-');
  console.log(`총 storybook.json 키: ${bookKeys.length}`);

  const books = [];
  let i = 0;
  const concurrency = 12;
  async function worker() {
    while (i < bookKeys.length) {
      const key = bookKeys[i++];
      try {
        const sb = await getJson(key);
        const id = sb.id;
        if (!id) continue;
        // variant 는 base 만 남김
        if (VARIANT_RE.test(id)) continue;
        const ko = sb.keyObjects ?? sb.key_objects ?? [];
        const sample = ko.slice(0, 6).map((o) => o.korean || o.word || o.english).filter(Boolean);
        books.push({
          id,
          title: sb.title,
          category: sb.category ?? '기타',
          type: sb.type ?? 'storybook',
          phonicsLanguage: sb.phonicsLanguage,
          isPublic: sb.isPublic ?? false,
          ageRange: sb.ageRange ?? sb.educational_content?.age_range,
          summary: (sb.summary || sb.overview || '').slice(0, 160),
          keyObjectSample: sample,
          pageCount: Array.isArray(sb.pages) ? sb.pages.length : undefined,
        });
      } catch (err) {
        console.warn(`skip ${key}: ${err.message}`);
      }
    }
  }
  await Promise.all(Array.from({ length: concurrency }, worker));

  // 카테고리별 count
  const byCategory = {};
  for (const b of books) {
    byCategory[b.category] = (byCategory[b.category] ?? 0) + 1;
  }

  // sort: storybook 카테고리 우선, 그 안에서 title
  books.sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    return (a.title || '').localeCompare(b.title || '', 'ko');
  });

  const outDir = path.join(__dirname, '_data');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'books-by-category.json');
  fs.writeFileSync(
    outPath,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary: { totalBooks: books.length, byCategory },
        books,
      },
      null,
      2
    )
  );
  console.log(`\n저장: ${outPath}`);
  console.log('\n카테고리별 권수:');
  for (const [cat, n] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${cat}: ${n}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
