import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { GamePlayerProps } from '../../registry/game-registry';
import type { HiddenObjectData, HiddenObjectTarget } from '@tangobook/shared';
import { useGameAudio } from '../../hooks/useGameAudio';
import { GameResultScreen } from '../GameResultScreen';
import { GameProgressBar } from '../GameProgressBar';
import { GamePlayerLayout } from '../GamePlayerLayout';
import { toImageNorm, hitNormalizedBox } from '../../utils/hitTest';
import { cn } from '@/lib/cn';

export function HiddenObjectPlayer({ storybookId, gameData, onComplete, onBack }: GamePlayerProps) {
  const data = gameData as HiddenObjectData;
  const scenes = data.scenes ?? [];

  const [sceneIdx, setSceneIdx] = useState(0);
  const [found, setFound] = useState<Set<string>>(new Set());
  const [finished, setFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [missFlash, setMissFlash] = useState<{ x: number; y: number; id: number } | null>(null);

  const imgRef = useRef<HTMLImageElement | null>(null);
  const { playWordCorrect } = useGameAudio();

  const scene = scenes[sceneIdx] as
    | { sceneImageUrl: string; targets: HiddenObjectTarget[] }
    | undefined;
  const targets = scene?.targets ?? [];
  const totalTargets = useMemo(
    () => scenes.reduce((sum, s) => sum + s.targets.length, 0),
    [scenes]
  );

  const handleTap = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!scene || !imgRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const aspect = imgRef.current.naturalWidth / imgRef.current.naturalHeight;
      const norm = toImageNorm(px, py, { width: rect.width, height: rect.height }, aspect);
      if (!norm) return;

      const hit = targets.find((t) => !found.has(t.objectName) && hitNormalizedBox(norm, t));
      if (!hit) {
        setMissFlash({ x: px, y: py, id: Date.now() });
        setTimeout(() => setMissFlash(null), 500);
        return;
      }

      const nextFound = new Set(found);
      nextFound.add(hit.objectName);
      setFound(nextFound);
      setScore((s) => s + 1);
      playWordCorrect({ ttsUrl: hit.ttsUrl });

      const sceneCleared = targets.every((t) => nextFound.has(t.objectName));
      if (sceneCleared) {
        if (sceneIdx + 1 >= scenes.length) {
          setTimeout(() => setFinished(true), 700);
        } else {
          setTimeout(() => {
            setSceneIdx((i) => i + 1);
            setFound(new Set());
          }, 700);
        }
      }
    },
    [scene, targets, found, sceneIdx, scenes.length, playWordCorrect]
  );

  const handleRestart = useCallback(() => {
    setSceneIdx(0);
    setFound(new Set());
    setScore(0);
    setFinished(false);
  }, []);

  useEffect(() => {
    if (finished) onComplete(score, totalTargets);
  }, [finished, score, totalTargets, onComplete]);

  if (finished) {
    return (
      <GameResultScreen
        storybookId={storybookId}
        score={score}
        total={totalTargets}
        onRestart={handleRestart}
        onBack={onBack}
      />
    );
  }

  if (!scene) return null;

  const remaining = targets.filter((t) => !found.has(t.objectName));

  return (
    <GamePlayerLayout maxWidth="2xl" onBack={onBack}>
      <div className="flex flex-col items-center gap-3 w-full h-full min-h-0">
        <GameProgressBar current={found.size} total={targets.length} score={score} />

        <div
          className="relative flex-1 min-h-0 w-full max-w-5xl flex items-center justify-center cursor-pointer select-none"
          onClick={handleTap}
        >
          <img
            ref={imgRef}
            src={scene.sceneImageUrl}
            alt=""
            draggable={false}
            className="max-w-full max-h-full object-contain rounded-2xl shadow-card"
          />
          {targets
            .filter((t) => found.has(t.objectName))
            .map((t) => (
              <FoundRing key={t.objectName} target={t} imgRef={imgRef} />
            ))}
          <AnimatePresence>
            {missFlash && (
              <motion.span
                key={missFlash.id}
                initial={{ opacity: 0.8, scale: 0.6 }}
                animate={{ opacity: 0, scale: 1.4 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="pointer-events-none absolute w-12 h-12 -ml-6 -mt-6 rounded-full border-4 border-danger"
                style={{ left: missFlash.x, top: missFlash.y }}
              />
            )}
          </AnimatePresence>
        </div>

        <div className="shrink-0 w-full overflow-x-auto">
          <div className="flex gap-3 justify-center px-2 pb-1">
            {targets.map((t) => {
              const done = found.has(t.objectName);
              return (
                <div
                  key={t.objectName}
                  className={cn(
                    'flex flex-col items-center gap-1 rounded-2xl border-4 p-2 min-w-[5rem] transition-all',
                    done ? 'border-success bg-success/10 opacity-60' : 'border-peach-200 bg-white'
                  )}
                >
                  {t.thumbnailUrl ? (
                    <img
                      src={t.thumbnailUrl}
                      alt=""
                      className={cn('w-14 h-14 object-contain', done && 'grayscale')}
                    />
                  ) : (
                    <span className="text-3xl">🔍</span>
                  )}
                  <span className="text-sm font-bold text-ink-900">{t.label}</span>
                  {done && <span className="text-success font-black">✓</span>}
                </div>
              );
            })}
          </div>
        </div>

        <p className="shrink-0 text-base sm:text-lg font-bold text-ink-900 dark:text-peach-200">
          그림 속에서 {remaining.length}개 더 찾아보세요!
        </p>
      </div>
    </GamePlayerLayout>
  );
}

function FoundRing({
  target,
  imgRef,
}: {
  target: HiddenObjectTarget;
  imgRef: React.RefObject<HTMLImageElement | null>;
}) {
  const img = imgRef.current;
  if (!img) return null;
  const parent = img.parentElement;
  if (!parent) return null;
  const pr = parent.getBoundingClientRect();
  const ir = img.getBoundingClientRect();
  const offX = ir.left - pr.left;
  const offY = ir.top - pr.top;
  const cx = offX + (target.x + target.w / 2) * ir.width;
  const cy = offY + (target.y + target.h / 2) * ir.height;
  const size = Math.max(target.w * ir.width, target.h * ir.height) * 1.1;

  return (
    <motion.span
      initial={{ scale: 0.4, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
      className="pointer-events-none absolute rounded-full border-4 border-success bg-success/10 flex items-center justify-center"
      style={{ left: cx - size / 2, top: cy - size / 2, width: size, height: size }}
    >
      <span className="text-success font-black text-xl">✓</span>
    </motion.span>
  );
}
