import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/Button';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { ConnectTheDotsData, ConnectTheDotsItem } from '@tangobook/shared';
import { GameProgressBar } from '../GameProgressBar';
import { useGameAudio } from '../../hooks/useGameAudio';
import { FeedbackOverlay } from '../FeedbackOverlay';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { phonicsApi } from '@/features/phonics/api/phonics.api';

const DOT_RADIUS_PX = 24;

export function ConnectTheDotsPlayer({
  storybookId,
  gameData,
  onComplete,
  onBack,
  systemSounds,
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

  const overlayRef = useRef<HTMLDivElement>(null);
  const { playAudio, playCorrectSequence, praiseVisible } = useGameAudio();

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

  // 정답 시 objectName을 한글(음절 연결) 또는 영어(단어 음원)로 읽어줌.
  // phonics-library concat API가 두 언어 다 커버. 실패/미지원 시 조용히 통과.
  const speakObjectName = useCallback(
    async (name: string | undefined) => {
      if (!name) return;
      const trimmed = name.trim();
      if (!trimmed) return;
      const isKorean = /[가-힣]/.test(trimmed);
      try {
        const { audioUrl } = await phonicsApi.concatPhonicsAudio({
          text: trimmed,
          storybookId,
          identifier: `dot-${isKorean ? 'ko' : 'en'}-${encodeURIComponent(trimmed)}`,
          language: isKorean ? 'korean' : 'english',
        });
        playAudio(audioUrl);
      } catch {
        /* 라이브러리에 없는 토큰 등 — 조용히 스킵 */
      }
    },
    [storybookId, playAudio]
  );

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

  const sortedKps = [...currentItem.keypoints].sort((a, b) => a.order - b.order);
  const totalDots = sortedKps.length;

  const handleDotHit = useCallback(
    (order: number) => {
      if (completed) return;

      // 복귀 단계: 첫 점(order=1)에 다시 닿아야 마무리
      if (returning) {
        if (order !== 1) {
          setWrongTap(true);
          setTimeout(() => setWrongTap(false), 500);
          return;
        }
        // closed loop 완성
        setCompleted(true);
        setTimeout(() => setShowImage(true), 300);
        setTimeout(() => speakObjectName(currentItem.objectName), 700);
        playCorrectSequence({
          systemSounds,
          onDone: () => {
            const newCompletedItems = completedItems + 1;
            setCompletedItems(newCompletedItems);
            if (itemIdx + 1 >= items.length) {
              onComplete(newCompletedItems, items.length);
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
        return;
      }

      // 일반 진행: 순서 맞는 점에 닿으면 다음
      if (order !== nextOrder) {
        setWrongTap(true);
        setTimeout(() => setWrongTap(false), 500);
        return;
      }

      const newConnected = connectedUpTo + 1;
      setConnectedUpTo(newConnected);
      setWrongTap(false);

      if (newConnected === totalDots) {
        // 모든 점 연결 완료 → 첫 점 복귀 단계 돌입
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
      completedItems,
      itemIdx,
      items.length,
      onComplete,
      playCorrectSequence,
      speakObjectName,
      systemSounds,
    ]
  );

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <FeedbackOverlay kind="correct" visible={praiseVisible} />
      <div className="flex flex-col items-center gap-3 sm:gap-4 w-full">
        {/* 진행 */}
        <GameProgressBar current={itemIdx} total={items.length} score={completedItems} />

        {/* 안내 */}
        {!completed && !returning && (
          <p className="text-xl font-bold text-ink-900 dark:text-peach-200">
            점을 <span className="text-coral-500">순서대로</span> 눌러서 이어주세요
          </p>
        )}
        {!completed && returning && (
          <p className="text-xl font-bold text-coral-500 animate-pulse">
            마지막으로 <span className="text-coral-600">첫 점</span>으로 돌아오세요!
          </p>
        )}
        {wrongTap && (
          <p className="text-lg text-danger font-bold animate-pulse">아직 이 점 차례가 아니에요!</p>
        )}

        {/* 게임 영역 */}
        <div className="relative inline-block select-none rounded-xl overflow-hidden border-2 border-ink-100 dark:border-slate-700 w-full">
          <img
            src={currentItem.originalImageUrl}
            alt={currentItem.objectName ?? `Page ${currentItem.pageNumber}`}
            className="w-full transition-opacity duration-700"
            style={{ opacity: showImage ? 1 : 0.08 }}
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
              {/* 연결된 선 (1→2, 2→3, ... upTo connectedUpTo) */}
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
                      strokeWidth="0.005"
                      strokeLinecap="round"
                    />
                  )
              )}
              {/* 닫힘 선 (마지막 점 → 첫 점) — 완성 시에만 */}
              {completed && totalDots >= 2 && (
                <line
                  x1={sortedKps[totalDots - 1].x}
                  y1={sortedKps[totalDots - 1].y}
                  x2={sortedKps[0].x}
                  y2={sortedKps[0].y}
                  stroke="#E84B2A"
                  strokeWidth="0.005"
                  strokeLinecap="round"
                />
              )}
            </svg>

            {sortedKps.map((kp, i) => {
              const isConnected = kp.order <= connectedUpTo;
              // 다음 목표: 일반 단계에선 nextOrder, 복귀 단계에선 첫 점(order=1)
              const isNext = returning ? kp.order === 1 : kp.order === nextOrder && !completed;
              return (
                <button
                  key={i}
                  onClick={() => handleDotHit(kp.order)}
                  onPointerDown={(e) => {
                    // 펜처럼 드래그 가능하도록 pointer capture 해제
                    try {
                      e.currentTarget.releasePointerCapture(e.pointerId);
                    } catch {
                      /* no-op */
                    }
                    setIsPressing(true);
                    handleDotHit(kp.order);
                  }}
                  onPointerEnter={() => {
                    if (isPressing) handleDotHit(kp.order);
                  }}
                  className={`absolute rounded-full shadow transition-all ${
                    isNext
                      ? 'bg-coral-500 ring-4 ring-coral-300 animate-pulse scale-125'
                      : isConnected
                        ? 'bg-coral-600'
                        : 'bg-ink-900 hover:bg-coral-400'
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

        {/* 완성 메시지 */}
        {completed && (
          <div className="text-center">
            <div className="text-3xl sm:text-4xl mb-1">🎉</div>
            <p className="text-xl sm:text-lg font-bold text-ink-900 dark:text-peach-200">완성!</p>
          </div>
        )}
      </div>
    </GamePlayerLayout>
  );
}
