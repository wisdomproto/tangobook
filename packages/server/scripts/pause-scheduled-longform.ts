// 예약된 롱폼을 `draft` 로 내려 발행을 멈춘다(되돌릴 수 있게 원래 시각을 metadata 에 보관).
//
// 왜(2026-08-04 실측): 같은 생활동화가 **두 채널 모두 중앙 1회**였다.
//   영어 채널 생활동화 9편 중앙 1 · 한국 10편 중앙 1.5. 같은 날(7/27) 올린 것끼리 비교하면
//   영어 명작 513 vs 영어 생활동화 21 = 24배. 영어 채널은 명작을 4,617까지 배달하는 채널이라
//   "채널이 안 밀어준다"로 설명되지 않는다 — 라인 자체의 수요가 없다.
//   그런데 그 라인이 9/8까지 영어 채널의 **유일한 슬롯**을 먹고 있었다.
//
// 되돌리기: `metadata->>'paused_at_backup'` 를 `scheduled_at` 에 되쓰고 status='scheduled'.
//
// 실행:
//   tsx scripts/pause-scheduled-longform.ts --lang=en --category=life          # dry-run
//   tsx scripts/pause-scheduled-longform.ts --lang=en --category=life --apply
import dotenv from 'dotenv';
dotenv.config({ override: true });
const { getSupabaseAdmin } = await import('../src/providers/supabase-admin.provider.js');

function flag(name: string, d = ''): string {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : d;
}
const APPLY = process.argv.includes('--apply');
const LANG = flag('lang', 'en');
const CATEGORY = flag('category');

const sb = getSupabaseAdmin();
if (!sb) throw new Error('Supabase 서비스 키 미설정.');

const { data: recs, error } = await sb
  .from('mkt_publish_records')
  .select('id, scheduled_at, content_id, metadata')
  .eq('channel', 'youtube')
  .eq('status', 'scheduled')
  .eq('language', LANG)
  .order('scheduled_at', { ascending: true });
if (error) throw new Error(error.message);

const longform = (recs ?? []).filter((r: any) => r.metadata?.content_kind === 'longform');
const { data: cts } = await sb
  .from('mkt_contents')
  .select('id, title, category')
  .in('id', [...new Set(longform.map((r: any) => r.content_id))]);
const cmap = new Map((cts ?? []).map((c: any) => [c.id, c]));

const targets = CATEGORY
  ? longform.filter((r: any) => cmap.get(r.content_id)?.category === CATEGORY)
  : longform;

console.log(`${LANG} 예약 롱폼 ${longform.length}편 중 대상 ${targets.length}편`);
if (!targets.length) process.exit(0);
console.log(
  `  ${targets[0].scheduled_at.slice(0, 10)} ~ ${targets[targets.length - 1].scheduled_at.slice(0, 10)}`
);
for (const r of targets.slice(0, 4))
  console.log(
    `  ${r.scheduled_at.slice(0, 10)}  ${String(cmap.get(r.content_id)?.title ?? '').slice(0, 40)}`
  );
if (targets.length > 4) console.log(`  … 외 ${targets.length - 4}편`);

if (!APPLY) {
  console.log('\nDry-run — 변경 없음. 적용은 --apply.');
  process.exit(0);
}
let done = 0;
for (const r of targets as any[]) {
  const meta = { ...(r.metadata ?? {}) };
  if (!meta.paused_at_backup) meta.paused_at_backup = r.scheduled_at;
  const { error: e } = await sb
    .from('mkt_publish_records')
    .update({ status: 'draft', metadata: meta })
    .eq('id', r.id)
    .eq('status', 'scheduled'); // 그 사이 발행됐으면 건드리지 않는다
  if (e) console.error(`  ❌ ${r.id}: ${e.message}`);
  else done++;
}
console.log(`\n완료 — ${done}/${targets.length}편 draft`);
