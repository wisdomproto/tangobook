import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Page } from '@tangobook/shared';
import type { LangCode } from '@/lib/storybook-accessors';
import { cn } from '@/lib/cn';
import { getPageText } from '../lib/page-text';
import type { ViewerSettings } from '../hooks/useViewerSettings';

interface PageViewProps {
  page: Page;
  pageIndex: number;
  direction: number; // 1 forward, -1 backward
  lang: LangCode;
  showSubtext?: boolean; // ko가 아닐 때 원문 병기 옵션
  textSize?: 'sm' | 'md' | 'lg';
  isDarkMode?: boolean;
}

const TEXT_CLASS: Record<NonNullable<PageViewProps['textSize']>, string> = {
  sm: 'text-lg', // 18px
  md: 'text-xl', // 20px
  lg: 'text-2xl', // 24px
};

const variants = {
  enter: (d: number) => ({ x: d > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d > 0 ? '-100%' : '100%', opacity: 0 }),
};

const reducedVariants = {
  enter: { opacity: 0 },
  center: { opacity: 1 },
  exit: { opacity: 0 },
};

const stripBold = (s: string) => s.replace(/\*\*/g, '');

export function PageView({
  page,
  pageIndex,
  direction,
  lang,
  showSubtext,
  textSize = 'md',
  isDarkMode,
}: PageViewProps) {
  const reduce = useReducedMotion();

  const text = useMemo(() => stripBold(getPageText(page, lang)), [page, lang]);
  const subText = useMemo(
    () => (showSubtext && lang !== 'ko' && page.text !== text ? stripBold(page.text) : null),
    [page, text, showSubtext, lang]
  );

  return (
    <AnimatePresence mode="wait" initial={false} custom={direction}>
      <motion.div
        key={pageIndex}
        custom={direction}
        variants={reduce ? reducedVariants : variants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 160, damping: 20 }}
        className="absolute inset-0 flex items-center justify-center p-10 md:p-14"
      >
        {page.illustrationUrl && (
          <img
            src={page.illustrationUrl}
            alt=""
            className="max-w-[60%] max-h-[60vh] object-contain rounded-lg shadow-card"
          />
        )}

        {/* 텍스트 카드 */}
        <div
          className={cn(
            'absolute left-16 right-16 bottom-28 backdrop-blur-sm rounded-lg px-7 py-5 shadow-card text-center font-bold leading-snug',
            isDarkMode ? 'bg-white/10 text-darktext' : 'bg-white/92 text-ink-900',
            TEXT_CLASS[textSize]
          )}
        >
          <div>{text}</div>
          {subText && (
            <div
              className={cn(
                'mt-1 text-sm font-semibold',
                isDarkMode ? 'text-ink-300' : 'text-ink-700'
              )}
            >
              {subText}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

// Legacy exports retained for backward compatibility until ViewerContainer is fully refactored.
// CoverView / EndView consumers will be removed in a follow-up refactor.
interface CoverViewProps {
  coverImage?: string;
  title: string;
  settings: ViewerSettings;
}

export function CoverView({ coverImage, title, settings }: CoverViewProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 gap-6">
      {coverImage ? (
        <img
          src={coverImage}
          alt="표지"
          className="max-h-[65vh] max-w-full object-contain rounded-xl shadow-2xl aspect-[4/3]"
        />
      ) : null}
      <h2
        className={`text-3xl font-bold text-center ${
          settings.darkMode ? 'text-white' : 'text-ink-900'
        }`}
      >
        {title}
      </h2>
    </div>
  );
}

interface EndViewProps {
  onRestart: () => void;
  onBack: () => void;
  darkMode: boolean;
}

export function EndView({ onRestart, onBack, darkMode }: EndViewProps) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 w-full px-4 gap-6">
      <p className={`text-2xl font-medium ${darkMode ? 'text-white/90' : 'text-ink-900'}`}>끝</p>
      <div className="flex gap-3 mt-4">
        <button
          onClick={onRestart}
          className="px-6 py-3 bg-coral-500 hover:bg-coral-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          다시 읽기
        </button>
        <button
          onClick={onBack}
          className={`px-6 py-3 rounded-xl text-sm font-medium transition-colors ${
            darkMode
              ? 'bg-white/10 hover:bg-white/20 text-white'
              : 'bg-peach-100 hover:bg-peach-200 text-ink-900'
          }`}
        >
          목록으로
        </button>
      </div>
    </div>
  );
}
