import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useBookIndex, useBookManifest, useAudiobookRenders } from '@/features/book-v2';
import { useLongformList, useGamesList } from '@/features/book-v2';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { Card, StateScreen, Skeleton, Chip } from '@/design-system';
import { cn } from '@/lib/cn';
import { YouTubeModal } from '@/features/viewer/components/YouTubeModal';
import type { ReadingLevel } from '@tangobook/shared';

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
  const { data: manifest, isLoading, isError } = useBookManifest(id);
  const { data: index } = useBookIndex();
  const { data: audioRenders } = useAudiobookRenders(id);
  // longform/games는 책 단위 fetch (필터 없이 존재 여부만)
  const { data: longformProjects } = useLongformList(id);
  const { data: games } = useGamesList(id);
  // v1 storybook 도 fetch — v2 게임이 없는 책은 v1 storybook.games 로 fallback (GameListViewer 가 v1 자동 fallback)
  const { data: v1Storybook } = useStorybook(id);

  const [lang, setLang] = useState<string>('ko');
  const [selectedLevel, setSelectedLevel] = useState<ReadingLevel | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [videoIdToPlay, setVideoIdToPlay] = useState<string | null>(null);

  // 라이브러리 인덱스에서 표지 URL 가져오기 (캐시되어 있음)
  const indexEntry = useMemo(() => index?.books.find((b) => b.id === id), [index, id]);

  // 영상/게임 가용성
  const youtubeVideoIds = useMemo(() => {
    const ids: string[] = [];
    audioRenders?.forEach((r) => r.youtubeVideoId && ids.push(r.youtubeVideoId));
    longformProjects?.forEach((p) => p.youtubeVideoId && ids.push(p.youtubeVideoId));
    return ids;
  }, [audioRenders, longformProjects]);

  const directVideoUrls = useMemo(() => {
    const urls: string[] = [];
    audioRenders?.forEach((r) => r.videoUrl && urls.push(r.videoUrl));
    longformProjects?.forEach((p) => p.videoUrl && urls.push(p.videoUrl));
    return urls;
  }, [audioRenders, longformProjects]);

  const videoAvailable = youtubeVideoIds.length > 0 || directVideoUrls.length > 0;
  // v2 게임 또는 v1 게임 중 하나라도 있으면 게임 카드 노출
  const gameAvailable = (games?.length ?? 0) > 0 || (v1Storybook?.games?.length ?? 0) > 0;

  // 학습자에게 노출할 수 있는 레벨 — sibling __L{lv} 가 isPublic 인 것 + base book 자체.
  // useMemo 는 early return 위에 있어야 hooks 규칙 위반 X.
  const baseLevel =
    manifest?.curriculumMeta?.launchLevel ??
    (v1Storybook?.readingLevel as ReadingLevel | undefined);
  const levels = useMemo<ReadingLevel[]>(() => {
    if (!manifest) return [];
    const all = [...manifest.usedVariants.levels].sort(
      (a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b)
    );
    return all.filter((lv) => {
      if (lv === baseLevel) return true;
      const sibling = index?.books.find((b) => b.id === `${manifest.id}__${lv}`);
      return !!sibling?.isPublic && !!sibling?.coverImageUrl;
    });
  }, [manifest, baseLevel, index]);

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

  if (isError || !manifest) {
    return (
      <StateScreen
        mascotState="sad"
        title="이 책을 찾을 수 없어"
        description="다른 책 볼래?"
        action={{ label: '🏠 라이브러리로', onClick: () => navigate('/library') }}
      />
    );
  }

  const languages = manifest.usedVariants.languages;
  const styles = manifest.usedVariants.styles;

  // 효과 레벨/스타일 (URL params에 전달용)
  const effectiveLevel =
    selectedLevel ??
    (manifest.curriculumMeta?.launchLevel && levels.includes(manifest.curriculumMeta.launchLevel)
      ? manifest.curriculumMeta.launchLevel
      : levels[0]);
  const effectiveStyle = selectedStyle ?? styles[0];

  // 활성 그림체 기반 표지 URL — styleAssets 우선, fallback to top-level/index
  const coverUrl = (() => {
    if (!v1Storybook) return indexEntry?.coverImageUrl;
    const styleCover = effectiveStyle && v1Storybook.styleAssets?.[effectiveStyle]?.coverImage;
    if (styleCover) return styleCover;
    return v1Storybook.coverImage ?? indexEntry?.coverImageUrl;
  })();

  const enterMode = (mode: 'read' | 'video' | 'game') => {
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
    const qs = new URLSearchParams({ lang });
    if (effectiveLevel) qs.set('level', effectiveLevel);
    if (effectiveStyle) qs.set('style', effectiveStyle);
    if (mode === 'game') qs.set('mode', 'games');
    navigate(`/viewer/${manifest.id}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1200px] mx-auto p-5 md:p-7">
        {/* 상단 바 + 옵션 영역 (선택을 맨 위로) */}
        <div className="flex items-start gap-4 mb-6 flex-wrap">
          <button
            onClick={() => navigate('/library')}
            className="w-12 h-12 rounded-lg bg-white shadow-soft flex items-center justify-center text-xl hover:bg-peach-100 shrink-0"
            aria-label="라이브러리로"
            title="라이브러리로"
          >
            🏠
          </button>
          {(languages.length > 1 || levels.length > 1 || styles.length > 1) && (
            <div className="flex-1 min-w-0 bg-white/60 rounded-lg shadow-soft flex flex-wrap divide-x divide-ink-100">
              {languages.length > 1 && (
                <div className="px-4 py-3 flex flex-col gap-1.5 min-w-0">
                  <span className="text-[10px] font-black text-ink-500 uppercase tracking-wider">
                    🌐 언어
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {languages.map((code) => {
                      const label = LANG_LABEL[code] ?? { flag: '🌐', name: code };
                      return (
                        <Chip
                          key={code}
                          variant="coral"
                          active={lang === code}
                          icon={label.flag}
                          onClick={() => setLang(code)}
                        >
                          {label.name}
                        </Chip>
                      );
                    })}
                  </div>
                </div>
              )}
              {levels.length > 1 && (
                <div className="px-4 py-3 flex flex-col gap-1.5 min-w-0">
                  <span className="text-[10px] font-black text-ink-500 uppercase tracking-wider">
                    📂 글밥 (레벨)
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {levels.map((lv) => (
                      <Chip
                        key={lv}
                        variant="coral"
                        active={effectiveLevel === lv}
                        onClick={() => setSelectedLevel(lv)}
                      >
                        {lv} {LEVEL_INFO[lv].label}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
              {styles.length > 1 && (
                <div className="px-4 py-3 flex flex-col gap-1.5 min-w-0">
                  <span
                    className="text-[10px] font-black text-ink-500 uppercase tracking-wider"
                    title="선택 시 표지가 바뀌어요"
                  >
                    🎨 그림체
                  </span>
                  <div className="flex gap-1.5 flex-wrap">
                    {styles.map((s) => (
                      <Chip
                        key={s}
                        variant="ink"
                        active={effectiveStyle === s}
                        onClick={() => setSelectedStyle(s)}
                      >
                        {s}
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 히어로 — 좌: 표지 / 우: 제목+설명+모드카드 */}
        <div className="grid grid-cols-1 md:grid-cols-[480px_1fr] gap-9 items-start mb-8">
          {/* 좌: 표지 */}
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-peach-200 to-peach-300 shadow-card">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={manifest.title}
                className="w-full h-full object-cover transition-opacity duration-300"
                key={coverUrl}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[120px]">📖</div>
            )}
          </div>

          {/* 우: 제목 + chip + 설명 + 모드 카드 */}
          <div className="flex flex-col gap-4">
            <h1 className="text-3xl md:text-4xl font-black text-ink-900 font-display leading-tight">
              {(lang !== 'ko' && v1Storybook?.titleTranslations?.[lang]) ||
                v1Storybook?.title ||
                manifest.title}
            </h1>

            {/* chip — 카테고리 + 타입만 (레벨/그림체는 아래 섹션) */}
            <div className="flex gap-2 flex-wrap">
              {manifest.category && (
                <span className="bg-white px-3 py-1.5 rounded-md text-xs font-bold text-ink-700 shadow-soft">
                  🏷️ {manifest.category}
                </span>
              )}
              <span className="bg-white px-3 py-1.5 rounded-md text-xs font-bold text-ink-700 shadow-soft">
                {manifest.type === 'phonics' ? '🔤 파닉스' : '📖 동화책'}
              </span>
            </div>

            {manifest.parentGuide?.overview && (
              <p className="bg-white/60 p-4 rounded-md text-sm text-ink-700 leading-relaxed">
                {manifest.parentGuide.overview}
              </p>
            )}

            {/* 모드 카드 — 우측 컬럼 안 (공간 활용) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-1">
              <Card
                interactive
                onClick={() => enterMode('read')}
                className="!bg-gradient-to-br !from-coral-400 !to-coral-500 !text-white"
              >
                <div className="text-4xl">📖</div>
                <h3 className="font-black text-base mt-2">책으로 읽기</h3>
                <div className="text-xs opacity-95">그림과 글로 천천히</div>
              </Card>
              {videoAvailable && (
                <Card interactive onClick={() => enterMode('video')}>
                  <div className="inline-flex">
                    <YouTubeIcon />
                  </div>
                  <h3 className="font-black text-base mt-2 text-ink-900">영상으로</h3>
                  <div className="text-xs text-ink-500 mt-0.5">유튜브에서 보기</div>
                </Card>
              )}
              {gameAvailable && (
                <Card interactive onClick={() => enterMode('game')}>
                  <div className="text-3xl">🎮</div>
                  <h3 className="font-black text-base mt-2 text-ink-900">독후 게임</h3>
                  <div className="text-xs text-ink-500 mt-0.5">퀴즈·연결하기</div>
                </Card>
              )}
            </div>
          </div>
        </div>

        {/* 부모님 가이드 (parentGuide 있을 때만) */}
        {manifest.parentGuide && (
          <div className="mt-8">
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
                {manifest.parentGuide.overview && (
                  <section>
                    <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                      📖 책의 특징
                    </h3>
                    <p className="text-sm text-ink-700 leading-relaxed">
                      {manifest.parentGuide.overview}
                    </p>
                  </section>
                )}
                {/* 교훈 */}
                {manifest.parentGuide.lessons && manifest.parentGuide.lessons.length > 0 && (
                  <section>
                    <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                      💡 아이에게 전할 교훈
                    </h3>
                    <ul className="space-y-1.5">
                      {manifest.parentGuide.lessons.map((lesson, i) => (
                        <li key={i} className="text-sm text-ink-700 leading-relaxed flex gap-2">
                          <span className="text-coral-400 mt-0.5">•</span>
                          <span>{lesson}</span>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
                {/* 읽어주는 법 */}
                {manifest.parentGuide.readingTips &&
                  manifest.parentGuide.readingTips.length > 0 && (
                    <section>
                      <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                        🎭 읽어주는 법
                      </h3>
                      <ul className="space-y-1.5">
                        {manifest.parentGuide.readingTips.map((tip, i) => (
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

      {videoIdToPlay && (
        <YouTubeModal
          videoId={videoIdToPlay}
          open={videoOpen}
          onClose={() => {
            setVideoOpen(false);
            setVideoIdToPlay(null);
          }}
          title={manifest.title}
        />
      )}
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
