import { lazy, Suspense, useMemo, useRef, useEffect } from 'react';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { EmbedStage } from '@/features/phonics-learner/components/EmbedStage';
import { deriveStorybookUnit } from '../lib/derive-storybook-unit';
import type { Lang } from '@tangobook/shared';

/**
 * 블로그·랜딩 안에서 **그 책의 낱말 게임을 직접 해보는** 상자 — 파닉스 `PhonicsTryIt` 의 어휘판.
 *
 * 🔴 스크린샷 대신 학습 화면과 **같은 컴포넌트**(`VocabularyStudyContent`)를 그대로 얹는다.
 *    책 블로그(자연·명작·생활)에서 「이 책 낱말」을 읽은 독자가 그 자리에서 그림짝·따라쓰기를 한다.
 * 🔴 활동/게임 코드는 한 줄도 안 고친다 — 게임은 `fixed inset-0` 로 뜨는데, `EmbedStage` 의
 *    `transform` 이 그 컨테이닝 블록이 되어 상자 안에 가둔다(파닉스와 같은 메커니즘, 그래서
 *    `EmbedStage` 를 그대로 재사용한다).
 * 🔴 **낱말이 없는 책은 조용히 접는다**(생활동화·세상탐험 등 key_objects 0 인 책). 빈 메뉴를
 *    보여주느니 상자를 안 그린다.
 * 🔴 방문자는 계정이 없어 별/진척은 안 남지만(에러 아님), 게임은 그대로 돌아간다.
 */
const VocabularyStudyContent = lazy(() =>
  import('./VocabularyStudyContent').then((m) => ({ default: m.VocabularyStudyContent }))
);

interface Props {
  /** 실제 책 id(숫자 슬러그). 이 책의 key_objects 로 낱말 게임을 만든다. */
  storybookId: string;
  lang?: Lang;
  /** 상자 제목. 없으면 기본 문구. */
  title?: string;
  /** 상자 아래 한 줄 안내. */
  note?: string;
}

export function VocabTryIt({ storybookId, lang = 'ko', title, note }: Props) {
  const { data: book } = useStorybook(storybookId);
  const boxRef = useRef<HTMLDivElement>(null);

  // 활성 그림체 = 책 대표(defaultStyle → artStyle → 첫 그림체). RandomVocabStudyPage 와 동일 규칙.
  const currentStyle = useMemo(() => {
    if (!book) return undefined;
    const styles =
      book.availableStyles && book.availableStyles.length > 0
        ? book.availableStyles
        : Object.keys(book.styleAssets ?? {});
    const inStyles = (s?: string) => (s && styles.includes(s) ? s : undefined);
    return inStyles(book.defaultStyle) ?? inStyles(book.artStyle) ?? styles[0];
  }, [book]);

  const unit = useMemo(
    () => (book ? deriveStorybookUnit(book, currentStyle) : null),
    [book, currentStyle]
  );

  // 도달률 계측 — 상자가 화면에 들어오면 GA4 로 한 번(파닉스 상자와 같은 패턴).
  const sent = useRef(false);
  useEffect(() => {
    const el = boxRef.current;
    if (!el || !unit || unit.words.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (sent.current || !entries.some((e) => e.isIntersecting)) return;
        sent.current = true;
        (window as unknown as { gtag?: (...a: unknown[]) => void }).gtag?.(
          'event',
          'vocab_tryit_view',
          {
            book: storybookId,
          }
        );
      },
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [unit, storybookId]);

  if (!book || !unit || unit.words.length === 0) return null; // 낱말 없는 책은 접는다

  return (
    <div
      ref={boxRef}
      className="my-7 -mx-4 overflow-hidden rounded-3xl border border-coral-200 bg-white shadow-sm sm:mx-0"
    >
      <div className="flex items-center justify-between gap-3 border-b border-ink-100 px-5 py-3">
        <span className="text-xl font-extrabold text-ink-800 break-keep lg:text-2xl">
          {title ?? '📚 이 책 낱말로 놀기'}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-coral-700 px-3 py-1.5 text-sm font-extrabold text-white">
          <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
          바로 해보기
        </span>
      </div>

      {/* 🔴 게임이 `fixed inset-0` 로 뜨므로 상자는 뷰포트 높이(`100dvh`)로 잡는다 — 게임 내부가
          `vh` 로 칸을 재기 때문에, 낮은 상자에 담으면 아래가 잘린다(EmbedStage 주석 참조). */}
      <EmbedStage height="100dvh">
        <Suspense fallback={null}>
          <VocabularyStudyContent
            unit={unit}
            storybook={book}
            currentStyle={currentStyle}
            lang={lang}
          />
        </Suspense>
      </EmbedStage>

      {note && (
        <div className="bg-cream-50 px-5 py-4 text-center text-sm text-ink-600 break-keep lg:text-base">
          {note}
        </div>
      )}
    </div>
  );
}
