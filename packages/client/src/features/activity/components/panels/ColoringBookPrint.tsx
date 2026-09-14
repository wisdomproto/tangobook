import { useEffect, useRef } from 'react';

export interface ColoringBookSheet {
  key: string;
  word: string;
  lineartUrl: string;
}

/**
 * 「색칠책」 인쇄 — 한 책(또는 파닉스 단원)의 도안을 표지 1장 + 도안 N장으로 한 번에 뽑는다.
 * 화면엔 안 보이고(`hidden print:block`) 인쇄에만 나온다. 그림을 다 받은 뒤 인쇄 창을 연다 —
 * 안 기다리면 빈 칸이 인쇄된다.
 */
export function ColoringBookPrint({
  title,
  sheets,
  onDone,
}: {
  title: string;
  sheets: ColoringBookSheet[];
  onDone: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    let cancelled = false;
    const imgs = [...(rootRef.current?.querySelectorAll('img') ?? [])];
    Promise.all(
      imgs.map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((r) => {
              img.onload = img.onerror = () => r();
            })
      )
    ).then(() => {
      if (cancelled) return;
      window.print();
      onDoneRef.current();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div ref={rootRef} className="hidden print:block">
      <section className="flex flex-col items-center text-center">
        <p className="mt-6 text-lg font-bold text-ink-500">탱고북 색칠책</p>
        <h1 className="mt-2 font-display text-5xl font-extrabold text-ink-900 break-keep">
          {title}
        </h1>
        <p className="mt-3 text-xl text-ink-700">도안 {sheets.length}장</p>
        {/* 표지는 한 장에 끝나야 한다 — 권당 도안이 1~15장이라 칸 수에 맞춰 줄인다(9장까지 3열, 그 위는 4열·작게). */}
        <ul
          className={`mt-8 grid w-full gap-3 ${sheets.length > 9 ? 'grid-cols-4' : 'grid-cols-3'}`}
        >
          {sheets.map((s) => (
            <li key={s.key} className="rounded-xl border-2 border-ink-100 p-2">
              <img
                src={s.lineartUrl}
                alt=""
                className={`mx-auto w-auto object-contain ${sheets.length > 9 ? 'h-[30mm]' : 'h-[45mm]'}`}
              />
              <p className="mt-1 text-lg font-bold">{s.word}</p>
            </li>
          ))}
        </ul>
        <p className="mt-8 text-sm text-ink-500">
          tangobook.co.kr — 이 그림들이 나오는 동화책도 읽어 보세요
        </p>
      </section>
      {sheets.map((s) => (
        <section key={s.key} className="flex break-before-page flex-col items-center">
          <img
            src={s.lineartUrl}
            alt={`${s.word} 색칠도안`}
            className="mx-auto max-h-[235mm] w-auto"
          />
          <p className="mt-2 font-display text-2xl font-extrabold">{s.word}</p>
          <p className="text-xs text-ink-500">{title} · tangobook.co.kr</p>
        </section>
      ))}
    </div>
  );
}
