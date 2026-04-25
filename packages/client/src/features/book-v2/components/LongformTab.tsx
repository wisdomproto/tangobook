import { useState } from 'react';
import { useLongformList, useCreateLongform, useDeleteLongform } from '../hooks/useLongform';
import type { BookManifest, LongformProjectV2, ReadingLevel } from '@tangobook/shared';
import { cn } from '@/lib/cn';

interface LongformTabProps {
  manifest: BookManifest;
  level: ReadingLevel | null;
  language: string;
  style: string | null;
}

export function LongformTab({ manifest, level, language, style }: LongformTabProps) {
  if (!level || !style) {
    return (
      <Centered>
        ⚠️ 동영상 탭은 레벨·언어·그림체가 모두 필요합니다.
        <br />
        usedVariants에 최소 1개씩 추가하세요.
      </Centered>
    );
  }

  return <LongformTabBody manifest={manifest} level={level} language={language} style={style} />;
}

function LongformTabBody({
  manifest,
  level,
  language,
  style,
}: {
  manifest: BookManifest;
  level: ReadingLevel;
  language: string;
  style: string;
}) {
  const filter = { level, language, style };
  const { data: projects, isLoading } = useLongformList(manifest.id, filter);
  const create = useCreateLongform(manifest.id);
  const remove = useDeleteLongform(manifest.id);
  const [openProjectId, setOpenProjectId] = useState<string | null>(null);

  const handleCreate = () => {
    create.mutate(filter);
  };

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
            {level} / {language} / {style} · {isLoading ? '로딩...' : `${projects?.length ?? 0}개`}
          </p>
        </div>
        <button
          onClick={handleCreate}
          disabled={create.isPending}
          className={cn(
            'px-4 py-2 rounded-md font-black text-sm transition-all',
            create.isPending
              ? 'bg-ink-100 text-ink-300 cursor-not-allowed'
              : 'bg-coral-500 text-white shadow-pop hover:brightness-110'
          )}
        >
          {create.isPending ? '생성 중...' : '+ 새 프로젝트'}
        </button>
      </div>

      {create.isError && <ErrorBox>생성 실패: {(create.error as Error).message}</ErrorBox>}
      {remove.isError && <ErrorBox>삭제 실패: {(remove.error as Error).message}</ErrorBox>}

      {!isLoading && projects && projects.length === 0 && (
        <div className="bg-peach-50 rounded-md p-6 text-center text-sm text-ink-700 font-bold">
          아직 프로젝트가 없습니다. "+ 새 프로젝트"로 시작하세요.
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
        className="w-full p-4 flex items-center justify-between hover:bg-cream-50"
      >
        <div className="text-left">
          <div className="text-sm font-black text-ink-900">{project.id}</div>
          <div className="text-xs text-ink-500 font-bold mt-0.5">
            {new Date(project.createdAt).toLocaleString('ko-KR')}
            {project.parentProjectId && (
              <span className="ml-2 px-1.5 py-0.5 bg-peach-100 rounded text-coral-600">
                ↳ master {project.parentProjectId.slice(-6)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs font-bold">
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

function Centered({ children }: { children: import('react').ReactNode }) {
  return (
    <div className="max-w-3xl mx-auto bg-white rounded-md p-8 text-center shadow-soft text-sm text-ink-700 font-bold">
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
