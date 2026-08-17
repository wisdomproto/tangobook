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
import { KOREAN_PHONICS_CURRICULUM, decomposeHangul, composeHangul } from '@tangobook/shared';

const API = 'https://www.tangobook.co.kr/api/storybooks';
/** 모음 순서 — 커리큘럼 blending 과 같다. */
const VOWELS = ['ㅏ', 'ㅑ', 'ㅓ', 'ㅕ', 'ㅗ', 'ㅛ', 'ㅜ', 'ㅠ', 'ㅡ', 'ㅣ'];
/** 2쪽 「거꾸로 나눠요」에 쓸 모음 — 방금 만든 음절 중에서만 고른다. */
const SPLIT_VOWELS = ['ㅓ', 'ㅜ', 'ㅣ'];

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
  ㅐ: ['ㅏ', 'ㅣ'], ㅔ: ['ㅓ', 'ㅣ'], ㅒ: ['ㅑ', 'ㅣ'], ㅖ: ['ㅕ', 'ㅣ'],
  ㅘ: ['ㅗ', 'ㅏ'], ㅙ: ['ㅗ', 'ㅐ'], ㅚ: ['ㅗ', 'ㅣ'],
  ㅝ: ['ㅜ', 'ㅓ'], ㅞ: ['ㅜ', 'ㅔ'], ㅟ: ['ㅜ', 'ㅣ'], ㅢ: ['ㅡ', 'ㅣ'],
};

/**
 * 복잡모음 단원에서 음절을 만들 자음. 찬찬한글은 14개를 7+7 두 표로 늘어놓지만
 * 우리는 1열 10행이라 앞쪽 자음만 쓴다.
 * ⚠️ ㄱ+ㅢ = 「긔」처럼 낯선 음절이 나오는데 **그대로 둔다** — 찬찬한글도 긔·늬·믜를 그대로
 *    싣는다. 뜻이 아니라 **조합 규칙**을 익히는 자리라서다.
 */
const BLEND_CONSONANTS = ['ㄱ', 'ㄴ', 'ㄷ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅅ'];

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
const traceRow = (word) => {
  const n = [...word].length;
  const sets = Math.max(2, Math.round(6 / n)); // 칸 수를 6 언저리로
  const cells = Array.from({ length: sets }, (_, s) => [...word].map((c) => box(s === 0 ? c : '')).join('')).join('');
  return `<div class="traceline"><span class="lbl">${esc(word)}</span>${cells}</div>`;
};

/** 카드 이미지 → data URI. 36mm 를 300dpi 로 찍으면 ~425px 면 충분하다. */
async function pic(url, px = 440) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer());
  const out = await sharp(buf).resize(px, px, { fit: 'inside' }).webp({ quality: 82 }).toBuffer();
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
  .sq.lg { width: 16mm; height: 16mm; }
  /* 큰 칸은 「많이」가 아니라 「크게·천천히」 연습용. ⚠️ 56pt 면 칸의 35%뿐이라 구석에 붙어 보인다. */
  .sq.xl { width: 57mm; height: 57mm; border: .6mm solid var(--coral-200); }
  .sq::before, .sq::after { content: ''; position: absolute;
    background: repeating-linear-gradient(to right, var(--peach-200) 0 1.1mm, transparent 1.1mm 2.2mm); }
  .sq::before { left: 6%; right: 6%; height: .25mm; top: 50%; }
  .sq::after { top: 6%; bottom: 6%; width: .25mm; left: 50%;
    background: repeating-linear-gradient(to bottom, var(--peach-200) 0 1.1mm, transparent 1.1mm 2.2mm); }
  /* 따라 쓸 연한 글자 — 회색 대신 복숭아색이라 덧그릴 것이 한눈에 구분된다. */
  .ghost { font-size: 21pt; line-height: 1; font-weight: 700; color: var(--peach-200); position: relative; transform: translateY(.4mm); }
  .sq.lg .ghost { font-size: 24pt; }
  .sq.xl .ghost { font-size: 105pt; }
  /* 🔴 자음 자모만 키운다. 폰트가 자음을 em 위쪽에만 그려서, 같은 105pt 인데도 칸을 채우는
     비율이 자음 31% · 모음/음절 57% 로 두 배 가까이 벌어진다(실측).
     ⚠️ 160pt 가 상한 — 180pt 부터는 글자가 칸보다 커져 위로 5.6% 밀린다(실측). */
  .sq.xl.big .ghost { font-size: 160pt; }
  .sq.big .ghost { font-size: 32pt; }
  .row { display: flex; gap: 2.5mm; flex-wrap: wrap; justify-content: center; }

  .learn { display: flex; align-items: center; justify-content: center; gap: 7mm;
    border: .5mm solid var(--coral-200); border-radius: 4mm; background: var(--peach-50); padding: 5mm 7mm; }
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

/** 조합 줄: [왼쪽 식] [연한 결과] [빈 ×4] */
const comboRow = (formula, result) =>
  `<div class="srow"><span class="formula">${formula}</span>` +
  `${box(result, 'lg')}${Array.from({ length: 4 }, () => box('', 'lg')).join('')}</div>`;

/**
 * 단원 종류별 사양. 🔴 종류마다 HTML 을 통째로 복사하면 한쪽만 고쳐져 갈라진다 —
 * 다른 것은 여기서 값으로만 정하고 마크업은 renderPages 하나가 찍는다.
 */
function unitSpec(u, kind, words) {
  const label = (s) => `<b>${s}</b>`;
  if (kind === 'coda') {
    const coda = u.phonemes[0].replace('받침', '');
    const c = CODAS[coda];
    // blending = [초성,중성,받침,결과]. 14개 전부 쓰면 지치므로 자음 단원과 같은 10줄 리듬으로.
    const rows = u.blending.slice(0, 10);
    const split = rows.slice(0, 3).map(([cho, jung, jong, res]) => ({ s: res, a: syllableOf(cho, jung), b: jong }));
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
      rows: rows.map(([cho, jung, jong, res]) => comboRow(`${syllableOf(cho, jung)}<i>+</i>${jong}`, res)),
      readAll: rows.map((b) => b[3]).join(' '),
      split,
      meetTitle: `받침 ${coda} 이 들어간 낱말이에요`,
    };
  }
  if (kind === 'vowel') {
    const vs = u.phonemes;
    const parts = (v) => VOWEL_PARTS[v];
    const sayHow = vs
      .filter(parts)
      .map((v) => `${parts(v)[0]} ~ ${parts(v)[1]} 을 빠르게 이어 붙이면 ${v}`)
      .join(' · ');
    // 🔴 기본모음 단원(한글1 u01)은 **아직 자음을 안 배웠다** — 자음×모음 표를 낼 수 없다.
    //    찬찬한글도 단순모음 단원에선 모음만 쓰게 하고, 자음과 합치는 건 자음 단원부터다.
    const basicOnly = vs.length > 3;
    const rows = basicOnly
      ? // 이중모음 줄은 「ㅣ+ㅏ」로 보여 준다 — 합성이 곧 이 단원의 내용이다.
        vs.map((v) =>
          parts(v)
            ? comboRow(`${parts(v)[0]}<i>+</i>${parts(v)[1]}`, v)
            : comboRow(`${v}<i>→</i>${syllableOf('ㅇ', v)}`, v)
        )
      : // 복잡모음 단원 = 자음 × 그 모음 음절표(찬찬한글 「글자만들기」).
        vs.flatMap((v) =>
          BLEND_CONSONANTS.slice(0, Math.floor(10 / vs.length)).map((c) => comboRow(`${c}<i>+</i>${v}`, syllableOf(c, v)))
        );
    const split = basicOnly
      ? null // 자음이 없으니 「둘로 가르기」가 성립하지 않는다
      : vs.slice(0, 3).map((v) => ({ s: syllableOf(BLEND_CONSONANTS[0], v), a: BLEND_CONSONANTS[0], b: v }));
    return {
      glyph: vs[0],
      title: `${vs.join(' · ')} 을 알아봐요`,
      sub: `모음 ${vs.length}개`,
      dl: [
        ['모음', vs.join('   ')],
        ['소리', vs.map((v) => syllableOf('ㅇ', v)).join('   ')],
        ['알아두기', sayHow || '모음은 혼자서도 소리가 나요 — 자음은 모음이 있어야 소리가 나요'],
      ],
      xlGhosts: vs.slice(0, 3),
      writeHint: `쓸 때마다 “${syllableOf('ㅇ', vs[0])}” 하고 소리 내요`,
      demo: parts(vs[0])
        ? `${parts(vs[0])[0]} <em>+</em> ${parts(vs[0])[1]} <em>→</em> ${label(vs[0])}`
        : `${vs[0]} <em>→</em> ${label(syllableOf('ㅇ', vs[0]))}`,
      demoNote: parts(vs[0])
        ? `“${syllableOf('ㅇ', parts(vs[0])[0])} ~ ${syllableOf('ㅇ', parts(vs[0])[1])}” 를 점점 빠르게 이어 붙여 보세요`
        : '모음은 입을 크게 벌리고 길게 소리 내요',
      rows,
      readAll: basicOnly ? vs.map((v) => syllableOf('ㅇ', v)).join(' ') : rows.length ? vs.map((v) => syllableOf(BLEND_CONSONANTS[0], v)).join(' ') : '',
      split,
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
    rows: VOWELS.map((v) => comboRow(`${letter}<i>+</i>${v}`, syllableOf(letter, v))),
    readAll: VOWELS.map((v) => syllableOf(letter, v)).join(' '),
    split: SPLIT_VOWELS.map((v) => syllableOf(letter, v)).map((s) => {
      const d = decomposeHangul(s);
      return { s, a: d.cho, b: d.jung };
    }),
    meetTitle: `${letter} 이 들어간 낱말이에요`,
  };
}

/** 한 단원의 3쪽 마크업. 스타일은 STYLE 로 분리해 합본에서 한 번만 싣는다. */
function renderPages({ head, spec, words }) {
  const linked = words.filter((w) => w.book);
  const appLink = `<b>${head.levelName} · 익힘 ${head.unitNo}</b>`;

  return `
<!-- ─────────── 1쪽 · 글자 ─────────── -->
<div class="page airy">
  <header>
    <div class="ttl">익힘 ${head.unitNo}. <em>${spec.glyph}</em><small>${spec.sub}</small></div>
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
    <div class="row">${Array.from({ length: 3 }, (_, i) => box(spec.xlGhosts[i] ?? '', 'xl' + (spec.xlBig ? ' big' : ''))).join('')}</div>
  </section>

  <section>
    <h2 data-n="3">${spec.page1Title ?? `이제 작게 써요 ${spec.writeHint ? `<span class="hint">${spec.writeHint}</span>` : ''}`}</h2>
    ${
      spec.page1Rows
        ? `<div class="syls">${spec.page1Rows.join('')}</div>`
        : Array.from(
            { length: 3 },
            (_, r) =>
              `<div class="row">${Array.from({ length: 9 }, (_, i) => box(r === 0 && i < 3 ? spec.xlGhosts[i % spec.xlGhosts.length] : '', spec.xlBig ? 'big' : '')).join('')}</div>`
          ).join('')
    }
  </section>

  <footer><div class="link">📖 소리가 궁금하면 앱에서 ${appLink} 를 열어 보세요.</div></footer>
</div>

<!-- ─────────── 2쪽 · 조합 ─────────── -->
<div class="page">
  <div class="runhead"><b>익힘 ${head.unitNo}. ${spec.glyph}</b><span>글자를 만들어요 · 2쪽</span></div>

  <div class="demo">${spec.demo}<small>${spec.demoNote}</small></div>

  <section><div class="syls">${spec.rows.join('')}</div></section>

  ${
    spec.split
      ? `<section>
    <h2 data-n="5">거꾸로 나눠요 <span class="hint">한 글자를 둘로 갈라 봐요</span></h2>
    <div class="qline">${spec.split
      .map((s) => `<div class="qrow">${esc(s.s)}<span class="op">=</span><span class="blank"></span><span class="op">+</span><span class="blank"></span></div>`)
      .join('')}</div>
  </section>`
      : ''
  }

  <footer>
    <div class="link">✏️ 다 쓰면 <b>${spec.readAll}</b> 를 위에서 아래로 소리 내어 읽어요.</div>
    ${spec.split ? `<div class="ans">정답 (5번) — ${spec.split.map((s) => `${s.s}=${s.a}+${s.b}`).join(' · ')}</div>` : ''}
  </footer>
</div>

<!-- ─────────── 3쪽 · 낱말 ─────────── -->
<div class="page">
  <div class="runhead"><b>익힘 ${head.unitNo}. ${spec.glyph}</b><span>낱말을 만나요 · 3쪽</span></div>

  <section>
    <h2 data-n="6">${spec.meetTitle} <span class="hint">그림을 보면서 낱말을 소리 내어 읽어요</span></h2>
    <div class="meetgrid">
      ${words.map((w) => `<div class="meet"><img src="${w.img}" alt=""><b>${esc(w.word)}</b></div>`).join('')}
    </div>
  </section>

  <section>
    <h2 data-n="7">따라 써요 <span class="hint">한 글자씩 또박또박, 다 쓰면 소리 내어 읽어요</span></h2>
    ${words.map((w) => traceRow(w.word)).join('')}
  </section>

  <footer>
    <div class="link">${
      linked.length
        ? `📖 ${linked.map((w) => `<b>${esc(w.word)}</b> 는 《${esc(w.book)}》`).join(', ')} 에 나와요 · 소리는 앱 ${appLink} 에서`
        : `📖 소리가 궁금하면 앱에서 ${appLink} 를 열어 보세요.`
    }</div>
  </footer>
</div>
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
function renderIndex(items) {
  const groups = [];
  for (const it of items) {
    const g = groups.find((x) => x.level === it.levelName);
    (g ?? groups[groups.push({ level: it.levelName, items: [] }) - 1]).items.push(it);
  }
  const first = items[0];
  return `<!doctype html>
<meta charset="utf-8">
<title>한글 워크지 — 인쇄용</title>
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
  a.all { margin:6px 18px 0; padding:9px 12px; border:1px dashed var(--peach-200); border-radius:8px;
    display:block; text-align:center; font-size:12px; font-weight:700; color:var(--mint-600); }
  .stamp { padding:10px 18px 0; font-size:10px; color:var(--ink-500); }

  .bar { position:sticky; top:0; z-index:2; display:flex; align-items:center; gap:12px; padding:10px 16px;
    background:#fff; border-bottom:1px solid var(--peach-200); }
  .bar .now { font-weight:800; letter-spacing:-.02em; }
  .bar .sp { flex:1; }
  .bar button, .bar a.btn { font:inherit; font-size:12px; font-weight:700; cursor:pointer; text-decoration:none;
    border:1px solid var(--peach-200); background:var(--peach-50); color:var(--coral-700);
    padding:7px 14px; border-radius:7px; }
  .bar button:hover, .bar a.btn:hover { background:#fff; }

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
  <h1>한글 워크지 <em>인쇄용</em></h1>
  <!-- 전체는 별도 파일로 연다 — 여기 또 심으면 같은 3MB 를 두 벌 들고 있게 된다. -->
  <a class="all" href="all.html" target="_blank">📚 전체 ${items.length}단원 · ${items.length * 3}쪽 한꺼번에</a>
  <!-- 🔴 만든 시각을 박아 둔다. file:// 도 브라우저가 캐시해서, 새로 구워도 옛 화면을 보고
       「안 보인다」가 되기 쉽다(실측으로 두 번 헤맸다). 여기 시각이 안 바뀌면 캐시다. -->
  <p class="stamp">${new Date().toLocaleString('ko-KR', { hour12: false })} 판</p>
  ${groups
    .map(
      (g) => `<h2>${esc(g.level)}</h2>` +
        g.items
          .map(
            (it) =>
              `<a class="item${it.id === first.id ? ' on' : ''}" href="#${it.id}" data-id="${it.id}" data-name="${esc(g.level)} · 익힘 ${it.unitNo} · ${esc(it.glyph)}">` +
              `<b>${it.unitNo}</b><span class="g">${esc(it.glyph)}</span><span class="w">${esc(it.words)}</span></a>`
          )
          .join('')
    )
    .join('')}
</aside>

<main>
  <div class="bar">
    <span class="now">${esc(first.levelName)} · 익힘 ${first.unitNo} · ${esc(first.glyph)}</span>
    <span class="sp"></span>
    <button id="print">🖨 이 단원 인쇄</button>
    <a class="btn" id="open" href="${first.id}.html" target="_blank">단원 파일 따로 열기</a>
  </div>
  <!-- 🔴 첫 단원은 마크업에서 이미 켜 둔다. 전부 display:none 으로 두고 JS 로만 켜면,
       스크립트가 한 줄이라도 막히는 환경(확장·정책·구형 브라우저)에서 **백지**가 된다. -->
  ${items.map((it, i) => `<div class="unit${i === 0 ? ' on' : ''}" id="${it.id}">${it.pages}</div>`).join('\n')}
</main>

<script>
  const now = document.querySelector('.now');
  const open = document.getElementById('open');
  const links = [...document.querySelectorAll('a.item')];
  const main = document.querySelector('main');
  function select(a) {
    links.forEach((l) => l.classList.toggle('on', l === a));
    document.querySelectorAll('.unit').forEach((u) => u.classList.toggle('on', u.id === a.dataset.id));
    open.href = a.dataset.id + '.html';
    now.textContent = a.dataset.name;
    // ⚠️ file:// 에서는 replaceState 가 던질 수 있다 — 그것 때문에 전환이 멈추면 안 된다.
    try { history.replaceState(null, '', '#' + a.dataset.id); } catch {}
    main.scrollTop = 0;
  }
  links.forEach((a) => a.addEventListener('click', (e) => { e.preventDefault(); select(a); }));
  document.getElementById('print').addEventListener('click', () => window.print());
  // 주소에 단원이 적혀 있을 때만 옮긴다 — 없으면 마크업이 이미 켜 둔 첫 단원을 그대로 둔다.
  const want = links.find((l) => l.dataset.id === location.hash.slice(1));
  if (want) select(want);
</script>
`;
}

async function main() {
  const args = process.argv.slice(2);
  const arg = (k, d) => (args.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).split('=').slice(1).join('=');
  const outDir = new URL(arg('out', '../../client/public/worksheet') + '/', import.meta.url);
  const only = arg('unit', '');

  const scenes = JSON.parse(
    await readFile(new URL('../../client/src/features/phonics-learner/data/word-scenes.json', import.meta.url), 'utf8')
  );
  const units = KOREAN_PHONICS_CURRICULUM.filter((l) => String(l.level).startsWith('hangul')).flatMap((l) =>
    l.units.map((u) => ({ ...u, levelName: l.name.replace(':', '') }))
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
    const kind = unitKind(u);
    const unitNo = Number(u.id.slice(-2));

    // 🔴 낱말은 커리큘럼 sampleWords 가 아니라 **카드**에서 가져온다 — u01 은 sampleWords 가
    //    비어 있는데 카드는 4장 있고, 반대로 카드에는 「쌍기역」(글자 이름)·「되다」(동사)처럼
    //    그림이 없는 항목이 섞여 있다. 그림 있는 것만 앞에서 4개.
    const r = await (await fetch(`${API}/${u.id}`)).json();
    const cards = (r?.data?.flashcards ?? []).filter((f) => f.imageUrl).slice(0, 4);
    if (cards.length < 4) {
      console.error(`${u.id}: 그림 있는 카드가 ${cards.length}장뿐이다 (4장 필요)`);
      process.exit(1);
    }

    const words = [];
    for (const f of cards) {
      const hits = NOT_OBJECT.has(f.word) ? [] : (scenes[f.word] ?? []);
      words.push({ word: f.word, img: await pic(f.imageUrl), book: hits.length ? await bookTitle(hits[0][0]) : null });
    }

    if (kind === 'consonant' && !CONSONANTS[u.phonemes[0]]) {
      console.error(`${u.id}: ${u.phonemes[0]} 이(가) CONSONANTS 표에 없다 — 이름·입모양을 먼저 적을 것`);
      process.exit(1);
    }
    if (kind === 'coda' && !CODAS[u.phonemes[0].replace('받침', '')]) {
      console.error(`${u.id}: ${u.phonemes[0]} 이(가) CODAS 표에 없다`);
      process.exit(1);
    }

    const spec = unitSpec(u, kind, words);
    const pages = renderPages({ head: { unitNo, levelName: u.levelName }, spec, words });
    all.push(pages);
    const html = wrap(`한글 워크지 · ${u.levelName} 익힘 ${unitNo} · ${spec.glyph}`, pages);
    await writeFile(new URL(`${u.id}.html`, outDir), html, 'utf8');
    index.push({ id: u.id, unitNo, levelName: u.levelName, glyph: spec.glyph, words: words.map((w) => w.word).join(' '), pages });
    report.push({
      단원: u.id,
      종류: { consonant: '자음', coda: '받침', vowel: '모음' }[kind],
      글자: u.phonemes.join(''),
      낱말: words.map((w) => w.word).join(' '),
      책: words.filter((w) => w.book).length,
      KB: Math.round(html.length / 1024),
    });
  }

  // 합본 — 나눠 주려면 한 파일이 편하다. 이미지가 440px webp 라 14단원을 합쳐도 2MB 안쪽이다.
  if (!only) {
    const combined = wrap(`한글 워크지 · 전 단원 (${units.length}단원)`, all.join('\n'));
    await writeFile(new URL('all.html', outDir), combined, 'utf8');
    report.push({ 단원: 'all.html', 종류: '', 글자: '', 낱말: `${units.length}단원 ${units.length * 3}쪽`, 책: '', KB: Math.round(combined.length / 1024) });

    const idx = renderIndex(index);
    await writeFile(new URL('index.html', outDir), idx, 'utf8');
    report.push({ 단원: 'index.html', 종류: '', 글자: '', 낱말: '고르기 화면', 책: '', KB: Math.round(idx.length / 1024) });
  }

  console.table(report);
  console.log('→', decodeURIComponent(outDir.pathname));
}

main();
