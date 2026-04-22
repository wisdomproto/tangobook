/**
 * @deprecated Phase C에서 삭제 예정. 새 코드는 `FeedbackOverlay` 사용.
 * 기존 호출부(13 플레이어)는 Phase C에서 일괄 FeedbackOverlay로 이관.
 */
import { useEffect, useState, useMemo } from 'react';

const PRAISE_EMOJIS = ['🎉', '⭐', '✨', '🌟', '💫', '👏', '🥳', '💖', '🏆', '🎊'];
const PRAISE_TEXTS = ['잘했어요!', '멋져요!', '최고예요!', '대단해요!', '훌륭해요!'];
const PARTICLE_COUNT = 8;

interface Particle {
  emoji: string;
  x: number;
  y: number;
  angle: number;
  distance: number;
  delay: number;
  scale: number;
}

export function PraiseOverlay({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);

  const praiseText = useMemo(
    () => (visible ? PRAISE_TEXTS[Math.floor(Math.random() * PRAISE_TEXTS.length)] : ''),
    [visible]
  );

  const particles = useMemo<Particle[]>(() => {
    if (!visible) return [];
    return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
      emoji: PRAISE_EMOJIS[Math.floor(Math.random() * PRAISE_EMOJIS.length)],
      x: 50 + (Math.random() - 0.5) * 40,
      y: 50 + (Math.random() - 0.5) * 30,
      angle: (360 / PARTICLE_COUNT) * i + Math.random() * 30,
      distance: 60 + Math.random() * 40,
      delay: Math.random() * 0.2,
      scale: 0.7 + Math.random() * 0.6,
    }));
  }, [visible]);

  useEffect(() => {
    if (visible) {
      setShow(true);
    } else {
      const t = setTimeout(() => setShow(false), 400);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center"
      style={{ perspective: '600px' }}
    >
      {/* 반투명 배경 */}
      <div
        className="absolute inset-0 transition-opacity duration-300"
        style={{
          backgroundColor: 'rgba(0,0,0,0.15)',
          opacity: visible ? 1 : 0,
        }}
      />

      {/* 중앙 텍스트 */}
      <div
        className="relative text-center transition-all"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'scale(1)' : 'scale(0.5)',
          transition: 'opacity 0.3s, transform 0.4s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        <div className="text-6xl mb-2" style={{ animation: 'praise-bounce 0.6s ease-out' }}>
          🎉
        </div>
        <p
          className="text-2xl font-black text-white drop-shadow-lg"
          style={{ textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}
        >
          {praiseText}
        </p>
      </div>

      {/* 파티클 이모지 */}
      {particles.map((p, i) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              fontSize: `${p.scale * 1.8}rem`,
              opacity: visible ? 0 : 1,
              transform: visible
                ? `translate(${tx}px, ${ty}px) scale(${p.scale}) rotate(${p.angle}deg)`
                : 'translate(0,0) scale(0)',
              transition: `opacity 0.8s ${p.delay}s, transform 0.7s ${p.delay}s cubic-bezier(0.34,1.56,0.64,1)`,
              animation: visible ? `praise-particle 0.8s ${p.delay}s ease-out forwards` : undefined,
            }}
          >
            {p.emoji}
          </div>
        );
      })}

      <style>{`
        @keyframes praise-bounce {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          70% { transform: scale(0.9); }
          100% { transform: scale(1); }
        }
        @keyframes praise-particle {
          0% {
            opacity: 0;
            transform: translate(0, 0) scale(0);
          }
          30% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translate(var(--tx), var(--ty)) scale(var(--s)) rotate(var(--r));
          }
        }
      `}</style>
    </div>
  );
}
