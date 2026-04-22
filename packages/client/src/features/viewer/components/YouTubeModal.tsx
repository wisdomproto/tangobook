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

  // privacy-enhanced mode
  const src = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&autoplay=1`;

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
          <button
            onClick={onClose}
            aria-label="닫기"
            className="w-10 h-10 rounded-full bg-white/15 text-white flex items-center justify-center text-lg hover:bg-white/25"
          >
            ✕
          </button>
        </div>
        <div className="aspect-video bg-black">
          <iframe
            src={src}
            title={title ?? 'YouTube video'}
            className="w-full h-full"
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}
