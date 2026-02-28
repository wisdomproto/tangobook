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
export const V_FONT = "'Nunito', 'Comic Sans MS', 'Chalkboard SE', cursive, sans-serif";

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
