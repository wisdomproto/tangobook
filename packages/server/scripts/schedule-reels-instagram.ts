// 마케팅 릴스(mkt_instagram_contents.video_settings.reels[lang])를 인스타그램 예약 발행 큐에 배치 등록.
//
// mkt_publish_records 에 status='scheduled' + channel='instagram' + metadata{target_id, content_kind:'reels'}
// 행을 넣으면, 프로덕션 스케줄러(publish-scheduler Step C publishDueMeta)가 scheduled_at 도래 시 자동 발행한다.
// 발행 순간 캡션·영상은 executor(loadReel)가 콘텐츠에서 추출 — 여기선 "언제/어느 IG로" 만 예약한다.
//
// IG 타겟 id 는 공개 연동 엔드포인트(/api/mkt/meta/connection, 토큰 미포함)에서 해석 → 로컬 enc 키 불필요.
// Supabase 는 SERVICE_ROLE(로컬 .env, 프로덕션 DB 를 가리킴)로 직접 insert.
//
// 실행 (dry-run — 계획만 출력, DB 쓰기 없음):
//   pnpm --filter @tangobook/server exec tsx scripts/schedule-reels-instagram.ts --dry-run
// 실행 (실제 예약):
//   pnpm --filter @tangobook/server exec tsx scripts/schedule-reels-instagram.ts
//
// 플래그:
//   --dry-run            DB 쓰기 없이 스케줄만 출력
//   --limit=N            앞에서 N 권만
//   --per-day=2          하루 발행 개수(기본 2)
//   --times=8,19         KST 슬롯 시각(기본 08,19시), --per-day 와 개수 일치
//   --start=today-eve    첫 슬롯 = 오늘 저녁(기본) | today-am | tomorrow-am
//   --lang=ko            발행 언어(기본 ko)
//   --target-id=<igid>   IG 타겟 id 직접 지정(연동 조회 건너뜀)
//   --api=<origin>       연동 조회 오리진(기본 https://tangobook.co.kr)
import 'dotenv/config';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';
import { resolveNatureBookIds } from '../src/services/reel/reel-targets.js';

interface ReelRow {
  content_id: string;
  title: string;
  project_id: string;
  owner_id: string;
  bookId: string;
  isNature: boolean;
}

/** 명작·자연관찰을 번갈아 섞음(짝수 인덱스=명작, 홀수=자연관찰). 한쪽 소진 시 나머지 append. */
function interleave(classics: ReelRow[], nature: ReelRow[]): ReelRow[] {
  const out: ReelRow[] = [];
  let ci = 0;
  let ni = 0;
  // 자연관찰이 약 2배라 명작1:자연관찰2 리듬으로 섞어 고르게 분포.
  while (ci < classics.length || ni < nature.length) {
    if (ci < classics.length) out.push(classics[ci++]);
    if (ni < nature.length) out.push(nature[ni++]);
    if (ni < nature.length) out.push(nature[ni++]);
  }
  return out;
}

// 유명작 우선 — 인지도 높은 명작부터 강한 훅으로 유입. 목록에 없는 제목은 뒤에 가나다순.
const MARQUEE_ORDER = [
  '신데렐라',
  '백설공주',
  '인어 공주',
  '라푼젤',
  '잠자는 숲속의 공주',
  '개구리 왕자',
  '빨간모자',
  '아기 돼지 삼형제',
  '피노키오',
  '이상한 나라의 앨리스',
  '오즈의 마법사',
  '알라딘과 요술 램프',
  '어린 왕자',
  '눈의 여왕',
  '미운 아기 오리',
  '엄지 아가씨',
  '브레멘 음악대',
  '토끼와 거북이',
  '개미와 베짱이',
  '정글북',
  '호두까기 인형',
  '빨강머리 앤',
  '하이디',
  '플란다스의 개',
  '성냥팔이 소녀',
  '백조 왕자',
  '행복한 왕자',
  '소공녀',
  '신드바드의 모험',
  '키다리 아저씨',
];

function argVal(name: string, def?: string): string | undefined {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : def;
}
function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function marqueeRank(title: string): number {
  const i = MARQUEE_ORDER.indexOf(title.trim());
  return i === -1 ? MARQUEE_ORDER.length : i;
}

/** KST(=UTC+9) 벽시계(day 오프셋, hour) → UTC Date. hour-9 가 음수면 Date.UTC 가 전날로 롤오버. */
function makeSlots(count: number, times: number[], start: string): Date[] {
  const now = new Date();
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000); // UTC 필드가 KST 벽시계가 되도록 시프트
  const y = kstNow.getUTCFullYear();
  const m = kstNow.getUTCMonth();
  const d = kstNow.getUTCDate();
  const slot = (dayOffset: number, hour: number) =>
    new Date(Date.UTC(y, m, d + dayOffset, hour - 9, 0, 0));

  const sorted = [...times].sort((a, b) => a - b);
  const slots: Date[] = [];

  if (start === 'today-eve') {
    // 오늘 저녁 슬롯(가장 늦은 시각) 하나로 시작, 이후 날부터 전체 슬롯.
    slots.push(slot(0, sorted[sorted.length - 1]));
    let day = 1;
    while (slots.length < count) {
      for (const h of sorted) if (slots.length < count) slots.push(slot(day, h));
      day++;
    }
  } else {
    const startDay = start === 'today-am' ? 0 : 1; // tomorrow-am
    let day = startDay;
    while (slots.length < count) {
      for (const h of sorted) if (slots.length < count) slots.push(slot(day, h));
      day++;
    }
  }

  // 첫 슬롯이 이미 과거면(밤에 실행 등) 5분 뒤로 — 오늘 저녁 게시 보장.
  const floor = now.getTime() + 5 * 60 * 1000;
  if (slots[0].getTime() < floor) slots[0] = new Date(floor);
  return slots;
}

async function resolveTargetId(): Promise<{
  targetId: string;
  pageName: string;
  username: string;
}> {
  const explicit = argVal('target-id');
  if (explicit) return { targetId: explicit, pageName: '(수동 지정)', username: '' };
  const api = argVal('api', 'https://tangobook.co.kr')!;
  const res = await fetch(`${api}/api/mkt/meta/connection`);
  if (!res.ok) throw new Error(`연동 조회 실패: HTTP ${res.status}`);
  const j = (await res.json()) as {
    connected: boolean;
    pages?: Array<{ id: string; name: string; instagram: { id: string; username: string } | null }>;
  };
  if (!j.connected) throw new Error('Meta 연동이 없습니다. /marketing 에서 연결하세요.');
  const igPage = (j.pages ?? []).find((p) => p.instagram?.id);
  if (!igPage?.instagram) throw new Error('IG 비즈니스 계정이 연결된 페이지가 없습니다.');
  return {
    targetId: igPage.instagram.id,
    pageName: igPage.name,
    username: igPage.instagram.username,
  };
}

function fmtKst(d: Date): string {
  const k = new Date(d.getTime() + 9 * 3600 * 1000);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())} KST`;
}

async function main() {
  const dryRun = hasFlag('dry-run');
  const lang = argVal('lang', 'ko')!;
  const perDay = Number(argVal('per-day', '2'));
  const times = argVal('times', '8,19')!
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !Number.isNaN(n));
  const start = argVal('start', 'today-eve')!;
  const limit = argVal('limit') ? Number(argVal('limit')) : undefined;
  if (times.length !== perDay) {
    throw new Error(`--times(${times.length}개) 와 --per-day(${perDay}) 개수가 같아야 합니다.`);
  }

  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('SUPABASE_SERVICE_ROLE_KEY 미설정 — 예약 insert 불가');

  // 1) IG 타겟 해석
  const { targetId, pageName, username } = await resolveTargetId();
  console.log(`\n📷 IG 타겟: ${pageName}${username ? ` (@${username})` : ''} · id=${targetId}\n`);

  // 2) 릴스 보유 콘텐츠 로드 (해당 언어 릴스 videoUrl 존재)
  const { data: igRows, error: e1 } = await sb
    .from('mkt_instagram_contents')
    .select('content_id, video_settings');
  if (e1) throw new Error(e1.message);
  const reelContentIds = (igRows ?? [])
    .filter((r: any) => r.video_settings?.reels?.[lang]?.videoUrl)
    .map((r: any) => r.content_id as string);
  if (!reelContentIds.length) throw new Error(`언어 ${lang} 릴스가 있는 콘텐츠가 없습니다.`);

  const { data: contents, error: e2 } = await sb
    .from('mkt_contents')
    .select('id, title, project_id, memo, project:mkt_projects(user_id)')
    .in('id', reelContentIds);
  if (e2) throw new Error(e2.message);
  const natureSet = new Set(resolveNatureBookIds());
  let rows: ReelRow[] = (contents ?? []).map((c: any) => {
    const bookId = (c.memo ?? '').replace('storybook:', '');
    return {
      content_id: c.id,
      title: c.title ?? '',
      project_id: c.project_id,
      owner_id: c.project?.user_id,
      bookId,
      isNature: natureSet.has(bookId),
    };
  });

  // 3) 명작(유명작순)·자연관찰(가나다순)으로 나눠 번갈아 섞음
  const classics = rows
    .filter((r) => !r.isNature)
    .sort(
      (a, b) => marqueeRank(a.title) - marqueeRank(b.title) || a.title.localeCompare(b.title, 'ko')
    );
  const nature = rows
    .filter((r) => r.isNature)
    .sort((a, b) => a.title.localeCompare(b.title, 'ko'));
  rows = interleave(classics, nature);

  // 4) 멱등 — 이미 예약/발행/발행중인 IG 릴스 레코드가 있는 콘텐츠는 건너뜀
  const { data: existing, error: e3 } = await sb
    .from('mkt_publish_records')
    .select('content_id, status, metadata')
    .eq('channel', 'instagram')
    .in('status', ['scheduled', 'publishing', 'published']);
  if (e3) throw new Error(e3.message);
  const alreadyQueued = new Set(
    (existing ?? [])
      .filter((r: any) => (r.metadata?.content_kind ?? 'cardnews') === 'reels')
      .map((r: any) => r.content_id as string)
  );
  const skipped = rows.filter((r) => alreadyQueued.has(r.content_id));
  rows = rows.filter((r) => !alreadyQueued.has(r.content_id));

  if (limit) rows = rows.slice(0, limit);
  if (!rows.length) {
    console.log(`모두 이미 예약/발행됨(${skipped.length}건). 새로 예약할 릴스 없음.`);
    return;
  }

  // 5) 슬롯 생성 + 매핑
  const slots = makeSlots(rows.length, times, start);
  const plan = rows.map((r, i) => ({ ...r, at: slots[i] }));

  console.log(
    `📅 예약 계획 — ${plan.length}권 · ${perDay}개/일 · KST ${times.map((t) => `${t}시`).join('·')} · 시작 ${start}`
  );
  if (skipped.length) console.log(`   (이미 큐에 있어 건너뜀: ${skipped.length}건)`);
  console.log('');
  for (const [i, p] of plan.entries()) {
    console.log(`  ${String(i + 1).padStart(2)}. ${fmtKst(p.at)}  ${p.title}`);
  }
  console.log('');

  if (dryRun) {
    console.log('🟡 --dry-run — DB 쓰기 없음. 실제 예약하려면 --dry-run 빼고 재실행.');
    return;
  }

  // 6) insert
  const nowIso = new Date().toISOString();
  const records = plan.map((p) => ({
    user_id: p.owner_id,
    content_id: p.content_id,
    project_id: p.project_id,
    channel: 'instagram',
    language: lang,
    status: 'scheduled',
    scheduled_at: p.at.toISOString(),
    retry_count: 0,
    metadata: { target_id: targetId, page_name: pageName, content_kind: 'reels' },
    updated_at: nowIso,
  }));
  const { error: eIns } = await sb.from('mkt_publish_records').insert(records);
  if (eIns) throw new Error(`insert 실패: ${eIns.message}`);

  console.log(
    `✅ ${records.length}건 예약 완료. 프로덕션 스케줄러가 각 시각에 @${username || pageName} 로 자동 발행합니다.`
  );
  console.log(`   첫 발행: ${fmtKst(plan[0].at)} · 마지막: ${fmtKst(plan[plan.length - 1].at)}`);
}

main().catch((e) => {
  console.error('❌', e instanceof Error ? e.message : e);
  process.exit(1);
});
