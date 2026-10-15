import { ToyHangul } from './ToyHangul';
import './letter-tap-charge.css';

export const LETTER_TAP_COUNT = 5;
export function LetterTapCharge({
  letter,
  count,
  busy,
  complete,
  onTap,
  label,
  progressLabel,
}: {
  letter: string;
  count: number;
  busy: boolean;
  complete: boolean;
  onTap: () => void;
  label: string;
  progressLabel: string;
}) {
  const fill = complete ? 5 : Math.min(5, count + (busy ? 1 : 0));
  return (
    <div className="letter-tap-charge" data-complete={complete || undefined}>
      <button
        type="button"
        className="letter-tap-toy"
        disabled={busy}
        aria-label={label}
        data-charging={busy || undefined}
        data-sound="none"
        onClick={onTap}
      >
        <span className="letter-tap-halo" aria-hidden="true" />
        <span className="letter-tap-base" aria-hidden="true">
          <ToyHangul text={letter} />
        </span>
        <span
          className="letter-tap-fill"
          style={{ clipPath: `inset(${100 - fill * 20}% 0 0 0)` }}
          aria-hidden="true"
        >
          <ToyHangul text={letter} />
        </span>
        <span className="letter-tap-touch" aria-hidden="true">
          {complete ? '✓' : '☝'}
        </span>
      </button>
      <div
        className="letter-tap-meter"
        role="progressbar"
        aria-label={progressLabel}
        aria-valuemin={0}
        aria-valuemax={LETTER_TAP_COUNT}
        aria-valuenow={complete ? 5 : count}
      >
        <span className="letter-tap-liquid" style={{ transform: `scaleX(${fill / 5})` }} />
        {Array.from({ length: 5 }, (_, i) => (
          <span
            className="letter-tap-pearl"
            key={i}
            data-done={i < (complete ? 5 : count) || undefined}
            data-charging={(busy && i === count) || undefined}
            aria-hidden="true"
          >
            {i < (complete ? 5 : count) ? '✓' : ''}
          </span>
        ))}
      </div>
    </div>
  );
}
