// 릴스 있는 전 책을 재렌더 (레이아웃 fix 적용). 발행 예약 순서(빠른 것 먼저)로 정렬해,
// render-book-reels.ts 를 청크 단위(--books=)로 서브프로세스 실행 → 청크마다 번들 1회 + 메모리 리셋.
//
// 발행기는 발행 시점에 video_settings.reels[lang] 를 실시간으로 읽으므로(publish-executor),
// 재렌더로 그 URL 만 갱신하면 예약된 발행이 자동으로 새 릴스를 쓴다(예약 레코드 무변경).
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/render-reels-all.ts --dry-run   # 목록만
//   pnpm --filter @tangobook/server exec tsx scripts/render-reels-all.ts             # 전체 재렌더
import 'dotenv/config';
import { spawnSync } from 'node:child_process';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const CHUNK = Number((argv.find((a) => a.startsWith('--chunk=')) || '').split('=')[1] || 40);

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정');

  // 1. reels.ko 있는 인스타 콘텐츠
  const { data: igs, error: e1 } = await sb
    .from('mkt_instagram_contents')
    .select('content_id, video_settings');
  if (e1) throw new Error(`ig 조회 실패: ${e1.message}`);
  const contentIds = (igs ?? [])
    .filter((r: any) => r.video_settings?.reels?.ko?.videoUrl)
    .map((r: any) => r.content_id);

  // 2. content → bookId (memo=storybook:<id>)
  const { data: contents, error: e2 } = await sb
    .from('mkt_contents')
    .select('id, memo')
    .in('id', contentIds);
  if (e2) throw new Error(`contents 조회 실패: ${e2.message}`);
  const bookByContent: Record<string, string> = {};
  for (const c of contents ?? []) {
    const m = (c as any).memo as string | null;
    if (m?.startsWith('storybook:')) bookByContent[(c as any).id] = m.slice('storybook:'.length);
  }

  // 3. content 별 가장 이른 인스타 예약 시각
  const { data: scheds } = await sb
    .from('mkt_publish_records')
    .select('content_id, scheduled_at')
    .eq('channel', 'instagram')
    .eq('status', 'scheduled');
  const earliest: Record<string, string> = {};
  for (const s of scheds ?? []) {
    const cid = (s as any).content_id as string;
    const t = (s as any).scheduled_at as string;
    if (t && (!earliest[cid] || t < earliest[cid])) earliest[cid] = t;
  }

  // 4. 목록 = {bookId, sched} · 예약 이른 순(무예약은 뒤)
  const list = contentIds
    .map((cid: string) => ({ bookId: bookByContent[cid], sched: earliest[cid] ?? null }))
    .filter((x: any) => x.bookId);
  list.sort((a: any, b: any) => ((a.sched ?? '9999') < (b.sched ?? '9999') ? -1 : 1));

  console.log(`릴스 재렌더 대상 ${list.length}권 · 청크 ${CHUNK}${DRY ? ' · DRY' : ''}`);
  if (DRY) {
    list.forEach((x: any, i: number) =>
      console.log(`  [${i + 1}] ${x.bookId} sched=${x.sched ?? 'none'}`)
    );
    return;
  }

  // 5. 청크 단위로 render-book-reels 서브프로세스 (청크당 번들 1회)
  const ids = list.map((x: any) => x.bookId);
  let ok = 0;
  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) chunks.push(ids.slice(i, i + CHUNK));
  for (let ci = 0; ci < chunks.length; ci++) {
    const chunk = chunks[ci];
    console.log(`\n########## 청크 ${ci + 1}/${chunks.length} (${chunk.length}권) ##########`);
    const cmd = `pnpm --filter @tangobook/server exec tsx scripts/render-book-reels.ts --books=${chunk.join(',')}`;
    const r = spawnSync(cmd, { stdio: 'inherit', shell: true });
    if (r.status === 0) ok += chunk.length;
    else console.error(`  ✗ 청크 ${ci + 1} exit ${r.status} — 계속`);
  }
  console.log(`\n완료 — 청크 ${chunks.length}개, 대략 ${ok}/${ids.length}권.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
