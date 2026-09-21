// 탱고북 활동 소개 글(ko/en) → 자체 블로그 초안 시딩 (멱등).
// 실행: node packages/server/scripts/seed-marketing-activity-blogs.mjs --all [--dry-run]
//       node packages/server/scripts/seed-marketing-activity-blogs.mjs --keys coloring,hidden-object
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { htmlToPlainText, wordCount } from './lib/seed-helpers.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dir, '_data', 'marketing', 'activity-blogs');
const PROJECT_NAME = '탱고북 동화책';
const CHANNEL = 'self_hosted';
const LANGS = ['ko', 'en'];

function parseArgs(argv) {
  const args = { owner: 'kil210@gmail.com', keys: null, all: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') args.all = true;
    else if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--owner-email') args.owner = argv[++i];
    else if (argv[i] === '--keys') {
      args.keys = argv[++i].split(',').map((value) => value.trim()).filter(Boolean);
    }
  }
  return args;
}

function loadSources({ all, keys }) {
  if (!all && !keys?.length) throw new Error('--all 또는 --keys 필요');
  const files = all
    ? fs.readdirSync(SOURCE_DIR).filter((file) => file.endsWith('.json')).sort()
    : keys.map((key) => `${key}.json`);
  return files.map((file) => {
    const sourcePath = path.join(SOURCE_DIR, file);
    if (!fs.existsSync(sourcePath)) throw new Error(`활동 블로그 소스 없음: ${file}`);
    const source = JSON.parse(fs.readFileSync(sourcePath, 'utf8'));
    validateSource(source, file);
    return source;
  });
}

function validateSource(source, file) {
  if (!source.key || !source.category || !Array.isArray(source.tags)) {
    throw new Error(`${file}: key/category/tags 필요`);
  }
  for (const lang of LANGS) {
    const variant = source.variants?.[lang];
    if (!variant) throw new Error(`${file}: ${lang} variant 없음`);
    for (const field of ['seo_title', 'meta_description', 'primary_keyword', 'url_slug']) {
      if (!variant[field]) throw new Error(`${file}: ${lang}.${field} 없음`);
    }
    if (!Array.isArray(variant.cards) || variant.cards.length < 6) {
      throw new Error(`${file}: ${lang} cards는 6개 이상 필요`);
    }
    if (!variant.cards[0]?.content?.url) throw new Error(`${file}: ${lang} 첫 카드 이미지 필요`);
    if (!variant.cards.at(-1)?.content?.text?.includes('data-blog-cta=')) {
      throw new Error(`${file}: ${lang} 마지막 카드 CTA 필요`);
    }
  }
  if (source.variants.ko.url_slug !== source.variants.en.url_slug) {
    throw new Error(`${file}: ko/en slug가 달라 hreflang 연결 불가`);
  }
}

async function resolveOwnerId(sb, email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await sb.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`listUsers 실패: ${error.message}`);
    const found = data.users.find((user) => user.email === email);
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
  if (!data) throw new Error(`프로젝트 '${PROJECT_NAME}' 없음`);
  return data.id;
}

async function upsertContent(sb, { userId, projectId, source }) {
  const memo = `activity:${source.key}`;
  const fields = {
    title: source.variants.ko.seo_title,
    topic: source.variants.ko.seo_title,
    category: source.category,
    memo,
    tags: source.tags,
    status: 'draft',
  };
  const { data: existing, error: selectError } = await sb
    .from('mkt_contents')
    .select('id')
    .eq('project_id', projectId)
    .eq('memo', memo)
    .maybeSingle();
  if (selectError) throw new Error(`content 조회 실패(${source.key}): ${selectError.message}`);
  if (existing) {
    const { error } = await sb.from('mkt_contents').update(fields).eq('id', existing.id);
    if (error) throw new Error(`content 갱신 실패(${source.key}): ${error.message}`);
    return existing.id;
  }
  const { data, error } = await sb
    .from('mkt_contents')
    .insert({ user_id: userId, project_id: projectId, ...fields })
    .select('id')
    .single();
  if (error) throw new Error(`content 생성 실패(${source.key}): ${error.message}`);
  return data.id;
}

async function upsertBaseArticle(sb, { userId, contentId, source }) {
  const body = source.variants.ko.cards.map((card) => card.content?.text ?? '').join('\n');
  const plain = htmlToPlainText(body);
  const fields = {
    title: source.variants.ko.seo_title,
    body,
    body_plain_text: plain,
    word_count: wordCount(plain),
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: selectError } = await sb
    .from('mkt_base_articles')
    .select('id')
    .eq('content_id', contentId)
    .maybeSingle();
  if (selectError) throw new Error(`base_article 조회 실패: ${selectError.message}`);
  if (existing) {
    const { error } = await sb.from('mkt_base_articles').update(fields).eq('id', existing.id);
    if (error) throw new Error(`base_article 갱신 실패: ${error.message}`);
    return;
  }
  const { error } = await sb
    .from('mkt_base_articles')
    .insert({ user_id: userId, content_id: contentId, ...fields });
  if (error) throw new Error(`base_article 생성 실패: ${error.message}`);
}

async function upsertBlog(sb, { userId, contentId, variant, lang }) {
  const fields = {
    title: variant.seo_title,
    seo_title: variant.seo_title,
    meta_description: variant.meta_description,
    url_slug: variant.url_slug,
    primary_keyword: variant.primary_keyword,
    secondary_keywords: variant.secondary_keywords,
    channel: CHANNEL,
    lang,
    status: 'draft',
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: selectError } = await sb
    .from('mkt_blog_contents')
    .select('id')
    .eq('content_id', contentId)
    .eq('channel', CHANNEL)
    .eq('lang', lang)
    .maybeSingle();
  if (selectError) throw new Error(`blog 조회 실패(${lang}): ${selectError.message}`);
  if (existing) {
    const { error } = await sb.from('mkt_blog_contents').update(fields).eq('id', existing.id);
    if (error) throw new Error(`blog 갱신 실패(${lang}): ${error.message}`);
    return existing.id;
  }
  const { data, error } = await sb
    .from('mkt_blog_contents')
    .insert({ user_id: userId, content_id: contentId, ...fields })
    .select('id')
    .single();
  if (error) throw new Error(`blog 생성 실패(${lang}): ${error.message}`);
  return data.id;
}

async function replaceCards(sb, { userId, blogContentId, cards }) {
  const { error: deleteError } = await sb
    .from('mkt_blog_cards')
    .delete()
    .eq('blog_content_id', blogContentId);
  if (deleteError) throw new Error(`카드 삭제 실패: ${deleteError.message}`);
  const now = new Date().toISOString();
  const rows = cards.map((card, index) => ({
    user_id: userId,
    blog_content_id: blogContentId,
    card_type: card.card_type || 'text',
    content: card.content ?? {},
    sort_order: typeof card.sort_order === 'number' ? card.sort_order : index,
    created_at: now,
    updated_at: now,
  }));
  const { error } = await sb.from('mkt_blog_cards').insert(rows);
  if (error) throw new Error(`카드 생성 실패: ${error.message}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sources = loadSources(args);
  console.log(`대상 활동 ${sources.length}개: ${sources.map((source) => source.key).join(', ')}`);
  for (const source of sources) {
    for (const lang of LANGS) {
      const variant = source.variants[lang];
      const plain = htmlToPlainText(variant.cards.map((card) => card.content?.text ?? '').join('\n'));
      console.log(` - [${lang}] ${variant.seo_title} / 카드 ${variant.cards.length} / ${wordCount(plain)} words`);
    }
  }
  if (args.dryRun) {
    console.log('[dry-run] 검증 완료, DB 쓰기 없음.');
    return;
  }

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 필요');
  const sb = createClient(url, key, { auth: { persistSession: false } });
  const userId = await resolveOwnerId(sb, args.owner);
  const projectId = await resolveProjectId(sb, userId);
  console.log(`owner=${userId} project=${projectId}`);

  for (const source of sources) {
    const contentId = await upsertContent(sb, { userId, projectId, source });
    await upsertBaseArticle(sb, { userId, contentId, source });
    for (const lang of LANGS) {
      const variant = source.variants[lang];
      const blogContentId = await upsertBlog(sb, { userId, contentId, variant, lang });
      await replaceCards(sb, { userId, blogContentId, cards: variant.cards });
      console.log(`✓ ${source.key} [${lang}] → blog ${blogContentId}, 카드 ${variant.cards.length}`);
    }
  }
  console.log(`완료: 활동 ${sources.length}개, 자체 블로그 초안 ${sources.length * LANGS.length}편.`);
}

main().catch((error) => {
  console.error('활동 블로그 시드 실패:', error.message);
  process.exit(1);
});
