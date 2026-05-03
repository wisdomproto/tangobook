import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook';
import { Mascot } from '@/design-system';
import { StateScreen } from '@/design-system';
import { cn } from '@/lib/cn';
import {
  hasVideoUrl,
  hasGames,
  getPrimaryVideoId,
  getDirectVideoUrls,
  type LangCode,
} from '@/lib/storybook-accessors';
import { useLogEvent, useLogEventsBatch } from '@/features/learning';
import { extractPageWords } from '@/features/learning/lib/extract-page-words';
import type { Lang } from '@tangobook/shared';
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
import { WordRevealScreen } from './WordRevealScreen';
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
  const urlStyle = sp.get('style');

  // v1 단일화. URL ?style 이 base.artStyle 과 다르면 styleAssets 로 표지/페이지 일러스트 즉시 swap.
  // 레벨 variant 는 sibling pattern(`${baseId}__L1` 등)으로 별도 storybook 이므로
  // BookDetailPage 가 sibling URL 로 navigate, 여기서는 storybookId 가 가리키는 책만 본다.
  const storybook = useMemo(() => {
    if (!v1Storybook) return v1Storybook;
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
  }, [v1Storybook, urlStyle]);

  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [rewardOpen, setRewardOpen] = useState(false);
  const [wordRevealOpen, setWordRevealOpen] = useState(false);

  // state ref로 콜백에서 최신 값 접근
  const stateRef = useRef({
    pageIndex: 0,
    autoPlayTts: settings.autoPlayTts,
    rewardOpen: false,
    wordRevealOpen: false,
  });
  stateRef.current = {
    pageIndex,
    autoPlayTts: settings.autoPlayTts,
    rewardOpen,
    wordRevealOpen,
  };

  // 핵심 단어 보기 화면 우선 — 책에 key_objects 있고 mode=video 가 아닐 때
  const hasKeyObjects = (storybook?.key_objects?.length ?? 0) > 0;

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
    if (st.rewardOpen || st.wordRevealOpen) return;
    if (st.pageIndex >= pages.length - 1) {
      // 핵심 단어 보기 우선 — key_objects 있으면 WordRevealScreen, 없으면 기존 RewardScreen
      setTimeout(() => {
        if (hasKeyObjects) {
          setWordRevealOpen(true);
        } else {
          setRewardOpen(true);
        }
      }, 1000);
      return;
    }
    setTimeout(() => {
      setDirection(1);
      setPageIndex((idx) => idx + 1);
    }, 800);
  }, [pages.length, hasKeyObjects]);

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
  // `mode=video|games` 또는 reward/wordReveal 화면이 열렸을 땐 TTS 재생하지 않음.
  useEffect(() => {
    if (!currentTtsUrl) return;
    if (rewardOpen || wordRevealOpen) return;
    if (mode === 'video' || mode === 'games') return;
    const t = setTimeout(() => audio.playTts(currentTtsUrl), 1000);
    return () => clearTimeout(t);
  }, [currentTtsUrl, rewardOpen, wordRevealOpen, mode]);

  // RewardScreen/WordRevealScreen/영상/게임 모드로 전환될 때 진행 중이던 TTS 즉시 정지
  useEffect(() => {
    if (rewardOpen || wordRevealOpen || mode === 'video' || mode === 'games') {
      audio.stopTts();
    }
  }, [rewardOpen, wordRevealOpen, mode]);

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
        // 현재 viewing 중인 그림체 — URL ?style 우선, 베이스 폴백
        style: urlStyle ?? storybook.artStyle ?? undefined,
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
      if (hasKeyObjects) {
        setWordRevealOpen(true);
      } else {
        setRewardOpen(true);
      }
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
  const hasAnyVideo = storybook ? hasVideoUrl(storybook) : false;
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

  // 게임 모드 → GameListViewer (v2Style prop 은 GameListViewer 의 v2 fallback 용 — urlStyle 그대로 전달)
  if (mode === 'games') {
    return (
      <GameListViewer storybook={storybook} bid={storybookId} v2Style={urlStyle ?? undefined} />
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
        videoId={getPrimaryVideoId(storybook) ?? undefined}
        directVideoUrl={getDirectVideoUrls(storybook)[0]}
        hasGames={hasGames(storybook)}
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

      {/* Phase 1 동화 트랙 — 책 자연 종료 시 핵심 단어 보기 (key_objects 있는 책만). */}
      {/* mode=video 직접 진입은 RewardScreen 그대로. */}
      <WordRevealScreen
        storybook={storybook}
        open={wordRevealOpen}
        currentStyle={urlStyle ?? storybook.artStyle ?? undefined}
        onGoToVocabulary={() => {
          setWordRevealOpen(false);
          // 책별 어휘 단원으로 deep link (storybook derived 단원)
          navigate(`/vocabulary/book-${storybookId}`);
        }}
        onGoHome={() => {
          setWordRevealOpen(false);
          navigate('/library');
        }}
        onRereadFromStart={() => {
          setWordRevealOpen(false);
          setDirection(-1);
          setPageIndex(0);
        }}
      />
    </div>
  );
}
