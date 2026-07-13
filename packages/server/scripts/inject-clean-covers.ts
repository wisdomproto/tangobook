// 수동 제작한 클린 표지(텍스트 없는)를 R2 + styleAssets[style].cleanCoverImage 에 주입.
// Gemini 가 PROHIBITED_CONTENT 로 거부한 명작 표지를 손으로 만들어 파이프라인에 넣는 경로.
// 주입 후 register-lang-covers(manifest→bake→ingest) 재실행으로 vi/th/zh 표지 자동 완성.
//   pnpm --filter @tangobook/server exec tsx scripts/inject-clean-covers.ts
import 'dotenv/config';
import fs from 'node:fs';
import sharp from 'sharp';
import type { Storybook } from '@tangobook/shared';
import { uploadBufferToR2 } from '../src/providers/r2.provider.js';
import { R2Repository } from '../src/repositories/r2.repository.js';
import { buildCleanKey } from '../src/services/covers/clean-cover.js';

const DL = 'C:/Users/101024/Downloads';
const jobs = [
  {
    file: `${DL}/Remove_the_Korean_text_from_this_col-1783948072981.png`,
    id: '1772182206245',
    style: 'style-1778824179240',
    label: '이상한 나라의 앨리스(콜라주)',
  },
  {
    file: `${DL}/Remove_the_Korean_text_from_this_collage-sty-1783948070008.png`,
    id: '1772197180029',
    style: 'style-1778824179240',
    label: '정글북(콜라주)',
  },
  {
    file: `${DL}/Remove_the_Korean_text_from_the_wooden_sign-1783948067867.png`,
    id: '1778555233699',
    style: 'style-1778824179240',
    label: '백설공주(콜라주)',
  },
];

async function main() {
  for (const job of jobs) {
    if (!fs.existsSync(job.file)) {
      console.error(`  ✗ ${job.label}: 파일 없음 ${job.file}`);
      continue;
    }
    const png = fs.readFileSync(job.file);
    const webp = await sharp(png).webp({ quality: 90 }).toBuffer();
    const ts = Date.now();
    const url = await uploadBufferToR2(webp, buildCleanKey(job.id, job.style, ts), 'image/webp');

    const sb = (await R2Repository.getStorybook(job.id)) as Storybook | null;
    if (!sb) {
      console.error(`  ✗ ${job.label}(${job.id}): storybook 로드 실패`);
      continue;
    }
    sb.styleAssets ??= {};
    sb.styleAssets[job.style] ??= {};
    sb.styleAssets[job.style].cleanCoverImage = url;
    if (job.style === sb.artStyle) sb.cleanCoverImage = url;
    await R2Repository.saveStorybook(sb);
    console.log(
      `  ✓ ${job.label} / ${job.style}${job.style === sb.artStyle ? ' (대표)' : ''} → ...${url.slice(-56)}`
    );
  }
  console.log('\n[inject] 완료 — 다음: register-lang-covers manifest→bake→ingest');
}

main().catch((e) => {
  console.error('[inject] 오류:', e);
  process.exit(1);
});
