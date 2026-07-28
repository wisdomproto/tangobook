#!/usr/bin/env node
/**
 * 블로그 카드를 기본글에서 되살려 두껍게 만든다.
 *
 * 시딩할 때 기본글(`mkt_base_articles`)의 세 섹션이 통째로 버려졌다 —
 * **핵심 어휘 · 아이의 호기심을 여는 질문 · 함께 할 수 있는 활동**.
 * 이미 집필된 글이라 생성 호출이 필요 없다. 그대로 카드로 되돌린다.
 *
 * 편당 ~710자 → ~1,130자(실측). ⚠️ 업계 통용 권장선 1,500자에는 **못 미친다** —
 * 있는 재료를 다 긁은 결과다. 더 늘리려면 새로 쓰는 수밖에 없다.
 * ⚠️ 1,500 은 네이버 공식 수치가 아니다.
 *
 * 🔴 자연관찰 전용. 명작·생활동화는 기본글 섹션 구조가 달라(핵심 어휘 0편) 그대로 못 쓴다.
 *
 * 사용:
 *   node packages/server/scripts/expand-blog-cards.mjs --book=장수풍뎅이        # dry-run
 *   node packages/server/scripts/expand-blog-cards.mjs --book=장수풍뎅이 --apply
 *   node packages/server/scripts/expand-blog-cards.mjs --category=nature --apply
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.join(__dirname, '..', '..', '..');
for (const line of fs.readFileSync(path.join(repoRoot, 'packages/server/.env'), 'utf-8').split(/\r?\n/)) {
  const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/);
  if (m) process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, '');
}
const SB = process.env.SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, ...v] = a.replace(/^--/, '').split('=');
    return [k, v.join('=') || true];
  }),
);
const APPLY = args.apply === true;

async function sb(q, init) {
  const res = await fetch(`${SB}/rest/v1/${q}`, {
    ...init,
    headers: {
      apikey: KEY,
      Authorization: `Bearer ${KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return res.status === 204 ? null : res.json();
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * 기본글 평문 → 섹션 맵.
 * 형식: 제목 블록(짧은 한 줄) 다음에 본문 블록들이 이어지고, 다음 제목에서 끊긴다.
 * 제목 목록을 알고 있으므로 그걸로 자른다(휴리스틱보다 안전).
 */
const HEADINGS = [
  '주제 소개',
  '추천 연령',
  '자연·과학 사실 검증',
  '탱고북에서 다루는 내용',
  '핵심 어휘',
  '아이의 호기심을 여는 질문',
  '부모 가이드 — 관찰·체험으로 확장하는 법',
  '함께 할 수 있는 활동',
];
function parseSections(body) {
  const blocks = String(body || '')
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  const out = {};
  let cur = null;
  for (const b of blocks) {
    if (HEADINGS.includes(b)) {
      cur = b;
      out[cur] = [];
    } else if (cur) {
      out[cur].push(b);
    }
  }
  return out;
}

/** `뿔 — 힘겨루기에 쓰는 단단한 뿔` → <li><strong>뿔</strong> — …</li> */
function vocabHtml(lines) {
  const items = lines
    .map((l) => {
      const m = l.split(/\s+—\s+/);
      return m.length >= 2
        ? `<li><strong>${esc(m[0])}</strong> — ${esc(m.slice(1).join(' — '))}</li>`
        : `<li>${esc(l)}</li>`;
    })
    .join('');
  return `<h2>이 책에서 만나는 낱말</h2><ul>${items}</ul>`;
}
const paraHtml = (h, lines) => `<h2>${esc(h)}</h2>${lines.map((l) => `<p>${esc(l)}</p>`).join('')}`;

async function expandOne(content) {
  const [article] = await sb(
    `mkt_base_articles?select=body,body_plain_text&content_id=eq.${content.id}&limit=1`,
  );
  if (!article) return { skip: '기본글 없음' };
  const sec = parseSections(article.body_plain_text || article.body);

  const [blog] = await sb(
    `mkt_blog_contents?select=id&content_id=eq.${content.id}&lang=eq.ko&limit=1`,
  );
  if (!blog) return { skip: 'ko 블로그 없음' };

  // 🔴 user_id 는 NOT NULL(싱글 오너 RLS) — 새 카드도 기존 카드의 주인을 물려받아야 한다.
  const cards = await sb(
    `mkt_blog_cards?select=id,user_id,sort_order,content&blog_content_id=eq.${blog.id}&order=sort_order`,
  );
  const ownerId = cards[0]?.user_id;
  if (!ownerId) return { skip: '카드 없음(주인 불명)' };
  const existing = cards.map((c) => c.content?.text ?? '').join('');

  // 되살릴 섹션 — 이미 들어가 있으면 건너뛴다(멱등)
  const additions = [];
  if (sec['핵심 어휘']?.length && !existing.includes('만나는 낱말'))
    additions.push({ after: '다루는 내용', html: vocabHtml(sec['핵심 어휘']) });
  if (sec['아이의 호기심을 여는 질문']?.length && !existing.includes('호기심을 여는 질문'))
    additions.push({
      after: '관찰하면 좋은',
      html: paraHtml('아이의 호기심을 여는 질문', sec['아이의 호기심을 여는 질문']),
    });
  if (sec['함께 할 수 있는 활동']?.length && !existing.includes('함께 할 수 있는 활동'))
    additions.push({
      after: '부모 가이드',
      html: paraHtml('함께 할 수 있는 활동', sec['함께 할 수 있는 활동']),
    });

  // 사용 안 한 삽화를 새 카드에 붙인다.
  // 🔴 mkt_contents 에 book_id 컬럼이 없다 — 기존 카드 이미지 파일명 앞의 숫자가 책 ID다.
  const used = new Set(cards.map((c) => c.content?.url).filter(Boolean));
  const bookId = [...used].map((u) => decodeURIComponent(u).match(/\/(\d{10,})-/)?.[1]).find(Boolean);
  const bookJson = bookId ? await fetchBook(bookId) : null;
  const spare = ((bookJson?.pages ?? []).map((p) => p.illustrationUrl).filter(Boolean)).filter(
    (u) => !used.has(u),
  );

  // 책의 parentGuide 중 블로그가 안 쓴 것 — 읽어주기 팁 · 이 책으로 배우는 것.
  // overview·faq 는 이미 카드에 들어가 있어 중복이라 뺀다.
  const pg = bookJson?.parentGuide ?? bookJson?.parent_guide;
  const tips = Array.isArray(pg?.readingTips) ? pg.readingTips : [];
  const lessons = Array.isArray(pg?.lessons) ? pg.lessons : [];
  if ((tips.length || lessons.length) && !existing.includes('읽어줄 때')) {
    const parts = [];
    if (tips.length) parts.push(`<h2>읽어줄 때 이렇게</h2><ul>${tips.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`);
    if (lessons.length)
      parts.push(`<h3>이 책으로 배우는 것</h3><ul>${lessons.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`);
    additions.push({ after: '부모 가이드', html: parts.join('') });
  }
  if (!additions.length) return { skip: '이미 확장됨' };

  // 🔴 삽입 위치는 additions 를 **다 모은 뒤** 계산한다 — 먼저 계산하면 나중에 push 한
  //    섹션이 plan 에 안 들어가 조용히 누락된다(parentGuide 카드가 그랬다).
  //    앵커 카드 뒤에 넣고, 못 찾으면 FAQ 앞(뒤에서 3번째).
  const idxOf = (needle) => cards.findIndex((c) => (c.content?.text ?? '').includes(needle));
  const plan = additions.map((a) => {
    const i = idxOf(a.after);
    return { html: a.html, at: i >= 0 ? i + 1 : Math.max(0, cards.length - 3) };
  });

  const merged = cards.map((c) => ({ id: c.id, content: c.content }));
  plan
    .sort((a, b) => b.at - a.at) // 뒤에서부터 끼워야 앞 인덱스가 안 밀린다
    .forEach((p, k) => {
      const url = spare[k];
      merged.splice(p.at, 0, {
        id: null,
        content: {
          text: p.html,
          url: url ?? '',
          caption: '',
          alt: url ? `${content.title} 그림책 삽화` : '',
          image_prompt: '',
        },
      });
    });

  const before = existing.replace(/<[^>]+>/g, '').replace(/\s/g, '').length;
  const after = merged
    .map((m) => m.content.text ?? '')
    .join('')
    .replace(/<[^>]+>/g, '')
    .replace(/\s/g, '').length;

  if (!APPLY) return { added: additions.length, before, after, dry: true };

  // 새 카드 삽입 + 전체 sort_order 재부여
  for (let i = 0; i < merged.length; i++) {
    const m = merged[i];
    if (m.id) {
      await sb(`mkt_blog_cards?id=eq.${m.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ sort_order: i }),
      });
    } else {
      await sb('mkt_blog_cards', {
        method: 'POST',
        body: JSON.stringify({
          user_id: ownerId,
          blog_content_id: blog.id,
          sort_order: i,
          card_type: 'text',
          content: m.content,
        }),
      });
    }
  }
  return { added: additions.length, before, after };
}

/** R2 책 JSON — 미사용 삽화와 parentGuide 를 함께 쓴다 */
async function fetchBook(bookId) {
  try {
    const res = await fetch(`${process.env.R2_PUBLIC_URL}/storybook-${bookId}.json`);
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function main() {
  const filter = args.book
    ? `title=ilike.*${encodeURIComponent(args.book)}*`
    : `category=eq.${args.category ?? 'nature'}`;
  const contents = await sb(`mkt_contents?select=id,title&${filter}&order=title`);
  console.log(`대상 ${contents.length}편${APPLY ? '' : ' (dry-run — --apply 로 반영)'}\n`);

  let done = 0;
  for (const c of contents) {
    let r;
    try {
      r = await expandOne(c);
    } catch (e) {
      console.log(`  ✗ ${c.title}: ${e.message.slice(0, 80)}`);
      continue;
    }
    if (r.skip) console.log(`  – ${c.title}: ${r.skip}`);
    else {
      done += 1;
      console.log(`  ✓ ${c.title}: +${r.added}섹션  ${r.before}자 → ${r.after}자`);
    }
  }
  console.log(`\n${APPLY ? '반영' : 'dry-run'} 완료 — ${done}편`);
}

main().catch((e) => {
  console.error('Fatal:', e.message);
  process.exit(1);
});
