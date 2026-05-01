import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { CopyProgress } from '../api/storybook.api';

interface Props {
  progress: CopyProgress | null;
  sourceTitle?: string | null;
  /** done 또는 error 시 닫기 버튼 클릭 핸들러 */
  onClose: () => void;
}

/**
 * 동화책 복사 진행률 모달 — fire-and-forget + polling 패턴 시각화.
 * pending: 진행 바 + N/M (NN%)
 * done: 체크 + 완료 버튼
 * error: 에러 메시지 + 닫기
 */
export function CopyProgressModal({ progress, sourceTitle, onClose }: Props) {
  const open = !!progress;

  // done 시 1.2초 후 자동 닫힘 (사용자 빠른 피드백)
  useEffect(() => {
    if (progress?.status === 'done') {
      const t = setTimeout(onClose, 1200);
      return () => clearTimeout(t);
    }
  }, [progress?.status, onClose]);

  const pct =
    progress && progress.total > 0
      ? Math.min(100, Math.round((progress.current / progress.total) * 100))
      : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-black/50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-md w-full"
          >
            {progress?.status === 'pending' && (
              <>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-violet-600 dark:text-violet-400 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                        opacity="0.25"
                      />
                      <path
                        d="M12 2a10 10 0 0110 10"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                      />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                      동화책 복사 중
                    </h3>
                    {sourceTitle && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-xs">
                        {sourceTitle}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl font-black text-violet-600 dark:text-violet-300 tabular-nums">
                    {pct}%
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                    {progress.current} / {progress.total}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-400 to-violet-600 rounded-full"
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">
                  이미지·TTS 자산을 R2에 복사하고 있어요. 동영상은 복사하지 않아요.
                </p>
              </>
            )}

            {progress?.status === 'done' && (
              <div className="text-center py-2">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 mx-auto flex items-center justify-center mb-3"
                >
                  <svg
                    className="w-8 h-8 text-emerald-600 dark:text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  복사 완료!
                </h3>
                {progress.newTitle && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {progress.newTitle}
                  </p>
                )}
              </div>
            )}

            {progress?.status === 'error' && (
              <>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <svg
                      className="w-5 h-5 text-red-600 dark:text-red-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                    복사 실패
                  </h3>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 break-words">
                  {progress.error || '알 수 없는 오류'}
                </p>
                <button
                  onClick={onClose}
                  className="mt-4 w-full px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  닫기
                </button>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
