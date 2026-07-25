// 우리 채널의 시청지속률·트래픽소스를 터미널에 덤프한다.
// 🔴 로직은 갖고 있지 않다 — `/marketing` 「메타 분석 → YouTube」 패널과 **같은 서비스**
//    (`services/mkt/external/youtube-own-analytics.ts`)를 호출한다. 두 구현이 갈라지면
//    화면과 터미널 숫자가 달라져서 진단을 못 믿게 된다.
//
// 노출수·CTR 은 Analytics API 에 없다(Studio 전용, `Unknown identifier (impressions)`).
//
// 실행:
//   tsx scripts/analyze-youtube-analytics.ts --channel="탱고북스" --days=28
//   옵션: --start=2026-06-26 --end=2026-07-23  --top=30  --json
import 'dotenv/config';
import { getOwnChannelAnalytics } from '../src/services/mkt/external/youtube-own-analytics.js';

function flag(name: string): string | undefined {
  const hit = process.argv.find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  if (!hit) return undefined;
  const eq = hit.indexOf('=');
  return eq === -1 ? '' : hit.slice(eq + 1);
}

function mmss(sec: number): string {
  const s = Math.round(sec || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

async function main() {
  const result = await getOwnChannelAnalytics({
    channelName: flag('channel') || '탱고북스',
    startDate: flag('start'),
    endDate: flag('end'),
    days: flag('days') ? Number(flag('days')) : undefined,
    top: flag('top') ? Number(flag('top')) : undefined,
  });

  if (flag('json') !== undefined) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (!result.available) {
    console.error(`❌ ${result.reason}`);
    if (result.actionUrl) console.error(`   → ${result.actionUrl}`);
    process.exit(1);
  }

  const { channel, period, totals, traffic, videos, formats } = result;
  console.log(`▶ ${channel.title} · ${period.startDate} ~ ${period.endDate}\n`);
  console.log('=== 채널 합계 ===');
  console.log(
    `  조회 ${totals.views} · 시청 ${Math.round(totals.minutes)}분 · ` +
      `평균지속 ${mmss(totals.avgViewDuration)} (${totals.avgViewPercentage.toFixed(1)}%) · 구독 +${totals.subscribersGained}\n`
  );

  console.log('=== 트래픽 소스 (조회 / 시청시간) ===');
  for (const t of traffic) {
    console.log(
      `  ${t.source.padEnd(16)} 조회 ${String(t.views).padStart(5)} · ${Math.round(t.minutes)}분`
    );
  }

  console.log('\n=== 영상별 (조회순) ===');
  console.log('조회  평균지속  지속률  길이   구독  제목');
  for (const v of videos) {
    console.log(
      `${String(v.views).padStart(4)}  ${mmss(v.avgViewDuration).padStart(7)}  ` +
        `${v.avgViewPercentage.toFixed(1).padStart(5)}%  ${v.isShort ? '쇼츠' : '롱폼'} ${String(v.seconds).padStart(3)}s  ` +
        `+${String(v.subscribersGained).padStart(2)}  ${v.title.slice(0, 46)}`
    );
  }

  for (const f of formats) {
    console.log(
      `\n${f.label === 'longform' ? '롱폼' : '쇼츠'}: ${f.count}편 · 조회 ${f.views} · ` +
        `가중 평균지속 ${mmss(f.weightedAvgViewDuration)} · 가중 지속률 ${f.weightedAvgViewPercentage.toFixed(1)}%`
    );
  }
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
