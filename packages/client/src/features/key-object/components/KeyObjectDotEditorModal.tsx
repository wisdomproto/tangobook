import { useState } from 'react';
import { Button } from '@/design-system';
import { DotEditorCanvas } from '@/components/DotEditorCanvas';
import type { DotKeypoint } from '@tangobook/shared';

interface KeyObjectDotEditorModalProps {
  objectName: string;
  imageUrl: string;
  initialKeypoints: DotKeypoint[];
  onSave: (keypoints: DotKeypoint[]) => void;
  onClose: () => void;
}

export function KeyObjectDotEditorModal({
  objectName,
  imageUrl,
  initialKeypoints,
  onSave,
  onClose,
}: KeyObjectDotEditorModalProps) {
  const [keypoints, setKeypoints] = useState<DotKeypoint[]>(
    initialKeypoints.map((kp) => ({ ...kp }))
  );

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            점잇기 편집 — {objectName} ({keypoints.length}개)
          </h2>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setKeypoints([])}>
              전체 삭제
            </Button>
            <Button size="sm" onClick={() => onSave(keypoints)}>
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

        <div className="p-4">
          <DotEditorCanvas
            imageUrl={imageUrl}
            imageAlt={objectName}
            keypoints={keypoints}
            onKeypointsChange={setKeypoints}
          />
        </div>
      </div>
    </div>
  );
}
