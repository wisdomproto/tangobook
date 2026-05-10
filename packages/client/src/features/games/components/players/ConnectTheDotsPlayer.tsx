import { useState, useRef, useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { ConnectTheDotsData, ConnectTheDotsItem } from '@tangobook/shared';
import { getEffectiveVocabulary } from '@tangobook/shared';
import { GameHeader } from '../GameHeader';
import { GameResultScreen } from '../GameResultScreen';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { phonicsApi } from '@/features/phonics/api/phonics.api';
import { useStorybook } from '@/features/storybook/hooks/useStorybooks';
import { useGameLogger } from '@/features/learning';

const DOT_RADIUS_PX = 24;

export function ConnectTheDotsPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
}: GamePlayerProps) {
  const data = gameData as ConnectTheDotsData;
  const items = data.items.filter((it) => it.keypoints.length >= 2);

  const [itemIdx, setItemIdx] = useState(0);
  const [nextOrder, setNextOrder] = useState(1);
  const [connectedUpTo, setConnectedUpTo] = useState(0);
  const [returning, setReturning] = useState(false); // 모든 점 찍은 후 첫 점 복귀 단계
  const [wrongTap, setWrongTap] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [completedItems, setCompletedItems] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const [finished, setFinished] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);
  const { playWordCorrect, playFeedbackSound } = useGameAudio();
  const logGame = useGameLogger();

  // 점 잇기 = 도레미 진행 — Web Audio API sine wave (자산 없이 합성)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const NOTE_FREQS = [
    261.63, // C4 도
    293.66, // D4 레
    329.63, // E4 미
    349.23, // F4 파
    392.0, // G4 솔
    440.0, // A4 라
    493.88, // B4 시
    523.25, // C5 도
    587.33, // D5 레
    659.25, // E5 미
    698.46, // F5 파
    783.99, // G5 솔
  ];
  const playNote = useCallback((noteIdx: number) => {
    try {
      if (!audioCtxRef.current) {
        const Ctx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!Ctx) return;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      const freq = NOTE_FREQS[noteIdx % NOTE_FREQS.length];
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch {
      /* AudioContext 차단 또는 미지원 — 무시 */
    }
  }, []);

  // 뷰어 URL의 ?lang을 읽어 어느 언어로 단어를 읽어줄지 결정
  const [searchParams] = useSearchParams();
  const viewerLang: 'ko' | 'en' = searchParams.get('lang') === 'en' ? 'en' : 'ko';

  // storybook을 fetch해 key_objects의 korean 이름 조회 (영어 objectName → 한글 단어 매핑)
  const { data: storybook } = useStorybook(storybookId);

  // 현재 아이템의 objectName(영어)으로부터 viewerLang에 맞는 단어 + 언어 라이브러리 리턴
  const resolveSpeakTarget = useCallback(
    (englishName: string | undefined): { text: string; language: 'korean' | 'english' } | null => {
      if (!englishName) return null;
      const en = englishName.trim();
      if (!en) return null;
      if (viewerLang === 'en') return { text: en, language: 'english' };
      // ko: case-insensitive lookup (KeyObject.name 'Cow' / objectName 'cow' 모두 OK)
      const enLower = en.toLowerCase();
      const ko =
        storybook?.key_objects
          ?.find((k) => k.name?.toLowerCase() === enLower || k.nameEn?.toLowerCase() === enLower)
          ?.korean?.trim() ||
        (storybook
          ? getEffectiveVocabulary(storybook)
              .find((v) => v.word?.toLowerCase() === enLower)
              ?.korean?.trim()
          : '');
      if (ko) return { text: ko, language: 'korean' };
      return { text: en, language: 'english' };
    },
    [viewerLang, storybook]
  );

  // 글로벌 pointerup으로 드래그 종료 감지 (점에서 손 떼면 드래그 풀림)
  useEffect(() => {
    const up = () => setIsPressing(false);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    return () => {
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, []);

  const currentItem: ConnectTheDotsItem | undefined = items[itemIdx];

  if (items.length === 0) {
    return (
      <GamePlayerLayout maxWidth="lg" onBack={onBack}>
        <div className="text-center py-16">
          <div className="text-5xl mb-4">🔢</div>
          <p className="text-lg text-ink-900 dark:text-peach-200">
            점이 배치된 핵심단어가 없습니다. 핵심사물 탭에서 점을 먼저 등록해주세요.
          </p>
        </div>
      </GamePlayerLayout>
    );
  }

  // currentItem 이 없으면 (finished 후 itemIdx out-of-bounds 등) 안전한 placeholder.
  // hook 순서 보존을 위해 early return 대신 keypoints 빈 배열로 fallback.
  const sortedKps = currentItem ? [...currentItem.keypoints].sort((a, b) => a.order - b.order) : [];
  const totalDots = sortedKps.length;

  // 직접 탭 (onPointerDown/onClick) — 틀린 순서면 wrongTap 띄움
  const handleDotTap = useCallback(
    (order: number) => {
      if (completed) return;

      // 복귀 단계: 첫 점으로 돌아와야 완성
      if (returning) {
        if (order !== 1) {
          playFeedbackSound(false);
          setWrongTap(true);
          setTimeout(() => setWrongTap(false), 500);
          return;
        }
        setCompleted(true);
        setTimeout(() => setShowImage(true), 300);

        // 단어 음원 — 사용자 정책 (2026-05-10):
        //   한글: phonics 음절 합성 우선 → 실패 시 KeyObject.ttsUrl fallback
        //   영어: KeyObject.ttsUrl 우선 → 없으면 phonics concat fallback
        (async () => {
          let wordAudioUrl: string | undefined;
          const target = resolveSpeakTarget(currentItem.objectName);
          if (target) {
            // 매칭되는 KeyObject 찾기 — case-insensitive (name 'Cow' / objectName 'cow' 둘 다 OK)
            const objNameLower = currentItem.objectName?.toLowerCase();
            const ko = storybook?.key_objects?.find((k) => {
              return (
                k.name?.toLowerCase() === objNameLower || k.nameEn?.toLowerCase() === objNameLower
              );
            });
            const ttsLang = target.language === 'korean' ? 'ko' : 'en';
            const keyObjTts = ko?.ttsUrls?.[ttsLang] ?? (ttsLang === 'ko' ? ko?.ttsUrl : undefined);

            if (target.language === 'english') {
              // 영어: ttsUrl 우선
              if (keyObjTts) {
                wordAudioUrl = keyObjTts;
              } else {
                try {
                  const { audioUrl } = await phonicsApi.concatPhonicsAudio({
                    text: target.text,
                    storybookId,
                    identifier: `dot-en-${encodeURIComponent(target.text)}`,
                    language: 'english',
                  });
                  wordAudioUrl = audioUrl;
                } catch {
                  /* 라이브러리 미스 — 효과음만 */
                }
              }
            } else {
              // 한글: phonics concat 우선
              try {
                const { audioUrl } = await phonicsApi.concatPhonicsAudio({
                  text: target.text,
                  storybookId,
                  identifier: `dot-ko-${encodeURIComponent(target.text)}`,
                  language: 'korean',
                });
                wordAudioUrl = audioUrl;
              } catch {
                /* phonics concat 실패 — KeyObject.ttsUrl 폴백 */
                wordAudioUrl = keyObjTts;
              }
              if (!wordAudioUrl) wordAudioUrl = keyObjTts;
            }
          }
          playWordCorrect({
            ttsUrl: wordAudioUrl,
            onDone: () => {
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
                // 사용자 정책 (2026-05-10): 게임 끝 → GameResultScreen (호리 + 칭찬 + 확인 버튼).
                // 자동 모달 닫힘 X. 사용자가 확인 클릭해야 이전 화면으로.
                setFinished(true);
              } else {
                setItemIdx(itemIdx + 1);
                setNextOrder(1);
                setConnectedUpTo(0);
                setCompleted(false);
                setReturning(false);
                setShowImage(false);
              }
            },
          });
        })();
        return;
      }

      // 일반 진행: 순서 맞는 점만
      if (order !== nextOrder) {
        playFeedbackSound(false);
        setWrongTap(true);
        setTimeout(() => setWrongTap(false), 500);
        return;
      }
      // 정답 점 — 도레미 진행 (1번 점=도, 2번=레, ...)
      playNote(connectedUpTo);
      const newConnected = connectedUpTo + 1;
      setConnectedUpTo(newConnected);
      setWrongTap(false);
      if (newConnected === totalDots) {
        setReturning(true);
        setNextOrder(1);
      } else {
        setNextOrder(order + 1);
      }
    },
    [
      completed,
      returning,
      nextOrder,
      connectedUpTo,
      totalDots,
      currentItem,
      storybookId,
      completedItems,
      itemIdx,
      items,
      onComplete,
      playWordCorrect,
      playFeedbackSound,
      playNote,
      resolveSpeakTarget,
      logGame,
      viewerLang,
      storybook,
    ]
  );

  // 드래그 통과 (onPointerEnter) — 순서 맞는 점만 반응. 틀린 점은 조용히 무시 (오탐 없음)
  const handleDotEnterWhileDragging = useCallback(
    (order: number) => {
      if (completed || !isPressing) return;
      const expected = returning ? 1 : nextOrder;
      if (order !== expected) return; // 드래그 통과 중 엉뚱한 점: 조용히 무시
      handleDotTap(order);
    },
    [completed, isPressing, returning, nextOrder, handleDotTap]
  );

  // finished 시 결과 화면 (호리 + 칭찬 + 확인). hook 순서 보존을 위해 main return 안 분기.
  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={completedItems}
        total={items.length}
        onRestart={() => {
          setItemIdx(0);
          setNextOrder(1);
          setConnectedUpTo(0);
          setReturning(false);
          setCompleted(false);
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

  return (
    <GamePlayerLayout maxWidth="3xl" bgImageUrl="/images/games/point-drawing-bg.png">
      <GameHeader
        title="단어 그림 그리기"
        current={completedItems}
        total={items.length}
        onBack={onBack}
      />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full h-full">
        {/* 안내 — 큰 검정 텍스트 (LineMatching/WordWriting 톤 통일) */}
        <div className="h-14 sm:h-16 flex items-center justify-center shrink-0">
          {wrongTap ? (
            <p className="text-2xl sm:text-3xl text-danger font-black animate-pulse">
              아직 이 점 차례가 아니에요!
            </p>
          ) : completed ? (
            <p className="text-3xl sm:text-4xl font-black text-success">🎉 완성!</p>
          ) : returning ? (
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-coral-500 animate-pulse">
              마지막으로 <span className="text-coral-600">첫 점</span>으로 돌아오세요!
            </p>
          ) : (
            <p className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-900">
              점을 <span className="text-coral-500">순서대로</span> 눌러서 이어주세요
            </p>
          )}
        </div>

        {/* 게임 영역 — flex-1 로 영역 채움, aspect 자동 (이미지 비율 따라감) */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center">
          <div className="relative select-none rounded-3xl overflow-hidden border-[5px] border-peach-200 bg-white shadow-pop max-h-full">
            <img
              src={currentItem.originalImageUrl}
              alt={currentItem.objectName ?? `Page ${currentItem.pageNumber}`}
              className="block max-h-[60vh] w-auto transition-opacity duration-700"
              style={{ opacity: showImage ? 1 : 0.45 }}
              draggable={false}
            />

            <div
              ref={overlayRef}
              className="absolute inset-0"
              style={{ touchAction: 'none' }}
              onPointerDown={() => setIsPressing(true)}
            >
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 1 1"
                preserveAspectRatio="none"
              >
                {/* 연결된 선 */}
                {sortedKps.map(
                  (kp, i) =>
                    i > 0 &&
                    i < connectedUpTo && (
                      <line
                        key={`edge-${i}`}
                        x1={sortedKps[i - 1].x}
                        y1={sortedKps[i - 1].y}
                        x2={kp.x}
                        y2={kp.y}
                        stroke="#E84B2A"
                        strokeWidth="0.006"
                        strokeLinecap="round"
                      />
                    )
                )}
                {/* 닫힘 선 */}
                {completed && totalDots >= 2 && (
                  <line
                    x1={sortedKps[totalDots - 1].x}
                    y1={sortedKps[totalDots - 1].y}
                    x2={sortedKps[0].x}
                    y2={sortedKps[0].y}
                    stroke="#E84B2A"
                    strokeWidth="0.006"
                    strokeLinecap="round"
                  />
                )}
              </svg>

              {sortedKps.map((kp, i) => {
                const isConnected = kp.order <= connectedUpTo;
                const isNext = returning ? kp.order === 1 : kp.order === nextOrder && !completed;
                return (
                  <button
                    key={i}
                    onPointerDown={(e) => {
                      try {
                        e.currentTarget.releasePointerCapture(e.pointerId);
                      } catch {
                        /* no-op */
                      }
                      setIsPressing(true);
                      handleDotTap(kp.order);
                    }}
                    onPointerEnter={() => handleDotEnterWhileDragging(kp.order)}
                    className={`absolute rounded-full shadow-pop transition-all ring-2 ring-white ${
                      isNext
                        ? 'bg-coral-500 ring-4 ring-coral-200 animate-pulse scale-125'
                        : isConnected
                          ? 'bg-coral-600'
                          : 'bg-coral-300 hover:bg-coral-400 hover:scale-110'
                    }`}
                    style={{
                      left: `${kp.x * 100}%`,
                      top: `${kp.y * 100}%`,
                      width: DOT_RADIUS_PX * 2,
                      height: DOT_RADIUS_PX * 2,
                      transform: 'translate(-50%, -50%)',
                    }}
                    aria-label={`점 ${kp.order}`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </GamePlayerLayout>
  );
}
