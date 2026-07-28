// 예약된 한국어 롱폼을 **요일별 라인 로테이션**으로 재배치한다.
//
// 왜(2026-07-28 실측):
//  - 재배치 전엔 9월까지 예약의 100% 가 생활동화였다. 그런데 네이버 월 검색량은
//    양치습관 **60** · 배변훈련 1,520 · 편식 1,860 으로, 신데렐라 33,120 · 티라노사우루스 31,960 의
//    1/20~1/500 이다. 수요가 가장 작은 라인에 전 슬롯을 쓰고 있었다.
//  - 우리 실측 CTR 도 공룡·자연 6~7% vs 명작 1.7~2.4% vs 생활동화 노출 ≈0 이고,
//    검색 유입어는 **전량 공룡 종명**이다(파키케팔로사우루스 57회·117분이 최대 기여).
//
// 🔴 토요일은 비운다 — 30분+ 묶음이 그날 유일 영상으로 들어간다(묶음은 이 테이블이 아니라
//    유튜브 자체 `publishAt` 으로 올라간다). 하루 1개 원칙은 그대로다.
//
// 복구: `metadata->>'sched_backup_rebalance'` 를 `scheduled_at` 에 되쓰면 된다.
//
// 실행:
//   tsx scripts/rebalance-youtube-schedule.ts             # dry-run
//   tsx scripts/rebalance-youtube-schedule.ts --apply
//   옵션: --start=2026-07-29  --hour=10
import dotenv from 'dotenv';
dotenv.config({ override: true });
const { getSupabaseAdmin } = await import('../src/providers/supabase-admin.provider.js');

function flag(name: string, d = ''): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : d;
}
const APPLY = process.argv.includes('--apply');
const HOUR = Number(flag('hour', '10'));

/** 요일 → 라인. 0=일 … 6=토. 토(6)는 묶음용으로 비운다. */
const WEEKDAY_LINE: Record<number, 'nature' | 'classic' | 'life' | null> = {
  1: 'nature', // 월
  2: 'classic', // 화
  3: 'nature', // 수
  4: 'classic', // 목
  5: 'nature', // 금
  6: null, // 토 — 묶음
  0: 'life', // 일
};

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase 서비스 키 미설정.');

  const { data: rows, error } = await sb
    .from('mkt_publish_records')
    .select('id, scheduled_at, content_id, metadata')
    .eq('channel', 'youtube')
    .eq('status', 'scheduled')
    .eq('language', 'ko')
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true });
  if (error) throw new Error(error.message);

  const longform = (rows ?? []).filter((r: any) => r.metadata?.content_kind === 'longform');
  const ids = [...new Set(longform.map((r: any) => r.content_id))];
  const { data: contents } = await sb.from('mkt_contents').select('id, category').in('id', ids);
  const catById = new Map((contents ?? []).map((c: any) => [c.id, c.category]));

  const queues: Record<string, any[]> = { nature: [], classic: [], life: [] };
  for (const r of longform) {
    const raw = catById.get(r.content_id);
    const line = raw === 'nature' ? 'nature' : raw === 'life' ? 'life' : 'classic';
    queues[line].push(r);
  }
  console.log(
    `대상 ${longform.length}편 — 자연 ${queues.nature.length} · 명작 ${queues.classic.length} · 생활 ${queues.life.length}`
  );

  // 시작일: 기본은 내일(오늘 발행분은 건드리지 않는다).
  const startStr = flag('start');
  const start = startStr
    ? new Date(`${startStr}T00:00:00Z`)
    : new Date(
        Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate() + 1)
      );

  const plan: { id: string; at: string; line: string; old: string }[] = [];
  const cursor = { nature: 0, classic: 0, life: 0 };
  let day = 0;
  while (plan.length < longform.length && day < 2000) {
    const d = new Date(start.getTime() + day * 86400_000);
    const line = WEEKDAY_LINE[d.getUTCDay()];
    day++;
    if (!line) continue; // 토 = 묶음 슬롯
    const q = queues[line];
    if (cursor[line] >= q.length) continue; // 그 라인은 소진 — 다음 해당 요일로
    const rec = q[cursor[line]++];
    d.setUTCHours(HOUR, 0, 0, 0);
    plan.push({ id: rec.id, at: d.toISOString(), line, old: rec.scheduled_at });
  }

  console.log(`\n[처음 14일]`);
  for (const p of plan.slice(0, 14)) console.log(`  ${p.at.slice(0, 10)} ${p.line}`);
  const byLine = plan.reduce<Record<string, string>>((acc, p) => {
    acc[p.line] = p.at.slice(0, 10);
    return acc;
  }, {});
  console.log(`\n라인별 마지막 날: ${JSON.stringify(byLine)}`);
  console.log(`배치 ${plan.length}/${longform.length}편`);

  if (!APPLY) {
    console.log('\nDry-run — 변경 없음. 적용은 --apply.');
    return;
  }
  let done = 0;
  for (const p of plan) {
    const rec = longform.find((r: any) => r.id === p.id)!;
    const meta = { ...(rec.metadata ?? {}) };
    if (!meta.sched_backup_rebalance) meta.sched_backup_rebalance = rec.scheduled_at;
    const { error: e } = await sb
      .from('mkt_publish_records')
      .update({ scheduled_at: p.at, metadata: meta })
      .eq('id', p.id);
    if (e) console.error(`  ❌ ${p.id}: ${e.message}`);
    else done++;
  }
  console.log(`\n완료 — ${done}/${plan.length}편 재배치`);
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
