import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState, useMemo, useEffect } from 'react';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { groupLongformByStyle } from '../lib/group-by-style';
import { LongformProjectGroup } from './LongformProjectGroup';
import { AddLongformProjectModal } from './AddLongformProjectModal';

interface LongformVideoTabProps {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeDefaultProject(
  name: string,
  lang: string,
  artStyle?: string
): Omit<LongformProject, 'id'> {
  return {
    name,
    aspectRatio: '16:9',
    language: lang,
    artStyle,
    scenes: [],
    bgmVolume: 30,
    subtitleStyle: {
      fontSize: 44,
      position: 'bottom',
      textColor: '#ffffff',
      outlineColor: '#000000',
      bgColor: '#00000080',
    },
  };
}

export function LongformVideoTab({ storybook, onUpdate, onSave }: LongformVideoTabProps) {
  const externalLang = useEditorLang();
  const externalStyle = storybook.artStyle; // /editor2 외부 chip swap 시 storybook.artStyle 갱신됨

  const allProjects = storybook.longformProjects ?? [];
  const groups = useMemo(() => groupLongformByStyle(storybook), [storybook]);
  const takenStyles = useMemo(
    () => groups.filter((g) => g.masters.length > 0).map((g) => g.artStyle),
    [groups]
  );

  // 활성 project (master 또는 version)
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStyle, setModalDefaultStyle] = useState<string | undefined>(undefined);

  // 첫 active 자동 — 외부 chip 활성 그림체의 master 우선 → 첫 비어있지 않은 그룹의 master
  useEffect(() => {
    if (activeProjectId) return;
    const targetGroup =
      groups.find((g) => !g.isEmpty && g.artStyle === externalStyle) ??
      groups.find((g) => !g.isEmpty);
    if (targetGroup?.masters[0]) setActiveProjectId(targetGroup.masters[0].id);
  }, [groups, externalStyle, activeProjectId]);

  // 외부 lang 변경 시 활성 master 의 매칭 version 자동 선택
  useEffect(() => {
    if (!externalLang || !activeProjectId) return;
    const cur = allProjects.find((p) => p.id === activeProjectId);
    if (!cur) return;
    const masterId = cur.parentProjectId ?? cur.id;
    const master = allProjects.find((p) => p.id === masterId);
    if (!master) return;
    const versions = [master, ...allProjects.filter((p) => p.parentProjectId === masterId)];
    const match = versions.find((v) => (v.language ?? 'ko') === externalLang);
    if (match && match.id !== activeProjectId) setActiveProjectId(match.id);
  }, [externalLang, activeProjectId, allProjects]);

  // 활성 project 가 삭제되면 null 처리
  useEffect(() => {
    if (activeProjectId && !allProjects.some((p) => p.id === activeProjectId)) {
      setActiveProjectId(null);
    }
  }, [allProjects, activeProjectId]);

  const updateProject = (
    id: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => {
    onUpdate((d) => {
      const p = d.longformProjects?.find((x) => x.id === id);
      if (!p) return;
      if (typeof updates === 'function') {
        updates(p);
      } else {
        for (const [k, v] of Object.entries(updates)) {
          if (v === undefined) delete (p as unknown as Record<string, unknown>)[k];
          else (p as unknown as Record<string, unknown>)[k] = v;
        }
      }
    });
    onSave();
  };

  const deleteProject = (id: string) => {
    const target = allProjects.find((p) => p.id === id);
    if (!target) return;
    const isVersion = !!target.parentProjectId;
    const msg = isVersion
      ? `"${target.name}" 버전을 삭제하시겠습니까?`
      : `"${target.name}" 영상과 모든 버전이 삭제됩니다. 진행할까요?`;
    if (!window.confirm(msg)) return;
    onUpdate((d) => {
      d.longformProjects = d.longformProjects?.filter((p) =>
        isVersion ? p.id !== id : p.id !== id && p.parentProjectId !== id
      );
    });
    onSave();
    if (activeProjectId === id) setActiveProjectId(null);
  };

  const addVersion = (masterId: string, overrideLang?: string) => {
    const master = allProjects.find((p) => p.id === masterId);
    if (!master) return;
    const newId = `lf-${Date.now()}`;
    const targetLang = overrideLang ?? externalLang ?? master.language ?? 'ko';
    const langChanged = targetLang !== (master.language ?? 'ko');
    const baseName = (master.name ?? '새 동영상').replace(/\s*\([^)]+\)\s*$/, '');
    onUpdate((d) => {
      if (!d.longformProjects) d.longformProjects = [];
      const m = d.longformProjects.find((p) => p.id === masterId);
      if (!m) return;
      // 마이그: 기존 master 가 artStyle 미지정이면 그 시점의 swap 활성 그림체로 채움
      if (!m.artStyle) {
        m.artStyle = d.artStyle ?? d.availableStyles?.[0];
        // 같은 master 의 자식 versions 도 함께 채움 (그룹 단절 방지)
        for (const v of d.longformProjects ?? []) {
          if (v.parentProjectId === masterId && !v.artStyle) {
            v.artStyle = m.artStyle;
          }
        }
      }
      const clone = structuredClone(m);
      clone.id = newId;
      clone.parentProjectId = masterId;
      clone.language = targetLang;
      clone.artStyle = m.artStyle;
      clone.name = `${baseName} (${targetLang})`;
      clone.outputUrl = undefined;
      clone.youtubeUpload = undefined;
      clone.createdAt = undefined;
      clone.scenes = (clone.scenes ?? []).map((s) => ({
        ...s,
        id: crypto.randomUUID(),
        trimStart: undefined,
        trimEnd: undefined,
        sfxOffset: undefined,
        ttsOffset: undefined,
        ttsUrl: langChanged ? undefined : s.ttsUrl,
        ttsDuration: langChanged ? undefined : s.ttsDuration,
        subtitles: langChanged
          ? []
          : s.subtitles.map((sub) => ({ ...sub, id: crypto.randomUUID() })),
      }));
      d.longformProjects.push(clone);
    });
    onSave();
    setActiveProjectId(newId);
  };

  const openAddModal = (preselectStyle?: string) => {
    setModalDefaultStyle(preselectStyle ?? externalStyle);
    setModalOpen(true);
  };

  const handleAddMaster = (artStyle: string, lang: string, name: string) => {
    const id = `lf-${Date.now()}`;
    onUpdate((d) => {
      if (!d.longformProjects) d.longformProjects = [];
      d.longformProjects.push({ ...makeDefaultProject(name, lang, artStyle), id });
    });
    onSave();
    setActiveProjectId(id);
    setModalOpen(false);
  };

  const totalProjects = allProjects.length;

  // 영상 0개 + 그림체도 없는 케이스 → empty state
  if (totalProjects === 0 && groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-sm">먼저 그림체를 등록한 뒤 영상을 만들 수 있어요.</p>
        <p className="text-xs mt-1">/editor2 에서 그림체를 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* 상단: 제목 + 새 동영상 버튼 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">동영상</h2>
          <span className="text-sm text-slate-400 dark:text-slate-500">({totalProjects}개)</span>
        </div>
        <button
          onClick={() => openAddModal()}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white text-sm rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          새 동영상
        </button>
      </div>

      {/* 그림체 그룹들 */}
      {groups.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
          <p className="text-sm">동영상이 아직 없어요.</p>
          <button
            onClick={() => openAddModal()}
            className="mt-2 text-violet-600 hover:text-violet-700 text-sm underline"
          >
            첫 동영상 만들기
          </button>
        </div>
      ) : (
        groups.map((g) => (
          <LongformProjectGroup
            key={g.artStyle}
            storybook={storybook}
            storybookId={storybook.id}
            group={g}
            defaultExpanded={
              // 영상 있는 그룹은 항상 펼침 + 외부 chip 활성 그림체 그룹도 펼침
              !g.isEmpty || g.artStyle === externalStyle
            }
            externalLang={externalLang}
            activeProjectId={activeProjectId}
            onSelectProject={setActiveProjectId}
            onUpdateProject={updateProject}
            onDeleteProject={deleteProject}
            onAddVersion={addVersion}
            onAddMaster={(style) => openAddModal(style)}
          />
        ))
      )}

      {modalOpen && (
        <AddLongformProjectModal
          storybook={storybook}
          takenStyles={takenStyles}
          defaultStyle={modalDefaultStyle}
          defaultLang={externalLang ?? 'ko'}
          onClose={() => setModalOpen(false)}
          onConfirm={handleAddMaster}
        />
      )}
    </div>
  );
}
