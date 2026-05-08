import type { Storybook, LongformProject } from '@tangobook/shared';
import { useState, useMemo, useEffect } from 'react';
import { useEditorLang } from '@/contexts/EditorLangContext';
import { groupLongformByStyle } from '../lib/group-by-style';
import { liftSubMasters } from '../lib/migrate-longform';
import { LongformProjectGroup } from './LongformProjectGroup';
import { AddLongformProjectModal } from './AddLongformProjectModal';

interface Props {
  storybook: Storybook;
  onUpdate: (updater: (draft: Storybook) => void) => void;
  onSave: () => void;
}

function makeProject(name: string, lang: string, artStyle?: string): Omit<LongformProject, 'id'> {
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

/** 같은 그림체 다른 언어 master 의 비디오 클립/SFX/타이밍 share, 텍스트 종속만 비움 */
function cloneScenesForNewLang(
  src: LongformProject['scenes'],
  langChanged: boolean
): LongformProject['scenes'] {
  return (src ?? []).map((s) => ({
    ...s,
    id: crypto.randomUUID(),
    trimStart: undefined,
    trimEnd: undefined,
    sfxOffset: undefined,
    ttsOffset: undefined,
    ttsUrl: langChanged ? undefined : s.ttsUrl,
    ttsDuration: langChanged ? undefined : s.ttsDuration,
    subtitles: langChanged ? [] : s.subtitles.map((sub) => ({ ...sub, id: crypto.randomUUID() })),
  }));
}

export function LongformVideoTab({ storybook, onUpdate, onSave }: Props) {
  const externalLang = useEditorLang();
  const externalStyle = storybook.artStyle;

  const allProjects = storybook.longformProjects ?? [];
  const groups = useMemo(() => groupLongformByStyle(storybook), [storybook]);

  // 활성 cell (외부 chip 으로부터 derive)
  const activeStyle = externalStyle ?? groups.find((g) => !g.isEmpty)?.artStyle ?? null;
  const activeLang = externalLang ?? 'ko';
  const activeProject =
    activeStyle != null
      ? (groups.find((g) => g.artStyle === activeStyle)?.byLanguage[activeLang] ?? null)
      : null;

  // 펼친 그림체 그룹들 — 사용자 헤더 클릭으로 toggle. 외부 chip 변경 시 그 그림체만 펼침으로 reset.
  const [expandedStyles, setExpandedStyles] = useState<Set<string>>(() =>
    activeStyle ? new Set([activeStyle]) : new Set()
  );
  useEffect(() => {
    setExpandedStyles(activeStyle ? new Set([activeStyle]) : new Set());
  }, [activeStyle]);
  const toggleExpanded = (style: string) => {
    setExpandedStyles((prev) => {
      const next = new Set(prev);
      if (next.has(style)) next.delete(style);
      else next.add(style);
      return next;
    });
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultStyle, setModalDefaultStyle] = useState<string | undefined>(undefined);

  const updateProject = (
    id: string,
    updates: Partial<Omit<LongformProject, 'id'>> | ((proj: LongformProject) => void)
  ) => {
    onUpdate((d) => {
      liftSubMasters(d);
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
    if (!window.confirm(`"${target.name}" 영상을 삭제하시겠습니까?`)) return;
    onUpdate((d) => {
      liftSubMasters(d);
      d.longformProjects = d.longformProjects?.filter((p) => p.id !== id);
    });
    onSave();
  };

  /** 같은 그림체의 다른 언어 cell 만들기 (CTA + langChip "+" 로 호출) */
  const addLanguageCell = (style: string, lang: string) => {
    const id = `lf-${Date.now()}`;
    onUpdate((d) => {
      liftSubMasters(d);
      if (!d.longformProjects) d.longformProjects = [];
      const sameStyle = d.longformProjects.find((p) => p.artStyle === style);
      const baseName = sameStyle?.name?.replace(/\s*\([^)]+\)\s*$/, '') ?? '새 동영상';
      const proj: LongformProject = {
        ...makeProject(`${baseName} (${lang})`, lang, style),
        id,
      };
      if (sameStyle) {
        const langChanged = (sameStyle.language ?? 'ko') !== lang;
        proj.scenes = cloneScenesForNewLang(sameStyle.scenes, langChanged);
        proj.bgmUrl = sameStyle.bgmUrl;
        proj.bgmVolume = sameStyle.bgmVolume;
        proj.subtitleStyle = sameStyle.subtitleStyle;
      }
      d.longformProjects.push(proj);
    });
    onSave();
  };

  /** 새 그림체 cell 만들기 (모달 confirm). 언어는 활성 외부 lang 으로. */
  const handleAddMaster = (style: string) => {
    addLanguageCell(style, activeLang);
    setModalOpen(false);
  };

  const openAddModal = (preselectStyle?: string) => {
    setModalDefaultStyle(preselectStyle ?? externalStyle);
    setModalOpen(true);
  };

  // (그림체, activeLang) cell 이미 있는 그림체 = 모달에서 disabled
  const takenStyles = useMemo(
    () => groups.filter((g) => g.byLanguage[activeLang]).map((g) => g.artStyle),
    [groups, activeLang]
  );

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 text-slate-400 dark:text-slate-500">
        <p className="text-sm">먼저 그림체를 등록한 뒤 영상을 만들 수 있어요.</p>
        <p className="text-xs mt-1">/editor2 에서 그림체를 추가하세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">동영상</h2>
          <span className="text-sm text-slate-400 dark:text-slate-500">
            ({allProjects.length}개)
          </span>
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

      {groups.map((g) => (
        <LongformProjectGroup
          key={g.artStyle}
          storybook={storybook}
          storybookId={storybook.id}
          group={g}
          expanded={expandedStyles.has(g.artStyle)}
          onToggle={() => toggleExpanded(g.artStyle)}
          activeLang={activeLang}
          // 펼친 그룹의 본체 = 그 그림체의 (활성 lang) cell. 외부 chip 그림체와 일치 안 해도 OK.
          activeProject={g.byLanguage[activeLang] ?? null}
          onUpdateProject={updateProject}
          onDeleteProject={deleteProject}
          onAddLanguage={(lang) => addLanguageCell(g.artStyle, lang)}
          onAddMaster={() => openAddModal(g.artStyle)}
        />
      ))}

      {modalOpen && (
        <AddLongformProjectModal
          storybook={storybook}
          takenStyles={takenStyles}
          defaultStyle={modalDefaultStyle}
          activeLang={activeLang}
          onClose={() => setModalOpen(false)}
          onConfirm={handleAddMaster}
        />
      )}
    </div>
  );
}
