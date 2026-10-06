import { useEffect, useRef, useState } from 'react';
import { coverTitleLayout } from './coverTitleLayout';

export function CoverTitle({
  title,
  lang,
  color,
  stroke,
}: {
  title: string;
  lang: string;
  color: string;
  stroke: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const korean = lang.toLowerCase().split('-')[0] === 'ko';
  const [layout, setLayout] = useState<{ title: string; lines: string[]; fontSize: number }>();
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof CanvasRenderingContext2D === 'undefined') return;
    const context = document.createElement('canvas').getContext('2d');
    if (!context) return;
    let disposed = false;
    const fit = () => {
      if (disposed) return;
      const width = el.clientWidth;
      if (!width) return;
      const size = Math.min(64, (width / 0.88) * 0.12);
      const style = getComputedStyle(el);
      context.font = `${style.fontWeight} ${size}px ${style.fontFamily}`;
      const result = coverTitleLayout(
        title,
        width - 4,
        size,
        (s) => context.measureText(s).width,
        lang
      );
      setLayout({ title, ...result });
    };
    fit();
    void document.fonts?.ready.then(fit);
    document.fonts?.addEventListener('loadingdone', fit);
    const observer = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(fit) : null;
    observer?.observe(el);
    return () => {
      disposed = true;
      observer?.disconnect();
      document.fonts?.removeEventListener('loadingdone', fit);
    };
  }, [title, lang]);
  const current = layout?.title === title ? layout : undefined;
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute bottom-0 inset-x-0 h-[65%] pointer-events-none"
        style={{ background: `linear-gradient(to bottom, transparent, ${stroke}b3)` }}
      />
      <div
        aria-hidden="true"
        data-cover-title
        className="absolute bottom-[5%] left-[6%] right-[6%] z-[3] pointer-events-none"
      >
        <span
          ref={ref}
          lang={lang.toLowerCase().split('-')[0]}
          className="block text-center leading-[1.06]"
          style={{
            fontFamily: korean ? '"Cafe24 Ssurround", sans-serif' : 'inherit',
            fontWeight: korean ? 400 : 700,
            fontSize: current ? `${current.fontSize}px` : 'min(12cqw, 64px)',
            color,
            textShadow: `0 1px 3px ${stroke}`,
            WebkitTextStroke: `.025em ${stroke}`,
            paintOrder: 'stroke fill',
          }}
        >
          {(current?.lines ?? [title]).map((line, i) => (
            <span key={i} data-title-line className="block whitespace-nowrap">
              {line}
            </span>
          ))}
        </span>
      </div>
    </>
  );
}
