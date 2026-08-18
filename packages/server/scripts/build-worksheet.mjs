/**
 * 한글 워크지 생성기 — 한 단원 3쪽, A4 인쇄용 자립형 HTML.
 *
 * 사용:
 *   node scripts/build-worksheet.mjs                 # 한글1 자음 14단원 전부
 *   node scripts/build-worksheet.mjs --unit=kr-h1-u02
 *   node scripts/build-worksheet.mjs --out=../client/public/worksheet
 *
 * 구성 = 1쪽 글자 / 2쪽 음절 / 3쪽 낱말. 찬찬한글 익힘책(대전교육청) 8쪽 구조를 추린 것이다.
 *
 * 🔴 찬찬한글에서 **안 가져온** 것과 이유 — 다시 넣고 싶어지면 여기부터 읽을 것.
 *  - **글자 찾아 동그라미**: 방해꾼이 아직 안 배운 글자다. 찬찬한글은 ㄱㅋㄲ 를 한 단원에서
 *    같이 가르쳐 변별이 과제로 성립하지만, 우리 단원은 자음 하나뿐이다.
 *  - **읽기 연습**(아아가가 어어거거): 찬찬한글은 그 시점에 모음 10개를 다 뗀 상태다.
 *  - **무의미단어 읽기**: 통글자로 외웠는지 가려내는 진단 장치다 — 초등 기초학력 미달 아동용이고
 *    우리는 4~5세 첫 한글이다.
 *  - **횟수 ①②③④⑤**: 같은 쪽을 다섯 번 **읽는** 표시다. 읽기 반복 활동을 다 뺐고 쓰기는
 *    한 번 쓰면 칸이 차서 다시 못 한다.
 *  - **그림 보고 낱말 쓰기**: 3쪽 위에 그림+낱말이 이미 붙어 있어 **같은 쪽에 답이 보인다**.
 *
 * 🔴 삽화는 컬러 원본을 그대로 쓴다. 선화로 바꿔 봤지만(→ card-outline.mjs) 니들펠트 질감이
 *    회색 낙서가 돼 우리 유일한 시각 자산을 깎아먹었다.
 * 🔴 모음은 커리큘럼 순서 10개 전부(가 갸 거 겨 …). 종이가 앱보다 적게 가르치면 아이가
 *    앱에서 못 본 글자를 만난다.
 * 🔴 인쇄물이라 쪽수를 아끼지 않는다 — 칸을 크게, 여백을 넉넉히. 단 같은 획을 수십 번
 *    긋게 하지 않는다(54칸 → 21칸으로 되돌린 적 있음).
 */
import { writeFile, mkdir, readFile } from 'node:fs/promises';
import sharp from 'sharp';
import {
  KOREAN_PHONICS_CURRICULUM,
  ENGLISH_PHONICS_CURRICULUM,
  decomposeHangul,
  composeHangul,
} from '@tangobook/shared';

const API = 'https://www.tangobook.co.kr/api/storybooks';
/** 모음 순서 — 커리큘럼 blending 과 같다. */
const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'];

/**
 * 자음 이름과 입 모양. 🔴 소릿값은 자음+ㅡ 로 파생하지만 **ㅇ 은 예외**다 —
 * 초성 ㅇ 은 소리가 없다. [으] 라고 적으면 거짓말이 된다.
 */
const CONSONANTS = {
  ㄱ: { name: '기역', mouth: '혀 뒷부분이 목구멍을 막았다가 터지는 소리예요' },
  ㄴ: { name: '니은', mouth: '혀끝을 윗니 뒤에 붙이고 코로 소리를 내요' },
  ㄷ: { name: '디귿', mouth: '혀끝이 윗니 뒤를 막았다가 터지는 소리예요' },
  ㄹ: { name: '리을', mouth: '혀끝이 입천장을 살짝 스치며 굴러가요' },
  ㅁ: { name: '미음', mouth: '두 입술을 붙이고 코로 소리를 내요' },
  ㅂ: { name: '비읍', mouth: '두 입술을 붙였다가 터뜨리는 소리예요' },
  ㅅ: { name: '시옷', mouth: '혀끝과 윗니 사이로 바람이 새어 나와요' },
  // ⚠️ 「소릿값」이 이미 「소리가 없어요」라고 하므로 입 모양에서 같은 말을 되풀이하지 않는다.
  //    받침 자리 이야기를 적어 두면 나중에 한글2(받침)에서 다시 만난다.
  ㅇ: { name: '이응', sound: null, mouth: '받침으로 쓰일 때만 코로 「응」 소리가 나요' },
  ㅈ: { name: '지읒', mouth: '혀 앞부분을 입천장에 붙였다가 살짝 터뜨려요' },
  ㅊ: { name: '치읓', mouth: 'ㅈ 과 같은 자리인데 바람이 더 세게 나와요' },
  ㅋ: { name: '키읔', mouth: 'ㄱ 과 같은 자리인데 바람이 더 세게 나와요' },
  ㅌ: { name: '티읕', mouth: 'ㄷ 과 같은 자리인데 바람이 더 세게 나와요' },
  ㅍ: { name: '피읖', mouth: 'ㅂ 과 같은 자리인데 바람이 더 세게 나와요' },
  ㅎ: { name: '히읗', mouth: '목구멍에서 바람만 나오는 소리예요' },
  // 한글3 쌍자음 — 자음 단원과 같은 틀(blending 3원소)이라 표만 늘리면 된다.
  // 홑자음과 **같은 자리·같은 입 모양**이고 힘만 다르다는 게 이 단원의 요지다.
  ㄲ: { name: '쌍기역', mouth: 'ㄱ 과 같은 자리인데 목에 힘을 꽉 주고 짧게 터뜨려요' },
  ㄸ: { name: '쌍디귿', mouth: 'ㄷ 과 같은 자리인데 혀끝에 힘을 꽉 주고 터뜨려요' },
  ㅃ: { name: '쌍비읍', mouth: 'ㅂ 과 같은 자리인데 두 입술에 힘을 꽉 주고 터뜨려요' },
  ㅆ: { name: '쌍시옷', mouth: 'ㅅ 과 같은 자리인데 바람을 더 세게 밀어내요' },
  ㅉ: { name: '쌍지읒', mouth: 'ㅈ 과 같은 자리인데 힘을 꽉 주고 터뜨려요' },
};

/**
 * 받침 단원(한글2). 🔴 받침은 **같은 글자라도 첫소리와 자리·소리가 다르다** — 그래서
 * CONSONANTS 를 그냥 재사용하지 않고 따로 적는다.
 * `example` 은 그 받침이 붙은 소리를 아이가 흉내 낼 수 있게 보여 주는 음절이다.
 *
 * ⚠️ 받침 ㅅ 은 실제로 [앋] 으로 소리 난다(ㄷ 받침과 같음). 한글2 에 ㄷ 받침 단원이 없어
 *    비교 대상이 없으므로, 4~5세에게는 「소리를 뚝 멈춘다」까지만 말한다 — 틀린 말은 아니다.
 */
const CODAS = {
  ㅇ: { example: '앙', mouth: '입은 열어 둔 채로 코로 소리를 내보내요' },
  ㄱ: { example: '악', mouth: '혀 뒷부분으로 목을 막고 소리를 뚝 멈춰요' },
  ㄴ: { example: '안', mouth: '혀끝을 윗니 뒤에 붙이고 코로 소리를 내요' },
  ㄹ: { example: '알', mouth: '혀끝을 입천장에 대고 소리를 굴려요' },
  ㅅ: { example: '앗', mouth: '혀끝으로 막고 소리를 뚝 멈춰요' },
  ㅁ: { example: '암', mouth: '두 입술을 붙이고 코로 소리를 내요' },
  ㅂ: { example: '압', mouth: '두 입술을 붙이고 소리를 뚝 멈춰요' },
};

/**
 * 🔴 모음은 **두 소리가 합쳐진 것**으로 가르친다 — 찬찬한글이 그렇게 한다.
 *    「ㅜ ~ ㅣ 를 점점 빠르게 반복해서 합치면 ㅟ 가 된다」. 모양을 외우는 게 아니라
 *    아는 소리 둘을 이어 붙이는 것이라, 아이가 스스로 만들어 낼 수 있다.
 */
const VOWEL_PARTS = {
  ㅑ: ['ㅣ', 'ㅏ'], ㅕ: ['ㅣ', 'ㅓ'], ㅛ: ['ㅣ', 'ㅗ'], ㅠ: ['ㅣ', 'ㅜ'],
  ㅖ: ['ㅣ', 'ㅔ'], ㅒ: ['ㅣ', 'ㅐ'],
  ㅘ: ['ㅗ', 'ㅏ'], ㅙ: ['ㅗ', 'ㅐ'],
  ㅝ: ['ㅜ', 'ㅓ'], ㅞ: ['ㅜ', 'ㅔ'], ㅟ: ['ㅜ', 'ㅣ'], ㅢ: ['ㅡ', 'ㅣ'],
  // 🔴 ㅐ·ㅔ·ㅚ 는 **일부러 비워 둔다.**
  //  - ㅐ·ㅔ 는 현대 한국어에서 단모음이다. 글자 모양이 ㅏ+ㅣ, ㅓ+ㅣ 라고 해서 「아~이를 빠르게」로
  //    가르치면 소리가 틀린다. 찬찬한글도 합성을 주지 않고 「ㅣ→ㅔ→ㅐ 순서로 입이 점점 크게」로만.
  //  - ㅚ 는 찬찬한글이 「그냥 익히도록 하고, ㅞ·ㅙ·ㅚ 모두 소리는 같게 해도 된다」고 못 박는다.
  // ⚠️ ㅖ·ㅒ 도 처음엔 모양대로 ㅕ+ㅣ, ㅑ+ㅣ 로 적었다가 고쳤다 — 소리는 ㅣ+ㅔ, ㅣ+ㅐ 다.
};

/**
 * 합성으로 못 가르치는 모음에 붙일 설명 — 찬찬한글 문구를 그대로 옮겼다.
 * 소리가 비슷해서 헷갈리는 짝이라, 「무엇과 무엇이 어떻게 다른가」로만 잡을 수 있다.
 */
const VOWEL_NOTES = {
  ㅐ: 'ㅣ → ㅔ → ㅐ 차례로 소리 내면 입이 점점 크게 벌어져요',
  ㅔ: 'ㅣ → ㅔ → ㅐ 차례로 소리 내면 입이 점점 크게 벌어져요',
  ㅚ: 'ㅞ · ㅙ · ㅚ 는 소리가 거의 같아요 — 모양으로 구별해요',
};

/**
 * 복잡모음 단원에서 음절을 만들 자음 — **자음 14개 전부**를 찬찬한글처럼 7+7 두 표로 놓는다.
 *
 * ⚠️ 처음엔 앞의 다섯(ㄱㄴㄷㄹㅁ)만 썼는데, 그건 「한 쪽에 10줄」이라는 **레이아웃 사정**이지
 *    교육적 근거가 아니었다. 그 모음이 **모든 자음과 붙는다**는 걸 보이는 게 이 표의 일이다.
 * ⚠️ ㄱ+ㅢ = 「긔」처럼 낯선 음절이 나오는데 **그대로 둔다** — 찬찬한글도 긔·늬·믜를 그대로
 *    싣는다. 뜻이 아니라 **조합 규칙**을 익히는 자리라서다.
 */
const BLEND_CONSONANTS = [
  ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ'],
  ['ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'],
];

/**
 * 단원 종류는 **커리큘럼 데이터에서 판별**한다 — 단원 id 목록을 손으로 적으면 갈라진다.
 *  - blending 이 4원소[초성,중성,받침,결과] → 받침 단원
 *  - blending 이 없음 → 모음 단원(한글1 u01 · 한글4)
 *  - 그 밖 3원소[자음,모음,결과] → 자음/쌍자음 단원
 */
function unitKind(u) {
  const b = u.blending;
  if (b.length && b[0].length === 4) return 'coda';
  if (!b.length) return 'vowel';
  return 'consonant';
}

/**
 * 🔴 동화책 연결에서 뺄 낱말 — **사물이 아닌 말**.
 *
 * 「나」가 나오는 책을 찾아 읽어 줘도 아이가 이야기 속에서 「나」를 다시 만나는 일이 안 생긴다.
 * 대명사·부사는 어느 쪽에나 있어서 가리키는 힘이 없다.
 *
 * ⚠️ 처음엔 「등장 권수가 상한(12)에 걸리면 흔한 말」이라는 통계적 대용치로 걸렀는데,
 *    그러면 오리·지구·모자처럼 **쓸 만한 연결까지 같이 잘려** 40→24로 떨어졌다.
 *    흔한 것과 가리킬 수 없는 것은 다른 문제다 — 목록이 짧으니 이유로 적는다.
 */
const NOT_OBJECT = new Set(['나', '너', '누구야', '모두']);

const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
const syllableOf = (cho, jung) => composeHangul(cho, jung, null);
const box = (ch = '', cls = '') => `<div class="sq ${cls}"><span class="ghost">${esc(ch)}</span></div>`;

/**
 * 따라쓰기 한 줄. 🔴 낱말 길이가 1~3자로 제각각이라 세트 수를 맞춰야 한다 —
 * 3글자에 3세트(9칸)를 주면 가로로 넘치고, 1글자에 3세트(3칸)면 줄이 텅 빈다.
 */
const traceRow = (word, label = null, en = false, tw = 13) => {
  const n = [...word].length;
  // 🔴 칸을 키우면 가로가 먼저 찬다 — 반복 횟수는 **폭에서 거꾸로** 센다(본문 178mm, 라벨 22mm).
  const sets = en
    ? Math.max(1, Math.min(4, Math.floor((178 - 22) / ((tw + 3) * n))))
    : Math.max(2, Math.round(6 / n));
  const cells = Array.from({ length: sets }, (_, s) => [...word].map((c) => box(s === 0 ? c : '')).join('')).join('');
  return `<div class="traceline${en ? ' en' : ''}"><span class="lbl">${esc(label ?? word)}</span>${cells}</div>`;
};

/** 따라쓰기 묶음 — 줄 수에 맞춰 칸을 키운다. 15mm 고정이면 8줄짜리 쪽이 아래 40% 를 비운다. */
function traceBlock(items, room, en) {
  if (!en) return items.map(([w, l]) => traceRow(w, l)).join('');
  const tw = Math.max(13, Math.min(22, Math.floor(room / items.length / 1.15 - 1.5)));
  return `<div style="--tw:${tw}mm">${items.map(([w, l]) => traceRow(w, l, true, tw)).join('')}</div>`;
}

/**
 * 카드 이미지 → data URI. 36mm 를 300dpi 로 찍으면 ~425px 면 충분하다.
 * ⚠️ 영어는 단원당 카드가 8~12장(한글은 4장)이라 같은 화질로 구우면 고르기 화면이 10MB 가 된다.
 *    인쇄 크기가 48mm 언저리라 360px = 190dpi — 잉크젯 학습지엔 넉넉하다.
 */
async function pic(url, px = 440) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const out = await sharp(buf).resize(px, px, { fit: 'inside' }).webp({ quality: px < 400 ? 78 : 82 }).toBuffer();
  return `data:image/webp;base64,${out.toString('base64')}`;
}

const titleCache = new Map();
async function bookTitle(id) {
  if (!titleCache.has(id)) {
    try {
      const r = await (await fetch(`${API}/${id}`)).json();
      titleCache.set(id, r?.data?.title?.replace(/^\d+\.\s*/, '') ?? null);
    } catch {
      titleCache.set(id, null);
    }
  }
  return titleCache.get(id);
}

const STYLE = `<style>
  @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css');
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; margin: 0; }
  /* 🔴 색을 인쇄에 실으려면 이게 있어야 한다 — 없으면 브라우저가 배경색을 통째로 뺀다. */
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* 색은 앱 디자인 시스템(design-system/tokens/colors.ts)에서 그대로.
     종이라 큰 면적은 연한 톤(50~100)만 쓰고 진한 톤은 선·글자에만 — 잉크를 아낀다. */
  :root {
    --cream: #FFF9F3; --peach-50: #FFF8EF; --peach-200: #FFDDBF;
    --coral: #FF5E3A; --coral-200: #FFBFA8; --coral-700: #C43A1C;
    --mint-50: #EFFAF5; --mint-200: #B6E5D8; --mint-600: #2A8761;
    --fun: #A78BFA; --ink: #0B0805; --ink-500: #9A8474; --ink-600: #6D5A4C;
  }
  body { font-family: Pretendard, 'Malgun Gothic', sans-serif; color: var(--ink); }

  /* 전체 가운데 정렬 — 왼쪽에 몰리면 오른쪽이 빈 종이로 보인다. */
  .page { width: 186mm; height: 273mm; display: flex; flex-direction: column; gap: 5mm;
    break-after: page; text-align: center; background: var(--cream); }
  .page:last-child { break-after: auto; }
  /* 1쪽처럼 내용이 적은 장은 칸을 더 넣지 말고 **사이를 벌려** 채운다. */
  .page.airy { justify-content: space-between; gap: 0; }
  @media screen {
    body { background: #e6e0da; padding: 10px 0; }
    .page { padding: 12mm; width: 210mm; height: 297mm; margin: 10px auto; box-shadow: 0 1px 6px #0003; }
  }

  /* ⚠️ 제목이 12.5pt 일 땐 본문 쓰기칸 글자보다 작아 위계가 뒤집혀 보였다. */
  h2 { font-size: 17pt; letter-spacing: -.03em; display: flex; align-items: center; gap: 2.5mm; justify-content: center; }
  h2::before { content: attr(data-n); background: var(--coral); color: #fff; border-radius: 50%;
    width: 9mm; height: 9mm; font-size: 12pt; font-weight: 800; display: inline-grid; place-items: center; flex: none; }
  section:nth-of-type(2) h2::before { background: var(--mint-600); }
  section:nth-of-type(3) h2::before { background: var(--fun); }
  .hint { font-size: 10.5pt; color: var(--ink-600); font-weight: 400; letter-spacing: -.02em; }
  section { display: flex; flex-direction: column; gap: 3mm; }

  header { display: flex; align-items: flex-end; justify-content: space-between;
    border-bottom: 1.2mm solid var(--coral); padding-bottom: 2.5mm; }
  .ttl { font-size: 18pt; font-weight: 800; letter-spacing: -.03em; }
  .ttl em { font-style: normal; color: var(--coral); }
  .ttl small { font-size: 10pt; font-weight: 600; color: var(--ink-600); margin-left: 2mm; }
  .meta { display: flex; gap: 4mm; align-items: center; font-size: 9pt; color: var(--ink-600); }
  .fill { display: inline-block; border-bottom: .3mm solid var(--peach-200); width: 24mm; }
  .runhead { display: flex; justify-content: space-between; align-items: baseline;
    border-bottom: .35mm solid var(--peach-200); padding-bottom: 1.5mm; font-size: 9pt; color: var(--ink-500); }
  .runhead b { color: var(--coral-700); font-size: 10.5pt; }

  .sq { width: 16mm; height: 16mm; border: .4mm solid var(--peach-200); border-radius: 1.6mm; position: relative;
    display: grid; place-items: center; flex: none; background: #fff; }
  /* 🔴 조합 칸은 **그 쪽의 줄 수에 맞춰 커진다.** 14줄을 두 쪽에 반씩 나누면 7줄뿐이라
     16mm 고정이면 47% 가 빈다 — 남는 세로를 칸에 돌려주면 아이가 더 크게 쓴다. */
  .syls { --lg: 16mm; --lgf: 24pt; }
  .sq.lg { width: var(--lg); height: var(--lg); }
  /* 큰 칸은 「많이」가 아니라 「크게·천천히」 연습용. ⚠️ 56pt 면 칸의 35%뿐이라 구석에 붙어 보인다. */
  .sq.xl { width: 57mm; height: 57mm; border: .6mm solid var(--coral-200); }
  .sq::before, .sq::after { content: ''; position: absolute;
    background: repeating-linear-gradient(to right, var(--peach-200) 0 1.1mm, transparent 1.1mm 2.2mm); }
  .sq::before { left: 6%; right: 6%; height: .25mm; top: 50%; }
  .sq::after { top: 6%; bottom: 6%; width: .25mm; left: 50%;
    background: repeating-linear-gradient(to bottom, var(--peach-200) 0 1.1mm, transparent 1.1mm 2.2mm); }
  /* 따라 쓸 연한 글자 — 회색 대신 복숭아색이라 덧그릴 것이 한눈에 구분된다. */
  .ghost { font-size: 21pt; line-height: 1; font-weight: 700; color: var(--peach-200); position: relative; transform: translateY(.4mm); }
  .sq.lg .ghost { font-size: var(--lgf); }
  /* 🔴 105pt 는 **한글 한 글자** 기준이다. 영어 패턴은 2~4자라 그대로 두면 -ime 가 칸을
     239px 로 넘는다(칸 215px, 실측). 글자 수를 아는 쪽에서 --xlf 로 낮춰 준다. */
  .sq.xl .ghost { font-size: var(--xlf, 105pt); }
  /* 🔴 자음 자모만 키운다. 폰트가 자음을 em 위쪽에만 그려서, 같은 105pt 인데도 칸을 채우는
     비율이 자음 31% · 모음/음절 57% 로 두 배 가까이 벌어진다(실측).
     ⚠️ 160pt 가 상한 — 180pt 부터는 글자가 칸보다 커져 위로 5.6% 밀린다(실측). */
  /* 모음 10개처럼 여러 글자를 한 번씩 크게 쓸 때 — 57mm 로는 한 줄에 셋뿐이라 자의적으로 잘린다. */
  /* 🔴 33mm 고정이면 6칸부터 한 줄에 5개만 들어가 마지막 하나가 혼자 다음 줄로 떨어진다.
     칸 수를 알고 있으니 폭을 거기서 정한다(--md). */
  .sq.md { width: var(--md, 33mm); height: var(--md, 33mm); border: .5mm solid var(--coral-200); }
  /* ⚠️ 배율은 mm 기준(0.64) — pt 로 착각해 1.8 을 쓰면 글자가 칸의 두 배가 돼 넘쳐 흐른다. */
  .sq.md .ghost { font-size: var(--mdf, calc(var(--md, 33mm) * 0.64)); }
  .sq.xl.big .ghost { font-size: 160pt; }
  .sq.big .ghost { font-size: 32pt; }
  /* ── 영어 워크지 프리미티브 ────────────────────────────────────────────────
     🔴 한글은 네모 칸에 한 글자지만 **영어 낱말은 옆으로 눕는다** — 정사각 칸에 넣으면
        cliff·window 가 칸을 넘어 접힌다. 그래서 낱말 칸은 가로로 길게 잡는다.
     🔴 보조선도 다르다. 한글은 십자(획이 사방으로 뻗는다)지만 영어는 **밑줄 + 가운뎃줄**
        (4선지 관습) — 소문자 높이를 그 줄로 잡는다. 십자를 그대로 두면 낱말 한가운데
        세로줄이 지나가 글자를 가른다. */
  .sq.wd { width: calc(var(--lg) * 2.3); height: var(--lg); }
  .sq.en::after { display: none; }
  .sq.en::before { top: 68%; left: 5%; right: 5%; }
  .sq.wd::after { display: none; }
  .sq.wd::before { top: 68%; left: 5%; right: 5%; }
  /* 가운뎃줄 — x-height 자리. ::before/::after 를 이미 썼으므로 배경으로 그린다. */
  .sq.wd, .sq.en { background-image: linear-gradient(var(--peach-200) 0 0); background-repeat: no-repeat;
    background-size: 90% .25mm; background-position: 5% 40%; }
  .sq.wd .ghost { font-size: calc(var(--lg) * 0.52); letter-spacing: -.01em; transform: translateY(-6%); }
  /* 영어 낱말은 8~12장이라 2열이면 카드가 세로로 넘친다 — 3열. */
  .meetgrid.many { grid-template-columns: repeat(var(--cols), 1fr); gap: 3mm; }
  .meetgrid.many .meet { padding: 2.5mm; gap: 1.5mm; }
  .meetgrid.many .meet img { width: var(--pic); height: var(--pic); }
  .meetgrid.many .meet b { font-size: 15pt; }
  /* 영어 따라쓰기 — 글자 칸은 한글보다 좁아도 된다(자모가 아니라 낱자다). */
  /* 🔴 기본값을 .traceline.en 에 두면 안 된다 — traceBlock 이 부모에 넣은 값을 **클래스 규칙이
     이겨서**(상속보다 규칙이 세다) 칸이 늘 13mm 로 굳는다(실측: 3줄짜리 쪽이 75% 비었다).
     ⚠️ 이 CSS 는 JS 템플릿 리터럴 안이다 — **주석에 백틱을 쓰면 문자열이 거기서 끊긴다**. */
  :root { --tw: 13mm; }
  .traceline.en .sq { width: var(--tw); height: calc(var(--tw) * 1.15); }
  .traceline.en .ghost { font-size: calc(var(--tw) * 0.62); }
  .traceline.en .lbl { width: 22mm; font-size: 10.5pt; }
  .formula.en { width: 26mm; font-size: 13pt; }
  /* 🔴 --lg 는 .syls 안에서만 정의돼 있었다 — 1쪽 낱말 칸 줄에서 calc() 가 무효가 되어
     칸이 통째로 찌그러졌다(없는 CSS 변수는 에러 없이 무시된다). 기본값을 뿌리에 둔다. */
  :root { --lg: 16mm; --lgf: 24pt; }
  .row.wide { --lg: 17mm; gap: 3mm; }
  .row { display: flex; gap: 2.5mm; flex-wrap: wrap; justify-content: center; }

  .learn { display: flex; align-items: center; justify-content: center; gap: 7mm;
    border: .5mm solid var(--coral-200); border-radius: 4mm; background: var(--peach-50); padding: 5mm 7mm; }
  .learn .glyph.sm { font-size: 26pt; line-height: 1.15; max-width: 52mm; }
  .learn .glyph { font-size: 58pt; font-weight: 800; line-height: 1; color: var(--coral); }
  .learn dl { display: grid; grid-template-columns: auto 1fr; gap: 1.8mm 4mm; font-size: 11pt; text-align: left; }
  .learn dt { color: var(--coral-700); font-weight: 700; }
  .learn dd { font-weight: 700; }

  .demo { display: flex; align-items: center; justify-content: center; gap: 3mm; font-size: 25pt; font-weight: 800;
    border: .5mm dashed var(--mint-200); border-radius: 4mm; padding: 3mm; background: var(--mint-50); flex-wrap: wrap; }
  .demo em { font-style: normal; color: var(--mint-600); font-size: 17pt; }
  .demo b { color: var(--mint-600); }
  .demo small { width: 100%; text-align: center; font-size: 9pt; font-weight: 400; color: var(--ink-600); margin-top: .8mm; }
  .syls { display: flex; flex-direction: column; gap: 2.4mm; }
  /* 복잡모음 음절표 — 자음 7개짜리 덩이 둘을 나란히(찬찬한글 배치). */
  .vrow { display: flex; justify-content: center; gap: 9mm; }
  .vcell { display: flex; align-items: center; gap: 2mm; }
  .srow { display: flex; align-items: center; gap: 2.5mm; justify-content: center; }
  .formula { width: 16mm; flex: none; font-size: 12pt; font-weight: 700; color: var(--mint-600); text-align: center; }
  .formula i { font-style: normal; color: var(--mint-200); margin: 0 .6mm; }

  /* 문항을 세로로 쌓으면 오른쪽이 통째로 빈다 — 한 줄에 나란히. */
  .qline { display: flex; justify-content: space-around; align-items: center; gap: 4mm; }
  .qrow { display: flex; align-items: center; gap: 2.5mm; font-size: 19pt; font-weight: 700; }
  .qrow .op { color: var(--fun); font-size: 15pt; }
  .blank { width: 16mm; height: 16mm; border: .4mm solid var(--fun); border-radius: 1.6mm; background: #fff; flex: none; }

  /* 낱말을 처음 보는 자리라 그림과 글자가 한 덩어리여야 한다. 2×2 — 4열은 카드가 너무 작았다. */
  .meetgrid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 4mm 5mm; }
  /* 🔴 그림 옆이 아니라 **아래**에 낱말. 옆에 두고 그림을 키웠더니 「고기」가 「고/기」로 접혔다.
     넘침 검사엔 안 걸린다(넘친 게 아니라 접힌 것) → nowrap 으로 막는다.
     ⚠️ 이 CSS 는 통째로 템플릿 리터럴 안이다 — 주석에 백틱을 쓰면 문자열이 거기서 끊긴다. */
  .meet { border: .5mm solid var(--peach-200); border-radius: 4mm; background: #fff; padding: 3.5mm;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1.5mm; }
  .meet img { width: 36mm; height: 36mm; object-fit: contain; flex: none; }
  .meet b { font-size: 26pt; letter-spacing: -.02em; white-space: nowrap; color: var(--coral-700); }

  .traceline { display: flex; align-items: center; justify-content: center; gap: 3mm; margin-bottom: 1.5mm; }
  .traceline .lbl { font-size: 11pt; color: var(--mint-600); width: 16mm; flex: none; font-weight: 700; }
  .traceline .sq { width: 18mm; height: 18mm; }
  .traceline .ghost { font-size: 24pt; }

  footer { margin-top: auto; border-top: .35mm dashed var(--peach-200); padding-top: 2.5mm;
    display: flex; justify-content: center; align-items: flex-end; gap: 5mm; font-size: 8.5pt; color: var(--ink-600); }
  .page.airy footer { margin-top: 0; }
  .link b { color: var(--coral-700); }
  /* 정답은 바로 위 문제의 답이라 그냥 두면 베낀다 — 퍼즐책 관습대로 거꾸로 찍는다. */
  .ans { flex: none; transform: rotate(180deg); font-size: 7.5pt; color: var(--ink-500); }
</style>`;

/**
 * 조합 표 한 덩이. 줄이 적은 쪽은 칸을 키워 남는 세로를 메운다.
 * 🔴 쓸 수 있는 높이가 쪽마다 다르다 — 한 값으로 계산했다가 두 번 넘쳤다(실측 139px).
 *    받침 1쪽은 이해하기 + 큰 칸이 이미 자리를 먹어 가장 좁고, 보기 상자가 있는 첫 조합 쪽이
 *    그다음, 이어지는 쪽이 가장 넓다. 넉넉히 잡지 말 것 — 넘치면 잘려서 사라진다.
 */
const ROOM = { page1: 110, firstCombo: 176, more: 205 };
function syllableBlock(rows, room = ROOM.more, wd = false) {
  // 🔴 낱말 칸은 상한이 낮다 — 20mm 를 넘으면 칸 폭(2.3배)이 커져 빈 칸이 3개 밑으로 떨어진다.
  const [lo, hi] = wd ? [14, 20] : [16, 26];
  const mm = Math.max(lo, Math.min(hi, Math.floor(room / rows.length - 2.4)));
  // 🔴 칸이 상한에 걸리면 남는 세로가 그대로 빈다(실측: 8줄짜리 낱말표가 26% 빔).
  //    칸을 더 키우면 가로가 먼저 차니, 남는 만큼 **줄 사이**로 흘려보낸다.
  //    room 은 어림값이라 3% 를 남겨 둔다 — 넘치면 잘려서 사라진다.
  const gap = Math.max(2.4, Math.min(9, (room * 0.97 - rows.length * mm) / Math.max(1, rows.length - 1)));
  const body = (wd ? rows.map((r) => fillWordRow(r, mm)) : rows).join('');
  return `<div class="syls" style="--lg:${mm}mm;--lgf:${Math.round(mm * 1.5)}pt;gap:${gap.toFixed(1)}mm">${body}</div>`;
}

/**
 * 조합 줄: [왼쪽 식] [연한 결과] [빈 칸 여러 개]
 * `wd` = 영어 낱말 칸(가로로 긴 칸). 🔴 빈 칸 수를 고정하면 안 된다 — 낱말 칸은 높이의 2.3배라
 * 칸이 커질수록 줄이 가로로 넘친다(A4 본문 폭 178mm). 폭에서 **거꾸로 세어** 정한다.
 */
const comboRow = (formula, result, wd = false) => {
  const cls = wd ? 'lg wd' : 'lg';
  return (
    `<div class="srow"><span class="formula${wd ? ' en' : ''}">${formula}</span>` +
    `${box(result, cls)}${wd ? BLANKS : Array.from({ length: 4 }, () => box('', cls)).join('')}</div>`
  );
};

/**
 * 낱말 칸 줄은 칸 크기가 정해진 뒤에야 빈 칸 수를 알 수 있어 자리만 잡아 두고 나중에 채운다.
 * 🔴 자리를 `</div>` 로 찾으면 안 된다 — 상자 자신의 닫는 태그가 먼저 걸려 빈 칸이 **상자 안에**
 *    들어간다(실측: 줄마다 칸이 겹쳐 접히고 조합 표가 통째로 어긋났다). 전용 표식을 쓴다.
 */
const BLANKS = '<!--blanks-->';
const fillWordRow = (row, lg) => {
  const per = 2.3 * lg + 2.5;
  const n = Math.max(2, Math.min(5, Math.floor((178 - 26) / per))) - 1;
  return row.replace(BLANKS, Array.from({ length: n }, () => box('', 'lg wd')).join(''));
};

/**
 * 단원 종류별 사양. 🔴 종류마다 HTML 을 통째로 복사하면 한쪽만 고쳐져 갈라진다 —
 * 다른 것은 여기서 값으로만 정하고 마크업은 renderPages 하나가 찍는다.
 */
function unitSpec(u, kind, words) {
  const label = (s) => `<b>${s}</b>`;
  if (kind === 'coda') {
    const coda = u.phonemes[0].replace('받침', '');
    const c = CODAS[coda];
    // blending = [초성,중성,받침,결과] × 14. 전부 쓴다 — 넘치면 쪽이 늘어난다.
    const rows = u.blending;
    // 🔴 받침 단원에서 **받침 글자를 홑으로 쓰게 하지 않는다.** ㅇ·ㄱ·ㄴ… 은 한글1 에서 이미
    //    쓴 글자이고, 이 단원의 새로운 것은 글자가 아니라 **자리(아래)와 소리(닫힘)** 다.
    //    찬찬한글도 처음부터 「가 나 다 라 마 바 사 + ㅁ → 감」처럼 **음절**로만 쓰게 한다.
    //    그래서 1쪽은 초성을 ㅇ 으로 고정해 모음별로(아+ㅇ=앙 …), 2쪽에서 초성을 바꾼다.
    const codaOf = (cho, jung) => composeHangul(cho, jung, coda);
    const page1Rows = ['ㅏ', 'ㅓ', 'ㅗ', 'ㅜ', 'ㅡ', 'ㅣ'].map((v) =>
      comboRow(`${syllableOf('ㅇ', v)}<i>+</i>${coda}`, codaOf('ㅇ', v))
    );
    return {
      glyph: coda,
      title: `받침 ${coda} 을 알아봐요`,
      sub: `받침 ${coda} · 소리 [${c.example}]`,
      dl: [['이름', `받침 ${coda}`], ['소리', `${c.example} 처럼 소리 나요`], ['입 모양', c.mouth]],
      xlGhosts: [c.example],
      page1Rows,
      page1Title: `받침을 붙여 써요 <span class="hint">글자 아래에 ${coda} 을 붙이면 소리가 닫혀요</span>`,
      writeHint: `쓸 때마다 “${c.example}” 하고 소리 내요`,
      demo: `${syllableOf(u.blending[0][0], u.blending[0][1])} <em>+</em> ${coda} <em>→</em> ${label(u.blending[0][3])}`,
      demoNote: `글자 아래에 ${coda} 을 붙이면 소리가 “${c.example}” 처럼 닫혀요`,
      rows: [{
        title: `받침 ${coda} 을 붙여 글자를 만들어요`,
        rows: rows.map(([cho, jung, jong, res]) => comboRow(`${syllableOf(cho, jung)}<i>+</i>${jong}`, res)),
      }],
      readAll: rows.map((b) => b[3]).join(' '),
      meetTitle: `받침 ${coda} 이 들어간 낱말이에요`,
    };
  }
  if (kind === 'vowel') {
    const vs = u.phonemes;
    const parts = (v) => VOWEL_PARTS[v];
    // 합성으로 설명되는 모음은 합성으로, 아닌 모음(ㅐ·ㅔ·ㅚ)은 제 설명으로.
    const sayHow = [
      ...vs.filter(parts).map((v) => `${parts(v)[0]} ~ ${parts(v)[1]} 을 빠르게 이어 붙이면 ${v}`),
      ...[...new Set(vs.filter((v) => VOWEL_NOTES[v]).map((v) => VOWEL_NOTES[v]))],
    ].join(' · ');
    // 🔴 기본모음 단원(한글1 u01)은 **아직 자음을 안 배웠다** — 자음×모음 표를 낼 수 없다.
    //    찬찬한글도 단순모음 단원에선 모음만 쓰게 하고, 자음과 합치는 건 자음 단원부터다.
    const basicOnly = vs.length > 3;
    const rows = basicOnly
      ? // 이중모음 줄은 「ㅣ+ㅏ」로 보여 준다 — 합성이 곧 이 단원의 내용이다.
        [{ title: '모음을 써요', rows: vs.map((v) =>
          parts(v)
            ? comboRow(`${parts(v)[0]}<i>+</i>${parts(v)[1]}`, v)
            : comboRow(`${v}<i>→</i>${syllableOf('ㅇ', v)}`, v)
        ) }]
      : // 복잡모음 단원 = 모음마다 **자음 14개 전부**(찬찬한글 「글자만들기」).
        // 🔴 **모음마다 따로 묶는다.** 한 줄로 이으면 쪽 가운데서 ㅐ→ㅔ 로 바뀌어
        //    한 장에 두 모음이 섞인다.
        vs.map((v) => ({
          title: `${v} 로 글자를 만들어요`,
          rows: BLEND_CONSONANTS.flat().map((c) => comboRow(`${c}<i>+</i>${v}`, syllableOf(c, v))),
        }));
    return {
      glyph: vs[0],
      title: `${vs.join(' · ')} 을 알아봐요`,
      sub: `모음 ${vs.length}개`,
      dl: [
        ['모음', vs.join('   ')],
        ['소리', vs.map((v) => syllableOf('ㅇ', v)).join('   ')],
        ['알아두기', sayHow || '모음은 혼자서도 소리가 나요 — 자음은 모음이 있어야 소리가 나요'],
      ],
      xlGhosts: vs, // 🔴 앞 3개만 자르면 10개 단원이 「ㅏㅑㅓ 단원」처럼 보인다
      xlCycle: true, // 모음은 칸마다 쓸 글자가 정해져야 한다(자음처럼 「같은 걸 여러 번」이 아니다)
      // 🔴 칸이 모음을 돌아가며 놓으므로 소리도 전부 적는다 — 첫 모음만 적으면 ㅐㅔ 줄에
      //    「애 하고 소리 내요」가 되어 절반이 거짓이 된다.
      writeHint: `쓸 때마다 “${vs.map((v) => syllableOf('ㅇ', v)).join(' · ')}” 하고 소리 내요`,
      demo: parts(vs[0])
        ? `${parts(vs[0])[0]} <em>+</em> ${parts(vs[0])[1]} <em>→</em> ${label(vs[0])}`
        : `${vs[0]} <em>→</em> ${label(syllableOf('ㅇ', vs[0]))}`,
      demoNote: parts(vs[0])
        ? `“${syllableOf('ㅇ', parts(vs[0])[0])} ~ ${syllableOf('ㅇ', parts(vs[0])[1])}” 를 점점 빠르게 이어 붙여 보세요`
        : '모음은 입을 크게 벌리고 길게 소리 내요',
      rows,
      readAll: basicOnly
        ? vs.map((v) => syllableOf('ㅇ', v)).join(' ')
        : BLEND_CONSONANTS.flat().map((c) => syllableOf(c, vs[0])).join(' '),
      // 🔴 단원 모음을 그대로 쓰면 제목이 거짓말을 한다 — h4-u02 는 ㅖ·ㅚ 단원인데 ㅚ 낱말 둘이
      //    그림이 없어 빠져서 화면엔 ㅖ 낱말만 남는다. **실제 나온 모음**만 말한다.
      meetTitle: `${vs.filter((v) => words.some((w) => [...w.word].some((ch) => decomposeHangul(ch)?.jung === v))).join(' · ') || vs.join(' · ')} 이 들어간 낱말이에요`,
    };
  }
  const letter = u.phonemes[0];
  const c = CONSONANTS[letter];
  const sound = c.sound === null ? null : syllableOf(letter, 'ㅡ');
  return {
    glyph: letter,
    title: `${letter} 을 알아봐요`,
    sub: `${c.name}${sound ? ` · 소릿값 [${sound}]` : ''}`,
    dl: [
      ['이름', c.name],
      ['소릿값', sound ? `[${sound}]` : '첫소리에서는 소리가 없어요'],
      ['입 모양', c.mouth],
    ],
    xlGhosts: [letter],
    xlBig: true, // 자음 자모는 칸을 덜 채운다 — 위 CSS 주석 참조
    writeHint: sound ? `쓸 때마다 “${sound}” 하고 소리 내요` : null,
    demo: `${letter} <em>+</em> ㅏ <em>→</em> ${label(syllableOf(letter, 'ㅏ'))}`,
    demoNote: sound
      ? `${letter}[${sound}] 은 짧고 약하게, 모음은 강하고 길게 — “${sound}~아, ${sound}아, ${syllableOf(letter, 'ㅏ')}”`
      : `${letter} 은 첫소리에서 소리가 없어요 — 모음 소리를 그대로 읽어요`,
    rows: [{
      title: `${letter} 로 글자를 만들어요`,
      rows: VOWELS.map((v) => comboRow(`${letter}<i>+</i>${v}`, syllableOf(letter, v))),
    }],
    readAll: VOWELS.map((v) => syllableOf(letter, v)).join(' '),
    meetTitle: `${letter} 이 들어간 낱말이에요`,
  };
}


/* ════════════ 영어 파닉스 워크지 ════════════
 * 뼈대는 한글과 같다 — 1쪽 글자 / 조합 쪽 / 마지막 쪽 낱말. 바뀌는 것은 셋뿐이다.
 *  ① 조합의 단위가 「자음×모음」이 아니라 **onset + 패턴**(c + an = can) 이다.
 *  ② 칸이 정사각이 아니라 **가로로 긴 낱말 칸**이다(위 `.sq.wd`).
 *  ③ Book 1 은 낱말을 쓰지 않는다 — **글자가 주인공**이라 apple 철자를 읽히지 않는다.
 *     (앱의 「듣고 고르기」가 Book 1 만 보기를 알파벳으로 두는 이유와 같다.)
 */

/** `-an` `_ib` `bl-` `ee` 가 섞여 있다 — 표시는 통일하고, 앞에 붙는 것인지 뒤에 붙는 것인지 구분한다. */
function readPattern(raw) {
  const onset = /-$/.test(raw); // `bl-` 처럼 뒤에 하이픈이면 **앞에 붙는 소리**
  return { text: raw.replace(/^[-_]+|[-_]+$/g, ''), onset, label: raw.replace(/_/g, '-') };
}

/**
 * 🔴 블록(패턴 묶음)을 **쪼개지 않고** 쪽에 고르게 나눈다.
 * 한글은 블록 하나가 14줄이라 블록 안에서 잘랐지만, 영어는 블록이 2~8줄이라 그러면
 * 「-an 4줄」만 있는 반쪽짜리 장이 나온다(실측 설계: 4줄이면 세로 60% 가 빈다).
 * 블록 수가 6 이하·쪽 수가 3 이하라 전수 탐색으로 **가장 큰 쪽이 가장 작아지는** 분할을 고른다.
 */
function packBlocks(blocks, cap) {
  const join = (ps) => ps.map((b) => b.title).join(' · ') + (blocks[0].suffix ?? '');
  const total = blocks.reduce((n, b) => n + b.rows.length, 0);
  const pages = Math.max(1, Math.ceil(total / cap));
  if (pages === 1) return [{ title: join(blocks), rows: blocks.flatMap((b) => b.rows) }];

  let best = null;
  const walk = (i, parts) => {
    if (parts.length === pages) {
      if (i !== blocks.length) return;
      const sizes = parts.map((p) => p.reduce((n, b) => n + b.rows.length, 0));
      const worst = Math.max(...sizes);
      if (!best || worst < best.worst) best = { worst, parts: parts.map((p) => [...p]) };
      return;
    }
    // 남은 쪽마다 블록이 최소 하나는 있어야 한다
    for (let j = i + 1; j <= blocks.length - (pages - parts.length - 1); j++) walk(j, [...parts, blocks.slice(i, j)]);
  };
  walk(0, []);
  return best.parts.map((p) => ({ title: join(p), rows: p.flatMap((b) => b.rows) }));
}

function enUnitSpec(u, lesson) {
  const families = lesson.wordFamilies ?? [];
  const book1 = u.bookId === 'book1';

  if (book1) {
    // wordFamilies[].blend = 'Aa' · words = 그 소리로 시작하는 낱말 3개
    const pairs = families.map((f) => String(f.blend ?? f.key));
    const keyword = (i) => families[i]?.words?.[0]?.word ?? '';
    return {
      glyph: pairs.join(' '),
      title: `${pairs.join(' · ')} 을 알아봐요`,
      sub: `알파벳 ${pairs.length}개`,
      dl: [
        ['글자', pairs.join('   ')],
        ['소리', pairs.map((p, i) => `${keyword(i)} 의 첫소리`).join(' · ')],
        ['알아두기', '대문자와 소문자는 짝이에요 — 모양은 달라도 소리는 같아요'],
      ],
      // 대·소문자를 따로 쓴다. 한 칸에 「Aa」를 넣으면 획을 익히는 게 아니라 모양을 베낀다.
      xlGhosts: pairs.flatMap((p) => [...p]),
      xlCycle: true,
      writeHint: `쓸 때마다 “${pairs.map((p, i) => keyword(i)).join(' · ')}” 의 첫소리를 내요`,
      demo: `${pairs[0][0]} <em>·</em> ${pairs[0][1]} <em>→</em> <b>${keyword(0)}</b>`,
      demoNote: '대문자를 먼저, 소문자를 그 아래에 — 같은 소리예요',
      rows: pairs.flatMap((pair) => [
        { title: pair, suffix: ' 를 써요', rows: [
          comboRow(`대문자 <i>${pair[0]}</i>`, pair[0]),
          comboRow(`소문자 <i>${pair[1]}</i>`, pair[1]),
        ] },
      ]),
      packCap: 8,
      readAll: pairs.join(' '),
      meetTitle: `${pairs.join(' · ')} 소리로 시작하는 낱말이에요`,
      // 🔴 Book 1 은 낱말을 통째로 쓰지 않는다 — **첫 글자만**.
      traceMode: 'initial',
      // 줄은 renderPages 가 낱말에서 만든다 — 글자마다 한 줄이면 3줄이라 쪽의 3/4 가 빈다.
    };
  }

  const pats = families.map((f) => readPattern(String(f.pattern ?? f.key ?? '')));
  const first = pats[0];
  const firstWord = families[0]?.words?.[0]?.word ?? '';
  const rowOf = (pat, w) =>
    comboRow(
      pat.onset
        ? `<i>${pat.text}</i> + ${w.word.slice(pat.text.length) || '…'}`
        : `${w.onset ?? w.word.replace(new RegExp(pat.text + '$'), '')} + <i>${pat.text}</i>`,
      w.word,
      true
    );
  return {
    glyph: pats.map((p) => p.label).join(' '),
    title: `${pats.map((p) => p.label).join(' · ')} 을 알아봐요`,
    sub: `${pats[0].onset ? '앞소리' : '소리 덩이'} ${pats.length}개`,
    dl: [
      ['패턴', pats.map((p) => p.label).join('   ')],
      ['소리', pats.map((p, i) => `${families[i]?.words?.[0]?.word ?? ''} 의 ${p.label}`).join('   ')],
      [
        '알아두기',
        first.onset
          ? '앞소리는 두 글자를 한 번에 이어서 소리 내요 — 사이에 쉬지 않아요'
          : '뒤가 같으면 앞 글자만 바꿔도 새 낱말이 돼요',
      ],
    ],
    xlGhosts: pats.map((p) => p.text),
    xlCycle: true,
    // 🔴 격자(4칸×3줄)로 돌리면 패턴이 5개 이상일 때 뒤의 것이 한 번도 안 나온다
    //    (-ink·-unk 가 통째로 빠졌다). 패턴마다 제 줄을 준다 — 칸마다 쓸 것이 정해진다.
    page1Rows: pats.map((p) => comboRow(p.label, p.text, true)),
    page1Title: `이제 작게 써요 <span class="hint">쓸 때마다 “${pats
      .map((p) => p.label)
      .join(' · ')}” 하고 소리 내요</span>`,
    writeHint: `쓸 때마다 “${pats.map((p) => p.label).join(' · ')}” 하고 소리 내요`,
    demo: first.onset
      ? `<b>${first.text}</b> <em>+</em> ${firstWord.slice(first.text.length)} <em>→</em> <b>${firstWord}</b>`
      : `${firstWord.slice(0, firstWord.length - first.text.length)} <em>+</em> <b>${first.text}</b> <em>→</em> <b>${firstWord}</b>`,
    demoNote: first.onset
      ? '앞소리를 먼저 붙여 읽고, 나머지를 이어 읽어요'
      : '앞 글자를 바꿔 가며 읽으면 낱말이 줄줄이 나와요',
    rows: pats.map((pat, i) => ({
      title: pat.label,
      suffix: ' 낱말을 만들어요',
      rows: (families[i].words ?? []).map((w) => rowOf(pat, w)),
    })),
    packCap: 12,
    wordy: true,
    readAll: (families[0].words ?? []).map((w) => w.word).join(' '),
    meetTitle: `${pats.map((p) => p.label).join(' · ')} 낱말이에요`,
  };
}

/** 한 단원의 3쪽 마크업. 스타일은 STYLE 로 분리해 합본에서 한 번만 싣는다. */
function renderPages({ head, spec, words }) {
  const UNIT = head.unitLabel ?? '익힘';
  const splitMeet = words.length > 6;
  // 🔴 8장을 3열에 두면 마지막 줄에 2장만 남아 아래가 통째로 빈다 — 장수로 열을 정하고,
  //    줄이 적으면 그림을 키워 세로를 메운다.
  // 🔴 4열이 「고르게 나뉘어」 좋아 보이지만 칸이 좁아져 카드가 작아지고, 두 줄로 끝나 아래가
  //    90mm 비었다. **3열 · 줄이 늘어나는 쪽**이 종이를 채운다 — 마지막 줄이 덜 차는 건 감수한다.
  const meetCols = words.length <= 4 ? 2 : 3;
  const meetRows = Math.ceil(words.length / meetCols);
  // 🔴 그림 크기는 세로만 보고 정하면 안 된다 — 4열에 40mm 를 넣으면 가로로 19px 넘쳐
  //    오른쪽 카드가 잘린다(실측). 열이 정한 칸 폭에서도 상한을 받는다.
  //  세로로 채우고 싶은 크기와, 열이 허락하는 폭 중 **작은 쪽**. 폭만 보면 오른쪽이 잘리고
  //  세로만 보면 아래가 빈다 — 둘 다 봐야 한다.
  const meetPic = Math.max(
    20,
    Math.min(Math.floor(195 / meetRows) - 17, Math.floor((178 - (meetCols - 1) * 3) / meetCols) - 7)
  );
  // 쓰기가 제 쪽을 가지면 세로를 다 쓴다. 카드와 한 쪽을 나눠 쓰면 남는 만큼만.
  const traceRoom = splitMeet ? 215 : 90;
  const writeSection = `<h2 data-n="6">${
    spec.traceMode === 'initial'
      ? '낱말의 첫 글자를 써요 <span class="hint">그림을 보고 소리를 낸 뒤, 그 소리의 글자를 써요</span>'
      : '따라 써요 <span class="hint">한 글자씩 또박또박, 다 쓰면 소리 내어 읽어요</span>'
  }</h2>${
    spec.traceMode === 'initial'
      ? traceBlock(words.map((w) => [w.word[0], w.word]), traceRoom, true)
      : traceBlock(words.map((w) => [w.word, null]), traceRoom, !!spec.wordy)
  }`;
  const linked = words.filter((w) => w.book);
  // 🔴 조합 표가 한 쪽을 넘으면 **쪽을 늘린다.** 쪽수를 아끼려고 자음·초성을 깎던 걸 되돌린 것이다.
  // 🔴 그리고 **고르게** 나눈다 — 앞쪽부터 10줄씩 채우고 나머지를 버리면 마지막 쪽이 텅 빈다
  //    (실측: 받침 14줄이 10+4 로 갈려 3쪽이 55% 비었고, 42줄짜리는 마지막이 2줄에 69% 비었다).
  const PER_PAGE = 10;
  const chunks = spec.packCap
    ? packBlocks(spec.rows, spec.packCap).map((c, i) => ({ ...c, cont: false }))
    : spec.rows.flatMap(({ title, rows }) => {
    const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
    const base = Math.floor(rows.length / pageCount);
    const extra = rows.length % pageCount; // 앞쪽 몇 장이 한 줄씩 더 갖는다
    const out = [];
    for (let i = 0, at = 0; i < pageCount; i++) {
      const n = base + (i < extra ? 1 : 0);
      out.push({ title, rows: rows.slice(at, at + n), cont: i > 0 });
      at += n;
    }
    return out;
  });
  const appLink = `<b>${head.levelName} · ${UNIT} ${head.unitNo}</b>`;

  return `
<!-- ─────────── 1쪽 · 글자 ─────────── -->
<div class="page airy">
  <header>
    <div class="ttl">${UNIT} ${head.unitNo}. <em>${spec.glyph}</em><small>${spec.sub}</small></div>
    <div class="meta"><span>이름 <i class="fill"></i></span><span>날짜 <i class="fill"></i></span></div>
  </header>

  <section>
    <h2 data-n="1">${spec.title}</h2>
    <div class="learn">
      <div class="glyph">${spec.glyph}</div>
      <dl>${spec.dl.map(([k, v], i) => `<dt>${k}</dt><dd${i === 2 ? ' style="font-weight:400"' : ''}>${v}</dd>`).join('')}</dl>
    </div>
  </section>

  <section>
    <h2 data-n="2">크게 써 봐요 <span class="hint">손 전체를 움직여 천천히</span></h2>
    <div class="row">${
      spec.xlGhosts.length > 3
        ? (() => {
            const md = Math.max(22, Math.min(33, Math.floor(178 / spec.xlGhosts.length) - 3));
            const len = Math.max(1, ...spec.xlGhosts.map((c) => [...String(c)].length));
            // 글자 수가 늘면 폭이 먼저 찬다 — 0.64 배는 한 글자짜리 기준이다.
            const mdf = Math.min(md * 0.64, (md * 0.86) / (0.57 * len));
            return `<div class="row" style="--md:${md}mm;--mdf:${mdf.toFixed(1)}mm">${spec.xlGhosts
              .map((c) => box(c, 'md' + (spec.en ? ' en' : '')))
              .join('')}</div>`;
          })()
        // 🔴 자음은 1칸 본보기 + 2칸 연습이지만, 모음 단원에서 3칸을 고집하면 마지막 칸이
        //    「ㅐ 를 쓰라는 건지 ㅔ 를 쓰라는 건지」 모를 빈칸이 된다 → 모음 수만큼만 놓는다.
        : `<div class="row" style="--xlf:${Math.min(
            105,
            Math.floor(255 / Math.max(1, ...spec.xlGhosts.map((c) => [...String(c)].length)))
          )}pt">${Array.from({ length: spec.xlCycle ? spec.xlGhosts.length : 3 }, (_, i) =>
            box(spec.xlGhosts[i] ?? '', 'xl' + (spec.xlBig ? ' big' : '') + (spec.en ? ' en' : ''))
          ).join('')}</div>`
    }</div>
  </section>

  <section>
    <h2 data-n="3">${spec.page1Title ?? `이제 작게 써요 ${spec.writeHint ? `<span class="hint">${spec.writeHint}</span>` : ''}`}</h2>
    ${
      spec.page1Rows
        ? syllableBlock(spec.page1Rows, ROOM.page1, spec.wordy)
        : Array.from(
            { length: 3 },
            (_, r) =>
              `<div class="row${spec.smallWide ? ' wide' : ''}">${Array.from({ length: spec.smallWide ? 4 : Math.max(9, spec.xlGhosts.length) }, (_, i) =>
                // 모음이 2~3개면 한 줄을 돌려 채운다 — 칸마다 무엇을 쓸지가 정해진다.
                box(
                  r === 0
                    ? spec.xlCycle
                      ? spec.xlGhosts[i % spec.xlGhosts.length]
                      : i < spec.xlGhosts.length && (spec.xlGhosts.length > 3 || i < 3)
                        ? spec.xlGhosts[i]
                        : ''
                    : '',
                  spec.smallWide ? 'lg wd' : spec.xlBig ? 'big' : ''
                )
              ).join('')}</div>`
          ).join('')
    }
  </section>

  <footer><div class="link">📖 소리가 궁금하면 앱에서 ${appLink} 를 열어 보세요.</div></footer>
</div>

<!-- ─────────── 2쪽 · 조합 ─────────── -->
<div class="page">
  <div class="runhead"><b>${UNIT} ${head.unitNo}. ${spec.glyph}</b><span>글자를 만들어요 · 2쪽</span></div>

  <section>
    <h2 data-n="4">${chunks[0].title}</h2>
    <div class="demo">${spec.demo}<small>${spec.demoNote}</small></div>
    ${syllableBlock(chunks[0].rows, ROOM.firstCombo, spec.wordy)}
  </section>


  <footer>
    <div class="link">✏️ 다 쓰면 <b>${spec.readAll}</b> 를 위에서 아래로 소리 내어 읽어요.</div>
  </footer>
</div>
${chunks
  .slice(1)
  .map(
    (c, i) => `
<!-- ─────────── 조합 이어지는 쪽 ─────────── -->
<div class="page">
  <div class="runhead"><b>${UNIT} ${head.unitNo}. ${spec.glyph}</b><span>글자를 만들어요 · ${i + 3}쪽</span></div>
  <section>
    <h2 data-n="4">${c.title}${c.cont ? ' <span class="hint">이어서 써요</span>' : ''}</h2>
    ${syllableBlock(c.rows, ROOM.more - 14, spec.wordy)}
  </section>
  <footer>
    <div class="link">✏️ 다 쓰면 <b>${spec.readAll}</b> 를 위에서 아래로 소리 내어 읽어요.</div>
  </footer>
</div>`
  )
  .join('')}

<!-- ─────────── 낱말 쪽 ─────────── -->
<div class="page">
  <div class="runhead"><b>${UNIT} ${head.unitNo}. ${spec.glyph}</b><span>낱말을 만나요 · ${chunks.length + 2}쪽</span></div>

  <section>
    <h2 data-n="5">${spec.meetTitle} <span class="hint">그림을 보면서 낱말을 소리 내어 읽어요</span></h2>
    <div class="meetgrid${words.length > 6 ? ' many' : ''}" style="--cols:${meetCols};--pic:${meetPic}mm">
      ${words.map((w) => `<div class="meet"><img src="${w.img}" alt=""><b>${esc(w.word)}</b></div>`).join('')}
    </div>
  </section>
${
  splitMeet
    ? ''
    : `
  <section>
    ${writeSection}
  </section>`
}
  <footer>
    <div class="link">${
      linked.length
        ? `📖 ${linked.map((w) => `<b>${esc(w.word)}</b> 는 《${esc(w.book)}》`).join(', ')} 에 나와요 · 소리는 앱 ${appLink} 에서`
        : `📖 소리가 궁금하면 앱에서 ${appLink} 를 열어 보세요.`
    }</div>
  </footer>
</div>
${
  // 🔴 카드가 7장 넘으면 그림과 쓰기를 한 장에 못 담는다(실측 214px 넘침) — 쪽을 늘린다.
  //    영어는 단원당 낱말이 8~12개라 이 갈래가 기본이고, 한글(4개)은 예전 그대로 한 장이다.
  !splitMeet
    ? ''
    : `
<!-- ─────────── 낱말 쓰기 쪽 ─────────── -->
<div class="page">
  <div class="runhead"><b>${UNIT} ${head.unitNo}. ${spec.glyph}</b><span>낱말을 써요 · ${chunks.length + 3}쪽</span></div>
  <section>
    ${writeSection}
  </section>
  <footer>
    <div class="link">📖 소리가 궁금하면 앱에서 ${appLink} 를 열어 보세요.</div>
  </footer>
</div>`
}
`;
}

const wrap = (title, body) => `<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
${STYLE}
${body}`;

/**
 * 고르기 화면 — 왼쪽 목록, 오른쪽 본문.
 *
 * 🔴 **iframe 을 쓰지 않는다.** `file://` 로 열면 브라우저가 iframe 안 문서를 막아
 *    (`contentDocument` 가 null) 본문이 통째로 안 보인다. 이 파일은 서버 없이 더블클릭으로
 *    여는 물건이므로, 32단원을 전부 한 파일에 담고 CSS 로 보이고 감춘다(약 3MB).
 * 🔴 목록은 생성한 단원에서 **파생**한다. 손으로 적으면 단원이 늘 때 한쪽만 고쳐져 갈라진다.
 */
function renderIndex(items, L = { name: '한글 워크지', unit: '익힘', allHref: 'ko_phonics_all.html' }) {
  const groups = [];
  for (const it of items) {
    const g = groups.find((x) => x.level === it.levelName);
    (g ?? groups[groups.push({ level: it.levelName, items: [] }) - 1]).items.push(it);
  }
  const first = items[0];
  return `<!doctype html>
<meta charset="utf-8">
<title>${L.name} — 인쇄용</title>
${STYLE}
<style>
  /* 워크지 STYLE 뒤에 와야 body 규칙을 덮는다. */
  body { display:grid; grid-template-columns:288px 1fr; height:100vh; background:#e6e0da; padding:0; }
  main { overflow-y:auto; min-width:0; }
  .unit { display:none; }
  .unit.on { display:block; }

  aside { background:var(--cream); border-right:1px solid var(--peach-200); overflow-y:auto; padding:16px 0 40px; text-align:left; }
  aside h1 { font-size:17px; font-weight:800; letter-spacing:-.03em; padding:4px 18px 12px; }
  aside h1 em { font-style:normal; color:var(--coral); }
  /* 🔴 워크지 STYLE 의 h2 는 번호 배지(::before)와 가운데 정렬을 갖는다 — 사이드바 제목에도
     먹어서 빈 주황 원이 붙고 가운데로 몰렸다. 여기서 되돌린다. */
  aside h2 { display:block; font-size:11px; font-weight:700; color:var(--ink-500); letter-spacing:.02em;
    padding:16px 18px 6px; }
  aside h2::before { content:none; }
  a.item { display:flex; gap:9px; align-items:baseline; padding:8px 18px; text-decoration:none; color:inherit;
    border-left:3px solid transparent; }
  a.item:hover { background:var(--peach-50); }
  a.item.on { background:#fff; border-left-color:var(--coral); }
  a.item b { font-size:15px; min-width:22px; color:var(--coral-700); }
  a.item .g { font-size:15px; font-weight:800; min-width:46px; }
  a.item .w { font-size:11px; color:var(--ink-600); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  button.all { margin:6px 18px 0; width:calc(100% - 36px); padding:9px 12px; cursor:pointer;
    border:1px dashed var(--peach-200); border-radius:8px; background:transparent; font-family:inherit;
    display:block; text-align:center; font-size:12px; font-weight:700; color:var(--mint-600); }
  button.all:hover { background:var(--peach-50); }
  .stamp { padding:10px 18px 0; font-size:10px; color:var(--ink-500); }

  .bar { position:sticky; top:0; z-index:2; display:flex; align-items:center; gap:12px; padding:10px 16px;
    background:#fff; border-bottom:1px solid var(--peach-200); }
  .bar .now { font-weight:800; letter-spacing:-.02em; }
  .bar .sp { flex:1; }
  .bar button, .bar a.btn { font:inherit; font-size:12px; font-weight:700; cursor:pointer; text-decoration:none;
    border:1px solid var(--peach-200); background:var(--peach-50); color:var(--coral-700);
    padding:7px 14px; border-radius:7px; }
  .bar button:hover, .bar a.btn:hover { background:#fff; }
  /* 🔴 인쇄 버튼과 같은 무게로 두면 안 보인다 — 이건 이 파일의 유일한 우리 쪽 출구다. */
  .bar a.btn.app { background:var(--coral); border-color:var(--coral); color:#fff; font-size:13px;
    padding:8px 16px; }
  .bar a.btn.app:hover { background:var(--coral-700); color:#fff; }

  /* 🔴 인쇄하면 사이드바와 나머지 31단원이 같이 나간다 — 고른 단원만 남긴다.
     ⚠️ 이 블록은 **맨 뒤**에 있어야 한다. 위에 두면 뒤따르는 .bar{display:flex} 같은 평범한
        규칙이 특정도가 같아 인쇄에서도 이겨 버린다(실측: 사이드바만 숨고 도구막대가 남았다). */
  @media print {
    body { display:block; height:auto; }
    aside, .bar { display:none !important; }
    .unit:not(.on) { display:none !important; }
  }
</style>

<aside>
  <h1>${L.name} <em>인쇄용</em></h1>
  <!-- 🔴 다른 파일을 가리키지 않는다. 배포엔 이 고르기 화면 **하나만** 올라가므로 합본·단원
       파일 링크는 서버에서 그대로 404 다. 전 단원이 이미 이 안에 있으니 켜고 인쇄하면 된다. -->
  <button class="all" id="printAll">📚 전체 ${items.length}단원 · ${items.reduce((n, it) => n + it.pageCount, 0)}쪽 한꺼번에 인쇄</button>
  <!-- 🔴 만든 시각을 박아 둔다. file:// 도 브라우저가 캐시해서, 새로 구워도 옛 화면을 보고
       「안 보인다」가 되기 쉽다(실측으로 두 번 헤맸다). 여기 시각이 안 바뀌면 캐시다. -->
  <p class="stamp">${new Date().toLocaleString('ko-KR', { hour12: false })} 판</p>
  ${groups
    .map(
      (g) => `<h2>${esc(g.level)}</h2>` +
        g.items
          .map(
            (it) =>
              `<a class="item${it.id === first.id ? ' on' : ''}" href="#${it.id}" data-id="${it.id}" data-name="${esc(g.level)} · ${L.unit} ${it.unitNo} · ${esc(it.glyph)}">` +
              `<b>${it.unitNo}</b><span class="g">${esc(it.glyph)}</span><span class="w">${esc(it.words)}</span></a>`
          )
          .join('')
    )
    .join('')}
</aside>

<main>
  <div class="bar">
    <span class="now">${esc(first.levelName)} · ${L.unit} ${first.unitNo} · ${esc(first.glyph)}</span>
    <span class="sp"></span>
    <button id="print">🖨 이 단원 인쇄</button>
    <!-- 🔴 **앱으로 가는 길을 여기 둔다.** 이 파일은 검색·공유로 곧장 도달하는 표면이라,
         뽑으러 온 사람이 우리가 누구인지 알 길이 인쇄물 안에는 없다. 도구막대는 sticky 라
         어느 단원을 보고 있든 늘 손에 닿고, 인쇄용 스타일에서 도구막대가 통째로 숨으므로
         종이에는 안 나간다.
         🔴 이 주석은 **템플릿 문자열 안**이다 — 백틱을 쓰면 문자열이 거기서 끊긴다. -->
    <a class="btn app" href="/" target="_blank" rel="noopener">🐯 탱고북 앱에서 해보기</a>
  </div>
  <!-- 🔴 첫 단원은 마크업에서 이미 켜 둔다. 전부 display:none 으로 두고 JS 로만 켜면,
       스크립트가 한 줄이라도 막히는 환경(확장·정책·구형 브라우저)에서 **백지**가 된다. -->
  ${items.map((it, i) => `<div class="unit${i === 0 ? ' on' : ''}" id="${it.id}">${it.pages}</div>`).join('\n')}
</main>

<script>
  const now = document.querySelector('.now');
  const links = [...document.querySelectorAll('a.item')];
  const main = document.querySelector('main');
  function select(a) {
    links.forEach((l) => l.classList.toggle('on', l === a));
    document.querySelectorAll('.unit').forEach((u) => u.classList.toggle('on', u.id === a.dataset.id));
    now.textContent = a.dataset.name;
    // ⚠️ file:// 에서는 replaceState 가 던질 수 있다 — 그것 때문에 전환이 멈추면 안 된다.
    try { history.replaceState(null, '', '#' + a.dataset.id); } catch {}
    main.scrollTop = 0;
  }
  links.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); select(a); }));
  document.getElementById('print').addEventListener('click', () => window.print());
  // 전체 인쇄 — 인쇄 규칙이 .on 만 남기므로, 잠깐 전부 켰다가 인쇄가 끝나면 되돌린다.
  document.getElementById('printAll').addEventListener('click', () => {
    const units = [...document.querySelectorAll('.unit')];
    const was = units.filter((u) => u.classList.contains('on'));
    units.forEach((u) => u.classList.add('on'));
    const restore = () => { units.forEach((u) => u.classList.toggle('on', was.includes(u))); };
    window.addEventListener('afterprint', restore, { once: true });
    window.print();
    // afterprint 를 안 쏘는 브라우저가 있어 보험을 하나 더 둔다.
    setTimeout(restore, 3000);
  });
  // 주소에 단원이 적혀 있을 때만 옮긴다 — 없으면 마크업이 이미 켜 둔 첫 단원을 그대로 둔다.
  const want = links.find((l) => l.dataset.id === location.hash.slice(1));
  if (want) select(want);
</script>
`;
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
  const lang = arg('lang', 'ko');
  const en = lang === 'en';
  // 🔴 두 언어가 **한 폴더**를 쓴다 — 단원 파일 id 가 `kr-*` / `en-*` 라 안 부딪히고,
  //    고르기 화면과 합본만 이름으로 가른다(`ko_phonics.html` / `en_phonics.html`).
  const outDir = new URL(arg('out', '../../client/public/worksheet') + '/', import.meta.url);
  const indexName = `${lang}_phonics.html`;
  const allName = `${lang}_phonics_all.html`;
  const only = arg('unit', '');
  const L = en
    ? { name: '영어 파닉스 워크지', unit: 'Unit', kinds: { letter: '알파벳', family: '낱말 가족' } }
    : { name: '한글 워크지', unit: '익힘', kinds: { consonant: '자음', coda: '받침', vowel: '모음' } };

  // 동화책 연결은 한글 낱말 표라 영어엔 없다 — 없는 채로 돌아가야 한다.
  const scenes = en
    ? {}
    : JSON.parse(
        await readFile(new URL('../../client/src/features/phonics-learner/data/word-scenes.json', import.meta.url), 'utf8')
      );
  const units = (
    en
      ? ENGLISH_PHONICS_CURRICULUM.flatMap((l) =>
          (l.units ?? []).map((u) => ({
            ...u,
            levelName: String(l.name ?? '').replace(':', ''),
            // 🔴 `level` 이 이미 'book1' 이다. 예전엔 `title` 에서 번호를 뽑았는데 그 필드가
            //    아예 없어(키는 level·name·description·units) Book 1 이 조용히 낱말 가족으로
            //    처리됐다 — 리포트의 「종류」 칸이 아니었으면 못 봤다.
            bookId: String(l.level ?? ''),
          }))
        )
      : KOREAN_PHONICS_CURRICULUM.filter((l) => String(l.level).startsWith('hangul')).flatMap((l) =>
          l.units.map((u) => ({ ...u, levelName: l.name.replace(':', '') }))
        )
  ).filter((u) => !only || u.id === only);
  if (!units.length) {
    console.error(only ? `${only} 을(를) 못 찾았다` : '대상 단원이 없다');
    process.exit(1);
  }

  await mkdir(outDir, { recursive: true });
  const report = [];
  const all = [];
  const index = [];

  for (const u of units) {
    const kind = en ? (u.bookId === 'book1' ? 'letter' : 'family') : unitKind(u);
    const unitNo = Number(u.id.slice(-2));

    // 🔴 낱말은 커리큘럼 sampleWords 가 아니라 **카드**에서 가져온다 — u01 은 sampleWords 가
    //    비어 있는데 카드는 4장 있고, 반대로 카드에는 「쌍기역」(글자 이름)·「되다」(동사)처럼
    //    그림이 없는 항목이 섞여 있다. 그림 있는 것만 앞에서 4개.
    // 🔴 그 단원 글자가 실제로 들어간 낱말을 앞으로 당긴다 — 카드 순서를 그대로 쓰면
    //    「ㅟ 이 들어간 낱말이에요」 밑에 참외·열쇠(ㅚ)가 앉는다(앱도 같은 데이터라 같은 증상).
    //    모자라면 나머지로 채운다 — 4장은 있어야 3쪽이 안 빈다.
    const r = await (await fetch(`${API}/${u.id}`)).json();
    const withImg = (r?.data?.flashcards ?? []).filter((f) => f.imageUrl);
    // ⚠️ 받침 단원 phonemes 는 「받침ㅇ」 꼴이라 접두어를 떼야 자모와 비교된다.
    const letters = u.phonemes.map((p) => p.replace('받침', ''));
    const hasUnitLetter = (w) =>
      [...w].some((ch) => {
        const d = decomposeHangul(ch);
        return d && letters.some((p) => d.cho === p || d.jung === p || d.jong === p);
      });
    // 🔴 영어는 카드를 **전부** 싣는다(8~12장, 3열). 4장으로 자르면 그 단원 패턴 셋 중
    //    둘은 낱말 그림을 한 장도 못 본다 — 한글은 단원당 낱말이 4개뿐이라 안 겪던 문제다.
    const cards = en
      ? withImg
      : [...withImg.filter((f) => hasUnitLetter(f.word)), ...withImg.filter((f) => !hasUnitLetter(f.word))].slice(0, 4);
    if (cards.length < 4) {
      console.error(`${u.id}: 그림 있는 카드가 ${cards.length}장뿐이다 (4장 필요)`);
      process.exit(1);
    }

    const words = [];
    for (const f of cards) {
      const hits = en || NOT_OBJECT.has(f.word) ? [] : (scenes[f.word] ?? []);
      words.push({
        word: f.word,
        img: await pic(f.imageUrl, en ? 360 : 440),
        book: hits.length ? await bookTitle(hits[0][0]) : null,
      });
    }

    if (en && !(r?.data?.phonicsLesson?.wordFamilies ?? []).length) {
      console.error(`${u.id}: wordFamilies 가 없다 — 조합 표를 만들 수 없다`);
      process.exit(1);
    }
    if (!en && kind === 'consonant' && !CONSONANTS[u.phonemes[0]]) {
      console.error(`${u.id}: ${u.phonemes[0]} 이(가) CONSONANTS 표에 없다 — 이름·입모양을 먼저 적을 것`);
      process.exit(1);
    }
    if (!en && kind === 'coda' && !CODAS[u.phonemes[0].replace('받침', '')]) {
      console.error(`${u.id}: ${u.phonemes[0]} 이(가) CODAS 표에 없다`);
      process.exit(1);
    }

    const spec = en ? enUnitSpec(u, r.data.phonicsLesson) : unitSpec(u, kind, words);
    const pages = renderPages({ head: { unitNo, levelName: u.levelName, unitLabel: L.unit }, spec, words });
    all.push(pages);
    const pageCount = (pages.match(/<div class="page/g) || []).length;
    const html = wrap(`${L.name} · ${u.levelName} ${L.unit} ${unitNo} · ${spec.glyph}`, pages);
    await writeFile(new URL(`${u.id}.html`, outDir), html, 'utf8');
    index.push({ id: u.id, unitNo, levelName: u.levelName, glyph: spec.glyph, words: words.map((w) => w.word).join(' '), pages, pageCount });
    report.push({
      단원: u.id,
      종류: L.kinds[kind],
      글자: spec.glyph,
      낱말: words.map((w) => w.word).join(' '),
      책: words.filter((w) => w.book).length,
      쪽: pageCount,
      KB: Math.round(html.length / 1024),
    });
  }

  // 합본 — 나눠 주려면 한 파일이 편하다. 이미지가 440px webp 라 14단원을 합쳐도 2MB 안쪽이다.
  if (!only) {
    const total = index.reduce((n, it) => n + it.pageCount, 0);
    const combined = wrap(`${L.name} · 전 단원 (${units.length}단원 ${total}쪽)`, all.join('\n'));
    await writeFile(new URL(allName, outDir), combined, 'utf8');
    report.push({ 단원: allName, 종류: '', 글자: '', 낱말: `${units.length}단원 ${total}쪽`, 책: '', KB: Math.round(combined.length / 1024) });

    const idx = renderIndex(index, { ...L, allHref: allName });
    await writeFile(new URL(indexName, outDir), idx, 'utf8');
    report.push({ 단원: indexName, 종류: '', 글자: '', 낱말: '고르기 화면', 책: '', KB: Math.round(idx.length / 1024) });
  }

  console.table(report);
  console.log('→', decodeURIComponent(outDir.pathname));
}

main();
