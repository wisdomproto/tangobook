// 지정한 videoId 들을 공개(public)로 전환한다. 비공개로 내려둔 Shorts 를 나중에 공개할 때 사용.
// 실행: cd packages/server && npx tsx scripts/publish-pending-shorts.mjs <videoId> [<videoId> ...]
import 'dotenv/config';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';

const IDS = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!IDS.length) { console.error('videoId 인자 필요'); process.exit(1); }

const chs = await YouTubeProvider.listChannels();
const t = chs.find((c) => c.channelTitle === '탱고북스' || c.name === '탱고북스');
if (!t) { console.error('채널 미연동'); process.exit(1); }
const yt = await YouTubeProvider.getAuthenticatedClient(t.id);

for (const id of IDS) {
  try {
    await yt.videos.update({
      part: ['status'],
      requestBody: { id, status: { privacyStatus: 'public', selfDeclaredMadeForKids: false } },
    });
    console.log(`🌐 공개: ${id}`);
  } catch (e) {
    console.error(`❌ ${id}: ${String(e?.message || e)}`);
  }
}
