import { useMemo } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import type { Page } from '@tangobook/shared';
import type { LangCode } from '@/lib/storybook-accessors';
import { getPageText } from '../lib/page-text';
import { PageSubtitle } from './PageSubtitle';

interface PageViewProps {
  page: Page;
  pageIndex: number;
  direction: number; // 1 forward, -1 backward
  lang: LangCode;
  showSubtext?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
  isDarkMode?: boolean;
  ttsCurrentTime?: number;
  ttsDuration?: number;
  isTtsPlaying?: boolean;
}

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
  ttsCurrentTime,
  ttsDuration,
  isTtsPlaying,
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
        className="absolute inset-0 flex flex-col items-center justify-end gap-4 sm:gap-6 px-4 sm:px-16 pt-24 pb-24 sm:pb-28"
      >
        {/* 상단: 이미지 영역 (flex-1) */}
        <div className="flex-1 w-full flex items-center justify-center min-h-0">
          {page.illustrationUrl && (
            <img
              src={page.illustrationUrl}
              alt=""
              className="max-w-full max-h-full object-contain rounded-lg shadow-card"
            />
          )}
        </div>

        {/* 하단: 자막 (고정 높이, 이미지와 겹치지 않음) */}
        <div className="w-full flex-shrink-0">
          <PageSubtitle
            text={text}
            subText={subText}
            textSize={textSize}
            isDarkMode={isDarkMode}
            ttsCurrentTime={ttsCurrentTime}
            ttsDuration={ttsDuration}
            isTtsPlaying={isTtsPlaying}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
