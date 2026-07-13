// 이미 발행된 유튜브 영상의 공개설정을 변경한다(예: unlisted → public).
// R2 에 저장된 유튜브 OAuth 토큰(system/youtube-channels.json)을 통해 videos.update 호출.
//
// 실행:
//   pnpm --filter @tangobook/server exec tsx scripts/set-youtube-privacy.ts <videoId> [public|unlisted|private]
//   (기본 privacy = public)
import 'dotenv/config';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';

async function main() {
  const videoId = process.argv[2];
  const privacy = (process.argv[3] ?? 'public') as 'public' | 'unlisted' | 'private';
  if (!videoId)
    throw new Error('사용법: set-youtube-privacy.ts <videoId> [public|unlisted|private]');
  if (!['public', 'unlisted', 'private'].includes(privacy)) {
    throw new Error(`privacy 는 public|unlisted|private 중 하나여야 합니다: ${privacy}`);
  }

  const before = await YouTubeProvider.getVideoMeta(videoId);
  console.log(
    `▶ ${videoId} "${before?.title ?? ''}" — 현재: ${before?.privacyStatus ?? '(알 수 없음)'}`
  );

  await YouTubeProvider.setPrivacy(videoId, privacy, before?.ownedByChannelId);

  const after = await YouTubeProvider.getVideoMeta(videoId);
  console.log(`✅ 변경 완료 — 현재: ${after?.privacyStatus} (https://youtu.be/${videoId})`);
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
