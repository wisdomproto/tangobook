// 네이버 블로그 카테고리별 설정 — 발행기(publish-naver-blog)·스케줄러(schedule-naver-drafts) 공용.
//
// 🔴 예전엔 태그·홍보문구·MATCH 가 전부 **자연관찰로 하드코딩**돼 있었다. 카테고리별 하루 1편
//    (자연·명작·파닉스 시간차)을 돌리려면 이 셋이 카테고리를 따라야 한다. 안 그러면 명작·파닉스 글에도
//    「자연관찰 그림책」 문구가 붙는다.
// 🔴 파닉스는 **동화가 아니라 학습**이라 홍보 링크가 `/library`(전체)가 아니라 `/library/phonics/korean`.

export interface NaverCategory {
  /** 태그 10개(첫 자리엔 제목 첫 토큰이 들어간다). 네이버는 한 글에 태그 최대 30개. */
  tags: (firstToken: string) => string[];
  /** 글 끝 CTA 직전에 넣는 "서비스 전체로 보내는" 한 줄 + 단독 URL(네이버가 OG 카드로 변환). */
  promoLines: string[];
}

export const NAVER_CATEGORIES: Record<string, NaverCategory> = {
  nature: {
    tags: (t) => [
      t,
      `${t}그림책`,
      '유아그림책',
      '자연관찰',
      '자연관찰책',
      '유아자연관찰',
      '4세그림책',
      '5세그림책',
      '6세그림책',
      '탱고북',
    ],
    promoLines: [
      '탱고북에는 아이와 함께 볼 자연관찰 그림책이 100권 넘게 있어요.',
      'https://tangobook.co.kr/library',
    ],
  },
  classic: {
    tags: (t) => [
      t,
      `${t}동화`,
      '유아그림책',
      '세계명작',
      '명작동화',
      '세계명작동화',
      '4세그림책',
      '5세그림책',
      '6세그림책',
      '탱고북',
    ],
    promoLines: [
      '탱고북에는 아이와 함께 볼 세계명작 동화가 50편 넘게 있어요.',
      'https://tangobook.co.kr/library',
    ],
  },
  phonics: {
    tags: (t) => [
      t,
      '한글파닉스',
      '한글떼기',
      '한글공부',
      '유아한글',
      '한글자음',
      '한글모음',
      '4세한글',
      '5세한글',
      '탱고북',
    ],
    // 🔴 파닉스는 학습 페이지로. 「그림책」이 아니라 「직접 눌러보며 익히는」 프레이밍.
    promoLines: [
      '탱고북에는 아이 혼자 눌러보며 배우는 한글 파닉스 32단원이 있어요.',
      'https://tangobook.co.kr/library/phonics/korean',
    ],
  },
};

export function naverCategory(cat: string): NaverCategory {
  return NAVER_CATEGORIES[cat] ?? NAVER_CATEGORIES.nature;
}
