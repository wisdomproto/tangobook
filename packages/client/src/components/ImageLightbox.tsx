import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageLightboxProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, onClose }: ImageLightboxProps) {
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  // 🔴 body 로 포털 — transform 이 걸린 조상(정렬 카드) 안에서는 fixed 가 그 카드 기준이 되고
  //    조상의 opacity 까지 상속받아 확대 이미지가 반투명해진다.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="fixed inset-0 bg-black/80" />
      <div className="relative max-w-[90vw] max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/80 hover:text-white text-2xl leading-none"
        >
          &times;
        </button>
        <img src={src} alt={alt ?? ''} className="max-w-full max-h-[90vh] rounded-lg shadow-2xl" />
      </div>
    </div>,
    document.body
  );
}
