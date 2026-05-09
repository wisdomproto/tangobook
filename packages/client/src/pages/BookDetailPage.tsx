import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStorybook, useStorybooks } from '@/features/storybook';
import {
  getYoutubeVideoIds,
  getDirectVideoUrls,
  getAvailableStyles,
} from '@/lib/storybook-accessors';
import { Card, StateScreen, Skeleton, Chip } from '@/design-system';
import { cn } from '@/lib/cn';
import { YouTubeModal } from '@/features/viewer/components/YouTubeModal';
import { getArtStyleLabel } from '@tangobook/shared';
import type { ReadingLevel, StorybookSummary } from '@tangobook/shared';

const LANG_LABEL: Record<string, { flag: string; name: string }> = {
  ko: { flag: '🇰🇷', name: '한국어' },
  en: { flag: '🇺🇸', name: 'English' },
  ja: { flag: '🇯🇵', name: '日本語' },
};

const LEVEL_INFO: Record<ReadingLevel, { label: string; age: string }> = {
  L1: { label: '씨앗', age: '3~4세' },
  L2: { label: '새싹', age: '4~6세' },
  L3: { label: '나무', age: '6~7세' },
};

const LEVEL_ORDER: ReadingLevel[] = ['L1', 'L2', 'L3'];

export default function BookDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  // v1 단일화 — useStorybook(id) 를 메인 source 로, useStorybooks() 로 sibling 조회.
  // 4-25~26 v2 시도 폐기 후 BookDetail 도 v1 으로 정리.
  const { data: storybook, isLoading, isError } = useStorybook(id);
  const { data: allStorybooks } = useStorybooks();

  const [lang, setLang] = useState<string>('ko');
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [videoIdToPlay, setVideoIdToPlay] = useState<string | null>(null);

  // 영상 / 게임 가용성 — v1 storybook 직접 derive
  const youtubeVideoIds = useMemo(
    () => (storybook ? getYoutubeVideoIds(storybook) : []),
    [storybook]
  );
  const directVideoUrls = useMemo(
    () => (storybook ? getDirectVideoUrls(storybook) : []),
    [storybook]
  );
  const videoAvailable = youtubeVideoIds.length > 0 || directVideoUrls.length > 0;
  // KeyObject 1개 이상이면 "단어 익히기" 모드 카드 노출 (클릭 → /vocabulary/book-:id 학습 페이지).
  // 책 상세 = 진입점만, 학습 자체는 별도 페이지로 분리 (busy 해소).
  const vocabAvailable = (storybook?.key_objects?.length ?? 0) > 0;
  const vocabWordCount = storybook?.key_objects?.length ?? 0;

  // 레벨 sibling 추출 — 현재 책의 baseId 기준으로 같은 base 의 sibling __L1/L2/L3 찾기
  // (StorybookSummary 는 readingLevel 미포함 이라 id suffix 로 level 유추, base 자체는 storybook.readingLevel)
  const baseId = useMemo(() => id.replace(/__L\d$/, ''), [id]);
  const baseLevel = storybook?.readingLevel as ReadingLevel | undefined;

  const levelMap = useMemo<Map<ReadingLevel, StorybookSummary | { coverImage?: string }>>(() => {
    const map = new Map<ReadingLevel, StorybookSummary | { coverImage?: string }>();
    if (!allStorybooks) return map;
    // 현재 책 (sibling 또는 base 자체)
    if (baseLevel) {
      const selfSummary = allStorybooks.find((s) => s.id === id);
      if (selfSummary) map.set(baseLevel, selfSummary);
    }
    // sibling __L{n}
    allStorybooks.forEach((s) => {
      const m = s.id.match(/^(.+)__L(\d)$/);
      if (!m) return;
      if (m[1] !== baseId) return;
      const lv = `L${m[2]}` as ReadingLevel;
      if (!LEVEL_ORDER.includes(lv)) return;
      // 자기 자신은 위에서 처리됨
      if (s.id === id) return;
      map.set(lv, s);
    });
    return map;
  }, [allStorybooks, baseId, baseLevel, id]);

  // 학습자에게 노출 가능한 레벨 — isPublic + 표지 보유. base 책 자체는 항상 노출.
  const levels = useMemo<ReadingLevel[]>(() => {
    return Array.from(levelMap.entries())
      .filter(([lv, s]) => {
        if (lv === baseLevel) return true;
        return !!(s as StorybookSummary).isPublic && !!(s as StorybookSummary).coverImage;
      })
      .map(([lv]) => lv)
      .sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  }, [levelMap, baseLevel]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream-50 p-7 max-w-[1200px] mx-auto">
        <Skeleton className="h-12 w-32 mb-5" />
        <div className="grid grid-cols-1 md:grid-cols-[480px_1fr] gap-9">
          <Skeleton className="aspect-video rounded-lg" />
          <div className="flex flex-col gap-3">
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-20 w-full mt-2" />
          </div>
        </div>
      </div>
    );
  }

  if (isError || !storybook) {
    return (
      <StateScreen
        mascotState="sad"
        title="이 책을 찾을 수 없어"
        description="다른 책 볼래?"
        action={{ label: '🏠 라이브러리로', onClick: () => navigate('/library') }}
      />
    );
  }

  const languages =
    storybook.languages && storybook.languages.length > 0 ? storybook.languages : ['ko'];
  const styles = getAvailableStyles(storybook);

  // 효과 레벨/스타일 (URL params에 전달용)
  const launchLevel = storybook.curriculumMeta?.launchLevel;
  const effectiveLevel =
    selectedLevel ??
    (launchLevel && levels.includes(launchLevel) ? launchLevel : levels[0]) ??
    baseLevel;
  const effectiveStyle = selectedStyle ?? styles[0];

  // 활성 그림체 기반 표지 URL — styleAssets 우선, fallback to top-level
  const coverUrl =
    (effectiveStyle && storybook.styleAssets?.[effectiveStyle]?.coverImage) ?? storybook.coverImage;

  const enterMode = (mode: 'read' | 'video' | 'vocab') => {
    if (mode === 'video') {
      const vid = youtubeVideoIds[0];
      if (vid) {
        setVideoIdToPlay(vid);
        setVideoOpen(true);
        return;
      }
      const url = directVideoUrls[0];
      if (url) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    // 다른 레벨 선택 시 sibling storybook 으로 navigate (v1 sibling pattern: ${baseId}__L{n})
    const targetId =
      effectiveLevel && effectiveLevel !== baseLevel
        ? `${baseId}__${effectiveLevel}`
        : storybook.id;
    if (mode === 'vocab') {
      // 어휘 탭의 책별 derive 단원으로 직접 이동 (Phase 1 §6.3 회유 동선)
      navigate(`/vocabulary/book-${targetId}`);
      return;
    }
    const qs = new URLSearchParams({ lang });
    if (effectiveStyle) qs.set('style', effectiveStyle);
    navigate(`/viewer/${targetId}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 flex flex-col">
      <div className="max-w-[1200px] mx-auto p-4 md:p-5 w-full flex flex-col flex-1">
        {/* 헤더 — 좌: ← 라이브러리 / 우 inline: 언어 + 그림체 chip. variation row 박스 없이 단순. */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <button
            onClick={() => navigate('/library')}
            className="inline-flex items-center gap-2 text-base font-black text-ink-700 hover:text-ink-900 transition"
            aria-label="라이브러리로 돌아가기"
          >
            <span className="text-xl">←</span>
            <span>라이브러리</span>
          </button>

          {languages.length > 1 && (
            <div className="ml-auto flex items-center gap-2">
              {languages.map((code) => {
                const label = LANG_LABEL[code] ?? { flag: '🌐', name: code };
                return (
                  <Chip
                    key={code}
                    variant="coral"
                    active={lang === code}
                    icon={label.flag}
                    onClick={() => setLang(code)}
                    className="!px-5 !py-2.5 !text-base"
                  >
                    {label.name}
                  </Chip>
                );
              })}
            </div>
          )}

          {styles.length > 1 && (
            <div className={cn('flex items-center gap-2', languages.length <= 1 && 'ml-auto')}>
              {styles.map((s) => (
                <Chip
                  key={s}
                  variant="ink"
                  active={effectiveStyle === s}
                  onClick={() => setSelectedStyle(s)}
                  className="!px-5 !py-2.5 !text-base"
                >
                  {getArtStyleLabel(s)}
                </Chip>
              ))}
            </div>
          )}
        </div>

        {/* hero + parentGuide wrapper — flex-1 + justify-center 으로 콘텐츠만 vertical 가운데. 헤더는 위 고정. */}
        <div className="flex-1 flex flex-col justify-center">
          {/* hero — 좌: 정방형 표지 / 우: chip row + 모드 카드 3개 (세로 stack). reference 디자인. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* 좌: 정방형 표지. 표지 일러스트에 책 제목이 박혀있어 우측엔 별도 h1 미노출. */}
            <div className="relative aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-peach-200 to-peach-300 shadow-card w-full">
              {coverUrl ? (
                <img
                  src={coverUrl}
                  alt={storybook.title}
                  className="w-full h-full object-cover transition-opacity duration-300"
                  key={coverUrl}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[140px]">
                  📖
                </div>
              )}
            </div>

            {/* 우: chip row + 모드 카드 3개 stack. 표지 정사각형 height 와 균형. */}
            <div className="flex flex-col gap-3">
              {/* chip row — 카테고리 / 타입 / 페이지 / 단어. 한 줄 wrap. */}
              <div className="flex gap-2 flex-wrap">
                {storybook.category && (
                  <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-4 py-2 text-sm font-black text-ink-700 shadow-soft">
                    <span>🌍</span>
                    <span>{storybook.category}</span>
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-4 py-2 text-sm font-black text-ink-700 shadow-soft">
                  <span>📖</span>
                  <span>{storybook.type === 'phonics' ? '파닉스' : '동화책'}</span>
                </span>
                {storybook.pages?.length && (
                  <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-4 py-2 text-sm font-black text-ink-700 shadow-soft">
                    <span>📕</span>
                    <span>페이지 {storybook.pages.length}</span>
                  </span>
                )}
                {vocabWordCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 bg-white rounded-full px-4 py-2 text-sm font-black text-ink-700 shadow-soft">
                    <span className="text-coral-600">Aa</span>
                    <span>단어 {vocabWordCount}</span>
                  </span>
                )}
              </div>

              {/* 모드 카드 3개 — 가로 긴 카드 stack. 자식 모두 flex-1 로 표지 height 와 균형. 영상 없는 책 = disabled 음영. */}
              <div className="flex flex-col gap-3 flex-1 [&>button]:flex-1">
                <ModeCard
                  tone="coral"
                  iconSrc="/icons/mode/book.png"
                  emoji="📖"
                  title="책으로 읽기"
                  sub="그림과 글로 천천히"
                  onClick={() => enterMode('read')}
                />
                <ModeCard
                  tone="violet"
                  iconSrc="/icons/mode/video.png"
                  emoji="▶"
                  title="영상으로 보기"
                  sub={videoAvailable ? '애니메이션으로 감상' : '준비 중이에요'}
                  onClick={() => enterMode('video')}
                  disabled={!videoAvailable}
                />
                <ModeCard
                  tone="amber"
                  iconSrc="/icons/mode/word.png"
                  emoji="✨"
                  title="단어 익히기"
                  sub="단어 + 게임 4종"
                  onClick={() => enterMode('vocab')}
                  disabled={!vocabAvailable}
                />
              </div>
            </div>
          </div>

          {/* 부모님 가이드 (parentGuide 있을 때만) */}
          {storybook.parentGuide && (
            <div className="mt-6">
              <button
                onClick={() => setGuideOpen((v) => !v)}
                className="w-full flex items-center justify-between bg-white rounded-lg px-5 py-4 shadow-soft hover:bg-peach-50 transition-colors"
                aria-expanded={guideOpen}
              >
                <div className="flex items-center gap-2">
                  <span className="text-2xl">👨‍👩‍👧</span>
                  <span className="font-black text-ink-900 text-base">부모님 가이드</span>
                  <span className="text-xs text-ink-500 ml-1 hidden sm:inline">
                    책 특징 · 교훈 · 읽어주는 법
                  </span>
                </div>
                <span
                  className={cn(
                    'text-ink-500 transition-transform',
                    guideOpen ? 'rotate-180' : 'rotate-0'
                  )}
                >
                  ▼
                </span>
              </button>
              {guideOpen && (
                <div className="mt-3 bg-white rounded-lg p-5 md:p-6 shadow-soft space-y-5">
                  {/* 특징 */}
                  {storybook.parentGuide.overview && (
                    <section>
                      <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                        📖 책의 특징
                      </h3>
                      <p className="text-sm text-ink-700 leading-relaxed">
                        {storybook.parentGuide.overview}
                      </p>
                    </section>
                  )}
                  {/* 교훈 */}
                  {storybook.parentGuide.lessons && storybook.parentGuide.lessons.length > 0 && (
                    <section>
                      <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                        💡 아이에게 전할 교훈
                      </h3>
                      <ul className="space-y-1.5">
                        {storybook.parentGuide.lessons.map((lesson, i) => (
                          <li key={i} className="text-sm text-ink-700 leading-relaxed flex gap-2">
                            <span className="text-coral-400 mt-0.5">•</span>
                            <span>{lesson}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {/* 읽어주는 법 */}
                  {storybook.parentGuide.readingTips &&
                    storybook.parentGuide.readingTips.length > 0 && (
                      <section>
                        <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                          🎭 읽어주는 법
                        </h3>
                        <ul className="space-y-1.5">
                          {storybook.parentGuide.readingTips.map((tip, i) => (
                            <li key={i} className="text-sm text-ink-700 leading-relaxed flex gap-2">
                              <span className="text-coral-400 mt-0.5">{i + 1}.</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </section>
                    )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* /flex-1 wrapper 닫기 */}
      </div>

      {videoIdToPlay && (
        <YouTubeModal
          videoId={videoIdToPlay}
          open={videoOpen}
          onClose={() => {
            setVideoOpen(false);
            setVideoIdToPlay(null);
          }}
          title={storybook.title}
        />
      )}
    </div>
  );
}

/** 모드 카드 — reference 식 가로 긴 카드 (좌 텍스트 / 우 아이콘 워시 / 우끝 → 화살표).
 * 톤: coral=책읽기 / violet=영상 / amber=단어. disabled=영상/어휘 데이터 없을 때 음영.
 * iconSrc 가 있으면 PNG 일러스트 (워시 없이 raw 이미지) / 없으면 emoji + 흰 워시 fallback. */
function ModeCard({
  tone,
  emoji,
  icon,
  iconSrc,
  title,
  sub,
  onClick,
  disabled,
}: {
  tone: 'coral' | 'violet' | 'amber';
  emoji?: string;
  icon?: ReactNode;
  iconSrc?: string;
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  const TONE = {
    coral: {
      bg: 'bg-gradient-to-br from-coral-400 to-coral-500',
      text: 'text-white',
      sub: 'text-white/85',
      arrow: 'bg-white/20 text-white',
    },
    violet: {
      bg: 'bg-gradient-to-br from-indigo-500 via-violet-500 to-blue-500',
      text: 'text-white',
      sub: 'text-white/85',
      arrow: 'bg-white/20 text-white',
    },
    amber: {
      bg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
      text: 'text-ink-900',
      sub: 'text-ink-900/75',
      arrow: 'bg-ink-900/15 text-ink-900',
    },
  }[tone];

  if (disabled) {
    return (
      <button
        disabled
        className="flex items-center gap-5 rounded-2xl px-6 py-5 bg-ink-100/40 cursor-not-allowed select-none"
        aria-disabled="true"
        title="준비 중이에요"
      >
        <div className="flex-1 text-left">
          <h3 className="font-black text-2xl text-ink-700">{title}</h3>
          <p className="text-base font-black text-ink-700 mt-1 opacity-80">{sub}</p>
        </div>
        <div className="w-24 h-24 shrink-0 rounded-full bg-white/85 flex items-center justify-center ring-2 ring-white">
          {iconSrc ? (
            <img src={iconSrc} alt="" aria-hidden className="w-16 h-16 object-contain opacity-50" />
          ) : (
            <span className="text-4xl opacity-40">{icon ?? emoji}</span>
          )}
        </div>
        <span className="w-10 h-10 rounded-full bg-ink-100/60 text-ink-500 text-2xl font-black flex items-center justify-center shrink-0">
          ›
        </span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        'group flex items-center gap-5 rounded-2xl px-6 py-5 shadow-pop hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] active:translate-y-0.5 transition-all duration-100',
        TONE.bg,
        TONE.text
      )}
    >
      <div className="flex-1 text-left">
        <h3 className="font-black text-2xl md:text-3xl leading-tight">{title}</h3>
        <p className={cn('text-base font-bold mt-1', TONE.sub)}>{sub}</p>
      </div>
      {/* 워시 — 흰색 85% (거의 흰 동그라미) + 안에 일러스트 (여백 있게) */}
      <div className="w-24 h-24 shrink-0 rounded-full bg-white/85 flex items-center justify-center ring-2 ring-white shadow-[0_6px_16px_rgba(0,0,0,0.12),inset_0_-2px_4px_rgba(0,0,0,0.05)]">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden
            className="w-16 h-16 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
          />
        ) : (
          <span className="text-4xl">{icon ?? emoji}</span>
        )}
      </div>
      <span
        className={cn(
          'w-10 h-10 rounded-full text-2xl font-black flex items-center justify-center shrink-0 transition-transform group-hover:translate-x-0.5',
          TONE.arrow
        )}
      >
        ›
      </span>
    </button>
  );
}

/** 책 메타 정보 chip — 페이지/단어/추천 연령. inline row 로 모드 카드 grid 와 정렬 충돌 없음. */
function MetaChip({ icon, label, value }: { icon: string; label: string; value: ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-soft">
      <span className="text-base leading-none">{icon}</span>
      <span className="text-xs font-bold text-ink-500">{label}</span>
      <span className="text-sm font-black text-ink-900">{value}</span>
    </div>
  );
}

/** YouTube 로고 — 빨강 박스 + 흰 ▶ */
function YouTubeIcon() {
  return (
    <svg className="w-12 h-9" viewBox="0 0 24 17" fill="none" aria-hidden>
      <rect width="24" height="17" rx="4" fill="#FF0000" />
      <path d="M9.5 12V5l6 3.5-6 3.5z" fill="#fff" />
    </svg>
  );
}
