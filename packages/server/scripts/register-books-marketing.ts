// 공개 동화책을 마케팅 "기본 콘텐츠"(mkt_contents.memo='storybook:<id>')로 등록.
// 등록되면 롱폼·릴스·카드뉴스·블로그·기본글 등 모든 콘텐츠 타입 파이프라인이 그 책을 대상으로 삼을 수 있다.
// 명작·자연은 이미 등록됨(각 51·101). 생활동화 등 신규 카테고리 편입에 사용. 멱등.
//
// 사용:
//   pnpm --filter @tangobook/server exec tsx scripts/register-books-marketing.ts --category='생활동화' --label=life            # dry-run
//   pnpm --filter @tangobook/server exec tsx scripts/register-books-marketing.ts --category='생활동화' --label=life --apply    # 실제 등록
import 'dotenv/config';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const API = process.env.TTS_API_ORIGIN || 'http://localhost:3500';
// tangobook 마케팅 프로젝트/소유자 (기존 storybook 콘텐츠 행과 동일).
const PROJECT_ID = process.env.MKT_PROJECT_ID || '41560119-7751-46f0-9015-d24eaf4cc62e';
const OWNER_USER_ID = process.env.MKT_OWNER_USER_ID || '14ca5b22-0390-4bdf-b3e4-5b145130b3a6';

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

async function fetchBooks(): Promise<Array<{ id: string; title: string }>> {
  const res = await fetch(`${API}/api/storybooks`);
  if (!res.ok) throw new Error(`storybooks 조회 실패: HTTP ${res.status} (로컬 서버 ${API} 필요)`);
  const json = (await res.json()) as { data?: any[] } | any[];
  const list = (Array.isArray(json) ? json : (json.data ?? [])) as Array<{
    id: string;
    title?: string;
    category?: string;
    isPublic?: boolean;
  }>;
  return list
    .filter((b) => CATEGORY_RE.test(b.category ?? '') && b.isPublic !== false)
    .map((b) => ({ id: String(b.id), title: b.title ?? String(b.id) }));
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('Supabase admin 미설정');
  const books = await fetchBooks();
  console.log(`대상 책 ${books.length} (category ~ ${CATEGORY_RE}) · label=${LABEL}`);

  // 기존 등록분(멱등).
  const memos = books.map((b) => `storybook:${b.id}`);
  const { data: existing, error } = await sb.from('mkt_contents').select('memo').in('memo', memos);
  if (error) throw new Error(`기존 조회 실패: ${error.message}`);
  const have = new Set((existing ?? []).map((r: any) => r.memo));

  const toInsert = books.filter((b) => !have.has(`storybook:${b.id}`));
  console.log(`이미 등록 ${have.size} · 신규 등록 대상 ${toInsert.length}`);

  if (!toInsert.length) {
    console.log('등록할 신규 책 없음.');
    return;
  }
  for (const b of toInsert.slice(0, 8)) console.log(`  + ${b.title} (${b.id})`);
  if (toInsert.length > 8) console.log(`  … 외 ${toInsert.length - 8}권`);

  if (!APPLY) {
    console.log('\nDry-run — 실제 등록 없음. --apply 로 등록.');
    return;
  }

  const now = new Date().toISOString();
  const rows = toInsert.map((b) => ({
    user_id: OWNER_USER_ID,
    project_id: PROJECT_ID,
    title: b.title,
    topic: b.title,
    category: LABEL,
    tags: ['동화책', EXTRA_TAG],
    memo: `storybook:${b.id}`,
    status: 'draft',
    content_kind: 'regular',
    sort_order: 0,
    created_at: now,
    updated_at: now,
  }));
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 100) {
    const chunk = rows.slice(i, i + 100);
    const { error: insErr } = await sb.from('mkt_contents').insert(chunk);
    if (insErr) throw new Error(`등록 삽입 실패(청크 ${i}): ${insErr.message}`);
    inserted += chunk.length;
  }
  console.log(
    `\n완료 — ${inserted}권 마케팅 기본 콘텐츠 등록. 이제 롱폼/릴스/카드뉴스/블로그 대상이 됩니다.`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
