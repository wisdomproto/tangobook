// 생활동화(category=life) 내부 블로그에 FAQ(자주 묻는 질문) 카드를 삽입한다.
// FAQ HTML 은 scratchpad saenghwal-faq.json({ <storybookId>: "<faq_html>" }) 에서 읽는다.
// 관련글/CTA 카드 앞에 삽입, 나머지 카드(이미지 포함)는 건드리지 않음. 멱등(이미 FAQ 있으면 스킵).
//
// 사용: FAQ_JSON=<path> pnpm --filter @tangobook/server exec tsx scripts/add-blog-faq.ts [--dry-run]
import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { getSupabaseAdmin } from '../src/providers/supabase-admin.provider.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const FAQ_JSON =
  process.env.FAQ_JSON || path.join(SCRIPT_DIR, '_data', 'marketing', 'saenghwal-faq.json');
const DRY = process.argv.includes('--dry-run');

const cardText = (c: any): string => (c?.content?.text as string) || '';
const isFaq = (c: any) => /자주 묻는 질문/.test(cardText(c));
const isRelated = (c: any) => /함께 읽으면 좋은|관련 글|추천 동화/.test(cardText(c));
const isCta = (c: any) => /동화책 보러가기|data-blog-cta/.test(cardText(c));

function storybookIdFromMemo(memo: string | null): string | null {
  const m = /^storybook:(.+)$/.exec(memo ?? '');
  return m ? m[1] : null;
}

async function main() {
  const sb = getSupabaseAdmin();
  if (!sb) throw new Error('admin 미설정');
  const faqMap = JSON.parse(fs.readFileSync(FAQ_JSON, 'utf8')) as Record<string, string>;
  console.log(`FAQ 소스 ${Object.keys(faqMap).length}개`);

  // life 콘텐츠 → 블로그
  const { data: contents } = await sb
    .from('mkt_contents')
    .select('id, memo')
    .eq('category', 'life');
  let done = 0;
  let skip = 0;
  let miss = 0;
  for (const c of (contents ?? []) as any[]) {
    const sbId = storybookIdFromMemo(c.memo);
    const faqHtml = sbId ? faqMap[sbId] : null;
    if (!faqHtml) {
      miss++;
      continue;
    }
    const { data: blogs } = await sb
      .from('mkt_blog_contents')
      .select('id, user_id')
      .eq('content_id', c.id);
    for (const blog of (blogs ?? []) as any[]) {
      const { data: cards } = await sb
        .from('mkt_blog_cards')
        .select('id, content, sort_order')
        .eq('blog_content_id', blog.id)
        .order('sort_order');
      const list = (cards ?? []) as any[];
      if (list.some(isFaq)) {
        skip++;
        continue;
      }
      // 삽입 위치 = 첫 related/CTA 카드 앞, 없으면 맨 끝
      let insertIdx = list.findIndex((c2) => isRelated(c2) || isCta(c2));
      if (insertIdx < 0) insertIdx = list.length;

      if (DRY) {
        console.log(`  [dry] ${sbId} blog ${blog.id} → FAQ @${insertIdx}/${list.length}`);
        done++;
        continue;
      }
      // FAQ 카드 삽입
      const { data: ins, error: insErr } = await sb
        .from('mkt_blog_cards')
        .insert({
          blog_content_id: blog.id,
          user_id: blog.user_id,
          card_type: 'text',
          content: { text: faqHtml, url: '', alt: '' },
          sort_order: 9990,
        })
        .select('id')
        .single();
      if (insErr) {
        console.error(`  ✗ ${sbId}: ${insErr.message}`);
        continue;
      }
      // 원하는 순서로 재배치
      const ordered = [...list.slice(0, insertIdx), { id: ins.id }, ...list.slice(insertIdx)];
      for (let i = 0; i < ordered.length; i++) {
        await sb.from('mkt_blog_cards').update({ sort_order: i }).eq('id', ordered[i].id);
      }
      done++;
    }
  }
  console.log(
    `\n${DRY ? '[DRY] ' : ''}FAQ 삽입 ${done} · 이미있음 스킵 ${skip} · FAQ소스없음 ${miss}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
