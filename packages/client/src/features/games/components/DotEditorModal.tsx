import { useState, useCallback } from 'react';
import { Button } from '@/components/Button';
import { DotEditorCanvas } from '@/components/DotEditorCanvas';
import type {
  GameInstance,
  ConnectTheDotsData,
  ConnectTheDotsItem,
  DotKeypoint,
} from '@tangobook/shared';

interface DotEditorModalProps {
  game: GameInstance;
  onSave: (updatedData: ConnectTheDotsData) => void;
  onClose: () => void;
}

export function DotEditorModal({ game, onSave, onClose }: DotEditorModalProps) {
  const data = game.data as ConnectTheDotsData;
  const [items, setItems] = useState<ConnectTheDotsItem[]>(
    data.items.map((it) => ({ ...it, keypoints: [...it.keypoints] }))
  );
  const [activeIdx, setActiveIdx] = useState(0);
  const activeItem = items[activeIdx];

  const updateKeypoints = useCallback(
    (newKps: DotKeypoint[]) => {
      setItems((prev) =>
        prev.map((it, i) => (i === activeIdx ? { ...it, keypoints: newKps } : it))
      );
    },
    [activeIdx]
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            점잇기 편집 — {activeItem.keypoints.length}개
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => updateKeypoints([])}>
              전체 삭제
            </Button>
            <Button size="sm" onClick={() => onSave({ type: 'connect-the-dots', items })}>
              저장
            </Button>
            <button
              onClick={onClose}
              className="ml-2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
            >
              ✕
            </button>
          </div>
        </div>

        {items.length > 1 && (
          <div className="flex gap-2 px-4 pt-3">
            {items.map((it, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  i === activeIdx
                    ? 'bg-violet-50 border-violet-300 text-violet-700 dark:bg-violet-900/30 dark:border-violet-600 dark:text-violet-300'
                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-slate-300'
                }`}
              >
                {it.objectName ?? `p.${it.pageNumber}`} ({it.keypoints.length})
              </button>
            ))}
          </div>
        )}

        <div className="p-4">
          <DotEditorCanvas
            imageUrl={activeItem.originalImageUrl}
            imageAlt={activeItem.objectName ?? `Page ${activeItem.pageNumber}`}
            keypoints={activeItem.keypoints}
            onKeypointsChange={updateKeypoints}
          />
        </div>
      </div>
    </div>
  );
}
