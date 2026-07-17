// 유튜브 Shorts 자동 업로드 (데일리 드립).
// docs/marketing/drafts/shorts-upload-catalog.json 의 릴스를 R2에서 내려받아
// 이미 연동된 채널(기본 "탱고북스")에 YouTube Data API v3 로 업로드한다.
// 멱등: shorts-upload-state.json 에 업로드한 bookId 를 기록해 재실행 시 다음 것만 올린다.
//
// ⚠️ YouTube API 쿼터: videos.insert = 1회 1,600 units, 기본 일일 10,000 units
//    → 하루 최대 약 6개. 데일리 드립(--count 2~5)이 정확히 이 제약과 맞는다.
//
// 실행:
//   cd packages/server
//   node scripts/upload-shorts-youtube.mjs --dry-run            # 무엇이 올라갈지 미리보기
//   node scripts/upload-shorts-youtube.mjs --count=2            # 다음 2개 즉시 공개 업로드
//   node scripts/upload-shorts-youtube.mjs --count=3 --publish-at=19:00   # 19시(KST) 예약공개
//   node scripts/upload-shorts-youtube.mjs --count=5 --category=nature-dino  # 공룡만
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';
import { loadState, saveState } from './lib/shorts-state.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const DRAFTS = path.join(REPO, 'docs', 'marketing', 'drafts');
const CATALOG = path.join(DRAFTS, 'shorts-upload-catalog.json');

// ── args ──
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  })
);
const COUNT = parseInt(args.count ?? '2', 10);
const DRY = !!args['dry-run'];
const CHANNEL_TITLE = args.channel ?? '탱고북스';
const CATEGORY_FILTER = args.category ? String(args.category).split(',') : null;
const CATEGORY_ID = String(args['yt-category'] ?? '27'); // 27=Education
const MADE_FOR_KIDS = !!args['made-for-kids']; // 기본 false — 아래 주의 참조
const PUBLISH_AT = args['publish-at'] ? String(args['publish-at']) : null; // "HH:MM" KST

const readJson = (p, fb) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : fb);

/** HH:MM(KST) → i일 뒤 그 시각의 RFC3339(UTC). 이미 지난 오늘 시각이면 +1일. */
function publishAtIso(hhmm, dayOffset) {
  const [h, m] = hhmm.split(':').map(Number);
  const now = new Date();
  // KST = UTC+9. UTC 기준으로 오늘 KST h시 = UTC (h-9)시
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), h - 9, m, 0));
  if (d.getTime() <= now.getTime()) d.setUTCDate(d.getUTCDate() + 1);
  d.setUTCDate(d.getUTCDate() + dayOffset);
  return d.toISOString();
}

/** YouTube 썸네일 2MB 한도 대응: 초과 시 sharp 로 축소/재인코딩해 2MB 아래로. */
async function fitThumbnail(buf) {
  const LIMIT = 2_000_000;
  if (buf.length <= LIMIT) return buf;
  const sharp = (await import('sharp')).default;
  // 1) 너비 1080 로 축소 + png 최대 압축
  let out = await sharp(buf).resize({ width: 1080, withoutEnlargement: true })
    .png({ compressionLevel: 9 }).toBuffer();
  if (out.length <= LIMIT) return out;
  // 2) 여전히 크면 jpeg q82 (포스터라 화질 손실 미미)
  out = await sharp(buf).resize({ width: 1080, withoutEnlargement: true })
    .jpeg({ quality: 82 }).toBuffer();
  return out;
}

async function download(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(encodeURI(url));
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return Buffer.from(await res.arrayBuffer());
    } catch (e) {
      if (i === tries - 1) throw e;
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

async function main() {
  const catalog = readJson(CATALOG, null);
  if (!catalog) { console.error('카탈로그 없음. 먼저 build-shorts-catalog.mjs 실행.'); process.exit(1); }
  const state = await loadState();

  // 연동 채널 확인
  const channels = await YouTubeProvider.listChannels();
  const target = channels.find((c) => c.channelTitle === CHANNEL_TITLE || c.name === CHANNEL_TITLE);
  if (!target) {
    console.error(`채널 "${CHANNEL_TITLE}" 미연동. 연동됨: ${channels.map((c) => c.channelTitle).join(', ') || '없음'}`);
    process.exit(1);
  }

  // 올릴 대상 선별 (카탈로그 순서 = 공룡→자연→명작)
  let queue = catalog.filter((r) => r.videoUrl && !state.uploaded[r.bookId]);
  if (CATEGORY_FILTER) queue = queue.filter((r) => CATEGORY_FILTER.includes(r.category));
  const batch = queue.slice(0, COUNT);

  console.log(`채널: ${target.channelTitle} | 미업로드 잔여: ${queue.length} | 이번 업로드: ${batch.length}`);
  console.log(`카테고리(YT): ${CATEGORY_ID} | Made for Kids: ${MADE_FOR_KIDS} | 공개: ${PUBLISH_AT ? `${PUBLISH_AT} KST 예약` : '즉시 public'}`);
  if (batch.length === 0) { console.log('올릴 것이 없습니다.'); return; }

  for (let i = 0; i < batch.length; i++) {
    const r = batch[i];
    const publishAt = PUBLISH_AT ? publishAtIso(PUBLISH_AT, i) : undefined;
    const tags = (r.hashtags || '').split(/\s+/).map((t) => t.replace(/^#/, '')).filter(Boolean).slice(0, 15);
    console.log(`\n[${i + 1}/${batch.length}] ${r.subject} (${r.category})`);
    console.log(`  제목: ${r.ytTitle}`);
    if (publishAt) console.log(`  예약: ${publishAt}`);
    if (DRY) { console.log('  (dry-run — 실제 업로드 안 함)'); continue; }

    try {
      const buf = await download(r.videoUrl);
      console.log(`  다운로드 ${(buf.length / 1e6).toFixed(1)}MB → 업로드 중...`);
      const meta = {
        title: r.ytTitle,
        description: r.description,
        tags,
        categoryId: CATEGORY_ID,
        privacy: publishAt ? 'private' : 'public',
        language: 'ko',
        ...(publishAt ? { publishAt } : {}),
      };
      const { videoId, videoUrl } = await YouTubeProvider.uploadVideo(
        buf, meta, (p) => process.stdout.write(`\r  진행 ${p}%   `), target.id
      );
      process.stdout.write('\n');

      // 맞춤 썸네일(릴스 표지 = catalog coverUrl) 지정 — best-effort.
      // ⚠️ 맞춤 썸네일은 채널 인증(전화)된 계정만 API 허용 → 실패해도 영상 발행은 성공 유지.
      let thumbSetAt = null;
      if (r.coverUrl) {
        try {
          const tRes = await fetch(encodeURI(r.coverUrl));
          if (tRes.ok) {
            const tBuf = await fitThumbnail(Buffer.from(await tRes.arrayBuffer()));
            await YouTubeProvider.setThumbnail(videoId, tBuf, target.id);
            thumbSetAt = new Date().toISOString();
            console.log('  🖼️ 썸네일 지정 완료');
          }
        } catch (e) {
          console.warn(`  ⚠️ 썸네일 지정 실패(무시): ${String(e?.message || e)}`);
        }
      }

      state.uploaded[r.bookId] = {
        videoId, ytUrl: videoUrl, title: r.ytTitle, category: r.category,
        privacy: meta.privacy, publishAt: publishAt ?? null, uploadedAt: new Date().toISOString(),
        thumbSetAt,
      };
      await saveState(state);
      console.log(`  ✅ ${videoUrl}`);
    } catch (e) {
      const msg = String(e?.message || e);
      console.error(`  ❌ 실패: ${msg}`);
      if (/quota/i.test(msg)) { console.error('  → 일일 쿼터 소진. 내일 다시 실행하세요.'); break; }
    }
  }

  const done = Object.keys(state.uploaded).length;
  console.log(`\n누적 업로드: ${done}/${catalog.length} | 남음: ${catalog.length - done}`);
}
main();
