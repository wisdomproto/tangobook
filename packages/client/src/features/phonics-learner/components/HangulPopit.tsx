import { useId, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import './hangul-popit.css';

import { POPIT_LETTERS, type PopitLetter } from '../lib/popit-letter-designs';
export { POPIT_LETTERS, type PopitLetter } from '../lib/popit-letter-designs';

/** Live buttons stay separate from the artwork: pressed state, keyboard and generous hit areas. */
export function HangulPopit({
  letter,
  popped,
  onPop,
  complete,
  locked = false,
}: {
  letter: PopitLetter;
  popped: ReadonlySet<number>;
  onPop: (index: number) => void;
  complete: boolean;
  locked?: boolean;
}) {
  const { t } = useTranslation('phonics');
  const id = useId().replaceAll(':', '');
  const toy = POPIT_LETTERS[letter];
  const next = toy.points.findIndex((_, i) => !popped.has(i));
  return (
    <div
      className="hangul-popit"
      data-letter={letter}
      data-tone={toy.tone}
      data-complete={complete || undefined}
      style={{ '--popit-bubble': toy.bubble / 4 } as CSSProperties}
    >
      <svg className="hangul-popit-body" viewBox="0 30 400 340" aria-hidden="true">
        <defs>
          <linearGradient
            id={`${id}-body`}
            x1="0"
            y1="0"
            x2=".8"
            y2="1"
            gradientUnits="objectBoundingBox"
          >
            <stop stopColor="var(--popit-light)" />
            <stop offset=".5" stopColor="var(--popit-body)" />
            <stop offset="1" stopColor="var(--popit-edge)" />
          </linearGradient>
        </defs>
        <g fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path
            d={toy.path}
            stroke="var(--popit-shadow)"
            strokeWidth={toy.width + 10}
            transform="translate(0 12)"
          />
          <path d={toy.path} stroke="var(--popit-edge)" strokeWidth={toy.width + 8} />
          <path d={toy.path} stroke={`url(#${id}-body)`} strokeWidth={toy.width} />
          <path
            d={toy.path}
            stroke="white"
            strokeOpacity=".25"
            strokeWidth={toy.width * 0.8}
            transform="translate(-2 -3)"
          />
          <path d={toy.path} stroke={`url(#${id}-body)`} strokeWidth={toy.width * 0.75} />
        </g>
        {toy.face && (
          <g
            className="hangul-popit-face"
            transform={`translate(${toy.face[0]} ${toy.face[1]}) scale(${Math.min(1, toy.width / 58)})`}
          >
            <ellipse cx="-10" cy="0" rx="3" ry="4" fill="#304b43" />
            <ellipse cx="10" cy="0" rx="3" ry="4" fill="#304b43" />
            <path
              d="M-4 6 Q0 11 4 6"
              fill="none"
              stroke="#304b43"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            <ellipse cx="-17" cy="6" rx="4" ry="2.5" fill="#ef9b89" opacity=".7" />
            <ellipse cx="17" cy="6" rx="4" ry="2.5" fill="#ef9b89" opacity=".7" />
          </g>
        )}
      </svg>
      {toy.points.map(([x, y], i) => (
        <button
          key={i}
          type="button"
          className="hangul-popit-bubble"
          style={{ left: `${x / 4}%`, top: `${(y - 30) / 3.4}%` }}
          aria-label={t('popit.bubble', { letter, number: i + 1 })}
          aria-pressed={popped.has(i)}
          aria-disabled={locked || popped.has(i)}
          data-next={(i === next && !locked) || undefined}
          data-popped={popped.has(i) || undefined}
          data-sound="none"
          onClick={() => {
            if (!locked && !popped.has(i)) onPop(i);
          }}
        >
          <span className="hangul-popit-dome" aria-hidden="true">
            <i />
          </span>
          <span className="hangul-popit-puff" aria-hidden="true">
            ✦
          </span>
        </button>
      ))}
      {complete && (
        <span className="hangul-popit-check" aria-hidden="true">
          ✓
        </span>
      )}
    </div>
  );
}
