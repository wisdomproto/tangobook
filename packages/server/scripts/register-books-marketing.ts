// 공개 동화책을 마케팅의 읽기 전용 책 원본(mkt_content_sources)에 복구 등록한다.
// 정상 경로는 editor2 저작 승인 자동 동기화다. 이 스크립트는 과거 책/누락 복구용이며 마케팅 기획을 만들지 않는다.
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/register-books-marketing.ts --category='생활동화' --label=life            # dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/register-books-marketing.ts --category='생활동화' --label=life --apply    # 실제 등록
import 'dotenv/config';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';
// tangobook 마케팅 프로젝트/소유자 (기존 storybook 콘텐츠 행과 동일).
const PROJECT_ID = process.env.MKT_PROJECT_ID || '41560119-7751-46f0-9015-d24eaf4cc62e';

const argv = process.argv.slice(2);
const has = (f: string) => argv.includes(f);
const val = (f: string, d = '') => {
  const hit = argv.find((a) => a.startsWith(`${f}=`));
  return hit ? hit.slice(f.length + 1) : d;
};
const APPLY = has('--apply');
const CATEGORY_RE = new RegExp(val('--category', '생활동화'));
const LABEL = val('--label', 'life'); // mkt_contents.category
const EXTRA_TAG = val('--tag', val('--category', '생활동화')); // tags = ['동화책', <this>]

async function fetchBooks(): Promise<
  Array<{
    id: string;
    title: string;
    category: string | null;
    coverImage: string | null;
    languages: string[];
    updatedAt: string | null;
  }>
> {
  const res = await fetch(`${API}/api/storybooks`);
  if (!res.ok) throw new Error(`storybooks 조회 실패: HTTP ${res.status} (로컬 서버 ${API} 필요)`);
  const json = (await res.json()) as { data?: any[] } | any[];
  const list = (Array.isArray(json) ? json : (json.data ?? [])) as Array<{
    id: string;
    title?: string;
    category?: string;
    isPublic?: boolean;
    coverImage?: string;
    titleTranslations?: Record<string, string>;
    updatedAt?: string;
  }>;
  return list
    .filter((b) => CATEGORY_RE.test(b.category ?? '') && b.isPublic !== false)
    .map((b) => ({
      id: String(b.id),
      title: b.title ?? String(b.id),
      category: b.category ?? null,
      coverImage: b.coverImage ?? null,
      languages: ['ko', ...Object.keys(b.titleTranslations ?? {}).filter((lang) => lang !== 'ko')],
      updatedAt: b.updatedAt ?? null,
    }));
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정');
  const books = await fetchBooks();
  console.log(`대상 책 ${books.length} (category ~ ${CATEGORY_RE}) · label=${LABEL}`);
  const { data: project, error: projectError } = await sb
    .from('mkt_projects')
    .select('id, user_id')
    .eq('id', PROJECT_ID)
    .single();
  if (projectError || !project)
    throw new Error(`마케팅 프로젝트 조회 실패: ${projectError?.message}`);

  for (const b of books.slice(0, 8)) console.log(`  ↻ ${b.title} (${b.id})`);
  if (books.length > 8) console.log(`  … 외 ${books.length - 8}권`);

  if (!APPLY) {
    console.log('\nDry-run — 실제 등록 없음. --apply 로 등록.');
    return;
  }

  const now = new Date().toISOString();
  const rows = books.map((b) => ({
    user_id: project.user_id,
    project_id: project.id,
    source_type: 'storybook',
    source_id: b.id,
    source_state: 'approved',
    title: b.title,
    category: b.category ?? LABEL,
    cover_image_url: b.coverImage,
    languages: b.languages,
    source_snapshot: { recoveryLabel: LABEL, recoveryTag: EXTRA_TAG },
    source_updated_at: b.updatedAt,
    last_synced_at: now,
    updated_at: now,
  }));
  let synced = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error: syncError } = await sb
      .from('mkt_content_sources')
      .upsert(chunk, { onConflict: 'project_id,source_type,source_id' });
    if (syncError) throw new Error(`원본 동기화 실패(청크 ${i}): ${syncError.message}`);
    synced += chunk.length;
  }
  console.log(`\n완료 — ${synced}권 책 원본 동기화. 빈 마케팅 기획은 생성하지 않았습니다.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
