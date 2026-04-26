import { useEffect, useRef, useState } from 'react';
import { useSaveLongform } from '../hooks/useLongform';
import type { LongformProjectV2, LongformSubtitleEntry } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface SceneEditorProps {
  bid: string;
  projectId: string;
  scene: LongformProjectV2['scenes'][number];
  /** 같은 프로젝트의 다른 씬들 (저장 시 함께 PUT) */
  allScenes: LongformProjectV2['scenes'];
  onClose: () => void;
}

type Scene = LongformProjectV2['scenes'][number];

export function SceneEditor({ bid, projectId, scene, allScenes, onClose }: SceneEditorProps) {
  const save = useSaveLongform(bid);
  const [draft, setDraft] = useState<Scene>(scene);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => setDraft(scene), [scene.id]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(scene);

  const update = (patch: Partial<Scene>) => setDraft((d) => ({ ...d, ...patch }));

  const handleSave = () => {
    const nextScenes = allScenes.map((s) => (s.id === draft.id ? draft : s));
    save.mutate({ projectId, patch: { scenes: nextScenes } }, { onSuccess: () => onClose() });
  };

  const trimStart = draft.trimStart ?? 0;
  const trimEnd = draft.trimEnd ?? draft.clipDuration;
  const effectiveDuration = Math.max(0.1, trimEnd - trimStart);

  // 자막 편집
  const updateSubtitle = (i: number, patch: Partial<LongformSubtitleEntry>) => {
    const subs = [...(draft.subtitles ?? [])];
    subs[i] = { ...subs[i], ...patch };
    update({ subtitles: subs });
  };
  const addSubtitle = () => {
    const subs = [...(draft.subtitles ?? [])];
    const last = subs[subs.length - 1];
    const start = last ? last.endTime : 0;
    subs.push({
      id: `sub-${Date.now()}`,
      text: '',
      startTime: start,
      endTime: Math.min(start + 2, effectiveDuration),
    });
    update({ subtitles: subs });
  };
  const removeSubtitle = (i: number) => {
    const subs = [...(draft.subtitles ?? [])];
    subs.splice(i, 1);
    update({ subtitles: subs });
  };

  return (
    <div className="bg-white rounded-md border-2 border-coral-300 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-black text-ink-900">🎬 씬 편집 — p{draft.pageNumber}</h4>
        <button onClick={onClose} className="text-ink-500 hover:text-ink-900 text-xl">
          ×
        </button>
      </div>

      {/* 프리뷰 */}
      {draft.clipUrl ? (
        <video
          ref={videoRef}
          src={draft.clipUrl}
          controls
          className="w-full rounded-md bg-black"
          preload="metadata"
        />
      ) : (
        <div className="aspect-video bg-ink-100 rounded-md flex items-center justify-center text-ink-300 text-sm font-bold">
          클립 없음 — 먼저 🎬 클립 생성
        </div>
      )}

      {/* 클립 정보 */}
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
            클립 길이 (초)
          </label>
          <input
            type="number"
            step={0.1}
            value={draft.clipDuration}
            onChange={(e) => update({ clipDuration: Number(e.target.value) })}
            className="input"
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">page #</label>
          <div className="px-2 py-1.5 bg-cream-50 rounded text-ink-500 font-mono">
            {draft.pageNumber}
          </div>
        </div>
      </div>

      {/* 트림 */}
      <Section title="✂️ 트림">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
              시작 (초)
            </label>
            <input
              type="number"
              min={0}
              max={draft.clipDuration}
              step={0.1}
              value={trimStart}
              onChange={(e) =>
                update({
                  trimStart: Math.max(0, Math.min(Number(e.target.value), trimEnd - 0.1)),
                })
              }
              className="input"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
              끝 (초)
            </label>
            <input
              type="number"
              min={0}
              max={draft.clipDuration}
              step={0.1}
              value={trimEnd}
              onChange={(e) =>
                update({
                  trimEnd: Math.max(
                    trimStart + 0.1,
                    Math.min(Number(e.target.value), draft.clipDuration)
                  ),
                })
              }
              className="input"
            />
          </div>
        </div>
        <div className="text-[11px] text-ink-500 font-bold mt-1">
          유효 길이: {effectiveDuration.toFixed(1)}s
        </div>
      </Section>

      {/* 볼륨 + 오프셋 */}
      <Section title="🔊 오디오">
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
              SFX 볼륨 ({(draft.sfxVolume ?? 0.5).toFixed(2)})
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.sfxVolume ?? 0.5}
              onChange={(e) => update({ sfxVolume: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
              TTS 볼륨 ({(draft.ttsVolume ?? 1).toFixed(2)})
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={draft.ttsVolume ?? 1}
              onChange={(e) => update({ ttsVolume: Number(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
              SFX 오프셋 (초)
            </label>
            <input
              type="number"
              step={0.1}
              value={draft.sfxOffset ?? 0}
              onChange={(e) => update({ sfxOffset: Number(e.target.value) })}
              className="input"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-ink-500 uppercase mb-1">
              TTS 오프셋 (초)
            </label>
            <input
              type="number"
              step={0.1}
              value={draft.ttsOffset ?? 0}
              onChange={(e) => update({ ttsOffset: Number(e.target.value) })}
              className="input"
            />
          </div>
        </div>
      </Section>

      {/* 자막 */}
      <Section title={`💬 자막 (${draft.subtitles?.length ?? 0})`}>
        <div className="space-y-2">
          {(draft.subtitles ?? []).map((s, i) => (
            <div key={s.id} className="grid grid-cols-[1fr_60px_60px_24px] gap-1.5 items-center">
              <input
                value={s.text}
                onChange={(e) => updateSubtitle(i, { text: e.target.value })}
                placeholder="자막 텍스트"
                className="input"
              />
              <input
                type="number"
                step={0.1}
                value={s.startTime}
                onChange={(e) => updateSubtitle(i, { startTime: Number(e.target.value) })}
                className="input"
                title="시작 (초)"
              />
              <input
                type="number"
                step={0.1}
                value={s.endTime}
                onChange={(e) => updateSubtitle(i, { endTime: Number(e.target.value) })}
                className="input"
                title="끝 (초)"
              />
              <button
                onClick={() => removeSubtitle(i)}
                className="px-1 py-1 rounded bg-danger/10 text-danger text-xs"
                title="삭제"
              >
                ×
              </button>
            </div>
          ))}
          <button
            onClick={addSubtitle}
            className="text-xs text-coral-600 font-bold hover:underline"
          >
            + 자막 추가
          </button>
        </div>
      </Section>

      {save.isError && (
        <div className="bg-danger/10 border border-danger/30 rounded-md p-2 text-xs text-danger font-bold">
          저장 실패: {(save.error as Error).message}
        </div>
      )}

      {/* 저장/닫기 */}
      <div className="flex justify-end gap-2 pt-2 border-t border-ink-100">
        <button
          onClick={onClose}
          className="px-4 py-1.5 rounded-md bg-ink-100 text-ink-700 font-bold text-xs hover:bg-ink-200"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={!dirty || save.isPending}
          className={cn(
            'px-4 py-1.5 rounded-md font-black text-xs',
            dirty && !save.isPending
              ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
              : 'bg-ink-100 text-ink-300 cursor-not-allowed'
          )}
        >
          {save.isPending ? '저장 중...' : dirty ? '💾 저장' : '✓ 저장됨'}
        </button>
      </div>

      <style>{`
        .input {
          width: 100%;
          padding: 0.4rem 0.6rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.75rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="text-[11px] font-black text-ink-700 uppercase tracking-wider">{title}</div>
      {children}
    </div>
  );
}
