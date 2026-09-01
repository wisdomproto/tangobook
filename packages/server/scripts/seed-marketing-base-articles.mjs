// 동화책 기본글 → Supabase mkt_* 시딩 (멱등).
// 실행: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node packages/server/scripts/seed-marketing-base-articles.mjs --ids 177...,177... [--owner-email ...] [--dry-run]
//   또는 --all
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { wordCount, htmlToPlainText, storybookMemoTag } from './lib/seed-helpers.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const ART_DIR = path.join(__dir, '_data', 'marketing', 'base-articles');
const PROJECT_NAME = '탱고북 동화책';

function parseArgs(argv) {
  // 🔴 seed-marketing-blogs 와 같은 계정이어야 한다 — 다르면 기본글이 격리 계정에 실려
  //    블로그 시드가 "content 없음" 으로 실패한다(2026-08-21 재발).
  const args = { owner: 'kil210@gmail.com', ids: null, all: false, dryRun: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--all') args.all = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--owner-email') args.owner = argv[++i];
    else if (a === '--ids') args.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  return args;
}

function loadArticles({ ids, all }) {
  const files = fs.existsSync(ART_DIR)
    ? fs.readdirSync(ART_DIR).filter((f) => f.endsWith('.json'))
    : [];
  let chosen = files;
  if (!all) {
    if (!ids || !ids.length) throw new Error('--ids 또는 --all 중 하나가 필요합니다');
    chosen = ids.map((id) => `${id}.json`);
  }
  return chosen.map((f) => {
    const p = path.join(ART_DIR, f);
    if (!fs.existsSync(p)) throw new Error(`산출물 없음: ${f}`);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  });
}

async function resolveOwnerId(supabase, email) {
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw new Error(`auth.admin.listUsers 실패: ${error.message}`);
    const found = data.users.find((u) => u.email === email);
    if (found) return found.id;
    if (data.users.length < 1000) break;
  }
  throw new Error(`소유자 이메일을 찾지 못함: ${email}`);
}

async function ensureProject(supabase, userId) {
  const { data: existing, error: selErr } = await supabase
    .from('mkt_projects')
    .select('id')
    .eq('user_id', userId)
    .eq('name', PROJECT_NAME)
    .maybeSingle();
  if (selErr) throw new Error(`프로젝트 조회 실패: ${selErr.message}`);
  if (existing) return existing.id;
  const { data: inserted, error: insErr } = await supabase
    .from('mkt_projects')
    .insert({ user_id: userId, name: PROJECT_NAME, description: '동화책 마케팅 콘텐츠' })
    .select('id')
    .single();
  if (insErr) throw new Error(`프로젝트 생성 실패: ${insErr.message}`);
  return inserted.id;
}

async function upsertContent(supabase, { userId, projectId, art }) {
  const memo = storybookMemoTag(art.storybookId);
  const { data: existing, error: selErr } = await supabase
    .from('mkt_contents')
    .select('id')
    .eq('project_id', projectId)
    .eq('memo', memo)
    .maybeSingle();
  if (selErr) throw new Error(`content 조회 실패(${art.storybookId}): ${selErr.message}`);
  const fields = {
    title: art.title,
    topic: art.title,
    category: art.category,
    memo,
    tags: ['동화책', art.category],
    status: 'draft',
  };
  if (existing) {
    const { error } = await supabase.from('mkt_contents').update(fields).eq('id', existing.id);
    if (error) throw new Error(`content 갱신 실패(${art.storybookId}): ${error.message}`);
    return existing.id;
  }
  const { data: inserted, error } = await supabase
    .from('mkt_contents')
    .insert({ user_id: userId, project_id: projectId, ...fields })
    .select('id')
    .single();
  if (error) throw new Error(`content 생성 실패(${art.storybookId}): ${error.message}`);
  return inserted.id;
}

async function upsertBaseArticle(supabase, { userId, contentId, art }) {
  const plain = art.body_plain_text || htmlToPlainText(art.body_html);
  const fields = {
    title: art.title,
    body: art.body_html,
    body_plain_text: plain,
    word_count: wordCount(plain),
    updated_at: new Date().toISOString(),
  };
  const { data: existing, error: selErr } = await supabase
    .from('mkt_base_articles')
    .select('id')
    .eq('content_id', contentId)
    .maybeSingle();
  if (selErr) throw new Error(`base_article 조회 실패: ${selErr.message}`);
  if (existing) {
    const { error } = await supabase.from('mkt_base_articles').update(fields).eq('id', existing.id);
    if (error) throw new Error(`base_article 갱신 실패: ${error.message}`);
  } else {
    const { error } = await supabase
      .from('mkt_base_articles')
      .insert({ user_id: userId, content_id: contentId, ...fields });
    if (error) throw new Error(`base_article 생성 실패: ${error.message}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const articles = loadArticles(args);
  console.log(`대상 기사 ${articles.length}개: ${articles.map((a) => a.title).join(', ')}`);

  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY 환경변수가 필요합니다');
  }
  if (args.dryRun) {
    console.log('[dry-run] DB 쓰기 없이 계획만 출력합니다.');
    for (const a of articles) {
      const plain = a.body_plain_text || htmlToPlainText(a.body_html);
      console.log(` - ${a.title} (${a.category}) memo=${storybookMemoTag(a.storybookId)} words=${wordCount(plain)}`);
    }
    return;
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const userId = await resolveOwnerId(supabase, args.owner);
  const projectId = await ensureProject(supabase, userId);
  console.log(`소유자=${userId} 프로젝트=${projectId}`);

  for (const art of articles) {
    const contentId = await upsertContent(supabase, { userId, projectId, art });
    await upsertBaseArticle(supabase, { userId, contentId, art });
    console.log(`✓ ${art.title} → content ${contentId}`);
  }
  console.log(`완료: ${articles.length}개 시딩.`);
}

main().catch((e) => {
  console.error('시드 실패:', e.message);
  process.exit(1);
});
