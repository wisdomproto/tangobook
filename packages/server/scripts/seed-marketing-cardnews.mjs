// 동화책 카드뉴스(인스타 carousel) → Supabase mkt_instagram_contents/mkt_instagram_cards 시딩 (멱등).
// 카드 스키마는 CardNewsPanel AI 생성과 동일: text_style=CardCanvasData, text_content=합본, image_prompt.
// 소스: packages/server/scripts/_data/marketing/cardnews/<storybookId>.json
//   { storybookId, caption, hashtags[], slides:[{header,title,body,image_prompt}] }
// 실행: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
//   node packages/server/scripts/seed-marketing-cardnews.mjs --ids a,b [--owner-email ...] [--dry-run] | --all
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { storybookMemoTag } from './lib/seed-helpers.mjs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const DIR = path.join(__dir, '_data', 'marketing', 'cardnews');
const PROJECT_NAME = '탱고북 동화책';

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

function loadCards({ ids, all }) {
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.json')) : [];
  const chosen = all ? files : (ids || []).map((id) => `${id}.json`);
  if (!all && (!ids || !ids.length)) throw new Error('--ids 또는 --all 필요');
  return chosen.map((f) => {
    const p = path.join(DIR, f);
    if (!fs.existsSync(p)) throw new Error(`카드뉴스 산출물 없음: ${f}`);
    return JSON.parse(fs.readFileSync(p, 'utf8'));
  });
}

// CardNewsCardItem.defaultCanvasData()의 4 블록 (position/size/color 동일)
function defaultBlocks() {
  return [
    { id: 'header', text: '', x: 10, y: 5, fontSize: 11, color: '#8B5CF6', fontWeight: 'bold', textAlign: 'left', width: 80 },
    { id: 'title', text: '', x: 10, y: 15, fontSize: 28, color: '#ffffff', fontWeight: 'bold', textAlign: 'left', width: 80 },
    { id: 'body', text: '', x: 10, y: 55, fontSize: 14, color: '#cccccc', fontWeight: 'normal', textAlign: 'left', width: 80 },
    { id: 'footer', text: '', x: 10, y: 90, fontSize: 10, color: '#666666', fontWeight: 'normal', textAlign: 'left', width: 80 },
  ];
}

function buildCanvas(slide) {
  const bodyRaw = slide.body ?? '';
  const body = bodyRaw.length > 80 ? bodyRaw.substring(0, 80).trimEnd() + '…' : bodyRaw;
  const textBlocks = defaultBlocks().map((b) => {
    if (b.id === 'header') return { ...b, text: slide.header ?? '' };
    if (b.id === 'title') return { ...b, text: slide.title ?? '' };
    if (b.id === 'body') return { ...b, text: body };
    if (b.id === 'footer') return { ...b, text: slide.footer ?? '' };
    return b;
  });
  return { canvas: { bgColor: '#18181b', imageUrl: null, imageY: 50, textBlocks }, body };
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
    .from('mkt_projects').select('id').eq('user_id', userId).eq('name', PROJECT_NAME).maybeSingle();
  if (error) throw new Error(`프로젝트 조회 실패: ${error.message}`);
  if (!data) throw new Error(`프로젝트 '${PROJECT_NAME}' 없음 — 기본글 시드 먼저`);
  return data.id;
}

async function resolveContentId(sb, projectId, storybookId) {
  const { data, error } = await sb
    .from('mkt_contents').select('id').eq('project_id', projectId)
    .eq('memo', storybookMemoTag(storybookId)).maybeSingle();
  if (error) throw new Error(`content 조회 실패(${storybookId}): ${error.message}`);
  if (!data) throw new Error(`content 없음(${storybookId}) — 기본글 시드 먼저`);
  return data.id;
}

// carousel 인스타 콘텐츠 resolve-or-create (instagramContents[0] 규약 — 카드뉴스/릴스 공용 행)
async function resolveOrCreateIg(sb, { userId, contentId }) {
  const { data, error } = await sb
    .from('mkt_instagram_contents').select('id').eq('content_id', contentId)
    .order('created_at').limit(1).maybeSingle();
  if (error) throw new Error(`인스타 콘텐츠 조회 실패: ${error.message}`);
  if (data) return data.id;
  const now = new Date().toISOString();
  const { data: ins, error: insErr } = await sb
    .from('mkt_instagram_contents')
    .insert({
      user_id: userId, content_id: contentId, title: null, caption: null, hashtags: null,
      content_type: 'carousel', video_settings: null, status: 'draft',
      published_url: null, published_at: null, created_at: now, updated_at: now,
    })
    .select('id').single();
  if (insErr) throw new Error(`인스타 콘텐츠 생성 실패: ${insErr.message}`);
  return ins.id;
}

async function upsertCaption(sb, { igId, caption, hashtags }) {
  const tags = (hashtags ?? []).map((t) => t.replace(/^#/, ''));
  const { error } = await sb
    .from('mkt_instagram_contents')
    .update({ caption: caption ?? null, hashtags: tags.length ? tags : null, updated_at: new Date().toISOString() })
    .eq('id', igId);
  if (error) throw new Error(`캡션 갱신 실패: ${error.message}`);
}

async function replaceCards(sb, { userId, igId, slides }) {
  const { error: delErr } = await sb.from('mkt_instagram_cards').delete().eq('instagram_content_id', igId);
  if (delErr) throw new Error(`카드 삭제 실패: ${delErr.message}`);
  const now = new Date().toISOString();
  const rows = (slides ?? []).map((slide, i) => {
    const { canvas, body } = buildCanvas(slide);
    return {
      user_id: userId,
      instagram_content_id: igId,
      text_content: [slide.header, slide.title, body, slide.footer].filter(Boolean).join('\n') || null,
      background_color: canvas.bgColor,
      background_image_url: null,
      text_style: canvas,
      image_prompt: slide.image_prompt ?? null,
      reference_image_url: null,
      sort_order: i,
      created_at: now,
      updated_at: now,
    };
  });
  if (rows.length) {
    const { error } = await sb.from('mkt_instagram_cards').insert(rows);
    if (error) throw new Error(`카드 생성 실패: ${error.message}`);
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const items = loadCards(args);
  console.log(`대상 카드뉴스 ${items.length}개: ${items.map((c) => c.storybookId).join(', ')}`);

  if (args.dryRun) {
    for (const c of items) console.log(` - ${c.storybookId} 슬라이드 ${c.slides?.length ?? 0} 태그 ${c.hashtags?.length ?? 0}`);
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

  for (const c of items) {
    const contentId = await resolveContentId(sb, projectId, c.storybookId);
    const igId = await resolveOrCreateIg(sb, { userId, contentId });
    await upsertCaption(sb, { igId, caption: c.caption, hashtags: c.hashtags });
    await replaceCards(sb, { userId, igId, slides: c.slides });
    console.log(`✓ ${c.storybookId} → ig ${igId}, 슬라이드 ${c.slides?.length ?? 0}`);
  }
  console.log(`완료: ${items.length}개 카드뉴스 시딩.`);
}

main().catch((e) => { console.error('카드뉴스 시드 실패:', e.message); process.exit(1); });
