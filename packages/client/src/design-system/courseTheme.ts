import type { CSSProperties } from 'react';
import { colors } from './tokens/colors';

export type CourseLanguage = 'korean' | 'english';

export const courseThemes = {
  korean: {
    surface: 'bg-peach-200 border-peach-300 hover:border-coral-700',
    selected: 'bg-peach-200 text-ink-900 border-coral-700',
    badge: 'bg-peach-200 text-coral-800',
    hover: 'hover:bg-peach-200',
    text: 'text-coral-700',
    action: 'bg-coral-700 text-white hover:bg-coral-800',
    ring: 'ring-coral-700',
    focus:
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-700',
    style: {
      '--course-accent': colors.coral[700],
      '--course-soft': colors.peach[100],
      '--course-surface': colors.peach[200],
      '--course-border': colors.peach[300],
      '--course-label': colors.coral[800],
    } as CSSProperties,
  },
  english: {
    surface: 'bg-mint-200 border-mint-300 hover:border-mint-700',
    selected: 'bg-mint-200 text-ink-900 border-mint-700',
    badge: 'bg-mint-200 text-mint-700',
    hover: 'hover:bg-mint-200',
    text: 'text-mint-700',
    action: 'bg-mint-700 text-white hover:brightness-95',
    ring: 'ring-mint-700',
    focus:
      'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-mint-700',
    style: {
      '--course-accent': colors.mint[700],
      '--course-soft': colors.mint[100],
      '--course-surface': colors.mint[200],
      '--course-border': colors.mint[300],
      '--course-label': colors.mint[700],
    } as CSSProperties,
  },
} satisfies Record<CourseLanguage, Record<string, string | CSSProperties>>;

/** 학습 콘텐츠 언어를 기준으로 한다. UI 번역 언어와는 별개다. */
export function getCourseTheme(language: string) {
  if (language === 'ko' || language === 'korean') return courseThemes.korean;
  if (language === 'en' || language === 'english') return courseThemes.english;
  return undefined;
}
