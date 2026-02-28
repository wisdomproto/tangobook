import React from 'react';

// --- 3D 버튼 스타일 상수 (Pixar-style) ---
export const V_BTN = {
  white: {
    background: 'linear-gradient(155deg, #ffffff 0%, #e4f2ff 100%)',
    color: '#1a3a5c',
    boxShadow:
      '0 7px 0 #9ab8d8, 0 10px 18px rgba(0,80,160,0.22), inset 0 1px 0 rgba(255,255,255,0.98), inset 0 -3px 6px rgba(0,80,160,0.07)',
  },
  yellow: {
    background: 'linear-gradient(155deg, #ffe94d 0%, #ffd600 50%, #f5c200 100%)',
    color: '#5a3a00',
    boxShadow:
      '0 7px 0 #b88c00, 0 10px 18px rgba(170,120,0,0.28), inset 0 1px 0 rgba(255,255,240,0.92), inset 0 -3px 6px rgba(150,100,0,0.14)',
  },
  blue: {
    background: 'linear-gradient(155deg, #60baff 0%, #2e9fe8 50%, #1880cc 100%)',
    color: '#ff3333',
    boxShadow:
      '0 7px 0 #0c5a9e, 0 10px 18px rgba(0,80,160,0.32), inset 0 1px 0 rgba(255,255,255,0.5), inset 0 -3px 6px rgba(0,60,130,0.22)',
  },
  word: {
    background: 'linear-gradient(155deg, #fff8e8 0%, #ffe8b0 50%, #ffd880 100%)',
    color: '#3a2800',
    boxShadow:
      '0 7px 0 #c08040, 0 10px 18px rgba(150,90,0,0.24), inset 0 1px 0 rgba(255,255,240,0.95), inset 0 -3px 6px rgba(120,70,0,0.10)',
  },
} as const;

export const V_OP_STYLE: React.CSSProperties = {
  textShadow: '0 2px 6px rgba(0,80,160,0.4), 0 -1px 0 rgba(255,255,255,0.6)',
  filter: 'drop-shadow(0 3px 0 rgba(0,80,150,0.25))',
};

export const V_FRAME_SHADOW =
  '0 0 0 4px #fffdf5, 0 0 0 8px #d4a050, 0 0 0 10px #f0c878, 0 10px 0 8px #a06828, 0 14px 22px rgba(100,60,0,0.3), inset 0 2px 8px rgba(0,0,0,0.06)';
export const V_CARD_BG = 'linear-gradient(150deg, #d6eeff 0%, #c2e6fc 40%, #d8f0ff 100%)';
export const V_CARD_SHADOW =
  '0 2px 0 rgba(255,255,255,0.9) inset, 0 -4px 0 rgba(100,170,220,0.4) inset, 0 8px 24px rgba(0,70,130,0.14)';
export const V_SHINE = 'linear-gradient(180deg, rgba(255,255,255,0.28) 0%, transparent 100%)';
export const V_DIVIDER =
  'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.55) 15%, rgba(255,255,255,0.9) 50%, rgba(255,255,255,0.55) 85%, transparent 100%)';
export const V_BTN_SHINE = 'rgba(255,255,255,0.55)';
export const V_FONT =
  "'Nunito', 'Comic Sans MS', 'Chalkboard SE', 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif";

// --- 어두운 3D 버튼 스타일 (누르기 전/후) ---
export const V_DARK_BTN = {
  first: {
    idle: {
      background: 'linear-gradient(155deg, #524770 0%, #42395e 50%, #352d4e 100%)',
      color: '#d4cef0',
      boxShadow:
        '0 7px 0 #2a2244, 0 10px 18px rgba(40,20,80,0.30), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 6px rgba(30,15,60,0.15)',
    },
    pressed: {
      background: 'linear-gradient(155deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)',
      color: '#451a03',
      boxShadow:
        '0 7px 0 #92400e, 0 10px 18px rgba(180,120,0,0.35), inset 0 1px 0 rgba(255,255,240,0.7), inset 0 -3px 6px rgba(120,80,0,0.15)',
    },
  },
  second: {
    idle: {
      background: 'linear-gradient(155deg, #524770 0%, #42395e 50%, #352d4e 100%)',
      color: '#d4cef0',
      boxShadow:
        '0 7px 0 #2a2244, 0 10px 18px rgba(40,20,80,0.30), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 6px rgba(30,15,60,0.15)',
    },
    pressed: {
      background: 'linear-gradient(155deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)',
      color: '#eff6ff',
      boxShadow:
        '0 7px 0 #1d4ed8, 0 10px 18px rgba(37,99,235,0.35), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -3px 6px rgba(30,64,175,0.2)',
    },
  },
  blend: {
    idle: {
      background: 'linear-gradient(155deg, #524770 0%, #42395e 50%, #352d4e 100%)',
      color: '#d4cef0',
      boxShadow:
        '0 7px 0 #2a2244, 0 10px 18px rgba(40,20,80,0.30), inset 0 1px 0 rgba(255,255,255,0.18), inset 0 -3px 6px rgba(30,15,60,0.15)',
    },
    pressed: {
      background: 'linear-gradient(155deg, #34d399 0%, #10b981 50%, #059669 100%)',
      color: '#ecfdf5',
      boxShadow:
        '0 7px 0 #047857, 0 10px 18px rgba(5,150,105,0.35), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -3px 6px rgba(6,95,70,0.2)',
    },
  },
} as const;

// --- 3D 큐브 버튼 ---
export function VBtn3D({
  variant,
  label,
  onClick,
  hasAudio,
  wide,
}: {
  variant: keyof typeof V_BTN;
  label: string;
  onClick: () => void;
  hasAudio: boolean;
  wide?: boolean;
}) {
  const s = V_BTN[variant];
  return (
    <button
      onClick={onClick}
      disabled={!hasAudio}
      className={`relative inline-flex items-center justify-center font-black rounded-[22px] border-none select-none
        transition-transform duration-100 ease-out
        ${hasAudio ? 'hover:-translate-y-1 active:translate-y-1 cursor-pointer' : 'cursor-default opacity-60'}
        ${wide ? 'w-[120px] sm:w-[180px] h-[96px] sm:h-[140px]' : 'w-[96px] sm:w-[140px] h-[96px] sm:h-[140px]'}
        text-[2.4rem] sm:text-[3.5rem]`}
      style={{ ...s, fontFamily: V_FONT }}
    >
      <div
        className="absolute top-[5px] left-[10px] w-[45%] h-[28%] rounded-full pointer-events-none"
        style={{ background: V_BTN_SHINE }}
      />
      <span className="relative">{label}</span>
    </button>
  );
}

// --- 어두운 3D 큐브 버튼 (누르면 색 변경) ---
export function VDarkBtn3D({
  variant,
  label,
  pressed,
  onClick,
  wide,
}: {
  variant: keyof typeof V_DARK_BTN;
  label: string;
  pressed: boolean;
  onClick: () => void;
  wide?: boolean;
}) {
  const s = pressed ? V_DARK_BTN[variant].pressed : V_DARK_BTN[variant].idle;
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center font-black rounded-[18px] sm:rounded-[24px] border-none select-none
        transition-all duration-200 ease-out flex-shrink-0
        hover:-translate-y-1 active:translate-y-0.5 cursor-pointer
        ${wide ? 'w-[82px] sm:w-[130px] h-[72px] sm:h-[110px]' : 'w-[72px] sm:w-[110px] h-[72px] sm:h-[110px]'}
        text-[2rem] sm:text-[3rem]
        ${pressed ? 'scale-[1.06]' : ''}`}
      style={{ ...s, fontFamily: V_FONT }}
    >
      <div
        className="absolute top-[4px] left-[8px] w-[45%] h-[28%] rounded-full pointer-events-none"
        style={{ background: pressed ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.08)' }}
      />
      <span className="relative">{label}</span>
    </button>
  );
}

// --- 연산자 기호 ---
export function VOpGlyph({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="text-[2.4rem] sm:text-[3.5rem] font-black text-white select-none leading-none flex-shrink-0"
      style={V_OP_STYLE}
    >
      {children}
    </span>
  );
}

// --- 소형 알약 버튼 ---
export function VBtnPill({
  label,
  onClick,
  active,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl text-sm sm:text-base font-bold select-none transition-transform duration-100 hover:-translate-y-0.5 active:translate-y-0.5"
      style={{
        background: active
          ? 'linear-gradient(155deg, #e0d4ff 0%, #c8b8ff 100%)'
          : 'linear-gradient(155deg, #ffffff 0%, #f0e8ff 100%)',
        color: active ? '#4c1d95' : '#6b21a8',
        boxShadow: active
          ? '0 4px 0 #a78bfa, 0 6px 14px rgba(100,50,200,0.25), inset 0 1px 0 rgba(255,255,255,0.7)'
          : '0 4px 0 #c4b5fd, 0 6px 12px rgba(100,50,200,0.12), inset 0 1px 0 rgba(255,255,255,0.95)',
        border: active ? '2px solid #a78bfa' : '2px solid rgba(196,181,253,0.5)',
        fontFamily: V_FONT,
      }}
    >
      {label}
    </button>
  );
}

// --- 예시단어 3D 행 ---
export function VWordRow3D({
  onset,
  blend,
  word,
  imageUrl,
  ttsUrl,
  blendTtsUrl,
  onsetTtsUrl,
  playAudio,
}: {
  onset: string;
  blend: string;
  word: string;
  imageUrl?: string;
  ttsUrl?: string;
  blendTtsUrl?: string;
  onsetTtsUrl?: string;
  playAudio: (url?: string) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-8 flex-wrap">
      <VBtn3D
        variant="yellow"
        label={onset}
        onClick={() => playAudio(onsetTtsUrl)}
        hasAudio={!!onsetTtsUrl}
      />
      <VOpGlyph>+</VOpGlyph>
      <VBtn3D
        variant="blue"
        label={blend}
        onClick={() => playAudio(blendTtsUrl)}
        hasAudio={!!blendTtsUrl}
        wide
      />
      <VOpGlyph>&rarr;</VOpGlyph>
      <button
        onClick={() => playAudio(ttsUrl)}
        disabled={!ttsUrl}
        className={`relative inline-flex items-center justify-center font-black rounded-[22px] border-none select-none
          w-[140px] sm:w-[200px] h-[96px] sm:h-[140px] text-[2rem] sm:text-[3rem]
          transition-transform duration-100 ease-out
          ${ttsUrl ? 'hover:-translate-y-1 active:translate-y-1 cursor-pointer' : 'cursor-default opacity-60'}`}
        style={{ ...V_BTN.word, fontFamily: V_FONT }}
      >
        <div
          className="absolute top-[5px] left-[10px] w-[45%] h-[28%] rounded-full pointer-events-none"
          style={{ background: V_BTN_SHINE }}
        />
        <span className="relative">{word}</span>
      </button>
      {imageUrl && (
        <div
          className="relative w-[110px] h-[110px] sm:w-[160px] sm:h-[160px] rounded-[22px] flex-shrink-0 overflow-hidden transition-transform duration-150 hover:-translate-y-1 hover:rotate-[-1.5deg] hover:scale-[1.04]"
          style={{ background: '#fffdf5', boxShadow: V_FRAME_SHADOW }}
        >
          <img src={imageUrl} alt={word} className="w-full h-full object-cover rounded-[18px]" />
          <div
            className="absolute top-[6px] left-[10px] w-[38%] h-[28%] rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.72) 0%, transparent 100%)',
            }}
          />
        </div>
      )}
    </div>
  );
}

// --- 자연 배경 (초록 그라데이션 + 자연 장식) ---
export const NATURE_BG_GRADIENT =
  'linear-gradient(180deg, #b8e6c8 0%, #a0d8b4 20%, #8ccca4 45%, #7ec49c 70%, #6dba90 100%)';

export function NatureBg() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
      {/* 구름 */}
      <span
        className="absolute text-[3rem] sm:text-[4rem] opacity-60 animate-[float_8s_ease-in-out_infinite]"
        style={{ top: '5%', left: '8%' }}
      >
        ☁️
      </span>
      <span
        className="absolute text-[2.5rem] sm:text-[3.5rem] opacity-50 animate-[float_10s_ease-in-out_2s_infinite]"
        style={{ top: '3%', right: '12%' }}
      >
        ☁️
      </span>
      <span
        className="absolute text-[2rem] sm:text-[2.8rem] opacity-40 animate-[float_12s_ease-in-out_4s_infinite]"
        style={{ top: '10%', left: '55%' }}
      >
        ☁️
      </span>
      {/* 나무 */}
      <span
        className="absolute text-[3rem] sm:text-[4.5rem] opacity-30"
        style={{ bottom: '2%', left: '3%' }}
      >
        🌳
      </span>
      <span
        className="absolute text-[2.5rem] sm:text-[3.5rem] opacity-25"
        style={{ bottom: '2%', right: '5%' }}
      >
        🌲
      </span>
      <span
        className="absolute text-[2rem] sm:text-[3rem] opacity-20"
        style={{ bottom: '2%', left: '30%' }}
      >
        🌳
      </span>
      {/* 꽃 */}
      <span
        className="absolute text-[1.8rem] sm:text-[2.4rem] opacity-40"
        style={{ bottom: '5%', left: '18%' }}
      >
        🌸
      </span>
      <span
        className="absolute text-[1.5rem] sm:text-[2rem] opacity-35"
        style={{ bottom: '8%', right: '20%' }}
      >
        🌼
      </span>
      <span
        className="absolute text-[1.6rem] sm:text-[2.2rem] opacity-30"
        style={{ bottom: '4%', right: '35%' }}
      >
        🌺
      </span>
      {/* 나뭇잎 */}
      <span
        className="absolute text-[1.4rem] sm:text-[1.8rem] opacity-35 animate-[drift_6s_ease-in-out_infinite]"
        style={{ top: '20%', left: '4%' }}
      >
        🍃
      </span>
      <span
        className="absolute text-[1.2rem] sm:text-[1.6rem] opacity-30 animate-[drift_8s_ease-in-out_1s_infinite]"
        style={{ top: '35%', right: '6%' }}
      >
        🍂
      </span>
      <span
        className="absolute text-[1.3rem] sm:text-[1.7rem] opacity-25 animate-[drift_7s_ease-in-out_3s_infinite]"
        style={{ top: '50%', left: '10%' }}
      >
        🌿
      </span>
      {/* 반짝이 */}
      <span
        className="absolute text-[1.2rem] sm:text-[1.5rem] opacity-50 animate-[twinkle_3s_ease-in-out_infinite]"
        style={{ top: '15%', left: '25%' }}
      >
        ✨
      </span>
      <span
        className="absolute text-[1rem] sm:text-[1.3rem] opacity-40 animate-[twinkle_4s_ease-in-out_1.5s_infinite]"
        style={{ top: '25%', right: '18%' }}
      >
        ⭐
      </span>
      <span
        className="absolute text-[0.9rem] sm:text-[1.2rem] opacity-35 animate-[twinkle_3.5s_ease-in-out_0.8s_infinite]"
        style={{ top: '40%', left: '45%' }}
      >
        ✨
      </span>
      <span
        className="absolute text-[1.1rem] sm:text-[1.4rem] opacity-30 animate-[twinkle_5s_ease-in-out_2s_infinite]"
        style={{ bottom: '20%', right: '10%' }}
      >
        🫧
      </span>
    </div>
  );
}
