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
  const a = { owner: 'kil210@gmail.com', ids: null, all: false, dryRun: false, lang: 'ko' };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') a.all = true;
    else if (argv[i] === '--dry-run') a.dryRun = true;
    else if (argv[i] === '--owner-email') a.owner = argv[++i];
    else if (argv[i] === '--lang') a.lang = argv[++i];
    else if (argv[i] === '--ids') a.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return a;
}

function blogDirFor(lang) {
  return lang === 'ko' ? BLOG_DIR : path.join(BLOG_DIR, 'i18n', lang);
}

function loadBlogs({ ids, all, lang }) {
  const dir = blogDirFor(lang);
  const files = fs.existsSync(dir)
    ? fs.readdirSync(dir).filter((f) => f.endsWith('.json'))
    : [];
  const chosen = all ? files : (ids || []).map((id) => `${id}.json`);
  if (!all && (!ids || !ids.length)) throw new Error('--ids 또는 --all 필요');
  return chosen.map((f) => {
    const p = path.join(dir, f);
    if (!fs.existsSync(p)) throw new Error(`블로그 산출물 없음(${lang}): ${f}`);
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

async function upsertBlogContent(sb, { userId, contentId, blog, lang }) {
  const fields = {
    title: blog.seo_title ?? null,
    seo_title: blog.seo_title ?? null,
    meta_description: blog.meta_description ?? null,
    url_slug: blog.url_slug ?? null,
    primary_keyword: blog.primary_keyword ?? null,
    secondary_keywords: blog.secondary_keywords ?? null,
    channel: CHANNEL,
    lang,
    status: 'draft',
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: selErr } = await sb
    .from('mkt_blog_contents')
    .select('id')
    .eq('content_id', contentId)
    .eq('channel', CHANNEL)
    .eq('lang', lang)
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
  // delete-all + bulk-insert (ko 소스 json = sections: text_html/image_prompt)
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

const SITE_URL = 'https://www.tangobook.co.kr';
const coverCache = new Map();

/**
 * 그 책의 언어별 표지 URL. 없으면 null.
 * 🔴 블로그 카드의 표지 이미지는 **제목이 그려진 이미지**라 ko 표지를 그대로 쓰면
 * 영어/베트남어 블로그에 한글 표지가 뜬다. 책에는 이미 언어별 표지가 구워져 있다
 * (`primaryCoverByLang`, memory `multilingual-cover-images-2026-07-12`).
 * 페이지 삽화는 글자가 없어 언어 공유해도 된다 — 표지만 교체한다.
 */
async function langCoverUrl(storybookId, lang) {
  if (lang === 'ko') return null;
  const key = `${storybookId}:${lang}`;
  if (coverCache.has(key)) return coverCache.get(key);
  let url = null;
  try {
    const res = await fetch(`${SITE_URL}/api/storybooks/${storybookId}`);
    if (res.ok) {
      const book = (await res.json())?.data ?? {};
      url = book.primaryCoverByLang?.[lang] ?? null;
      if (!url) {
        for (const st of Object.values(book.styleAssets ?? {})) {
          const u = st?.primaryCoverByLang?.[lang];
          if (u) { url = u; break; }
        }
      }
    }
  } catch {
    /* 실패 시 원본(ko) 유지 */
  }
  coverCache.set(key, url);
  return url;
}

const isCoverUrl = (u) => typeof u === 'string' && /-cover-/.test(decodeURIComponent(u));

/** 번역 소스(i18n) = ko 발행본 카드 전체(본문+FAQ+관련링크+CTA). content 그대로 시드. */
async function replaceBlogCardsFromSource(sb, { userId, blogContentId, cards, storybookId, lang }) {
  const { error: delErr } = await sb.from('mkt_blog_cards').delete().eq('blog_content_id', blogContentId);
  if (delErr) throw new Error(`카드 삭제 실패: ${delErr.message}`);
  const now = new Date().toISOString();
  const cover = await langCoverUrl(storybookId, lang); // 표지만 언어별로 교체
  const rows = cards.map((c, i) => {
    const content = { ...(c.content ?? {}) }; // 삽화는 언어 공유(글자 없음)
    if (cover && isCoverUrl(content.url)) content.url = cover;
    return {
      user_id: userId,
      blog_content_id: blogContentId,
      card_type: c.card_type || 'text',
      content,
      sort_order: typeof c.sort_order === 'number' ? c.sort_order : i,
      created_at: now,
      updated_at: now,
    };
  });
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
      const n = args.lang === 'ko' ? b.sections?.length ?? 0 : b.cards?.length ?? 0;
      console.log(` - ${b.storybookId} "${b.seo_title}" 카드 ${n} primary=${b.primary_keyword}`);
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
    const blogContentId = await upsertBlogContent(sb, { userId, contentId, blog, lang: args.lang });
    if (args.lang === 'ko') {
      await replaceBlogCards(sb, { userId, blogContentId, sections: blog.sections ?? [] });
    } else {
      // 번역 소스는 ko 발행본 카드 전체(본문+FAQ+관련링크+CTA)
      await replaceBlogCardsFromSource(sb, {
        userId,
        blogContentId,
        cards: blog.cards ?? [],
        storybookId: blog.storybookId,
        lang: args.lang,
      });
    }
    const n = args.lang === 'ko' ? blog.sections?.length ?? 0 : blog.cards?.length ?? 0;
    console.log(`✓ [${args.lang}] ${blog.seo_title} (${blog.storybookId}) → blog ${blogContentId}, 카드 ${n}`);
  }
  console.log(`완료: ${blogs.length}개 블로그 시딩 (lang=${args.lang}).`);
}

main().catch((e) => { console.error('블로그 시드 실패:', e.message); process.exit(1); });
