/**
 * 개구리 왕자 릴스 씬 데이터 — 마케팅 스토리보드(1772009873865) 기반.
 * 실제 동화책 삽화(styleAssets[artStyle].pageIllustrations)를 public/reels/frog 로 복사해 사용.
 * 9:16 · 30fps · 총 36초. 스토리보드 5장면(훅·원작배경·줄거리·교훈·CTA) 순서/시간 유지.
 */
export const FROG_FPS = 30;
export const FROG_WIDTH = 1080;
export const FROG_HEIGHT = 1920;

export interface FrogScene {
  label: string; // 스토리보드 장면 라벨(칩)
  caption: string; // 하단 자막
  images: string[]; // staticFile 경로 (reels/frog/*.webp), 시간 균등 분할 켄번즈
  durationSec: number;
}

/** 스토리보드 순서대로 실제 삽화를 매핑. page1=황금공 공주 … page15=해피엔딩. */
export const FROG_SCENES: FrogScene[] = [
  {
    label: '개구리 왕자',
    caption: '어떤 동화일까요?',
    images: ['reels/frog/page1.webp'],
    durationSec: 4,
  },
  {
    label: '원작 이야기',
    caption: '그림 형제 동화집의\n첫 번째 이야기',
    images: ['reels/frog/page2.webp', 'reels/frog/page3.webp', 'reels/frog/page4.webp'],
    durationSec: 8,
  },
  {
    label: '줄거리',
    caption: '연못에 빠진 황금 공,\n그리고 개구리와의 약속',
    images: [
      'reels/frog/page5.webp',
      'reels/frog/page6.webp',
      'reels/frog/page8.webp',
      'reels/frog/page9.webp',
    ],
    durationSec: 8,
  },
  {
    label: '교훈',
    caption: '약속은 지키고,\n겉모습이 아닌 마음을 보아요',
    images: [
      'reels/frog/page10.webp',
      'reels/frog/page11.webp',
      'reels/frog/page12.webp',
      'reels/frog/page13.webp',
    ],
    durationSec: 8,
  },
];

/**
 * 그림체 모핑 씬: 같은 장면(12페이지 변신)을 이 책의 3개 그림체로 빠르게 넘김.
 * 라벨은 학습자 노출용 장르명(수채동화풍·페이퍼 3D 아트·콜라주) — 스튜디오 실명 아님.
 */
export const FROG_STYLE_SHOWCASE = {
  title: '다양한 그림체로',
  // 그림체 전환에 맞춰 한 줄씩 쌓이는 메시지(마지막 줄 코랄 강조).
  lines: ['탱고북에선', '한 권의 이야기를', '아이의 취향대로 고를 수 있습니다'],
  durationSec: 6, // 3 그림체 × 2초
  styles: [
    { src: 'reels/frog/style-collage.webp', label: '콜라주' },
    { src: 'reels/frog/style-watercolor.webp', label: '수채동화풍' },
    { src: 'reels/frog/style-paper3d.webp', label: '페이퍼 3D 아트' },
  ],
};

/** 배경음악 (탱고북 메인 BGM main-1, 경쾌·30초 루프). */
export const FROG_BGM = 'reels/frog/bgm.mp3';

/** CTA 씬: 로고 + 7일 무료 체험 카드만. */
export const FROG_CTA = {
  cardSec: 6,
};

export const FROG_DURATION =
  (FROG_SCENES.reduce((s, sc) => s + sc.durationSec, 0) +
    FROG_STYLE_SHOWCASE.durationSec +
    FROG_CTA.cardSec) *
  FROG_FPS; // 28 + 5 + 6 = 39s → 1170 frames
