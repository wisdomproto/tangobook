// 카드뉴스 슬라이드를 타깃 디자인(텍스트 템플릿)으로 재설계:
//   카테고리 pill(위) → 제목(네이비, 둥근 폰트) → 빈 이미지 박스(중앙, 라운드: AI 생성 후 붙여넣기)
//   → 구분선 → 본문(회색) → 페이지 배지 + tangobook.co.kr footer.
//   명작=coral / 자연관찰=mint 색 구분. 밝은 배경. 기존 슬라이드 텍스트(title/body) 재사용.
//   이미지 박스는 비워둠(background_image_url=null) — 사용자가 카드별 AI 이미지를 붙여넣음. 멱등.
//   node scripts/fill-cardnews-design.mjs --dry-run [--ids a,b] [--title 토끼] [--limit N]
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
for (const line of readFileSync(join(__dirname, '..', '.env'), 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const supa = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const DRY = process.argv.includes('--dry-run');
const idsArg = process.argv.find((a) => a.startsWith('--ids='));
const IDS = idsArg ? idsArg.split('=')[1].split(',') : null;
const titleArg = process.argv.find((a) => a.startsWith('--title='));
const TITLE = titleArg ? titleArg.split('=')[1] : null;
const limArg = process.argv.find((a) => a.startsWith('--limit='));
const LIMIT = limArg ? parseInt(limArg.split('=')[1], 10) : Infinity;

// ─── Design tokens ───────────────────────────────────────────────────────────
const FONT = 'NanumSquareRound';
const NAVY = '#2A3354'; // 제목
const GRAY = '#5B5650'; // 본문
const FOOT = '#A39C94'; // footer
const WHITE = '#FFFFFF';
const THEME = {
  nature: { bg: '#F2FAF6', pillBg: '#D8F3E7', pillText: '#2A8761', divider: '#5CC99F', pageBg: '#5CC99F', label: '🌱 자연관찰' },
  classic: { bg: '#FFF8EF', pillBg: '#FFE4DC', pillText: '#D2441F', divider: '#FF7A59', pageBg: '#FF7A59', label: '📖 세계명작' },
};

// 3영역 고정 레이아웃 (% of card height):
//   헤더(pill+제목) → 이미지 박스 → 본문(구분선+내용+footer).
//   제목/본문은 fitHeight 로 각 영역에 맞춰 폰트 자동 축소 → 길이 무관 겹침/넘침 없음.
const RECT = {
  cover: { x: 8, y: 30, w: 84, h: 42 }, // 30~72
  body: { x: 9, y: 27, w: 82, h: 35 }, //  27~62
  cta: { x: 8, y: 32, w: 84, h: 38 }, //  32~70
};

function buildBlocks(kind, th, { label, title, body, footer, pageText }) {
  const pill = (id, text, x, y, fs, bg, color) => ({
    id, text, x, y, fontSize: fs, color, fontFamily: FONT, fontWeight: 'bold', textAlign: 'left', width: 40, pill: true, pillColor: bg,
  });
  // fit = fitHeight(%) — 해당 영역 높이에 맞춰 폰트 자동 축소.
  const txt = (id, text, x, y, fs, color, weight, lineHeight, fit) => ({
    id, text, x, y, fontSize: fs, color, fontFamily: FONT, fontWeight: weight, textAlign: 'left', width: 84,
    ...(lineHeight ? { lineHeight } : {}),
    ...(fit ? { fitHeight: fit } : {}),
  });

  if (kind === 'cover') {
    return [
      pill('label', label, 8, 7, 12, th.pillBg, th.pillText),
      pill('page', pageText, 74, 7, 10, th.pageBg, WHITE),
      txt('title', title, 8, 14, 30, NAVY, 'bold', 1.15, 13), // 헤더영역 14~27
      txt('body', body, 8, 78, 15, GRAY, 'normal', 1.35, 11), // 본문영역 78~89
      txt('footer', footer, 8, 92, 12, FOOT, 'bold'),
    ];
  }
  if (kind === 'cta') {
    return [
      pill('label', label, 8, 8, 12, th.pillBg, th.pillText),
      pill('page', pageText, 74, 8, 10, th.pageBg, WHITE),
      txt('title', title, 8, 16, 27, NAVY, 'bold', 1.15, 12), // 16~28
      txt('body', body, 8, 75, 16, NAVY, 'normal', 1.4, 12), //  75~87
      pill('footer', footer, 8, 89, 15, th.pageBg, WHITE),
    ];
  }
  // body
  return [
    pill('label', label, 8, 6, 11, th.pillBg, th.pillText),
    pill('page', pageText, 74, 6, 10, th.pageBg, WHITE),
    txt('title', title, 8, 13, 23, NAVY, 'bold', 1.15, 12), // 헤더영역 13~25
    txt('body', body, 8, 68, 15, GRAY, 'normal', 1.4, 24), //  본문영역 68~92
    txt('footer', footer, 8, 93, 11, FOOT, 'bold'),
  ];
}

const tb = (card, id) => (card.text_style?.textBlocks || []).find((b) => b.id === id)?.text || '';

const { data: contents } = await supa
  .from('mkt_contents')
  .select('id,memo,category,title')
  .like('memo', 'storybook:%');
let list = (contents || []).filter((c) => c.memo);
if (IDS) list = list.filter((c) => IDS.includes(c.memo.replace('storybook:', '')));
if (TITLE) list = list.filter((c) => (c.title || '').includes(TITLE));
list = list.slice(0, LIMIT);

let processed = 0, slides = 0;
for (const ct of list) {
  const { data: igc } = await supa
    .from('mkt_instagram_contents')
    .select('id')
    .eq('content_id', ct.id)
    .limit(1);
  if (!igc?.length) continue;
  const { data: cards } = await supa
    .from('mkt_instagram_cards')
    .select('*')
    .eq('instagram_content_id', igc[0].id)
    .order('sort_order');
  if (!cards?.length) continue;

  const n = cards.length;
  const th = THEME[ct.category === 'nature' ? 'nature' : 'classic'];
  const now = new Date().toISOString();

  for (let i = 0; i < n; i++) {
    const card = cards[i];
    // 텍스트 전부 제거 + 이미지칸은 카드 전체(풀블리드). 사용자가 AI 이미지를 붙여넣음.
    const newStyle = {
      bgColor: th.bg,
      imageUrl: null,
      imageY: 50,
      imageRect: { x: 0, y: 0, w: 100, h: 100 },
      textBlocks: [],
    };
    if (!DRY) {
      await supa
        .from('mkt_instagram_cards')
        .update({
          text_style: newStyle,
          background_image_url: null,
          background_color: th.bg,
          text_content: null,
          updated_at: now,
        })
        .eq('id', card.id);
    }
    slides++;
  }
  processed++;
  if (DRY && processed <= 5)
    console.log(`${ct.title} [${ct.category}]: ${n}장 → 텍스트 제거 + 풀블리드 빈 박스`);
}
console.log(`${DRY ? '[DRY] ' : ''}processed=${processed} slides=${slides} (text cleared, full-bleed empty)`);
