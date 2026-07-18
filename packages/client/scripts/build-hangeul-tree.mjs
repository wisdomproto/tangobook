/*
 * build-hangeul-tree.mjs — 「한글 나무 · 호리네 파닉스 동화」 회차 HTML + index.json 생성기
 *
 * 입력: docs/phonics-hangeul-tree/<unitId>.md (32개 대본, 8쪽 본문+SCENE)
 * 출력: packages/client/public/hangeul-tree-<unitId>.html (32개) + hangeul-tree-index.json
 *
 * 저작도구 시스템 = jeonrae/saenghwal 포크. 회차 HTML 은 hangeul-tree-core.js 를 include 해
 * 좌측 사이드바(회차 네비 + R2 상태/메모) + 전체/쪽별 이미지 프롬프트 + 컷 붙여넣기를 자동 장착.
 *
 * 재생성: node packages/client/scripts/build-hangeul-tree.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..', '..', '..');
const MD_DIR = join(ROOT, 'docs', 'phonics-hangeul-tree');
const OUT_DIR = join(ROOT, 'packages', 'client', 'public');

// ── 고정 캐스트 8인 (생활동화 니들펠트 SSOT 재사용) ──
const CAST = {
  hori: { name: '호리', emoji: '🐯', aliases: ['Hori', '호리'], desc: '아기 호랑이(5세) 주인공 — 주황 털(#F8A755)+갈색 줄무늬, 크림색 배, 분홍 볼터치, 크고 둥근 호기심 눈.' },
  mom: { name: '엄마', emoji: '🐯', aliases: ['Mom', 'mother tiger', '엄마'], desc: '엄마 호랑이 — 호리와 같은 팔레트의 둥근 치비(살짝만 큼 1.35배), 부드러운 속눈썹, 복숭아색 앞치마. 어린 인상.' },
  dad: { name: '아빠', emoji: '🐯', aliases: ['Dad', 'father tiger', '아빠'], desc: '아빠 호랑이 — 진한 주황 털의 둥근 치비(살짝만 큼 1.4배), 작고 둥근 안경, cowlick, 큰 미소. 어린 인상.' },
  hoya: { name: '호야', emoji: '🍼', aliases: ['Hoya', 'baby brother', '호야'], desc: '아기 동생 호랑이(2세) — 호리와 같은 팔레트지만 더 통통·머리 비율 큼, 노란 턱받이, 침 흘리는 행복한 얼굴.' },
  toto: { name: '토토', emoji: '🐰', aliases: ['Toto', 'bunny', '토토'], desc: '토끼(5세) — 흰 털, 연하늘색 귀 안쪽, 길게 선 귀, 자신만만한 눈, 앞으로 기운 활발한 자세, 빨간 손수건.' },
  bori: { name: '보리', emoji: '🐻', aliases: ['Bori', 'bear', '보리'], desc: '곰(6세) — 연갈색 통통한 몸, 수줍고 부드러운 표정, 큰 눈이 살짝 아래를 봄, 파란 멜빵바지.' },
  kongi: { name: '콩이', emoji: '🐿️', aliases: ['Kongi', 'squirrel', '콩이'], desc: '다람쥐(5세) — 크고 줄무늬진 복슬 꼬리, 먹이를 문 듯 빵빵한 볼주머니, 장난스러운 미소, 도토리.' },
  dubu: { name: '두부', emoji: '🐶', aliases: ['Dubu', 'puppy', '두부'], desc: '강아지 — 동글동글 흰 몸, 한쪽만 접힌 갈색 귀, 크고 반짝이는 눈, 빨간 목줄, 혀 내밀고 행복.' },
};

// ── 32 유닛 메타 (기획서 SSOT 표와 동일) ──
const UNITS = [
  // 한글1 · 기본음절
  { id: 'kr-h1-u01', num: 1, lvl: '한글1 · 기본음절', emoji: '🎵', glyph: '모음', title: '모음', cast: ['hori', 'toto'], words: [], concept: '나무에 모음 열매 열 개가 주렁주렁 — 아야어여오요 노래로 따라 불러요' },
  { id: 'kr-h1-u02', num: 2, lvl: '한글1 · 기본음절', emoji: '🍖', glyph: 'ㄱ', title: 'ㄱ', cast: ['hori', 'dubu'], words: ['고기', '가구', '아기', '야구'], concept: 'ㄱ 열매를 따서 고기·가구·아기·야구를 읽어요' },
  { id: 'kr-h1-u03', num: 3, lvl: '한글1 · 기본음절', emoji: '🙋', glyph: 'ㄴ', title: 'ㄴ', cast: ['hori', 'bori'], words: ['나', '너', '누나', '누구야'], concept: '나·너 서로 가리키며 이름 부르기 놀이' },
  { id: 'kr-h1-u04', num: 4, lvl: '한글1 · 기본음절', emoji: '👞', glyph: 'ㄷ', title: 'ㄷ', cast: ['hori', 'kongi'], words: ['두유', '도마', '기도', '구두'], concept: '도마·구두를 만져보며 ㄷ 단어 읽기' },
  { id: 'kr-h1-u05', num: 5, lvl: '한글1 · 기본음절', emoji: '🦆', glyph: 'ㄹ', title: 'ㄹ', cast: ['hori', 'toto'], words: ['오리', '너구리', '다리', '노루'], concept: '다리를 건너는 오리·너구리·노루' },
  { id: 'kr-h1-u06', num: 6, lvl: '한글1 · 기본음절', emoji: '🦟', glyph: 'ㅁ', title: 'ㅁ', cast: ['hori', 'dubu'], words: ['머리', '모두', '모기', '거미'], concept: '여름 나무 그늘, 모기·거미 단어 읽기' },
  { id: 'kr-h1-u07', num: 7, lvl: '한글1 · 기본음절', emoji: '🌊', glyph: 'ㅂ', title: 'ㅂ', cast: ['hori', 'dubu'], words: ['바다', '비누', '나비', '두부'], concept: "'두부' 단어가 나무에 뜸 — 두부가 신남" },
  { id: 'kr-h1-u08', num: 8, lvl: '한글1 · 기본음절', emoji: '🦁', glyph: 'ㅅ', title: 'ㅅ', cast: ['hori', 'bori'], words: ['사자', '버스', '가수', '미소'], concept: "'가수'가 되어 노래하는 흉내" },
  { id: 'kr-h1-u09', num: 9, lvl: '한글1 · 기본음절', emoji: '🥛', glyph: 'ㅇ', title: 'ㅇ', cast: ['hori', 'kongi'], words: ['우주', '여우', '우유', '어부'], concept: "동그란 ㅇ — 우유·우주·여우 상상하기" },
  { id: 'kr-h1-u10', num: 10, lvl: '한글1 · 기본음절', emoji: '🗺️', glyph: 'ㅈ', title: 'ㅈ', cast: ['hori', 'toto'], words: ['지구', '지도', '자두', '모자'], concept: '지도를 펴고 자두나무 보물찾기' },
  { id: 'kr-h1-u11', num: 11, lvl: '한글1 · 기본음절', emoji: '🧀', glyph: 'ㅊ', title: 'ㅊ', cast: ['hori', 'kongi'], words: ['치마', '치즈', '마차', '기차'], concept: '기차·마차 흉내, 치즈 냄새 맡기' },
  { id: 'kr-h1-u12', num: 12, lvl: '한글1 · 기본음절', emoji: '🍪', glyph: 'ㅋ', title: 'ㅋ', cast: ['hori', 'dubu'], words: ['쿠키', '코코아', '마이크', '카드'], concept: '마이크 잡고 쿠키·코코아 노래' },
  { id: 'kr-h1-u13', num: 13, lvl: '한글1 · 기본음절', emoji: '🐆', glyph: 'ㅌ', title: 'ㅌ', cast: ['hori', 'bori'], words: ['타조', '하트', '기타', '치타'], concept: '치타·타조처럼 빨리 달리기 시합' },
  { id: 'kr-h1-u14', num: 14, lvl: '한글1 · 기본음절', emoji: '🍕', glyph: 'ㅍ', title: 'ㅍ', cast: ['hori', 'toto'], words: ['피자', '파리', '포도', '소파'], concept: '소파에서 피자·포도 간식 단어 읽기' },
  { id: 'kr-h1-u15', num: 15, lvl: '한글1 · 기본음절', emoji: '🦛', glyph: 'ㅎ', title: 'ㅎ', cast: ['hori', 'kongi'], words: ['하마', '호두', '휴지', '호수'], concept: '호수로 소풍 — 하마 구경, 호두 까먹기' },
  // 한글2 · 받침
  { id: 'kr-h2-u01', num: 16, lvl: '한글2 · 받침', emoji: '🏀', glyph: '받침 ㅇ', title: '받침 ㅇ', cast: ['hori', 'bori'], words: ['형', '풍덩', '농구', '시장'], concept: '받침 ㅇ — 농구 하며 골 넣기' },
  { id: 'kr-h2-u02', num: 17, lvl: '한글2 · 받침', emoji: '⚽', glyph: '받침 ㄱ', title: '받침 ㄱ', cast: ['hori', 'dubu'], words: ['학교', '축구', '악어', '탁구'], concept: '받침 ㄱ — 축구·탁구 운동 단어' },
  { id: 'kr-h2-u03', num: 18, lvl: '한글2 · 받침', emoji: '🌱', glyph: '받침 ㄴ', title: '받침 ㄴ', cast: ['hori', 'toto'], words: ['손', '눈', '언니', '잔디'], concept: '받침 ㄴ — 잔디밭에서 손 잡고 놀기' },
  { id: 'kr-h2-u04', num: 19, lvl: '한글2 · 받침', emoji: '🌙', glyph: '받침 ㄹ', title: '받침 ㄹ', cast: ['hori', 'kongi'], words: ['별', '달', '하늘', '가을'], concept: '받침 ㄹ — 밤 나무 아래 별·달 올려보기' },
  { id: 'kr-h2-u05', num: 20, lvl: '한글2 · 받침', emoji: '🤖', glyph: '받침 ㅅ', title: '받침 ㅅ', cast: ['hori', 'bori'], words: ['옷', '로봇', '비옷', '그릇'], concept: '받침 ㅅ — 로봇 흉내로 삐걱삐걱' },
  { id: 'kr-h2-u06', num: 21, lvl: '한글2 · 받침', emoji: '☁️', glyph: '받침 ㅁ', title: '받침 ㅁ', cast: ['hori', 'mom'], words: ['몸', '엄마', '염소', '구름'], concept: '받침 ㅁ — 엄마랑 몸 스트레칭, 구름 구경' },
  { id: 'kr-h2-u07', num: 22, lvl: '한글2 · 받침', emoji: '🍙', glyph: '받침 ㅂ', title: '받침 ㅂ', cast: ['hori', 'dubu'], words: ['집', '컵', '입술', '김밥'], concept: '받침 ㅂ — 나무 아래 김밥 소풍' },
  // 한글3 · 쌍자음
  { id: 'kr-h3-u01', num: 23, lvl: '한글3 · 쌍자음', emoji: '🐰', glyph: 'ㄲ', title: 'ㄲ', cast: ['hori', 'toto'], words: ['꿀벌', '꼬끼오', '토끼', '코끼리'], concept: '토끼(토토!)와 함께 센 소리 ㄲ 읽기' },
  { id: 'kr-h3-u02', num: 24, lvl: '한글3 · 쌍자음', emoji: '🥜', glyph: 'ㄸ', title: 'ㄸ', cast: ['hori', 'kongi'], words: ['떡국', '똑딱', '땅콩', '딸기'], concept: '땅콩·딸기 간식, 시계 똑딱' },
  { id: 'kr-h3-u03', num: 25, lvl: '한글3 · 쌍자음', emoji: '😙', glyph: 'ㅃ', title: 'ㅃ', cast: ['hori', 'dad'], words: ['오빠', '뽀뽀', '빨래', '아빠'], concept: '아빠가 직접 등장 — 빨래 널며 읽기' },
  { id: 'kr-h3-u04', num: 26, lvl: '한글3 · 쌍자음', emoji: '🌰', glyph: 'ㅆ', title: 'ㅆ', cast: ['hori', 'kongi'], words: ['씨앗', '새싹', '쓱싹', '썰매'], concept: '씨앗 심고 쓱싹 흙 덮어 새싹 기다리기' },
  { id: 'kr-h3-u05', num: 27, lvl: '한글3 · 쌍자음', emoji: '🥟', glyph: 'ㅉ', title: 'ㅉ', cast: ['hori', 'bori'], words: ['찐빵', '짝꿍', '쫑긋', '쪽지'], concept: '짝꿍 보리에게 쪽지 전하고 찐빵 나누기' },
  // 한글4 · 복잡한 모음
  { id: 'kr-h4-u01', num: 28, lvl: '한글4 · 복잡한 모음', emoji: '🐋', glyph: 'ㅐ ㅔ', title: 'ㅐ·ㅔ', cast: ['hori', 'hoya'], words: ['고래', '동생', '레몬', '베개'], concept: '동생 호야와 함께 — 베개 안고 고래 꿈꾸기' },
  { id: 'kr-h4-u02', num: 29, lvl: '한글4 · 복잡한 모음', emoji: '🥚', glyph: 'ㅖ ㅚ', title: 'ㅖ·ㅚ', cast: ['hori', 'dubu'], words: ['계란', '예절', '시계', '얘기'], concept: '시계 보며 예절 배우기, 계란 요리' },
  { id: 'kr-h4-u03', num: 30, lvl: '한글4 · 복잡한 모음', emoji: '🐭', glyph: 'ㅟ ㅢ', title: 'ㅟ·ㅢ', cast: ['hori', 'kongi'], words: ['참외', '열쇠', '생쥐', '가위'], concept: '열쇠로 상자 열기 — 안에 참외·가위' },
  { id: 'kr-h4-u04', num: 31, lvl: '한글4 · 복잡한 모음', emoji: '🍎', glyph: 'ㅘ ㅙ', title: 'ㅘ·ㅙ', cast: ['hori', 'toto'], words: ['과자', '사과', '화가', '횃불'], concept: '화가가 된 호리가 사과 그림 그리기' },
  { id: 'kr-h4-u05', num: 32, lvl: '한글4 · 복잡한 모음', emoji: '🥊', glyph: 'ㅝ ㅞ ㅢ', title: 'ㅝ·ㅞ·ㅢ', cast: ['hori', 'bori'], words: ['권투', '스웨터', '의자', '의사'], concept: '의사 놀이 — 의자에 앉혀 진찰하기 (마지막 유닛)' },
];

// 쪽 번호 → beat 태그
const BEATS = ['① 도입', '② 오늘의 글자', '③ 단어 ①②', '③ 단어 ③④', '④ 수다', '⑤ 웃음 🎈', '⑥ 따라 하기', '⑦ 마무리'];

// ── 마크다운 파서 ──
function esc(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function md2bold(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
}
function parseMarkdown(md) {
  const parts = md.split(/\n## \[쪽\s*/);
  const pages = [];
  for (let i = 1; i < parts.length; i++) {
    const chunk = parts[i];
    const nl = chunk.indexOf('\n');
    const firstLine = chunk.slice(0, nl).trim(); // "1] 나무 앞에 모이기"
    const m = firstLine.match(/^(\d+)\]\s*(.*)$/);
    const pnum = m ? +m[1] : i;
    const ptitle = m ? m[2].trim() : firstLine;
    const rest = chunk.slice(nl + 1);
    // 본문
    const bo = rest.split(/\*\*본문\*\*/)[1] || '';
    const bodyRaw = bo.split(/\*\*SCENE\*\*/)[0] || '';
    const bodyLines = bodyRaw.split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('**'));
    const body = bodyLines.map(md2bold).join(' ');
    // SCENE
    const sc = rest.split(/\*\*SCENE\*\*/)[1] || '';
    const sceneRaw = sc.split(/\*\*\[등장\]\*\*/)[0] || '';
    const sceneLines = sceneRaw.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('- '));
    const scene = sceneLines
      .map((l) => {
        const t = l.replace(/^-\s*/, '');
        const ci = t.indexOf(':');
        if (ci === -1) return md2bold(t) + '<br/>';
        return '<b>' + esc(t.slice(0, ci)) + '</b> ' + md2bold(t.slice(ci + 1).trim()) + '<br/>';
      })
      .join('\n');
    pages.push({ pnum, ptitle, body, scene });
  }
  return pages;
}

// ── 회차 HTML 템플릿 ──
function episodeHtml(u, pages) {
  const castArr = u.cast.map((k) => CAST[k]);
  const castNames = castArr.map((c) => c.emoji + ' ' + c.name).join(' · ');
  const wordsStr = u.words.length ? u.words.join(' · ') : '모음 열 개 (아야어여오요우유으이)';
  const heroTitle = u.title + ' 배우기';

  const pageCards = pages
    .map((p) => {
      const beat = BEATS[p.pnum - 1] || '';
      const beatTag = beat ? `<span class="tag beat">${beat}</span>` : '';
      return `<div class="page-card" data-page="p${p.pnum}">
  <div class="page-head"><span class="pnum">P${p.pnum}</span><b>${esc(p.ptitle)}</b> ${beatTag} <button class="copy-btn">🎨 이미지 프롬프트 복사</button></div>
  <p class="ko">${p.body}</p>
  <details class="scene-d"><summary>SCENE 프롬프트 보기</summary><pre class="scene">${p.scene}</pre></details>
</div>`;
    })
    .join('\n\n');

  const castJs = castArr
    .map((c) => `    { token: '${c.name}', name: '${c.name}', desc: ${JSON.stringify(c.desc)}, aliases: ${JSON.stringify(c.aliases)} }`)
    .join(',\n');

  return `<!doctype html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="robots" content="noindex" />
<title>한글 나무 — ${esc(heroTitle)}</title>
<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css');
  :root{
    --leaf:#3f8f52; --leaf-dark:#2f6b3d; --leaf-50:#eaf5ec; --apple:#e0533b;
    --cream:#fbf7ef; --paper:#ffffff; --ink:#2c2015; --ink-soft:#6b5b4a; --line:#e6dccb; --mint:#3f8f52; --gold:#e8a53c;
  }
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'Pretendard Variable',Pretendard,-apple-system,sans-serif;background:var(--cream);color:var(--ink);line-height:1.75;}
  .wrap{max-width:900px;margin:0 auto;padding:24px 24px 120px;}
  header.hero{text-align:center;padding:34px 0;border-bottom:3px solid var(--leaf);margin-bottom:24px;}
  .hero .kicker{color:var(--apple);font-weight:800;letter-spacing:.14em;font-size:12px;}
  .hero h1{font-size:40px;font-weight:900;margin:10px 0 6px;}
  .hero .glyph{display:inline-block;background:#f6d9d2;color:var(--apple);border-radius:14px;padding:2px 14px;margin-right:8px;}
  .hero .sub{color:var(--ink-soft);font-size:15px;font-weight:600;word-break:keep-all;}
  .meta-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:16px 20px;margin-bottom:14px;font-size:13.5px;word-break:keep-all;}
  .meta-card b{color:var(--leaf-dark);}
  .note{font-size:13px;color:var(--ink-soft);background:var(--leaf-50);border-radius:10px;padding:10px 14px;margin:18px 0;}
  .page-card{background:var(--paper);border:1px solid var(--line);border-radius:16px;padding:18px 22px;margin:16px 0;}
  .page-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:8px;}
  .page-head b{font-size:16px;}
  .page-head .pnum{flex:0 0 auto;width:34px;height:34px;border-radius:10px;background:var(--leaf);color:#fff;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:13px;}
  .tag{display:inline-block;background:var(--leaf-50);color:var(--leaf-dark);border-radius:999px;padding:2px 10px;font-size:12px;font-weight:800;}
  .tag.beat{background:#fdeee9;color:var(--apple);}
  .ko{font-size:15.5px;margin:8px 0 4px;word-break:keep-all;}
  .copy-btn{background:var(--paper);color:var(--mint);border:1.5px solid var(--mint);border-radius:999px;padding:4px 14px;font-weight:800;font-size:12.5px;cursor:pointer;}
  .page-head .copy-btn{margin-left:auto;}
  .copy-btn:hover,.copy-btn.done{background:var(--mint);color:#fff;}
  details.scene-d{margin-top:8px;}
  details.scene-d summary{cursor:pointer;font-size:13px;font-weight:700;color:var(--ink-soft);}
  pre.scene{white-space:pre-wrap;background:var(--cream);border:1px solid var(--line);border-radius:10px;padding:12px 14px;font-family:inherit;font-size:12.5px;line-height:1.65;margin-top:6px;color:var(--ink-soft);}
  .paste-box{position:relative;border:2px dashed var(--line);border-radius:10px;min-height:68px;display:flex;align-items:center;justify-content:center;text-align:center;font-size:12px;color:var(--ink-soft);font-weight:700;cursor:pointer;outline:none;padding:8px;background:#fff;margin-top:10px;}
  .paste-del{position:absolute;top:6px;right:6px;width:24px;height:24px;border-radius:50%;border:none;background:rgba(42,38,32,.6);color:#fff;font-size:12px;font-weight:800;cursor:pointer;line-height:1;}
  .paste-del:hover{background:var(--apple);}
  .paste-box:focus{border-color:var(--leaf);color:var(--leaf-dark);}
  .paste-box.has-img{padding:0;min-height:0;border-style:solid;border-color:var(--mint);}
  .paste-box img{width:100%;border-radius:8px;display:block;}
  .paste-box.busy{opacity:.5;}
  footer{margin-top:70px;text-align:center;color:var(--ink-soft);font-size:12px;}
  @media print{body{background:#fff}.wrap{max-width:none;padding:0}}
</style>
</head>
<body>
<div class="wrap">

<header class="hero">
  <div class="kicker">TANGOBOOK · 한글 파닉스 · ${esc(u.lvl)} · #${u.num}</div>
  <h1><span class="glyph">${esc(u.glyph)}</span>${esc(heroTitle)}</h1>
  <div class="sub">${esc(u.concept)}</div>
</header>

<div class="meta-card">
  <b>오늘의 글자</b> ${esc(u.glyph)} &nbsp;·&nbsp;
  <b>타겟 단어</b> ${esc(wordsStr)} &nbsp;·&nbsp;
  <b>등장</b> ${esc(castNames)} &nbsp;·&nbsp;
  <b>분량</b> 8쪽 &nbsp;·&nbsp; <b>그림체</b> 니들펠트
</div>
<div class="note">🌳 각 쪽 <b>🎨 버튼</b> = 니들펠트 스타일 + 등장 캐릭터 레퍼런스(@image1~) + 그 쪽 장면을 한 번에 복사. 위쪽에 생기는 <b>전체 프롬프트</b> 버튼은 8쪽을 한 번에. 생성한 컷은 쪽마다 붙여넣기 박스에 보관합니다(R2: <code>comic-assets/hangeul-tree-${u.id}</code>). 캐릭터 레퍼런스 시트는 <a href="/hangeul-tree-plan.html" style="color:var(--apple);font-weight:800">📘 기획서</a>에 보관된 니들펠트 캐스트를 재사용하세요.</div>

<!-- ============================================================ -->
${pageCards}

<footer>한글 나무 · 호리네 파닉스 동화 · ${esc(u.title)} · 대본 v1.0 · 내부 저작용</footer>
</div>

<script>
// ── 회차 데이터 (hangeul-tree-core.js 가 읽어 전체/쪽별 프롬프트·붙여넣기를 자동 생성) ──
window.HT_EPISODE = {
  cast: [
${castJs}
  ]
};
</script>
<script src="/hangeul-tree-core.js"></script>
</body>
</html>
`;
}

// ── 생성 ──
const index = [{ file: 'hangeul-tree-plan.html', label: '📘 기획서' }];
for (const u of UNITS) {
  const md = readFileSync(join(MD_DIR, u.id + '.md'), 'utf8');
  const pages = parseMarkdown(md);
  if (pages.length !== 8) console.warn(`⚠️  ${u.id}: ${pages.length}쪽 (예상 8)`);
  const html = episodeHtml(u, pages);
  const file = `hangeul-tree-${u.id}.html`;
  writeFileSync(join(OUT_DIR, file), html, 'utf8');
  index.push({ file, label: `${u.num} ${u.emoji} ${u.title}`, title: `${u.title} — ${u.words.length ? u.words.join('·') : '모음 열 개'}` });
  console.log(`✓ ${file}  (${pages.length}쪽)`);
}
writeFileSync(join(OUT_DIR, 'hangeul-tree-index.json'), JSON.stringify(index, null, 2), 'utf8');
console.log(`\n✅ ${UNITS.length}개 회차 + hangeul-tree-index.json 생성 완료`);
