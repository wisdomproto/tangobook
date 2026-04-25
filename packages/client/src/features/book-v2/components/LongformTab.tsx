import { useState } from 'react';
import { useLongformList, useDeleteLongform } from '../hooks/useLongform';
import { CreateLongformModal } from './CreateLongformModal';
import type { BookManifest, LongformProjectV2 } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface LongformTabProps {
  manifest: BookManifest;
}

export function LongformTab({ manifest }: LongformTabProps) {
  const { data: projects, isLoading } = useLongformList(manifest.id);
  const remove = useDeleteLongform(manifest.id);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const handleDelete = (id: string) => {
    if (!window.confirm('이 동영상 프로젝트를 삭제할까요?')) return;
    remove.mutate(id);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div className="bg-white rounded-md p-4 shadow-soft flex items-center justify-between">
        <div>
          <h2 className="text-sm font-black text-ink-900 font-display">🎬 동영상 프로젝트</h2>
          <p className="text-xs text-ink-500 font-bold mt-0.5">
            {isLoading ? '로딩...' : `총 ${projects?.length ?? 0}개`}
          </p>
        </div>
        <button
          onClick={() => setCreateOpen(true)}
          className="px-4 py-2 rounded-md font-black text-sm bg-coral-500 text-white shadow-pop hover:brightness-110"
        >
          + 새 동영상 만들기
        </button>
      </div>

      <CreateLongformModal
        manifest={manifest}
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />

      {remove.isError && <ErrorBox>삭제 실패: {(remove.error as Error).message}</ErrorBox>}

      {!isLoading && projects && projects.length === 0 && (
        <div className="bg-peach-50 rounded-md p-6 text-center text-sm text-ink-700 font-bold">
          아직 프로젝트가 없습니다. "+ 새 동영상 만들기"로 시작하세요.
          <br />
          <span className="text-xs text-ink-500 font-bold">
            텍스트 슬라이스의 페이지 수만큼 빈 scene이 자동 생성됩니다.
          </span>
        </div>
      )}

      {projects?.map((p) => (
        <ProjectCard
          key={p.id}
          project={p}
          open={openProjectId === p.id}
          onToggle={() => setOpenProjectId(openProjectId === p.id ? null : p.id)}
          onDelete={() => handleDelete(p.id)}
        />
      ))}

      <div className="bg-peach-50 rounded-md p-4 text-xs text-ink-700 font-bold leading-relaxed">
        💡 <strong>다음 sprint 기능</strong>:
        <ul className="list-disc list-inside mt-2 space-y-1 font-normal">
          <li>3b-7c-ii — Analyze (Gemini로 페이지별 videoPrompt 생성)</li>
          <li>3b-7c-iii — Generate clips (Grok image-to-video)</li>
          <li>3b-7c-iv — Timeline editor (trim/SFX/TTS/subtitle)</li>
          <li>3b-7c-v — 실 렌더 + YouTube 업로드</li>
        </ul>
      </div>
    </div>
  );
}

function ProjectCard({
  project,
  open,
  onToggle,
  onDelete,
}: {
  project: LongformProjectV2;
  open: boolean;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const totalScenes = project.scenes.length;
  const withClip = project.scenes.filter((s) => s.clipUrl).length;
  const withTts = project.scenes.filter((s) => s.ttsUrl).length;
  const withPrompt = project.scenes.filter((s) => s.videoPrompt && s.videoPrompt.length > 0).length;

  return (
    <div className="bg-white rounded-md shadow-soft overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-cream-50 text-left"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded bg-coral-100 text-coral-700 font-mono font-black text-[11px]">
              {project.level}
            </span>
            <span className="px-2 py-0.5 rounded bg-peach-100 text-coral-600 font-mono font-bold text-[11px]">
              {project.language}
            </span>
            <span className="px-2 py-0.5 rounded bg-cream-100 text-ink-700 font-mono font-bold text-[11px]">
              🎨 {project.style}
            </span>
            {project.parentProjectId && (
              <span className="px-1.5 py-0.5 bg-peach-100 rounded text-coral-600 text-[10px] font-bold">
                ↳ master {project.parentProjectId.slice(-6)}
              </span>
            )}
          </div>
          <div className="text-[11px] text-ink-500 font-bold mt-1.5 truncate">
            {project.id} · {new Date(project.createdAt).toLocaleString('ko-KR')}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold shrink-0">
          <Badge label={`${withPrompt}/${totalScenes}`} hint="프롬프트" />
          <Badge label={`${withClip}/${totalScenes}`} hint="클립" />
          <Badge label={`${withTts}/${totalScenes}`} hint="TTS" />
          {project.videoUrl && <span className="text-success">✓ 렌더</span>}
          {project.youtubeVideoId && <span className="text-coral-600">📺 YT</span>}
          <span className="text-ink-300">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="border-t border-ink-100 p-4 space-y-3 bg-cream-50">
          <div className="text-xs font-bold text-ink-700">씬 (총 {totalScenes})</div>
          <div className="grid grid-cols-1 gap-1.5">
            {project.scenes.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-2 text-xs bg-white rounded px-3 py-2"
              >
                <span className="font-mono w-12 text-ink-500">p{s.pageNumber}</span>
                <span className="flex-1 truncate text-ink-700">
                  {s.videoPrompt || <span className="text-ink-300 italic">(프롬프트 없음)</span>}
                </span>
                <span className="font-mono text-[10px] text-ink-500">
                  {s.clipUrl ? '🎬' : '⬜'} {s.ttsUrl ? '🔊' : '⬜'} {s.sfxUrl ? '🎵' : '⬜'}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-end pt-2">
            <button
              onClick={onDelete}
              className="px-3 py-1.5 rounded-md bg-danger/10 text-danger font-bold text-xs hover:bg-danger/20"
            >
              🗑️ 삭제
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Badge({ label, hint }: { label: string; hint: string }) {
  return (
    <span className="inline-flex flex-col items-center">
      <span className="font-mono text-[11px] text-ink-700">{label}</span>
      <span className="text-[9px] text-ink-500 uppercase tracking-wider">{hint}</span>
    </span>
  );
}

function ErrorBox({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="bg-danger/10 border border-danger/30 rounded-md p-3 text-sm text-danger font-bold">
      {children}
    </div>
  );
}
