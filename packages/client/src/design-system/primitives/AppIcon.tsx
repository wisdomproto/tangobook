import { type CSSProperties } from 'react';
import { cn } from '@/lib/cn';

/**
 * 탱고북 커스텀 아이콘 (PNG / SVG / WebP).
 * `public/icons/{path}` 또는 외부 URL 모두 지원.
 *
 * 디자인 시스템 톤: coral #FF6F61 / peach #FFE4D6 배경 둥근 사각형.
 * 자세한 카탈로그: design/tangobook-icon-system.pen 참고.
 */
export interface AppIconProps {
  /**
   * 아이콘 경로. 다음 중 하나:
   * - `category/animal.png` (`/icons/` 자동 prefix)
   * - `tab/activity.svg`
   * - `mascot/hori/idle.webp` (마스코트는 그대로 root 경로 사용)
   * - `https://...` (외부 URL)
   */
  src: string;
  /** 픽셀 사이즈 (정사각). 기본 48 */
  size?: number;
  /** 추가 className (rounded / shadow 등) */
  className?: string;
  /** 접근성 — 의미 있는 아이콘이면 alt 채움. 장식이면 빈 문자열 그대로. */
  alt?: string;
  /** 인라인 style 오버라이드 */
  style?: CSSProperties;
}

function resolveSrc(src: string): string {
  if (src.startsWith('http') || src.startsWith('/')) return src;
  // 마스코트는 /mascot/ 으로 시작하면 root 경로
  if (src.startsWith('mascot/')) return `/${src}`;
  return `/icons/${src}`;
}

export function AppIcon({ src, size = 48, className, alt = '', style }: AppIconProps) {
  return (
    <img
      src={resolveSrc(src)}
      alt={alt}
      width={size}
      height={size}
      className={cn('inline-block select-none', className)}
      style={{ width: size, height: size, ...style }}
      draggable={false}
    />
  );
}
