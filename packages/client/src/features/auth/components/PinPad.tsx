import { useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

interface Props {
  onComplete: (pin: string) => void;
  error?: boolean;
  disabled?: boolean;
}

export function PinPad({ onComplete, error, disabled }: Props) {
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (error) setPin('');
  }, [error]);

  const push = (d: string) => {
    if (disabled) return;
    setPin((p) => {
      if (p.length >= 4) return p;
      const next = p + d;
      if (next.length === 4) {
        onComplete(next);
      }
      return next;
    });
  };
  const back = () => {
    if (disabled) return;
    setPin((p) => p.slice(0, -1));
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <div data-testid="pin-indicators" className={cn('flex gap-3', error && 'animate-shake')}>
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              'w-5 h-5 rounded-full border-2 transition-all',
              pin.length > i ? 'bg-coral-500 border-coral-500' : 'border-ink-300'
            )}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => push(n)}
            disabled={disabled}
            className="h-16 rounded-2xl bg-white shadow-soft text-3xl font-black text-ink-900 hover:shadow-pop active:scale-95 disabled:opacity-40"
          >
            {n}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPin('')}
          disabled={disabled}
          className="h-16 rounded-2xl bg-white shadow-soft text-sm font-bold text-ink-500"
          aria-label="지우기"
        >
          지우기
        </button>
        <button
          type="button"
          onClick={() => push('0')}
          disabled={disabled}
          className="h-16 rounded-2xl bg-white shadow-soft text-3xl font-black text-ink-900 hover:shadow-pop active:scale-95 disabled:opacity-40"
        >
          0
        </button>
        <button
          type="button"
          onClick={back}
          disabled={disabled}
          className="h-16 rounded-2xl bg-white shadow-soft text-2xl text-ink-500"
          aria-label="backspace"
        >
          ⌫
        </button>
      </div>
    </div>
  );
}
