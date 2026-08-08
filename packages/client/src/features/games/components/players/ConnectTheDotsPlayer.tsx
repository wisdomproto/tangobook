import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { PointerEvent as ReactPointerEvent, SyntheticEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { ConnectTheDotsData, ConnectTheDotsItem, Lang } from '@tangobook/shared';
import { getEffectiveVocabulary } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { GameResultScreen } from '../GameResultScreen';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { useGameAudio } from '../../hooks/useGameAudio';
import { usePrewarmWordTts } from '../../hooks/useGamePrefetch';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { SceneReveal } from '../SceneReveal';
import { useGameStyle } from '../GameStyleChip';
import { resolveSceneFromWord, type WordScene } from '../../lib/resolve-scene';
import { resolveTtsUrl } from '@/features/tts';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameLogger } from '@/features/learning';
import { feedDrawLoop } from '@/lib/uiSound';

/**
 * Paint-fill 모드 (2026-05-25) — 기존 "순서대로 점 탭" → "polygon 영역 색칠".
 *
 * 사용자 정책:
 *   - keypoints 의 첫 점/마지막 점을 자동 close → polygon mask
 *   - 큰 붓으로 polygon 안을 칠하기
 *   - 채움 비율 threshold 도달 시 정답 처리
 *
 * 구현:
 *   - canvas overlay (image 위) — 이미지 onLoad 시 canvas size 동기화
 *   - drawMask: 회색 반투명 polygon (사용자가 안 칠한 영역 안내)
 *   - paint: `source-atop` 로 polygon 안만 emerald painted
 *   - measureCoverage: emerald 픽셀 / mask 픽셀
 */

const PAINT_COLOR = '#10b981'; // emerald
const MASK_COLOR = 'rgba(160, 160, 160, 0.45)'; // 반투명 회색 — 안 칠한 영역
const POLYGON_OUTLINE = '#FF6F61'; // coral — polygon 윤곽선
/**
 * 99% 채우면 통과 — 글자 쓰기(`LetterFillCanvas`)와 같은 기준(2026-07-28, 사용자 지시).
 * ⚠️ 여기 마스크는 손으로 찍은 점이 아니라 `rembg` 가 뽑은 **윤곽 근사치**라, 가장자리 몇 px 가
 *    원본 그림과 어긋날 수 있다. 아이가 다 칠했는데 안 넘어가는 게 보이면 이 숫자부터 볼 것.
 */
const THRESHOLD = 0.99;
const PEN_RATIO = 0.08; // canvas width 대비 펜 두께 비율 (~8%)

interface ConnectTheDotsPlayerProps extends GamePlayerProps {
  /** 어휘 게임(vocab GameOverlay)에서 명시 전달. 미지정 시 책 뷰어 `?lang`(ko/en) 폴백. */
  lang?: Lang;
}

/** Lang → resolveTtsUrl language 파라미터 */
function ttsLangOf(lang: Lang): 'korean' | 'english' | 'vi' | 'zh' | 'th' {
  return lang === 'ko' ? 'korean' : lang === 'en' ? 'english' : lang;
}

function ConnectTheDotsPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
  lang: propLang,
}: ConnectTheDotsPlayerProps) {
  const data = gameData as ConnectTheDotsData;
  // polygon 칠하기 위해 최소 3점 필요.
  // ⚠️ memoize 필수 — 매 렌더 새 배열이면 sortedKps→drawMask useCallback 신원이 매번 바뀌어
  //    reset useEffect 가 매 렌더 실행되고 clearRect 로 방금 칠한 paint 를 지운다(→ 0% 고정).
  const items = useMemo(() => data.items.filter((it) => it.keypoints.length >= 3), [data]);

  const { t } = useTranslation('games');
  const [itemIdx, setItemIdx] = useState(0);
  const [coverage, setCoverage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [completedItems, setCompletedItems] = useState(0);
  const [finished, setFinished] = useState(false);
  const [showImage, setShowImage] = useState(false);
  // 완성한 단어가 나오는 동화 장면 + 나레이션 리빌 (소스 동화책 있을 때만).
  const [scene, setScene] = useState<WordScene | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawingRef = useRef(false);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const maskPixelsRef = useRef(0);
  const completedRef = useRef(false); // pointer handler 내부 stale closure 회피
  const drawMaskRef = useRef<() => void>(() => {}); // reset effect 가 매 렌더 재실행되지 않게 (아래서 최신 drawMask 주입)
  const revealTimerRef = useRef<number | null>(null); // 완성본 감상 후 칭찬 시퀀스 예약 타이머

  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();
  const logGame = useGameLogger();

  const [searchParams] = useSearchParams();
  // 어휘 게임은 prop 으로 lang 전달(vi/zh/th 포함). 책 뷰어 registry 경로는 `?lang`(ko/en) 폴백.
  const viewerLang: Lang = propLang ?? (searchParams.get('lang') === 'en' ? 'en' : 'ko');

  // 🔴 진입 안내 음성 — 화면의 "모양 안을 모두 칠해봐!" 에 맞는 음성(사용자: "이건 멘트 안 나오는데").
  //    안내음은 한국어라 **한국어 UI(ko/en 콘텐츠)일 때만** 낸다 — vi/zh/th 어휘 게임엔 안 맞다.
  const guidedRef = useRef(false);
  useEffect(() => {
    if (guidedRef.current || (viewerLang !== 'ko' && viewerLang !== 'en')) return;
    guidedRef.current = true;
    playAudio('/sounds/voice/paint-shape-ko.mp3');
  }, [playAudio, viewerLang]);

  const { data: storybook } = useStorybook(storybookId);
  const gameStyle = useGameStyle(storybook);

  // objectName(영어) → 발음 대상 { text, lang }. viewerLang 에 맞는 표기/음원 선택.
  //  - en: 영어 원어
  //  - ko: key_object.korean (없으면 영어)
  //  - vi/zh/th: key_object.nameTranslations[lang] (없으면 발음 스킵 — 다른 언어로 새지 않게)
  const resolveSpeakTarget = useCallback(
    (englishName: string | undefined): { text: string; lang: Lang } | null => {
      if (!englishName) return null;
      const en = englishName.trim();
      if (!en) return null;
      if (viewerLang === 'en') return { text: en, lang: 'en' };
      const enLower = en.toLowerCase();
      const ko = storybook?.key_objects?.find(
        (k) => k.name?.toLowerCase() === enLower || k.nameEn?.toLowerCase() === enLower
      );
      if (viewerLang === 'ko') {
        const koText =
          ko?.korean?.trim() ||
          (storybook
            ? getEffectiveVocabulary(storybook)
                .find((v) => v.word?.toLowerCase() === enLower)
                ?.korean?.trim()
            : '');
        if (koText) return { text: koText, lang: 'ko' };
        return { text: en, lang: 'en' };
      }
      // vi/zh/th
      const tr = ko?.nameTranslations?.[viewerLang]?.trim();
      if (tr) return { text: tr, lang: viewerLang };
      // 🔴 파닉스 storybook 은 key_objects 가 없다(낱말이 flashcards 에 있고 objectName 이 이미 그 언어
      //    표기 = 병음). 어휘 게임은 key_object 를 찾되 번역만 없는 것(ko 존재)이라 여전히 스킵된다
      //    — 즉 영어로 새지 않는다. objectName(병음)을 그대로 읽고, 소리는 item.ttsUrl(mod_chinese 직행).
      if (!ko) return { text: en, lang: viewerLang };
      return null;
    },
    [viewerLang, storybook]
  );

  // 정답(완성) 시 단어 발음 프리워밍 — 완성까지 수초 걸리므로 마운트 때 미리 디코드해 지연 방지.
  // (identifierPrefix 'dot' 은 triggerComplete 의 resolveTtsUrl 호출과 동일해야 캐시 키 일치.)
  const prewarmItems = useMemo(() => {
    const out: { text: string; directUrl?: string }[] = [];
    for (const it of items) {
      const target = resolveSpeakTarget(it.objectName);
      if (!target) continue;
      const objLower = it.objectName?.toLowerCase();
      const ko = storybook?.key_objects?.find(
        (k) => k.name?.toLowerCase() === objLower || k.nameEn?.toLowerCase() === objLower
      );
      const directUrl =
        ko?.ttsUrls?.[target.lang] ?? (target.lang === 'ko' ? ko?.ttsUrl : undefined);
      out.push({ text: target.text, directUrl });
    }
    return out;
  }, [items, resolveSpeakTarget, storybook]);
  // 백그라운드 프리워밍 — 논블로킹. vi/zh/th 는 'english' 경로(directUrl 우선)로 URL 워밍.
  usePrewarmWordTts(prewarmItems, viewerLang === 'ko' ? 'korean' : 'english', storybookId, 'dot');

  const currentItem: ConnectTheDotsItem | undefined = items[itemIdx];
  /** 완성 시 보여줄 낱말 — 발음과 같은 소스라 들리는 말과 항상 일치한다. */
  const completedWord = resolveSpeakTarget(currentItem?.objectName)?.text;
  /** 알파벳 단원(영어 Book 1)은 **글자**가 학습 목표라 낱말보다 크게 세운다. */
  const completedLetter = currentItem?.letter;

  const sortedKps = useMemo(
    () => (currentItem ? [...currentItem.keypoints].sort((a, b) => a.order - b.order) : []),
    [currentItem]
  );

  /** polygon mask + 윤곽선 그리기, mask 픽셀 수 측정 */
  const drawMask = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || sortedKps.length < 3) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;

    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    // polygon path
    ctx.beginPath();
    sortedKps.forEach((kp, i) => {
      const x = kp.x * w;
      const y = kp.y * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // fill — 회색 반투명
    ctx.fillStyle = MASK_COLOR;
    ctx.fill();

    // outline — coral dashed (첫점→마지막점 자동 close 포함)
    ctx.strokeStyle = POLYGON_OUTLINE;
    ctx.lineWidth = Math.max(3, w * 0.005);
    ctx.setLineDash([w * 0.02, w * 0.015]);
    ctx.stroke();
    ctx.setLineDash([]);

    // mask 픽셀 수 측정 (coverage 분모)
    const imageData = ctx.getImageData(0, 0, w, h);
    let count = 0;
    for (let i = 3; i < imageData.data.length; i += 4) {
      if (imageData.data[i] > 0) count++;
    }
    maskPixelsRef.current = count;
  }, [sortedKps]);
  // 최신 drawMask 를 ref 로 보관 — reset useEffect 가 drawMask 신원 변화에 재실행되어
  // clearRect 로 paint 를 지우는 걸 막는다(itemIdx 변경 시에만 mask 재생성).
  drawMaskRef.current = drawMask;

  const measureCoverage = useCallback((): number => {
    const canvas = canvasRef.current;
    if (!canvas || maskPixelsRef.current === 0) return 0;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 0;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    let painted = 0;
    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];
      const a = imageData.data[i + 3];
      // emerald(#10b981)는 "초록 우세" — 반투명 회색 마스크 위에 source-atop 으로 칠하면
      // 알파 블렌딩으로 밝기가 낮아져 고정 임계값(g>128)을 못 넘던 문제 → 초록 우세로 판정.
      if (a > 0 && g > r + 20 && g > b + 20) painted++;
    }
    return painted / maskPixelsRef.current;
  }, []);

  const paintDot = useCallback((ctx: CanvasRenderingContext2D, x: number, y: number) => {
    const w = ctx.canvas.width;
    ctx.save();
    ctx.globalCompositeOperation = 'source-atop'; // polygon 안만 painted
    ctx.fillStyle = PAINT_COLOR;
    ctx.beginPath();
    ctx.arc(x, y, (w * PEN_RATIO) / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }, []);

  const paintLine = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      from: { x: number; y: number },
      to: { x: number; y: number }
    ) => {
      const w = ctx.canvas.width;
      ctx.save();
      ctx.globalCompositeOperation = 'source-atop';
      ctx.strokeStyle = PAINT_COLOR;
      ctx.lineWidth = w * PEN_RATIO;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.stroke();
      ctx.restore();
    },
    []
  );

  const advanceToNext = useCallback(() => {
    const newCompletedItems = completedItems + 1;
    setCompletedItems(newCompletedItems);
    if (itemIdx + 1 >= items.length) {
      logGame({
        gameType: 'connect-the-dots',
        storybookId,
        lang: viewerLang,
        results: items
          .map((it, idx) => ({
            word: it.objectName ?? '',
            correct: idx < newCompletedItems,
          }))
          .filter((r) => r.word),
      });
      setFinished(true);
    } else {
      setItemIdx(itemIdx + 1);
      setCoverage(0);
      setCompleted(false);
      completedRef.current = false;
      setShowImage(false);
    }
  }, [completedItems, itemIdx, items, logGame, storybookId, viewerLang]);

  const triggerComplete = useCallback(async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    setCompleted(true);

    // 1) 완성본을 깨끗하게 보여주기 — canvas(paint + 회색 mask + 윤곽선)를 지우고 이미지 완전 불투명.
    //    점 표시(dots)도 completed 시 숨김 → 아이가 자기가 완성한 그림을 온전히 감상.
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setShowImage(true);

    // 단어 오디오 준비 (칭찬 시퀀스에서 단어 발음으로 사용)
    const target = resolveSpeakTarget(currentItem?.objectName);
    let wordAudioUrl: string | undefined;
    if (target && currentItem) {
      const objNameLower = currentItem.objectName?.toLowerCase();
      const ko = storybook?.key_objects?.find((k) => {
        return k.name?.toLowerCase() === objNameLower || k.nameEn?.toLowerCase() === objNameLower;
      });
      const keyObjTts =
        ko?.ttsUrls?.[target.lang] ?? (target.lang === 'ko' ? ko?.ttsUrl : undefined);

      wordAudioUrl = await resolveTtsUrl({
        text: target.text,
        language: ttsLangOf(target.lang),
        storybookId,
        // 🔴 아이템이 음원을 직접 들고 오면 그게 우선 — 알파벳 단원은 `b b book` 이라
        //    글자와 낱말이 한 클립에 있다(keyObject 조회로는 못 찾는다).
        directUrl: currentItem.ttsUrl ?? keyObjTts,
        identifierPrefix: 'dot',
      });
    }

    const proceed = () => {
      // 3) 완성한 단어가 나오는 동화 장면 + 나레이션 리빌 (있으면), 없으면 다음.
      const s = target
        ? resolveSceneFromWord(target.text, target.lang, storybook, gameStyle.selectedStyle)
        : null;
      if (s) setScene(s);
      else advanceToNext();
    };

    // 2) 완성본을 잠깐(1.1s) 감상 → 칭찬(효과음 + 호리 오버레이 + 단어 발음 + 칭찬 음원) → 장면.
    const t = window.setTimeout(() => {
      revealTimerRef.current = null;
      playCorrectSequence({
        ttsUrl: wordAudioUrl,
        language: target?.lang,
        onDone: proceed,
      });
    }, 1100);
    revealTimerRef.current = t;
  }, [
    currentItem,
    resolveSpeakTarget,
    storybook,
    storybookId,
    playCorrectSequence,
    advanceToNext,
    gameStyle.selectedStyle,
  ]);

  const handleImgLoad = useCallback(
    (e: SyntheticEvent<HTMLImageElement>) => {
      const img = e.currentTarget;
      const canvas = canvasRef.current;
      if (!canvas) return;
      // canvas internal resolution = image natural (좌표 1:1 매핑)
      canvas.width = img.naturalWidth || 1000;
      canvas.height = img.naturalHeight || 1000;
      drawMask();
    },
    [drawMask]
  );

  // currentItem(=itemIdx) 변경 시에만 reset — deps 에 drawMask 를 넣으면 매 렌더 재실행돼
  // 방금 칠한 paint 를 clearRect 로 지워 0% 에 고정된다(2026-07-07 버그 fix). ref 로 최신 접근.
  useEffect(() => {
    completedRef.current = false;
    setCoverage(0);
    setCompleted(false);
    setShowImage(false);
    // mask는 image onLoad 에서 다시 그림. 캔버스 사이즈가 이미 정해진 경우 즉시 redraw.
    if (canvasRef.current && canvasRef.current.width > 0) {
      drawMaskRef.current();
    }
  }, [itemIdx]);

  // pointer up 글로벌 (canvas 밖에서 떼도 안전)
  useEffect(() => {
    const up = () => {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      lastPointRef.current = null;
      const cov = measureCoverage();
      setCoverage(cov);
      if (cov >= THRESHOLD && !completedRef.current) {
        triggerComplete();
      }
    };
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [measureCoverage, triggerComplete]);

  // 언마운트 시 완성본 감상 타이머 정리 (뒤로가기 중 칭찬 시퀀스가 늦게 뜨는 것 방지)
  useEffect(() => {
    return () => {
      if (revealTimerRef.current != null) window.clearTimeout(revealTimerRef.current);
    };
  }, []);

  const toCanvas = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height),
    };
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (completedRef.current) return;
    e.preventDefault();
    try {
      canvasRef.current!.setPointerCapture(e.pointerId);
    } catch {
      /* no-op */
    }
    isDrawingRef.current = true;
    const pt = toCanvas(e);
    lastPointRef.current = pt;
    const ctx = canvasRef.current!.getContext('2d')!;
    paintDot(ctx, pt.x, pt.y);
    feedDrawLoop();
    const cov = measureCoverage();
    setCoverage(cov);
    if (cov >= THRESHOLD) {
      triggerComplete();
    }
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || completedRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current!.getContext('2d')!;
    const pt = toCanvas(e);
    const last = lastPointRef.current!;
    paintLine(ctx, last, pt);
    lastPointRef.current = pt;
    feedDrawLoop();
    // 그리는 도중에도 coverage 갱신 — 진척 바 실시간
    const cov = measureCoverage();
    setCoverage(cov);
    if (cov >= THRESHOLD) {
      triggerComplete();
    }
  };

  if (items.length === 0) {
    return (
      <GamePlayerLayout maxWidth="lg" onBack={onBack}>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🎨</div>
          <p className="text-lg text-ink-900 dark:text-peach-200">{t('connectDots.noDots')}</p>
        </div>
      </GamePlayerLayout>
    );
  }

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={completedItems}
        total={items.length}
        lang={viewerLang}
        onRestart={() => {
          setItemIdx(0);
          setCoverage(0);
          setCompleted(false);
          completedRef.current = false;
          setShowImage(false);
          setCompletedItems(0);
          setFinished(false);
        }}
        onBack={() => {
          onComplete(completedItems, items.length);
          onBack();
        }}
      />
    );
  }

  const pct = Math.round(coverage * 100);
  const thresholdPct = Math.round(THRESHOLD * 100);

  return (
    <GamePlayerLayout maxWidth="3xl" bgImageUrl="/images/games/point-drawing-bg.webp">
      <GameHeader
        title={t('cards.connectDots.label')}
        current={completedItems}
        total={items.length}
        onBack={onBack}
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full flex-1 min-h-0">
        {/* 안내 텍스트 */}
        {/* 🔴 **고정 높이 금지** — 정답 줄의 글자는 `text-8xl`(96px)까지 커지는데 칸은 최대 64px 라
            헤더에 붙어 보였다(사용자 지적). 최소 높이만 잡고 내용이 자리를 만들게 한다. */}
        <div className="min-h-[clamp(2.5rem,8vh,4rem)] py-1 sm:py-2 flex items-center justify-center shrink-0">
          {completed ? (
            // 🔴 다 칠하면 **그 낱말을 글자로도 보여준다** — 그림만 완성하고 끝나면 무엇을 그렸는지
            //    귀로만 지나간다. 표기는 발음과 **같은 소스**(`resolveSpeakTarget`)를 써서
            //    읽어주는 말과 보이는 글자가 어긋나지 않게 한다(vi/zh/th 는 번역 없으면 생략).
            <p className="flex items-baseline gap-2 sm:gap-3">
              <span className="text-3xl sm:text-4xl">🎉</span>
              {completedLetter ? (
                <>
                  <span className="text-6xl sm:text-8xl font-black font-display text-coral-500 leading-none">
                    {completedLetter}
                  </span>
                  {completedWord && (
                    <span className="text-3xl sm:text-4xl font-black text-success break-keep">
                      {completedWord}
                    </span>
                  )}
                </>
              ) : completedWord ? (
                <span className="text-4xl sm:text-5xl font-black text-success break-keep">
                  {completedWord}
                </span>
              ) : (
                <span className="text-3xl sm:text-4xl font-black text-success">
                  {t('connectDots.done')}
                </span>
              )}
            </p>
          ) : (
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900 break-keep text-center px-4">
              {t('connectDots.instruction')}
            </p>
          )}
        </div>

        {/* 게임 영역 */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div className="relative select-none rounded-3xl overflow-hidden border-[5px] border-peach-200 bg-white shadow-pop max-h-full">
            <img
              src={currentItem.originalImageUrl}
              alt={currentItem.objectName ?? `Page ${currentItem.pageNumber}`}
              className="block max-h-[58vh] w-auto transition-opacity duration-700"
              style={{ opacity: showImage ? 1 : 0.55 }}
              draggable={false}
              onLoad={handleImgLoad}
            />

            {/* 칠하기 canvas — 이미지 위 absolute overlay */}
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full"
              style={{ touchAction: 'none' }}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
            />

            {/* 🔴 윤곽 점은 그리지 않는다 — 이 게임은 **모양 안을 칠하는** 것이지 점을 잇는 게 아니다.
                (2026-05-25 에 점잇기 → 색칠로 바뀌었는데 점 표시만 남아 있었다. 자동 추출한 18점이
                그림 위에 촘촘히 얹혀 사물을 가리기만 했다.) 경계는 canvas 의 coral 점선이 이미 보여준다. */}
          </div>
        </div>

        {/* 진척 바 — 채움 % 실시간 */}
        {!completed && (
          <div className="w-full max-w-md shrink-0 px-4">
            <div className="flex items-center justify-between text-base sm:text-lg font-black mb-1">
              <span
                className={
                  coverage >= THRESHOLD ? 'text-emerald-600' : 'text-ink-700 dark:text-peach-200'
                }
              >
                {pct}% {coverage >= THRESHOLD && '✓'}
              </span>
              <span className="text-ink-500">{t('connectDots.goal', { pct: thresholdPct })}</span>
            </div>
            <div className="h-4 bg-white/70 backdrop-blur rounded-full overflow-hidden border-2 border-peach-200">
              <div
                className={`h-full transition-all ${
                  coverage >= THRESHOLD ? 'bg-emerald-500' : 'bg-coral-400'
                }`}
                style={{ width: `${Math.min(100, coverage * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
      {/* 칭찬 오버레이 — 완성본 감상 후 호리 cheering + confetti + "잘했어!" */}
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      {scene && (
        <SceneReveal
          illustrationUrl={scene.illustrationUrl}
          text={scene.pageText}
          highlight={scene.highlight}
          ttsUrl={scene.pageTtsUrl}
          onDone={() => {
            setScene(null);
            advanceToNext();
          }}
        />
      )}
    </GamePlayerLayout>
  );
}

export { ConnectTheDotsPlayer };
