// 애니메이션 롱폼(ComfyUI 파이프라인 산출물)을 유튜브에 **예약 업로드**한다.
//
// 🔴 왜 DB 파이프라인(`mkt_publish_records`)이 아니라 유튜브 자체 `publishAt` 인가:
//    이 영상들은 Remotion 파이프라인 밖에서 만들어져 `mkt_youtube_contents` 행이 없다.
//    DB 경로로 가려면 9편 2.7GB 를 R2 에 올리고 발행 시각에 Railway 가 되받아야 한다.
//    묶음(compilation)에서 같은 이유로 유튜브 예약을 쓰기로 이미 정했다.
//
// 🔴 쿼터: `videos.insert` = 편당 1,600 units, 일일 10,000. **하루 최대 6편**이라
//    `--limit`/`--skip` 으로 나눠 올린다. 태평양 자정에 리셋된다.
//
// 실행:
//   tsx scripts/upload-animation-longform.ts                      # dry-run (계획만)
//   tsx scripts/upload-animation-longform.ts --limit=5 --apply
//   tsx scripts/upload-animation-longform.ts --skip=5 --apply     # 다음 날 나머지
import dotenv from 'dotenv';
dotenv.config({ path: 'C:/projects/tangobook/packages/server/.env', override: true });
import fs from 'node:fs';
import path from 'node:path';
import { createReadStream } from 'node:fs';

const { YouTubeProvider } = await import('../src/providers/youtube.provider.js');
const { R2Repository } = await import('../src/repositories/r2.repository.js');

const CHANNEL = process.env.ANIM_YT_CHANNEL_ID || 'd0e96623-0861-4a3f-9329-a39e8114da74'; // 탱고북 동화
const ROOT = 'D:/tangobook-video';
const META = JSON.parse(
  fs.readFileSync(path.join(import.meta.dirname, '_data/anim-meta-ko.json'), 'utf8')
) as Record<string, any>;

const argv = process.argv.slice(2);
const flag = (n: string, d = '') => {
  const hit = argv.find((a) => a.startsWith(`--${n}=`));
  return hit ? hit.slice(n.length + 3) : d;
};
const APPLY = argv.includes('--apply');
const LIMIT = Number(flag('limit', '0'));
const SKIP = Number(flag('skip', '0'));
const START = flag('start'); // YYYY-MM-DD, 첫 발행일
const HOUR_UTC = Number(flag('hour', '10')); // 10:00 UTC = 19:00 KST

/** 월·수·금 19:00 KST. 하루 1편 원칙(자기잠식 실측) + 주 3회. */
const WEEKDAYS = [1, 3, 5];
function slots(from: Date, n: number): Date[] {
  const out: Date[] = [];
  const d = new Date(from);
  while (out.length < n) {
    if (WEEKDAYS.includes(d.getUTCDay())) {
      const s = new Date(d);
      s.setUTCHours(HOUR_UTC, 0, 0, 0);
      if (s.getTime() > Date.now() + 3600_000) out.push(s);
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return out;
}

const books = Object.keys(META).filter((k) => !k.startsWith('_'));
const startDate = START ? new Date(`${START}T00:00:00Z`) : new Date(Date.now() + 86400_000);
const times = slots(startDate, books.length);

console.log(
  `대상 ${books.length}편 · 채널 ${CHANNEL} · 월수금 ${HOUR_UTC}:00 UTC (KST ${(HOUR_UTC + 9) % 24}시)\n`
);

const plan = books.map((id, i) => ({ id, at: times[i], ...META[id] }));
for (const p of plan) {
  const f = path.join(ROOT, p.file);
  const ok = fs.existsSync(f);
  console.log(
    `  ${p.at.toISOString().slice(0, 16).replace('T', ' ')}  ${ok ? '✅' : '🔴 파일없음'}  ${p.title.slice(0, 52)}`
  );
}

const targets = plan.slice(SKIP, LIMIT ? SKIP + LIMIT : undefined);
console.log(
  `\n이번 실행 대상: ${targets.length}편 (skip ${SKIP}${LIMIT ? ` · limit ${LIMIT}` : ''})`
);
console.log(`쿼터 예상: ${targets.length * 1650} units / 10,000`);
if (targets.length * 1650 > 10000) console.log('  ⚠️ 일일 쿼터 초과 — --limit 으로 나눌 것');

if (!APPLY) {
  console.log('\nDry-run — 업로드 없음. 실제 실행은 --apply.');
  process.exit(0);
}

function description(p: any): string {
  return [
    p.hook,
    '',
    `${p.title.split('|')[0].trim()} 이야기를 그림책 애니메이션으로 만들었어요.`,
    '중간광고 없이 이어집니다. 잠자리에서, 이동 중에 편안하게 들려주세요.',
    '',
    `📖 주제: ${p.theme}`,
    '',
    '탱고북은 4~7세 아이를 위한 그림동화 학습 앱입니다.',
    '👉 https://www.tangobook.co.kr',
    '',
    `#${p.tags[0].replace(/\s/g, '')} #세계명작동화 #동화 #그림책 #잠자리동화 #유아동화 #동화애니메이션`,
  ].join('\n');
}

let done = 0;
for (const p of targets) {
  const file = path.join(ROOT, p.file);
  if (!fs.existsSync(file)) {
    console.error(`  🔴 파일 없음, 건너뜀: ${p.file}`);
    continue;
  }
  const size = fs.statSync(file).size;
  console.log(`\n[${done + 1}/${targets.length}] ${p.title}`);
  try {
    const res = await YouTubeProvider.uploadVideo(
      createReadStream(file),
      {
        title: p.title.slice(0, 100),
        description: description(p),
        privacy: 'scheduled',
        publishAt: p.at.toISOString(),
        categoryId: '27',
        tags: [
          ...p.tags,
          '세계명작동화',
          '동화',
          '그림책',
          '잠자리동화',
          '유아동화',
          '동화애니메이션',
          '탱고북',
        ],
        language: 'ko',
      },
      (pct) => process.stdout.write(`\r  업로드 ${pct}%   `),
      CHANNEL,
      size
    );
    console.log(
      `\n  ✅ ${res.videoUrl} → ${p.at.toISOString().slice(0, 16).replace('T', ' ')} UTC 공개`
    );

    // 썸네일 = 언어별 표지
    try {
      const book: any = await R2Repository.getStorybook(p.id);
      const styles = book.styleAssets ?? {};
      const cover =
        book.primaryCoverByLang?.ko ||
        (Object.values(styles).find((v: any) => v?.primaryCoverByLang?.ko) as any)
          ?.primaryCoverByLang?.ko ||
        (Object.values(styles).find((v: any) => v?.coverImage) as any)?.coverImage ||
        book.coverImage;
      if (cover) {
        const buf = Buffer.from(await (await fetch(encodeURI(cover))).arrayBuffer());
        await YouTubeProvider.setThumbnail(res.videoId, buf, CHANNEL);
        console.log(`  🖼️  썸네일 설정`);
      }
    } catch (e) {
      console.error(`  ⚠️ 썸네일 실패: ${e instanceof Error ? e.message.slice(0, 60) : e}`);
    }
    done++;
  } catch (e) {
    console.error(`\n  🔴 업로드 실패: ${e instanceof Error ? e.message.slice(0, 120) : e}`);
  }
}
console.log(`\n완료 — ${done}/${targets.length}편`);
