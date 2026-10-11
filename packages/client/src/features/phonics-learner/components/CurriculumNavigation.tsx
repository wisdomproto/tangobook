import { useEffect, useId, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

/** 같은 단원 목록을 데스크톱 패널/모바일 대화상자로 제공한다. */
export function CurriculumNavigation({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation('phonics');
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);
  useEffect(() => {
    const query = window.matchMedia('(min-width: 768px)');
    const closeAtDesktop = () => {
      if (query.matches) dialog.current?.close();
    };
    query.addEventListener('change', closeAtDesktop);
    return () => query.removeEventListener('change', closeAtDesktop);
  }, []);
  return (
    <>
      <aside className="hidden h-full w-64 shrink-0 overflow-y-auto border-r border-ink-100 bg-white px-3 py-4 md:block">
        {children}
      </aside>
      <dialog
        ref={dialog}
        aria-labelledby={id}
        onClose={onClose}
        onClick={(event) => {
          const rect = event.currentTarget.getBoundingClientRect();
          if (
            event.target === event.currentTarget &&
            (event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom)
          )
            onClose();
        }}
        className="m-0 h-[100dvh] max-h-none w-80 max-w-[90vw] border-0 bg-white p-4 backdrop:bg-black/40 md:hidden"
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id={id} className="font-display text-section-title">
            {t('common.unitPicker')}
          </h2>
          <button
            type="button"
            autoFocus
            onClick={onClose}
            aria-label={t('common.close')}
            className="grid size-11 place-items-center rounded-full border border-ink-100 text-ink-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-coral-700"
          >
            ✕
          </button>
        </div>
        {children}
      </dialog>
    </>
  );
}
