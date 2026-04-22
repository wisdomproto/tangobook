import { useEffect } from 'react';

interface YouTubeModalProps {
  videoId: string;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export function YouTubeModal({ videoId, open, onClose, title }: YouTubeModalProps) {
  // ESC로 닫기
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  // youtube.com 공식 embed + autoplay + playsinline (모바일) + hd720 힌트.
  // NOTE: vq 파라미터는 YouTube가 힌트로만 사용. 실제 화질은 기기/네트워크/계정 설정으로
  // 자동 결정되며 개발자가 강제 불가 (2018년 setPlaybackQuality API deprecated).
  const src = `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1&playsinline=1&vq=hd720`;
  const watchUrl = `https://youtu.be/${videoId}`;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-darkbg rounded-lg overflow-hidden shadow-card"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center px-4 py-3">
          <div className="text-white font-black text-sm flex items-center gap-2">
            <span>🎬</span>
            <span>{title ?? '애니메이션'}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold hover:bg-white/25 flex items-center gap-1"
              title="YouTube에서 열기"
            >
              YouTube에서 열기 ↗
            </a>
            <button
              onClick={onClose}
              aria-label="닫기"
              className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center text-lg hover:bg-white/25"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={src}
            title={title ?? 'YouTube video'}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            referrerPolicy="strict-origin-when-cross-origin"
          />
        </div>
      </div>
    </div>
  );
}
