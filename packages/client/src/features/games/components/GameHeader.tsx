/**
 * 게임 공용 헤더 — 시안 톤 (둥둥 떠있는 흰 wash 카드).
 *
 * 좌: ← 뒤로 가기 (peach pill).
 * 가운데: ★ 게임 제목 current/total ★.
 * 우: 빈 placeholder (좌 버튼과 가운데 균형 맞춤).
 *
 * 사용처: LineMatching / KoreanBlock / EnglishBlock / ConnectTheDots / WordWriting 등 4-5세 게임.
 * GamePlayerLayout 의 자체 onBack 버튼은 비활성화 (onBack prop 미전달).
 */
interface GameHeaderProps {
  /** 게임 이름 (예: "그림짝 맞추기", "한글 블록"). */
  title: string;
  /** 현재 진행 단위 (matched / currentIndex / itemIdx 등 게임마다 상이). */
  current: number;
  /** 총 단위 수 (items.length). */
  total: number;
  /** 뒤로 가기 콜백. */
  onBack: () => void;
}

export function GameHeader({ title, current, total, onBack }: GameHeaderProps) {
  return (
    <header className="h-[clamp(2.75rem,9vh,6rem)] flex items-center justify-between gap-[clamp(0.5rem,1.5vh,1rem)] shrink-0 mb-[clamp(0.125rem,1vh,1.5rem)] bg-white/60 backdrop-blur-sm shadow-soft rounded-3xl px-[clamp(0.75rem,1.5vw,1.5rem)] mx-2 mt-1.5">
      <button
        onClick={onBack}
        className="px-[clamp(0.75rem,2vw,1.5rem)] py-[clamp(0.375rem,1.25vh,0.75rem)] rounded-full bg-peach-100 text-ink-900 font-black text-[clamp(0.875rem,2vh,1.25rem)] shadow-soft hover:shadow-pop transition flex items-center gap-2"
      >
        <span>←</span>
        <span>뒤로 가기</span>
      </button>

      <div className="flex items-center gap-[clamp(0.5rem,1.5vh,1rem)] text-[clamp(1.25rem,3.5vh,2.25rem)] font-black font-display text-ink-900">
        <span className="text-warn">★</span>
        <span>{title}</span>
        <span className="text-coral-500">
          {current}/{total}
        </span>
        <span className="text-warn">★</span>
      </div>

      {/* 우측 placeholder — 좌 버튼 폭과 균형. */}
      <div className="w-[clamp(4rem,12vw,8rem)]" aria-hidden />
    </header>
  );
}
