// 동화책 SEO 블로그(내부블로그=self_hosted) → Supabase mkt_blog_contents/mkt_blog_cards 시딩 (멱등).
// 소스: packages/server/scripts/_data/marketing/blogs/<storybookId>.json
// 실행: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node packages/server/scripts/seed-marketing-blogs.mjs --ids a,b [--owner-email ...] [--dry-run] | --all
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { storybookMemoTag } from './lib/seed-helpers.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = path.join(__dir, '_data', 'marketing', 'blogs');
const PROJECT_NAME = '탱고북 동화책';
const CHANNEL = 'self_hosted'; // 내부블로그(InternalBlogPanel)

function parseArgs(argv) {
  const a = { owner: 'kil210@gmail.com', ids: null, all: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') a.all = true;
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--owner-email') a.owner = argv[++i];
    else if (argv[i] === '--ids') a.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return a;
}

function loadBlogs({ ids, all }) {
  const files = fs.existsSync(BLOG_DIR)
    ? fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.json'))
    : [];
  const chosen = all ? files : (ids || []).map((id) => `${id}.json`);
  if (!all && (!ids || !ids.length)) throw new Error('--ids 또는 --all 필요');
  return chosen.map((f) => {
    const p = path.join(BLOG_DIR, f);
    if (!fs.existsSync(p)) throw new Error(`블로그 산출물 없음: ${f}`);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  });
}

async function resolveOwnerId(sb, email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers 실패: ${error.message}`);
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`소유자 미발견: ${email}`);
}

async function resolveProjectId(sb, userId) {
  const { data, error } = await sb
    .from('mkt_projects')
    .select('id')
    .eq('user_id', userId)
    .eq('name', PROJECT_NAME)
    .maybeSingle();
  if (error) throw new Error(`프로젝트 조회 실패: ${error.message}`);
  if (!data) throw new Error(`프로젝트 '${PROJECT_NAME}' 없음 — 기본글 시드 먼저 실행 필요`);
  return data.id;
}

async function resolveContentId(sb, projectId, storybookId) {
  const { data, error } = await sb
    .from('mkt_contents')
    .select('id')
    .eq('project_id', projectId)
    .eq('memo', storybookMemoTag(storybookId))
    .maybeSingle();
  if (error) throw new Error(`content 조회 실패(${storybookId}): ${error.message}`);
  if (!data) throw new Error(`content 없음(${storybookId}) — 기본글 시드 먼저`);
  return data.id;
}

async function upsertBlogContent(sb, { userId, contentId, blog }) {
  const fields = {
    title: blog.seo_title ?? null,
    seo_title: blog.seo_title ?? null,
    meta_description: blog.meta_description ?? null,
    url_slug: blog.url_slug ?? null,
    primary_keyword: blog.primary_keyword ?? null,
    secondary_keywords: blog.secondary_keywords ?? null,
    channel: CHANNEL,
    status: 'draft',
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: selErr } = await sb
    .from('mkt_blog_contents')
    .select('id')
    .eq('content_id', contentId)
    .eq('channel', CHANNEL)
    .maybeSingle();
  if (selErr) throw new Error(`blog_content 조회 실패: ${selErr.message}`);
  if (existing) {
    const { error } = await sb.from('mkt_blog_contents').update(fields).eq('id', existing.id);
    if (error) throw new Error(`blog_content 갱신 실패: ${error.message}`);
    return existing.id;
  }
  const { data: ins, error } = await sb
    .from('mkt_blog_contents')
    .insert({ user_id: userId, content_id: contentId, ...fields })
    .select('id')
    .single();
  if (error) throw new Error(`blog_content 생성 실패: ${error.message}`);
  return ins.id;
}

async function replaceBlogCards(sb, { userId, blogContentId, sections }) {
  // delete-all + bulk-insert (카드는 섹션 = text/image_prompt)
  const { error: delErr } = await sb.from('mkt_blog_cards').delete().eq('blog_content_id', blogContentId);
  if (delErr) throw new Error(`카드 삭제 실패: ${delErr.message}`);
  const now = new Date().toISOString();
  const rows = sections.map((s, i) => ({
    user_id: userId,
    blog_content_id: blogContentId,
    card_type: 'text',
    content: {
      text: s.text_html,
      url: '',
      alt: s.alt ?? '',
      caption: s.caption ?? '',
      image_prompt: s.image_prompt ?? '',
      image_style: '',
    },
    sort_order: i,
    created_at: now,
    updated_at: now,
  }));
  if (rows.length) {
    const { error } = await sb.from('mkt_blog_cards').insert(rows);
    if (error) throw new Error(`카드 생성 실패: ${error.message}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const blogs = loadBlogs(args);
  console.log(`대상 블로그 ${blogs.length}개: ${blogs.map((b) => b.title || b.storybookId).join(', ')}`);

  if (args.dryRun) {
    for (const b of blogs) {
      console.log(` - ${b.storybookId} "${b.seo_title}" 섹션 ${b.sections?.length ?? 0} primary=${b.primary_keyword}`);
    }
    console.log('[dry-run] DB 쓰기 없음.');
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요');
  const sb = createClient(url, key, { auth: { persistSession: false } });

  const userId = await resolveOwnerId(sb, args.owner);
  const projectId = await resolveProjectId(sb, userId);
  console.log(`owner=${userId} project=${projectId}`);

  for (const blog of blogs) {
    const contentId = await resolveContentId(sb, projectId, blog.storybookId);
    const blogContentId = await upsertBlogContent(sb, { userId, contentId, blog });
    await replaceBlogCards(sb, { userId, blogContentId, sections: blog.sections ?? [] });
    console.log(`✓ ${blog.seo_title} (${blog.storybookId}) → blog ${blogContentId}, 섹션 ${blog.sections?.length ?? 0}`);
  }
  console.log(`완료: ${blogs.length}개 블로그 시딩.`);
}

main().catch((e) => { console.error('블로그 시드 실패:', e.message); process.exit(1); });
