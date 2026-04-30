import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CollectionItem, CollectionStatus } from '@tangobook/shared';

interface Props {
  item: CollectionItem | null;
  status: CollectionStatus;
  onClose: () => void;
}

const STATUS_HINT: Record<CollectionStatus, string> = {
  locked: '동화를 읽고 카드를 모아봐!',
  silhouette: '조금 더 읽어보자! 끝까지 읽으면 카드를 가질 수 있어',
  owned: '어휘 게임에서 80% 이상 맞으면 도감이 살아나!',
  active: '도감이 살아났어! ✨',
};

export function CardDetailModal({ item, status, onClose }: Props) {
  // ESC 닫기
  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [item, onClose]);

  return (
    <AnimatePresence>
      {item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={onClose}
          role="dialog"
          aria-label={`${item.nameKo} 카드 상세`}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.85, y: 20 }}
            transition={{ type: 'spring', stiffness: 280, damping: 25 }}
            className="relative max-w-md w-full bg-white rounded-3xl shadow-pop overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 z-10 w-10 h-10 rounded-full bg-white/90 shadow-soft flex items-center justify-center text-ink-700 font-black hover:bg-coral-100 transition"
              aria-label="닫기"
            >
              ✕
            </button>

            {/* 이미지 영역 */}
            <div className="relative aspect-[3/4] bg-ink-100">
              {status === 'locked' ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-7xl opacity-40">🔒</span>
                </div>
              ) : (
                <img
                  src={item.imageUrl}
                  alt=""
                  aria-hidden
                  className={`w-full h-full object-cover ${
                    status === 'silhouette' ? 'grayscale brightness-50 opacity-70' : ''
                  }`}
                />
              )}
              {status === 'active' && (
                <div className="absolute top-3 left-3 px-3 py-1 bg-success text-white rounded-full text-xs font-black shadow-pop">
                  ✨ 도감 활성!
                </div>
              )}
            </div>

            {/* 본문 */}
            <div className="p-6 space-y-3">
              <div>
                <h2 className="text-2xl font-black font-display text-ink-900">
                  {status === 'locked' ? '???' : item.nameKo}
                </h2>
                {item.nameEn && status !== 'locked' && (
                  <div className="text-sm text-ink-500 font-bold mt-0.5">{item.nameEn}</div>
                )}
              </div>

              {/* description — owned 부터 */}
              {status !== 'locked' && status !== 'silhouette' && item.description && (
                <p className="text-ink-700 text-base">{item.description}</p>
              )}

              {/* facts — active 만 */}
              {status === 'active' && item.facts && item.facts.length > 0 && (
                <ul className="bg-success/5 border border-success/20 rounded-xl p-4 space-y-1.5">
                  {item.facts.map((f, i) => (
                    <li key={i} className="text-sm text-ink-900 flex items-start gap-2">
                      <span className="text-success">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              )}

              {/* 단계 힌트 */}
              <div
                className={`text-sm font-bold p-3 rounded-xl ${
                  status === 'active'
                    ? 'bg-success/10 text-success'
                    : status === 'owned'
                      ? 'bg-coral-100 text-coral-600'
                      : 'bg-peach-100 text-ink-700'
                }`}
              >
                {STATUS_HINT[status]}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
