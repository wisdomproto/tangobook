import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { Card } from '@/components/Card';
import { StateScreen } from '@/components/StateScreen';
import { Skeleton } from '@/components/Skeleton';
import { cn } from '@/lib/cn';
import { YouTubeModal } from '@/features/viewer/components/YouTubeModal';
import {
  hasVideoUrl,
  hasGames,
  getAvailableLanguages,
  getPrimaryVideoId,
  type LangCode,
} from '@/lib/storybook-accessors';

const LANG_LABEL: Record<string, { flag: string; name: string }> = {
  ko: { flag: '🇰🇷', name: '한국어' },
  en: { flag: '🇺🇸', name: 'English' },
  ja: { flag: '🇯🇵', name: '日本語' },
};

export default function BookDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: storybook, isLoading, isError } = useStorybook(id);
  const [lang, setLang] = useState<LangCode>('ko');
  const [videoOpen, setVideoOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);

  const videoAvailable = useMemo(() => (storybook ? hasVideoUrl(storybook) : false), [storybook]);
  const gameAvailable = useMemo(() => (storybook ? hasGames(storybook) : false), [storybook]);
  const languages = useMemo(() => (storybook ? getAvailableLanguages(storybook) : []), [storybook]);

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

  const pageCount = storybook.pages?.length ?? 0;
  const summary = storybook.referenceContent?.slice(0, 150) ?? '';

  const primaryVideoId = getPrimaryVideoId(storybook);

  const enterMode = (mode: 'read' | 'video' | 'game') => {
    if (mode === 'video') {
      if (primaryVideoId) setVideoOpen(true);
      return;
    }
    const qs = new URLSearchParams({ lang });
    if (mode === 'game') qs.set('mode', 'games');
    navigate(`/viewer/${storybook.id}?${qs.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-peach-100">
      <div className="max-w-[1200px] mx-auto p-5 md:p-7">
        {/* 상단 바 */}
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => navigate(-1)}
            className="w-12 h-12 rounded-lg bg-white shadow-soft flex items-center justify-center text-xl hover:bg-peach-100"
            aria-label="뒤로 가기"
          >
            ←
          </button>
          <button
            disabled
            title="즐겨찾기는 곧 추가돼요"
            className="bg-white rounded-lg px-4 py-3 shadow-soft font-bold text-sm flex items-center gap-1.5 opacity-60 cursor-not-allowed"
          >
            ⭐ <span>즐겨찾기</span>
          </button>
        </div>

        {/* 히어로 */}
        <div className="grid grid-cols-1 md:grid-cols-[480px_1fr] gap-9 items-start mb-6">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-peach-200 to-peach-300 shadow-card">
            {storybook.coverImage ? (
              <img
                src={storybook.coverImage}
                alt={storybook.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[120px]">📖</div>
            )}
            {videoAvailable && (
              <span className="absolute top-3 right-3 bg-coral-500 text-white px-3 py-1.5 rounded-md text-[11px] font-black shadow-pop">
                📺 영상 있음
              </span>
            )}
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-ink-900 font-display leading-tight">
              {storybook.title}
            </h1>
            <div className="flex gap-2 flex-wrap mt-4 mb-4">
              {[
                `👶 만 ${storybook.targetAge}세`,
                `📄 ${pageCount}페이지`,
                storybook.category && `🏷️ ${storybook.category}`,
              ]
                .filter(Boolean)
                .map((chip) => (
                  <span
                    key={chip as string}
                    className="bg-white px-3 py-1.5 rounded-md text-xs font-bold text-ink-700 shadow-soft"
                  >
                    {chip}
                  </span>
                ))}
            </div>
            {summary && (
              <p className="bg-white/60 p-4 rounded-md text-sm text-ink-700 leading-relaxed">
                {summary}
                {summary.length >= 150 ? '…' : ''}
              </p>
            )}
          </div>
        </div>

        {/* 언어 선택 */}
        {languages.length > 1 && (
          <div className="mb-6">
            <div className="text-xs font-black text-ink-500 uppercase tracking-wider mb-2">
              🌐 언어
            </div>
            <div className="flex gap-2 flex-wrap">
              {languages.map((code) => {
                const label = LANG_LABEL[code] ?? { flag: '🌐', name: code };
                return (
                  <button
                    key={code}
                    onClick={() => setLang(code)}
                    className={cn(
                      'px-5 py-3 rounded-md font-bold flex gap-2 items-center transition-all',
                      lang === code
                        ? 'bg-peach-300 text-ink-900 shadow-soft'
                        : 'bg-white text-ink-500'
                    )}
                  >
                    <span className="text-lg">{label.flag}</span>
                    <span>{label.name}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* 모드 선택 */}
        <div>
          <div className="text-xs font-black text-ink-500 uppercase tracking-wider mb-3">
            🎯 어떻게 즐길까?
          </div>
          <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr] gap-4">
            {/* 책으로 읽기 — primary */}
            <Card
              interactive
              onClick={() => enterMode('read')}
              className="!bg-gradient-to-br !from-coral-400 !to-coral-500 !text-white"
            >
              <div className="text-5xl">📖</div>
              <h3 className="font-black text-lg mt-2">책으로 읽기</h3>
              <div className="text-sm opacity-95">그림과 글로 천천히 읽어요</div>
            </Card>
            {/* 영상으로 */}
            {videoAvailable && (
              <Card interactive onClick={() => enterMode('video')}>
                <div className="text-4xl">🎬</div>
                <h3 className="font-black text-base mt-2 text-ink-900">영상으로</h3>
                <div className="text-xs text-ink-500 mt-0.5">움직이는 그림으로</div>
              </Card>
            )}
            {/* 게임 */}
            {gameAvailable && (
              <Card interactive onClick={() => enterMode('game')}>
                <div className="text-4xl">🎮</div>
                <h3 className="font-black text-base mt-2 text-ink-900">게임</h3>
                <div className="text-xs text-ink-500 mt-0.5">퀴즈·연결하기</div>
              </Card>
            )}
          </div>
        </div>

        {/* 부모님 가이드 (parentGuide 있을 때만) */}
        {storybook.parentGuide && (
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
                <section>
                  <h3 className="text-xs font-black text-coral-500 uppercase tracking-wider mb-2">
                    📖 책의 특징
                  </h3>
                  <p className="text-sm text-ink-700 leading-relaxed">
                    {storybook.parentGuide.overview}
                  </p>
                </section>
                {/* 교훈 */}
                {storybook.parentGuide.lessons.length > 0 && (
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
                {storybook.parentGuide.readingTips.length > 0 && (
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

      {primaryVideoId && (
        <YouTubeModal
          videoId={primaryVideoId}
          open={videoOpen}
          onClose={() => setVideoOpen(false)}
          title={storybook.title}
        />
      )}
    </div>
  );
}
