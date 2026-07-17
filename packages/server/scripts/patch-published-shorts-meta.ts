// 이미 발행된 유튜브 쇼츠의 제목·설명·태그를 현재 규칙으로 소급 패치한다(재업로드 없음).
//
// 왜 필요한가: 쇼츠 발행 경로가 mkt_contents.title 을 그대로 써서 호리네 생활동화의 내부 정렬
// 번호가 유튜브 제목에 박혔고("01. 골고루 먹으면 무지개 힘!"), 설명·태그도 기본값뿐이었다.
// publish-executor 는 고쳤지만 이미 나간 영상은 이 스크립트로 고친다.
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/patch-published-shorts-meta.ts --dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/patch-published-shorts-meta.ts --apply
//   ... --category=life   (기본: life — 번호 문제가 있는 시리즈)
import 'dotenv/config';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';
import { YouTubeProvider } from '../src/providers/youtube.provider.js';
import { stripLeadingNumber } from '../src/services/mkt/publish-executor.service.js';

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string, d = '') => {
  const hit = argv.find((a) => a.startsWith(`${f}=`));
  return hit ? hit.slice(f.length + 1) : d;
};
const APPLY = has('--apply');
const CATEGORY = val('--category', 'life');

async function main() {
  const sb = getSupabaseAdmin();

  const { data: recs, error } = await sb
    .from('mkt_publish_records')
    .select(
      'id, content_id, platform_post_id, published_url, metadata, mkt_contents!inner(title, category)'
    )
    .eq('channel', 'youtube')
    .eq('status', 'published');
  if (error) throw new Error(`발행 기록 조회 실패: ${error.message}`);

  const rows = (recs ?? []) as Array<{
    id: string;
    content_id: string;
    platform_post_id: string | null;
    published_url: string | null;
    metadata: Record<string, unknown> | null;
    mkt_contents: { title: string; category: string | null };
  }>;

  // 롱폼은 제외 — 그쪽은 longform-meta 기반이라 제목이 이미 정상이다.
  const targets = rows.filter(
    (r) =>
      r.platform_post_id &&
      (r.mkt_contents?.category ?? '') === CATEGORY &&
      (r.metadata?.content_kind ?? 'reels') !== 'longform'
  );

  console.log(`쇼츠 발행분 ${targets.length}건 (category=${CATEGORY})${APPLY ? '' : ' · DRY'}`);

  let ok = 0;
  let skip = 0;
  let fail = 0;
  for (const r of targets) {
    const rawTitle = r.mkt_contents.title;
    const title = stripLeadingNumber(rawTitle);

    // 같은 책의 롱폼 메타에서 줄거리·태그를 가져온다(쇼츠 자체 캡션이 비어 있는 시리즈).
    const { data: yt } = await sb
      .from('mkt_youtube_contents')
      .select('video_description, video_tags')
      .eq('content_id', r.content_id)
      .limit(1);
    const meta = (yt ?? [])[0] as { video_description?: string; video_tags?: string[] } | undefined;
    const description = [meta?.video_description?.trim(), '#Shorts #탱고북 #동화']
      .filter(Boolean)
      .join('\n\n');
    const tags = meta?.video_tags?.length
      ? [...meta.video_tags.slice(0, 12), 'shorts']
      : ['탱고북', '동화', 'shorts'];

    if (title === rawTitle && !meta) {
      skip++;
      continue;
    }
    console.log(`  ${APPLY ? '→' : '[dry]'} ${r.platform_post_id}  ${rawTitle}\n      → ${title}`);
    if (!APPLY) {
      ok++;
      continue;
    }
    try {
      await YouTubeProvider.setSnippet(
        r.platform_post_id!,
        { title, description, tags, categoryId: '22' }, // 22 = People & Blogs (쇼츠 업로드 시 값)
        (r.metadata?.target_id as string) || undefined
      );
      ok++;
    } catch (e) {
      fail++;
      console.error(`  ✗ ${r.platform_post_id} 실패: ${(e as Error).message}`);
    }
  }
  console.log(`\n${APPLY ? '패치' : '[DRY] 패치 예정'} ${ok} · 스킵 ${skip} · 실패 ${fail}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
