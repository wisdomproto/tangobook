import { useId } from 'react';

/** Small map symbols remain crisp at every touch-target size; they never contain learning letters. */
export function JourneyWorldIcon({
  kind,
  className = '',
}: {
  kind: 'garden' | 'forest' | 'bridge' | 'hills' | 'rainbow' | 'village' | 'flower';
  className?: string;
}) {
  const id = useId();
  return (
    <svg viewBox="0 0 80 80" className={className} aria-hidden="true" fill="none">
      <defs>
        <linearGradient id={id} x1="18" y1="8" x2="62" y2="76" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFE09B" />
          <stop offset="1" stopColor="#F6A278" />
        </linearGradient>
      </defs>
      <ellipse cx="40" cy="69" rx="30" ry="6" fill="#548E77" opacity=".14" />
      {(kind === 'garden' || kind === 'flower') && (
        <>
          <path d="M40 66V35" stroke="#559B70" strokeWidth="7" strokeLinecap="round" />
          <path d="M39 56C16 57 17 42 18 42C31 38 39 45 39 56Z" fill="#85C88A" />
          <path d="M42 61C63 60 62 46 61 46C49 42 42 49 42 61Z" fill="#6DB780" />
          <path
            d="M40 17C29 4 18 20 26 28C10 30 18 49 31 43C34 58 52 53 51 41C66 44 71 25 56 24C62 9 43 7 40 17Z"
            fill={`url(#${id})`}
            stroke="#FFF4C7"
            strokeWidth="3"
          />
          <circle cx="41" cy="31" r="9" fill="#FFF6D5" />
          <circle cx="38" cy="30" r="1.7" fill="#71563B" />
          <circle cx="44" cy="30" r="1.7" fill="#71563B" />
          <path d="M38 35Q41 38 44 35" stroke="#71563B" strokeWidth="1.8" strokeLinecap="round" />
        </>
      )}
      {kind === 'forest' && (
        <>
          <path d="M25 67V41M54 68V32" stroke="#BA825D" strokeWidth="9" strokeLinecap="round" />
          <path
            d="M8 41C2 29 11 19 20 21C22 6 43 12 43 26C57 36 40 57 28 48C21 56 7 51 8 41Z"
            fill="#B5DDA0"
          />
          <path
            d="M42 35C32 22 43 10 51 13C56 0 73 8 70 23C82 32 70 51 58 45C48 52 37 45 42 35Z"
            fill="#7BC39B"
          />
          <path
            d="M14 28Q17 21 24 25M46 23Q48 17 54 19"
            stroke="#DCEDC4"
            strokeWidth="4"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'bridge' && (
        <>
          <path
            d="M7 67Q25 58 40 66T73 65"
            stroke="#88D3D2"
            strokeWidth="9"
            strokeLinecap="round"
          />
          <path d="M11 53Q40 20 69 53V65H54Q40 42 26 65H11Z" fill="#F3BB91" />
          <path d="M9 51Q40 15 71 51" stroke="#FFF0D3" strokeWidth="9" strokeLinecap="round" />
          <path
            d="M17 48V35M32 34V24M49 34V24M63 47V34"
            stroke="#B58259"
            strokeWidth="5"
            strokeLinecap="round"
          />
        </>
      )}
      {kind === 'hills' && (
        <>
          <path d="M6 65C12 20 38 21 49 65" fill="#A6D6A3" />
          <path d="M30 65C41 9 64 10 75 65" fill="#F1BA96" />
          <path
            d="M51 25L60 16L67 28"
            stroke="#FFEBD2"
            strokeWidth="7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="24" cy="47" r="3" fill="#EAF5D5" />
          <path d="M56 65V51" stroke="#639965" strokeWidth="3" />
          <circle cx="56" cy="49" r="5" fill="#FFF1B1" />
        </>
      )}
      {kind === 'rainbow' && (
        <>
          <path d="M13 57V42A27 27 0 0 1 67 42V57" stroke="#F8A382" strokeWidth="10" />
          <path d="M23 57V43A17 17 0 0 1 57 43V57" stroke="#FFDA86" strokeWidth="9" />
          <path d="M32 57V43A8 8 0 0 1 48 43V57" stroke="#91CEAC" strokeWidth="8" />
          <path
            d="M6 63C0 52 10 43 18 48C30 40 41 59 28 65ZM52 64C44 55 53 44 61 49C72 40 86 60 72 65Z"
            fill="#FFFDF2"
          />
        </>
      )}
      {kind === 'village' && (
        <>
          <path d="M15 38H63V67H15Z" fill="#FFE6B9" />
          <path
            d="M9 39L39 13L70 39Z"
            fill="#F4A080"
            stroke="#FFC7A7"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path d="M33 67V54A8 8 0 0 1 49 54V67" fill="#7FBCA2" />
          <rect x="20" y="45" width="9" height="10" rx="3" fill="#E7BD70" />
          <rect x="52" y="45" width="9" height="10" rx="3" fill="#E7BD70" />
          <path d="M28 28Q39 20 49 29" stroke="#FFE9CA" strokeWidth="4" strokeLinecap="round" />
        </>
      )}
    </svg>
  );
}
