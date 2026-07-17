// 블로그 JSON + 기본글 → 카드뉴스 + 릴스 스토리보드 일괄 파생 (사실 기반).
// 블로그 섹션(intro/facts/tango/obs/guide + 섹션별 영문 image_prompt)과 키워드·메타를 재구성.
// 출력: _data/marketing/cardnews/<id>.json, _data/marketing/storyboards/<id>.json
// 기존 파일(손수 작성 샘플)은 --force 없으면 건너뜀.
// 실행: node packages/server/scripts/derive-cardnews-storyboards.mjs [--ids a,b | --all] [--force]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const BASE = path.join(__dir, '_data', 'marketing', 'base-articles');
const BLOG = path.join(__dir, '_data', 'marketing', 'blogs');
const CN = path.join(__dir, '_data', 'marketing', 'cardnews');
const SBD = path.join(__dir, '_data', 'marketing', 'storyboards');

function parseArgs(argv) {
  const a = { ids: null, all: false, force: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--all') a.all = true;
    else if (argv[i] === '--force') a.force = true;
    else if (argv[i] === '--ids') a.ids = argv[++i].split(',').map((s) => s.trim()).filter(Boolean);
  }
  if (!a.all && !a.ids) a.all = true;
  return a;
}

const stripTags = (h) =>
  String(h ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();

function h2of(html) {
  const m = String(html ?? '').match(/<h2>([\s\S]*?)<\/h2>/i);
  return m ? stripTags(m[1]) : '';
}
function pText(html) {
  // remove h2, then strip
  return stripTags(String(html ?? '').replace(/<h2>[\s\S]*?<\/h2>/i, ''));
}
function sentences(text) {
  return String(text ?? '')
    .split(/(?<=[.!?。…])\s+|(?<=요)\s+(?=[가-힣])/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function firstSentence(text) {
  const s = sentences(text);
  return s[0] ?? '';
}
function truncate(s, n) {
  s = String(s ?? '').trim();
  return s.length > n ? s.slice(0, n).trimEnd() + '…' : s;
}
// "신데렐라 줄거리 요약" 류 h2 에서 군더더기 제거(— 이후, 끝의 (FAQ) 등). 슬라이드 제목용.
function cleanTitle(h2) {
  return h2.replace(/\s*[—-].*$/, '').replace(/\(FAQ\)/, '').trim();
}

function deriveCardnews(blog, base) {
  const secs = (blog.sections || []).filter((s) => h2of(s.text_html) && !/자주 묻는 질문/.test(h2of(s.text_html)));
  const isNature = base.category === 'nature';
  const brandTag = isNature ? '탱고북 자연관찰' : '탱고북 명작동화';
  const roleTags = isNature
    ? ['신기한 사실', '탱고북 내용', '관찰 포인트', '부모 가이드']
    : ['원작 이야기', '줄거리', '교훈', '읽어주는 법'];

  const slides = [];
  // cover
  const intro = secs[0];
  slides.push({
    header: brandTag,
    title: cleanTitle(h2of(intro.text_html)),
    body: truncate(firstSentence(pText(intro.text_html)), 78),
    image_prompt: intro.image_prompt || '',
  });
  // content slides (sections 2..5)
  for (let i = 1; i < Math.min(secs.length, 5); i++) {
    const s = secs[i];
    const body = truncate(sentences(pText(s.text_html)).slice(0, 2).join(' '), 78);
    slides.push({
      header: roleTags[i - 1] || '',
      title: cleanTitle(h2of(s.text_html)),
      body,
      image_prompt: s.image_prompt || '',
    });
  }
  // CTA
  slides.push({
    header: '탱고북',
    title: '동화로 자라는\n4~7세',
    body: '7일 무료체험 · tangobook.co.kr',
    image_prompt: 'Tangobook brand closing scene, warm coral and peach storybook style, no text',
  });

  // caption: meta_description + CTA line
  const caption = `${(blog.meta_description || '').trim()}\n\n📖 탱고북에서 만나요 · tangobook.co.kr`;
  // hashtags: keywords → 공백 제거 + 탱고북
  const kws = [blog.primary_keyword, ...(blog.secondary_keywords || [])]
    .filter(Boolean)
    .map((k) => k.replace(/\s+/g, ''))
    .filter((k) => k.length >= 2 && k.length <= 12);
  const hashtags = [...new Set([...kws, isNature ? '자연관찰' : '명작동화', '탱고북'])].slice(0, 8);

  return { storybookId: blog.storybookId, caption, hashtags, slides };
}

function deriveStoryboard(blog, base) {
  let secs = (blog.sections || []).filter((s) => h2of(s.text_html) && !/자주 묻는 질문/.test(h2of(s.text_html)));
  const isNature = base.category === 'nature';
  const isLife = base.category === 'life'; // 호리네 생활동화 = 창작 습관·안전 동화(원작 없음)
  // 🔴 생활동화는 블로그 논리(공감 → 왜 중요 → 호리 이야기 → 집에서 실천)를 그대로 따른다.
  // 블로그의 "탱고북에서 함께 읽어요" 섹션은 마지막 CTA 씬과 중복(홍보 2연타)이라 본문에서 제외 —
  // 그 자리에 엄마에게 실제로 쓸모있는 "집에서 실천" 섹션이 들어간다.
  if (isLife) secs = secs.filter((s) => !/탱고북/.test(h2of(s.text_html)));
  const labels = isNature
    ? ['훅', '신기한 사실', '탱고북 내용', '관찰 포인트']
    : isLife
      ? ['훅', '왜 중요할까', '호리 이야기', '집에서 이렇게']
      : ['훅', '원작·배경', '줄거리', '교훈'];

  const scenes = [];
  // 훅 + 본문 3 (sections 1..4)
  for (let i = 0; i < Math.min(secs.length, 4); i++) {
    const s = secs[i];
    // 🔴 "몇 가지 방법을 소개할게요" 류 예고 문장만 뽑혀 정작 방법을 안 알려주던 문제(리뷰 피드백)
    // → 내용 없는 도입/예고 문장을 걸러내고 실제 알맹이 문장부터 담는다.
    const allSents = sentences(pText(s.text_html));
    const meaty = allSents.filter(
      (x) =>
        !/(소개할게요|차례예요|살펴볼까요|알아볼까요|알려드릴게요|정리해 볼게요|해 볼까요)[.!?]*\s*$/.test(
          x.trim()
        )
    );
    const src = meaty.length ? meaty : allSents;
    // 씬별 분량: 훅은 짧게(1문장). 생활동화 "호리 이야기"(i=2)는 릴스에서 책 원문 미리보기로 대체된다.
    const isStoryScene = isLife && i === 2;
    // 🔴 "집에서 이렇게"(i=3)는 첫째만 나오고 끊겨 "잘리다 만 느낌"(리뷰) → 첫째·둘째 두 팁을
    //    각각 한 문장씩 뽑아 완결시킨다(설명 문장은 빼고 팁 헤드라인만).
    const isTipScene = isLife && i === 3;
    let narr;
    if (isTipScene) {
      const tips = src.filter((x) => /^(첫째|둘째|셋째)[,.\s]/.test(x.trim())).slice(0, 2);
      narr = tips.length >= 2 ? tips.join(' ') : truncate(src.slice(0, 2).join(' '), 110);
    } else if (isLife && i === 0) {
      // 🔴 생활동화 훅 = **공감**. 릴스에서 "왜 중요할까"(영양 교육)를 뺐으므로 훅이 공감을 온전히
      //    담당한다 — 블로그 도입부 2문장("…밀려나 있지 않나요? …보며 한숨 쉰…")이 그대로 공감이다.
      narr = truncate(src.slice(0, 2).join(' '), 110);
    } else {
      const takeSents = i === 0 ? 1 : isStoryScene ? 3 : 2;
      const maxChars = i === 0 ? 60 : isStoryScene ? 190 : 110;
      narr = truncate(src.slice(0, takeSents).join(' '), maxChars);
    }
    const title = cleanTitle(h2of(s.text_html));
    scenes.push({
      label: labels[i] || '',
      sec: i === 0 ? 4 : 8,
      narration: narr,
      screen: `${title} 장면 — 9:16, 동화풍, 따뜻한 색감. (이미지 프롬프트 참조)`,
      subtitle: truncate(title, 22),
      imagePrompt: (s.image_prompt || '').replace(/, no text$/, ', cinematic 9:16, no text'),
    });
  }
  // CTA
  scenes.push({
    label: 'CTA',
    sec: 8,
    narration: `${base.title}, 아이와 함께 탱고북에서 만나요.`,
    screen: '부모·아이가 그림책을 함께 보는 장면 → 탱고북 로고 + 7일 무료체험.',
    subtitle: '탱고북 · 7일 무료체험',
    imagePrompt: 'A parent and child reading a picture book together, Tangobook logo, warm coral, 9:16, no text',
  });

  const totalSec = scenes.reduce((a, s) => a + (s.sec || 0), 0);
  const hook = truncate(firstSentence(pText(secs[0].text_html)), 40);
  return { storybookId: blog.storybookId, title: base.title, hook, totalSec, scenes };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(CN)) fs.mkdirSync(CN, { recursive: true });
  if (!fs.existsSync(SBD)) fs.mkdirSync(SBD, { recursive: true });

  const blogFiles = fs.readdirSync(BLOG).filter((f) => f.endsWith('.json'));
  const targetIds = args.all ? blogFiles.map((f) => f.replace('.json', '')) : args.ids;

  let cn = 0,
    sb = 0,
    skip = 0;
  for (const id of targetIds) {
    const blogP = path.join(BLOG, `${id}.json`);
    const baseP = path.join(BASE, `${id}.json`);
    if (!fs.existsSync(blogP) || !fs.existsSync(baseP)) {
      console.warn(`스킵(소스 없음): ${id}`);
      continue;
    }
    const blog = JSON.parse(fs.readFileSync(blogP, 'utf8'));
    const base = JSON.parse(fs.readFileSync(baseP, 'utf8'));

    const cnP = path.join(CN, `${id}.json`);
    const sbP = path.join(SBD, `${id}.json`);
    if (!args.force && fs.existsSync(cnP) && fs.existsSync(sbP)) {
      skip++;
      continue;
    }
    if (args.force || !fs.existsSync(cnP)) {
      fs.writeFileSync(cnP, JSON.stringify(deriveCardnews(blog, base), null, 1));
      cn++;
    }
    if (args.force || !fs.existsSync(sbP)) {
      fs.writeFileSync(sbP, JSON.stringify(deriveStoryboard(blog, base), null, 1));
      sb++;
    }
  }
  console.log(`파생 완료 — 카드뉴스 ${cn}, 스토리보드 ${sb}, 스킵(기존) ${skip}`);
}

main();
