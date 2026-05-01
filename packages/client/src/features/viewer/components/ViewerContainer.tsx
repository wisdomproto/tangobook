import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook';
import {
  useBookManifest,
  useRuntimeViewer,
  useAudiobookRenders,
  useLongformList,
  useGamesList,
} from '@/features/book-v2';
import { Mascot } from '@/design-system';
import { StateScreen } from '@/design-system';
import { cn } from '@/lib/cn';
import { hasVideoUrl, hasGames, getPrimaryVideoId, type LangCode } from '@/lib/storybook-accessors';
import { useLogEvent, useLogEventsBatch } from '@/features/learning';
import { extractPageWords } from '@/features/learning/lib/extract-page-words';
import type { Lang, ReadingLevel } from '@tangobook/shared';
import { useStorybookCardIndex } from '@/features/collection';
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
  // 우선순위: URL param > launchLevel > usedVariants 첫 항목
  const urlLevel = sp.get('level') as ReadingLevel | null;
  const urlStyle = sp.get('style');
  const v2Level =
    urlLevel && v2Manifest?.usedVariants.levels.includes(urlLevel)
      ? urlLevel
      : v2Manifest?.curriculumMeta?.launchLevel &&
          v2Manifest.usedVariants.levels.includes(v2Manifest.curriculumMeta.launchLevel)
        ? v2Manifest.curriculumMeta.launchLevel
        : v2Manifest?.usedVariants.levels[0];
  const v2Style =
    urlStyle && v2Manifest?.usedVariants.styles.includes(urlStyle)
      ? urlStyle
      : v2Manifest?.usedVariants.styles[0];
  const v2Filter =
    v2Level && v2Style
      ? { level: v2Level, language: lang === 'en' ? 'en' : 'ko', style: v2Style }
      : null;
  const { data: v2Payload } = useRuntimeViewer(storybookId ?? '', v2Filter);

  // Reward 화면 + GameListViewer를 위한 v2 데이터
  const { data: v2AudioRenders } = useAudiobookRenders(storybookId ?? '');
  const { data: v2Longform } = useLongformList(storybookId ?? '');
  const { data: v2Games } = useGamesList(storybookId ?? '');

  // v2 우선: youtubeVideoId 또는 직접 videoUrl 추출
  const v2VideoId = useMemo(() => {
    return (
      v2AudioRenders?.find((r) => r.youtubeVideoId)?.youtubeVideoId ??
      v2Longform?.find((p) => p.youtubeVideoId)?.youtubeVideoId
    );
  }, [v2AudioRenders, v2Longform]);
  const v2DirectVideoUrl = useMemo(() => {
    return (
      v2AudioRenders?.find((r) => r.videoUrl)?.videoUrl ??
      v2Longform?.find((p) => p.videoUrl)?.videoUrl
    );
  }, [v2AudioRenders, v2Longform]);
  const v2HasGames = (v2Games?.length ?? 0) > 0;

  // v2 payload가 있으면 v1 storybook의 pages/cover/title/parentGuide를 덮어씀
  // (v1 R2 정리 시점까지 audiobookProjects/longformProjects/games 등은 v1에서 그대로 사용)
  // v2 도착 전이라도 urlStyle 이 base.artStyle 과 다르면 v1.styleAssets 로 즉시 swap (다른 그림체 잔상 방지)
  const storybook = useMemo(() => {
    if (!v1Storybook) return v1Storybook;

    // v2 우선
    if (v2Payload) {
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
          translations: undefined,
        };
      });
      const validPages = mergedPages.filter((p): p is NonNullable<typeof p> => p !== null);
      if (validPages.length > 0) {
        return {
          ...v1Storybook,
          title: v2Payload.title || v1Storybook.title,
          coverImage: v2Payload.coverImageUrl ?? v1Storybook.coverImage,
          backgroundMusicUrl: v2Payload.bgmUrl ?? v1Storybook.backgroundMusicUrl,
          parentGuide: v2Payload.parentGuide ?? v1Storybook.parentGuide,
          pages: validPages,
        };
      }
    }

    // v2 안 도착 → urlStyle 이 base 와 다르면 v1.styleAssets 로 즉시 swap
    if (urlStyle && urlStyle !== v1Storybook.artStyle) {
      const sa = v1Storybook.styleAssets?.[urlStyle];
      if (sa) {
        const pageIllus = sa.pageIllustrations ?? {};
        const swapped = v1Storybook.pages.map((p) => ({
          ...p,
          illustrationUrl:
            (p.pageNumber != null && pageIllus[p.pageNumber]?.illustrationUrl) || p.illustrationUrl,
        }));
        return {
          ...v1Storybook,
          coverImage: sa.coverImage ?? v1Storybook.coverImage,
          pages: swapped,
        };
      }
    }

    return v1Storybook;
  }, [v1Storybook, v2Payload, urlStyle]);

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

  // TTS 끝났을 때 자동 넘김 (autoPlayTts + reward X + 다음 페이지 있음)
  // 마지막 페이지 + autoPlayTts ON → RewardScreen overlay (영상·게임·홈 선택)
  const handleTtsEnded = useCallback(() => {
    const st = stateRef.current;
    if (!st.autoPlayTts) return;
    if (st.rewardOpen) return;
    if (st.pageIndex >= pages.length - 1) {
      setTimeout(() => setRewardOpen(true), 1000);
      return;
    }
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

  // 페이지 변경 시 자동 TTS 재생. 1초 딜레이 — 첫 진입 / 페이지 넘김 직후 갑자기 안 나오게.
  // BGM 은 useAudioPlayer 가 마운트 시 바로 재생 (별도). TTS + 자막만 딜레이됨.
  // `mode=video|games` 또는 reward 화면이 열렸을 땐 TTS 재생하지 않음.
  useEffect(() => {
    if (!currentTtsUrl) return;
    if (rewardOpen) return;
    if (mode === 'video' || mode === 'games') return;
    const t = setTimeout(() => audio.playTts(currentTtsUrl), 1000);
    return () => clearTimeout(t);
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
  const { data: storybookCardIndex } = useStorybookCardIndex();
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
    const totalPages = pages.length;
    const isLast = pageNumber >= totalPages;
    // 이 책에 매칭되는 카드 ID 배열 — 트리거가 silhouette/owned 자동 전이
    const collectionItemIds = storybookCardIndex?.[storybookId] ?? [];
    logEvent({
      type: 'page_read',
      storybookId,
      metadata: {
        lang: narrowLang,
        page: pageNumber,
        totalPages,
        lastPage: isLast,
        source: 'storybook',
        // 현재 viewing 중인 그림체 (variant 시스템) — v2 우선, 그 다음 URL, 베이스 폴백
        style: v2Style ?? urlStyle ?? storybook.artStyle ?? undefined,
        collectionItemIds: collectionItemIds.length > 0 ? collectionItemIds : undefined,
      },
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
  }, [
    pageIndex,
    storybook,
    storybookId,
    mode,
    lang,
    pages,
    logEvent,
    logBatch,
    v2Style,
    urlStyle,
    storybookCardIndex,
  ]);

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
  // 자동재생 master switch — autoPlayTts 토글 + TTS 동기화
  // 멈출 땐 pauseTts (현재 위치 유지) — 다시 켤 때 이어재생.
  const onTogglePlayback = () => {
    const next = !settings.autoPlayTts;
    updateSettings({ autoPlayTts: next });
    if (next) {
      // ON: 일시정지 중이면 이어재생, 아니면 새로 재생
      if (audio.ttsCurrentTime > 0) {
        audio.resumeTts();
      } else if (currentTtsUrl) {
        audio.playTts(currentTtsUrl);
      }
    } else {
      audio.pauseTts();
    }
  };

  // `?mode=video` 직접 진입 → RewardScreen autoOpenVideo로 iframe 모달 띄우기
  const isVideoMode = mode === 'video';
  const hasAnyVideo =
    !!v2VideoId || !!v2DirectVideoUrl || (storybook ? hasVideoUrl(storybook) : false);
  useEffect(() => {
    if (!isVideoMode) return;
    if (!hasAnyVideo) return;
    setRewardOpen(true);
  }, [isVideoMode, hasAnyVideo]);

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
    return (
      <GameListViewer storybook={storybook} bid={storybookId} v2Style={v2Style ?? undefined} />
    );
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
      {!settings.fullscreenImage && (
        <ViewerToolbar
          title={storybook.title}
          onBack={() => {
            audio.stopTts();
            // 책 소개 페이지로 명시 이동 — history back 은 직전 진입 경로 따라 다른 곳으로 갈 수 있음
            navigate(`/library/${storybookId}`);
          }}
          onHome={() => {
            audio.stopTts();
            navigate('/library');
          }}
          isPlaying={settings.autoPlayTts}
          onTogglePlayback={onTogglePlayback}
          isBgmPlaying={audio.isBgmPlaying}
          onToggleBgm={() => audio.toggleBgm()}
          hasBgm={!!storybook.backgroundMusicUrl}
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
      )}

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
          fullscreen={settings.fullscreenImage}
        />
      )}

      {/* 페이지 진행률 — Toolbar 와 같은 line (가운데). 풀스크린 시 숨김. */}
      {!settings.fullscreenImage && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm px-3 h-10 flex items-center rounded-md shadow-soft pointer-events-none">
          <BookSpineProgress current={pageIndex} total={pages.length} />
        </div>
      )}

      {/* 풀스크린 종료 버튼 — 풀스크린 시만 우상단 floating (반투명) */}
      {settings.fullscreenImage && (
        <button
          onClick={() => updateSettings({ fullscreenImage: false })}
          className="absolute top-3 right-3 z-30 w-11 h-11 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-sm text-ink-900 flex items-center justify-center text-lg shadow-soft transition-all"
          title="풀스크린 끄기"
          aria-label="풀스크린 끄기"
        >
          ✕
        </button>
      )}

      <MascotCorner visible={audio.isBgmPlaying} />

      {!settings.fullscreenImage && (
        <ViewerControls onPrev={onPrev} onNext={onNext} canPrev={canPrev} canNext={canNext} />
      )}

      <RewardScreen
        title={storybook.title}
        videoId={v2VideoId ?? (storybook ? (getPrimaryVideoId(storybook) ?? undefined) : undefined)}
        directVideoUrl={v2DirectVideoUrl}
        hasGames={v2HasGames || (storybook ? hasGames(storybook) : false)}
        open={rewardOpen}
        autoOpenVideo={isVideoMode}
        onClose={() => setRewardOpen(false)}
        onGoHome={() => navigate('/library')}
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
