import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Page } from '@tangobook/shared';
import type { LangCode } from '@/lib/storybook-accessors';
import { cn } from '@/lib/cn';
import { getPageText } from '../lib/page-text';

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
