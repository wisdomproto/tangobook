import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useStorybook } from '@/features/storybook';
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
import { ViewerLoading } from './ViewerLoading';

interface ViewerContainerProps {
  storybookId: string | undefined;
}

const TEXT_SIZE_CYCLE: ViewerSettings['textSize'][] = ['sm', 'md', 'lg'];
const LANG_CYCLE: LangCode[] = ['ko', 'en'];

// 자동 넘김 페이싱 (4-5세 숨 고르기) — 음성이 끝난 뒤 바로 다음 음성이 깔리면 숨이 차서 쉼을 둔다.
const PAGE_REST_MS = 900; // TTS 끝 → 다음 페이지로 넘기기 전 쉬는 시간
const NEXT_TTS_DELAY_MS = 350; // 페이지 전환 → 다음 음성 재생까지 (장면 안정)
const NEXT_IMG_CAP_MS = 1500; // 다음 이미지 로딩 상한 (안 와도 넘어감)

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
  // 첫 페이지(들) TTS 버퍼링 완료 여부 — 완료 전엔 로딩 화면. video/games/파닉스(비story)는 즉시 true.
  const [ttsReady, setTtsReady] = useState(false);
  // 브라우저 autoplay 차단(iPad Safari 등)으로 첫 음성이 막히면 "탭해서 시작" 오버레이 표시.
  const [needsTapToStart, setNeedsTapToStart] = useState(false);

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
    // 다음 페이지 이미지가 준비된 뒤 넘김 — 음성이 끝났는데 이미지 로딩으로 빈 장면이 뜨는 것 방지.
    const nextImg = pages[st.pageIndex + 1]?.illustrationUrl;
    const go = () => {
      setDirection(1);
      setPageIndex((idx) => idx + 1);
    };
    if (!nextImg) {
      setTimeout(go, PAGE_REST_MS);
      return;
    }
    let fired = false;
    const fire = () => {
      if (fired) return;
      fired = true;
      go();
    };
    const im = new Image();
    im.onload = () => setTimeout(fire, PAGE_REST_MS);
    im.onerror = () => fire();
    im.src = nextImg;
    if (im.complete) setTimeout(fire, PAGE_REST_MS); // 이미 캐시면 쉬고 넘김
    setTimeout(fire, NEXT_IMG_CAP_MS); // 상한 — 이미지가 안 와도 넘어감
  }, [pages, hasKeyObjects]);

  const audio = useAudioPlayer({
    backgroundMusicUrl: storybook?.backgroundMusicUrl,
    backgroundMusicVolume: storybook?.backgroundMusicVolume,
    onTtsEnded: handleTtsEnded,
  });

  const currentPage = pages[pageIndex];
  const currentTtsUrl = useMemo(
    () => (currentPage ? getPageTtsUrl(currentPage, lang) : undefined),
    [currentPage, lang]
  );

  // 페이지 변경 시 자동 TTS 재생. 첫 진입은 ttsReady(버퍼링 완료) 후에만 — 로딩 끝나고 바로 재생.
  // BGM 은 useAudioPlayer 가 마운트 시 바로 재생 (별도).
  // `mode=video|games` 또는 reward/wordReveal 화면이 열렸을 땐 TTS 재생하지 않음.
  useEffect(() => {
    if (!currentTtsUrl || !ttsReady) return;
    if (rewardOpen || wordRevealOpen) return;
    if (mode === 'video' || mode === 'games') return;
    // 이미 버퍼링됐으니 첫 음성 즉시. 페이지 전환 안정용 짧은 딜레이만.
    // autoplay 가 막히면(차단 브라우저) playTts 가 false 반환 → "탭해서 시작" 오버레이.
    const t = setTimeout(() => {
      audio.playTts(currentTtsUrl).then((started) => {
        if (!started) setNeedsTapToStart(true);
      });
    }, NEXT_TTS_DELAY_MS);
    // 워치독: play() 가 reject 없이 조용히 막히는 브라우저 대비 — 실제 음성이 시작 안 됐으면 오버레이.
    const watchdog = setTimeout(() => {
      if (!audio.hasTtsStarted()) setNeedsTapToStart(true);
    }, NEXT_TTS_DELAY_MS + 1500);
    return () => {
      clearTimeout(t);
      clearTimeout(watchdog);
    };
  }, [currentTtsUrl, ttsReady, rewardOpen, wordRevealOpen, mode]);

  // 첫 진입 시 첫 BUFFER_PAGES 페이지 TTS 를 버퍼링한 뒤 시작 (로딩 화면 동안). 같은 컴포넌트의
  // Audio 풀이라 playTts 가 그대로 재사용 → 로딩 끝나면 첫 음성 즉시. video/games/파닉스(비story) 생략.
  const BUFFER_PAGES = 3;
  useEffect(() => {
    if (!storybook) return;
    const skip =
      mode === 'video' || mode === 'games' || (storybook.type === 'phonics' && mode !== 'story');
    if (skip) {
      setTtsReady(true);
      return;
    }
    const firstUrls = pages
      .slice(0, BUFFER_PAGES)
      .map((p) => getPageTtsUrl(p, lang))
      .filter((u): u is string => !!u);
    if (firstUrls.length === 0) {
      setTtsReady(true);
      return;
    }
    setTtsReady(false);
    const aheadUrls = pages
      .slice(BUFFER_PAGES, BUFFER_PAGES + 2)
      .map((p) => getPageTtsUrl(p, lang))
      .filter((u): u is string => !!u);
    audio.preloadTts([...firstUrls, ...aheadUrls]);
    // 첫 페이지 이미지도 미리 로드 — 음성/자막만 먼저 나오고 이미지가 늦게 뜨는 것 방지.
    // 다음 페이지들 이미지는 아래 프리로드 useEffect 가 백그라운드로 데운다.
    const firstImg = pages[0]?.illustrationUrl;
    const waitImg = firstImg
      ? new Promise<void>((res) => {
          const im = new Image();
          im.onload = () => res();
          im.onerror = () => res();
          im.src = firstImg;
        })
      : Promise.resolve();
    let cancelled = false;
    // 첫 페이지의 음성(canplay) + 이미지가 둘 다 준비되면 로딩 해제 → 음성·이미지 동시 시작.
    Promise.all([audio.waitForTts(firstUrls.slice(0, 1)), waitImg]).then(() => {
      if (!cancelled) setTtsReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [storybookId, lang, mode, storybook]);

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
  }, [pageIndex, storybook, storybookId, mode, lang, pages, logEvent, logBatch, urlStyle]);

  // 이미지: 다음 페이지 미리 로드 / TTS: 현재 페이지부터 미리 버퍼링 (첫 음성 지연 제거)
  const PRELOAD_AHEAD = 5;
  useEffect(() => {
    // 이미지는 다음 페이지들 (현재 페이지는 이미 렌더 중이라 제외)
    const imgList = pages.slice(pageIndex + 1, pageIndex + 1 + PRELOAD_AHEAD);
    const loaded: HTMLImageElement[] = [];
    for (const p of imgList) {
      if (p.illustrationUrl) {
        const img = new Image();
        img.src = p.illustrationUrl;
        loaded.push(img);
      }
    }
    // TTS 는 현재 페이지를 포함해 버퍼링 — 진입 직후 첫 음성이 즉시 나오도록.
    // playTts 가 이 풀의 Audio 객체를 재사용하므로 HTTP 캐시/Cache-Control 에 의존하지 않는다.
    const ttsList = pages.slice(pageIndex, pageIndex + 1 + PRELOAD_AHEAD);
    audio.preloadTts(ttsList.map((p) => getPageTtsUrl(p, lang)));
    return () => {
      loaded.length = 0;
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
    return <ViewerLoading label="동화책을 펼치고 있어요" />;
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

  // 첫 페이지 TTS+이미지 버퍼링 중 — 차오르는 로딩 바. 버퍼 완료 후 첫 페이지 + 즉시 재생.
  if (!ttsReady) {
    return <ViewerLoading label="책 읽어줄 준비를 하고 있어요" />;
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

      {/* autoplay 차단 시 — 탭으로 음성+BGM 시작 (사용자 제스처 안에서 재생 → 모든 브라우저 OK) */}
      {needsTapToStart && (
        <button
          type="button"
          onClick={() => {
            if (!audio.isBgmPlaying) audio.toggleBgm();
            const url = currentTtsUrl;
            setNeedsTapToStart(false);
            if (url)
              audio.playTts(url).then((started) => {
                if (!started) setNeedsTapToStart(true);
              });
          }}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-cream-50/95 backdrop-blur-sm"
        >
          <span className="flex h-24 w-24 items-center justify-center rounded-full bg-coral-500 text-white shadow-soft animate-pulse">
            <svg className="w-10 h-10 ml-1" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="font-display text-xl font-black text-ink-900 break-keep">
            탭해서 시작하기
          </span>
          <span className="text-sm text-ink-500 break-keep">
            화면을 한 번 누르면 이야기가 시작돼요
          </span>
        </button>
      )}

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
