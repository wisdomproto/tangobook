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
  /** 풀스크린 이미지 — 자막 숨김 + padding 0 (이미지가 화면 가득) */
  fullscreen?: boolean;
}

// 책 페이지 넘기는 효과 — rotateY + x slide. forward 시 우측에서 회전하며 들어옴.
const variants = {
  enter: (d: number) => ({
    x: d > 0 ? '60%' : '-60%',
    rotateY: d > 0 ? -55 : 55,
    opacity: 0,
  }),
  center: { x: 0, rotateY: 0, opacity: 1 },
  exit: (d: number) => ({
    x: d > 0 ? '-60%' : '60%',
    rotateY: d > 0 ? 55 : -55,
    opacity: 0,
  }),
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
  fullscreen,
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
        // 첫 페이지(pageIndex=0) 진입 시는 enter 애니메이션 skip — 깜박이는 회전 잔상 방지.
        // 페이지 넘김(pageIndex>0)일 때만 책 페이지 넘기는 효과 적용.
        initial={pageIndex === 0 ? false : 'enter'}
        animate="center"
        exit="exit"
        transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 180, damping: 26 }}
        style={{
          transformPerspective: 1400,
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden',
        }}
        className={
          fullscreen
            ? 'absolute inset-0 flex items-center justify-center'
            : 'absolute inset-0 flex flex-col items-center justify-end gap-2 sm:gap-3 px-2 sm:px-8 pt-28 pb-6 sm:pb-8'
        }
      >
        {fullscreen ? (
          // 풀스크린 — 이미지만 가득
          page.illustrationUrl && (
            <img src={page.illustrationUrl} alt="" className="w-full h-full object-contain" />
          )
        ) : (
          <>
            <div className="flex-1 w-full flex items-center justify-center min-h-0">
              {page.illustrationUrl && (
                <img
                  src={page.illustrationUrl}
                  alt=""
                  className="max-w-full max-h-full object-contain rounded-lg shadow-card"
                />
              )}
            </div>
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
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
