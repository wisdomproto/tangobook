import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook';
import { Mascot } from '@/components/Mascot';
import { StateScreen } from '@/components/StateScreen';
import { cn } from '@/lib/cn';
import { hasVideoUrl, getPrimaryVideoId, type LangCode } from '@/lib/storybook-accessors';
import { useViewerSettings, type ViewerSettings } from '../hooks/useViewerSettings';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { getPageTtsUrl } from '../lib/page-text';
import { ViewerToolbar } from './ViewerToolbar';
import { ViewerControls } from './ViewerControls';
import { PageView } from './PageView';
import { BookSpineProgress } from './BookSpineProgress';
import { MascotCorner } from './MascotCorner';
import { RewardScreen } from './RewardScreen';
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
  const [rewardOpen, setRewardOpen] = useState(false);

  // state ref로 콜백에서 최신 값 접근
  const stateRef = useRef({ pageIndex: 0, autoPlayTts: settings.autoPlayTts, rewardOpen: false });
  stateRef.current = {
    pageIndex,
    autoPlayTts: settings.autoPlayTts,
    rewardOpen,
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

  // 마지막 페이지 다 본 후 이동 대상: BookDetailPage (동화책/영상/게임 선택 화면)
  const goToBookDetail = useCallback(() => {
    navigate(`/library/${storybookId}`);
  }, [storybookId, navigate]);

  // TTS 끝났을 때 자동 넘김 (autoPlayTts + reward X + 다음 페이지 있음)
  // 마지막 페이지 + autoPlayTts ON → BookDetail로 이동
  const handleTtsEnded = useCallback(() => {
    const st = stateRef.current;
    if (!st.autoPlayTts) return;
    if (st.rewardOpen) return;
    if (st.pageIndex >= pages.length - 1) {
      setTimeout(goToBookDetail, 1000);
      return;
    }
    setTimeout(() => {
      setDirection(1);
      setPageIndex((idx) => idx + 1);
    }, 800);
  }, [pages.length, goToBookDetail]);

  const audio = useAudioPlayer({
    backgroundMusicUrl: storybook?.backgroundMusicUrl,
    onTtsEnded: handleTtsEnded,
  });

  const currentPage = pages[pageIndex];
  const currentTtsUrl = useMemo(
    () => (currentPage ? getPageTtsUrl(currentPage, lang) : undefined),
    [currentPage, lang]
  );

  // 페이지 변경 시 자동 TTS 재생 (iOS에선 첫 유저 제스처 전 무음 차단될 수 있지만 catch로 무시)
  // `mode=video|games` 또는 reward 화면이 열렸을 땐 TTS 재생하지 않음 (YouTube·게임 화면과 겹치지 않게).
  useEffect(() => {
    if (!currentTtsUrl) return;
    if (rewardOpen) return;
    if (mode === 'video' || mode === 'games') return;
    audio.playTts(currentTtsUrl);
  }, [currentTtsUrl, rewardOpen, mode]);

  // RewardScreen/영상/게임 모드로 전환될 때 진행 중이던 TTS 즉시 정지
  useEffect(() => {
    if (rewardOpen || mode === 'video' || mode === 'games') {
      audio.stopTts();
    }
  }, [rewardOpen, mode]);

  // 다음 5페이지 이미지·TTS 미리 버퍼링 (페이지 넘기기 딜레이 제거)
  const PRELOAD_AHEAD = 5;
  useEffect(() => {
    const preloadList = pages.slice(pageIndex + 1, pageIndex + 1 + PRELOAD_AHEAD);
    const loaded: HTMLImageElement[] = [];
    const audios: HTMLAudioElement[] = [];
    for (const p of preloadList) {
      if (p.illustrationUrl) {
        const img = new Image();
        img.src = p.illustrationUrl;
        loaded.push(img);
      }
      const ttsUrl = getPageTtsUrl(p, lang);
      if (ttsUrl) {
        const a = new Audio();
        a.preload = 'auto';
        a.src = ttsUrl;
        audios.push(a);
      }
    }
    return () => {
      // 참조만 끊어주면 브라우저 캐시는 유지됨
      loaded.length = 0;
      audios.forEach((a) => {
        a.src = '';
      });
    };
  }, [pageIndex, pages, lang]);

  const onPrev = () => {
    goTo(pageIndex - 1);
  };
  const onNext = () => {
    if (pageIndex >= pages.length - 1) {
      setRewardOpen(true);
      return;
    }
    goTo(pageIndex + 1);
  };
  const onToggleTts = () => {
    if (!currentTtsUrl) return;
    if (audio.isTtsPlaying) audio.stopTts();
    else audio.playTts(currentTtsUrl);
  };

  // `?mode=video` 직접 진입: iframe 임베드가 환경에 따라 막히므로 새 탭으로 YouTube 열고 이전 페이지로 복귀
  const isVideoMode = mode === 'video';
  useEffect(() => {
    if (!isVideoMode || !storybook) return;
    if (!hasVideoUrl(storybook)) return;
    const vid = getPrimaryVideoId(storybook);
    if (vid) {
      window.open(`https://www.youtube.com/watch?v=${vid}`, '_blank', 'noopener,noreferrer');
      // 영상 탭 오픈 후 viewer는 BookDetail로 돌려보냄
      navigate(`/library/${storybookId}`, { replace: true });
    }
  }, [isVideoMode, storybook, storybookId, navigate]);

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
        onBack={() => {
          audio.stopTts();
          navigate(-1);
        }}
        onHome={() => {
          audio.stopTts();
          navigate('/library');
        }}
        isTtsPlaying={audio.isTtsPlaying}
        onToggleTts={onToggleTts}
        isBgmPlaying={audio.isBgmPlaying}
        onToggleBgm={() => audio.toggleBgm()}
        hasBgm={!!storybook.backgroundMusicUrl}
        autoPlayTts={settings.autoPlayTts}
        onToggleAutoPlay={() => updateSettings({ autoPlayTts: !settings.autoPlayTts })}
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
          ttsCurrentTime={audio.ttsCurrentTime}
          ttsDuration={audio.ttsDuration}
          isTtsPlaying={audio.isTtsPlaying}
        />
      )}

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-soft">
        <BookSpineProgress current={pageIndex} total={pages.length} />
      </div>

      <MascotCorner visible={audio.isBgmPlaying} />

      <ViewerControls onPrev={onPrev} onNext={onNext} canPrev={canPrev} canNext={canNext} />

      <RewardScreen
        storybook={storybook}
        open={rewardOpen}
        autoOpenVideo={isVideoMode}
        onClose={() => setRewardOpen(false)}
        onGoHome={() => navigate(`/library/${storybook.id}`)}
        onRereadFromStart={() => {
          setRewardOpen(false);
          setDirection(-1);
          setPageIndex(0);
        }}
        onPlayGame={() => {
          setRewardOpen(false);
          navigate(`/viewer/${storybook.id}?mode=games&lang=${lang}`);
        }}
      />
    </div>
  );
}
