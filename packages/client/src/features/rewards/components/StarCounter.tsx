import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStarBalance } from '../hooks/useStarBalance';

interface ToastState {
  delta: number;
  key: number;
}

export function StarCounter() {
  const { data } = useStarBalance();
  const [toast, setToast] = useState<ToastState | null>(null);
  const prevRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!data) return;
    const cur = data.stars_total;
    const prev = prevRef.current;
    if (prev != null && cur > prev) {
      setToast({ delta: cur - prev, key: Date.now() });
      const t = setTimeout(() => setToast(null), 1800);
      prevRef.current = cur;
      return () => clearTimeout(t);
    }
    prevRef.current = cur;
  }, [data]);

  if (!data) return null;

  return (
    <div
      className="relative inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-50 dark:bg-amber-900/30 border border-yellow-200 dark:border-amber-700 rounded-full text-sm font-bold text-amber-700 dark:text-amber-300 shadow-soft"
      data-testid="star-counter"
    >
      <span className="text-base" aria-hidden>
        ⭐
      </span>
      <span data-testid="star-count">{data.stars_total}</span>
      {data.streak_days > 0 && (
        <span
          aria-label={`연속 ${data.streak_days}일 출석`}
          className="text-xs text-orange-500 dark:text-orange-400"
        >
          🔥{data.streak_days}
        </span>
      )}
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.key}
            initial={{ y: 0, opacity: 1, scale: 1 }}
            animate={{ y: -36, opacity: 0, scale: 1.3 }}
            transition={{ duration: 1.6, ease: 'easeOut' }}
            className="absolute left-1/2 -translate-x-1/2 -top-2 text-coral-500 font-black text-base pointer-events-none"
            aria-live="polite"
          >
            +{toast.delta}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
