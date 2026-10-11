import { useCallback, useRef } from 'react';

/**
 * Some players report completion when their result appears, others when leaving it.
 * Keep the former mounted until the child chooses to leave or restart.
 */
export function useGameExit({
  keepsResult,
  onComplete,
  onBack,
}: {
  keepsResult: boolean;
  onComplete: () => void;
  onBack: () => void;
}) {
  const completed = useRef(false);
  const handleComplete = useCallback(() => {
    completed.current = true;
    if (!keepsResult) onComplete();
  }, [keepsResult, onComplete]);
  const handleBack = useCallback(() => {
    if (completed.current) onComplete();
    else onBack();
  }, [onComplete, onBack]);
  return { onComplete: handleComplete, onBack: handleBack };
}
