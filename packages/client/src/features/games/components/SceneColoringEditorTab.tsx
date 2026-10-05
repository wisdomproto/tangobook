import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import type { Lang, Storybook } from '@tangobook/shared';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { Button } from '@/design-system';
import { stopDrawLoop } from '@/lib/uiSound';
import { ColoringPlayer } from './players/ColoringPlayer';
import { editorSceneColoringItem, type SceneColoringCatalog } from '../lib/editor-scene-coloring';

export function SceneColoringEditorTab({ storybook }: { storybook: Storybook }) {
  const language = useEditorLang() ?? 'ko';
  const lang = ['ko', 'en', 'vi', 'zh', 'th'].includes(language) ? (language as Lang) : null;
  const [playing, setPlaying] = useState<string | null>(null);
  const catalog = useQuery({
    queryKey: ['scene-coloring', 'editor-catalog'],
    queryFn: async () =>
      (await import('../data/scene-coloring-catalog.json')).default as SceneColoringCatalog,
    staleTime: Infinity,
  });
  const scenes = catalog.data?.[storybook.id] ?? [];
  const selected = scenes.find((scene) => scene.key === playing);
  const item = selected && lang ? editorSceneColoringItem(selected, storybook, lang) : null;
  const isPlaying = !!item;
  const dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isPlaying) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPlaying(null);
      if (event.key !== 'Tab') return;
      const buttons = dialog.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [tabindex="0"]'
      );
      if (!buttons?.length) {
        event.preventDefault();
        return;
      }
      const first = buttons[0],
        last = buttons[buttons.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first || document.activeElement === dialog.current)
      ) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      stopDrawLoop();
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKey);
      previousFocus?.focus();
    };
  }, [selected?.key, lang, isPlaying]);

  if (item)
    return createPortal(
      <div
        ref={dialog}
        tabIndex={-1}
        className="fixed inset-0 z-[100] bg-cream-50"
        role="dialog"
        aria-modal="true"
        aria-label="장면 색칠 게임 미리보기"
      >
        <ColoringPlayer
          key={`${item.lineartUrl}-${lang}`}
          items={[item]}
          onBack={() => setPlaying(null)}
        />
      </div>,
      document.body
    );
  if (catalog.isPending) return <p role="status">장면 색칠 도안을 불러오는 중…</p>;
  if (catalog.isError)
    return (
      <div role="alert" className="space-y-3">
        <p>도안을 불러오지 못했습니다.</p>
        <Button onClick={() => void catalog.refetch()}>다시 불러오기</Button>
      </div>
    );
  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-ink-900">장면 색칠</h2>
        <p className="mt-2 text-sm text-ink-700">
          이 책의 장면 도안 {scenes.length}장 · 원본을 보고 색칠한 뒤 해당 쪽 이야기를 들어보세요.
        </p>
      </div>
      {!scenes.length && (
        <p className="rounded-xl bg-peach-100 p-5 text-ink-700">
          이 책에는 아직 만든 장면 색칠 도안이 없습니다.
        </p>
      )}
      {scenes.map((scene) => {
        const preview = lang ? editorSceneColoringItem(scene, storybook, lang) : null;
        return (
          <article
            key={scene.key}
            className="rounded-2xl border border-ink-100 bg-white p-4 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-ink-900">{scene.pageNumber}쪽 장면</h3>
              <Button disabled={!preview} onClick={() => setPlaying(scene.key)}>
                게임 미리보기
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <figure>
                <img
                  src={scene.colorSourceUrl}
                  alt={`${scene.pageNumber}쪽 원본`}
                  className="aspect-video w-full object-contain rounded-xl bg-cream-50"
                  loading="lazy"
                />
                <figcaption className="mt-2 text-sm text-ink-700">원본 장면</figcaption>
              </figure>
              <figure>
                <img
                  src={scene.lineartUrl}
                  alt={`${scene.pageNumber}쪽 색칠 도안`}
                  className="aspect-video w-full object-contain rounded-xl border border-ink-100"
                  loading="lazy"
                />
                <figcaption className="mt-2 text-sm text-ink-700">색칠 도안</figcaption>
              </figure>
            </div>
            {preview ? (
              <p className="text-sm text-ink-700 whitespace-pre-line">{preview.scene?.text}</p>
            ) : (
              <p className="text-sm text-ink-500">
                선택한 언어의 본문이 없어 게임 미리보기를 제공하지 않습니다.
              </p>
            )}
          </article>
        );
      })}
    </section>
  );
}
