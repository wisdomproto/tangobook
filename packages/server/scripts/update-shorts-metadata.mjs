// 이미 업로드된 Shorts 의 제목·설명을 카탈로그 최신값으로 갱신 (videos.update, ~50 units/건).
// state(shorts-upload-state.json)에 기록된 영상 중 카탈로그 제목과 달라진 것을 찾아 YouTube 에 반영한다.
// 명작 제목 개선처럼 카탈로그를 고친 뒤, 이미 올라간 영상까지 맞출 때 쓴다.
//
// 실행:
//   cd packages/server
//   node scripts/update-shorts-metadata.mjs --dry-run          # 무엇이 바뀔지 미리보기
//   node scripts/update-shorts-metadata.mjs                     # 달라진 것만 갱신
//   node scripts/update-shorts-metadata.mjs --book=1772009873865  # 특정 책만
//   node scripts/update-shorts-metadata.mjs --force             # state==catalog 여도 전부 재적용
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '../../..');
const DRAFTS = path.join(REPO, 'docs', 'marketing', 'drafts');
const CATALOG = path.join(DRAFTS, 'shorts-upload-catalog.json');
const STATE = path.join(DRAFTS, 'shorts-upload-state.json');

const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, '').split('=');
  return [k, v === undefined ? true : v];
}));
const DRY = !!args['dry-run'];
const FORCE = !!args.force;
const ONLY_BOOK = args.book ? String(args.book) : null;
const CHANNEL_TITLE = args.channel ?? '탱고북스';

const readJson = (p, fb) => (fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf-8')) : fb);
const saveJson = (p, o) => fs.writeFileSync(p, JSON.stringify(o, null, 2), 'utf-8');

async function main() {
  const catalog = readJson(CATALOG, null);
  if (!catalog) { console.error('카탈로그 없음. build-shorts-catalog.mjs 먼저 실행.'); process.exit(1); }
  const byBook = Object.fromEntries(catalog.map((r) => [r.bookId, r]));
  const state = readJson(STATE, { uploaded: {} });

  const channels = await YouTubeProvider.listChannels();
  const target = channels.find((c) => c.channelTitle === CHANNEL_TITLE || c.name === CHANNEL_TITLE);
  if (!target) { console.error(`채널 "${CHANNEL_TITLE}" 미연동.`); process.exit(1); }
  const youtube = await YouTubeProvider.getAuthenticatedClient(target.id);

  // 갱신 후보: 업로드됨 + 카탈로그에 존재 + (제목 달라짐 or force) [+ 특정 책 필터]
  const candidates = Object.entries(state.uploaded)
    .filter(([bid]) => (ONLY_BOOK ? bid === ONLY_BOOK : true))
    .filter(([bid]) => byBook[bid])
    .filter(([bid, v]) => FORCE || v.title !== byBook[bid].ytTitle);

  console.log(`채널: ${target.channelTitle} | 갱신 대상: ${candidates.length}건`);
  if (candidates.length === 0) { console.log('바뀔 것이 없습니다.'); return; }

  for (const [bid, v] of candidates) {
    const r = byBook[bid];
    const tags = (r.hashtags || '').split(/\s+/).map((t) => t.replace(/^#/, '')).filter(Boolean).slice(0, 15);
    console.log(`\n[${r.subject}] ${v.videoId}`);
    console.log(`  옛: ${v.title}`);
    console.log(`  새: ${r.ytTitle}`);
    if (DRY) { console.log('  (dry-run)'); continue; }
    try {
      // 기존 categoryId 유지 (videos.update snippet 은 categoryId 필수)
      const cur = await youtube.videos.list({ part: ['snippet'], id: [v.videoId] });
      const snip = cur.data.items?.[0]?.snippet;
      const categoryId = snip?.categoryId ?? '27';
      await youtube.videos.update({
        part: ['snippet'],
        requestBody: {
          id: v.videoId,
          snippet: {
            title: r.ytTitle,
            description: r.description,
            tags,
            categoryId,
            defaultLanguage: 'ko',
          },
        },
      });
      state.uploaded[bid] = { ...v, title: r.ytTitle, metaUpdatedAt: new Date().toISOString() };
      saveJson(STATE, state);
      console.log('  ✅ 갱신 완료');
    } catch (e) {
      console.error('  ❌ 실패:', String(e?.message || e));
    }
  }
  console.log('\n완료.');
}
main();
