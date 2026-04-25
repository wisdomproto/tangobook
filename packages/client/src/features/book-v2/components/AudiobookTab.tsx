import { useEffect, useState } from 'react';
import {
  useAudiobookProject,
  useSaveAudiobookProject,
  useAudiobookRenders,
} from '../hooks/useAudiobook';
import { AudiobookRenderModal } from './AudiobookRenderModal';
import type {
  AudiobookProjectV2,
  AudiobookTransitions,
  AudiobookSubtitleSettings,
  AudiobookBgmSettings,
  BookManifest,
} from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface AudiobookTabProps {
  manifest: BookManifest;
}

export function AudiobookTab({ manifest }: AudiobookTabProps) {
  const { data: serverProject, isLoading } = useAudiobookProject(manifest.id);
  const { data: renders } = useAudiobookRenders(manifest.id);
  const save = useSaveAudiobookProject(manifest.id);

  const [draft, setDraft] = useState<AudiobookProjectV2 | null>(null);
  const [renderOpen, setRenderOpen] = useState(false);

  useEffect(() => {
    if (serverProject) setDraft(serverProject);
  }, [serverProject]);

  if (isLoading || !draft) {
    return <Centered>로딩 중...</Centered>;
  }

  const transitions = draft.slideTransitions ?? {};
  const subs = draft.subtitleSettings ?? {};
  const bgm = draft.bgmSettings ?? {};

  const dirty = serverProject
    ? JSON.stringify({ ...draft, renders: undefined }) !==
      JSON.stringify({ ...serverProject, renders: undefined })
    : false;

  const setTransitions = (patch: Partial<AudiobookTransitions>) =>
    setDraft((d) =>
      d ? { ...d, slideTransitions: { ...(d.slideTransitions ?? {}), ...patch } } : d
    );
  const setSubs = (patch: Partial<AudiobookSubtitleSettings>) =>
    setDraft((d) =>
      d ? { ...d, subtitleSettings: { ...(d.subtitleSettings ?? {}), ...patch } } : d
    );
  const setBgm = (patch: Partial<AudiobookBgmSettings>) =>
    setDraft((d) => (d ? { ...d, bgmSettings: { ...(d.bgmSettings ?? {}), ...patch } } : d));

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* 저장 바 + 렌더 버튼 */}
      <div className="flex items-center justify-between bg-white rounded-md p-4 shadow-soft">
        <div className="text-sm text-ink-500 font-bold">
          {dirty ? '🟡 변경됨' : save.isPending ? '저장 중...' : '✓ 저장됨'}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRenderOpen(true)}
            className="px-4 py-2 rounded-md font-black text-sm bg-peach-100 text-coral-600 hover:bg-peach-200"
          >
            🎬 렌더
          </button>
          <button
            onClick={() => draft && save.mutate(draft)}
            disabled={!dirty || save.isPending}
            className={cn(
              'px-5 py-2 rounded-md font-black text-sm transition-all',
              dirty && !save.isPending
                ? 'bg-coral-500 text-white shadow-pop hover:brightness-110'
                : 'bg-ink-100 text-ink-300 cursor-not-allowed'
            )}
          >
            💾 저장
          </button>
        </div>
      </div>

      <AudiobookRenderModal
        manifest={manifest}
        open={renderOpen}
        onClose={() => setRenderOpen(false)}
      />

      {save.isError && <ErrorBox>저장 실패: {(save.error as Error)?.message}</ErrorBox>}

      {/* 슬라이드 효과 */}
      <Section title="🎬 슬라이드 전환">
        <div className="grid grid-cols-2 gap-3">
          <Field label="전환 종류">
            <select
              value={(transitions.type as string) ?? 'fade'}
              onChange={(e) => setTransitions({ type: e.target.value })}
              className="input"
            >
              <option value="fade">페이드</option>
              <option value="slide">슬라이드</option>
              <option value="kenburns">Ken Burns</option>
              <option value="cut">컷</option>
            </select>
          </Field>
          <Field label="전환 시간 (ms)">
            <input
              type="number"
              value={transitions.durationMs ?? 500}
              onChange={(e) => setTransitions({ durationMs: Number(e.target.value) })}
              className="input"
            />
          </Field>
        </div>
      </Section>

      {/* 자막 */}
      <Section title="💬 자막 설정">
        <div className="grid grid-cols-3 gap-3">
          <Field label="폰트 크기 (px)">
            <input
              type="number"
              value={subs.fontSize ?? 28}
              onChange={(e) => setSubs({ fontSize: Number(e.target.value) })}
              className="input"
            />
          </Field>
          <Field label="색상">
            <input
              type="color"
              value={(subs.color as string) ?? '#ffffff'}
              onChange={(e) => setSubs({ color: e.target.value })}
              className="input h-10 p-1"
            />
          </Field>
          <Field label="위치">
            <select
              value={subs.position ?? 'bottom'}
              onChange={(e) => setSubs({ position: e.target.value as 'top' | 'bottom' })}
              className="input"
            >
              <option value="top">상단</option>
              <option value="bottom">하단</option>
            </select>
          </Field>
        </div>
      </Section>

      {/* BGM */}
      <Section title="🎵 BGM 설정">
        <Field label="BGM URL (선택, 비워두면 manifest.bgmUrl 사용)">
          <input
            value={(bgm.url as string) ?? ''}
            onChange={(e) => setBgm({ url: e.target.value || undefined })}
            placeholder={manifest.bgmUrl ?? '예: https://r2.example.com/bgm.mp3'}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={`볼륨 (${(bgm.volume ?? 0.5).toFixed(2)})`}>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={bgm.volume ?? 0.5}
              onChange={(e) => setBgm({ volume: Number(e.target.value) })}
              className="w-full"
            />
          </Field>
          <Field label="반복">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bgm.loop ?? true}
                onChange={(e) => setBgm({ loop: e.target.checked })}
                className="w-4 h-4"
              />
              <span className="text-sm font-bold">
                {(bgm.loop ?? true) ? '🔁 반복 재생' : '한 번만'}
              </span>
            </label>
          </Field>
        </div>
      </Section>

      {/* 렌더 결과 */}
      <Section title={`🎞️ 렌더 결과 (${renders?.length ?? 0})`}>
        <div className="text-xs text-ink-500 font-bold mb-3 leading-relaxed">
          ℹ️ 렌더는 다음 sprint(3b-7b)에서 구현됩니다. 현재는 마이그된 기존 렌더 결과만 목록 표시.
        </div>
        {renders && renders.length > 0 ? (
          <div className="space-y-2">
            {renders.map((r, i) => (
              <RenderRow key={i} render={r} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-ink-300 font-bold py-2">렌더 결과 없음</p>
        )}
      </Section>

      <style>{`
        .input {
          width: 100%;
          padding: 0.5rem 0.75rem;
          background: white;
          border: 1px solid var(--ink-200, #e2e8f0);
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: var(--ink-900, #0f172a);
          font-family: inherit;
        }
        .input:focus { outline: 2px solid var(--coral-400, #ff7e5f); outline-offset: -1px; }
      `}</style>
    </div>
  );
}

function RenderRow({ render }: { render: import('@tangobook/shared').AudiobookRenderV2 }) {
  return (
    <div className="border border-ink-100 rounded-md p-3 flex items-center gap-3">
      {render.thumbnailUrl && (
        <img src={render.thumbnailUrl} alt="thumb" className="w-24 h-16 object-cover rounded-md" />
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-1.5 py-0.5 bg-peach-100 rounded font-bold">{render.level}</span>
          <span className="px-1.5 py-0.5 bg-peach-100 rounded font-bold">{render.language}</span>
          <span className="px-1.5 py-0.5 bg-peach-100 rounded font-bold">{render.style}</span>
        </div>
        <p className="text-[11px] text-ink-500 mt-1 truncate">
          {new Date(render.renderedAt).toLocaleString('ko-KR')}
          {render.youtubeVideoId && (
            <span className="ml-2 text-coral-500">📺 YouTube {render.youtubeVideoId}</span>
          )}
        </p>
      </div>
      {render.videoUrl && (
        <a
          href={render.videoUrl}
          target="_blank"
          rel="noreferrer"
          className="text-xs text-coral-500 font-bold hover:underline shrink-0"
        >
          ▶ 영상
        </a>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: import('react').ReactNode }) {
  return (
    <section className="bg-white rounded-md p-5 shadow-soft space-y-3">
      <h2 className="text-sm font-black text-ink-900 font-display">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: import('react').ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] font-black text-ink-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

function Centered({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md p-8 text-center shadow-soft">
      {children}
    </div>
  );
}

function ErrorBox({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
      {children}
    </div>
  );
}
