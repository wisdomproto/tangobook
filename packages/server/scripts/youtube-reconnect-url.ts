// 연동된 유튜브 채널의 스코프 상태를 보여주고, 재연동(OAuth 재동의) URL 을 출력한다.
//
// 왜 필요한가: CTR·노출수·시청지속률·트래픽소스는 YouTube **Analytics** API 라
// `yt-analytics.readonly` 스코프가 있어야 한다. 기존 저장 토큰에는 없어서 조회수만 볼 수 있고,
// "제목이 좋아졌나(CTR)" vs "영상이 지루한가(지속률)" 를 구분할 수 없다.
//
// 🔴 재연동은 채널을 새로 추가하지 않고 **내부 id 를 유지한 채 토큰만 교체**한다
// (youtube-channels.ts upsertChannel). 그래야 예약된 발행 레코드의 target_id 가 계속 유효하다.
//
// 실행:
//   pnpm --filter @tangobook/server exec tsx scripts/youtube-reconnect-url.ts
//   옵션: --name="탱고북스"   재연동할 채널 이름(state 로 전달, 표시명 갱신용)
import 'dotenv/config';
import { downloadFromR2 } from '../src/providers/r2.provider.js';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';
import { hasScopes, type StoredChannel } from '../src/providers/youtube-channels.js';

const ANALYTICS = 'https://www.googleapis.com/auth/yt-analytics.readonly';

function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
}

async function main() {
  let stored: StoredChannel[] = [];
  try {
    stored = JSON.parse((await downloadFromR2('system/youtube-channels.json')).toString('utf-8'));
  } catch {
    console.log('저장된 채널 정보를 읽지 못했습니다.');
  }

  console.log('=== 연동 채널 스코프 상태 ===\n');
  for (const c of stored) {
    const ok = hasScopes(c.tokens, [ANALYTICS]);
    console.log(`${c.channel.channelTitle || c.channel.name}`);
    console.log(`  내부 id   : ${c.channel.id}`);
    console.log(`  채널 id   : ${c.channel.channelId ?? '(없음)'}`);
    console.log(`  analytics : ${ok ? '✅ 있음' : '❌ 없음 → 재연동 필요'}`);
    console.log();
  }

  const needsReconnect = stored.filter((c) => !hasScopes(c.tokens, [ANALYTICS]));
  if (!needsReconnect.length) {
    console.log('✅ 모든 채널이 analytics 스코프를 갖고 있습니다. 재연동 불필요.');
    return;
  }

  const name = flag('name') || needsReconnect[0].channel.channelTitle || '';
  console.log('=== 재연동 URL ===');
  console.log(`대상: ${name}\n`);
  console.log(YouTubeProvider.getAuthUrl(name));
  console.log('\n안내:');
  console.log('  1. 위 URL 을 브라우저에서 열고 **그 채널의 구글 계정**으로 로그인');
  console.log('  2. 권한 동의 (YouTube Analytics 항목이 새로 보입니다)');
  console.log('  3. 콜백이 서버로 돌아오면 토큰이 교체됩니다(채널 중복 생성 안 함)');
  console.log('  4. 이 스크립트를 다시 실행해 ✅ 로 바뀌었는지 확인');
  console.log('\n⚠️ 채널이 여러 개면 채널마다 따로 해야 합니다(--name 으로 지정).');
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
