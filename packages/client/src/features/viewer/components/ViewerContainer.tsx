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
import { canReadBook, type Lang } from '@tangobook/shared';
import { useAccess, PaywallNotice } from '@/features/access';
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

interface PlaylistProp {
  hasNext: boolean;
  onBookEnd: () => void;
  speed: number;
  /** Non-first books in a playlist: skip the tap-to-start gate. The browser
   *  audio unlock from the first book's tap is per-page-session, so books 2+
   *  can auto-play programmatically without a new user gesture. */
  autoStart?: boolean;
  /** When true, pause TTS and halt queue auto-advance. When it flips back to
   *  false, resume TTS from current position. Controlled by playlist.store. */
  paused?: boolean;
}

interface ViewerContainerProps {
  storybookId: string | undefined;
  /** When present, enables playlist mode: last-page reward is replaced by
   *  onBookEnd(), speed/fullscreen are forced, and load errors are skipped. */
  playlist?: PlaylistProp;
}

const TEXT_SIZE_CYCLE: ViewerSettings['textSize'][] = ['sm', 'md', 'lg'];
const LANG_CYCLE: LangCode[] = ['ko', 'en'];

// 자동 넘김 페이싱 (4-5세 숨 고르기) — 음성이 끝난 뒤 바로 다음 음성이 깔리면 숨이 차서 쉼을 둔다.
const PAGE_REST_MS = 900; // TTS 끝 → 다음 페이지로 넘기기 전 쉬는 시간
const NEXT_TTS_DELAY_MS = 350; // 페이지 전환 → 다음 음성 재생까지 (장면 안정)
const NEXT_IMG_CAP_MS = 1500; // 다음 이미지 로딩 상한 (안 와도 넘어감)

export function ViewerContainer({ storybookId, playlist }: ViewerContainerProps) {
  const navigate = useNavigate();
  const [sp, setSp] = useSearchParams();
  const mode = sp.get('mode');

  const { data: v1Storybook, isLoading, error } = useStorybook(storybookId);
  const [settings, updateSettings] = useViewerSettings();
  const access = useAccess();

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
  // 음성 끝 ~ 다음 페이지 전환 대기 중 (자동넘김 "다음 장" 인디케이터)
  const [advancing, setAdvancing] = useState(false);
  const [wordRevealOpen, setWordRevealOpen] = useState(false);
  // 첫 페이지(들) TTS 버퍼링 완료 여부 — 완료 전엔 로딩 화면. video/games/파닉스(비story)는 즉시 true.
  const [ttsReady, setTtsReady] = useState(false);
  // 첫 진입은 항상 '시작' 버튼 → 사용자 탭 안에서 재생(모든 브라우저 OK, autoplay 정책 우회).
  const [needsTapToStart, setNeedsTapToStart] = useState(false);
  // 전체화면은 책마다 진입 시 기본 ON (영구 저장 X) — 끄면 그 책 보는 동안만, 다음 책은 다시 전체화면.
  const [fullscreenLocal, setFullscreenLocal] = useState(true);
  // 한 번 시작하면(사용자 제스처로 오디오 해금) 이후 페이지는 자동재생.
  // playlist autoStart(2번째 이후 책): 첫 책 탭으로 오디오 해금됨 → 탭 게이트 없이 바로 자동재생.
  // 컴포넌트가 책마다 remount(key={bookId}) 되므로 초기값으로 안전하게 세팅.
  const startedRef = useRef(playlist?.autoStart === true);
  // 마지막으로 재생을 건 TTS url — 같은 페이지를 두 번 재생(첫 음절 씹힘) 방지.
  const lastPlayedTtsRef = useRef<string | null>(null);
  // playlist mode: stall-guard timer handle — cleared when TTS ends or page changes.
  const stallTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // playlist mode: error-skip guard — fire onBookEnd at most once per mount.
  const playlistSkippedRef = useRef(false);

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
      setAdvancing(false); // 수동 넘김 시 자동넘김 인디케이터 해제
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
      // [Site 1] playlist mode: skip reward/wordReveal overlay, call onBookEnd immediately.
      if (playlist) {
        if (stallTimerRef.current) clearTimeout(stallTimerRef.current);
        playlist.onBookEnd();
        return;
      }
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
    // page changed — clear stall guard
    if (stallTimerRef.current) {
      clearTimeout(stallTimerRef.current);
      stallTimerRef.current = null;
    }
    // 다음 페이지 이미지가 준비된 뒤 넘김 — 음성이 끝났는데 이미지 로딩으로 빈 장면이 뜨는 것 방지.
    // 음성 끝 ~ 전환 사이 "다음 장 준비 중" dot 인디케이터 표시.
    setAdvancing(true);
    const nextImg = pages[st.pageIndex + 1]?.illustrationUrl;
    const go = () => {
      setAdvancing(false);
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
  }, [pages, hasKeyObjects, playlist]);

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

  // playlist mode: force TTS playback speed. Re-applies when speed changes.
  // audio.setPlaybackRate is stable (useCallback []), so destructuring avoids
  // adding the whole `audio` object to deps and triggering re-runs every render.
  const setPlaybackRate = audio.setPlaybackRate;
  useEffect(() => {
    if (!playlist) return;
    setPlaybackRate(playlist.speed);
  }, [playlist, setPlaybackRate]);

  // playlist paused prop: pause/resume TTS when the parent signals pause/resume.
  // Only active in playlist mode (playlist truthy); no-op when not in playlist.
  const pauseTts = audio.pauseTts;
  const resumeTts = audio.resumeTts;
  useEffect(() => {
    if (!playlist) return;
    if (playlist.paused) {
      pauseTts();
    } else {
      resumeTts();
    }
  }, [playlist, playlist?.paused, pauseTts, resumeTts]);

  // 페이지 변경 시 자동 TTS 재생. 첫 진입은 ttsReady(버퍼링 완료) 후에만 — 로딩 끝나고 바로 재생.
  // BGM 은 useAudioPlayer 가 마운트 시 바로 재생 (별도).
  // `mode=video|games` 또는 reward/wordReveal 화면이 열렸을 땐 TTS 재생하지 않음.
  useEffect(() => {
    if (!currentTtsUrl || !ttsReady) return;
    if (rewardOpen || wordRevealOpen) return;
    if (mode === 'video' || mode === 'games') return;
    // 시작 전(시작 버튼 대기)엔 자동재생 안 함. 시작 후(제스처로 해금됨)에만 자동재생.
    if (!startedRef.current) return;
    // ⏸(autoPlayTts OFF) 동안엔 페이지를 넘겨도 재생하지 않음. deps 대신 stateRef 로 읽어
    // 토글 ON 시 effect 재실행으로 인한 이중 재생(onTogglePlayback 의 resume/play 와 중복)을 피하고,
    // 타이머 발화 시점에 재확인해 전환 직후 ⏸ 눌러도 뒤늦게 재생되지 않게 한다.
    if (!stateRef.current.autoPlayTts) return;
    // 같은 페이지 재재생 방지 — 시작 탭 후 ttsReady 가 바뀌며 effect 가 재실행돼도 첫 음절 씹힘 X.
    if (lastPlayedTtsRef.current === currentTtsUrl) return;
    lastPlayedTtsRef.current = currentTtsUrl;
    const t = setTimeout(() => {
      if (stateRef.current.autoPlayTts) audio.playTts(currentTtsUrl);
    }, NEXT_TTS_DELAY_MS);
    return () => clearTimeout(t);
  }, [currentTtsUrl, ttsReady, rewardOpen, wordRevealOpen, mode]);

  // playlist mode stall-guard: if a page is playing and no TTS `ended` event fires
  // within max(ttsDuration, 6000) ms, advance (or call onBookEnd on last page).
  // Cleared by handleTtsEnded (via stallTimerRef) and whenever the page changes.
  // Uses a separate effect so we don't disturb existing TTS auto-play logic.
  // PAUSE guard: when playlist.paused is true we do NOT arm the timer — adding
  // paused to the dep array means the effect re-runs on resume and re-arms it.
  // The cleanup returned by the previous (paused) run already cleared the old
  // timer, so there is no risk of double-advance after resume.
  useEffect(() => {
    if (!playlist) return;
    if (!ttsReady || !startedRef.current) return;
    if (rewardOpen || wordRevealOpen) return;
    if (!stateRef.current.autoPlayTts) return;
    if (playlist.paused) return; // ← paused: do not arm stall-guard timer

    // Compute guard duration: TTS duration (ms) + breathing room, minimum 6 s.
    const guardMs = Math.max(audio.ttsDuration * 1000 || 0, 6000) + PAGE_REST_MS;

    const timer = setTimeout(() => {
      stallTimerRef.current = null;
      const st = stateRef.current;
      if (st.rewardOpen || st.wordRevealOpen) return;
      if (st.pageIndex >= pages.length - 1) {
        playlist.onBookEnd();
      } else {
        setAdvancing(false);
        setDirection(1);
        setPageIndex((idx) => idx + 1);
      }
    }, guardMs);

    stallTimerRef.current = timer;
    return () => {
      clearTimeout(timer);
      stallTimerRef.current = null;
    };
  }, [
    pageIndex,
    ttsReady,
    rewardOpen,
    wordRevealOpen,
    playlist,
    playlist?.paused,
    pages.length,
    audio.ttsDuration,
  ]);

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
    // 진입 즉시 '시작' 버튼을 띄우고(autoplay 정책 우회) 버퍼링은 뒤에서 — 첫 진입(미시작)만.
    if (!startedRef.current) setNeedsTapToStart(true);
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
      // [Site 2] playlist mode: skip overlay, hand off to caller.
      if (playlist) {
        playlist.onBookEnd();
        return;
      }
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
  // [Site 3] playlist mode: skip this entirely (caller controls UI).
  const isVideoMode = mode === 'video';
  const hasAnyVideo = storybook ? hasVideoUrl(storybook) : false;
  useEffect(() => {
    if (playlist) return; // [Site 3] suppressed in playlist mode
    if (!isVideoMode) return;
    if (!hasAnyVideo) return;
    setRewardOpen(true);
  }, [isVideoMode, hasAnyVideo, playlist]);

  const onToggleLanguage = () => {
    const cur = LANG_CYCLE.indexOf(lang as 'ko' | 'en');
    const next = LANG_CYCLE[(cur === -1 ? 0 : cur + 1) % LANG_CYCLE.length];
    setSp((prev) => {
      prev.set('lang', next);
      return prev;
    });
    updateSettings({ language: next });
  };

  // playlist mode: skip to next book on load error (fire onBookEnd once).
  useEffect(() => {
    if (!playlist) return;
    if (!error) return;
    if (playlistSkippedRef.current) return;
    playlistSkippedRef.current = true;
    console.warn('[ViewerContainer] playlist: load error — skipping to next book', storybookId);
    playlist.onBookEnd();
  }, [error, playlist, storybookId]);

  // Loading / Error
  if (isLoading) {
    return <ViewerLoading label="동화책을 펼치고 있어요" />;
  }
  if (error || !storybook) {
    // In playlist mode the useEffect above already called onBookEnd; show a
    // minimal loading indicator rather than a dead-end error screen.
    if (playlist) return <ViewerLoading label="다음 책으로 이동 중..." />;
    return (
      <StateScreen
        mascotState="sad"
        title="이 책을 찾을 수 없어"
        action={{ label: '🏠 라이브러리', onClick: () => navigate('/library') }}
      />
    );
  }

  // 유료화 게이팅(딥링크 포함) — 잠긴 책은 본문 대신 유료 안내. PAYWALL_ENABLED=false 면 항상 통과.
  if (!canReadBook(storybook, access)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream-50 p-4">
        <PaywallNotice status={access.status} onLogin={() => navigate('/login')} />
      </div>
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

  // playlist mode: force fullscreen so the playlist chrome (outside this component) stays visible.
  const fullscreen = playlist ? true : fullscreenLocal;

  return (
    <div
      className={cn(
        'min-h-screen relative overflow-hidden',
        settings.darkMode
          ? 'bg-darkbg text-darktext'
          : 'bg-gradient-to-b from-cream-50 to-peach-100 text-ink-900'
      )}
    >
      {!fullscreen && (
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
          fullscreenImage={fullscreen}
          onToggleFullscreen={() => setFullscreenLocal((f) => !f)}
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
          fullscreen={fullscreen}
        />
      )}

      {/* 페이지 진행률 — Toolbar 와 같은 line (가운데). 풀스크린 시 숨김. */}
      {!fullscreen && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 bg-white/90 backdrop-blur-sm px-3 h-10 flex items-center rounded-md shadow-soft pointer-events-none">
          <BookSpineProgress current={pageIndex} total={pages.length} />
        </div>
      )}

      {/* 풀스크린 종료 버튼 — 풀스크린 시만 우상단 floating (반투명).
          playlist 모드에서는 숨김 — 플레이리스트 chrome(상위 컴포넌트)이 제어권을 가짐. */}
      {fullscreen && !playlist && (
        <button
          onClick={() => setFullscreenLocal(false)}
          className="absolute top-3 right-3 z-30 w-11 h-11 rounded-full bg-white/40 hover:bg-white/70 backdrop-blur-sm text-ink-900 flex items-center justify-center text-lg shadow-soft transition-all"
          title="풀스크린 끄기"
          aria-label="풀스크린 끄기"
        >
          ✕
        </button>
      )}

      <MascotCorner visible={audio.isBgmPlaying} />

      {/* 자동넘김 인디케이터 — 음성 끝 ~ 다음 페이지 전환 대기 동안 "다음 장" dot pulse */}
      {advancing && !fullscreen && (
        <div
          className={cn(
            'pointer-events-none absolute bottom-24 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 shadow-soft backdrop-blur-sm',
            settings.darkMode ? 'bg-darkbg/85 text-darktext' : 'bg-white/85 text-ink-500'
          )}
        >
          <span className="text-xs font-bold break-keep">다음 장</span>
          <span className="flex gap-1">
            <span
              className="h-2 w-2 rounded-full bg-coral-400 animate-bounce"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="h-2 w-2 rounded-full bg-coral-400 animate-bounce"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="h-2 w-2 rounded-full bg-coral-400 animate-bounce"
              style={{ animationDelay: '300ms' }}
            />
          </span>
        </div>
      )}

      {/* autoplay 차단 시 — 탭으로 음성+BGM 시작 (사용자 제스처 안에서 재생 → 모든 브라우저 OK) */}
      {needsTapToStart && (
        <button
          type="button"
          onClick={() => {
            startedRef.current = true;
            setNeedsTapToStart(false);
            if (!audio.isBgmPlaying) audio.toggleBgm();
            if (currentTtsUrl) {
              lastPlayedTtsRef.current = currentTtsUrl;
              audio.playTts(currentTtsUrl);
            }
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

      {!fullscreen && (
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
