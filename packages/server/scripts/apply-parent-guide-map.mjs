#!/usr/bin/env node
/**
 * parent-guide-map.json 의 콘텐츠를 R2 storybook 의 parentGuide 에 머지.
 *
 * Input: packages/server/scripts/_data/parent-guide-map.json
 *   {
 *     "<bookId>": {
 *       "overview"?: string,
 *       "lessons"?: string[],
 *       "readingTips"?: string[],
 *       "faq"?: { q: string; a: string }[]
 *     }
 *   }
 *
 * 동작: R2 GET → parentGuide 머지 (overview/lessons/readingTips 는 비어있지 않은 새 값만
 *   덮어씀, faq 는 새 값이 있으면 교체) → R2 PUT.
 *
 * 🔴 로컬 서버를 경유하지 않는다(2026-07-28). 예전엔 `POST /api/storybooks` 로 저장했는데,
 * 그러려면 프로덕션 .env 로 서버를 띄워야 하고 그 순간 마케팅 발행 스케줄러(60s tick)가
 * 예약된 유튜브·인스타 콘텐츠를 실제로 발행해 버린다. 데이터 한 건 고치자고 감수할 일이 아니다.
 * → @aws-sdk/client-s3 로 직접 read-modify-write.
 *
 * 사용: node packages/server/scripts/apply-parent-guide-map.mjs            # dry-run
 *       node packages/server/scripts/apply-parent-guide-map.mjs --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// .env 로드 (R2 자격증명)
const envPath = path.join(__dirname, '..', '.env');
for (const line of fs.readFileSync(envPath, 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
  if (m) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}

const { S3Client, GetObjectCommand, PutObjectCommand } = await import('@aws-sdk/client-s3');

const INPUT = path.join(__dirname, '_data', 'parent-guide-map.json');
const APPLY = process.argv.includes('--apply');
const BUCKET = process.env.R2_BUCKET_NAME;

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const streamToString = async (body) => {
  const chunks = [];
  for await (const c of body) chunks.push(c);
  return Buffer.concat(chunks).toString('utf-8');
};

async function main() {
  if (!fs.existsSync(INPUT)) {
    console.error(`입력 없음: ${INPUT}`);
    process.exit(1);
  }
  const map = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
  const ids = Object.keys(map);
  console.log(`적용 대상: ${ids.length} 권 (${APPLY ? 'APPLY' : 'DRY-RUN'})`);

  let ok = 0;
  let fail = 0;
  for (const id of ids) {
    const patch = map[id];
    const key = `storybook-${id}.json`;
    try {
      const obj = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
      const book = JSON.parse(await streamToString(obj.Body));

      // snake_case 혼용 데이터가 있어 둘 다 본다.
      const prev = book.parentGuide || book.parent_guide || { overview: '', lessons: [], readingTips: [] };
      const merged = {
        overview:
          typeof patch.overview === 'string' && patch.overview.trim()
            ? patch.overview.trim()
            : prev.overview || '',
        lessons: Array.isArray(patch.lessons) && patch.lessons.length ? patch.lessons : prev.lessons || [],
        readingTips:
          Array.isArray(patch.readingTips) && patch.readingTips.length
            ? patch.readingTips
            : prev.readingTips || [],
      };
      if (Array.isArray(patch.faq) && patch.faq.length) merged.faq = patch.faq;
      else if (Array.isArray(prev.faq)) merged.faq = prev.faq;

      book.parentGuide = merged;

      console.log(`[${id}] ${book.title}`);
      console.log(
        `  overview ${merged.overview.length}자 · lessons ${merged.lessons.length} · tips ${merged.readingTips.length} · faq ${merged.faq?.length ?? 0}`
      );

      if (APPLY) {
        await s3.send(
          new PutObjectCommand({
            Bucket: BUCKET,
            Key: key,
            Body: JSON.stringify(book),
            ContentType: 'application/json',
          })
        );
      }
      ok++;
    } catch (e) {
      console.error(`  FAIL ${id}: ${e.message}`);
      fail++;
    }
  }
  console.log(`\n=== ${ok} OK · ${fail} FAIL ===`);
  if (!APPLY) console.log('DRY-RUN 이었습니다. --apply 로 실제 저장.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
