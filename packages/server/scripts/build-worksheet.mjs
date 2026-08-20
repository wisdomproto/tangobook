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
  :root { --logo: url('__LOGO__');
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
  /* 🔴 로고는 **CSS 배경으로 한 번만** 심는다(2026-08-19 사용자: 각 페이지 맨 위 가운데).
     쪽마다 img 를 넣으면 같은 base64 가 쪽수만큼 복제돼 파일이 몇 배가 된다.
     🔴 data URI 라 오프라인·인쇄에서도 뜬다 — 이 파일은 내려받아 쓰는 인쇄물이다. */
  .plogo { height: 9mm; margin: 0 auto 2mm; background: center/contain no-repeat var(--logo); }
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
  // 🔴 라벨(왼쪽 수식)을 뺀 만큼 칸을 키운다(2026-08-19 사용자: "각 칸을 좀 키워서 꽉 채워").
  //    전엔 16mm 짜리 라벨이 폭을 먹어 칸이 26mm 에서 멈췄다. 낱말 칸 상한은 그대로 - 그쪽은
  //    칸 폭이 높이의 2.3배라 세로가 아니라 **가로가 먼저 찬다**.
  const [lo, hi] = wd ? [14, 20] : [20, 34];
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
/**
 * 인쇄물 머리에 넣을 로고 — 🔴 **파일을 읽어 base64 로 심는다**. 이 HTML 은 내려받아 쓰는
 * 물건이라 상대경로 이미지는 오프라인에서 깨지고, 절대 URL 은 인쇄 시 네트워크를 탄다.
 */
const LOGO_DATA = {
  ko: `data:image/webp;base64,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`,
  en: `data:image/webp;base64,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`,
};

const comboRow = (formula, result, wd = false) => {
  const cls = wd ? 'lg wd' : 'lg';
  return (
    // 🔴 왼쪽 녹색 수식(ㅏ→아 · ㅣ+ㅏ)은 **안 그린다**(2026-08-19 사용자). 칸 안에 흐린
    //    글자가 이미 무엇을 쓸지 보여 주고, 라벨이 빠진 폭만큼 칸을 키울 수 있다.
    //    `formula` 인자는 호출부가 아직 만들어 넘기지만 여기서 버린다 — 되살리려면 이 줄만.
    `<div class="srow">` +
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
  <div class="plogo"></div>
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
</div>

<!-- ─────────── 2쪽 · 조합 ─────────── -->
<div class="page">
  <div class="plogo"></div>
  <div class="runhead"><b>${UNIT} ${head.unitNo}. ${spec.glyph}</b><span>글자를 만들어요 · 2쪽</span></div>

  <section>
    <h2 data-n="4">${chunks[0].title}</h2>
    ${syllableBlock(chunks[0].rows, ROOM.firstCombo, spec.wordy)}
  </section>
</div>
${chunks
  .slice(1)
  .map(
    (c, i) => `
<!-- ─────────── 조합 이어지는 쪽 ─────────── -->
<div class="page">
  <div class="plogo"></div>
  <div class="runhead"><b>${UNIT} ${head.unitNo}. ${spec.glyph}</b><span>글자를 만들어요 · ${i + 3}쪽</span></div>
  <section>
    <h2 data-n="4">${c.title}${c.cont ? ' <span class="hint">이어서 써요</span>' : ''}</h2>
    ${syllableBlock(c.rows, ROOM.more - 14, spec.wordy)}
  </section>
</div>`
  )
  .join('')}

<!-- ─────────── 낱말 쪽 ─────────── -->
<div class="page">
  <div class="plogo"></div>
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
</div>
${
  // 🔴 카드가 7장 넘으면 그림과 쓰기를 한 장에 못 담는다(실측 214px 넘침) — 쪽을 늘린다.
  //    영어는 단원당 낱말이 8~12개라 이 갈래가 기본이고, 한글(4개)은 예전 그대로 한 장이다.
  !splitMeet
    ? ''
    : `
<!-- ─────────── 낱말 쓰기 쪽 ─────────── -->
<div class="page">
  <div class="plogo"></div>
  <div class="runhead"><b>${UNIT} ${head.unitNo}. ${spec.glyph}</b><span>낱말을 써요 · ${chunks.length + 3}쪽</span></div>
  <section>
    ${writeSection}
  </section>
</div>`
}
`;
}

/**
 * 🔴 STYLE 은 모듈 로드 때 한 번 평가되므로 그 안에서 lang 을 못 본다 - 로고는 자리표시자로
 *    두고 여기서 채운다. (처음엔 STYLE 안에서 바로 참조했다가 ReferenceError 로 걸렸다.)
 */
const wrap = (title, body, lang = 'ko') => `<!doctype html>
<meta charset="utf-8">
<title>${title}</title>
${STYLE.replace('__LOGO__', LOGO_DATA[lang] ?? LOGO_DATA.ko)}
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
<!-- 🔴 고르기 화면도 로고 자리표시자를 채워야 한다 - 여기만 STYLE 을 그대로 쓰다가
     자리표시자가 남아 **사용자가 실제로 보는 화면**에서만 로고가 안 떴다.
     🔴 주석에 자리표시자 이름을 그대로 쓰면 그 글자가 산출물에 나간다(방금 그랬다). -->
${STYLE.replace('__LOGO__', LOGO_DATA[L.phonicsPath === 'english' ? 'en' : 'ko'])}
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
  /* 🔴 사이드바 전용 button.all 규칙은 지웠다 — 전체 인쇄가 도구막대로 옮겨져 .bar button 을
     그대로 쓴다. 죽은 규칙을 남기면 다음 사람이 살아 있는 줄 안다.
     🔴 이 주석은 템플릿 문자열 안이다 — 백틱을 쓰면 문자열이 거기서 끊긴다(방금 걸렸다). */
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
    <!-- 🔴 전체 인쇄는 **이 단원 인쇄 옆**이다(2026-08-19 사용자). 사이드바 맨 위에 있을 땐
         단원 목록의 머리처럼 보여서, 인쇄하러 온 사람이 목록을 스크롤하다 지나쳐 버렸다.
         두 인쇄 버튼은 같은 일의 범위 차이라 나란히 있어야 고르기가 된다.
         🔴 다른 파일을 가리키지 않는다 — 배포엔 이 고르기 화면 **하나만** 올라가므로
         합본·단원 파일 링크는 서버에서 그대로 404 다. 전 단원이 이미 이 안에 있다. -->
    <button id="printAll">📚 전체 ${items.length}단원 · ${items.reduce((n, it) => n + it.pageCount, 0)}쪽</button>
    <!-- 🔴 **앱으로 가는 길을 여기 둔다.** 이 파일은 검색·공유로 곧장 도달하는 표면이라,
         뽑으러 온 사람이 우리가 누구인지 알 길이 인쇄물 안에는 없다. 도구막대는 sticky 라
         어느 단원을 보고 있든 늘 손에 닿고, 인쇄용 스타일에서 도구막대가 통째로 숨으므로
         종이에는 안 나간다.
         🔴 이 주석은 **템플릿 문자열 안**이다 — 백틱을 쓰면 문자열이 거기서 끊긴다. -->
    <!-- 🔴 **그 언어의 파닉스로 보낸다**(2026-08-19 사용자) — 예전엔 루트라 라이브러리(동화책)로
         떨어졌다. 한글 워크지를 뽑던 사람이 앱에서 만나야 하는 건 같은 단원의 한글 파닉스다.
         🔴 위 주석이 경고한 백틱 함정에 이 줄에서 또 걸렸다(한 번에 두 번). 주석에도 백틱 금지. -->
    <a class="btn app" href="/library/phonics/${L.phonicsPath}" target="_blank" rel="noopener">🐯 탱고북 앱에서 해보기</a>
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
    ? { name: '영어 파닉스 워크지', unit: 'Unit', phonicsPath: 'english', kinds: { letter: '알파벳', family: '낱말 가족' } }
    : { name: '한글 워크지', unit: '익힘', phonicsPath: 'korean', kinds: { consonant: '자음', coda: '받침', vowel: '모음' } };

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
    const html = wrap(`${L.name} · ${u.levelName} ${L.unit} ${unitNo} · ${spec.glyph}`, pages, lang);
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
