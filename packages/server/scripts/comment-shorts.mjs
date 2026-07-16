// 업로드된 Shorts 에 사이트 유입용 링크 댓글을 자동으로 단다.
// ⚠️ 댓글 삽입은 API 로 되지만 "고정(핀)"은 API 미지원 → 스튜디오에서 한 번씩 수동 고정 필요.
// state(shorts-upload-state.json)에 commentedAt 기록 → 멱등(이미 단 것은 스킵).
//
// 실행: cd packages/server
//   npx tsx scripts/comment-shorts.mjs --dry-run    # 미리보기
//   npx tsx scripts/comment-shorts.mjs              # 아직 안 단 것만
//   npx tsx scripts/comment-shorts.mjs --book=1772009873865
//   npx tsx scripts/comment-shorts.mjs --force      # 이미 단 것도 다시
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

const buildComment = (r) =>
  `📖 「${r.subject}」 전체를 그림책으로 여기서 볼 수 있어요 👉 ${r.deeplink}\n` +
  `탱고북 — 광고 없는 명작·자연관찰 동화, 7일 무료 체험 (tangobook.co.kr)`;

async function main() {
  const catalog = readJson(CATALOG, null);
  if (!catalog) { console.error('카탈로그 없음.'); process.exit(1); }
  const byBook = Object.fromEntries(catalog.map((r) => [r.bookId, r]));
  const state = readJson(STATE, { uploaded: {} });

  const channels = await YouTubeProvider.listChannels();
  const target = channels.find((c) => c.channelTitle === CHANNEL_TITLE || c.name === CHANNEL_TITLE);
  if (!target) { console.error(`채널 "${CHANNEL_TITLE}" 미연동.`); process.exit(1); }
  const youtube = await YouTubeProvider.getAuthenticatedClient(target.id);

  const cands = Object.entries(state.uploaded)
    .filter(([bid]) => (ONLY_BOOK ? bid === ONLY_BOOK : true))
    .filter(([bid]) => byBook[bid])
    .filter(([, v]) => FORCE || !v.commentedAt);

  console.log(`채널: ${target.channelTitle} | 댓글 대상: ${cands.length}건`);
  let ok = 0, fail = 0;
  for (const [bid, v] of cands) {
    const r = byBook[bid];
    const text = buildComment(r);
    console.log(`\n[${r.subject}] ${v.videoId}`);
    if (DRY) { console.log(`  ${text.replace(/\n/g, '\n  ')}`); continue; }
    try {
      await youtube.commentThreads.insert({
        part: ['snippet'],
        requestBody: {
          snippet: { videoId: v.videoId, topLevelComment: { snippet: { textOriginal: text } } },
        },
      });
      state.uploaded[bid] = { ...v, commentedAt: new Date().toISOString() };
      saveJson(STATE, state);
      ok++; console.log('  💬 댓글 완료');
    } catch (e) {
      fail++;
      const msg = String(e?.message || e);
      console.error(`  ❌ 실패: ${msg}`);
      if (/insufficient|scope|forbidden|403/i.test(msg)) {
        console.error('  → 댓글 쓰기 권한(youtube.force-ssl) 이 채널 토큰에 없을 수 있음. 재인증 필요.');
      }
    }
  }
  console.log(`\n댓글 완료: 성공 ${ok} · 실패 ${fail}`);
  if (ok > 0) console.log('※ 핀 고정은 API 미지원 — 스튜디오에서 각 댓글 ⋮ → "고정" 필요.');
}
main();
