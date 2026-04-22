import { useCallback, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook';
import { Mascot } from '@/components/Mascot';
import { StateScreen } from '@/components/StateScreen';
import { cn } from '@/lib/cn';
import type { LangCode } from '@/lib/storybook-accessors';
import { useViewerSettings, type ViewerSettings } from '../hooks/useViewerSettings';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getPageTtsUrl } from '../lib/page-text';
import { ViewerToolbar } from './ViewerToolbar';
import { ViewerControls } from './ViewerControls';
import { PageView } from './PageView';
import { BookSpineProgress } from './BookSpineProgress';
import { MascotCorner } from './MascotCorner';
import { GameListViewer } from './GameListViewer';
import { PhonicsViewer } from './PhonicsViewer';

interface ViewerContainerProps {
  storybookId: string | undefined;
}

const TEXT_SIZE_CYCLE: ViewerSettings['textSize'][] = ['sm', 'md', 'lg'];
const LANG_CYCLE: LangCode[] = ['ko', 'en'];

export function ViewerContainer({ storybookId }: ViewerContainerProps) {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const mode = sp.get('mode');

  const { data: storybook, isLoading, error } = useStorybook(storybookId);
  const [settings, updateSettings] = useViewerSettings();

  const lang = (sp.get('lang') ?? settings.language) as LangCode;

  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  // state ref로 콜백에서 최신 값 접근
  // rewardOpen은 Phase D에서 실 state로 교체됨
  const stateRef = useRef({ pageIndex: 0, autoPlayTts: settings.autoPlayTts, rewardOpen: false });
  stateRef.current = {
    pageIndex,
    autoPlayTts: settings.autoPlayTts,
    rewardOpen: false,
  };

  const pages = storybook?.pages ?? [];
  const canPrev = pageIndex > 0;
  const canNext = pageIndex < pages.length - 1;

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= pages.length) return;
      setDirection(next > pageIndex ? 1 : -1);
      setPageIndex(next);
    },
    [pageIndex, pages.length]
  );

  // TTS 끝났을 때 자동 넘김 (autoPlayTts + reward X + 다음 페이지 있음)
  const handleTtsEnded = useCallback(() => {
    const st = stateRef.current;
    if (!st.autoPlayTts) return;
    if (st.rewardOpen) return;
    if (st.pageIndex >= pages.length - 1) return;
    setTimeout(() => {
      setDirection(1);
      setPageIndex((idx) => idx + 1);
    }, 800);
  }, [pages.length]);

  const audio = useAudioPlayer({
    backgroundMusicUrl: storybook?.backgroundMusicUrl,
    onTtsEnded: handleTtsEnded,
  });

  const currentPage = pages[pageIndex];
  const currentTtsUrl = useMemo(
    () => (currentPage ? getPageTtsUrl(currentPage, lang) : undefined),
    [currentPage, lang]
  );

  // 페이지 이동 시 자동 TTS — 사용자 첫 탭 이후에만 (iOS 정책)
  const previousPageIndex = useRef(pageIndex);
  if (previousPageIndex.current !== pageIndex) {
    previousPageIndex.current = pageIndex;
    if (hasUserInteracted && currentTtsUrl) audio.playTts(currentTtsUrl);
  }

  const markInteracted = () => {
    if (!hasUserInteracted) setHasUserInteracted(true);
  };

  const onPrev = () => {
    markInteracted();
    goTo(pageIndex - 1);
  };
  const onNext = () => {
    markInteracted();
    if (pageIndex >= pages.length - 1) {
      // Phase D에서 RewardScreen open으로 대체
      return;
    }
    goTo(pageIndex + 1);
  };
  const onToggleTts = () => {
    markInteracted();
    if (!currentTtsUrl) return;
    if (audio.isTtsPlaying) audio.stopTts();
    else audio.playTts(currentTtsUrl);
  };

  const onToggleLanguage = () => {
    const cur = LANG_CYCLE.indexOf(lang as 'ko' | 'en');
    const next = LANG_CYCLE[(cur === -1 ? 0 : cur + 1) % LANG_CYCLE.length];
    setSp((prev) => {
      prev.set('lang', next);
      return prev;
    });
    updateSettings({ language: next });
  };

  // Loading / Error
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50">
        <Mascot state="reading" size="xl" />
      </div>
    );
  }
  if (error || !storybook) {
    return (
      <StateScreen
        mascotState="sad"
        title="이 책을 찾을 수 없어"
        action={{ label: '🏠 라이브러리', onClick: () => navigate('/library') }}
      />
    );
  }

  // 게임 모드 → GameListViewer
  if (mode === 'games') {
    return <GameListViewer storybook={storybook} />;
  }

  // 파닉스 콘텐츠 → PhonicsViewer (story 모드는 일반 동화책 뷰어 재사용)
  if (storybook.type === 'phonics' && mode !== 'story') {
    return <PhonicsViewer storybook={storybook} mode={mode} />;
  }

  return (
    <div
      className={cn(
        'min-h-screen relative overflow-hidden',
        settings.darkMode
          ? 'bg-darkbg text-darktext'
          : 'bg-gradient-to-b from-cream-50 to-peach-100 text-ink-900'
      )}
    >
      <ViewerToolbar
        title={storybook.title}
        onHome={() => {
          audio.stopTts();
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
          const next =
            TEXT_SIZE_CYCLE[
              (TEXT_SIZE_CYCLE.indexOf(settings.textSize) + 1) % TEXT_SIZE_CYCLE.length
            ];
          updateSettings({ textSize: next });
        }}
        language={lang}
        onToggleLanguage={onToggleLanguage}
        fullscreenImage={settings.fullscreenImage}
        onToggleFullscreen={() => updateSettings({ fullscreenImage: !settings.fullscreenImage })}
      />

      {currentPage && (
        <PageView
          page={currentPage}
          pageIndex={pageIndex}
          direction={direction}
          lang={lang}
          showSubtext={settings.showText}
          textSize={settings.textSize}
          isDarkMode={settings.darkMode}
        />
      )}

      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft">
        <BookSpineProgress current={pageIndex} total={pages.length} />
      </div>

      <MascotCorner visible={audio.isBgmPlaying} />

      <ViewerControls
        onPrev={onPrev}
        onNext={onNext}
        canPrev={canPrev}
        canNext={canNext}
        isTtsPlaying={audio.isTtsPlaying}
        onToggleTts={onToggleTts}
        isBgmPlaying={audio.isBgmPlaying}
        onToggleBgm={() => {
          markInteracted();
          audio.toggleBgm();
        }}
        hasBgm={!!storybook.backgroundMusicUrl}
        autoPlayTts={settings.autoPlayTts}
        onToggleAutoPlay={() => updateSettings({ autoPlayTts: !settings.autoPlayTts })}
      />
    </div>
  );
}
