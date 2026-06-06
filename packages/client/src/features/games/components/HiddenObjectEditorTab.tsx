import { useState, useRef, useCallback, type MouseEvent } from 'react';
import { Button } from '@/design-system';
import { ImageDropZone } from '@/components/ImageDropZone';
import { UploadMenu } from '@/components/UploadMenu';
import { apiClient } from '@/lib/axios';
import type { Storybook, HiddenObjectScene, HiddenObjectHotspot } from '@tangobook/shared';

interface Props {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

type DraftBox = HiddenObjectHotspot;

export function HiddenObjectEditorTab({ storybook, onUpdate, onSave }: Props) {
  const keyObjects = storybook.key_objects ?? [];
  const keyObjectImages = storybook.keyObjectImages ?? [];
  const scenes = storybook.hiddenObjectScenes ?? [];

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [draftSceneUrl, setDraftSceneUrl] = useState<string | null>(null);
  const [draftBoxes, setDraftBoxes] = useState<DraftBox[]>([]);
  const [labelFor, setLabelFor] = useState<string>('');
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{ x: number; y: number } | null>(null);
  const [dragBox, setDragBox] = useState<DraftBox | null>(null);

  const imageOf = (name: string) =>
    keyObjectImages.find((i) => i.objectName === name && i.success)?.imageUrl;

  // 외부에서 만든 씬 이미지를 업로드 (다른 이미지 탭과 동일한 /images/upload 재사용)
  const handleUploadScene = useCallback(
    async (file: File) => {
      setUploading(true);
      try {
        const form = new FormData();
        form.append('image', file);
        form.append('storybookId', storybook.id);
        form.append('storybookTitle', storybook.title);
        form.append('type', 'hiddenobj');
        form.append('characterName', `scene-${Date.now()}`);
        const res = await apiClient.post<{ success: true; data: { imageUrl: string } }>(
          '/images/upload',
          form,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
        const imageUrl = res.data.data.imageUrl;
        setDraftSceneUrl(imageUrl);
        setDraftBoxes([]);
        setLabelFor(Array.from(selected)[0] ?? '');
      } finally {
        setUploading(false);
      }
    },
    [storybook.id, storybook.title, selected]
  );

  const toggle = (name: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const norm = (clientX: number, clientY: number) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)),
      y: Math.min(1, Math.max(0, (clientY - rect.top) / rect.height)),
    };
  };

  const onMouseDown = (e: MouseEvent) => {
    if (!labelFor) return;
    const p = norm(e.clientX, e.clientY);
    dragRef.current = p;
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragRef.current || !labelFor) return;
    const p = norm(e.clientX, e.clientY);
    const x = Math.min(dragRef.current.x, p.x);
    const y = Math.min(dragRef.current.y, p.y);
    const w = Math.abs(p.x - dragRef.current.x);
    const h = Math.abs(p.y - dragRef.current.y);
    setDragBox({ objectName: labelFor, x, y, w, h });
  };
  const onMouseUp = () => {
    if (dragBox && dragBox.w > 0.02 && dragBox.h > 0.02) {
      setDraftBoxes((prev) => [
        ...prev.filter((b) => b.objectName !== dragBox.objectName),
        dragBox,
      ]);
    }
    dragRef.current = null;
    setDragBox(null);
  };

  const saveScene = useCallback(() => {
    if (!draftSceneUrl || draftBoxes.length === 0) return;
    const scene: HiddenObjectScene = {
      id: `hobj_${Date.now()}`,
      sceneImageUrl: draftSceneUrl,
      artStyle: storybook.artStyle,
      hotspots: draftBoxes,
    };
    onUpdate((draft) => {
      draft.hiddenObjectScenes = [...(draft.hiddenObjectScenes ?? []), scene];
    });
    onSave();
    setDraftSceneUrl(null);
    setDraftBoxes([]);
  }, [draftSceneUrl, draftBoxes, storybook.artStyle, onUpdate, onSave]);

  const deleteScene = (id: string) => {
    onUpdate((draft) => {
      draft.hiddenObjectScenes = (draft.hiddenObjectScenes ?? []).filter((s) => s.id !== id);
    });
    onSave();
  };

  const markedNames = new Set(draftBoxes.map((b) => b.objectName));

  return (
    <ImageDropZone onFile={handleUploadScene} disabled={uploading} enablePaste>
      {(openFilePicker) => (
        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-lg font-bold text-ink-900">
              1. 이 씬에 숨긴 단어 선택 (6~10개 권장)
            </h3>
            <div className="flex flex-wrap gap-2">
              {keyObjects.map((ko) => {
                const on = selected.has(ko.name);
                return (
                  <button
                    key={ko.name}
                    onClick={() => toggle(ko.name)}
                    className={`flex items-center gap-2 rounded-xl border-2 px-3 py-2 ${
                      on ? 'border-coral-500 bg-coral-100' : 'border-peach-200 bg-white'
                    }`}
                  >
                    {imageOf(ko.name) && (
                      <img src={imageOf(ko.name)} alt="" className="w-8 h-8 object-contain" />
                    )}
                    <span className="text-sm font-medium">{ko.korean || ko.name}</span>
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-3">
              <UploadMenu
                onFile={handleUploadScene}
                openFilePicker={openFilePicker}
                disabled={uploading}
                size="md"
              />
              <span className="text-sm text-ink-700">
                {uploading
                  ? '업로드 중…'
                  : '외부에서 만든 씬 이미지를 업로드하세요 (드래그·붙여넣기·파일선택)'}
              </span>
            </div>
          </section>

          {draftSceneUrl && (
            <section className="space-y-2">
              <h3 className="text-lg font-bold text-ink-900">2. 사물 위치 마킹</h3>
              <p className="text-sm text-ink-700">
                아래에서 단어를 고른 뒤, 씬에서 해당 사물을 박스로 드래그하세요. 이미지에 없는
                사물은 건너뜁니다.
              </p>
              <div className="flex flex-wrap gap-2">
                {Array.from(selected).map((name) => (
                  <button
                    key={name}
                    onClick={() => setLabelFor(name)}
                    className={`rounded-lg border-2 px-3 py-1 text-sm ${
                      labelFor === name
                        ? 'border-coral-500 bg-coral-100'
                        : markedNames.has(name)
                          ? 'border-success bg-success/10'
                          : 'border-peach-200 bg-white'
                    }`}
                  >
                    {markedNames.has(name) ? '✓ ' : ''}
                    {keyObjects.find((k) => k.name === name)?.korean || name}
                  </button>
                ))}
              </div>
              <div
                ref={canvasRef}
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={onMouseUp}
                onMouseLeave={onMouseUp}
                className="relative w-full max-w-3xl mx-auto select-none cursor-crosshair"
              >
                <img src={draftSceneUrl} alt="" draggable={false} className="w-full rounded-2xl" />
                {draftBoxes.map((b) => (
                  <div
                    key={b.objectName}
                    className="absolute border-2 border-coral-500 bg-coral-500/20 flex items-start"
                    style={{
                      left: `${b.x * 100}%`,
                      top: `${b.y * 100}%`,
                      width: `${b.w * 100}%`,
                      height: `${b.h * 100}%`,
                    }}
                  >
                    <span className="text-xs bg-coral-500 text-white px-1 rounded">
                      {keyObjects.find((k) => k.name === b.objectName)?.korean || b.objectName}
                    </span>
                  </div>
                ))}
                {dragBox && (
                  <div
                    className="absolute border-2 border-dashed border-coral-600 bg-coral-500/10"
                    style={{
                      left: `${dragBox.x * 100}%`,
                      top: `${dragBox.y * 100}%`,
                      width: `${dragBox.w * 100}%`,
                      height: `${dragBox.h * 100}%`,
                    }}
                  />
                )}
              </div>
              <div className="flex gap-2">
                <Button onClick={saveScene} disabled={draftBoxes.length === 0}>
                  씬 저장 ({draftBoxes.length}개 마킹)
                </Button>
                <Button variant="ghost" onClick={openFilePicker} disabled={uploading}>
                  다른 이미지 올리기
                </Button>
              </div>
            </section>
          )}

          <section className="space-y-2">
            <h3 className="text-lg font-bold text-ink-900">저장된 씬 ({scenes.length})</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {scenes.map((s) => (
                <div
                  key={s.id}
                  className="relative rounded-xl overflow-hidden border-2 border-peach-200"
                >
                  <img src={s.sceneImageUrl} alt="" className="w-full aspect-video object-cover" />
                  <span className="absolute bottom-1 left-1 text-xs bg-black/60 text-white px-1 rounded">
                    {s.hotspots.length}개 사물
                  </span>
                  <button
                    onClick={() => deleteScene(s.id)}
                    className="absolute top-1 right-1 bg-danger text-white rounded-full w-6 h-6 text-sm"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </ImageDropZone>
  );
}
