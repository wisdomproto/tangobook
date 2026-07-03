import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useStorybook, useStorybooks } from '@/features/storybook';
import {
  getYoutubeVideoIds,
  getDirectVideoUrls,
  getAvailableStyles,
} from '@/lib/storybook-accessors';
import { StateScreen, Skeleton, Chip, PageHeader } from '@/design-system';
import { cn } from '@/lib/cn';
import { useSeo } from '@/lib/useSeo';
import { YouTubeModal } from '@/features/viewer/components/YouTubeModal';
import {
  SUPPORTED_LANGUAGES,
  canReadBook,
  type ReadingLevel,
  type StorybookSummary,
} from '@tangobook/shared';
import { useAccess, PaywallNotice, LockBadge } from '@/features/access';
import { useAuth } from '@/features/auth/context/AuthContext';
import { isDevEmail } from '@/config/dev';

// 언어 메타는 shared SUPPORTED_LANGUAGES 단일 소스에서 derive. 새 언어 추가 시 shared 한 줄이면 토글에 자동 반영.
const LANG_LABEL: Record<string, { flag: string; name: string }> = Object.fromEntries(
  SUPPORTED_LANGUAGES.map((l) => [l.code, { flag: l.flag, name: l.nativeName }])
);

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

  // SEO — 책 detail 페이지는 SEO 진입 페이지 (BookSeoPage 의 /about 는 부모용 가이드, /library/:id 는 학습자 진입).
  // 책 정보 로드되면 동적으로 title/description/og 세팅. 책 상세는 학습 진입점이라 robots=index.
  useSeo({
    title: storybook ? `${storybook.title} — 탱고북` : '동화책 — 탱고북',
    description: storybook
      ? `${storybook.title} | ${storybook.category ?? '동화책'} | ${storybook.parentGuide?.overview?.slice(0, 110) ?? '아이와 함께 읽는 동화책. 그림체와 글밥을 아이에게 맞춰서.'}`
      : '아이와 함께 읽는 동화책. 그림체와 글밥을 아이에게 맞춰서.',
    image: storybook?.coverImage || storybook?.coverImages?.[0]?.imageUrl,
    path: `/library/${id}`,
    type: 'book',
  });

  const [langState, setLang] = useState<string>('ko');
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [videoIdToPlay, setVideoIdToPlay] = useState<string | null>(null);
  // 유료화 접근 권한 (체험/구독). 현재는 가입일 기반 체험만 — Supabase 연동 시 구독·레퍼럴 주입.
  const access = useAccess();
  const { account } = useAuth();
  // "영상으로 보기" 모드는 아직 준비 중 — 개발자에게만 노출.
  const showVideoMode = isDevEmail(account?.email);
  const [showPaywall, setShowPaywall] = useState(false);

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

  const allLanguages =
    storybook.languages && storybook.languages.length > 0 ? storybook.languages : ['ko'];
  const allStyles = getAvailableStyles(storybook);
  // 셀 단위 공개 필터 — publicByStyleLang[style][lang] === false 면 학습자에게 비공개.
  // /editor2 헤더 체크박스 + /library-master 표에서 (그림체 × 언어) 셀 단위로 설정. 미정의 = 공개.
  const isCellPublic = (s: string, l: string): boolean =>
    storybook.publicByStyleLang?.[s]?.[l] !== false;
  // 그림체 칩 = 공개 언어가 ≥1 개인 그림체만. (모두 비공개면 폴백 — 그런 책은 isPublic=false 라 라이브러리 미노출)
  const visibleStyles = allStyles.filter((s) => allLanguages.some((l) => isCellPublic(s, l)));
  const styles = visibleStyles.length > 0 ? visibleStyles : allStyles;

  // 효과 레벨/스타일 (URL params에 전달용)
  const launchLevel = storybook.curriculumMeta?.launchLevel;
  const effectiveLevel =
    selectedLevel ??
    (launchLevel && levels.includes(launchLevel) ? launchLevel : levels[0]) ??
    baseLevel;
  const effectiveStyle =
    (selectedStyle && styles.includes(selectedStyle) ? selectedStyle : undefined) ?? styles[0];
  // 언어 토글 = 현재 그림체에서 공개된 언어만 + 선택 언어가 비공개면 첫 공개 언어로 보정.
  const visibleLangs = allLanguages.filter((l) => isCellPublic(effectiveStyle, l));
  const languages = visibleLangs.length > 0 ? visibleLangs : allLanguages;
  const lang = languages.includes(langState) ? langState : languages[0];

  // (그림체 × 언어) 조합 대표 표지.
  //   1) styleAssets[style].primaryCoverByLang[lang] — 그림체별 자산 안 (style, lang) 마커
  //   2) 활성 그림체일 때만 top-level primaryCoverByLang[lang] (CoverTab 이 ko 는 둘 다 mirror)
  //   3) ko 만 레거시 coverImage fallback (활성 그림체면 top-level, 비활성이면 styleAssets[style].coverImage)
  //   조합 표지가 없으면 placeholder 노출 (LibraryMaster 와 동일 정책).
  const styleAssets = effectiveStyle ? storybook.styleAssets?.[effectiveStyle] : undefined;
  const isActiveStyle = !!effectiveStyle && effectiveStyle === storybook.artStyle;
  // (그림체, 언어) 대표 표지. 활성 그림체는 top-level(CoverTab 이 최신 저장하는 곳)을 우선,
  // 비활성 그림체는 styleAssets 안의 마커를 본다.
  const pickCover = (l: string): string | undefined =>
    (isActiveStyle ? storybook.primaryCoverByLang?.[l] : undefined) ??
    styleAssets?.primaryCoverByLang?.[l];
  // 폴백: 요청 언어 → 그 그림체의 대표 coverImage(언어 무관) → 그래도 없으면 다른 언어.
  //   en 을 ko 보다 우선하지 않는다 (ko 선택인데 en 표지 뜨는 버그 방지).
  const coverUrl =
    pickCover(lang) ??
    styleAssets?.coverImage ??
    (isActiveStyle ? storybook.coverImage : undefined) ??
    pickCover('en') ??
    pickCover('ko');
  const langLabel = LANG_LABEL[lang]?.name ?? lang;
  // 부모 가이드: 선택 언어 번역(parentGuideTranslations[lang])이 있으면 그것, 없으면 한국어 parentGuide 폴백.
  const guide =
    (lang !== 'ko' ? storybook.parentGuideTranslations?.[lang] : undefined) ??
    storybook.parentGuide;

  // 유료 책(isAccessibleForFree===false)인데 권한 없으면 본문 읽기 잠금. 무료 책은 항상 열람.
  const locked = !canReadBook(storybook, access);

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
    // 본문 읽기 게이팅 — 잠긴 책이면 이동 대신 유료 안내.
    if (locked) {
      setShowPaywall(true);
      return;
    }
    const qs = new URLSearchParams({ lang });
    if (effectiveStyle) qs.set('style', effectiveStyle);
    navigate(`/viewer/${targetId}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100 flex flex-col">
      <div className="max-w-[1200px] mx-auto px-4 md:px-5 w-full flex flex-col flex-1">
        <PageHeader
          onBack={() => navigate('/library')}
          right={
            <div className="flex items-center gap-2 flex-wrap justify-end">
              {/* 기본 정보 — 카테고리 / 타입 / 페이지 / 단어 / 타겟 연령 (있을 때만) */}
              {storybook.category && (
                <span className="inline-flex items-center gap-1.5 bg-white/85 rounded-full px-3.5 py-1.5 text-xs font-black text-ink-700 shadow-soft">
                  <span>🌍</span>
                  <span>{storybook.category}</span>
                </span>
              )}
              <span className="hidden sm:inline-flex items-center gap-1.5 bg-white/85 rounded-full px-3.5 py-1.5 text-xs font-black text-ink-700 shadow-soft">
                <span>📖</span>
                <span>{storybook.type === 'phonics' ? '파닉스' : '동화책'}</span>
              </span>
              {storybook.pages?.length && (
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-white/85 rounded-full px-3.5 py-1.5 text-xs font-black text-ink-700 shadow-soft">
                  <span>📕</span>
                  <span>페이지 {storybook.pages.length}</span>
                </span>
              )}
              {vocabWordCount > 0 && (
                <span className="hidden sm:inline-flex items-center gap-1.5 bg-white/85 rounded-full px-3.5 py-1.5 text-xs font-black text-ink-700 shadow-soft">
                  <span className="text-coral-600">Aa</span>
                  <span>단어 {vocabWordCount}</span>
                </span>
              )}
              {(() => {
                const ageText =
                  baseLevel && LEVEL_INFO[baseLevel]
                    ? LEVEL_INFO[baseLevel].age
                    : storybook.targetAge
                      ? `${storybook.targetAge.replace('-', '~')}세`
                      : null;
                if (!ageText) return null;
                return (
                  <span className="inline-flex items-center gap-1.5 bg-white/85 rounded-full px-3.5 py-1.5 text-xs font-black text-ink-700 shadow-soft">
                    <span>🌱</span>
                    <span>{ageText}</span>
                  </span>
                );
              })()}
            </div>
          }
        >
          <span className="truncate">{storybook.title}</span>
        </PageHeader>

        {/* hero + parentGuide wrapper — flex-1 + justify-center 으로 콘텐츠만 vertical 가운데. 헤더는 위 고정. */}
        <div className="flex-1 flex flex-col justify-center">
          {/* hero — 좌: 정방형 표지 / 우: chip row + 모드 카드 3개 (세로 stack). reference 디자인. */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-6">
            {/* 좌: 그림체 선택 바 + 언어 토글 + 정방형 표지. 표지 일러스트에 책 제목이 박혀있어 우측엔 별도 h1 미노출. */}
            <div className="flex flex-col gap-2.5">
              {(styles.length > 1 || languages.length > 1) && (
                <div className="flex items-stretch gap-2">
                  {styles.length > 1 && (
                    <div className="flex-1 min-w-0 flex items-center justify-between bg-white rounded-full px-2 py-1.5 shadow-soft">
                      <button
                        type="button"
                        onClick={() => {
                          const idx = styles.indexOf(effectiveStyle);
                          const prev = idx <= 0 ? styles.length - 1 : idx - 1;
                          setSelectedStyle(styles[prev]);
                        }}
                        className="w-10 h-10 rounded-full bg-peach-100 hover:bg-peach-200 text-ink-900 text-xl font-black flex items-center justify-center transition shrink-0"
                        aria-label="이전 그림체"
                      >
                        ←
                      </button>
                      <span className="text-base font-black text-ink-900 flex items-center gap-1.5 truncate min-w-0">
                        <span className="shrink-0">🎨</span>
                        {/* 어떤 그림체인지 명시하지 않고 "그림체 N" 으로만 표시 */}
                        <span className="truncate">
                          그림체 {Math.max(0, styles.indexOf(effectiveStyle)) + 1}
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const idx = styles.indexOf(effectiveStyle);
                          const next = idx >= styles.length - 1 ? 0 : idx + 1;
                          setSelectedStyle(styles[next]);
                        }}
                        className="w-10 h-10 rounded-full bg-peach-100 hover:bg-peach-200 text-ink-900 text-xl font-black flex items-center justify-center transition shrink-0"
                        aria-label="다음 그림체"
                      >
                        →
                      </button>
                    </div>
                  )}
                  {languages.length > 1 && (
                    <div className="flex items-center gap-1 bg-white rounded-full px-1.5 py-1.5 shadow-soft shrink-0">
                      {languages.map((code) => {
                        const label = LANG_LABEL[code] ?? { flag: '🌐', name: code };
                        const active = lang === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setLang(code)}
                            aria-pressed={active}
                            aria-label={`언어 ${label.name}`}
                            className={cn(
                              'w-10 h-10 rounded-full text-xl flex items-center justify-center transition',
                              active
                                ? 'bg-coral-500 text-white shadow-soft'
                                : 'bg-peach-100 hover:bg-peach-200 text-ink-900'
                            )}
                          >
                            {label.flag}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
              <div className="relative aspect-video rounded-3xl overflow-hidden bg-gradient-to-br from-peach-200 to-peach-300 shadow-card w-full">
                {coverUrl ? (
                  <img
                    src={coverUrl}
                    alt={storybook.title}
                    className="w-full h-full object-cover transition-opacity duration-300"
                    key={coverUrl}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-ink-100 text-ink-500">
                    <div className="text-[72px]">📭</div>
                    <div className="text-sm font-black px-4 text-center">
                      {langLabel} 표지가 아직 없어요
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 우: 모드 카드 3개 stack. 기본 정보 chip 은 헤더로 이관. 표지 정사각형 height 와 균형. */}
            <div className="flex flex-col gap-3">
              {/* 모드 카드 3개 — 가로 긴 카드 stack. 자식 모두 flex-1 로 표지 height 와 균형. 영상 없는 책 = disabled 음영. */}
              <div className="flex flex-col gap-3 flex-1 [&>button]:flex-1">
                <ModeCard
                  tone="coral"
                  iconSrc="/icons/mode/book.webp"
                  emoji="📖"
                  sound="book-open"
                  title="책으로 읽기"
                  sub={
                    locked
                      ? access.status === 'guest'
                        ? '회원 가입하면 무료로 읽어요'
                        : '프리미엄 — 구독하고 읽기'
                      : '그림과 글로 천천히'
                  }
                  onClick={() => enterMode('read')}
                  locked={locked}
                />
                {showVideoMode && (
                  <ModeCard
                    tone="violet"
                    iconSrc="/icons/mode/video.webp"
                    emoji="▶"
                    title="영상으로 보기"
                    sub={videoAvailable ? '애니메이션으로 감상' : '준비 중이에요'}
                    onClick={() => enterMode('video')}
                    disabled={!videoAvailable}
                  />
                )}
                <ModeCard
                  tone="amber"
                  iconSrc="/icons/mode/word.webp"
                  emoji="✨"
                  title="단어 익히기"
                  sub="단어 + 게임 4종"
                  onClick={() => enterMode('vocab')}
                  disabled={!vocabAvailable}
                />
              </div>
            </div>
          </div>

          {/* 부모님 가이드 (선택 언어 번역 우선, 없으면 한국어 폴백) */}
          {guide && (
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
                  {guide.overview && (
                    <section>
                      <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                        📖 책의 특징
                      </h3>
                      <p className="text-sm text-ink-700 leading-relaxed">{guide.overview}</p>
                    </section>
                  )}
                  {/* 교훈 */}
                  {guide.lessons && guide.lessons.length > 0 && (
                    <section>
                      <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                        💡 아이에게 전할 교훈
                      </h3>
                      <ul className="space-y-1.5">
                        {guide.lessons.map((lesson, i) => (
                          <li key={i} className="text-sm text-ink-700 leading-relaxed flex gap-2">
                            <span className="text-coral-400 mt-0.5">•</span>
                            <span>{lesson}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {/* 읽어주는 법 */}
                  {guide.readingTips && guide.readingTips.length > 0 && (
                    <section>
                      <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                        🎭 읽어주는 법
                      </h3>
                      <ul className="space-y-1.5">
                        {guide.readingTips.map((tip, i) => (
                          <li key={i} className="text-sm text-ink-700 leading-relaxed flex gap-2">
                            <span className="text-coral-400 mt-0.5">{i + 1}.</span>
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </section>
                  )}
                  {/* 자주 묻는 질문 */}
                  {guide.faq && guide.faq.length > 0 && (
                    <section>
                      <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                        ❓ 자주 묻는 질문
                      </h3>
                      <div className="space-y-2">
                        {guide.faq.map((f, i) => (
                          <details
                            key={i}
                            className="rounded-lg border border-ink-100 bg-cream-50 p-3 group"
                          >
                            <summary className="font-black text-ink-900 text-sm cursor-pointer list-none flex gap-2 items-start">
                              <span className="text-coral-500">Q.</span>
                              <span className="flex-1">{f.q}</span>
                              <span className="text-ink-400 group-open:rotate-180 transition mt-0.5">
                                ▾
                              </span>
                            </summary>
                            <div className="mt-2 pl-5 text-sm text-ink-700 leading-relaxed whitespace-pre-line">
                              {f.a}
                            </div>
                          </details>
                        ))}
                      </div>
                    </section>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        {/* /flex-1 wrapper 닫기 */}
      </div>

      {showPaywall && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowPaywall(false)}
          role="dialog"
          aria-modal="true"
        >
          <div onClick={(e) => e.stopPropagation()}>
            <PaywallNotice
              status={access.status}
              coverUrl={coverUrl}
              onLogin={() => navigate('/login?mode=signup')}
              onSubscribe={() => navigate('/subscribe')}
              onClose={() => setShowPaywall(false)}
              onBrowseFree={() => {
                setShowPaywall(false);
                navigate('/library');
              }}
            />
          </div>
        </div>
      )}

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
  locked,
  sound,
}: {
  tone: 'coral' | 'violet' | 'amber';
  emoji?: string;
  icon?: ReactNode;
  iconSrc?: string;
  title: string;
  sub: string;
  onClick: () => void;
  disabled?: boolean;
  locked?: boolean;
  /** GlobalUiSound 오버라이드 (예: 'book-open') — 미지정 시 기본 tap. */
  sound?: string;
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
        className="flex items-center gap-3 sm:gap-5 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 bg-ink-100/40 cursor-not-allowed select-none"
        aria-disabled="true"
        title="준비 중이에요"
      >
        <div className="flex-1 text-left">
          <h3 className="font-black text-2xl text-ink-700">{title}</h3>
          <p className="text-base font-black text-ink-700 mt-1 opacity-80">{sub}</p>
        </div>
        <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 rounded-full bg-white/85 flex items-center justify-center ring-2 ring-white">
          {iconSrc ? (
            <img
              src={iconSrc}
              alt=""
              aria-hidden
              className="w-11 h-11 sm:w-16 sm:h-16 object-contain opacity-50"
            />
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
      data-sound={sound}
      className={cn(
        'group relative flex items-center gap-3 sm:gap-5 rounded-2xl px-4 sm:px-6 py-4 sm:py-5 shadow-pop hover:-translate-y-0.5 hover:shadow-[0_12px_24px_rgba(0,0,0,0.18)] active:translate-y-0.5 transition-all duration-100',
        TONE.bg,
        TONE.text
      )}
    >
      {locked && (
        <span className="absolute top-2.5 right-2.5 z-10">
          <LockBadge />
        </span>
      )}
      <div className="flex-1 text-left">
        <h3 className="font-black text-xl sm:text-2xl md:text-3xl leading-tight">{title}</h3>
        <p className={cn('text-base font-bold mt-1', TONE.sub)}>{sub}</p>
      </div>
      {/* 워시 — 흰색 85% (거의 흰 동그라미) + 안에 일러스트 (여백 있게) */}
      <div className="w-16 h-16 sm:w-24 sm:h-24 shrink-0 rounded-full bg-white/85 flex items-center justify-center ring-2 ring-white shadow-[0_6px_16px_rgba(0,0,0,0.12),inset_0_-2px_4px_rgba(0,0,0,0.05)]">
        {iconSrc ? (
          <img
            src={iconSrc}
            alt=""
            aria-hidden
            className="w-11 h-11 sm:w-16 sm:h-16 object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.18)]"
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
