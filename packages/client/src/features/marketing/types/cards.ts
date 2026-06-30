import type { BlogCard, InstagramCard } from './database';

/**
 * Typed view of the `BlogCard.content` JSONB column.
 *
 * The DB schema uses `Record<string, unknown>` for forward compatibility,
 * but in practice every blog card stores these fields.  Use {@link getBlogCardContent}
 * to cast from the raw DB row to this shape.
 */
export interface BlogCardContent {
  text?: string;
  url?: string;
  alt?: string;
  caption?: string;
  image_prompt?: string;
  image_style?: string;
}

export function getBlogCardContent(card: BlogCard): BlogCardContent {
  return (card.content ?? {}) as BlogCardContent;
}

/**
 * Global style applied to all cards of a blog post (align, font, sizes…).
 * Persisted in `BlogContent.seo_details.globalStyle`.
 */
export interface GlobalCardStyle {
  align?: 'left' | 'center' | 'right' | 'justify';
  headingBold?: boolean;
  bodyBold?: boolean;
  headingFont?: string;
  bodyFont?: string;
  headingSize?: number;
  bodySize?: number;
}

/** A positioned, styled text block within an Instagram card canvas. */
export interface TextBlock {
  id: string;
  text: string;
  /** % from left (0-100) */
  x: number;
  /** % from top (0-100) */
  y: number;
  fontSize: number;
  color: string;
  fontFamily?: string;
  fontWeight: 'normal' | 'bold';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  /** % of card width */
  width: number;
  /** % of card height (auto if undefined) */
  height?: number;
  /** Hide this block from the canvas. */
  hidden?: boolean;
  shadow?: boolean;
  /** 줄 간격 배수 (미지정 시 1.4). 제목은 1.1~1.2로 타이트하게. */
  lineHeight?: number;
  /** 알약(pill) 배경 — 카테고리 라벨·페이지 배지용. 텍스트 폭에 맞춰 둥근 배경. */
  pill?: boolean;
  /** pill 배경색 (pill=true일 때). 미지정 시 옅은 회색. */
  pillColor?: string;
  /**
   * 이 블록이 들어갈 영역 높이(% of card height). 지정 시 텍스트가 이 높이를
   * 넘지 않도록 fontSize 를 baseSize(=fontSize)에서 자동으로 줄인다(zone fit).
   * 헤더/본문 영역에 길이 무관하게 맞추기 위함 — 겹침/넘침 방지.
   */
  fitHeight?: number;
}

/** Canvas state for a single Instagram card (cardnews slide). */
export interface CardCanvasData {
  bgColor: string;
  imageUrl: string | null;
  /** object-position Y (%) — used in full-width mode (no imageRect). */
  imageY: number;
  /**
   * 이미지 박스 모드. 지정 시 이미지를 너비-full 대신 이 영역(% of canvas)에
   * cover 배치하고 라운드 처리한다(제목 위 / 이미지 중앙 / 내용 아래 레이아웃용).
   */
  imageRect?: { x: number; y: number; w: number; h: number };
  /** 제목/이미지와 본문을 가르는 짧은 구분선 (% 좌표). */
  divider?: { y: number; x?: number; w?: number; color: string };
  textBlocks: TextBlock[];
}

/** Loose view of the legacy `text_style` shape kept on the DB row. */
export function getInstagramCardStyle(card: InstagramCard): Record<string, unknown> {
  return (card.text_style ?? {}) as Record<string, unknown>;
}
