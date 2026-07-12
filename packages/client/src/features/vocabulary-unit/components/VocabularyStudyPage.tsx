import { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Skeleton, Chip, Mascot, PageHeader } from '@/design-system';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import type { Lang, VocabularyUnit, VocabularyUnitWord } from '@tangobook/shared';
import { useVocabularyUnit } from '../hooks/useVocabularyUnits';
import { isStorybookUnitId, storybookIdFromUnitId } from '../lib/derive-storybook-unit';
import { VocabularyStudyContent } from './VocabularyStudyContent';

const HANGUL_RE = /[가-힣]/;
const ENGLISH_RE = /^[a-zA-Z]+$/;

/** 단원 단어 목록에 lang 데이터가 충분한지 — 토글 노출/disabled 결정용 */
function hasLangData(words: VocabularyUnitWord[], lang: Lang): boolean {
  if (lang === 'ko') {
    return words.some((w) => (w.korean && w.korean.trim()) || HANGUL_RE.test(w.word));
  }
  if (lang === 'en') {
    return words.some((w) => (w.nameEn && w.nameEn.trim()) || ENGLISH_RE.test(w.word));
  }
  // vi/zh/th: 번역된 단어가 하나라도 있으면 노출
  return words.some((w) => !!w.nameTranslations?.[lang]?.trim());
}

/** 어휘 학습 언어 토글 — 콘텐츠 완비 5개(런칭 타겟) 고정 순서. */
const LANG_CHIPS: { code: Lang; label: string }[] = [
  { code: 'ko', label: '한국어' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Tiếng Việt' },
  { code: 'zh', label: '中文' },
  { code: 'th', label: 'ไทย' },
];

function getDisplayUnitName(unit: VocabularyUnit, lang: Lang): string {
  if (lang === 'ko') return unit.nameKo;
  return unit.nameEn ?? unit.nameKo;
}

/**
 * 단원 학습 풀화면 (/vocabulary/:unitId).
 *
 * 표지 hero + 호리/말풍선 + 학습 콘텐츠 (단어 미리보기 + 게임 카드).
 * 학습 콘텐츠는 BookDetailPage 와 공유 — `VocabularyStudyContent` 컴포넌트.
 *
 * MVP 시점 진입: 사이드바 어휘 axis 는 "준비 중" 음영이라 직접 URL 또는 책 detail 의
 * "단어 익히기" 카드 → 책 detail inline 섹션 흐름이 메인. 이 페이지는 라우트 보존
 * 용도 (직접 URL 접근 시 동작) + 어휘 단원 단독 학습 시 fallback.
 */
export function VocabularyStudyPage() {
  const { unitId } = useParams<{ unitId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // 책 상세에서 넘어온 선택 그림체/언어 (?style=&lang=). 그림체는 여기서 바꾸지 않으므로 URL 값만 읽음
  // (게임 화면에선 그림체 수정 불가 — 책 상세에서 정한 그림체를 그대로 사용).
  const selectedStyle = searchParams.get('style') ?? undefined;
  const [lang, setLang] = useState<Lang | null>((searchParams.get('lang') as Lang) || null);

  // storybook 을 unitId 에서 직접 파싱해 먼저 fetch — activeStyle 을 derive 전에 계산하기 위함
  // (unit→storybook→style→unit 순환 회피). book 단원이 아니면 undefined.
  const bookId = unitId && isStorybookUnitId(unitId) ? storybookIdFromUnitId(unitId) : undefined;
  const { data: storybook } = useStorybook(bookId ?? undefined);

  // 선택 가능한 그림체 목록 + 현재 활성 그림체 (선택 → 대표 → 활성 폴백).
  const styles: string[] =
    storybook?.availableStyles && storybook.availableStyles.length > 0
      ? storybook.availableStyles
      : storybook?.styleAssets
        ? Object.keys(storybook.styleAssets)
        : [];
  // 활성 그림체는 반드시 선택지(styles=availableStyles) 안에서 고름 — defaultStyle/artStyle 이
  // availableStyles 에 없는 stale 값(예: 하이디 defaultStyle=pixar-3d)이면 라벨이 "그림체 N" 으로
  // 폴백되고 게임 이미지도 엉뚱해지므로 styles 로 제한 후 styles[0] 최종 폴백.
  const inStyles = (s: string | undefined) => (s && styles.includes(s) ? s : undefined);
  const activeStyle: string | undefined =
    inStyles(selectedStyle) ??
    inStyles(storybook?.defaultStyle) ??
    inStyles(storybook?.artStyle) ??
    styles[0];

  // 활성 그림체를 derive 에 전달 → 게임/미리보기/모달 이미지가 그 그림체로 나옴.
  // (derive 는 캐시된 책 데이터 계산이라 그림체 변경 시 재fetch 없이 재derive.)
  const { data: unit, isLoading } = useVocabularyUnit(unitId, activeStyle);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50">
        <Skeleton className="w-80 h-96 rounded-3xl" />
      </div>
    );
  }

  if (!unit) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-b from-amber-100 via-yellow-50 to-cream-50 text-center">
        <Mascot state="thinking" size="lg" />
        <h2 className="mt-4 text-2xl font-black text-ink-900 font-display">
          단원을 찾을 수 없어요
        </h2>
        <button
          onClick={() => navigate('/library')}
          className="mt-6 px-5 py-3 rounded-full bg-amber-500 text-white font-black shadow-pop"
        >
          🏠 라이브러리로
        </button>
      </div>
    );
  }

  const availableLangs = LANG_CHIPS.filter((c) => hasLangData(unit.words, c.code));
  const effectiveLang: Lang =
    (lang && hasLangData(unit.words, lang) ? lang : null) ??
    (unit.language && hasLangData(unit.words, unit.language) ? unit.language : null) ??
    availableLangs[0]?.code ??
    'ko';

  const displayName = getDisplayUnitName(unit, effectiveLang);

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="px-6 max-w-[1600px] mx-auto">
        <PageHeader
          onBack={() => navigate(bookId ? `/library/${bookId}` : '/library')}
          onHome={() => navigate('/library')}
          right={
            availableLangs.length > 1 ? (
              <div className="bg-white rounded-full px-2 py-1.5 shadow-soft flex gap-1 flex-wrap">
                {availableLangs.map((c) => (
                  <Chip
                    key={c.code}
                    variant="coral"
                    active={effectiveLang === c.code}
                    onClick={() => setLang(c.code)}
                    aria-label={c.label}
                    className="!text-base sm:!text-lg !px-4 sm:!px-6 !py-2.5"
                  >
                    {c.label}
                  </Chip>
                ))}
              </div>
            ) : null
          }
        >
          <img
            src="/icons/book/header.webp"
            alt=""
            aria-hidden
            className="w-12 h-12 lg:w-14 lg:h-14 object-contain flex-shrink-0 mr-3"
          />
          <span className="truncate">{displayName}</span>
        </PageHeader>
      </div>

      <main className="px-4 sm:px-8 pt-4 pb-6 max-w-[1600px] mx-auto">
        {/* 시안에는 표지 hero 없음 — 바로 단어 미리보기 + 게임 카드.
            그림체 선택(여러 그림체 보유 책만)은 "단어 둘러보기" 헤딩 줄 오른쪽에 배치.
            선택 시 게임/미리보기 이미지가 그 그림체로 재derive. 실명 비노출 → 장르 라벨. */}
        <VocabularyStudyContent
          unit={unit}
          storybook={storybook ?? undefined}
          currentStyle={activeStyle}
          lang={effectiveLang}
        />
      </main>
    </div>
  );
}
