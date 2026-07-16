// 롱폼 오디오북(mkt_youtube_contents)을 YouTube 자동발행 예약(mkt_publish_records, channel=youtube)으로 등록.
//
// 발행 순서(사용자 지정):
//   · 명작 = 페이퍼3D 전부 → 수채화 전부 → 콜라주 전부 (하루 1개)
//   · 자연관찰(실사) = 하루 1개 (명작과 동시 진행 → 합쳐서 하루 2개)
// 스케줄러(publish-scheduler.service publishDueYoutube)가 tick당 1개씩 due 레코드를 집어 탱고북스 채널로 업로드.
//
// 안전장치: 기본 dry-run(계획만 출력). 실제 예약 삽입은 --apply. 멱등(이미 예약된 (content,art_style,lang) 스킵).
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/schedule-longform-youtube.ts            # dry-run 계획
//   pnpm --filter @tangobook/server exec tsx scripts/schedule-longform-youtube.ts --apply    # 실제 예약(라이브)
//   ...  --classics-only | --nature-only | --start=2026-07-18 | --hour-classic=1 --hour-nature=7
import 'dotenv/config';
import { loadGenreMap } from '../src/services/reel/reel-targets.js';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';
// 탱고북스 채널 내부 id (system/youtube-channels.json). env 로 override 가능.
const CHANNEL_INTERNAL_ID =
  process.env.LONGFORM_YT_CHANNEL_ID || '82d18111-c023-4d2b-a893-dbe40893fdb8';
const GENRE_ORDER = ['paper3d', 'watercolor', 'collage'] as const;
const NATURE_CATEGORY = /동물|곤충|공룡|우리 몸|우주와 자연|식물/;
const CLASSIC_CATEGORY = /세계|명작/;
const LIFE_CATEGORY = /생활동화/;

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string, d: string) => {
  const hit = argv.find((a) => a.startsWith(`${f}=`));
  return hit ? hit.slice(f.length + 1) : d;
};
const APPLY = has('--apply');
const CLASSICS_ONLY = has('--classics-only');
const NATURE_ONLY = has('--nature-only');
const LIFE_ONLY = has('--life-only');
// "--*-only" 중 하나라도 있으면 그 트랙들만, 없으면 전 트랙.
const ANY_ONLY = CLASSICS_ONLY || NATURE_ONLY || LIFE_ONLY;
const HOUR_CLASSIC = Number(val('--hour-classic', '1')); // UTC 01:00 ≈ KST 10:00
const HOUR_NATURE = Number(val('--hour-nature', '7')); // UTC 07:00 ≈ KST 16:00
const HOUR_LIFE = Number(val('--hour-life', '10')); // UTC 10:00 ≈ KST 19:00
const PRIVACY = val('--privacy', 'public');

interface LongRow {
  content_id: string;
  project_id: string;
  user_id: string;
  bookId: string;
  artStyle: string;
  lang: string;
  title: string;
}

/** bookId → category (프로덕션 요약 API). */
async function loadCategories(): Promise<Map<string, { category: string; title: string }>> {
  const res = await fetch(`${API}/api/storybooks`);
  if (!res.ok)
    throw new Error(`storybooks 목록 조회 실패: HTTP ${res.status} (로컬 서버 ${API} 필요)`);
  const json = (await res.json()) as { data?: any[] } | any[];
  const list = (Array.isArray(json) ? json : (json.data ?? [])) as Array<{
    id: string;
    category?: string;
    title?: string;
  }>;
  const map = new Map<string, { category: string; title: string }>();
  for (const b of list) map.set(String(b.id), { category: b.category ?? '', title: b.title ?? '' });
  return map;
}

/** 다음날 00:00 UTC 기준 day-index N, hour H 의 ISO 시각. */
function slotAt(startDayMs: number, dayIndex: number, hour: number): string {
  return new Date(startDayMs + dayIndex * 86400_000 + hour * 3600_000).toISOString();
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase 서비스 키 미설정 — 예약 불가.');

  const [genreMap, catMap] = await Promise.all([loadGenreMap(), loadCategories()]);

  // 1) 렌더 완료된 롱폼 행 로드 (+ content/project/user 조인은 코드에서).
  const { data: yrows, error } = await sb
    .from('mkt_youtube_contents')
    .select('content_id, video_url, video_settings')
    .eq('target_duration', 'long')
    .not('video_url', 'is', null);
  if (error) throw new Error(`mkt_youtube_contents 조회 실패: ${error.message}`);

  // content_id → {project_id, user_id}
  const contentIds = [...new Set((yrows ?? []).map((r: any) => r.content_id))];
  const { data: crows } = await sb
    .from('mkt_contents')
    .select('id, project_id')
    .in('id', contentIds);
  const projByContent = new Map<string, string>();
  for (const c of (crows ?? []) as any[]) projByContent.set(c.id, c.project_id);
  const projectIds = [...new Set([...projByContent.values()])];
  const { data: prows } = await sb.from('mkt_projects').select('id, user_id').in('id', projectIds);
  const userByProject = new Map<string, string>();
  for (const p of (prows ?? []) as any[]) userByProject.set(p.id, p.user_id);

  // 2) 이미 예약/발행된 (content,art_style,lang) 수집 → 멱등 스킵.
  const { data: existing } = await sb
    .from('mkt_publish_records')
    .select('content_id, language, metadata')
    .eq('channel', 'youtube');
  const scheduledKey = new Set<string>();
  for (const r of (existing ?? []) as any[]) {
    const a = r.metadata?.art_style;
    if (a) scheduledKey.add(`${r.content_id}|${a}|${r.language}`);
  }

  // 3) 트랙 분류.
  const classics: LongRow[][] = GENRE_ORDER.map(() => []); // paper3d, watercolor, collage 버킷
  const nature: LongRow[] = [];
  const life: LongRow[] = [];
  const orphans: string[] = [];

  for (const r of (yrows ?? []) as any[]) {
    const vs = r.video_settings || {};
    const bookId = String(vs.bookId ?? '');
    const artStyle = String(vs.artStyle ?? '');
    const lang = String(vs.language ?? 'ko');
    if (!bookId || !artStyle) continue;
    if (lang !== 'ko') continue; // 현재 ko 만 발행
    if (scheduledKey.has(`${r.content_id}|${artStyle}|${lang}`)) continue; // 멱등

    const project_id = projByContent.get(r.content_id);
    const user_id = project_id ? userByProject.get(project_id) : undefined;
    if (!project_id || !user_id) {
      orphans.push(`${bookId}(no project/user)`);
      continue;
    }
    const meta = catMap.get(bookId);
    const category = meta?.category ?? '';
    const title = meta?.title ?? bookId;
    const row: LongRow = {
      content_id: r.content_id,
      project_id,
      user_id,
      bookId,
      artStyle,
      lang,
      title,
    };

    if (LIFE_CATEGORY.test(category)) {
      life.push(row);
    } else if (NATURE_CATEGORY.test(category)) {
      nature.push(row);
    } else if (CLASSIC_CATEGORY.test(category)) {
      const genre = genreMap[artStyle];
      const gi = GENRE_ORDER.indexOf(genre as any);
      if (gi >= 0) classics[gi].push(row);
      else orphans.push(`${title}(classic·${artStyle}→${genre ?? '?'})`); // photographic 등 메인3 외 스킵
    } else {
      orphans.push(`${title}(cat=${category})`);
    }
  }

  // 버킷 내 정렬 = 제목순(결정적).
  for (const b of classics) b.sort((a, z) => a.title.localeCompare(z.title, 'ko'));
  nature.sort((a, z) => a.title.localeCompare(z.title, 'ko'));
  life.sort((a, z) => a.title.localeCompare(z.title, 'ko'));

  // "--*-only" 지정 시 그 트랙만, 아니면 전 트랙.
  const classicOrdered = !ANY_ONLY || CLASSICS_ONLY ? classics.flat() : [];
  const natureOrdered = !ANY_ONLY || NATURE_ONLY ? nature : [];
  const lifeOrdered = !ANY_ONLY || LIFE_ONLY ? life : [];

  // 4) 슬롯 배정 — 내일 00:00 UTC 부터 트랙별 day-index 1/일.
  const now = new Date();
  const tomorrow = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0);
  const startStr = val('--start', '');
  const startDayMs = startStr ? Date.parse(`${startStr}T00:00:00Z`) : tomorrow;

  const plan: Array<{ row: LongRow; when: string; track: string; genre?: string }> = [];
  classicOrdered.forEach((row, i) =>
    plan.push({
      row,
      when: slotAt(startDayMs, i, HOUR_CLASSIC),
      track: 'classic',
      genre: genreMap[row.artStyle],
    })
  );
  natureOrdered.forEach((row, i) =>
    plan.push({ row, when: slotAt(startDayMs, i, HOUR_NATURE), track: 'nature' })
  );
  lifeOrdered.forEach((row, i) =>
    plan.push({ row, when: slotAt(startDayMs, i, HOUR_LIFE), track: 'life' })
  );

  console.log(
    `\n예약 계획 — 명작 ${classicOrdered.length}(paper3d ${classics[0].length}·수채 ${classics[1].length}·콜라주 ${classics[2].length}) · 자연 ${natureOrdered.length} · 생활동화 ${lifeOrdered.length} · 채널 ${CHANNEL_INTERNAL_ID} · privacy=${PRIVACY}`
  );
  if (orphans.length)
    console.log(
      `  ⚠️ 스킵(오펀) ${orphans.length}:`,
      orphans.slice(0, 20).join(', ') + (orphans.length > 20 ? ' …' : '')
    );

  const preview = [...plan].sort((a, z) => a.when.localeCompare(z.when)).slice(0, 12);
  console.log('\n  [처음 12개 발행 슬롯]');
  for (const p of preview)
    console.log(`   ${p.when}  ${p.track}${p.genre ? `/${p.genre}` : ''}  ${p.row.title}`);

  if (!APPLY) {
    console.log(`\nDry-run — 실제 예약 없음. 라이브 예약은 --apply.`);
    return;
  }

  // 5) 삽입.
  const records = plan.map((p) => ({
    user_id: p.row.user_id,
    content_id: p.row.content_id,
    project_id: p.row.project_id,
    channel: 'youtube',
    language: p.row.lang,
    status: 'scheduled',
    scheduled_at: p.when,
    metadata: {
      content_kind: 'longform',
      art_style: p.row.artStyle,
      target_id: CHANNEL_INTERNAL_ID,
      privacy: PRIVACY,
      title: p.row.title,
    },
  }));

  // 청크 삽입.
  let inserted = 0;
  for (let i = 0; i < records.length; i += 100) {
    const chunk = records.slice(i, i + 100);
    const { error: insErr } = await sb.from('mkt_publish_records').insert(chunk);
    if (insErr) throw new Error(`예약 삽입 실패(청크 ${i}): ${insErr.message}`);
    inserted += chunk.length;
    console.log(`  삽입 ${inserted}/${records.length}`);
  }
  console.log(
    `\n완료 — ${inserted}개 발행 예약 등록(status=scheduled). 스케줄러가 tick당 1개씩 발행합니다.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
