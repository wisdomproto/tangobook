import { firstClause, splitIntoBuckets, type ReelScene } from './reel-props.js';

// 씬별 길이(초): 훅 · 신기한 사실(핵심·길게) · 관찰 포인트.
// [훅, 본문…] 초. 🔴 예전 [4,12,5] 는 2번 씬이 12초 동안 같은 제목으로 고정 → "멈춘 줄 알았다"(리뷰).
// 자연 = [훅, 신기한 사실, 관찰 포인트] → 4+8+7=19s (+시리즈4+CTA4 = 27s)
export const NATURE_SCENE_DURS = [4, 8, 7];
// 생활동화 = [훅(편식 장면), 호리 이야기] — **오직 책 이야기만**.
// 🔴 "왜 중요할까"(영양 교육)와 "집에서 이렇게"(육아 팁) 둘 다 뺐다.
//    - 왜 중요할까: 엄마들은 이미 안다. 가르치려 들면 반감만 생긴다.
//    - 집에서 이렇게: "부모가 바보도 아니고, 이런 정보는 큰 도움 안 된다. 호리 이야기만으로 충분"
//      (사용자 피드백). 게다가 팁 자막(엄마 대상)에 호리 그림을 붙여 자막-그림이 계속 어긋났다.
// 🔴 훅이 엄마용 카피라 정작 이야기가 "다음 날 아침 기운이 없어요"부터 시작 → **편식했다는 원인이
//    이야기 안에 없었다**(사용자 피드백) → 훅부터 책의 편식 장면·책 원문으로 연다.
// 자막당 4초 확보(2줄이 순식간에 넘어가 못 읽는다는 피드백): 이야기 20s ÷ 5페이지 = 4s.
export const LIFE_SCENE_DURS = [6, 20]; // 26s (+시리즈4+CTA4 = 34s)
// 시리즈 씬 헤드라인 — 릴스의 책 라인과 같은 시리즈를 보여줘야 한다(생활동화 릴스에 자연도감이
// 뜨면 "이 둘이 무슨 관계?"가 된다는 리뷰 피드백).
const SERIES_HEADLINE_NATURE = '우리 아이 첫 자연도감 100권+';
// 시리즈 씬은 이야기 **뒤**에 온다. (주제 그리드로 여는 안을 시험했다가 되돌림 — 글자로 시작해서
// 니들펠트 그림이라는 최대 무기를 5초 뒤에 꺼내게 되고, 첫 인상이 광고로 분류된다.)
const SERIES_HEADLINE_LIFE = '호리네 생활동화 45편';

export interface NatureSeries {
  covers: string[]; // 자연=8 테마 대표 표지 · 생활동화=전 45편 표지(encodeURI 완료)
  labels?: string[]; // 없으면 전권 스크롤 모드(생활동화)
  headline: string;
  durSec?: number; // 45편 스크롤은 4s 로 다 못 흘러 6s
}

export interface NatureReelProps {
  bookTitle: string;
  category: string;
  scenes: ReelScene[]; // 훅 · 사실 · 관찰 (3)
  series: NatureSeries;
}

export function buildNatureReelProps({
  storybook,
  storyboard,
  captions,
  seriesCovers,
  seriesLabels,
}: {
  storybook: any;
  storyboard: any;
  captions?: string[];
  seriesCovers: string[];
  seriesLabels?: string[];
}): NatureReelProps | null {
  const sbScenes = storyboard?.scenes;
  if (!Array.isArray(sbScenes) || sbScenes.length < 5) return null;

  const pages = (Array.isArray(storybook.pages) ? storybook.pages : [])
    .filter((p: any) => p?.illustrationUrl)
    .sort((a: any, b: any) => (a.pageNumber ?? 0) - (b.pageNumber ?? 0));
  if (pages.length === 0) return null;

  const cover = encodeURI(storybook.coverImage || pages[0].illustrationUrl);
  const urlOf = (p: any) => encodeURI(p.illustrationUrl);
  // 생활동화 제목의 선두 번호("01. …")는 내부 정렬용 — 마케팅 영상엔 노출하지 않는다.
  const bookTitle = (storybook.title || '').replace(/^\s*\d+\.\s*/, '');

  // 🔴 본문 = 나레이션(실제 메시지). 예전엔 subtitle(=블로그 h2 제목)을 우선해서 화면에
  // 제목만 뜨고 알맹이가 없었다("왜 중요할까 / 골고루 먹기가 중요한 이유" 처럼 라벨+제목 반복).
  // StoryScene 이 긴 본문을 문장 단위로 순차 노출 + 폰트 자동축소하므로 나레이션을 그대로 넘긴다.
  const bodyOf = (sc: any, i: number) => {
    const hand = captions?.[i]?.trim();
    if (hand) return hand;
    const narration = (sc?.narration ?? '').trim();
    if (narration) return narration;
    return sc?.subtitle?.trim() ? sc.subtitle.trim() : firstClause(sc?.narration ?? '');
  };

  // 본문 씬으로 쓸 스토리보드 인덱스.
  // - 생활동화: [2] 호리 이야기 **하나만**. [1] "왜 중요할까"(영양 교육)·[3] "집에서 이렇게"(육아 팁)는
  //   제외 — 엄마들은 이미 알고, 가르치려 드는 톤이 된다("부모가 바보도 아니고"). 책 이야기만으로 판다.
  // - 자연/명작: [2]가 "탱고북 내용"(홍보)이라 건너뛴다.
  const isLife = /생활동화/.test(storybook.category || '');
  const bodyIdx = isLife ? [2] : [1, 3];

  const buckets = splitIntoBuckets(pages, bodyIdx.length);
  const imgsFor = (n: number) => (buckets[n]?.length ? buckets[n] : pages).map(urlOf);
  const durs = isLife ? LIFE_SCENE_DURS : NATURE_SCENE_DURS;

  // 🔴 생활동화 "호리 이야기" 씬 = **실제 책 미리보기**. 자막(그 페이지 글)과 삽화(그 페이지 그림)를
  // 1:1로 넘겨 어긋날 수가 없게 한다(예전엔 블로그 요약 vs 책 페이지라 3페이지쯤 밀렸다).
  //
  // 생활동화 45편은 전부 10쪽 5비트(일상 → 문제 → 곤란 → 조력자 → 발견 → 배움 → 시도 → 변화 →
  // 실천 → 마무리)라 **위치 비율**로 비트를 집는다(권수 달라져도 안전).
  //   훅   0.1 = 문제("당근은 싫어!")  ← 공감 카피와 그림이 일치한다
  //   이야기 0.2 곤란 → 0.3 조력자 → 0.6 시도 → 0.7 변화  ← 문제부터 해결까지 완결
  // 🔴 예전 훅은 **표지**(온 가족이 웃으며 잘 먹는 그림)라 "밀려나 있지 않나요?" 카피를 그림이
  //    배신했고, 결말을 먼저 보여줘 볼 이유를 없앴다(리뷰 피드백: "재료는 좋은데 배치가 거꾸로").
  const pageAt = (r: number) => pages[Math.min(pages.length - 1, Math.round(pages.length * r))];
  /** 페이지 글 → 자막. 문장 경계로 최대 2줄(≈52자).
   *  🔴 68자면 한 컷에 사건이 3개(용기+당근+브로콜리+맛있어요) 들어가 혼자 3줄로 빡빡해진다 —
   *  "다른 컷은 1~2줄인데 여기만 정독해야 한다"는 피드백. 컷당 1~2문장으로 균질하게. */
  const CAPTION_MAX = 52;
  /** 따옴표가 안 닫힌 조각은 다음 조각과 합친다.
   *  🔴 `"…어? 달다!"` 는 문장 하나인데 따옴표 **안**의 `?` 를 문장 끝으로 오인해 `"…어?` 에서 잘렸고,
   *  아래 홀수-따옴표 보정이 `"…어?"` 라는 **없는 닫는 따옴표를 지어내** 대사가 완결된 척했다
   *  (사용자: "아삭 어? 이걸로 끝나는데? 달다! 이게 없어"). 대사는 통째로 살린다. */
  const mergeQuoted = (parts: string[]) => {
    const out: string[] = [];
    for (const p of parts) {
      const prev = out[out.length - 1];
      if (prev && (prev.match(/"/g) ?? []).length % 2 === 1) out[out.length - 1] = `${prev} ${p}`;
      else out.push(p);
    }
    return out;
  };
  const pageCaption = (p: any) => {
    const t = String(p?.text ?? '')
      .replace(/\s+/g, ' ')
      .trim();
    const sents = mergeQuoted(t.split(/(?<=[.!?])\s+/).filter(Boolean));
    let out = '';
    for (const s of sents) {
      if (out && (out + ' ' + s).length > CAPTION_MAX) break;
      out = out ? `${out} ${s}` : s;
    }
    out = out || t.slice(0, CAPTION_MAX);
    // 마지막 안전망 — mergeQuoted 로 대부분 해결되지만, 원문 자체의 따옴표가 홀수면 닫아준다.
    if ((out.match(/"/g) ?? []).length % 2 === 1) out += '"';
    return out;
  };
  const hookPage = pageAt(0.1);
  // 🔴 이야기 비트 = 곤란(0.2) → 조력자(0.3) → **마음 열림(0.4)** → 시도(0.6) → **마무리(0.9)**.
  //  - 0.4(발견: "우와…" 눈이 동그래짐) = 호리가 마음을 바꾸는 순간. 이게 없으면 "어제 팔짱 끼고
  //    싫다던 애가 왜 갑자기 먹지?"가 된다(리뷰).
  //  - 0.5(조력자가 "채소마다 색깔 힘이 숨어 있어" 설명)는 0.4 와 같은 말이라 뺐다 — 리뷰:
  //    "무지개 텃밭 → 색깔 힘, 어차피 같은 말. 여기서 손가락 나가요" + "다람쥐가 영양학 설명하는 게
  //    엄마 잔소리랑 똑같아요". 감정(우와)이 설명보다 세다.
  //  - 0.7(변화: "다리가 가벼워지고")·0.8(무지개 식판)은 0.6("어? 달다!")과 같은 말이라 뺐다.
  //  - 🔴 0.9(책 마지막 쪽) = **동화의 끝**. 시도("아삭!")에서 멈추면 "이걸로 끝?" 하고 이야기가
  //    허공에 뜬다(사용자 피드백) → 책이 실제로 닫히는 쪽을 보여줘 릴스도 같이 닫는다.
  const storyPages = [0.2, 0.3, 0.4, 0.6, 0.9].map(pageAt);
  const storyBodies = storyPages.map(pageCaption);
  const storyImgs = storyPages.map(urlOf);

  return {
    bookTitle,
    category: storybook.category || '',
    scenes: [
      {
        // 씬 제목은 비운다 — 헤더가 이미 책 제목을 달고 있어 중복(리뷰 피드백).
        label: '',
        // 🔴 생활동화 훅 = 책의 **편식 장면 그대로**(그림 + 그 페이지 원문 "당근은 싫어!").
        //    예전엔 엄마용 블로그 카피라 이야기가 "다음 날 아침 기운이 없어요"부터 시작해
        //    편식했다는 원인이 이야기 안에 없었다(사용자 피드백). 자연/명작은 기존대로 표지+블로그 훅.
        // 🔴 bodies 로 넘겨 **한 덩어리로** 띄운다 — body 로 주면 StoryScene 이 문장 단위로 쪼개서
        //    `"당근은 싫어!` 가 1.5초 만에 지나가고 `브로콜리도 싫어!"…` 부터 보인다.
        body: isLife && hookPage ? pageCaption(hookPage) : bodyOf(sbScenes[0], 0),
        ...(isLife && hookPage ? { bodies: [pageCaption(hookPage)] } : {}),
        imageUrls: [isLife && hookPage ? urlOf(hookPage) : cover],
        durSec: durs[0],
      },
      ...bodyIdx.map((sbIdx, n) => {
        // 생활동화의 "호리 이야기"(스토리보드 [2]) 씬만 책 원문 미리보기로 대체.
        const isStory = isLife && sbIdx === 2 && storyImgs.length > 0;
        return {
          // 생활동화는 씬 라벨을 안 쓴다 — 헤더가 책 제목을 달고 있고, 라벨이 같은 자리에 계속
          // 떠 있으면 "화면이 안 넘어간 것 같다"(리뷰). 훅→이야기가 한 흐름으로 읽히게 한다.
          label: isLife ? '' : (sbScenes[sbIdx]?.label ?? ''),
          body: bodyOf(sbScenes[sbIdx], n + 1),
          ...(isStory ? { bodies: storyBodies } : {}),
          imageUrls: isStory ? storyImgs : imgsFor(n),
          durSec: durs[n + 1] ?? durs[durs.length - 1],
        };
      }),
    ],
    series: {
      covers: seriesCovers,
      // 생활동화 = 45편 전권 스크롤(라벨 없음) → 4s 로는 다 못 흘러 6s.
      ...(seriesLabels?.length ? { labels: seriesLabels } : { durSec: 6 }),
      headline: isLife ? SERIES_HEADLINE_LIFE : SERIES_HEADLINE_NATURE,
    },
  };
}
