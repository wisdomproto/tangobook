import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook';
import { useBookManifest, useRuntimeViewer } from '@/features/book-v2';
import { Mascot } from '@/components/Mascot';
import { StateScreen } from '@/components/StateScreen';
import { cn } from '@/lib/cn';
import { hasVideoUrl, type LangCode } from '@/lib/storybook-accessors';
import { useLogEvent, useLogEventsBatch } from '@/features/learning';
import { extractPageWords } from '@/features/learning/lib/extract-page-words';
import type { Lang } from '@tangobook/shared';
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

  const { data: v1Storybook, isLoading, error } = useStorybook(storybookId);
  const [settings, updateSettings] = useViewerSettings();

  const lang = (sp.get('lang') ?? settings.language) as LangCode;

  // v2 manifest 시도 (있으면 pages/cover/title을 v2로 override)
  const { data: v2Manifest } = useBookManifest(storybookId);
  // 선호: launchLevel(원본 저작 레벨) → 없으면 usedVariants 첫 항목
  const v2Level =
    v2Manifest?.curriculumMeta?.launchLevel &&
    v2Manifest.usedVariants.levels.includes(v2Manifest.curriculumMeta.launchLevel)
      ? v2Manifest.curriculumMeta.launchLevel
      : v2Manifest?.usedVariants.levels[0];
  const v2Style = v2Manifest?.usedVariants.styles[0];
  const v2Filter =
    v2Level && v2Style
      ? { level: v2Level, language: lang === 'en' ? 'en' : 'ko', style: v2Style }
      : null;
  const { data: v2Payload } = useRuntimeViewer(storybookId ?? '', v2Filter);

  // v2 payload가 있으면 v1 storybook의 pages/cover/title/parentGuide를 덮어씀
  // (v1 R2 정리 시점까지 audiobookProjects/longformProjects/games 등은 v1에서 그대로 사용)
  const storybook = useMemo(() => {
    if (!v1Storybook) return v1Storybook;
    if (!v2Payload) return v1Storybook;
    // v1의 페이지를 base로 두고 v2 데이터만 덮어쓴다 (scene_structure 등 v1 필수 필드 보존).
    const v1PagesByNumber = new Map(v1Storybook.pages.map((p) => [p.pageNumber, p]));
    const mergedPages = v2Payload.pages.map((vp) => {
      const v1Page = v1PagesByNumber.get(vp.pageNumber);
      if (!v1Page) return null;
      return {
        ...v1Page,
        text: vp.text,
        illustrationUrl: vp.illustrationUrl ?? v1Page.illustrationUrl,
        ttsUrl: vp.ttsUrl ?? v1Page.ttsUrl,
        scene_description: vp.sceneDescription ?? v1Page.scene_description,
        // translations은 v2가 lang별로 미리 fetch됐으므로 비움 → getPageText는 page.text로 fallback
        translations: undefined,
      };
    });
    const validPages = mergedPages.filter((p): p is NonNullable<typeof p> => p !== null);
    if (validPages.length === 0) return v1Storybook;
    return {
      ...v1Storybook,
      title: v2Payload.title || v1Storybook.title,
      coverImage: v2Payload.coverImageUrl ?? v1Storybook.coverImage,
      backgroundMusicUrl: v2Payload.bgmUrl ?? v1Storybook.backgroundMusicUrl,
      parentGuide: v2Payload.parentGuide ?? v1Storybook.parentGuide,
      pages: validPages,
    };
  }, [v1Storybook, v2Payload]);

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

  // 학습 이벤트 emit — 페이지가 바뀔 때 이전 페이지에 대해 page_read + word_exposed 배치
  const logEvent = useLogEvent();
  const logBatch = useLogEventsBatch();
  const lastEmittedPageRef = useRef<number | null>(null);
  useEffect(() => {
    if (!storybook || !storybookId) return;
    if (mode === 'video' || mode === 'games') return;
    if (storybook.type === 'phonics' && mode !== 'story') return;
    if (lastEmittedPageRef.current === pageIndex) return;
    lastEmittedPageRef.current = pageIndex;

    const page = pages[pageIndex];
    if (!page) return;
    const pageNumber = page.pageNumber ?? pageIndex + 1;
    const narrowLang: Lang = lang === 'en' ? 'en' : 'ko';
    logEvent({
      type: 'page_read',
      storybookId,
      metadata: { lang: narrowLang, page: pageNumber, source: 'storybook' },
    });
    const words = extractPageWords(storybook, pageNumber, narrowLang);
    if (words.length > 0) {
      logBatch(
        words.map((w) => ({
          event_type: 'word_exposed',
          storybook_id: storybookId,
          word: w.word,
          metadata: {
            lang: narrowLang,
            source: 'storybook',
            storybookId,
            pageNumber,
            korean: w.korean,
          },
        }))
      );
    }
  }, [pageIndex, storybook, storybookId, mode, lang, pages, logEvent, logBatch]);

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

  // `?mode=video` 직접 진입 → RewardScreen autoOpenVideo로 iframe 모달 띄우기
  const isVideoMode = mode === 'video';
  useEffect(() => {
    if (!isVideoMode || !storybook) return;
    if (!hasVideoUrl(storybook)) return;
    setRewardOpen(true);
  }, [isVideoMode, storybook]);

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
