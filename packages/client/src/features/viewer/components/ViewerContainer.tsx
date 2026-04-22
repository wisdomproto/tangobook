import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook';
import type { Page } from '@tangobook/shared';
import { useViewerSettings, type ViewerSettings } from '../hooks/useViewerSettings';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { useSwipe } from '../hooks/useSwipe';
import { ViewerToolbar } from './ViewerToolbar';
import { PageView, CoverView, EndView } from './PageView';
import { ViewerControls } from './ViewerControls';
import { GameListViewer } from './GameListViewer';
import { PhonicsViewer } from './PhonicsViewer';

interface ViewerContainerProps {
  storybookId: string | undefined;
}

export function ViewerContainer({ storybookId }: ViewerContainerProps) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const { data: storybook, isLoading, error } = useStorybook(storybookId);
  const [settings, updateSettings] = useViewerSettings();
  // Total pages: cover + story pages + end
  const pages = storybook?.pages ?? [];
  const totalPages = pages.length + 2; // +1 cover, +1 end
  const [currentPage, setCurrentPage] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-advance: move to next page when TTS ends
  const autoAdvanceRef = useRef<() => void>();

  // Audio
  const { playTts, stopTts, isTtsPlaying, toggleBgm, isBgmPlaying } = useAudioPlayer({
    backgroundMusicUrl: storybook?.backgroundMusicUrl,
    onTtsEnded: () => autoAdvanceRef.current?.(),
  });

  // Get current story page (null for cover/end)
  const currentStoryPage: Page | null =
    currentPage >= 1 && currentPage <= pages.length ? pages[currentPage - 1] : null;

  // Get TTS URL for current page
  const getTtsUrl = useCallback(
    (page: Page | null): string | undefined => {
      if (!page) return undefined;
      if (settings.language === 'ko') return page.ttsUrl;
      return page.translations?.[settings.language]?.ttsUrl;
    },
    [settings.language]
  );

  // Navigate pages
  const goToPage = useCallback(
    (page: number) => {
      const clamped = Math.max(0, Math.min(page, totalPages - 1));
      setCurrentPage(clamped);
      stopTts();
    },
    [totalPages, stopTts]
  );

  const goNext = useCallback(() => goToPage(currentPage + 1), [currentPage, goToPage]);
  const goPrev = useCallback(() => goToPage(currentPage - 1), [currentPage, goToPage]);

  // Auto-play TTS on page change + auto-advance to next page
  useEffect(() => {
    if (!settings.autoPlayTts || mode === 'games') return;
    const isLastPage = currentPage >= totalPages - 1;

    // Update the auto-advance callback
    autoAdvanceRef.current = isLastPage
      ? undefined
      : () => {
          // Small delay before advancing so the transition feels natural
          setTimeout(() => goToPage(currentPage + 1), 800);
        };

    const url = getTtsUrl(currentStoryPage);
    if (url) {
      // Has TTS: play it, and auto-advance will fire via onTtsEnded
      const timer = setTimeout(() => playTts(url), 300);
      return () => clearTimeout(timer);
    } else if (!isLastPage) {
      // No TTS: auto-advance after a delay based on text length
      const text = currentStoryPage?.text ?? '';
      const delay = Math.max(3000, text.length * 80); // ~80ms per char, min 3s
      const timer = setTimeout(() => goToPage(currentPage + 1), delay);
      return () => clearTimeout(timer);
    }
  }, [
    currentPage,
    settings.autoPlayTts,
    currentStoryPage,
    getTtsUrl,
    playTts,
    totalPages,
    goToPage,
    mode,
  ]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goPrev();
      } else if (e.key === 'Escape') {
        if (document.fullscreenElement) document.exitFullscreen();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goNext, goPrev]);

  // Swipe
  useSwipe(containerRef, { onSwipeLeft: goNext, onSwipeRight: goPrev });

  // Toggle TTS
  const handleToggleTts = useCallback(() => {
    if (isTtsPlaying) {
      stopTts();
    } else {
      const url = getTtsUrl(currentStoryPage);
      if (url) playTts(url);
    }
  }, [isTtsPlaying, stopTts, getTtsUrl, currentStoryPage, playTts]);

  // Loading / Error states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !storybook) {
    return (
      <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center gap-4">
        <p className="text-white/60">동화책을 불러올 수 없습니다.</p>
        <button
          onClick={() => navigate('/library')}
          className="text-violet-400 hover:text-violet-300 text-sm"
        >
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  // 게임 모드 → GameListViewer (동화책/파닉스 공통)
  if (mode === 'games') {
    return <GameListViewer storybook={storybook} />;
  }

  // 파닉스 콘텐츠 → PhonicsViewer (story 모드는 일반 동화책 뷰어 재사용)
  if (storybook.type === 'phonics' && mode !== 'story') {
    return <PhonicsViewer storybook={storybook} mode={mode} />;
  }

  const hasBgm = !!storybook.backgroundMusicUrl;

  const isFullImg = settings.fullscreenImage && currentStoryPage;

  return (
    <div
      ref={containerRef}
      className={`min-h-screen flex flex-col select-none relative ${
        isFullImg ? 'bg-black' : settings.darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}
    >
      <div
        className={
          isFullImg
            ? 'absolute top-0 left-0 right-0 z-20 opacity-0 hover:opacity-100 transition-opacity duration-300'
            : ''
        }
      >
        <ViewerToolbar
          title={storybook.title}
          onHome={() => {
            stopTts();
            if (storybook.type === 'phonics') {
              navigate(`/viewer/${storybook.id}`);
            } else {
              navigate(`/library/${storybook.id}`);
            }
          }}
          darkMode={settings.darkMode}
          onToggleDark={() => updateSettings({ darkMode: !settings.darkMode })}
          textSize={settings.textSize}
          onCycleTextSize={() => {
            const cycle: ViewerSettings['textSize'][] = ['sm', 'md', 'lg'];
            const idx = cycle.indexOf(settings.textSize);
            updateSettings({ textSize: cycle[(idx + 1) % cycle.length] });
          }}
          language={settings.language}
          fullscreenImage={settings.fullscreenImage}
          onToggleFullscreen={() => updateSettings({ fullscreenImage: !settings.fullscreenImage })}
        />
      </div>

      <div
        className={`flex-1 flex items-center justify-center overflow-hidden ${isFullImg ? 'relative' : ''}`}
      >
        {currentPage === 0 && (
          <CoverView
            coverImage={storybook.coverImage}
            title={storybook.title}
            settings={settings}
          />
        )}
        {currentStoryPage && <PageView page={currentStoryPage} settings={settings} />}
        {currentPage === totalPages - 1 && (
          <EndView
            onRestart={() => goToPage(0)}
            onBack={() => navigate('/library')}
            darkMode={settings.darkMode}
          />
        )}
      </div>

      <div
        className={
          isFullImg
            ? 'absolute bottom-0 left-0 right-0 z-20 opacity-0 hover:opacity-100 transition-opacity duration-300'
            : ''
        }
      >
        <ViewerControls
          onPrev={goPrev}
          onNext={goNext}
          canPrev={currentPage > 0}
          canNext={currentPage < totalPages - 1}
          isTtsPlaying={isTtsPlaying}
          onToggleTts={handleToggleTts}
          hasBgm={hasBgm}
          isBgmPlaying={isBgmPlaying}
          onToggleBgm={toggleBgm}
          autoPlayTts={settings.autoPlayTts}
          onToggleAutoPlay={() => updateSettings({ autoPlayTts: !settings.autoPlayTts })}
        />
      </div>
    </div>
  );
}
